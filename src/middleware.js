import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// ─── Config des apps — ajouter une entrée par nouvelle app ─────────────────
const APPS_CONFIG = {
  medical: {
    login: '/apps/medical/login',
    routes: {
      '/apps/medical/doctor':    ['tenant_admin', 'super_admin'],
      '/apps/medical/secretary': ['tenant_user',  'tenant_admin', 'super_admin'],
      '/apps/medical/patient':   ['app_end_user', 'tenant_admin', 'super_admin'],
    },
    redirectByRole: {
      tenant_admin:  '/apps/medical/doctor',
      tenant_user:   '/apps/medical/secretary',
      app_end_user:  '/apps/medical/patient',
      super_admin:   '/admin',
    },
  },
  // caisse: { login: '/apps/caisse/login', routes: { ... }, redirectByRole: { ... } },
  // salon:  { login: '/apps/salon/login',  routes: { ... }, redirectByRole: { ... } },
}

const WALAUP_PROTECTED = {
  '/admin':  ['super_admin'],
  '/client': ['super_admin', 'tenant_admin', 'tenant_user', 'app_end_user'],
}

function getToken(request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const ref = url.split('//')[1]?.split('.')[0] || ''
  return (
    request.cookies.get('sb-access-token')?.value ||
    request.cookies.get(`sb-${ref}-auth-token`)?.value ||
    null
  )
}

async function getUserData(token) {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  )
  const { data: { user }, error } = await sb.auth.getUser(token)
  if (error || !user) return null
  const { data } = await sb.from('users')
    .select('role, tenant_id, app_type, is_active')
    .eq('id', user.id).maybeSingle()
  return data
}

export async function middleware(request) {
  const { pathname } = request.nextUrl

  // Pages login des apps = publiques
  const isAppLogin = Object.values(APPS_CONFIG).some(a => pathname === a.login)
  if (isAppLogin) return NextResponse.next()

  // Trouver l'app correspondante
  let matchedApp = null
  let allowedRoles = null
  for (const [appType, config] of Object.entries(APPS_CONFIG)) {
    for (const [route, roles] of Object.entries(config.routes)) {
      if (pathname.startsWith(route)) {
        matchedApp   = { appType, ...config }
        allowedRoles = roles
        break
      }
    }
    if (matchedApp) break
  }

  // Route d'une app
  if (matchedApp) {
    const token = getToken(request)
    if (!token) return NextResponse.redirect(new URL(matchedApp.login, request.url))

    try {
      const userData = await getUserData(token)
      if (!userData || userData.is_active === false)
        return NextResponse.redirect(new URL(matchedApp.login, request.url))

      if (userData.app_type !== matchedApp.appType && userData.role !== 'super_admin')
        return NextResponse.redirect(new URL(matchedApp.login, request.url))

      if (!allowedRoles.includes(userData.role)) {
        const redirect = matchedApp.redirectByRole[userData.role] || matchedApp.login
        return NextResponse.redirect(new URL(redirect, request.url))
      }

      return NextResponse.next()
    } catch {
      return NextResponse.redirect(new URL(matchedApp.login, request.url))
    }
  }

  // Routes Walaup (/admin, /client)
  const walaupEntry = Object.entries(WALAUP_PROTECTED).find(([r]) => pathname.startsWith(r))
  if (walaupEntry) {
    const [, roles] = walaupEntry
    const token = getToken(request)
    if (!token) return NextResponse.redirect(new URL('/login', request.url))

    try {
      const userData = await getUserData(token)
      if (!userData) return NextResponse.redirect(new URL('/login', request.url))
      if (!roles.includes(userData.role)) {
        if (userData.app_type && APPS_CONFIG[userData.app_type]) {
          const r = APPS_CONFIG[userData.app_type].redirectByRole[userData.role]
          return NextResponse.redirect(new URL(r || '/login', request.url))
        }
        return NextResponse.redirect(new URL('/login', request.url))
      }
      return NextResponse.next()
    } catch {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/client/:path*', '/apps/:path*']
}
