'use client'
import { CheckCircle2, AlertTriangle, Package } from 'lucide-react'

const PACK_META = {
  essentiel:  { color: '#22D3EE', label: 'Essentiel',   icon: '⚡', features: ['App sur mesure', 'Support email', 'Démo gratuite incluse', 'Accès 1 an renouvelable'] },
  pro:        { color: '#6366F1', label: 'Pro ⭐',        icon: '🔥', features: ['App 100% personnalisée', 'Dashboard analytique avancé', 'Support prioritaire', 'Mises à jour illimitées', 'Option monétisation marketplace'] },
  partenaire: { color: '#F59E0B', label: 'Partenaire',  icon: '🤝', features: ['Licence à vie', 'Publication sur marketplace', 'Revenus passifs (60% pour vous)', 'Accompagnement business', 'Support dédié'] },
}

const CSS_ABN = `
  .ta-heading { font-family:var(--font-display); font-size:1.3rem; font-weight:800; color:var(--tx); margin-bottom:20px; }
  .ta-card { background:rgba(13,17,32,.62); border:1px solid rgba(255,255,255,.07); border-radius:18px; padding:22px; margin-bottom:16px; backdrop-filter:blur(14px); }
  .ta-pack-tag { display:inline-flex; align-items:center; gap:6px; padding:5px 13px; border-radius:20px; font-size:12px; font-weight:700; margin-bottom:14px; letter-spacing:.02em; }
  .ta-row { display:flex; justify-content:space-between; align-items:center; padding:9px 0; border-bottom:1px solid rgba(255,255,255,.04); }
  .ta-row:last-child { border-bottom:none; }
  .ta-row-label { font-size:13px; color:var(--tx-3); }
  .ta-row-val { font-size:13px; color:var(--tx); font-weight:500; font-family:var(--font-mono); }
  .ta-feature { display:flex; align-items:center; gap:9px; margin-bottom:9px; font-size:13px; color:var(--tx-2); line-height:1.4; }
  .ta-empty { text-align:center; padding:48px 20px; color:var(--tx-3); }
  .ta-section-label { font-size:11.5px; font-weight:700; color:var(--tx-3); text-transform:uppercase; letter-spacing:.06em; margin-bottom:14px; }
`

export function TabAbonnement({ lead }) {
  const pack = lead?.pack?.toLowerCase() || null
  const meta = pack ? PACK_META[pack] : null

  const statusOk = lead && ['payment_confirmed', 'delivered'].includes(lead.status)
  const confirmedAt = lead?.pay_confirmed_at
    ? (lead.pay_confirmed_at.seconds
        ? new Date(lead.pay_confirmed_at.seconds * 1000)
        : new Date(lead.pay_confirmed_at))
    : null

  return (
    <>
      <style>{CSS_ABN}</style>
      <h2 className="ta-heading">Mon Abonnement</h2>

      {!meta ? (
        <div className="ta-empty">
          <Package size={32} color="var(--tx-3)" style={{ marginBottom: 12 }} />
          <h3 style={{ color: 'var(--tx)', marginBottom: 8, fontSize: 15 }}>Aucun abonnement actif</h3>
          <p style={{ fontSize: 13, lineHeight: 1.6 }}>Votre abonnement apparaîtra ici après validation de votre projet.</p>
        </div>
      ) : (
        <>
          <div className="ta-card" style={{ borderColor: `${meta.color}22` }}>
            <span className="ta-pack-tag" style={{ background: `${meta.color}15`, color: meta.color, border: `1px solid ${meta.color}28` }}>
              {meta.icon} Pack {meta.label}
            </span>
            <div className="ta-row">
              <span className="ta-row-label">Statut</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: statusOk ? 'var(--green)' : 'var(--yellow)' }}>
                {statusOk ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                {statusOk ? 'Actif' : 'En attente de paiement'}
              </span>
            </div>
            {lead.pay_amount > 0 && (
              <div className="ta-row">
                <span className="ta-row-label">Montant payé</span>
                <span className="ta-row-val">{lead.pay_amount} DT</span>
              </div>
            )}
            {lead.pay_method && (
              <div className="ta-row">
                <span className="ta-row-label">Méthode</span>
                <span className="ta-row-val" style={{ textTransform: 'capitalize', fontFamily: 'var(--font-body)' }}>{lead.pay_method}</span>
              </div>
            )}
            {confirmedAt && (
              <div className="ta-row">
                <span className="ta-row-label">Date de paiement</span>
                <span className="ta-row-val" style={{ fontFamily: 'var(--font-body)' }}>
                  {confirmedAt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
            )}
          </div>

          <div className="ta-card">
            <p className="ta-section-label">Ce que votre pack inclut</p>
            {meta.features.map(f => (
              <div key={f} className="ta-feature">
                <CheckCircle2 size={14} color="var(--green)" strokeWidth={2.2} style={{ flexShrink: 0 }} />
                {f}
              </div>
            ))}
          </div>
        </>
      )}
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TabPaiements
// ─────────────────────────────────────────────────────────────────────────────
import { CreditCard, CheckCircle2 as Check2 } from 'lucide-react'

const CSS_PAY = `
  .tpay-heading { font-family:var(--font-display); font-size:1.3rem; font-weight:800; color:var(--tx); margin-bottom:20px; }
  .tpay-card { background:rgba(13,17,32,.62); border:1px solid rgba(255,255,255,.07); border-radius:18px; overflow:hidden; backdrop-filter:blur(14px); }
  .tpay-table { width:100%; border-collapse:collapse; }
  .tpay-table th { font-size:11px; font-weight:600; color:var(--tx-3); text-transform:uppercase; letter-spacing:.05em; padding:12px 16px; text-align:left; border-bottom:1px solid rgba(255,255,255,.06); white-space:nowrap; }
  .tpay-table td { padding:13px 16px; font-size:13px; color:var(--tx-2); border-bottom:1px solid rgba(255,255,255,.04); }
  .tpay-table tr:last-child td { border-bottom:none; }
  .tpay-badge { display:inline-flex; align-items:center; gap:5px; padding:3px 10px; border-radius:20px; font-size:11px; font-weight:700; }
  .tpay-empty { text-align:center; padding:44px 20px; color:var(--tx-3); }
  @media (max-width:600px) { .tpay-col-hide { display:none; } }
`

export function TabPaiements({ lead }) {
  const hasPayment = lead && lead.pay_amount > 0 && ['payment_confirmed', 'delivered'].includes(lead.status)

  const payDate = lead?.pay_confirmed_at
    ? (lead.pay_confirmed_at.seconds
        ? new Date(lead.pay_confirmed_at.seconds * 1000)
        : new Date(lead.pay_confirmed_at))
    : null

  return (
    <>
      <style>{CSS_PAY}</style>
      <h2 className="tpay-heading">Mes Paiements</h2>
      <div className="tpay-card">
        {!hasPayment ? (
          <div className="tpay-empty">
            <CreditCard size={30} color="var(--tx-3)" style={{ marginBottom: 12 }} />
            <p style={{ fontSize: 13 }}>Aucun paiement enregistré pour le moment.</p>
          </div>
        ) : (
          <table className="tpay-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th className="tpay-col-hide">Méthode</th>
                <th>Montant</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{payDate ? payDate.toLocaleDateString('fr-FR') : '—'}</td>
                <td style={{ color: 'var(--tx)', fontWeight: 500 }}>
                  Achat Pack {lead.pack ? lead.pack.charAt(0).toUpperCase() + lead.pack.slice(1) : ''}
                </td>
                <td className="tpay-col-hide" style={{ textTransform: 'capitalize' }}>{lead.pay_method || '—'}</td>
                <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--tx)', fontWeight: 600 }}>
                  {lead.pay_amount} DT
                </td>
                <td>
                  <span className="tpay-badge" style={{ background: 'rgba(16,185,129,.12)', color: 'var(--green)', border: '1px solid rgba(16,185,129,.22)' }}>
                    <Check2 size={11} /> Payé
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TabApps
// ─────────────────────────────────────────────────────────────────────────────
import { Smartphone, ExternalLink, Download } from 'lucide-react'

const INSTALL_IOS = [
  'Ouvrez le lien dans Safari (pas Chrome)',
  'Appuyez sur l\'icône Partager ↑ en bas',
  'Sélectionnez « Sur l\'écran d\'accueil »',
  'Confirmez — l\'icône apparaît sur votre écran',
]
const INSTALL_ANDROID = [
  'Ouvrez le lien dans Chrome',
  'Appuyez sur le menu ⋮ en haut à droite',
  'Sélectionnez « Ajouter à l\'écran d\'accueil »',
  'Confirmez — l\'app s\'installe en 5 secondes',
]

const CSS_APPS = `
  .tapp-heading { font-family:var(--font-display); font-size:1.3rem; font-weight:800; color:var(--tx); margin-bottom:20px; }
  .tapp-card { background:rgba(13,17,32,.62); border:1px solid rgba(255,255,255,.07); border-radius:18px; padding:22px; margin-bottom:16px; backdrop-filter:blur(14px); }
  .tapp-app-row { display:flex; align-items:center; gap:14px; margin-bottom:18px; }
  .tapp-app-icon { width:52px; height:52px; min-width:52px; border-radius:16px; display:flex; align-items:center; justify-content:center; }
  .tapp-btn { display:inline-flex; align-items:center; gap:8px; padding:10px 20px; border-radius:12px; font-size:13px; font-weight:700; font-family:var(--font-body); cursor:pointer; border:none; transition:all .22s cubic-bezier(0.16,1,0.3,1); text-decoration:none; }
  .tapp-btn--primary { background:linear-gradient(135deg,var(--ac),var(--ac-2)); color:#fff; box-shadow:0 4px 16px rgba(99,102,241,.28); }
  .tapp-btn:hover { transform:translateY(-1px); filter:brightness(1.08); }
  .tapp-guide-os { font-size:12px; font-weight:700; color:var(--tx-3); margin-bottom:10px; display:block; }
  .tapp-step { display:flex; gap:11px; margin-bottom:10px; }
  .tapp-step-num { width:22px; height:22px; min-width:22px; border-radius:50%; background:rgba(99,102,241,.14); border:1px solid rgba(99,102,241,.24); display:flex; align-items:center; justify-content:center; font-size:10.5px; font-weight:700; color:var(--ac); margin-top:1px; }
  .tapp-step-text { font-size:13px; color:var(--tx-2); line-height:1.55; }
  .tapp-divider { height:1px; background:rgba(255,255,255,.05); margin:16px 0; }
  .tapp-empty { text-align:center; padding:48px 20px; color:var(--tx-3); }
  .tapp-section-label { font-size:11.5px; font-weight:700; color:var(--tx-3); text-transform:uppercase; letter-spacing:.06em; margin-bottom:14px; display:flex; align-items:center; gap:7px; }
`

export function TabApps({ lead }) {
  const delivered = lead?.status === 'delivered'

  return (
    <>
      <style>{CSS_APPS}</style>
      <h2 className="tapp-heading">Mes Apps</h2>

      {!delivered ? (
        <div className="tapp-empty">
          <div style={{ fontSize: 38, marginBottom: 14 }}>📱</div>
          <h3 style={{ color: 'var(--tx)', fontSize: 15, marginBottom: 8 }}>Application en cours de livraison</h3>
          <p style={{ fontSize: 13, lineHeight: 1.6, maxWidth: 280, margin: '0 auto' }}>
            Votre application apparaîtra ici dès qu&apos;elle sera livrée par notre équipe.
          </p>
        </div>
      ) : (
        <>
          {/* App card */}
          <div className="tapp-card" style={{ borderColor: 'rgba(99,102,241,.2)' }}>
            <div className="tapp-app-row">
              <div className="tapp-app-icon" style={{ background: 'rgba(99,102,241,.15)', border: '1px solid rgba(99,102,241,.25)' }}>
                <Smartphone size={24} color="var(--ac)" strokeWidth={1.8} />
              </div>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--tx)', marginBottom: 4 }}>
                  {lead.type || 'Mon Application'}
                </h3>
                <span style={{ fontSize: 12, color: 'var(--green)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} />
                  En ligne
                </span>
              </div>
            </div>
            {lead.app_url && (
              <a href={lead.app_url} target="_blank" rel="noopener noreferrer" className="tapp-btn tapp-btn--primary">
                <ExternalLink size={14} /> Accéder à l&apos;application
              </a>
            )}
          </div>

          {/* PWA install guide */}
          <div className="tapp-card">
            <p className="tapp-section-label">
              <Download size={14} /> Installer sur votre téléphone
            </p>

            <span className="tapp-guide-os">📱 iPhone — Safari</span>
            {INSTALL_IOS.map((step, i) => (
              <div key={i} className="tapp-step">
                <div className="tapp-step-num">{i + 1}</div>
                <div className="tapp-step-text">{step}</div>
              </div>
            ))}

            <div className="tapp-divider" />

            <span className="tapp-guide-os">🤖 Android — Chrome</span>
            {INSTALL_ANDROID.map((step, i) => (
              <div key={i} className="tapp-step">
                <div className="tapp-step-num">{i + 1}</div>
                <div className="tapp-step-text">{step}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  )
}
