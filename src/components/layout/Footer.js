import Link from 'next/link'

const FOOTER_LINKS = {
  'Solutions': [
    { href: '/marketplace', label: 'Explorer la Marketplace' },
    { href: '/#solutions',  label: 'App Café & Restaurant' },
    { href: '/#solutions',  label: 'App Grossiste / Stock' },
    { href: '/#solutions',  label: 'App Suivi Dettes' },
    { href: '/#solutions',  label: 'App sur mesure' },
  ],
  'Plateforme': [
    { href: '/#how',          label: 'Comment ça marche' },
    { href: '/estimateur',    label: 'Estimateur de prix' },
    { href: '/#packs',        label: 'Nos packs' },
    { href: '/#testimonials', label: 'Avis clients' },
  ],
  'Espace client': [
    { href: '/client',        label: 'Mon espace client' },
    { href: '/client#projet', label: 'Suivi de projet' },
    { href: '/client#messages', label: 'Messages' },
    { href: '/client#demos',  label: 'Mes apps' },
  ],
}

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grid">

          {/* Brand column */}
          <div>
            <Link href="/" className="brand-wordmark" style={{ fontSize: '1.2rem' }}>
              Walaup<span className="brand-dot">.</span>
            </Link>
            <p className="footer__brand-desc">
              La première plateforme tunisienne d&apos;apps sur mesure pour les entreprises.
              Démo gratuite, paiement après validation.
            </p>

            {/* Trust badges */}
            <div style={{ marginTop: 'var(--space-6)', display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
              <span className="badge badge-green">🇹🇳 Made in Tunisia</span>
              <span className="badge badge-ac">0 DT avant validation</span>
            </div>
          </div>

          {/* Links columns */}
          {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
            <div key={heading}>
              <h3 className="footer__heading">{heading}</h3>
              <ul className="footer__links" role="list">
                {links.map(link => (
                  <li key={link.label}>
                    <Link href={link.href} className="footer__link">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="footer__bottom">
          <p>© {year} Walaup. Tous droits réservés.</p>
          <p style={{ color: 'var(--tx-3)', fontSize: 'var(--text-xs)' }}>
            Conçu et développé en Tunisie 🇹🇳
          </p>
        </div>
      </div>
    </footer>
  )
}
