'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { initScrollAnimations, initTiltCards, initMagneticButtons, initCursorGlow, initScrollProgress } from '@/lib/animate'
import { initPWA } from '@/lib/pwa'

/**
 * EffectsClient — Bootstraps all client-side effects after hydration.
 * Renders nothing — purely a side-effect component.
 * Mounted once in the root layout.
 */
export default function EffectsClient() {
  const pathname = usePathname()
  if (pathname?.startsWith('/apps/')) return null

  useEffect(() => {
    // Small rAF delay to ensure DOM is fully painted
    const id = requestAnimationFrame(() => {
      initScrollAnimations()
      initTiltCards()
      initMagneticButtons()
      initCursorGlow()
      initScrollProgress()
      initPWA()
    })
    return () => cancelAnimationFrame(id)
  }, [])

  // Re-init tilt + magnetic on route changes (Next.js doesn't unmount layout)
  useEffect(() => {
    const onRouteChange = () => {
      requestAnimationFrame(() => {
        initTiltCards()
        initMagneticButtons()
        initScrollAnimations()
      })
    }

    window.addEventListener('walaup:route-change', onRouteChange)
    return () => window.removeEventListener('walaup:route-change', onRouteChange)
  }, [])

  return null
}
