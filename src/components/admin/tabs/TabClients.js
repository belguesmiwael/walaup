'use client'
import { useState, useRef } from 'react'
import { WalaupSound } from '@/lib/sound'
import {
  Search, Send, CheckCheck, X, CheckCircle2,
  Monitor, Smartphone, ExternalLink, Lock,
  AlertTriangle, CreditCard, Rocket, Eye
} from 'lucide-react'

/* ─────────────────────────────────────────────
   TYPES
   demo.status : 'locked' | 'ready' | 'sent' | 'confirmed' | 'rejected' | 'disabled'
   lead.payStatus : 'none' | 'requested' | 'confirmed'
   lead.finalUrl  : string | null
   lead.finalSent : boolean
───────────────────────────────────────────── */

const INIT_DEMOS = () => [
  { slot: 1, url: '', status: 'ready',  sentAt: null },
  { slot: 2, url: '', status: 'locked', sentAt: null },
  { slot: 3, url: '', status: 'locked', sentAt: null },
]

const MOCK_LEADS = [
  {
    id: '1', name: 'Mehdi Bouaziz', phone: '+216 97 234 567', email: 'mehdi.b@gmail.com',
    app: 'App Café & Restaurant', pack: 'Pro', status: 'demo',
    lastMsg: 'La démo est prête 👀', time: '14:32', unread: 2, source: 'marketplace',
    msgs: [
      { id: 'm1', sender: 'client', text: 'Bonjour, j\'ai soumis une demande pour une app café', ts: '09:00' },
      { id: 'm2', sender: 'admin',  text: 'Bonjour Mehdi ! La démo sera prête dans 24h.', ts: '09:15' },
      { id: 'm3', sender: 'admin',  text: 'La démo est prête, tu peux la voir 👀', ts: '14:32' },
    ],
    demos: INIT_DEMOS(),
    payStatus: 'none', finalUrl: '', finalSent: false,
  },
  {
    id: '2', name: 'Sonia Mejri', phone: '+216 52 891 003', email: 'sonia.m@hotmail.fr',
    app: 'App Grossiste Recharge', pack: 'Essentiel', status: 'payment_requested',
    lastMsg: 'Quand est-ce que je peux payer ?', time: 'Hier', unread: 0, source: 'estimateur',
    msgs: [
      { id: 'm1', sender: 'admin',  text: 'Votre démo est validée. Paiement requis pour continuer.', ts: '11:00' },
      { id: 'm2', sender: 'client', text: 'Quand est-ce que je peux payer ?', ts: '16:45' },
    ],
    demos: [
      { slot: 1, url: 'https://demo1.walaup.tn/sonia', status: 'rejected', sentAt: '03/04' },
      { slot: 2, url: 'https://demo2.walaup.tn/sonia', status: 'confirmed', sentAt: '05/04' },
      { slot: 3, url: '', status: 'disabled', sentAt: null },
    ],
    payStatus: 'requested', finalUrl: '', finalSent: false,
  },
  {
    id: '3', name: 'Ahmed Trabelsi', phone: '+216 25 660 812', email: 'ahmed.t@mail.tn',
    app: 'App Stock & Inventaire', pack: 'Partenaire', status: 'delivered',
    lastMsg: 'Merci infiniment, l\'app est parfaite !', time: 'Lun', unread: 0, source: 'direct',
    msgs: [
      { id: 'm1', sender: 'client', text: 'Merci infiniment, l\'app est parfaite !', ts: '10:00' },
      { id: 'm2', sender: 'admin',  text: 'Avec plaisir ! N\'hésitez pas pour toute question.', ts: '10:20' },
    ],
    demos: [
      { slot: 1, url: 'https://demo1.walaup.tn/ahmed', status: 'disabled', sentAt: '20/03' },
      { slot: 2, url: 'https://demo2.walaup.tn/ahmed', status: 'disabled', sentAt: '24/03' },
      { slot: 3, url: '', status: 'disabled', sentAt: null },
    ],
    payStatus: 'confirmed', finalUrl: 'https://app.walaup.tn/ahmed', finalSent: true,
  },
  {
    id: '4', name: 'Karim Lakhal', phone: '+216 20 453 900', email: 'k.lakhal@outlook.com',
    app: 'App Crèche', pack: 'Pro', status: 'new',
    lastMsg: 'Bonjour, je voudrais une démo gratuite', time: 'Dim', unread: 1, source: 'marketplace',
    msgs: [
      { id: 'm1', sender: 'client', text: 'Bonjour, je voudrais une démo pour une app crèche', ts: '15:12' },
    ],
    demos: INIT_DEMOS(),
    payStatus: 'none', finalUrl: '', finalSent: false,
  },
]

const STATUS_CONFIG = {
  new:               { label: 'Nouveau',           color: '#22D3EE', bg: 'rgba(34,211,238,0.1)' },
  demo:              { label: 'Démo prête',         color: '#6366F1', bg: 'rgba(99,102,241,0.1)' },
  dev:               { label: 'En développement',  color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  payment_requested: { label: 'Paiement demandé',  color: '#FB923C', bg: 'rgba(251,146,60,0.1)' },
  payment_confirmed: { label: 'Paiement confirmé', color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
  delivered:         { label: 'Livré',              color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
  cancelled:         { label: 'Annulé',             color: '#F87171', bg: 'rgba(248,113,113,0.1)' },
}

const PACK_COLOR = {
  Essentiel:  { color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  Pro:        { color: '#6366F1', bg: 'rgba(99,102,241,0.12)' },
  Partenaire: { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
}

const PAYMENT_METHODS = [
  { id: 'flouci',   label: 'Flouci',   emoji: '📱' },
  { id: 'konnect',  label: 'Konnect',  emoji: '💳' },
  { id: 'd17',      label: 'D17',      emoji: '📲' },
  { id: 'virement', label: 'Virement', emoji: '🏦' },
  { id: 'especes',  label: 'Espèces',  emoji: '💵' },
  { id: 'cheque',   label: 'Chèque',   emoji: '📄' },
]

const STATUS_FLOW = ['new', 'demo', 'dev', 'payment_requested', 'payment_confirmed', 'delivered']

/* ────────────────────────────────────────────────────────
   DEMO PANEL — Système de démos max 3
──────────────────────────────────────────────────────── */
function DemoPanel({ lead, onUpdate }) {
  const [previewUrl, setPreviewUrl] = useState(null)
  const [previewMode, setPreviewMode] = useState('browser') // 'phone' | 'browser'
  const [payMethod, setPayMethod] = useState('flouci')
  const [paySuccess, setPaySuccess] = useState(false)

  const demos = lead.demos
  const sentCount = demos.filter(d => ['sent','confirmed','rejected'].includes(d.status)).length
  const confirmedDemo = demos.find(d => d.status === 'confirmed')
  const allUsed = sentCount >= 3
  const isDelivered = lead.finalSent

  /* ─── Envoyer une démo ─── */
  const sendDemo = (slot) => {
    const d = demos[slot - 1]
    if (!d.url.trim()) return alert('Entre l\'URL de la démo avant d\'envoyer.')
    onUpdate(lead.id, prev => {
      const nd = prev.demos.map(dm =>
        dm.slot === slot ? { ...dm, status: 'sent', sentAt: new Date().toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit' }) } : dm
      )
      // Unlock next slot if exists
      if (slot < 3) nd[slot].status = nd[slot].status === 'locked' ? 'ready' : nd[slot].status
      return { ...prev, demos: nd, status: 'demo' }
    })
    WalaupSound.send?.()
  }

  /* ─── Simuler confirmation client (pour test) ─── */
  const confirmDemo = (slot) => {
    onUpdate(lead.id, prev => {
      const nd = prev.demos.map(dm => {
        if (dm.slot === slot) return { ...dm, status: 'confirmed' }
        if (dm.slot !== slot && dm.status !== 'rejected') return { ...dm, status: 'disabled' }
        return dm
      })
      return { ...prev, demos: nd, status: 'payment_requested', payStatus: 'requested' }
    })
    WalaupSound.success?.()
  }

  /* ─── Simuler rejet client (demande modif) ─── */
  const rejectDemo = (slot) => {
    onUpdate(lead.id, prev => {
      const nd = prev.demos.map(dm => {
        if (dm.slot === slot) return { ...dm, status: 'rejected' }
        if (dm.slot === slot + 1) return { ...dm, status: 'ready' }
        return dm
      })
      return { ...prev, demos: nd }
    })
  }

  /* ─── Confirmer paiement ─── */
  const confirmPayment = () => {
    setPaySuccess(true)
    setTimeout(() => {
      onUpdate(lead.id, prev => ({ ...prev, payStatus: 'confirmed', status: 'payment_confirmed' }))
      setPaySuccess(false)
    }, 1500)
    WalaupSound.success?.()
  }

  /* ─── Envoyer version finale ─── */
  const sendFinal = () => {
    if (!lead.finalUrl?.trim()) return alert('Entre l\'URL de la version finale.')
    onUpdate(lead.id, prev => {
      const nd = prev.demos.map(dm => ({ ...dm, status: 'disabled' }))
      return { ...prev, demos: nd, finalSent: true, status: 'delivered' }
    })
    WalaupSound.success?.()
  }

  const DEMO_STATUS_UI = {
    locked:    { label: '🔒 Verrouillée',    color: '#525878', bg: 'rgba(82,88,120,0.1)' },
    ready:     { label: '✏️ Prête à envoyer', color: '#22D3EE', bg: 'rgba(34,211,238,0.08)' },
    sent:      { label: '📨 Envoyée',          color: '#6366F1', bg: 'rgba(99,102,241,0.1)' },
    confirmed: { label: '✅ Confirmée',         color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
    rejected:  { label: '↩️ Modif. demandée',  color: '#FB923C', bg: 'rgba(251,146,60,0.1)' },
    disabled:  { label: '🚫 Désactivée',        color: '#374151', bg: 'rgba(55,65,81,0.1)' },
  }

  return (
    <div className="dp-root">
      {/* Header */}
      <div className="dp-header">
        <div className="dp-title">
          <Monitor size={14} color="var(--ac)" />
          Système de démos
        </div>
        <div className="dp-counter">
          <span style={{ color: sentCount >= 3 ? '#F87171' : 'var(--ac)', fontWeight: 700 }}>{sentCount}</span>
          <span style={{ color: 'var(--tx-3)' }}>/3 modifications</span>
        </div>
      </div>

      {/* Démo slots */}
      {demos.map(d => {
        const sui = DEMO_STATUS_UI[d.status]
        const isActive = ['ready', 'sent'].includes(d.status)
        const canSend = d.status === 'ready' && !confirmedDemo
        return (
          <div key={d.slot} className={`dp-slot ${d.status === 'disabled' ? 'dp-slot--disabled' : ''}`}>
            <div className="dp-slot-head">
              <div className="dp-slot-num">Démo {d.slot}</div>
              <span className="dp-slot-badge" style={{ color: sui.color, background: sui.bg }}>{sui.label}</span>
              {d.sentAt && <span className="dp-slot-date">{d.sentAt}</span>}
            </div>

            {/* URL input — visible si ready ou déjà envoyée */}
            {['ready', 'sent', 'confirmed', 'rejected'].includes(d.status) && (
              <div className="dp-url-row">
                <input
                  className="dp-url-inp"
                  placeholder={`URL démo ${d.slot}... ex: https://demo${d.slot}.walaup.tn/client`}
                  value={d.url}
                  readOnly={d.status !== 'ready'}
                  onChange={e => onUpdate(lead.id, prev => ({
                    ...prev,
                    demos: prev.demos.map(dm => dm.slot === d.slot ? { ...dm, url: e.target.value } : dm)
                  }))}
                />
                {d.url && (
                  <button className="dp-preview-btn" onClick={() => { setPreviewUrl(d.url); setPreviewMode('browser') }}>
                    <Eye size={12} />
                  </button>
                )}
              </div>
            )}

            {/* Actions admin */}
            {d.status === 'ready' && !confirmedDemo && (
              <button className="dp-send-btn" onClick={() => sendDemo(d.slot)}>
                <Send size={12} /> Envoyer au client
              </button>
            )}

            {/* Simulation client (pour test) */}
            {d.status === 'sent' && !confirmedDemo && (
              <div className="dp-client-actions">
                <span className="dp-client-label">Simuler réponse client :</span>
                <button className="dp-confirm-sim" onClick={() => confirmDemo(d.slot)}>
                  <CheckCircle2 size={11} /> Confirmer
                </button>
                {d.slot < 3 && (
                  <button className="dp-reject-sim" onClick={() => rejectDemo(d.slot)}>
                    <X size={11} /> Demander modif
                  </button>
                )}
              </div>
            )}
          </div>
        )
      })}

      {/* Limite atteinte */}
      {allUsed && !confirmedDemo && (
        <div className="dp-limit-warn">
          <AlertTriangle size={13} /> 3 modifications atteintes — le client doit acheter ou quitter.
        </div>
      )}

      {/* ─── PAIEMENT ─── */}
      {confirmedDemo && lead.payStatus !== 'confirmed' && !isDelivered && (
        <div className="dp-pay-section">
          <div className="dp-pay-title">
            <CreditCard size={14} color="#F59E0B" /> Paiement
          </div>
          <div className="dp-pay-info">
            Démo {confirmedDemo.slot} confirmée — paiement requis avant la version finale.
          </div>

          {lead.payStatus === 'none' && (
            <>
              <div className="dp-pm-grid">
                {PAYMENT_METHODS.map(pm => (
                  <div
                    key={pm.id}
                    className={`dp-pm-card ${payMethod === pm.id ? 'dp-pm-card--active' : ''}`}
                    onClick={() => setPayMethod(pm.id)}
                  >
                    <span style={{ fontSize: 16 }}>{pm.emoji}</span>
                    <span style={{ fontSize: 10, color: 'var(--tx-2)' }}>{pm.label}</span>
                  </div>
                ))}
              </div>
              <button className="dp-pay-btn" onClick={() => onUpdate(lead.id, p => ({ ...p, payStatus: 'requested', status: 'payment_requested' }))}>
                <CreditCard size={13} /> Demander le paiement via {PAYMENT_METHODS.find(p => p.id === payMethod)?.label}
              </button>
            </>
          )}

          {lead.payStatus === 'requested' && (
            <div className="dp-pay-pending">
              <div className="dp-pay-pending-label">En attente du paiement client...</div>
              {paySuccess ? (
                <div className="dp-pay-ok"><CheckCircle2 size={18} color="#10B981" /> Paiement confirmé !</div>
              ) : (
                <button className="dp-pay-confirm-btn" onClick={confirmPayment}>
                  <CheckCircle2 size={13} /> Confirmer réception paiement
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─── VERSION FINALE ─── */}
      {lead.payStatus === 'confirmed' && !isDelivered && (
        <div className="dp-final-section">
          <div className="dp-final-title">
            <Rocket size={14} color="#10B981" /> Version finale
          </div>
          <div className="dp-final-info">
            Paiement confirmé ✓ — Envoie la version finale au client. Toutes les démos seront désactivées.
          </div>
          <div className="dp-url-row" style={{ marginBottom: 10 }}>
            <input
              className="dp-url-inp"
              placeholder="URL version finale... ex: https://app.walaup.tn/client"
              value={lead.finalUrl || ''}
              onChange={e => onUpdate(lead.id, p => ({ ...p, finalUrl: e.target.value }))}
            />
          </div>
          <button className="dp-final-btn" onClick={sendFinal}>
            <Rocket size={13} /> Envoyer la version finale — désactiver toutes les démos
          </button>
        </div>
      )}

      {/* ─── LIVRÉ ─── */}
      {isDelivered && (
        <div className="dp-delivered">
          <CheckCircle2 size={18} color="#10B981" />
          <div>
            <div style={{ fontWeight: 700, color: '#10B981' }}>App livrée ✓</div>
            <div style={{ fontSize: 11, color: 'var(--tx-3)', marginTop: 3 }}>{lead.finalUrl}</div>
          </div>
        </div>
      )}

      {/* Preview iframe */}
      {previewUrl && (
        <div className="dp-preview-overlay" onClick={() => setPreviewUrl(null)}>
          <div className="dp-preview-modal" onClick={e => e.stopPropagation()}>
            <div className="dp-preview-bar">
              <span style={{ fontSize: 12, color: 'var(--tx-2)' }}>Aperçu démo</span>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button
                  className={`dp-mode-btn ${previewMode === 'browser' ? 'dp-mode-btn--active' : ''}`}
                  onClick={() => setPreviewMode('browser')}
                ><Monitor size={13} /></button>
                <button
                  className={`dp-mode-btn ${previewMode === 'phone' ? 'dp-mode-btn--active' : ''}`}
                  onClick={() => setPreviewMode('phone')}
                ><Smartphone size={13} /></button>
                <a href={previewUrl} target="_blank" rel="noreferrer" className="dp-mode-btn">
                  <ExternalLink size={13} />
                </a>
                <button className="dp-mode-btn" onClick={() => setPreviewUrl(null)}><X size={13} /></button>
              </div>
            </div>
            <div className={`dp-iframe-wrap ${previewMode === 'phone' ? 'dp-iframe-wrap--phone' : ''}`}>
              <iframe
                src={previewUrl}
                sandbox="allow-scripts allow-forms allow-popups"
                style={{ width: '100%', height: '100%', border: 'none', borderRadius: 8 }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ──────────────────────────────────────────────────────────
   MAIN COMPONENT
────────────────────────────────────────────────────────── */
export default function TabClients() {
  const [leads, setLeads]     = useState(MOCK_LEADS)
  const [selected, setSelected] = useState(MOCK_LEADS[0])
  const [search, setSearch]   = useState('')
  const [msg, setMsg]         = useState('')
  const [activePanel, setActivePanel] = useState('chat') // 'chat' | 'demos'
  const chatRef   = useRef(null)
  const typingRef = useRef(null)

  const filtered = leads.filter(l =>
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    l.phone.includes(search) ||
    l.app.toLowerCase().includes(search.toLowerCase())
  )

  /* Sync selected with leads state */
  const updateLead = (id, updater) => {
    setLeads(prev => prev.map(l => l.id === id ? updater(l) : l))
    setSelected(prev => prev.id === id ? updater(prev) : prev)
  }

  const sendMsg = () => {
    if (!msg.trim() || !selected) return
    const newMsg = {
      id: Date.now().toString(), sender: 'admin', text: msg,
      ts: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    }
    updateLead(selected.id, l => ({ ...l, msgs: [...l.msgs, newMsg], lastMsg: msg }))
    setMsg('')
    WalaupSound.send?.()
    setTimeout(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight }, 50)
  }

  const changeStatus = (s) => {
    updateLead(selected.id, l => ({ ...l, status: s }))
    WalaupSound.success?.()
  }

  const CSS = `
    /* ─── Layout ─── */
    .adm-cl { display:flex; height:100%; overflow:hidden; }

    /* ─── List ─── */
    .adm-cl-list { width:272px; flex-shrink:0; border-right:1px solid rgba(255,255,255,0.07);
      display:flex; flex-direction:column; }
    .adm-cl-search { padding:10px; border-bottom:1px solid rgba(255,255,255,0.06); position:relative; }
    .adm-cl-sinp { width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09);
      border-radius:10px; padding:8px 10px 8px 32px; color:var(--tx); font-size:12px; outline:none; }
    .adm-cl-sinp:focus { border-color:rgba(99,102,241,0.4); }
    .adm-cl-sico { position:absolute; left:20px; top:50%; transform:translateY(-50%); pointer-events:none; }
    .adm-cl-items { flex:1; overflow-y:auto; }
    .adm-cl-items::-webkit-scrollbar { width:3px; }
    .adm-cl-items::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.08); border-radius:2px; }
    .adm-cl-item { padding:11px 13px; border-bottom:1px solid rgba(255,255,255,0.04);
      cursor:pointer; transition:background 150ms; }
    .adm-cl-item:hover { background:rgba(255,255,255,0.03); }
    .adm-cl-item--active { background:rgba(99,102,241,0.08); }
    .adm-cl-row1 { display:flex; justify-content:space-between; align-items:center; margin-bottom:4px; }
    .adm-cl-iname { font-size:13px; font-weight:600; color:var(--tx); }
    .adm-cl-itime { font-size:10px; color:var(--tx-3); }
    .adm-cl-row2 { display:flex; justify-content:space-between; align-items:center; }
    .adm-cl-imsg { font-size:11px; color:var(--tx-3); white-space:nowrap;
      overflow:hidden; text-overflow:ellipsis; max-width:160px; }
    .adm-cl-ibadge { width:16px; height:16px; border-radius:8px; background:var(--red);
      font-size:9px; color:#fff; font-weight:700; display:flex; align-items:center; justify-content:center; }

    /* ─── Detail ─── */
    .adm-cl-detail { flex:1; display:flex; flex-direction:column; min-width:0; overflow:hidden; }

    /* Info bar */
    .adm-cl-info { padding:12px 16px; border-bottom:1px solid rgba(255,255,255,0.07);
      display:flex; align-items:center; gap:10px; flex-shrink:0; flex-wrap:wrap; }
    .adm-cl-avatar { width:36px; height:36px; border-radius:50%; flex-shrink:0;
      background:linear-gradient(135deg,#6366F1,#8B5CF6);
      display:flex; align-items:center; justify-content:center;
      font-weight:800; font-size:14px; color:#fff; font-family:'Space Grotesk',sans-serif; }
    .adm-cl-meta { flex:1; min-width:0; }
    .adm-cl-meta-name { font-weight:700; font-size:14px; color:var(--tx); }
    .adm-cl-meta-app  { font-size:11px; color:var(--tx-3); margin-top:2px; }
    .adm-badge { padding:2px 9px; border-radius:20px; font-size:10px; font-weight:700; }

    /* Status bar */
    .adm-status-bar { padding:8px 14px; border-bottom:1px solid rgba(255,255,255,0.06);
      display:flex; gap:5px; flex-wrap:wrap; align-items:center; flex-shrink:0; }
    .adm-status-btn { padding:4px 9px; border-radius:7px; font-size:10px; font-weight:600;
      cursor:pointer; border:1px solid rgba(255,255,255,0.1); background:transparent;
      color:var(--tx-2); transition:all 150ms; }
    .adm-status-btn:hover { background:rgba(99,102,241,0.1); color:var(--tx); }
    .adm-status-btn--active { background:rgba(99,102,241,0.15); border-color:rgba(99,102,241,0.4); color:var(--ac); }

    /* Panel tabs */
    .adm-panel-tabs { display:flex; border-bottom:1px solid rgba(255,255,255,0.06); flex-shrink:0; }
    .adm-ptab { flex:1; padding:9px; text-align:center; font-size:12px; font-weight:600;
      color:var(--tx-3); cursor:pointer; transition:all 150ms; border-bottom:2px solid transparent; }
    .adm-ptab:hover { color:var(--tx-2); background:rgba(255,255,255,0.02); }
    .adm-ptab--active { color:var(--ac); border-bottom-color:var(--ac); }

    /* Chat */
    .adm-chat { flex:1; overflow-y:auto; padding:14px 16px; display:flex; flex-direction:column; gap:7px; }
    .adm-chat::-webkit-scrollbar { width:3px; }
    .adm-chat::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.08); border-radius:2px; }
    .adm-bubble { max-width:72%; padding:8px 12px; border-radius:14px; font-size:13px; line-height:1.5; }
    .adm-bubble--admin { align-self:flex-end; background:linear-gradient(135deg,#6366F1,#8B5CF6);
      color:#fff; border-bottom-right-radius:4px; }
    .adm-bubble--client { align-self:flex-start; background:rgba(255,255,255,0.07);
      border:1px solid rgba(255,255,255,0.1); color:var(--tx); border-bottom-left-radius:4px; }
    .adm-bubble-ts { font-size:10px; opacity:.6; margin-top:3px; text-align:right; }
    .adm-chat-inp { padding:10px 12px; border-top:1px solid rgba(255,255,255,0.07);
      display:flex; gap:8px; align-items:center; flex-shrink:0; }
    .adm-chat-field { flex:1; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09);
      border-radius:10px; padding:8px 12px; color:var(--tx); font-size:13px; outline:none;
      resize:none; font-family:'Inter',sans-serif; }
    .adm-chat-field:focus { border-color:rgba(99,102,241,0.4); }
    .adm-chat-send { width:34px; height:34px; border-radius:9px;
      background:linear-gradient(135deg,#6366F1,#8B5CF6); border:none;
      display:flex; align-items:center; justify-content:center;
      cursor:pointer; color:#fff; transition:transform 150ms; flex-shrink:0; }
    .adm-chat-send:hover  { transform:scale(1.08); }
    .adm-chat-send:active { transform:scale(0.92); }

    /* ─── Demo Panel ─── */
    .dp-root { flex:1; overflow-y:auto; padding:14px 16px; display:flex; flex-direction:column; gap:10px; }
    .dp-root::-webkit-scrollbar { width:3px; }
    .dp-root::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:2px; }

    .dp-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:4px; }
    .dp-title { display:flex; align-items:center; gap:7px; font-size:13px; font-weight:700; color:var(--tx); }
    .dp-counter { font-size:12px; }

    .dp-slot { background:rgba(13,17,32,0.6); border:1px solid rgba(255,255,255,0.08);
      border-radius:12px; padding:12px; display:flex; flex-direction:column; gap:8px; }
    .dp-slot--disabled { opacity:.4; pointer-events:none; }
    .dp-slot-head { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
    .dp-slot-num { font-size:12px; font-weight:700; color:var(--tx); }
    .dp-slot-badge { padding:2px 8px; border-radius:20px; font-size:10px; font-weight:600; }
    .dp-slot-date { font-size:10px; color:var(--tx-3); margin-left:auto; }

    .dp-url-row { display:flex; gap:6px; }
    .dp-url-inp { flex:1; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.09);
      border-radius:8px; padding:7px 10px; color:var(--tx); font-size:11px; outline:none;
      font-family:'JetBrains Mono',monospace; }
    .dp-url-inp:focus { border-color:rgba(99,102,241,0.4); }
    .dp-url-inp:read-only { color:var(--tx-2); cursor:default; }
    .dp-preview-btn { width:28px; height:28px; flex-shrink:0; border-radius:7px;
      border:1px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.04);
      color:var(--tx-2); cursor:pointer; display:flex; align-items:center; justify-content:center; }

    .dp-send-btn { align-self:flex-start; display:flex; align-items:center; gap:6px;
      padding:6px 14px; border-radius:8px; border:none;
      background:linear-gradient(135deg,#6366F1,#8B5CF6); color:#fff;
      font-size:11px; font-weight:700; cursor:pointer; transition:transform 150ms;
      font-family:'Space Grotesk',sans-serif; }
    .dp-send-btn:hover  { transform:scale(1.04); }
    .dp-send-btn:active { transform:scale(0.96); }

    .dp-client-actions { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
    .dp-client-label { font-size:10px; color:var(--tx-3); }
    .dp-confirm-sim { display:flex; align-items:center; gap:4px; padding:4px 10px; border-radius:7px;
      border:1px solid rgba(16,185,129,0.4); background:rgba(16,185,129,0.1);
      color:#10B981; font-size:10px; font-weight:600; cursor:pointer; transition:all 150ms; }
    .dp-confirm-sim:hover { background:rgba(16,185,129,0.2); }
    .dp-reject-sim { display:flex; align-items:center; gap:4px; padding:4px 10px; border-radius:7px;
      border:1px solid rgba(251,146,60,0.4); background:rgba(251,146,60,0.1);
      color:#FB923C; font-size:10px; font-weight:600; cursor:pointer; transition:all 150ms; }
    .dp-reject-sim:hover { background:rgba(251,146,60,0.2); }

    .dp-limit-warn { display:flex; align-items:center; gap:7px; padding:10px 12px;
      border-radius:9px; background:rgba(248,113,113,0.08); border:1px solid rgba(248,113,113,0.2);
      font-size:11px; color:#F87171; }

    /* Payment section */
    .dp-pay-section { background:rgba(245,158,11,0.06); border:1px solid rgba(245,158,11,0.2);
      border-radius:12px; padding:14px; display:flex; flex-direction:column; gap:10px; }
    .dp-pay-title { display:flex; align-items:center; gap:7px; font-size:13px; font-weight:700; color:#F59E0B; }
    .dp-pay-info { font-size:11px; color:var(--tx-2); }
    .dp-pm-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:6px; }
    .dp-pm-card { padding:8px 6px; border-radius:8px; border:1px solid rgba(255,255,255,0.09);
      background:rgba(255,255,255,0.03); cursor:pointer; text-align:center;
      display:flex; flex-direction:column; align-items:center; gap:3px; transition:all 140ms; }
    .dp-pm-card:hover { border-color:rgba(99,102,241,0.3); }
    .dp-pm-card--active { border-color:rgba(99,102,241,0.5); background:rgba(99,102,241,0.12); }
    .dp-pay-btn { display:flex; align-items:center; justify-content:center; gap:7px;
      padding:9px 16px; border-radius:9px; border:none;
      background:linear-gradient(135deg,#F59E0B,#D97706); color:#000;
      font-size:12px; font-weight:700; cursor:pointer; transition:transform 150ms;
      font-family:'Space Grotesk',sans-serif; }
    .dp-pay-btn:hover { transform:scale(1.03); }
    .dp-pay-pending { display:flex; flex-direction:column; gap:8px; }
    .dp-pay-pending-label { font-size:11px; color:var(--tx-3); font-style:italic; }
    .dp-pay-confirm-btn { display:flex; align-items:center; justify-content:center; gap:6px;
      padding:8px 14px; border-radius:9px; border:none;
      background:rgba(16,185,129,0.15); border:1px solid rgba(16,185,129,0.4);
      color:#10B981; font-size:12px; font-weight:700; cursor:pointer; transition:all 150ms; }
    .dp-pay-confirm-btn:hover { background:rgba(16,185,129,0.25); }
    .dp-pay-ok { display:flex; align-items:center; gap:8px; font-size:13px; font-weight:700; color:#10B981; }

    /* Final section */
    .dp-final-section { background:rgba(16,185,129,0.06); border:1px solid rgba(16,185,129,0.2);
      border-radius:12px; padding:14px; display:flex; flex-direction:column; gap:10px; }
    .dp-final-title { display:flex; align-items:center; gap:7px; font-size:13px; font-weight:700; color:#10B981; }
    .dp-final-info { font-size:11px; color:var(--tx-2); }
    .dp-final-btn { display:flex; align-items:center; justify-content:center; gap:7px;
      padding:10px 16px; border-radius:9px; border:none;
      background:linear-gradient(135deg,#10B981,#059669); color:#fff;
      font-size:12px; font-weight:700; cursor:pointer; transition:transform 150ms;
      font-family:'Space Grotesk',sans-serif; }
    .dp-final-btn:hover  { transform:scale(1.03); }
    .dp-final-btn:active { transform:scale(0.97); }

    /* Delivered */
    .dp-delivered { display:flex; align-items:center; gap:12px; padding:14px;
      border-radius:12px; background:rgba(16,185,129,0.08); border:1px solid rgba(16,185,129,0.2); }

    /* Preview overlay */
    .dp-preview-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.8); z-index:9000;
      display:flex; align-items:center; justify-content:center; backdrop-filter:blur(6px); }
    .dp-preview-modal { width:800px; max-width:95vw; height:80vh; background:#0D1120;
      border:1px solid rgba(255,255,255,0.12); border-radius:16px; overflow:hidden;
      display:flex; flex-direction:column; }
    .dp-preview-bar { padding:10px 14px; border-bottom:1px solid rgba(255,255,255,0.08);
      display:flex; justify-content:space-between; align-items:center; flex-shrink:0; }
    .dp-mode-btn { width:28px; height:28px; border-radius:7px; border:1px solid rgba(255,255,255,0.1);
      background:rgba(255,255,255,0.04); color:var(--tx-2); cursor:pointer;
      display:flex; align-items:center; justify-content:center; transition:all 150ms;
      text-decoration:none; }
    .dp-mode-btn:hover { background:rgba(99,102,241,0.15); color:var(--ac); }
    .dp-mode-btn--active { background:rgba(99,102,241,0.2); border-color:rgba(99,102,241,0.4); color:var(--ac); }
    .dp-iframe-wrap { flex:1; padding:12px; }
    .dp-iframe-wrap--phone { display:flex; justify-content:center; }
    .dp-iframe-wrap--phone iframe { width:390px !important; border-radius:20px; }

    @media(max-width:767px) {
      .adm-cl-list { display:none; }
    }
  `

  const sc = selected ? STATUS_CONFIG[selected.status] : null
  const pc = selected ? PACK_COLOR[selected.pack] : null

  return (
    <>
      <style>{CSS}</style>
      <div className="adm-cl">

        {/* ── Left — Lead list ── */}
        <div className="adm-cl-list">
          <div className="adm-cl-search">
            <Search size={13} color="var(--tx-3)" className="adm-cl-sico" />
            <input
              className="adm-cl-sinp"
              placeholder="Rechercher..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="adm-cl-items">
            {filtered.map(lead => (
              <div
                key={lead.id}
                className={`adm-cl-item ${selected?.id === lead.id ? 'adm-cl-item--active' : ''}`}
                onClick={() => { setSelected(lead); setActivePanel('chat'); WalaupSound.tab?.() }}
              >
                <div className="adm-cl-row1">
                  <span className="adm-cl-iname">{lead.name}</span>
                  <span className="adm-cl-itime">{lead.time}</span>
                </div>
                <div className="adm-cl-row2">
                  <span className="adm-cl-imsg">{lead.lastMsg}</span>
                  {lead.unread > 0 && <span className="adm-cl-ibadge">{lead.unread}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right — Detail ── */}
        {selected && (
          <div className="adm-cl-detail">

            {/* Info bar */}
            <div className="adm-cl-info">
              <div className="adm-cl-avatar">{selected.name[0]}</div>
              <div className="adm-cl-meta">
                <div className="adm-cl-meta-name">{selected.name}</div>
                <div className="adm-cl-meta-app">{selected.phone} · {selected.app}</div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {sc && <span className="adm-badge" style={{ color: sc.color, background: sc.bg }}>{sc.label}</span>}
                {pc && <span className="adm-badge" style={{ color: pc.color, background: pc.bg }}>{selected.pack}</span>}
              </div>
            </div>

            {/* Status flow */}
            <div className="adm-status-bar">
              {STATUS_FLOW.map(s => (
                <button
                  key={s}
                  className={`adm-status-btn ${selected.status === s ? 'adm-status-btn--active' : ''}`}
                  onClick={() => changeStatus(s)}
                >
                  {STATUS_CONFIG[s].label}
                </button>
              ))}
            </div>

            {/* Panel tabs */}
            <div className="adm-panel-tabs">
              <div
                className={`adm-ptab ${activePanel === 'chat' ? 'adm-ptab--active' : ''}`}
                onClick={() => setActivePanel('chat')}
              >
                💬 Messages
              </div>
              <div
                className={`adm-ptab ${activePanel === 'demos' ? 'adm-ptab--active' : ''}`}
                onClick={() => setActivePanel('demos')}
              >
                🖥️ Démos & Livraison
              </div>
            </div>

            {/* Chat panel */}
            {activePanel === 'chat' && (
              <>
                <div className="adm-chat" ref={chatRef}>
                  {selected.msgs.map(m => (
                    <div key={m.id} className={`adm-bubble adm-bubble--${m.sender}`}>
                      {m.text}
                      <div className="adm-bubble-ts">
                        {m.ts} {m.sender === 'admin' && <CheckCheck size={10} />}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="adm-chat-inp">
                  <textarea
                    className="adm-chat-field" rows={1}
                    placeholder="Répondre..."
                    value={msg}
                    onChange={e => setMsg(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg() } }}
                  />
                  <button className="adm-chat-send" onClick={sendMsg}><Send size={14} /></button>
                </div>
              </>
            )}

            {/* Demos panel */}
            {activePanel === 'demos' && (
              <DemoPanel lead={selected} onUpdate={updateLead} />
            )}

          </div>
        )}
      </div>
    </>
  )
}
