'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { WalaupSound } from '@/lib/sound'
import {
  Search, Send, Paperclip, ChevronDown, X, CheckCheck,
  MessageCircle, Phone, Mail, Package, CreditCard, Clock,
  CheckCircle2, AlertCircle, Truck, User, ArrowRight
} from 'lucide-react'

// ── Mock leads (realistic Tunisian data) ──────────────────────────
const MOCK_LEADS = [
  {
    id: '1', name: 'Mehdi Bouaziz', phone: '+216 97 234 567', email: 'mehdi.b@gmail.com',
    app: 'App Café & Restaurant', pack: 'Pro', status: 'demo',
    lastMsg: 'La démo est prête, tu peux la voir 👀', time: '14:32',
    unread: 2, source: 'marketplace', created: '02/04/2026',
    msgs: [
      { id: 'm1', sender: 'client', text: 'Bonjour, j\'ai soumis une demande pour une app café', ts: '09:00' },
      { id: 'm2', sender: 'admin',  text: 'Bonjour Mehdi ! On a bien reçu ta demande. La démo sera prête dans 24h.', ts: '09:15' },
      { id: 'm3', sender: 'client', text: 'Super, merci. Quand est-ce que je peux tester ?', ts: '10:30' },
      { id: 'm4', sender: 'admin',  text: 'La démo est prête, tu peux la voir 👀', ts: '14:32' },
    ]
  },
  {
    id: '2', name: 'Sonia Mejri', phone: '+216 52 891 003', email: 'sonia.m@hotmail.fr',
    app: 'App Grossiste Recharge', pack: 'Essentiel', status: 'payment_requested',
    lastMsg: 'Quand est-ce que je peux payer ?', time: 'Hier',
    unread: 0, source: 'estimateur', created: '01/04/2026',
    msgs: [
      { id: 'm1', sender: 'admin',  text: 'Bonjour Sonia, votre démo est validée. Paiement requis pour continuer.', ts: '11:00' },
      { id: 'm2', sender: 'client', text: 'Quand est-ce que je peux payer ?', ts: '16:45' },
    ]
  },
  {
    id: '3', name: 'Ahmed Trabelsi', phone: '+216 25 660 812', email: 'ahmed.t@mail.tn',
    app: 'App Stock & Inventaire', pack: 'Partenaire', status: 'delivered',
    lastMsg: 'Merci infiniment, l\'app est parfaite !', time: 'Lun',
    unread: 0, source: 'direct', created: '25/03/2026',
    msgs: [
      { id: 'm1', sender: 'client', text: 'Merci infiniment, l\'app est parfaite !', ts: '10:00' },
      { id: 'm2', sender: 'admin',  text: 'Avec plaisir Ahmed ! N\'hésitez pas pour toute question.', ts: '10:20' },
    ]
  },
  {
    id: '4', name: 'Karim Lakhal', phone: '+216 20 453 900', email: 'k.lakhal@outlook.com',
    app: 'App Crèche', pack: 'Pro', status: 'new',
    lastMsg: 'Bonjour, je voudrais une démo gratuite', time: 'Dim',
    unread: 1, source: 'marketplace', created: '06/04/2026',
    msgs: [
      { id: 'm1', sender: 'client', text: 'Bonjour, je voudrais une démo gratuite pour une app crèche', ts: '15:12' },
    ]
  },
  {
    id: '5', name: 'Nadia Khediri', phone: '+216 93 012 445', email: 'nadia.k@gmail.com',
    app: 'App Livraison', pack: 'Pro', status: 'dev',
    lastMsg: 'Parfait, on commence le développement', time: 'Ven',
    unread: 0, source: 'estimateur', created: '28/03/2026',
    msgs: [
      { id: 'm1', sender: 'admin', text: 'Parfait, on commence le développement de votre app livraison.', ts: '09:30' },
    ]
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
  { id: 'flouci',   label: 'Flouci',    emoji: '📱', desc: 'Mobile wallet' },
  { id: 'konnect',  label: 'Konnect',   emoji: '💳', desc: 'Carte bancaire' },
  { id: 'd17',      label: 'D17',       emoji: '📲', desc: 'Mobile payment' },
  { id: 'virement', label: 'Virement',  emoji: '🏦', desc: 'Bancaire manuel' },
  { id: 'especes',  label: 'Espèces',   emoji: '💵', desc: 'En main propre' },
  { id: 'cheque',   label: 'Chèque',    emoji: '📄', desc: 'Confirmation admin' },
]

const STATUS_FLOW = ['new', 'demo', 'dev', 'payment_requested', 'payment_confirmed', 'delivered']

function PaymentModal({ lead, onClose }) {
  const [method, setMethod] = useState('flouci')
  const [amount, setAmount] = useState('450')
  const [sent, setSent] = useState(false)

  const handleSend = () => {
    WalaupSound.success?.()
    setSent(true)
    setTimeout(onClose, 1800)
  }

  return (
    <div className="adm-modal-overlay" onClick={onClose}>
      <div className="adm-modal" onClick={e => e.stopPropagation()}>
        <div className="adm-modal-head">
          <div className="adm-modal-title">Demander le paiement</div>
          <button className="adm-modal-close" onClick={onClose}><X size={16} /></button>
        </div>

        {sent ? (
          <div className="adm-modal-success">
            <CheckCircle2 size={40} color="#10B981" />
            <div>Demande envoyée à {lead.name}</div>
          </div>
        ) : (
          <>
            <div className="adm-modal-label">Client</div>
            <div className="adm-modal-info">{lead.name} — {lead.app}</div>

            <div className="adm-modal-label" style={{ marginTop: 16 }}>Montant (DT)</div>
            <input
              className="adm-modal-input"
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="450"
            />

            <div className="adm-modal-label" style={{ marginTop: 16 }}>Méthode de paiement</div>
            <div className="adm-pm-grid">
              {PAYMENT_METHODS.map(pm => (
                <div
                  key={pm.id}
                  className={`adm-pm-card ${method === pm.id ? 'adm-pm-card--active' : ''}`}
                  onClick={() => setMethod(pm.id)}
                >
                  <span style={{ fontSize: 20 }}>{pm.emoji}</span>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--tx)' }}>{pm.label}</div>
                  <div style={{ fontSize: 10, color: 'var(--tx-3)' }}>{pm.desc}</div>
                </div>
              ))}
            </div>

            <div className="adm-modal-note">
              ⚠️ Mock — le paiement sera intégré avec Flouci/Konnect/D17 en production
            </div>

            <button className="adm-modal-btn" onClick={handleSend}>
              Envoyer la demande — {amount} DT via {PAYMENT_METHODS.find(p => p.id === method)?.label}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default function TabClients() {
  const [leads, setLeads] = useState(MOCK_LEADS)
  const [selected, setSelected] = useState(MOCK_LEADS[0])
  const [search, setSearch] = useState('')
  const [msg, setMsg] = useState('')
  const [showPayModal, setShowPayModal] = useState(false)
  const [adminTyping, setAdminTyping] = useState(false)
  const chatRef = useRef(null)
  const typingTimer = useRef(null)

  const filtered = leads.filter(l =>
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    l.phone.includes(search) ||
    l.app.toLowerCase().includes(search.toLowerCase())
  )

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
  }, [selected?.msgs])

  const sendMsg = () => {
    if (!msg.trim() || !selected) return
    const newMsg = { id: Date.now().toString(), sender: 'admin', text: msg, ts: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) }
    setLeads(prev => prev.map(l => l.id === selected.id ? { ...l, msgs: [...l.msgs, newMsg], lastMsg: msg, unread: 0 } : l))
    setSelected(prev => ({ ...prev, msgs: [...prev.msgs, newMsg] }))
    setMsg('')
    WalaupSound.send?.()
  }

  const handleTyping = (v) => {
    setMsg(v)
    setAdminTyping(true)
    clearTimeout(typingTimer.current)
    typingTimer.current = setTimeout(() => setAdminTyping(false), 2000)
  }

  const changeStatus = (newStatus) => {
    setLeads(prev => prev.map(l => l.id === selected.id ? { ...l, status: newStatus } : l))
    setSelected(prev => ({ ...prev, status: newStatus }))
    WalaupSound.success?.()
  }

  const CSS = `
    .adm-cl { display:flex; height:100%; overflow:hidden; }

    /* ── LEFT LIST ── */
    .adm-cl-list { width:280px; flex-shrink:0; border-right:1px solid rgba(255,255,255,0.07);
      display:flex; flex-direction:column; }
    .adm-cl-search { padding:12px; border-bottom:1px solid rgba(255,255,255,0.06); }
    .adm-cl-sinp { width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09);
      border-radius:10px; padding:8px 10px 8px 32px; color:var(--tx); font-size:12px; outline:none; }
    .adm-cl-sinp:focus { border-color:rgba(99,102,241,0.4); }
    .adm-cl-sico { position:absolute; left:22px; top:50%; transform:translateY(-50%); pointer-events:none; }
    .adm-cl-swr { position:relative; }
    .adm-cl-items { flex:1; overflow-y:auto; }
    .adm-cl-items::-webkit-scrollbar { width:3px; }
    .adm-cl-items::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.08); border-radius:2px; }
    .adm-cl-item { padding:12px 14px; border-bottom:1px solid rgba(255,255,255,0.04);
      cursor:pointer; transition:background 150ms; }
    .adm-cl-item:hover { background:rgba(255,255,255,0.03); }
    .adm-cl-item--active { background:rgba(99,102,241,0.1); }
    .adm-cl-item-row1 { display:flex; justify-content:space-between; align-items:center; margin-bottom:4px; }
    .adm-cl-item-name { font-size:13px; font-weight:600; color:var(--tx); }
    .adm-cl-item-time { font-size:10px; color:var(--tx-3); }
    .adm-cl-item-row2 { display:flex; justify-content:space-between; align-items:center; }
    .adm-cl-item-msg { font-size:11px; color:var(--tx-3); white-space:nowrap;
      overflow:hidden; text-overflow:ellipsis; max-width:160px; }
    .adm-cl-item-badge { width:16px; height:16px; border-radius:8px; background:var(--red);
      font-size:9px; color:#fff; font-weight:700; display:flex; align-items:center; justify-content:center; }

    /* ── RIGHT DETAIL ── */
    .adm-cl-detail { flex:1; display:flex; flex-direction:column; min-width:0; overflow:hidden; }

    /* Info bar */
    .adm-cl-info { padding:14px 18px; border-bottom:1px solid rgba(255,255,255,0.07);
      display:flex; align-items:center; gap:12px; flex-shrink:0; flex-wrap:wrap; }
    .adm-cl-avatar { width:38px; height:38px; border-radius:50%; flex-shrink:0;
      background:linear-gradient(135deg,#6366F1,#8B5CF6);
      display:flex; align-items:center; justify-content:center;
      font-weight:800; font-size:14px; color:#fff; font-family:'Space Grotesk',sans-serif; }
    .adm-cl-meta { flex:1; min-width:0; }
    .adm-cl-meta-name { font-weight:700; font-size:14px; color:var(--tx); }
    .adm-cl-meta-app { font-size:11px; color:var(--tx-3); margin-top:2px; }
    .adm-cl-badges { display:flex; gap:6px; flex-wrap:wrap; align-items:center; }
    .adm-badge { padding:3px 9px; border-radius:20px; font-size:10px; font-weight:700; }

    /* Status selector */
    .adm-status-bar { padding:10px 18px; border-bottom:1px solid rgba(255,255,255,0.06);
      display:flex; gap:6px; flex-wrap:wrap; align-items:center; flex-shrink:0; }
    .adm-status-btn { padding:4px 10px; border-radius:8px; font-size:11px; font-weight:600;
      cursor:pointer; border:1px solid rgba(255,255,255,0.1); background:transparent;
      color:var(--tx-2); transition:all 150ms; }
    .adm-status-btn:hover { background:rgba(99,102,241,0.1); border-color:rgba(99,102,241,0.3); color:var(--tx); }
    .adm-status-btn--active { background:rgba(99,102,241,0.15); border-color:rgba(99,102,241,0.4); color:var(--ac); }
    .adm-pay-btn { margin-left:auto; padding:5px 14px; border-radius:8px;
      background:linear-gradient(135deg,#F59E0B,#D97706); border:none;
      color:#000; font-size:11px; font-weight:700; cursor:pointer; transition:transform 150ms; }
    .adm-pay-btn:hover { transform:scale(1.03); }
    .adm-pay-btn:active { transform:scale(0.97); }

    /* Chat */
    .adm-chat { flex:1; overflow-y:auto; padding:16px 18px; display:flex; flex-direction:column; gap:8px; }
    .adm-chat::-webkit-scrollbar { width:3px; }
    .adm-chat::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.08); border-radius:2px; }
    .adm-bubble { max-width:72%; padding:9px 13px; border-radius:14px;
      font-size:13px; line-height:1.5; position:relative; }
    .adm-bubble--admin { align-self:flex-end; background:linear-gradient(135deg,#6366F1,#8B5CF6); color:#fff;
      border-bottom-right-radius:4px; }
    .adm-bubble--client { align-self:flex-start; background:rgba(255,255,255,0.07);
      border:1px solid rgba(255,255,255,0.1); color:var(--tx); border-bottom-left-radius:4px; }
    .adm-bubble-ts { font-size:10px; opacity:.6; margin-top:4px; text-align:right; }
    .adm-typing { align-self:flex-start; background:rgba(255,255,255,0.06);
      border-radius:12px; padding:8px 14px; font-size:12px; color:var(--tx-3); }

    /* Chat input */
    .adm-chat-inp { padding:12px 14px; border-top:1px solid rgba(255,255,255,0.07);
      display:flex; gap:8px; align-items:center; flex-shrink:0; }
    .adm-chat-field { flex:1; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09);
      border-radius:10px; padding:9px 12px; color:var(--tx); font-size:13px; outline:none;
      resize:none; font-family:'Inter',sans-serif; }
    .adm-chat-field:focus { border-color:rgba(99,102,241,0.4); }
    .adm-chat-send { width:36px; height:36px; border-radius:10px;
      background:linear-gradient(135deg,#6366F1,#8B5CF6); border:none;
      display:flex; align-items:center; justify-content:center; cursor:pointer;
      color:#fff; transition:transform 150ms; }
    .adm-chat-send:hover { transform:scale(1.07); }
    .adm-chat-send:active { transform:scale(0.93); }

    /* Modal */
    .adm-modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.7); z-index:9000;
      display:flex; align-items:center; justify-content:center; backdrop-filter:blur(4px); }
    .adm-modal { background:#0D1120; border:1px solid rgba(255,255,255,0.12); border-radius:18px;
      padding:24px; width:460px; max-width:90vw; box-shadow:0 24px 80px rgba(0,0,0,0.7); }
    .adm-modal-head { display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; }
    .adm-modal-title { font-family:'Space Grotesk',sans-serif; font-weight:800; font-size:16px; color:var(--tx); }
    .adm-modal-close { width:28px; height:28px; border-radius:8px; border:none;
      background:rgba(255,255,255,0.07); color:var(--tx-2); cursor:pointer; display:flex; align-items:center; justify-content:center; }
    .adm-modal-label { font-size:11px; font-weight:600; color:var(--tx-3); text-transform:uppercase;
      letter-spacing:.06em; margin-bottom:6px; }
    .adm-modal-info { font-size:14px; color:var(--tx); font-weight:500; }
    .adm-modal-input { width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1);
      border-radius:10px; padding:10px 12px; color:var(--tx); font-size:14px;
      outline:none; font-family:'JetBrains Mono',monospace; }
    .adm-modal-input:focus { border-color:rgba(99,102,241,0.4); }
    .adm-pm-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin-top:8px; }
    .adm-pm-card { padding:10px 8px; border-radius:10px; border:1px solid rgba(255,255,255,0.09);
      background:rgba(255,255,255,0.03); cursor:pointer; text-align:center;
      display:flex; flex-direction:column; align-items:center; gap:4px;
      transition:all 150ms; }
    .adm-pm-card:hover { border-color:rgba(99,102,241,0.3); background:rgba(99,102,241,0.08); }
    .adm-pm-card--active { border-color:rgba(99,102,241,0.5); background:rgba(99,102,241,0.14); }
    .adm-modal-note { margin-top:14px; padding:8px 12px; border-radius:8px;
      background:rgba(245,158,11,0.08); border:1px solid rgba(245,158,11,0.2);
      font-size:11px; color:#F59E0B; }
    .adm-modal-btn { margin-top:16px; width:100%; padding:12px; border-radius:11px;
      background:linear-gradient(135deg,#6366F1,#8B5CF6); border:none;
      color:#fff; font-size:13px; font-weight:700; cursor:pointer;
      font-family:'Space Grotesk',sans-serif; transition:transform 150ms;
      box-shadow:0 0 30px rgba(99,102,241,0.3); }
    .adm-modal-btn:hover { transform:scale(1.02); }
    .adm-modal-success { display:flex; flex-direction:column; align-items:center;
      gap:14px; padding:30px; font-size:15px; color:var(--green); font-weight:600; }

    @media(max-width:768px) {
      .adm-cl-list { width:100%; border-right:none; display:${selected ? 'none' : 'flex'}; }
    }
  `

  const sc = selected ? STATUS_CONFIG[selected.status] : null
  const pc = selected ? PACK_COLOR[selected.pack] : null

  return (
    <>
      <style>{CSS}</style>
      <div className="adm-cl">
        {/* LEFT — Lead list */}
        <div className="adm-cl-list">
          <div className="adm-cl-search">
            <div className="adm-cl-swr">
              <Search size={13} color="var(--tx-3)" className="adm-cl-sico" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                className="adm-cl-sinp"
                placeholder="Rechercher..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="adm-cl-items">
            {filtered.map(lead => (
              <div
                key={lead.id}
                className={`adm-cl-item ${selected?.id === lead.id ? 'adm-cl-item--active' : ''}`}
                onClick={() => { setSelected(lead); WalaupSound.tab?.() }}
              >
                <div className="adm-cl-item-row1">
                  <span className="adm-cl-item-name">{lead.name}</span>
                  <span className="adm-cl-item-time">{lead.time}</span>
                </div>
                <div className="adm-cl-item-row2">
                  <span className="adm-cl-item-msg">{lead.lastMsg}</span>
                  {lead.unread > 0 && <span className="adm-cl-item-badge">{lead.unread}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — Detail */}
        {selected && (
          <div className="adm-cl-detail">
            {/* Info bar */}
            <div className="adm-cl-info">
              <div className="adm-cl-avatar">{selected.name[0]}</div>
              <div className="adm-cl-meta">
                <div className="adm-cl-meta-name">{selected.name}</div>
                <div className="adm-cl-meta-app">{selected.phone} · {selected.app}</div>
              </div>
              <div className="adm-cl-badges">
                {sc && (
                  <span className="adm-badge" style={{ color: sc.color, background: sc.bg }}>
                    {sc.label}
                  </span>
                )}
                {pc && (
                  <span className="adm-badge" style={{ color: pc.color, background: pc.bg }}>
                    {selected.pack}
                  </span>
                )}
              </div>
            </div>

            {/* Status bar */}
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
              <button className="adm-pay-btn" onClick={() => setShowPayModal(true)}>
                💳 Demander paiement
              </button>
            </div>

            {/* Chat */}
            <div className="adm-chat" ref={chatRef}>
              {selected.msgs.map(m => (
                <div key={m.id} className={`adm-bubble adm-bubble--${m.sender}`}>
                  {m.text}
                  <div className="adm-bubble-ts">{m.ts} {m.sender === 'admin' && <CheckCheck size={10} />}</div>
                </div>
              ))}
              {adminTyping && <div className="adm-typing">Walaup écrit...</div>}
            </div>

            {/* Input */}
            <div className="adm-chat-inp">
              <textarea
                className="adm-chat-field"
                rows={1}
                placeholder="Répondre à ce client..."
                value={msg}
                onChange={e => handleTyping(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg() } }}
              />
              <button className="adm-chat-send" onClick={sendMsg}>
                <Send size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {showPayModal && <PaymentModal lead={selected} onClose={() => setShowPayModal(false)} />}
    </>
  )
}
