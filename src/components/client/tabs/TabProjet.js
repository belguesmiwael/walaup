'use client'
import { useState, useRef, useCallback, useEffect } from 'react'
import { CheckCircle2, Circle, Clock, CreditCard, Rocket, Zap, ExternalLink, Eye, Smartphone, Monitor, X, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { WalaupSound } from '@/lib/sound'

// ─── Demo meta helpers (mêmes que TabClients admin) ─────────────────────────
function deepClone(obj) { return JSON.parse(JSON.stringify(obj)) }

const DEMO_DEFAULT = {
  demos: [
    { slot: 1, url: '', status: 'pending' },
    { slot: 2, url: '', status: 'locked' },
    { slot: 3, url: '', status: 'locked' },
  ],
  finalUrl: '',
  payStatus: 'none',
  validatedSlot: null,
}

function parseDemoMeta(note) {
  if (!note) return deepClone(DEMO_DEFAULT)
  try {
    if (note.startsWith('walaup_demos:')) return { ...deepClone(DEMO_DEFAULT), ...JSON.parse(note.slice(13)) }
    if (note.startsWith('walaup_meta:')) {
      const old = JSON.parse(note.slice(12))
      const m = deepClone(DEMO_DEFAULT)
      if (old.demoUrl) m.demos[0] = { slot: 1, url: old.demoUrl, status: 'sent' }
      if (old.finalUrl) m.finalUrl = old.finalUrl
      if (old.payStatus) m.payStatus = old.payStatus
      return m
    }
  } catch {}
  return deepClone(DEMO_DEFAULT)
}

function encodeDemoMeta(meta) {
  return 'walaup_demos:' + JSON.stringify(meta)
}

// ─── Steps du projet ─────────────────────────────────────────────────────────
const STEPS = [
  { id: 'new',               label: 'Reçue',         icon: CheckCircle2 },
  { id: 'demo',              label: 'Démo prête',    icon: Zap          },
  { id: 'payment_requested', label: 'Paiement',      icon: CreditCard   },
  { id: 'payment_confirmed', label: 'Développement', icon: Clock        },
  { id: 'delivered',         label: 'Livré 🎉',      icon: Rocket       },
]

const STATUS_META = {
  new:               { color: '#6366F1', label: 'Nouvelle demande',   msg: 'Votre demande a bien été reçue. Notre équipe vous contacte sous 24h.' },
  demo:              { color: '#22D3EE', label: 'Démo disponible',    msg: 'Votre démo est prête ! Visualisez-la et donnez-nous votre retour ci-dessous.' },
  payment_requested: { color: '#F59E0B', label: 'Paiement requis',   msg: 'Démo validée ✓ — Effectuez le paiement pour lancer le développement complet.' },
  payment_confirmed: { color: '#10B981', label: 'En développement',  msg: 'Paiement confirmé ✓ — Notre équipe finalise votre application.' },
  delivered:         { color: '#6366F1', label: 'Application livrée', msg: 'Félicitations ! Votre application est déployée et prête à utiliser.' },
}

// ─── CSS ─────────────────────────────────────────────────────────────────────
const CSS = `
  .tp-heading { font-family:var(--font-display); font-size:1.3rem; font-weight:800; color:var(--tx); margin-bottom:24px; }
  .tp-stepper { display:flex; align-items:flex-start; margin-bottom:28px; overflow-x:auto; padding-bottom:6px; scrollbar-width:none; }
  .tp-stepper::-webkit-scrollbar { display:none; }
  .tp-step { display:flex; flex-direction:column; align-items:center; flex:1; min-width:64px; }
  .tp-step-row { display:flex; align-items:center; width:100%; }
  .tp-step-line { flex:1; height:2px; border-radius:1px; transition:background .4s; }
  .tp-step-circle { width:36px; height:36px; min-width:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; transition:all .3s; z-index:1; }
  .tp-step-label { font-size:10px; color:var(--tx-3); margin-top:7px; text-align:center; line-height:1.3; max-width:70px; transition:color .3s; }
  .tp-card { background:rgba(13,17,32,.60); border:1px solid rgba(255,255,255,.07); border-radius:18px; padding:22px; margin-bottom:16px; backdrop-filter:blur(14px); }
  .tp-status-tag { display:inline-flex; align-items:center; gap:6px; padding:5px 13px; border-radius:20px; font-size:12px; font-weight:700; margin-bottom:12px; letter-spacing:.02em; }
  .tp-msg { color:var(--tx-2); font-size:14px; line-height:1.65; margin:0 0 16px; }
  .tp-btn { display:inline-flex; align-items:center; gap:8px; padding:10px 20px; border-radius:12px; font-size:13px; font-weight:700; font-family:var(--font-body); cursor:pointer; border:none; transition:all .22s cubic-bezier(0.16,1,0.3,1); text-decoration:none; }
  .tp-btn--primary { background:linear-gradient(135deg,var(--ac),var(--ac-2)); color:#fff; box-shadow:0 4px 16px rgba(99,102,241,.28); }
  .tp-btn--gold { background:linear-gradient(135deg,#F59E0B,#D97706); color:#fff; box-shadow:0 4px 16px rgba(245,158,11,.28); }
  .tp-btn:hover { transform:translateY(-1px); filter:brightness(1.08); }
  .tp-btn:active { transform:translateY(0); }
  .tp-btn:disabled { opacity:.45; cursor:not-allowed; transform:none; filter:none; }
  .tp-info-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(130px,1fr)); gap:12px; }
  .tp-info-label { font-size:11px; font-weight:600; color:var(--tx-3); text-transform:uppercase; letter-spacing:.05em; margin-bottom:4px; }
  .tp-info-value { font-size:14px; color:var(--tx); font-weight:500; text-transform:capitalize; }
  .tp-note { margin-top:14px; padding:12px 14px; background:rgba(99,102,241,.07); border:1px solid rgba(99,102,241,.14); border-radius:11px; }
  .tp-note-tag { font-size:10.5px; font-weight:700; color:var(--ac); text-transform:uppercase; letter-spacing:.06em; display:block; margin-bottom:5px; }
  .tp-note-text { font-size:13.5px; color:var(--tx-2); line-height:1.6; margin:0; }
  .tp-empty { text-align:center; padding:48px 20px; color:var(--tx-3); }

  /* ── Demo cards ── */
  .tp-demo-card { border:1px solid rgba(255,255,255,0.09); border-radius:14px; padding:16px; margin-bottom:10px; background:rgba(8,11,20,0.5); transition:border-color 200ms; }
  .tp-demo-card--validated { border-color:rgba(16,185,129,0.35); background:rgba(16,185,129,0.04); }
  .tp-demo-card--dimmed { opacity:0.4; pointer-events:none; }
  .tp-demo-card-head { display:flex; align-items:center; gap:8px; margin-bottom:12px; }
  .tp-demo-num { font-size:13px; font-weight:800; color:var(--tx); font-family:'Space Grotesk',sans-serif; }
  .tp-demo-status { padding:3px 10px; border-radius:20px; font-size:10px; font-weight:700; }
  .tp-demo-actions { display:flex; gap:8px; flex-wrap:wrap; }
  .tp-demo-btn { display:flex; align-items:center; gap:6px; padding:8px 16px; border-radius:10px; font-size:12px; font-weight:700; cursor:pointer; border:none; transition:all .2s; font-family:'Inter',sans-serif; }
  .tp-demo-btn:disabled { opacity:.4; cursor:not-allowed; }
  .tp-demo-btn--view { background:rgba(99,102,241,0.14); border:1px solid rgba(99,102,241,0.28); color:var(--ac); }
  .tp-demo-btn--view:hover:not(:disabled) { background:rgba(99,102,241,0.24); }
  .tp-demo-btn--modify { background:rgba(251,146,60,0.1); border:1px solid rgba(251,146,60,0.25); color:#FB923C; }
  .tp-demo-btn--modify:hover:not(:disabled) { background:rgba(251,146,60,0.2); }
  .tp-demo-btn--validate { background:linear-gradient(135deg,#10B981,#059669); color:#fff; box-shadow:0 3px 12px rgba(16,185,129,0.28); }
  .tp-demo-btn--validate:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 5px 18px rgba(16,185,129,0.38); }

  /* ── Preview modal ── */
  .tp-prev-ov { position:fixed; inset:0; background:rgba(0,0,0,0.88); z-index:9999; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:20px; }
  .tp-prev-card { background:#0D1120; border:1px solid rgba(255,255,255,0.1); border-radius:14px; overflow:hidden; box-shadow:0 40px 100px rgba(0,0,0,0.8); display:flex; flex-direction:column; }
  .tp-prev-head { padding:10px 14px; border-bottom:1px solid rgba(255,255,255,0.08); display:flex; gap:8px; align-items:center; }
  .tp-prev-url { flex:1; font-size:11px; color:var(--tx-3); font-family:'JetBrains Mono',monospace; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .tp-toggle-wrap { display:flex; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09); border-radius:8px; padding:2px; gap:2px; }
  .tp-toggle-btn { padding:4px 10px; border-radius:6px; border:none; font-size:11px; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:4px; background:transparent; color:var(--tx-3); font-family:'Inter',sans-serif; transition:all 150ms; }
  .tp-toggle-btn--on { background:rgba(99,102,241,0.2); color:var(--ac); }
  .tp-close-btn { width:28px; height:28px; border-radius:7px; border:none; background:rgba(248,113,113,0.12); color:#F87171; cursor:pointer; display:flex; align-items:center; justify-content:center; }
  .tp-phone-shell { background:rgba(13,17,32,0.95); border:2px solid rgba(255,255,255,0.15); border-radius:36px; padding:14px; box-shadow:0 40px 100px rgba(0,0,0,0.8); }
  .tp-phone-notch { width:60px; height:5px; background:rgba(255,255,255,0.1); border-radius:3px; margin:0 auto 10px; }
  .tp-phone-screen { width:260px; height:520px; border-radius:24px; overflow:hidden; background:#000; }
  .tp-browser-bar { background:rgba(17,24,39,0.9); border-bottom:1px solid rgba(255,255,255,0.06); padding:8px 14px; display:flex; align-items:center; gap:10px; }
  .tp-browser-dots { display:flex; gap:5px; }
  .tp-browser-dot { width:9px; height:9px; border-radius:50%; }
  .tp-browser-url { flex:1; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.08); border-radius:5px; padding:3px 10px; font-size:11px; color:var(--tx-3); font-family:'JetBrains Mono',monospace; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  @keyframes tp-pulse{0%,100%{opacity:1}50%{opacity:.4}}
  .tp-pulse{animation:tp-pulse 1.8s ease-in-out infinite;}
`

// ─── Preview modal ────────────────────────────────────────────────────────────
function DemoPreviewModal({ url, onClose }) {
  const [mode, setMode] = useState('mobile')
  const screenRef = useRef(null)
  const iframeRef = useRef(null)

  const scaleMobile = useCallback(() => {
    if (!screenRef.current || !iframeRef.current) return
    const mw = 390
    const scale = screenRef.current.clientWidth / mw
    iframeRef.current.style.width = mw + 'px'
    iframeRef.current.style.height = Math.ceil(screenRef.current.clientHeight / scale) + 'px'
    iframeRef.current.style.transform = `scale(${scale})`
    iframeRef.current.style.transformOrigin = 'top left'
  }, [])

  useEffect(() => { if (mode === 'mobile') setTimeout(scaleMobile, 120) }, [mode, scaleMobile])

  return (
    <div className="tp-prev-ov" onClick={onClose}>
      <div
        className="tp-prev-card"
        style={{ width: mode === 'mobile' ? 'auto' : 'min(900px,92vw)' }}
        onClick={e => e.stopPropagation()}>
        <div className="tp-prev-head">
          <span className="tp-prev-url">{url}</span>
          <div className="tp-toggle-wrap">
            <button className={`tp-toggle-btn${mode === 'mobile' ? ' tp-toggle-btn--on' : ''}`} onClick={() => setMode('mobile')}><Smartphone size={11} /> Mobile</button>
            <button className={`tp-toggle-btn${mode === 'browser' ? ' tp-toggle-btn--on' : ''}`} onClick={() => setMode('browser')}><Monitor size={11} /> Desktop</button>
          </div>
          <button className="tp-close-btn" onClick={onClose}><X size={13} /></button>
        </div>
        {mode === 'mobile' ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}>
            <div className="tp-phone-shell">
              <div className="tp-phone-notch" />
              <div className="tp-phone-screen" ref={screenRef}>
                <iframe ref={iframeRef} src={url} sandbox="allow-scripts allow-forms allow-popups" title="démo mobile" style={{ border: 'none', display: 'block' }} onLoad={scaleMobile} />
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="tp-browser-bar">
              <div className="tp-browser-dots">
                <div className="tp-browser-dot" style={{ background: '#F87171' }} />
                <div className="tp-browser-dot" style={{ background: '#FBBF24' }} />
                <div className="tp-browser-dot" style={{ background: '#34D399' }} />
              </div>
              <div className="tp-browser-url">{url}</div>
            </div>
            <div style={{ height: 480 }}>
              <iframe src={url} sandbox="allow-scripts allow-forms allow-popups" title="démo desktop" style={{ width: '100%', height: '100%', border: 'none', display: 'block' }} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── DemoViewer (client) ──────────────────────────────────────────────────────
function DemoViewer({ lead, setLead }) {
  const meta = parseDemoMeta(lead.note)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [acting, setActing] = useState(false)

  const visibleDemos = meta.demos.filter(d =>
    ['sent', 'modify_requested', 'validated'].includes(d.status) && d.url
  )

  if (visibleDemos.length === 0 && lead.status !== 'demo') return null

  const persist = async (newMeta, extraLeadFields = {}) => {
    await supabase.from('leads').update({
      note: encodeDemoMeta(newMeta),
      ...extraLeadFields,
    }).eq('id', lead.id)
    // Refresh lead local
    const { data } = await supabase.from('leads').select('*').eq('id', lead.id).maybeSingle()
    if (data && setLead) setLead(data)
  }

  // Client demande modification
  const handleModify = async (slot) => {
    if (acting) return
    setActing(true)
    WalaupSound.click()
    const m = deepClone(meta)
    const idx = m.demos.findIndex(d => d.slot === slot)
    m.demos[idx].status = 'modify_requested'
    // Déverrouille le slot suivant pour admin
    const nextIdx = m.demos.findIndex(d => d.slot === slot + 1)
    if (nextIdx !== -1 && m.demos[nextIdx].status === 'locked') {
      m.demos[nextIdx].status = 'pending'
    }
    await persist(m)
    await supabase.from('messages').insert({
      lead_id: lead.id, sender: 'client',
      text: `↩️ Je souhaite des modifications pour la démo ${slot}. Merci de m'envoyer une nouvelle version.`
    })
    setActing(false)
  }

  // Client valide une démo
  const handleValidate = async (slot) => {
    if (acting) return
    if (!confirm(`Valider la démo ${slot} ? Cette action déclenchera la demande de paiement.`)) return
    setActing(true)
    WalaupSound.success()
    const m = deepClone(meta)
    // Marquer validée, désactiver toutes les autres
    m.demos = m.demos.map(d => ({
      ...d,
      status: d.slot === slot ? 'validated' : (d.status !== 'locked' ? 'disabled' : 'locked'),
    }))
    m.validatedSlot = slot
    m.payStatus = 'requested'
    await persist(m, { status: 'payment_requested' })
    await supabase.from('messages').insert({
      lead_id: lead.id, sender: 'client',
      text: `✅ J'ai validé la démo ${slot} ! Je suis prêt à procéder au paiement pour finaliser mon application.`
    })
    setActing(false)
  }

  const anyValidated = meta.demos.some(d => d.status === 'validated')
  const isDelivered = lead.status === 'delivered'

  return (
    <>
      {previewUrl && <DemoPreviewModal url={previewUrl} onClose={() => setPreviewUrl(null)} />}
      <div className="tp-card" style={{ borderColor: 'rgba(34,211,238,0.15)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--tx-3)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 14 }}>
          Vos démos ({visibleDemos.length})
        </div>

        {visibleDemos.map(demo => {
          const isSent      = demo.status === 'sent'
          const isModReq    = demo.status === 'modify_requested'
          const isValidated = demo.status === 'validated'
          const canModify   = isSent && !anyValidated && demo.slot < 3 && !isDelivered
          const canValidate = isSent && !anyValidated && !isDelivered

          let statusColor = '#6366F1', statusBg = 'rgba(99,102,241,0.1)', statusLabel = '📨 Envoyée'
          if (isModReq)   { statusColor = '#FB923C'; statusBg = 'rgba(251,146,60,0.1)';  statusLabel = '↩️ Modification demandée' }
          if (isValidated){ statusColor = '#10B981'; statusBg = 'rgba(16,185,129,0.12)'; statusLabel = '✅ Validée' }

          return (
            <div key={demo.slot}
              className={`tp-demo-card${isValidated ? ' tp-demo-card--validated' : ''}${isModReq ? ' tp-demo-card--dimmed' : ''}`}>
              <div className="tp-demo-card-head">
                <span className="tp-demo-num">Démo {demo.slot}</span>
                <span className="tp-demo-status" style={{ background: statusBg, color: statusColor }}>{statusLabel}</span>
              </div>

              <div className="tp-demo-actions">
                {/* Toujours : Visualiser */}
                <button className="tp-demo-btn tp-demo-btn--view" onClick={() => { setPreviewUrl(demo.url); WalaupSound.click() }}>
                  <Eye size={13} /> Visualiser
                </button>

                {/* Modifier — si envoyée et pas encore de validation et slot < 3 */}
                {canModify && (
                  <button className="tp-demo-btn tp-demo-btn--modify" onClick={() => handleModify(demo.slot)} disabled={acting}>
                    <RefreshCw size={13} /> Demander modification
                  </button>
                )}

                {/* Valider — si envoyée et aucune démo validée */}
                {canValidate && (
                  <button className="tp-demo-btn tp-demo-btn--validate" onClick={() => handleValidate(demo.slot)} disabled={acting}>
                    <CheckCircle2 size={13} /> Valider cette démo
                  </button>
                )}

                {/* Démo validée — info */}
                {isValidated && (
                  <span style={{ fontSize: 12, color: '#10B981', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <CheckCircle2 size={13} /> Cette version a été validée
                  </span>
                )}
              </div>
            </div>
          )
        })}

        {/* Message si aucune démo visible mais statut demo */}
        {visibleDemos.length === 0 && lead.status === 'demo' && (
          <p style={{ fontSize: 13, color: 'var(--tx-3)', margin: 0 }}>Votre démo sera disponible ici dès que l'équipe Walaup vous l'envoie.</p>
        )}
      </div>
    </>
  )
}

// ─── TabProjet ────────────────────────────────────────────────────────────────
export default function TabProjet({ lead, session, setLead }) {
  if (!lead) return (
    <>
      <style>{CSS}</style>
      <div className="tp-empty">
        <div style={{ fontSize: 40, marginBottom: 16 }}>🚀</div>
        <h3 style={{ color: 'var(--tx)', fontSize: 16, marginBottom: 8 }}>Aucun projet en cours</h3>
        <p style={{ fontSize: 13, lineHeight: 1.6, maxWidth: 280, margin: '0 auto 20px' }}>
          Décrivez votre besoin dans notre estimateur et recevez une démo en 48h.
        </p>
        <a href="/estimateur" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 22px',
          background: 'rgba(99,102,241,.15)', border: '1px solid rgba(99,102,241,.28)',
          borderRadius: 11, color: 'var(--ac)', fontSize: 13, fontWeight: 700, textDecoration: 'none',
        }}>
          Estimer mon app <ExternalLink size={13} />
        </a>
      </div>
    </>
  )

  const status = lead.status || 'new'
  const meta   = STATUS_META[status] || STATUS_META.new
  const currentIdx = STEPS.findIndex(s => s.id === status)

  return (
    <>
      <style>{CSS}</style>
      <h2 className="tp-heading">Mon Projet</h2>

      {/* Stepper */}
      <div className="tp-stepper">
        {STEPS.map((step, i) => {
          const done = i < currentIdx, active = i === currentIdx
          const Icon = step.icon
          return (
            <div key={step.id} className="tp-step">
              <div className="tp-step-row">
                {i > 0 && <div className="tp-step-line" style={{ background: done ? meta.color : 'rgba(255,255,255,.08)' }} />}
                <div className="tp-step-circle" style={{
                  background: done ? meta.color : active ? `${meta.color}1A` : 'rgba(255,255,255,.05)',
                  border: `2px solid ${done || active ? meta.color : 'rgba(255,255,255,.09)'}`,
                  boxShadow: active ? `0 0 18px ${meta.color}55` : 'none',
                }}>
                  <Icon size={14} strokeWidth={2.2} color={done ? '#fff' : active ? meta.color : 'var(--tx-3)'} />
                </div>
                {i < STEPS.length - 1 && <div className="tp-step-line" style={{ background: done ? meta.color : 'rgba(255,255,255,.08)' }} />}
              </div>
              <span className="tp-step-label" style={{ color: active ? meta.color : done ? 'var(--tx-2)' : 'var(--tx-3)', fontWeight: active ? 600 : 400 }}>
                {step.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Status card */}
      <div className="tp-card" style={{ borderColor: `${meta.color}22` }}>
        <span className="tp-status-tag" style={{ background: `${meta.color}15`, color: meta.color, border: `1px solid ${meta.color}28` }}>
          {status === 'payment_requested' && <span className="tp-pulse">●</span>}
          {meta.label}
        </span>
        <p className="tp-msg">{meta.msg}</p>
        {status === 'delivered' && lead.pay_ref && (
          <a href={lead.pay_ref} target="_blank" rel="noopener noreferrer" className="tp-btn tp-btn--primary">
            <Rocket size={14} /> Accéder à mon app
          </a>
        )}
      </div>

      {/* ── DÉMOS — visible dès que status = demo ou après ── */}
      {['demo', 'payment_requested', 'payment_confirmed', 'delivered'].includes(status) && (
        <DemoViewer lead={lead} setLead={setLead} />
      )}

      {/* Info projet */}
      <div className="tp-card">
        <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--tx-3)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '.06em' }}>
          Détails du projet
        </h3>
        <div className="tp-info-grid">
          <div>
            <div className="tp-info-label">Application</div>
            <div className="tp-info-value">{lead.type || '—'}</div>
          </div>
          <div>
            <div className="tp-info-label">Pack</div>
            <div className="tp-info-value">{lead.pack || '—'}</div>
          </div>
          <div>
            <div className="tp-info-label">Source</div>
            <div className="tp-info-value">{lead.source || '—'}</div>
          </div>
          <div>
            <div className="tp-info-label">Demande reçue</div>
            <div className="tp-info-value" style={{ textTransform: 'none' }}>
              {lead.created_at ? new Date(lead.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
            </div>
          </div>
        </div>
        {lead.note && !lead.note.startsWith('walaup_') && (
          <div className="tp-note">
            <span className="tp-note-tag">✦ Note de l&apos;équipe Walaup</span>
            <p className="tp-note-text">{lead.note}</p>
          </div>
        )}
      </div>
    </>
  )
}
