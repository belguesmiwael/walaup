'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'

const NAV_LINKS = [
  { href: '/#problems',     label: 'Pourquoi nous' },
  { href: '/#solutions',    label: 'Solutions' },
  { href: '/#how',          label: 'Comment ça marche' },
  { href: '/#testimonials', label: 'Avis clients' },
  { href: '/#packs',        label: 'Nos packs' },
]

export default function Navbar() {
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const handleScroll = useCallback(() => {
    setScrolled(window.scrollY > 24)
  }, [])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  // Close mobile menu on route change
  useEffect(() => { setMenuOpen(false) }, [pathname])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  const playClick = () => {
    if (typeof window !== 'undefined' && window.WalaupSound) {
      window.WalaupSound.tab()
    }
  }

  return (
    <>
      <nav className={`navbar${scrolled ? ' navbar--scrolled' : ''}`} role="navigation" aria-label="Navigation principale">
        <div className="navbar__inner">

          {/* Brand */}
          <Link href="/" className="brand-wordmark" aria-label="Walaup — Accueil">
            Walaup<span className="brand-dot">.</span>
          </Link>

          {/* Desktop nav links */}
          <ul className="nav-links" role="list">
            {NAV_LINKS.map(link => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="nav-link"
                  onClick={playClick}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Desktop actions */}
          <div className="nav-actions">
            <Link href="/client" className="btn btn-ghost btn-sm" onClick={playClick}>
              Se connecter
            </Link>
            <Link href="/#contact" className="btn btn-primary btn-sm btn-magnetic" onClick={playClick}>
              Créer mon app
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className={`nav-hamburger${menuOpen ? ' open' : ''}`}
            onClick={() => setMenuOpen(prev => !prev)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <div
        id="mobile-menu"
        className={`nav-mobile-menu${menuOpen ? ' open' : ''}`}
        aria-hidden={!menuOpen}
        role="dialog"
        aria-label="Menu mobile"
      >
        {NAV_LINKS.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className="nav-link"
            onClick={() => { setMenuOpen(false); playClick() }}
          >
            {link.label}
          </Link>
        ))}

        <div className="nav-actions">
          <Link href="/client" className="btn btn-ghost" onClick={() => { setMenuOpen(false); playClick() }}>
            Se connecter
          </Link>
          <Link href="/#contact" className="btn btn-primary" onClick={() => { setMenuOpen(false); playClick() }}>
            Créer mon app
          </Link>
        </div>
      </div>
    </>
  )
}
