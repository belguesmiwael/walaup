import { NextResponse } from 'next/server'

// ─── Pages login de chaque app (publiques — toujours laisser passer) ────────
const APP_LOGINS = [
  '/apps/medical/login',
  // '/apps/caisse/login',
  // '/apps/salon/login',
]

// ─── Routes des apps (protégées côté client dans chaque page) ───────────────
// Le middleware ne valide PAS la session (Supabase = localStorage, pas cookie)
// Chaque page fait son propre auth check via supabase.auth.getUser()
// Le middleware sert uniquement à router vers le bon login si accès direct

const APP_ROUTES = [
  { prefix: '/apps/medical', login: '/apps/medical/login' },
  // { prefix: '/apps/caisse', login: '/apps/caisse/login' },
]

// ─── Routes Walaup ───────────────────────────────────────────────────────────
const WALAUP_ROUTES = ['/admin', '/client']

export function middleware(request) {
  const { pathname } = request.nextUrl

  // Pages login des apps → toujours publiques
  if (APP_LOGINS.some(l => pathname === l)) {
    return NextResponse.next()
  }

  // Routes d'une app → laisser passer (la page gère l'auth elle-même)
  const appRoute = APP_ROUTES.find(r => pathname.startsWith(r.prefix))
  if (appRoute) {
    return NextResponse.next()
  }

  // Routes Walaup → laisser passer (les pages gèrent l'auth)
  if (WALAUP_ROUTES.some(r => pathname.startsWith(r))) {
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/client/:path*', '/apps/:path*']
}
