'use client'
import { CheckCircle2, Circle, Clock, CreditCard, Rocket, Zap, ExternalLink } from 'lucide-react'

const STEPS = [
  { id: 'new',               label: 'Reçue',          icon: CheckCircle2 },
  { id: 'demo',              label: 'Démo prête',      icon: Zap          },
  { id: 'payment_requested', label: 'Paiement',        icon: CreditCard   },
  { id: 'payment_confirmed', label: 'Développement',   icon: Clock        },
  { id: 'delivered',         label: 'Livré 🎉',        icon: Rocket       },
]

const STATUS_META = {
  new: {
    color: '#6366F1',
    label: 'Nouvelle demande',
    msg: 'Votre demande a bien été reçue. Notre équipe vous contacte sous 24h pour démarrer.',
  },
  demo: {
    color: '#22D3EE',
    label: 'Démo prête',
    msg: 'Votre démo est disponible ! Testez-la et dites-nous ce que vous souhaitez ajuster.',
  },
  payment_requested: {
    color: '#F59E0B',
    label: 'Paiement requis',
    msg: 'La démo est validée. Effectuez le paiement pour lancer le développement complet.',
  },
  payment_confirmed: {
    color: '#10B981',
    label: 'En développement',
    msg: 'Paiement confirmé ✓ — Notre équipe travaille sur votre application.',
  },
  delivered: {
    color: '#6366F1',
    label: 'Application livrée',
    msg: 'Félicitations ! Votre application est déployée et prête à l\'utilisation.',
  },
}

const CSS = `
  .tp-heading {
    font-family: var(--font-display);
    font-size: 1.3rem;
    font-weight: 800;
    color: var(--tx);
    margin-bottom: 24px;
  }

  /* Stepper */
  .tp-stepper {
    display: flex;
    align-items: flex-start;
    margin-bottom: 28px;
    overflow-x: auto;
    padding-bottom: 6px;
    scrollbar-width: none;
  }
  .tp-stepper::-webkit-scrollbar { display: none; }
  .tp-step { display: flex; flex-direction: column; align-items: center; flex: 1; min-width: 64px; }
  .tp-step-row { display: flex; align-items: center; width: 100%; }
  .tp-step-line {
    flex: 1;
    height: 2px;
    border-radius: 1px;
    transition: background .4s;
  }
  .tp-step-circle {
    width: 36px;
    height: 36px;
    min-width: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all .3s;
    z-index: 1;
  }
  .tp-step-label {
    font-size: 10px;
    color: var(--tx-3);
    margin-top: 7px;
    text-align: center;
    line-height: 1.3;
    max-width: 70px;
    transition: color .3s;
  }

  /* Card */
  .tp-card {
    background: rgba(13,17,32,.60);
    border: 1px solid rgba(255,255,255,.07);
    border-radius: 18px;
    padding: 22px;
    margin-bottom: 16px;
    backdrop-filter: blur(14px);
  }
  .tp-status-tag {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 13px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 700;
    margin-bottom: 12px;
    letter-spacing: .02em;
  }
  .tp-msg {
    color: var(--tx-2);
    font-size: 14px;
    line-height: 1.65;
    margin: 0 0 16px;
  }
  .tp-msg:last-child { margin-bottom: 0; }

  /* Action buttons */
  .tp-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    border-radius: 12px;
    font-size: 13px;
    font-weight: 700;
    font-family: var(--font-body);
    cursor: pointer;
    border: none;
    transition: all .22s cubic-bezier(0.16,1,0.3,1);
    text-decoration: none;
  }
  .tp-btn--primary {
    background: linear-gradient(135deg, var(--ac), var(--ac-2));
    color: #fff;
    box-shadow: 0 4px 16px rgba(99,102,241,.28);
  }
  .tp-btn--gold {
    background: linear-gradient(135deg, #F59E0B, #D97706);
    color: #fff;
    box-shadow: 0 4px 16px rgba(245,158,11,.28);
  }
  .tp-btn:hover { transform: translateY(-1px); filter: brightness(1.08); }
  .tp-btn:active { transform: translateY(0); }

  /* Info rows */
  .tp-info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
    gap: 12px;
  }
  .tp-info-item {}
  .tp-info-label {
    font-size: 11px;
    font-weight: 600;
    color: var(--tx-3);
    text-transform: uppercase;
    letter-spacing: .05em;
    margin-bottom: 4px;
  }
  .tp-info-value {
    font-size: 14px;
    color: var(--tx);
    font-weight: 500;
    text-transform: capitalize;
  }

  /* Note box */
  .tp-note {
    margin-top: 14px;
    padding: 12px 14px;
    background: rgba(99,102,241,.07);
    border: 1px solid rgba(99,102,241,.14);
    border-radius: 11px;
  }
  .tp-note-tag {
    font-size: 10.5px;
    font-weight: 700;
    color: var(--ac);
    text-transform: uppercase;
    letter-spacing: .06em;
    display: block;
    margin-bottom: 5px;
  }
  .tp-note-text {
    font-size: 13.5px;
    color: var(--tx-2);
    line-height: 1.6;
    margin: 0;
  }

  /* Pulse animation for payment needed */
  @keyframes tp-pulse { 0%,100% { opacity:1; } 50% { opacity:.4; } }
  .tp-pulse { animation: tp-pulse 1.8s ease-in-out infinite; }

  /* Empty state */
  .tp-empty {
    text-align: center;
    padding: 48px 20px;
    color: var(--tx-3);
  }
`

export default function TabProjet({ lead }) {
  if (!lead) {
    return (
      <>
        <style>{CSS}</style>
        <div className="tp-empty">
          <div style={{ fontSize: 40, marginBottom: 16 }}>🚀</div>
          <h3 style={{ color: 'var(--tx)', fontSize: 16, marginBottom: 8 }}>Aucun projet en cours</h3>
          <p style={{ fontSize: 13, lineHeight: 1.6, maxWidth: 280, margin: '0 auto 20px' }}>
            Décrivez votre besoin dans notre estimateur et recevez une démo en 48h.
          </p>
          <a href="/estimateur" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '10px 22px',
            background: 'rgba(99,102,241,.15)',
            border: '1px solid rgba(99,102,241,.28)',
            borderRadius: 11,
            color: 'var(--ac)',
            fontSize: 13, fontWeight: 700,
            textDecoration: 'none',
          }}>
            Estimer mon app <ExternalLink size={13} />
          </a>
        </div>
      </>
    )
  }

  const status = lead.status || 'new'
  const meta = STATUS_META[status] || STATUS_META.new
  const currentIdx = STEPS.findIndex(s => s.id === status)

  return (
    <>
      <style>{CSS}</style>
      <h2 className="tp-heading">Mon Projet</h2>

      {/* Stepper */}
      <div className="tp-stepper">
        {STEPS.map((step, i) => {
          const done = i < currentIdx
          const active = i === currentIdx
          const Icon = step.icon
          const lineColor = done || (active && i > 0) ? meta.color : 'rgba(255,255,255,.08)'
          return (
            <div key={step.id} className="tp-step">
              <div className="tp-step-row">
                {i > 0 && (
                  <div className="tp-step-line" style={{ background: done ? meta.color : 'rgba(255,255,255,.08)' }} />
                )}
                <div
                  className="tp-step-circle"
                  style={{
                    background: done ? meta.color : active ? `${meta.color}1A` : 'rgba(255,255,255,.05)',
                    border: `2px solid ${done || active ? meta.color : 'rgba(255,255,255,.09)'}`,
                    boxShadow: active ? `0 0 18px ${meta.color}55` : 'none',
                  }}
                >
                  <Icon
                    size={14}
                    strokeWidth={2.2}
                    color={done ? '#fff' : active ? meta.color : 'var(--tx-3)'}
                  />
                </div>
                {i < STEPS.length - 1 && (
                  <div className="tp-step-line" style={{ background: done ? meta.color : 'rgba(255,255,255,.08)' }} />
                )}
              </div>
              <span
                className="tp-step-label"
                style={{ color: active ? meta.color : done ? 'var(--tx-2)' : 'var(--tx-3)', fontWeight: active ? 600 : 400 }}
              >
                {step.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Status card */}
      <div className="tp-card" style={{ borderColor: `${meta.color}22` }}>
        <span
          className="tp-status-tag"
          style={{ background: `${meta.color}15`, color: meta.color, border: `1px solid ${meta.color}28` }}
        >
          {status === 'payment_requested' && <span className="tp-pulse">●</span>}
          {meta.label}
        </span>
        <p className="tp-msg">{meta.msg}</p>

        {/* Contextual CTAs */}
        {status === 'demo' && lead.demo_url && (
          <a href={lead.demo_url} target="_blank" rel="noopener noreferrer" className="tp-btn tp-btn--primary">
            <Zap size={14} /> Tester ma démo
          </a>
        )}
        {status === 'payment_requested' && (
          <button className="tp-btn tp-btn--gold">
            <CreditCard size={14} /> Payer maintenant
          </button>
        )}
        {status === 'delivered' && lead.app_url && (
          <a href={lead.app_url} target="_blank" rel="noopener noreferrer" className="tp-btn tp-btn--primary">
            <Rocket size={14} /> Accéder à mon app
          </a>
        )}
      </div>

      {/* Project info */}
      <div className="tp-card">
        <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--tx-3)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '.06em' }}>
          Détails du projet
        </h3>
        <div className="tp-info-grid">
          <div className="tp-info-item">
            <div className="tp-info-label">Application</div>
            <div className="tp-info-value">{lead.type || '—'}</div>
          </div>
          <div className="tp-info-item">
            <div className="tp-info-label">Pack</div>
            <div className="tp-info-value">{lead.pack || '—'}</div>
          </div>
          <div className="tp-info-item">
            <div className="tp-info-label">Source</div>
            <div className="tp-info-value">{lead.source || '—'}</div>
          </div>
          <div className="tp-info-item">
            <div className="tp-info-label">Demande reçue</div>
            <div className="tp-info-value" style={{ textTransform: 'none' }}>
              {lead.created_at
                ? new Date(lead.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
                : '—'}
            </div>
          </div>
        </div>

        {lead.note && (
          <div className="tp-note">
            <span className="tp-note-tag">✦ Note de l&apos;équipe Walaup</span>
            <p className="tp-note-text">{lead.note}</p>
          </div>
        )}
      </div>
    </>
  )
}
