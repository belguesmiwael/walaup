'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Search, Send, CheckCheck, X, Eye, Smartphone, Monitor,
  CheckCircle2, CreditCard, Rocket, ArrowLeft, User,
  MessageSquare, Link2, AlertCircle, RefreshCw
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

// ─── Demo meta helpers ────────────────────────────────────────────────────────
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
    if (note.startsWith('walaup_demos:')) {
      return { ...deepClone(DEMO_DEFAULT), ...JSON.parse(note.slice(13)) }
    }
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

// ─── Config ───────────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  new:               { label: 'Nouveau',           color: '#22D3EE', bg: 'rgba(34,211,238,0.1)'  },
  demo:              { label: 'Démo prête',        color: '#6366F1', bg: 'rgba(99,102,241,0.1)'  },
  dev:               { label: 'En développement',  color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  payment_requested: { label: 'Paiement demandé',  color: '#FB923C', bg: 'rgba(251,146,60,0.1)'  },
  payment_confirmed: { label: 'Paiement confirmé', color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
  delivered:         { label: 'Livré',             color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
  cancelled:         { label: 'Annulé',            color: '#F87171', bg: 'rgba(248,113,113,0.1)'},
}

const PAYMENT_METHODS = [
  { id: 'flouci',   label: 'Flouci',   emoji: '📱' },
  { id: 'konnect',  label: 'Konnect',  emoji: '💳' },
  { id: 'd17',      label: 'D17',      emoji: '📲' },
  { id: 'virement', label: 'Virement', emoji: '🏦' },
  { id: 'especes',  label: 'Espèces',  emoji: '💵' },
  { id: 'cheque',   label: 'Chèque',   emoji: '📄' },
]

const DEMO_STATUS_UI = {
  locked:           { label: '🔒 Verrouillée',           color: '#525878', bg: 'rgba(82,88,120,0.12)'  },
  pending:          { label: '✏️ Prête à envoyer',       color: '#22D3EE', bg: 'rgba(34,211,238,0.1)'  },
  sent:             { label: '📨 Envoyée au client',     color: '#6366F1', bg: 'rgba(99,102,241,0.1)'  },
  modify_requested: { label: '↩️ Modification demandée', color: '#FB923C', bg: 'rgba(251,146,60,0.1)'  },
  validated:        { label: '✅ Validée par client',    color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  disabled:         { label: '🚫 Désactivée',            color: '#374151', bg: 'rgba(55,65,81,0.1)'   },
}

const CSS = `
  .tc-root { height:100%; overflow:hidden; display:flex; flex-direction:column; }

  /* LIST */
  .tc-list { flex:1; display:flex; flex-direction:column; overflow:hidden; }
  .tc-list-head { padding:14px 16px; border-bottom:1px solid rgba(255,255,255,0.07); display:flex; align-items:center; gap:10px; flex-shrink:0; }
  .tc-list-title { font-family:'Space Grotesk',sans-serif; font-weight:800; font-size:18px; color:var(--tx); }
  .tc-list-search { flex:1; position:relative; }
  .tc-sinp { width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09); border-radius:10px; padding:8px 10px 8px 34px; color:var(--tx); font-size:12px; outline:none; box-sizing:border-box; }
  .tc-sinp:focus { border-color:rgba(99,102,241,0.4); }
  .tc-sico { position:absolute; left:10px; top:50%; transform:translateY(-50%); pointer-events:none; }
  .tc-list-scroll { flex:1; overflow-y:auto; padding:12px; display:flex; flex-direction:column; gap:8px; }
  .tc-list-scroll::-webkit-scrollbar { width:3px; }
  .tc-list-scroll::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.08); border-radius:2px; }
  .tc-lead-card { padding:14px 16px; border-radius:12px; background:rgba(13,17,32,0.6); border:1px solid rgba(255,255,255,0.07); cursor:pointer; transition:all 180ms; display:flex; align-items:center; gap:12px; }
  .tc-lead-card:hover { border-color:rgba(99,102,241,0.3); transform:translateX(3px); }
  .tc-avatar { width:40px; height:40px; border-radius:50%; flex-shrink:0; background:linear-gradient(135deg,#6366F1,#8B5CF6); display:flex; align-items:center; justify-content:center; font-weight:800; font-size:14px; color:#fff; font-family:'Space Grotesk',sans-serif; }
  .tc-avatar--sm { width:32px; height:32px; font-size:12px; }
  .tc-lead-info { flex:1; min-width:0; }
  .tc-lead-name { font-weight:700; font-size:13px; color:var(--tx); margin-bottom:2px; }
  .tc-lead-meta { font-size:11px; color:var(--tx-3); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .tc-lead-right { display:flex; flex-direction:column; align-items:flex-end; gap:5px; flex-shrink:0; }
  .tc-badge { padding:2px 8px; border-radius:20px; font-size:10px; font-weight:700; }
  .tc-unread-dot { width:17px; height:17px; border-radius:9px; background:var(--red); font-size:9px; color:#fff; font-weight:700; display:flex; align-items:center; justify-content:center; }
  .tc-empty { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; color:var(--tx-3); font-size:13px; padding:40px; }

  /* DETAIL */
  .tc-detail { flex:1; display:flex; flex-direction:column; overflow:hidden; }
  .tc-detail-head { padding:12px 16px; border-bottom:1px solid rgba(255,255,255,0.07); display:flex; align-items:center; gap:10px; flex-shrink:0; background:rgba(10,14,28,0.7); backdrop-filter:blur(12px); }
  .tc-back-btn { display:flex; align-items:center; gap:6px; padding:6px 12px; border-radius:9px; border:1px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.04); color:var(--tx-2); font-size:12px; font-weight:600; cursor:pointer; transition:all 160ms; font-family:'Inter',sans-serif; flex-shrink:0; }
  .tc-back-btn:hover { background:rgba(255,255,255,0.09); color:var(--tx); }
  .tc-detail-name { font-weight:700; font-size:14px; color:var(--tx); flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .tc-tab-btns { display:flex; gap:5px; flex-shrink:0; }
  .tc-tab-btn { padding:7px 14px; border-radius:9px; font-size:12px; font-weight:600; cursor:pointer; border:1px solid transparent; transition:all 160ms; background:transparent; color:var(--tx-3); font-family:'Inter',sans-serif; display:flex; align-items:center; gap:5px; }
  .tc-tab-btn--active { background:rgba(99,102,241,0.15); border-color:rgba(99,102,241,0.35); color:var(--ac); }

  /* INFO TAB */
  .tc-info { flex:1; overflow-y:auto; padding:16px; display:flex; flex-direction:column; gap:12px; }
  .tc-info::-webkit-scrollbar { width:3px; }
  .tc-info::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.08); border-radius:2px; }
  .tc-section { background:rgba(13,17,32,0.65); border:1px solid rgba(255,255,255,0.07); border-radius:14px; padding:16px; }
  .tc-section-title { font-size:10px; font-weight:700; color:var(--tx-3); letter-spacing:.08em; text-transform:uppercase; margin-bottom:12px; display:flex; align-items:center; gap:6px; }
  .tc-grid2 { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
  @media(max-width:600px){ .tc-grid2 { grid-template-columns:1fr; } }
  .tc-field label { display:block; font-size:10px; font-weight:600; color:var(--tx-3); text-transform:uppercase; letter-spacing:.05em; margin-bottom:3px; }
  .tc-field span { font-size:13px; color:var(--tx); font-weight:500; }
  .tc-status-bar { display:flex; gap:5px; flex-wrap:wrap; padding-top:12px; border-top:1px solid rgba(255,255,255,0.06); margin-top:12px; align-items:center; }
  .tc-status-bar-label { font-size:10px; color:var(--tx-3); flex-shrink:0; }
  .tc-status-btn { padding:4px 9px; border-radius:7px; font-size:10px; font-weight:600; cursor:pointer; border:1px solid rgba(255,255,255,0.1); background:transparent; color:var(--tx-2); transition:all 150ms; font-family:'Inter',sans-serif; }
  .tc-status-btn:hover { background:rgba(99,102,241,0.1); color:var(--tx); }
  .tc-status-btn--active { background:rgba(99,102,241,0.15); border-color:rgba(99,102,241,0.4); color:var(--ac); }

  /* DEMO PANEL */
  .tc-demo-slot { border:1px solid rgba(255,255,255,0.07); border-radius:11px; padding:12px; margin-bottom:9px; background:rgba(8,11,20,0.5); transition:border-color 200ms; }
  .tc-demo-slot--validated { border-color:rgba(16,185,129,0.3); }
  .tc-demo-slot--dim { opacity:0.38; pointer-events:none; }
  .tc-demo-head { display:flex; align-items:center; gap:8px; margin-bottom:9px; }
  .tc-demo-num { font-size:12px; font-weight:800; color:var(--tx); font-family:'Space Grotesk',sans-serif; }
  .tc-demo-badge { padding:2px 8px; border-radius:20px; font-size:10px; font-weight:600; }
  .tc-demo-url-row { display:flex; gap:5px; margin-bottom:7px; }
  .tc-demo-inp { flex:1; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.09); border-radius:7px; padding:6px 9px; color:var(--tx); font-size:11px; outline:none; font-family:'JetBrains Mono',monospace; }
  .tc-demo-inp:focus { border-color:rgba(99,102,241,0.4); }
  .tc-demo-actions { display:flex; gap:5px; flex-wrap:wrap; }
  .tc-demo-btn { display:flex; align-items:center; gap:5px; padding:5px 11px; border-radius:7px; border:none; font-size:11px; font-weight:700; cursor:pointer; transition:all 150ms; font-family:'Inter',sans-serif; }
  .tc-demo-btn:disabled { opacity:0.45; cursor:not-allowed; }
  .tc-demo-btn--send { background:linear-gradient(135deg,#6366F1,#8B5CF6); color:#fff; }
  .tc-demo-btn--preview { background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); color:var(--tx-2); }
  .tc-demo-btn--disable { background:rgba(248,113,113,0.09); border:1px solid rgba(248,113,113,0.18); color:#F87171; }

  .tc-pay-box { border:1px solid rgba(245,158,11,0.2); border-radius:11px; padding:13px; background:rgba(245,158,11,0.04); margin-top:9px; }
  .tc-pay-title { font-size:11px; font-weight:700; color:var(--gold); margin-bottom:9px; display:flex; align-items:center; gap:6px; }
  .tc-pay-methods { display:flex; gap:5px; flex-wrap:wrap; margin-bottom:8px; }
  .tc-pay-method { padding:4px 9px; border-radius:7px; font-size:10px; font-weight:600; cursor:pointer; border:1px solid; transition:all 150ms; font-family:'Inter',sans-serif; }
  .tc-pay-inp { width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:8px 11px; color:var(--tx); font-size:13px; outline:none; box-sizing:border-box; margin-bottom:8px; font-family:'JetBrains Mono',monospace; }
  .tc-pay-btn { display:flex; align-items:center; gap:6px; padding:8px 15px; border-radius:9px; border:none; font-size:12px; font-weight:700; cursor:pointer; font-family:'Inter',sans-serif; }
  .tc-pay-btn--gold { background:linear-gradient(135deg,#F59E0B,#D97706); color:#000; }
  .tc-pay-btn--green { background:linear-gradient(135deg,#10B981,#059669); color:#fff; }
  .tc-pay-btn:disabled { opacity:.5; cursor:not-allowed; }

  .tc-final-box { border:1px solid rgba(16,185,129,0.25); border-radius:11px; padding:13px; background:rgba(16,185,129,0.04); margin-top:9px; }
  .tc-final-title { font-size:11px; font-weight:700; color:#10B981; margin-bottom:9px; display:flex; align-items:center; gap:6px; }
  .tc-final-row { display:flex; gap:7px; }
  .tc-final-inp { flex:1; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:7px 10px; color:var(--tx); font-size:11px; outline:none; font-family:'JetBrains Mono',monospace; }
  .tc-deliver-btn { display:flex; align-items:center; gap:5px; padding:7px 14px; border-radius:9px; border:none; background:linear-gradient(135deg,#10B981,#059669); color:#fff; font-size:12px; font-weight:700; cursor:pointer; white-space:nowrap; font-family:'Inter',sans-serif; }
  .tc-deliver-btn:disabled { opacity:.5; cursor:not-allowed; }

  /* CHAT */
  .tc-chat { flex:1; overflow-y:auto; padding:14px 16px; display:flex; flex-direction:column; gap:7px; }
  .tc-chat::-webkit-scrollbar { width:3px; }
  .tc-chat::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.08); border-radius:2px; }
  .tc-bubble { max-width:72%; padding:8px 12px; border-radius:14px; font-size:13px; line-height:1.5; word-break:break-word; }
  .tc-bubble--admin { align-self:flex-end; background:linear-gradient(135deg,#6366F1,#8B5CF6); color:#fff; border-bottom-right-radius:4px; }
  .tc-bubble--client { align-self:flex-start; background:rgba(255,255,255,0.07); border:1px solid rgba(255,255,255,0.1); color:var(--tx); border-bottom-left-radius:4px; }
  .tc-bubble-ts { font-size:10px; opacity:.6; margin-top:3px; text-align:right; }
  .tc-no-msgs { text-align:center; color:var(--tx-3); font-size:12px; padding:28px; }
  .tc-chat-inp { padding:10px 14px; border-top:1px solid rgba(255,255,255,0.07); display:flex; gap:8px; align-items:flex-end; flex-shrink:0; }
  .tc-chat-field { flex:1; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09); border-radius:10px; padding:8px 12px; color:var(--tx); font-size:13px; outline:none; resize:none; font-family:'Inter',sans-serif; max-height:100px; }
  .tc-chat-field:focus { border-color:rgba(99,102,241,0.4); }
  .tc-chat-send { width:36px; height:36px; border-radius:10px; background:linear-gradient(135deg,#6366F1,#8B5CF6); border:none; display:flex; align-items:center; justify-content:center; cursor:pointer; color:#fff; transition:transform 150ms; flex-shrink:0; }
  .tc-chat-send:hover { transform:scale(1.08); }
  .tc-chat-send:disabled { opacity:.5; cursor:not-allowed; transform:none; }

  /* PREVIEW */
  .tc-prev-ov { position:fixed; inset:0; background:rgba(0,0,0,0.88); z-index:9999; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:20px; }
  .tc-prev-head { padding:10px 14px; border-bottom:1px solid rgba(255,255,255,0.08); display:flex; gap:8px; align-items:center; background:rgba(13,17,32,0.9); }
  .tc-prev-url { flex:1; font-size:11px; color:var(--tx-3); font-family:'JetBrains Mono',monospace; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .tc-toggle-wrap { display:flex; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09); border-radius:8px; padding:2px; gap:2px; }
  .tc-toggle-btn { padding:4px 10px; border-radius:6px; border:none; font-size:11px; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:4px; background:transparent; color:var(--tx-3); font-family:'Inter',sans-serif; }
  .tc-toggle-btn--on { background:rgba(99,102,241,0.2); color:var(--ac); }
  .tc-close-btn { width:28px; height:28px; border-radius:7px; border:none; background:rgba(248,113,113,0.12); color:#F87171; cursor:pointer; display:flex; align-items:center; justify-content:center; }
  .tc-phone-shell { background:rgba(13,17,32,0.95); border:2px solid rgba(255,255,255,0.15); border-radius:36px; padding:14px; box-shadow:0 40px 100px rgba(0,0,0,0.8); }
  .tc-phone-notch { width:60px; height:5px; background:rgba(255,255,255,0.1); border-radius:3px; margin:0 auto 10px; }
  .tc-phone-screen { width:260px; height:520px; border-radius:24px; overflow:hidden; background:#000; }
  .tc-browser-bar { background:rgba(17,24,39,0.9); border-bottom:1px solid rgba(255,255,255,0.06); padding:8px 14px; display:flex; align-items:center; gap:10px; }
  .tc-browser-dots { display:flex; gap:5px; }
  .tc-browser-dot { width:9px; height:9px; border-radius:50%; }
  .tc-browser-url { flex:1; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.08); border-radius:5px; padding:3px 10px; font-size:11px; color:var(--tx-3); font-family:'JetBrains Mono',monospace; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
`

// ─── Preview modal ────────────────────────────────────────────────────────────
function PreviewModal({ url, onClose }) {
  const [mode, setMode] = useState('browser')
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
    <div className="tc-prev-ov" onClick={onClose}>
      <div style={{ background: '#0D1120', borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 40px 100px rgba(0,0,0,0.8)', width: mode === 'mobile' ? 'auto' : 'min(900px,92vw)', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}>
        <div className="tc-prev-head">
          <span className="tc-prev-url">{url}</span>
          <div className="tc-toggle-wrap">
            <button className={`tc-toggle-btn${mode === 'mobile' ? ' tc-toggle-btn--on' : ''}`} onClick={() => setMode('mobile')}><Smartphone size={11} /> Mobile</button>
            <button className={`tc-toggle-btn${mode === 'browser' ? ' tc-toggle-btn--on' : ''}`} onClick={() => setMode('browser')}><Monitor size={11} /> Desktop</button>
          </div>
          <button className="tc-close-btn" onClick={onClose}><X size={13} /></button>
        </div>
        {mode === 'mobile' ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}>
            <div className="tc-phone-shell">
              <div className="tc-phone-notch" />
              <div className="tc-phone-screen" ref={screenRef}>
                <iframe ref={iframeRef} src={url} sandbox="allow-scripts allow-forms allow-popups" title="preview" style={{ border: 'none', display: 'block' }} onLoad={scaleMobile} />
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="tc-browser-bar">
              <div className="tc-browser-dots">
                <div className="tc-browser-dot" style={{ background: '#F87171' }} />
                <div className="tc-browser-dot" style={{ background: '#FBBF24' }} />
                <div className="tc-browser-dot" style={{ background: '#34D399' }} />
              </div>
              <div className="tc-browser-url">{url}</div>
            </div>
            <div style={{ height: 480 }}>
              <iframe src={url} sandbox="allow-scripts allow-forms allow-popups" title="preview desktop" style={{ width: '100%', height: '100%', border: 'none', display: 'block' }} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── DemoPanel ────────────────────────────────────────────────────────────────
function DemoPanel({ lead, onRefresh }) {
  const [meta, setMetaState] = useState(() => parseDemoMeta(lead.note))
  const [demoUrls, setDemoUrls] = useState(() => {
    const u = {}; parseDemoMeta(lead.note).demos.forEach(d => { u[d.slot] = d.url || '' }); return u
  })
  const [finalUrl, setFinalUrl] = useState(() => parseDemoMeta(lead.note).finalUrl || '')
  const [payMethod, setPayMethod] = useState(lead.pay_method || 'flouci')
  const [payAmount, setPayAmount] = useState(lead.pay_amount ? String(lead.pay_amount) : '')
  const [saving, setSaving] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)

  useEffect(() => {
    const m = parseDemoMeta(lead.note)
    setMetaState(m)
    const u = {}; m.demos.forEach(d => { u[d.slot] = d.url || '' })
    setDemoUrls(u)
    setFinalUrl(m.finalUrl || '')
  }, [lead.note, lead.status, lead.pay_method, lead.pay_amount])

  const persist = async (newMeta) => {
    await supabase.from('leads').update({ note: encodeDemoMeta(newMeta) }).eq('id', lead.id)
    setMetaState(newMeta)
  }

  const sendDemo = async (slot) => {
    const url = (demoUrls[slot] || '').trim()
    if (!url) return alert('Entre l\'URL avant d\'envoyer.')
    setSaving(true)
    const m = deepClone(meta)
    const idx = m.demos.findIndex(d => d.slot === slot)
    m.demos[idx].url = url
    m.demos[idx].status = 'sent'
    await persist(m)
    await supabase.from('leads').update({ status: 'demo' }).eq('id', lead.id)
    await supabase.from('messages').insert({
      lead_id: lead.id, sender: 'admin',
      text: `🎯 Votre démo ${slot} est disponible ! Connectez-vous à votre espace pour la visualiser et nous donner votre retour.`
    })
    await onRefresh(); setSaving(false)
  }

  const disableDemo = async (slot) => {
    if (!confirm(`Désactiver la démo ${slot} ?`)) return
    setSaving(true)
    const m = deepClone(meta)
    const idx = m.demos.findIndex(d => d.slot === slot)
    m.demos[idx].status = 'disabled'
    await persist(m)
    await onRefresh(); setSaving(false)
  }

  const confirmPayment = async () => {
    if (!payAmount) return alert('Entre le montant du paiement.')
    setSaving(true)
    const m = deepClone(meta)
    m.payStatus = 'confirmed'
    await persist(m)
    await supabase.from('leads').update({
      status: 'payment_confirmed',
      pay_method: payMethod,
      pay_amount: parseFloat(payAmount) || 0,
    }).eq('id', lead.id)
    await supabase.from('messages').insert({
      lead_id: lead.id, sender: 'admin',
      text: '✅ Paiement confirmé ! Votre application est en cours de développement final. Merci pour votre confiance.'
    })
    await onRefresh(); setSaving(false)
  }

  const deliverFinal = async () => {
    const url = finalUrl.trim()
    if (!url) return alert('Entre l\'URL de la version finale.')
    setSaving(true)
    const m = deepClone(meta)
    m.demos = m.demos.map(d => ({ ...d, status: 'disabled' }))
    m.finalUrl = url
    await persist(m)
    await supabase.from('leads').update({ status: 'delivered', pay_ref: url }).eq('id', lead.id)
    await supabase.from('messages').insert({
      lead_id: lead.id, sender: 'admin',
      text: `🎉 Félicitations ! Votre application est prête et déployée : ${url}`
    })
    await onRefresh(); setSaving(false)
  }

  const payStatus = meta.payStatus || 'none'
  const isDelivered = lead.status === 'delivered'
  const validatedDemo = meta.demos.find(d => d.status === 'validated')

  return (
    <div>
      {previewUrl && <PreviewModal url={previewUrl} onClose={() => setPreviewUrl(null)} />}
      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--tx-3)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 11, display: 'flex', alignItems: 'center', gap: 6 }}>
        <Rocket size={11} color="var(--ac)" /> Démos (3 max) + Livraison finale
      </div>

      {/* Slots démo */}
      {meta.demos.map(demo => {
        const sui = DEMO_STATUS_UI[demo.status] || DEMO_STATUS_UI.locked
        const isLocked   = demo.status === 'locked'
        const isPending  = demo.status === 'pending'
        const isSent     = demo.status === 'sent'
        const isModReq   = demo.status === 'modify_requested'
        const isValidated= demo.status === 'validated'
        const isDisabled = demo.status === 'disabled'
        const canEdit    = isPending || isModReq
        const canPreview = (isSent || isValidated || isModReq) && demo.url
        const canDisable = (isSent || isModReq || isValidated) && !isDisabled

        return (
          <div key={demo.slot}
            className={`tc-demo-slot${isValidated ? ' tc-demo-slot--validated' : ''}${(isLocked || isDisabled) ? ' tc-demo-slot--dim' : ''}`}>
            <div className="tc-demo-head">
              <span className="tc-demo-num">Démo {demo.slot}</span>
              <span className="tc-demo-badge" style={{ background: sui.bg, color: sui.color }}>{sui.label}</span>
            </div>

            {(canEdit || canPreview) && (
              <div className="tc-demo-url-row">
                <input className="tc-demo-inp"
                  placeholder="https://demo.walaup.tn/..."
                  value={demoUrls[demo.slot] || ''}
                  readOnly={isValidated || isDisabled}
                  onChange={e => setDemoUrls(p => ({ ...p, [demo.slot]: e.target.value }))}
                />
              </div>
            )}

            {(isLocked || isDisabled) && demo.url && (
              <div style={{ fontSize: 11, color: 'var(--tx-3)', fontFamily: "'JetBrains Mono',monospace", marginBottom: 7, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{demo.url}</div>
            )}

            <div className="tc-demo-actions">
              {canEdit && (
                <button className="tc-demo-btn tc-demo-btn--send" onClick={() => sendDemo(demo.slot)} disabled={saving}>
                  <Send size={11} /> Envoyer au client
                </button>
              )}
              {canPreview && (
                <button className="tc-demo-btn tc-demo-btn--preview" onClick={() => setPreviewUrl(demo.url)}>
                  <Eye size={11} /> Aperçu
                </button>
              )}
              {canDisable && (
                <button className="tc-demo-btn tc-demo-btn--disable" onClick={() => disableDemo(demo.slot)} disabled={saving}>
                  <X size={11} /> Désactiver
                </button>
              )}
            </div>
          </div>
        )
      })}

      {/* Section paiement — démo validée */}
      {validatedDemo && !isDelivered && (
        <div className="tc-pay-box">
          <div className="tc-pay-title"><CreditCard size={12} /> Paiement requis</div>
          {(payStatus === 'none' || payStatus === 'requested') ? (
            <>
              {payStatus === 'requested' && (
                <div style={{ fontSize: 11, color: '#FB923C', marginBottom: 8 }}>⏳ En attente de paiement du client…</div>
              )}
              <div className="tc-pay-methods">
                {PAYMENT_METHODS.map(pm => {
                  const on = payMethod === pm.id
                  return (
                    <button key={pm.id} className="tc-pay-method"
                      style={{ borderColor: on ? 'rgba(245,158,11,0.5)' : 'rgba(255,255,255,0.1)', background: on ? 'rgba(245,158,11,0.1)' : 'transparent', color: on ? 'var(--gold)' : 'var(--tx-2)' }}
                      onClick={() => setPayMethod(pm.id)}>{pm.emoji} {pm.label}</button>
                  )
                })}
              </div>
              <input className="tc-pay-inp" type="number" placeholder="Montant (DT)" value={payAmount}
                onChange={e => setPayAmount(e.target.value)} />
              <button className="tc-pay-btn tc-pay-btn--green" onClick={confirmPayment} disabled={saving || !payAmount}>
                <CheckCircle2 size={12} /> Confirmer réception du paiement
              </button>
            </>
          ) : (
            <div style={{ fontSize: 12, color: '#10B981', display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={13} /> Paiement confirmé — {lead.pay_amount} DT
            </div>
          )}
        </div>
      )}

      {/* Livraison finale */}
      {payStatus === 'confirmed' && !isDelivered && (
        <div className="tc-final-box">
          <div className="tc-final-title"><Rocket size={12} /> Livraison version finale</div>
          <div style={{ fontSize: 11, color: 'var(--tx-3)', marginBottom: 8 }}>⚠️ Toutes les démos seront désactivées après livraison.</div>
          <div className="tc-final-row">
            <input className="tc-final-inp" placeholder="https://app.monbusiness.tn/..." value={finalUrl}
              onChange={e => setFinalUrl(e.target.value)} />
            <button className="tc-deliver-btn" onClick={deliverFinal} disabled={saving || !finalUrl.trim()}>
              <Rocket size={11} /> Livrer
            </button>
          </div>
        </div>
      )}

      {/* Livré */}
      {isDelivered && (
        <div className="tc-final-box">
          <div className="tc-final-title"><CheckCircle2 size={12} /> Application livrée ✓</div>
          {meta.finalUrl && (
            <a href={meta.finalUrl} target="_blank" rel="noreferrer"
              style={{ fontSize: 11, color: 'var(--ac)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5 }}>
              <Link2 size={11} /> {meta.finalUrl}
            </a>
          )}
        </div>
      )}
    </div>
  )
}

// ─── TabClients ───────────────────────────────────────────────────────────────
export default function TabClients() {
  const [view, setView]           = useState('list')
  const [detailTab, setDetailTab] = useState('info')
  const [leads, setLeads]         = useState([])
  const [selected, setSelected]   = useState(null)
  const [messages, setMessages]   = useState([])
  const [search, setSearch]       = useState('')
  const [msg, setMsg]             = useState('')
  const [loading, setLoading]     = useState(true)
  const [sending, setSending]     = useState(false)
  const chatRef    = useRef(null)
  const channelRef = useRef(null)
  const pollRef    = useRef(null)

  const fetchLeads = useCallback(async () => {
    const { data } = await supabase.from('leads').select('*').order('created_at', { ascending: false })
    if (data) {
      setLeads(data)
      setSelected(prev => prev ? (data.find(l => l.id === prev.id) || prev) : null)
    }
    setLoading(false)
  }, [])

  const fetchMessages = useCallback(async (leadId) => {
    if (!leadId) return
    const { data } = await supabase.from('messages').select('*').eq('lead_id', leadId).order('created_at', { ascending: true })
    if (data) {
      setMessages(data)
      setTimeout(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight }, 50)
    }
  }, [])

  useEffect(() => {
    fetchLeads()
    const ch = supabase.channel('admin-leads-main')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, fetchLeads)
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [fetchLeads])

  useEffect(() => {
    if (!selected?.id) { setMessages([]); return }

    fetchMessages(selected.id)

    // POLLING PRIMARY — garantit les messages toutes les 6s
    clearInterval(pollRef.current)
    pollRef.current = setInterval(() => fetchMessages(selected.id), 6000)

    // REALTIME SECONDARY — instantané si WebSocket actif
    if (channelRef.current) supabase.removeChannel(channelRef.current)
    channelRef.current = supabase.channel(`admin-chat-${selected.id}-${Date.now()}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, pl => {
        if (pl.new.lead_id !== selected.id) return
        setMessages(prev => {
          if (prev.find(m => m.id === pl.new.id)) return prev
          const clean = prev.filter(m => !(m._temp && m.text === pl.new.text && m.sender === pl.new.sender))
          const next = [...clean, pl.new]
          setTimeout(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight }, 30)
          return next
        })
      })
      .subscribe()

    const onVisible = () => { if (document.visibilityState === 'visible') fetchMessages(selected.id) }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      clearInterval(pollRef.current)
      if (channelRef.current) supabase.removeChannel(channelRef.current)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [selected?.id, fetchMessages])

  const openClient = (lead) => {
    setSelected(lead)
    setView('detail')
    setDetailTab('info')
    setMessages([])
  }

  const backToList = () => {
    setView('list')
    clearInterval(pollRef.current)
    if (channelRef.current) { supabase.removeChannel(channelRef.current); channelRef.current = null }
  }

  const sendMsg = async () => {
    if (!msg.trim() || !selected || sending) return
    setSending(true)
    const text = msg.trim(); setMsg('')
    const temp = { id: `temp-${Date.now()}`, lead_id: selected.id, sender: 'admin', text, created_at: new Date().toISOString(), _temp: true }
    setMessages(prev => [...prev, temp])
    setTimeout(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight }, 30)
    await supabase.from('messages').insert([{ lead_id: selected.id, sender: 'admin', text }])
    await supabase.from('leads').update({ last_message: text, last_message_at: new Date().toISOString() }).eq('id', selected.id)
    setSending(false)
  }

  const changeStatus = async (s) => {
    if (!selected) return
    await supabase.from('leads').update({ status: s }).eq('id', selected.id)
    fetchLeads()
  }

  const filtered = leads.filter(l =>
    (l.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (l.phone || '').includes(search) ||
    (l.type || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <style>{CSS}</style>
      <div className="tc-root">

        {/* ══ LIST ══ */}
        {view === 'list' && (
          <div className="tc-list">
            <div className="tc-list-head">
              <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: 18, color: 'var(--tx)' }}>Clients</span>
              <div className="tc-list-search">
                <Search size={13} color="var(--tx-3)" className="tc-sico" />
                <input className="tc-sinp" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <button onClick={fetchLeads} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'var(--tx-3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <RefreshCw size={12} />
              </button>
            </div>
            <div className="tc-list-scroll">
              {loading ? (
                <div style={{ padding: 20, textAlign: 'center', color: 'var(--tx-3)', fontSize: 12 }}>Chargement…</div>
              ) : filtered.length === 0 ? (
                <div className="tc-empty"><MessageSquare size={28} color="var(--border)" /><span>Aucun client</span></div>
              ) : filtered.map(lead => {
                const sc = STATUS_CONFIG[lead.status] || STATUS_CONFIG.new
                return (
                  <div key={lead.id} className="tc-lead-card" onClick={() => openClient(lead)}>
                    <div className="tc-avatar">{(lead.name || 'AA').slice(0, 2).toUpperCase()}</div>
                    <div className="tc-lead-info">
                      <div className="tc-lead-name">{lead.name}</div>
                      <div className="tc-lead-meta">{lead.phone}{lead.type ? ` · ${lead.type}` : ''}</div>
                    </div>
                    <div className="tc-lead-right">
                      <span className="tc-badge" style={{ background: sc.bg, color: sc.color }}>{sc.label}</span>
                      {lead.unread_count > 0 && <div className="tc-unread-dot">{lead.unread_count}</div>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ══ DETAIL ══ */}
        {view === 'detail' && selected && (
          <div className="tc-detail">
            <div className="tc-detail-head">
              <button className="tc-back-btn" onClick={backToList}><ArrowLeft size={13} /> Liste</button>
              <div className="tc-avatar tc-avatar--sm">{(selected.name || 'AA').slice(0, 2).toUpperCase()}</div>
              <span className="tc-detail-name">{selected.name} · {selected.phone}</span>
              <div className="tc-tab-btns">
                <button className={`tc-tab-btn${detailTab === 'info' ? ' tc-tab-btn--active' : ''}`} onClick={() => setDetailTab('info')}>
                  <User size={12} /> Infos
                </button>
                <button className={`tc-tab-btn${detailTab === 'messages' ? ' tc-tab-btn--active' : ''}`}
                  onClick={() => { setDetailTab('messages'); setTimeout(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight }, 80) }}>
                  <MessageSquare size={12} /> Messages
                </button>
              </div>
            </div>

            {/* Infos */}
            {detailTab === 'info' && (
              <div className="tc-info">
                <div className="tc-section">
                  <div className="tc-section-title"><User size={11} /> Coordonnées</div>
                  <div className="tc-grid2">
                    <div className="tc-field"><label>Nom</label><span>{selected.name || '—'}</span></div>
                    <div className="tc-field"><label>Téléphone</label><span>{selected.phone || '—'}</span></div>
                    <div className="tc-field"><label>Email</label><span>{selected.email || '—'}</span></div>
                    <div className="tc-field"><label>Source</label><span>{selected.source || '—'}</span></div>
                  </div>
                </div>
                <div className="tc-section">
                  <div className="tc-section-title"><AlertCircle size={11} /> Détails demande</div>
                  <div className="tc-grid2">
                    <div className="tc-field"><label>Type app</label><span>{selected.type || '—'}</span></div>
                    <div className="tc-field"><label>Pack</label><span>{selected.pack || '—'}</span></div>
                    <div className="tc-field"><label>Date</label><span>{selected.created_at ? new Date(selected.created_at).toLocaleDateString('fr-FR') : '—'}</span></div>
                    <div className="tc-field"><label>Statut</label>
                      <span style={{ color: STATUS_CONFIG[selected.status]?.color || 'var(--tx-2)' }}>
                        {STATUS_CONFIG[selected.status]?.label || selected.status}
                      </span>
                    </div>
                  </div>
                  <div className="tc-status-bar">
                    <span className="tc-status-bar-label">Changer :</span>
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                      <button key={k} className={`tc-status-btn${selected.status === k ? ' tc-status-btn--active' : ''}`}
                        onClick={() => changeStatus(k)}>{v.label}</button>
                    ))}
                  </div>
                </div>
                <div className="tc-section">
                  <DemoPanel lead={selected} onRefresh={fetchLeads} />
                </div>
              </div>
            )}

            {/* Messages */}
            {detailTab === 'messages' && (
              <>
                <div className="tc-chat" ref={chatRef}>
                  {messages.length === 0 && <div className="tc-no-msgs">Aucun message — commencez la conversation.</div>}
                  {messages.map(m => (
                    <div key={m.id} className={`tc-bubble tc-bubble--${m.sender}`}>
                      {m.text}
                      <div className="tc-bubble-ts">
                        {new Date(m.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        {m.sender === 'admin' && <CheckCheck size={10} style={{ marginLeft: 4 }} />}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="tc-chat-inp">
                  <textarea className="tc-chat-field" placeholder="Écrire un message..." value={msg} rows={1}
                    onChange={e => setMsg(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg() } }}
                  />
                  <button className="tc-chat-send" onClick={sendMsg} disabled={sending || !msg.trim()}>
                    <Send size={14} />
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </>
  )
}
