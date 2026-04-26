import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Routes protégées par rôle
const PROTECTED = {
  '/apps/medical/doctor':    ['tenant_admin', 'super_admin'],
  '/apps/medical/secretary': ['tenant_user',  'tenant_admin', 'super_admin'],
  '/apps/medical/patient':   ['app_end_user', 'tenant_admin', 'super_admin'],
  '/admin':                  ['super_admin'],
  '/client':                 ['super_admin', 'tenant_admin', 'tenant_user', 'app_end_user'],
}

export async function middleware(request) {
  const { pathname } = request.nextUrl

  // Trouver la route protégée correspondante
  const protectedEntry = Object.entries(PROTECTED).find(([route]) =>
    pathname.startsWith(route)
  )

  // Route publique — laisser passer
  if (!protectedEntry) return NextResponse.next()

  const [, allowedRoles] = protectedEntry

  // Récupérer le token depuis le cookie Supabase
  const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const authToken    = request.cookies.get('sb-access-token')?.value
    || request.cookies.get(`sb-${supabaseUrl?.split('//')[1]?.split('.')[0]}-auth-token`)?.value

  if (!authToken) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${authToken}` } }
    })

    const { data: { user }, error } = await supabase.auth.getUser(authToken)
    if (error || !user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Lire le rôle depuis public.users
    const { data: userData } = await supabase
      .from('users')
      .select('role, tenant_id, app_type')
      .eq('id', user.id)
      .maybeSingle()

    const role = userData?.role || 'app_end_user'

    if (!allowedRoles.includes(role)) {
      // Rediriger vers la bonne page selon rôle
      const redirectMap = {
        super_admin:   '/admin',
        tenant_admin:  '/apps/medical/doctor',
        tenant_user:   '/apps/medical/secretary',
        app_end_user:  '/apps/medical/patient',
      }
      return NextResponse.redirect(new URL(redirectMap[role] || '/login', request.url))
    }

    return NextResponse.next()
  } catch {
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/client/:path*',
    '/apps/:path*',
  ]
}
