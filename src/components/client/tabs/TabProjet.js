'use client'
import { useState, useRef, useCallback, useEffect } from 'react'
import {
  CheckCircle2, Clock, CreditCard, Rocket, Zap, ExternalLink,
  Eye, Smartphone, Monitor, X, RefreshCw, Calendar, AlertCircle,
  Send, ChevronRight
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { WalaupSound } from '@/lib/sound'

// ─── Meta helpers ─────────────────────────────────────────────────────────────
function deepClone(o) { return JSON.parse(JSON.stringify(o)) }

const DEMO_DEFAULT = {
  demos: [
    { slot: 1, url: '', status: 'pending' },
    { slot: 2, url: '', status: 'locked' },'use client'
import { useState, useRef, useCallback, useEffect } from 'react'
import {
 CheckCircle2, Clock, CreditCard, Rocket, Zap, ExternalLink,
 Eye, Smartphone, Monitor, X, RefreshCw, Calendar, AlertCircle,
 Send, ChevronRight, ChevronDown
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { WalaupSound } from '@/lib/sound'

// ─── Meta helpers ─────────────────────────────────────────────────────────────
function deepClone(o) { return JSON.parse(JSON.stringify(o)) }

const DEMO_DEFAULT = {
 demos: [
 { slot: 1, url: '', status: 'pending' },
 { slot: 2, url: '', status: 'locked' },
 { slot: 3, url: '', status: 'locked' },
 ],
 finalUrl: '',
 payStatus: 'none',
 validatedSlot: null,
 history: [],
 appCredentials: { login: '', password: '', usageGuide: '' },
}

function parseMeta(note) {
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

function encodeMeta(m) { return 'walaup_demos:' + JSON.stringify(m) }

function addHistory(meta, event, description) {
 const m = deepClone(meta)
 if (!m.history) m.history = []
 if (!m.history.find(h => h.event === event)) {
 m.history.push({ event, description, date: new Date().toISOString() })
 }
 return m
}

// ─── Config ───────────────────────────────────────────────────────────────────
const STEPS = [
 { id: 'new', label: 'Demande reçue', icon: CheckCircle2, color: '#22D3EE' },
 { id: 'demo', label: 'Démo prête', icon: Zap, color: '#6366F1' },
 { id: 'payment_requested', label: 'Paiement', icon: CreditCard, color: '#F59E0B' },
 { id: 'payment_confirmed', label: 'Développement', icon: Clock, color: '#8B5CF6' },
 { id: 'delivered', label: 'Livré 🎉', icon: Rocket, color: '#10B981' },
]

const STATUS_META = {
 new: { color: '#22D3EE', label: 'Demande reçue' },
 demo: { color: '#6366F1', label: 'Démo disponible' },
 payment_requested: { color: '#F59E0B', label: 'Paiement requis' },
 payment_confirmed: { color: '#8B5CF6', label: 'En développement' },
 delivered: { color: '#10B981', label: 'Application livrée' },
}

const PAYMENT_METHODS = [
 { id: 'flouci', label: 'Flouci', emoji: '📱', desc: 'Portefeuille mobile' },
 { id: 'konnect', label: 'Konnect', emoji: '💳', desc: 'Carte Visa/Mastercard' },
 { id: 'd17', label: 'D17', emoji: '📲', desc: 'Mobile payment' },
 { id: 'virement', label: 'Virement', emoji: '🏦', desc: 'Virement bancaire' },
 { id: 'especes', label: 'Espèces', emoji: '💵', desc: 'Paiement en main' },
 { id: 'cheque', label: 'Chèque', emoji: '📄', desc: 'Chèque bancaire' },
]

// [CSS inchangé — copier depuis la version précédente]
const CSS = `
 /* Stepper */
 .tp-stepper { display:flex; align-items:flex-start; margin-bottom:28px; overflow-x:auto; padding-bottom:6px; scrollbar-width:none; }
 .tp-stepper::-webkit-scrollbar { display:none; }
 .tp-step { display:flex; flex-direction:column; align-items:center; flex:1; min-width:64px; }
 .tp-step-row { display:flex; align-items:center; width:100%; }
 .tp-step-line { flex:1; height:2px; border-radius:1px; }
 .tp-step-circle { width:34px; height:34px; min-width:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; transition:all .3s; z-index:1; }
 .tp-step-label { font-size:10px; color:var(--tx-3); margin-top:7px; text-align:center; line-height:1.3; max-width:70px; }
 .tp-card { background:rgba(13,17,32,.60); border:1px solid rgba(255,255,255,.07); border-radius:18px; padding:20px; margin-bottom:14px; backdrop-filter:blur(14px); }
 .tp-card-title { font-size:11px; font-weight:700; color:var(--tx-3); text-transform:uppercase; letter-spacing:.08em; margin-bottom:14px; display:flex; align-items:center; gap:7px; }
 .tp-status-tag { display:inline-flex; align-items:center; gap:6px; padding:4px 12px; border-radius:20px; font-size:11px; font-weight:700; margin-bottom:12px; }
 .tp-btn { display:inline-flex; align-items:center; gap:8px; padding:10px 18px; border-radius:12px; font-size:13px; font-weight:700; font-family:var(--font-body); cursor:pointer; border:none; transition:all .2s; text-decoration:none; }
 .tp-btn--primary { background:linear-gradient(135deg,var(--ac),var(--ac-2)); color:#fff; box-shadow:0 4px 16px rgba(99,102,241,.28); }
 .tp-btn--gold { background:linear-gradient(135deg,#F59E0B,#D97706); color:#fff; box-shadow:0 4px 16px rgba(245,158,11,.28); }
 .tp-btn--ghost { background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.1); color:var(--tx-2); }
 .tp-btn:hover:not(:disabled) { transform:translateY(-1px); filter:brightness(1.08); }
 .tp-btn:disabled { opacity:.4; cursor:not-allowed; transform:none; filter:none; }
 @keyframes tp-pulse { 0%,100%{opacity:1}50%{opacity:.4} }
 .tp-pulse { animation:tp-pulse 1.8s ease-in-out infinite; }
 .tp-timeline { display:flex; flex-direction:column; gap:0; }
 .tp-hist-item { display:flex; gap:12px; position:relative; }
 .tp-hist-item:not(:last-child)::before { content:''; position:absolute; left:16px; top:28px; bottom:-4px; width:1px; background:rgba(255,255,255,0.07); }
 .tp-hist-dot { width:32px; height:32px; min-width:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
 .tp-hist-content { flex:1; padding-bottom:18px; }
 .tp-hist-title { font-size:13px; font-weight:600; color:var(--tx); margin-bottom:2px; }
 .tp-hist-date { font-size:11px; color:var(--tx-3); display:flex; align-items:center; gap:5px; margin-bottom:4px; }
 .tp-hist-desc { font-size:12px; color:var(--tx-2); line-height:1.5; }
 .tp-demo-card { border:1px solid rgba(255,255,255,0.09); border-radius:12px; padding:14px; margin-bottom:9px; background:rgba(8,11,20,0.5); }
 .tp-demo-card--validated { border-color:rgba(16,185,129,0.35); background:rgba(16,185,129,0.04); }
 .tp-demo-card--dim { opacity:0.38; pointer-events:none; }
 .tp-demo-head { display:flex; align-items:center; gap:8px; margin-bottom:11px; }
 .tp-demo-num { font-size:12px; font-weight:800; color:var(--tx); font-family:'Space Grotesk',sans-serif; }
 .tp-demo-badge { padding:2px 9px; border-radius:20px; font-size:10px; font-weight:700; }
 .tp-demo-actions { display:flex; gap:7px; flex-wrap:wrap; }
 .tp-demo-btn { display:flex; align-items:center; gap:6px; padding:7px 14px; border-radius:9px; font-size:12px; font-weight:700; cursor:pointer; border:none; transition:all .18s; font-family:'Inter',sans-serif; }
 .tp-demo-btn:disabled { opacity:.4; cursor:not-allowed; }
 .tp-demo-btn--view { background:rgba(99,102,241,0.14); border:1px solid rgba(99,102,241,0.28); color:var(--ac); }
 .tp-demo-btn--modify { background:rgba(251,146,60,0.1); border:1px solid rgba(251,146,60,0.25); color:#FB923C; }
 .tp-demo-btn--validate { background:linear-gradient(135deg,#10B981,#059669); color:#fff; box-shadow:0 3px 12px rgba(16,185,129,0.25); }
 .tp-demo-btn--view:hover:not(:disabled) { background:rgba(99,102,241,0.22); }
 .tp-demo-btn--modify:hover:not(:disabled) { background:rgba(251,146,60,0.2); }
 .tp-demo-btn--validate:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 5px 18px rgba(16,185,129,0.38); }
 .tp-modal-ov { position:fixed; inset:0; background:rgba(0,0,0,0.78); z-index:8000; display:flex; align-items:center; justify-content:center; padding:20px; backdrop-filter:blur(6px); }
 .tp-modal { background:#0D1120; border:1px solid rgba(255,255,255,0.12); border-radius:20px; padding:28px; width:460px; max-width:100%; box-shadow:0 24px 80px rgba(0,0,0,0.7); max-height:90vh; overflow-y:auto; }
 .tp-modal::-webkit-scrollbar { width:3px; }
 .tp-modal::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:2px; }
 .tp-modal-title { font-family:'Space Grotesk',sans-serif; font-weight:800; font-size:18px; color:var(--tx); margin-bottom:5px; }
 .tp-modal-sub { font-size:13px; color:var(--tx-2); margin-bottom:22px; line-height:1.5; }
 .tp-method-grid { display:grid; grid-template-columns:1fr 1fr; gap:9px; margin-bottom:18px; }
 .tp-method-card { padding:12px 14px; border-radius:11px; border:1.5px solid rgba(255,255,255,0.09); background:rgba(255,255,255,0.03); cursor:pointer; transition:all .18s; text-align:left; }
 .tp-method-card--on { border-color:rgba(99,102,241,0.5); background:rgba(99,102,241,0.1); }
 .tp-method-emoji { font-size:20px; margin-bottom:6px; }
 .tp-method-name { font-size:13px; font-weight:700; color:var(--tx); margin-bottom:2px; }
 .tp-method-desc { font-size:11px; color:var(--tx-3); }
 .tp-amount-box { background:rgba(245,158,11,0.07); border:1px solid rgba(245,158,11,0.2); border-radius:13px; padding:16px; margin-bottom:18px; display:flex; align-items:center; justify-content:space-between; }
 .tp-amount-label { font-size:12px; color:var(--tx-3); margin-bottom:4px; }
 .tp-amount-value { font-family:'JetBrains Mono',monospace; font-size:26px; font-weight:800; color:var(--gold); }
 .tp-confirm-btn { width:100%; padding:13px; border-radius:12px; background:linear-gradient(135deg,#6366F1,#8B5CF6); border:none; color:#fff; font-size:14px; font-weight:700; cursor:pointer; box-shadow:0 5px 20px rgba(99,102,241,0.32); font-family:'Space Grotesk',sans-serif; display:flex; align-items:center; justify-content:center; gap:9px; }
 .tp-confirm-btn:disabled { opacity:.5; cursor:not-allowed; }
 .tp-cancel-btn { width:100%; padding:11px; border-radius:12px; background:transparent; border:1px solid rgba(255,255,255,0.1); color:var(--tx-3); font-size:13px; cursor:pointer; margin-top:8px; font-family:'Inter',sans-serif; }
 .tp-prev-ov { position:fixed; inset:0; background:rgba(0,0,0,0.88); z-index:9999; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:20px; }
 .tp-prev-head { padding:10px 14px; border-bottom:1px solid rgba(255,255,255,0.08); display:flex; gap:8px; align-items:center; }
 .tp-prev-url { flex:1; font-size:11px; color:var(--tx-3); font-family:'JetBrains Mono',monospace; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
 .tp-toggle-wrap { display:flex; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09); border-radius:8px; padding:2px; gap:2px; }
 .tp-toggle-btn { padding:4px 10px; border-radius:6px; border:none; font-size:11px; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:4px; background:transparent; color:var(--tx-3); font-family:'Inter',sans-serif; }
 .tp-toggle-btn--on { background:rgba(99,102,241,0.2); color:var(--ac); }
 .tp-close-btn { width:28px; height:28px; border-radius:7px; border:none; background:rgba(248,113,113,0.12); color:#F87171; cursor:pointer; display:flex; align-items:center; justify-content:center; }
 .tp-phone-shell { background:rgba(13,17,32,0.95); border:2px solid rgba(255,255,255,0.15); border-radius:36px; padding:14px; box-shadow:0 40px 100px rgba(0,0,0,0.8); }
 .tp-phone-notch { width:60px; height:5px; background:rgba(255,255,255,0.1); border-radius:3px; margin:0 auto 10px; }
 .tp-phone-screen { width:260px; height:520px; border-radius:24px; overflow:hidden; background:#000; }
 .tp-info-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(130px,1fr)); gap:12px; }
 .tp-info-label { font-size:11px; font-weight:600; color:var(--tx-3); text-transform:uppercase; letter-spacing:.05em; margin-bottom:4px; }
 .tp-info-value { font-size:13px; color:var(--tx); font-weight:500; }
 .tp-note { margin-top:14px; padding:12px 14px; background:rgba(99,102,241,.07); border:1px solid rgba(99,102,241,.14); border-radius:11px; }
 .tp-note-tag { font-size:10px; font-weight:700; color:var(--ac); text-transform:uppercase; letter-spacing:.06em; display:block; margin-bottom:5px; }
 .tp-note-text { font-size:13px; color:var(--tx-2); line-height:1.6; margin:0; }
 .tp-empty { text-align:center; padding:48px 20px; color:var(--tx-3); }
 /* ── Sélecteur de projet ── */
 .tp-proj-selector { background:rgba(13,17,32,0.7); border:1px solid rgba(255,255,255,0.1); border-radius:14px; padding:14px; margin-bottom:18px; }
 .tp-proj-selector-title { font-size:10px; font-weight:700; color:var(--tx-3); text-transform:uppercase; letter-spacing:.08em; margin-bottom:10px; }
 .tp-proj-list { display:flex; flex-direction:column; gap:6px; }
 .tp-proj-item { display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:10px; cursor:pointer; border:1px solid rgba(255,255,255,0.07); background:rgba(255,255,255,0.02); transition:all .18s; }
 .tp-proj-item--active { border-color:rgba(99,102,241,0.4); background:rgba(99,102,241,0.09); }
 .tp-proj-item:hover { border-color:rgba(99,102,241,0.25); }
 .tp-proj-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
 .tp-proj-name { font-size:13px; font-weight:600; color:var(--tx); flex:1; }
 .tp-proj-pack { font-size:10px; color:var(--tx-3); }
 .tp-proj-status { padding:2px 8px; border-radius:20px; font-size:10px; font-weight:700; }
`

// ─── DemoPreviewModal (inchangé) ──────────────────────────────────────────────
function DemoPreviewModal({ url, onClose }) {
 const [mode, setMode] = useState('mobile')
 const screenRef = useRef(null)
 const iframeRef = useRef(null)
 const scaleMobile = useCallback(() => {
 if (!screenRef.current || !iframeRef.current) return
 const mw = 390, scale = screenRef.current.clientWidth / mw
 iframeRef.current.style.width = mw + 'px'
 iframeRef.current.style.height = Math.ceil(screenRef.current.clientHeight / scale) + 'px'
 iframeRef.current.style.transform = `scale(${scale})`
 iframeRef.current.style.transformOrigin = 'top left'
 }, [])
 useEffect(() => { if (mode === 'mobile') setTimeout(scaleMobile, 120) }, [mode, scaleMobile])
 return (
 <div className="tp-prev-ov" onClick={onClose}>
 <div style= background:'rgba(13,17,32,0.98)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:18, overflow:'hidden', maxWidth:'95vw', maxHeight:'95vh', display:'flex', flexDirection:'column'  onClick={e => e.stopPropagation()}>
 <div className="tp-prev-head">
 <span className="tp-prev-url">{url}</span>
 <div className="tp-toggle-wrap">
 <button className={`tp-toggle-btn${mode==='mobile'?' tp-toggle-btn--on':''}`} onClick={() => setMode('mobile')}><Smartphone size={11}/> Mobile</button>
 <button className={`tp-toggle-btn${mode==='browser'?' tp-toggle-btn--on':''}`} onClick={() => setMode('browser')}><Monitor size={11}/> Desktop</button>
 </div>
 <button className="tp-close-btn" onClick={onClose}><X size={13}/></button>
 </div>
 {mode === 'mobile' ? (
 <div style= padding:24, display:'flex', justifyContent:'center', background:'rgba(8,11,20,0.6)' >
 <div className="tp-phone-shell">
 <div className="tp-phone-notch"/>
 <div className="tp-phone-screen" ref={screenRef}>
 <iframe ref={iframeRef} src={url} style= border:'none', display:'block'  title="Demo mobile"/>
 </div>
 </div>
 </div>
 ) : (
 <>
 <div style= background:'rgba(17,24,39,0.9)', borderBottom:'1px solid rgba(255,255,255,0.06)', padding:'8px 14px', display:'flex', alignItems:'center', gap:10 >
 {['#F87171','#FBBF24','#34D399'].map(c => <span key={c} style= width:9, height:9, borderRadius:'50%', background:c, display:'inline-block' />)}
 <span style= flex:1, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:5, padding:'3px 10px', fontSize:11, color:'var(--tx-3)', fontFamily:'monospace', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' >{url}</span>
 <a href={url} target="_blank" rel="noreferrer"><ExternalLink size={13} style= color:'var(--tx-3)' /></a>
 </div>
 <iframe src={url} style= width:'90vw', maxWidth:1100, height:'75vh', border:'none', display:'block', background:'#fff'  title="Demo desktop"/>
 </>
 )}
 </div>
 </div>
 )
}

// ─── PaymentModal (inchangé — copier depuis version précédente) ───────────────
function PaymentModal({ lead, amount, title, description, onClose, onConfirm, saving }) {
 const [method, setMethod] = useState('flouci')
 const selected = PAYMENT_METHODS.find(p => p.id === method)
 const instructions = {
 flouci: ['Ouvrez l\'app Flouci sur votre téléphone', 'Scannez le QR ou envoyez au : 00 000 000', 'Montant exact : ' + amount + ' DT', 'Envoyez une capture à votre conseiller Walaup'],
 konnect: ['Cliquez sur "Confirmer" pour accéder au paiement sécurisé', 'Entrez vos informations de carte', 'Validez et revenez ici', 'Notre équipe confirme sous 24h'],
 d17: ['Ouvrez D17 sur votre téléphone', 'Choisissez "Paiement marchand"', 'Montant : ' + amount + ' DT', 'Envoyez une capture à votre conseiller'],
 virement: ['Banque : BIAT', 'RIB : 08 006 0123456789012 56', 'Montant exact : ' + amount + ' DT', 'Objet : Walaup - ' + (lead?.name || '')],
 especes: ['Contactez votre conseiller Walaup', 'Rendez-vous au bureau ou à votre domicile', 'Montant : ' + amount + ' DT', 'Un reçu vous sera remis immédiatement'],
 cheque: ['Libellé : "Walaup"', 'Montant : ' + amount + ' DT', 'Envoyez par courrier ou remise en main propre', 'Confirmation sous 2-3 jours ouvrés'],
 }
 return (
 <div className="tp-modal-ov" onClick={onClose}>
 <div className="tp-modal" onClick={e => e.stopPropagation()}>
 <p className="tp-modal-title">{title}</p>
 <p className="tp-modal-sub">{description}</p>
 <div className="tp-amount-box">
 <div><div className="tp-amount-label">Montant à payer</div><div className="tp-amount-value">{amount} DT</div></div>
 <span style= fontSize:32 >💳</span>
 </div>
 <p style= fontSize:12, fontWeight:700, color:'var(--tx-2)', marginBottom:9 >Choisissez votre méthode</p>
 <div className="tp-method-grid">
 {PAYMENT_METHODS.map(pm => (
 <button key={pm.id} className={`tp-method-card${method===pm.id?' tp-method-card--on':''}`} onClick={() => setMethod(pm.id)}>
 <div className="tp-method-emoji">{pm.emoji}</div>
 <div className="tp-method-name">{pm.label}</div>
 <div className="tp-method-desc">{pm.desc}</div>
 </button>
 ))}
 </div>
 {instructions[method] && (
 <div style= background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:'14px', marginBottom:18 >
 <p style= fontSize:11, fontWeight:700, color:'var(--tx-2)', marginBottom:10 >{selected?.emoji} Instructions — {selected?.label}</p>
 {instructions[method].map((step, i) => (
 <div key={i} style= display:'flex', gap:8, marginBottom:7, alignItems:'flex-start' >
 <span style= width:18, height:18, borderRadius:'50%', background:'rgba(99,102,241,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:'var(--ac)', flexShrink:0 >{i+1}</span>
 <span style= fontSize:12, color:'var(--tx-2)', lineHeight:1.5 >{step}</span>
 </div>
 ))}
 </div>
 )}
 <button className="tp-confirm-btn" onClick={() => onConfirm(method)} disabled={saving}>
 {saving ? 'Envoi en cours…' : <><Send size={15}/> Confirmer et notifier Walaup</>}
 </button>
 <button className="tp-cancel-btn" onClick={onClose}>Annuler</button>
 <p style= fontSize:11, color:'var(--tx-3)', textAlign:'center', marginTop:14 >Votre conseiller confirmera la réception du paiement sous 24h.</p>
 </div>
 </div>
 )
}

// ─── HistoryTimeline (inchangé — copier depuis version précédente) ─────────────
function HistoryTimeline({ lead, meta }) {
 const events = []
 const fmt = (d) => {
 if (!d) return null
 const dt = new Date(d)
 return dt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) + ' à ' +
 dt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
 }
 if (lead.created_at) events.push({ color: '#22D3EE', icon: CheckCircle2, title: 'Demande reçue', date: lead.created_at, desc: `Demande ${lead.type || ''} — Pack ${lead.pack || 'non défini'}` })
 const histMap = {};(meta.history || []).forEach(h => { histMap[h.event] = h })
 if (histMap.demo_sent) events.push({ color: '#6366F1', icon: Zap, title: 'Démo envoyée', date: histMap.demo_sent.date, desc: histMap.demo_sent.description || 'Première démo disponible' })
 if (histMap.modify_1) events.push({ color: '#FB923C', icon: RefreshCw, title: 'Modification demandée', date: histMap.modify_1.date, desc: histMap.modify_1.description || 'Retour client sur démo 1' })
 if (histMap.demo_2_sent) events.push({ color: '#6366F1', icon: Zap, title: 'Démo 2 envoyée', date: histMap.demo_2_sent.date, desc: histMap.demo_2_sent.description || 'Deuxième version disponible' })
 if (histMap.modify_2) events.push({ color: '#FB923C', icon: RefreshCw, title: 'Modification demandée (2)', date: histMap.modify_2.date, desc: histMap.modify_2.description || 'Retour client sur démo 2' })
 if (histMap.demo_3_sent) events.push({ color: '#6366F1', icon: Zap, title: 'Démo 3 envoyée', date: histMap.demo_3_sent.date, desc: histMap.demo_3_sent.description || 'Troisième version disponible' })
 if (histMap.validated) events.push({ color: '#10B981', icon: CheckCircle2, title: `Démo validée (version ${meta.validatedSlot || '?'})`, date: histMap.validated.date, desc: 'Vous avez approuvé cette version' })
 if (histMap.payment_requested) events.push({ color: '#F59E0B', icon: CreditCard, title: 'Paiement demandé', date: histMap.payment_requested.date, desc: `${lead.pay_amount || '?'} DT via ${lead.pay_method || '?'}` })
 if (histMap.payment_pending) events.push({ color: '#FB923C', icon: Clock, title: 'Paiement en cours', date: histMap.payment_pending.date, desc: 'En attente de confirmation par Walaup' })
 if (histMap.payment_confirmed || lead.status === 'payment_confirmed' || lead.status === 'delivered') {
 const h = histMap.payment_confirmed
 events.push({ color: '#10B981', icon: CheckCircle2, title: 'Paiement confirmé', date: h?.date || null, desc: `${lead.pay_amount || '?'} DT reçu — Développement lancé` })
 }
 if (histMap.delivered || lead.status === 'delivered') {
 const h = histMap.delivered
 events.push({ color: '#10B981', icon: Rocket, title: '🎉 Application livrée', date: h?.date || null, desc: meta.finalUrl || 'Application déployée et opérationnelle' })
 }
 events.sort((a, b) => { if (!a.date) return 1; if (!b.date) return -1; return new Date(a.date) - new Date(b.date) })
 if (events.length === 0) return null
 return (
 <div className="tp-card">
 <div className="tp-card-title"><Calendar size={13}/> Historique du projet</div>
 <div className="tp-timeline">
 {events.map((ev, i) => {
 const Icon = ev.icon
 return (
 <div key={i} className="tp-hist-item">
 <div className="tp-hist-dot" style={{ background: ev.color + '22', border: `1.5px solid ${ev.color}50` }}><Icon size={14} color={ev.color}/></div>
 <div className="tp-hist-content">
 <div className="tp-hist-title">{ev.title}</div>
 {ev.date && <div className="tp-hist-date"><Clock size={11}/>{fmt(ev.date)}</div>}
 {ev.desc && <div className="tp-hist-desc">{ev.desc}</div>}
 </div>
 </div>
 )
 })}
 </div>
 </div>
 )
}

// ─── DemoViewer (inchangé) ────────────────────────────────────────────────────
function DemoViewer({ lead, setLead, meta }) {
 const [previewUrl, setPreviewUrl] = useState(null)
 const [acting, setActing] = useState(false)
 const visibleDemos = (meta.demos || []).filter(d => ['sent','modify_requested','validated'].includes(d.status) && d.url)
 if (visibleDemos.length === 0) return null
 const persist = async (newMeta, extra = {}) => {
 await supabase.from('leads').update({ note: encodeMeta(newMeta), ...extra }).eq('id', lead.id)
 // Realtime prendra en charge la mise à jour — plus besoin de fetch manuel
 }
 const handleModify = async (slot) => {
 if (acting) return
 setActing(true)
 WalaupSound.click()
 let m = deepClone(meta)
 const idx = m.demos.findIndex(d => d.slot === slot)
 m.demos[idx].status = 'modify_requested'
 const nextIdx = m.demos.findIndex(d => d.slot === slot + 1)
 if (nextIdx !== -1 && m.demos[nextIdx].status === 'locked') m.demos[nextIdx].status = 'pending'
 m = addHistory(m, `modify_${slot}`, `Retour client — Modification demandée pour démo ${slot}`)
 await persist(m)
 await supabase.from('messages').insert({ lead_id: lead.id, sender: 'client', text: `↩️ Demande de modification pour la démo ${slot}. Merci d'envoyer une nouvelle version.` })
 setActing(false)
 }
 const handleValidate = async (slot) => {
 if (acting) return
 if (!confirm(`Valider la démo ${slot} ? Cela déclenchera la demande de paiement.`)) return
 setActing(true)
 WalaupSound.success()
 let m = deepClone(meta)
 m.demos = m.demos.map(d => ({ ...d, status: d.slot === slot ? 'validated' : (d.status !== 'locked' ? 'disabled' : 'locked') }))
 m.validatedSlot = slot
 m.payStatus = 'requested'
 m = addHistory(m, 'validated', `Démo ${slot} validée par le client`)
 m = addHistory(m, 'payment_requested', 'Paiement demandé automatiquement après validation')
 await persist(m, { status: 'payment_requested' })
 await supabase.from('messages').insert({ lead_id: lead.id, sender: 'client', text: `✅ J'ai validé la démo ${slot} et je suis prêt à effectuer le paiement.` })
 setActing(false)
 }
 const anyValidated = (meta.demos || []).some(d => d.status === 'validated')
 const isDelivered = lead.status === 'delivered'
 return (
 <>
 {previewUrl && <DemoPreviewModal url={previewUrl} onClose={() => setPreviewUrl(null)} />}
 <div className="tp-card">
 <div className="tp-card-title"><Eye size={13}/> Vos démos ({visibleDemos.length})</div>
 {visibleDemos.map(demo => {
 const isSent = demo.status === 'sent'
 const isModReq = demo.status === 'modify_requested'
 const isValidated = demo.status === 'validated'
 const canModify = isSent && !anyValidated && demo.slot < 3 && !isDelivered
 const canValidate = isSent && !anyValidated && !isDelivered
 let statusColor = '#6366F1', statusBg = 'rgba(99,102,241,0.1)', statusLabel = '📨 Envoyée'
 if (isModReq) { statusColor = '#FB923C'; statusBg = 'rgba(251,146,60,0.1)'; statusLabel = '↩️ Modification demandée' }
 if (isValidated) { statusColor = '#10B981'; statusBg = 'rgba(16,185,129,0.12)'; statusLabel = '✅ Validée' }
 return (
 <div key={demo.slot} className={`tp-demo-card${isValidated?' tp-demo-card--validated':''}`}>
 <div className="tp-demo-head">
 <span className="tp-demo-num">Démo {demo.slot}</span>
 <span className="tp-demo-badge" style= background: statusBg, color: statusColor >{statusLabel}</span>
 </div>
 <div className="tp-demo-actions">
 <button className="tp-demo-btn tp-demo-btn--view" onClick={() => { setPreviewUrl(demo.url); WalaupSound.click() }}>Visualiser</button>
 {canModify && <button className="tp-demo-btn tp-demo-btn--modify" onClick={() => handleModify(demo.slot)} disabled={acting}>Demander modification</button>}
 {canValidate && <button className="tp-demo-btn tp-demo-btn--validate" onClick={() => handleValidate(demo.slot)} disabled={acting}>Valider cette démo</button>}
 {isValidated && !isDelivered && <span style= fontSize:11, color:'#10B981', fontWeight:600 >Validée — paiement en attente</span>}
 </div>
 </div>
 )
 })}
 </div>
 </>
 )
}

// ─── Sélecteur de projets ────────────────────────────────────────────────────
function ProjectSelector({ leads, activeLead, onSelect }) {
 if (!leads || leads.length <= 1) return null
 const statusColors = {
 new: '#22D3EE', demo: '#6366F1', payment_requested: '#F59E0B',
 payment_confirmed: '#8B5CF6', delivered: '#10B981',
 }
 const statusLabels = {
 new: 'Nouveau', demo: 'Démo prête', payment_requested: 'Paiement',
 payment_confirmed: 'En dev.', delivered: 'Livré',
 }
 return (
 <div className="tp-proj-selector">
 <div className="tp-proj-selector-title">📂 Mes projets ({leads.length})</div>
 <div className="tp-proj-list">
 {leads.map(l => {
 const color = statusColors[l.status] || '#22D3EE'
 const isActive = l.id === activeLead?.id
 return (
 <div key={l.id} className={`tp-proj-item${isActive?' tp-proj-item--active':''}`} onClick={() => onSelect(l)}>
 <div className="tp-proj-dot" style= background: color />
 <div>
 <div className="tp-proj-name">{l.type || 'Application'} {l.note?.match(/App: ([^\n]+)/)?.[1] ? `— ${l.note.match(/App: ([^\n]+)/)[1]}` : ''}</div>
 <div className="tp-proj-pack">Pack {l.pack || '—'} · {new Date(l.created_at).toLocaleDateString('fr-FR')}</div>
 </div>
 <span className="tp-proj-status" style= background: color + '18', color >{statusLabels[l.status] || l.status}</span>
 </div>
 )
 })}
 </div>
 </div>
 )
}

// ─── TabProjet principal ──────────────────────────────────────────────────────
// NOUVELLE SIGNATURE : accepte leads[] pour multi-projets
export default function TabProjet({ lead: initialLead, leads: allLeads, session, setLead }) {
 const [lead, setLocalLead] = useState(initialLead)
 const [payModalOpen, setPayModalOpen] = useState(false)
 const [paying, setPaying] = useState(false)
 const [config, setConfig] = useState(null)

 // Sync si le parent met à jour initialLead
 useEffect(() => { setLocalLead(initialLead) }, [initialLead?.id, initialLead?.status, initialLead?.note, initialLead?.pay_amount])

 // ── Tarifs config
 useEffect(() => {
 supabase.from('config').select('value').eq('key', 'tarifs').maybeSingle()
 .then(({ data }) => { if (data) setConfig(data.value) })
 }, [])

 // ── REALTIME : mise à jour instantanée quand admin change le lead ──────────
 useEffect(() => {
 if (!lead?.id) return
 const channel = supabase
 .channel(`lead-proj-${lead.id}`)
 .on(
 'postgres_changes',
 { event: 'UPDATE', schema: 'public', table: 'leads', filter: `id=eq.${lead.id}` },
 (payload) => {
 if (!payload.new) return
 setLocalLead(payload.new)
 if (setLead) setLead(payload.new)
 }
 )
 .subscribe()
 return () => supabase.removeChannel(channel)
 }, [lead?.id])

 const handleSelectProject = (l) => {
 setLocalLead(l)
 if (setLead) setLead(l)
 }

 const meta = parseMeta(lead?.note)

 // Montant : d'abord pay_amount BDD, sinon extraire depuis note, sinon config
 const payAmount = lead?.pay_amount || (() => {
 if (lead?.note) {
 const match = lead.note.match(/Estimation: (\d+(?:\.\d+)?) DT/)
 if (match) return parseFloat(match[1])
 }
 if (!config || !lead?.pack) return 0
 const pack = lead.pack.toLowerCase()
 return config[pack]?.annual || config[pack]?.one_time || 0
 })()

 const handlePayConfirm = async (method) => {
 if (!lead?.id) return
 setPaying(true)
 WalaupSound.send()
 let m = deepClone(meta)
 m = addHistory(m, 'payment_pending', `Paiement initié via ${method} — en attente de confirmation`)
 await supabase.from('leads').update({
 note: encodeMeta(m),
 status: 'payment_requested',
 pay_method: method,
 pay_amount: payAmount,
 }).eq('id', lead.id)
 await supabase.from('messages').insert({
 lead_id: lead.id, sender: 'client',
 text: `💳 J'ai effectué le paiement de ${payAmount} DT via ${method}. Merci de confirmer la réception.`
 })
 await supabase.from('payments').insert({
 lead_id: lead.id,
 client_name: lead.name,
 description: `Achat Pack ${lead.pack} — ${lead.type || ''}`,
 method,
 amount: payAmount,
 status: 'pending',
 type: 'annual',
 })
 // Realtime mettra à jour le lead automatiquement
 setPayModalOpen(false)
 setPaying(false)
 WalaupSound.success()
 }

 if (!lead) return (
 <>
 <style>{CSS}</style>
 <div className="tp-empty">
 <Rocket size={40} style= marginBottom:12, opacity:.3 />
 <div style= fontSize:15, fontWeight:700, color:'var(--tx)', marginBottom:8 >Aucun projet en cours</div>
 <p style= fontSize:13, color:'var(--tx-3)', marginBottom:20 >Décrivez votre besoin dans notre estimateur et recevez une démo en 48h.</p>
 <a href="/estimateur" className="tp-btn tp-btn--primary">Estimer mon app</a>
 </div>
 </>
 )

 const status = lead.status || 'new'
 const smeta = STATUS_META[status] || STATUS_META.new
 const currentIdx = STEPS.findIndex(s => s.id === status)
 const payPending = meta.history?.find(h => h.event === 'payment_pending') && status === 'payment_requested'

 return (
 <>
 <style>{CSS}</style>

 {payModalOpen && (
 <PaymentModal
 lead={lead}
 amount={payAmount}
 title="Paiement de votre application"
 description="Choisissez votre méthode de paiement préférée. Notre équipe confirme sous 24h."
 onClose={() => setPayModalOpen(false)}
 onConfirm={handlePayConfirm}
 saving={paying}
 />
 )}

 <div style= padding:'20px 24px' >
 <div style= fontSize:18, fontWeight:800, color:'var(--tx)', fontFamily:'Space Grotesk,sans-serif', marginBottom:18 >Mon Projet</div>

 {/* Sélecteur multi-projets */}
 <ProjectSelector leads={allLeads} activeLead={lead} onSelect={handleSelectProject} />

 {/* Stepper */}
 <div className="tp-stepper">
 {STEPS.map((step, i) => {
 const done = i < currentIdx, active = i === currentIdx
 const Icon = step.icon
 return (
 <div key={step.id} className="tp-step">
 <div className="tp-step-row">
 {i > 0 && <div className="tp-step-line" style= background: done ? step.color : 'rgba(255,255,255,0.06)' />}
 <div className="tp-step-circle" style={{ background: done ? step.color : active ? step.color + '22' : 'rgba(255,255,255,0.04)', border: `2px solid ${done||active ? step.color : 'rgba(255,255,255,0.1)'}`, boxShadow: active ? `0 0 14px ${step.color}60` : 'none' }}>
 {done ? <Check size={14} color="#fff"/> : <Icon size={15} color={active ? step.color : 'var(--tx-3)'}/>}
 </div>
 {i < STEPS.length - 1 && <div className="tp-step-line" style= background: done ? step.color : 'rgba(255,255,255,0.06)' />}
 </div>
 <span className="tp-step-label" style= color: active ? step.color : done ? 'var(--tx-2)' : 'var(--tx-3)' >{step.label}</span>
 </div>
 )
 })}
 </div>

 {/* Status card */}
 <div className="tp-card">
 <span className="tp-status-tag" style= background: smeta.color + '18', color: smeta.color >
 {status === 'payment_requested' && <span className="tp-pulse" style= width:7, height:7, borderRadius:'50%', background:smeta.color, display:'inline-block' />}
 {smeta.label}
 </span>
 <p style= fontSize:13, color:'var(--tx-2)', lineHeight:1.6, margin:0 >
 {status === 'new' && 'Votre demande a bien été reçue. Notre équipe vous contacte sous 24h pour démarrer.'}
 {status === 'demo' && 'Votre démo est disponible ! Visualisez-la ci-dessous et donnez-nous votre retour.'}
 {status === 'payment_requested' && !payPending && 'Votre démo a été validée ✓ — Effectuez le paiement pour lancer le développement.'}
 {status === 'payment_requested' && payPending && '⏳ Paiement notifié — notre équipe vérifie la réception. Confirmation sous 24h.'}
 {status === 'payment_confirmed' && 'Paiement confirmé ✓ — Notre équipe travaille sur votre application finale.'}
 {status === 'delivered' && '🎉 Félicitations ! Votre application est déployée et prête à utiliser.'}
 </p>
 <div style= marginTop:14, display:'flex', gap:10, flexWrap:'wrap' >
 {status === 'payment_requested' && !payPending && (
 <button className="tp-btn tp-btn--gold" onClick={() => setPayModalOpen(true)}>
 <CreditCard size={14}/> Effectuer le paiement — {payAmount} DT
 </button>
 )}
 {status === 'payment_requested' && payPending && (
 <span className="tp-btn tp-btn--ghost tp-pulse">Paiement en cours de vérification…</span>
 )}
 {status === 'delivered' && meta.finalUrl && (
 <a className="tp-btn tp-btn--primary" href={meta.finalUrl} target="_blank" rel="noreferrer">
 <Rocket size={14}/> Accéder à mon application
 </a>
 )}
 </div>
 </div>

 {['demo','payment_requested','payment_confirmed','delivered'].includes(status) && (
 <DemoViewer lead={lead} setLead={setLocalLead} meta={meta} />
 )}

 <HistoryTimeline lead={lead} meta={meta} />

 <div className="tp-card">
 <div className="tp-card-title"><AlertCircle size={13}/> Détails du projet</div>
 <div className="tp-info-grid">
 <div><div className="tp-info-label">Application</div><div className="tp-info-value">{lead.type || '—'}</div></div>
 <div><div className="tp-info-label">Pack</div><div className="tp-info-value">{lead.pack || '—'}</div></div>
 <div><div className="tp-info-label">Source</div><div className="tp-info-value">{lead.source || '—'}</div></div>
 <div><div className="tp-info-label">Date demande</div><div className="tp-info-value">{lead.created_at ? new Date(lead.created_at).toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' }) : '—'}</div></div>
 </div>
 {lead.note && !lead.note.startsWith('walaup_') && (
 <div className="tp-note">
 <span className="tp-note-tag">✦ Note de l'équipe Walaup</span>
 <p className="tp-note-text">{lead.note}</p>
 </div>
 )}
 </div>
 </div>
 </>
 )
}
    { slot: 3, url: '', status: 'locked' },
  ],
  finalUrl: '',
  payStatus: 'none',
  validatedSlot: null,
  history: [],
  appCredentials: { login: '', password: '', usageGuide: '' },
}

function parseMeta(note) {
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

function encodeMeta(m) { return 'walaup_demos:' + JSON.stringify(m) }

function addHistory(meta, event, description) {
  const m = deepClone(meta)
  if (!m.history) m.history = []
  // Éviter les doublons
  if (!m.history.find(h => h.event === event)) {
    m.history.push({ event, description, date: new Date().toISOString() })
  }
  return m
}

// ─── Config ───────────────────────────────────────────────────────────────────
const STEPS = [
  { id: 'new',               label: 'Demande reçue',   icon: CheckCircle2, color: '#22D3EE' },
  { id: 'demo',              label: 'Démo prête',      icon: Zap,          color: '#6366F1' },
  { id: 'payment_requested', label: 'Paiement',        icon: CreditCard,   color: '#F59E0B' },
  { id: 'payment_confirmed', label: 'Développement',   icon: Clock,        color: '#8B5CF6' },
  { id: 'delivered',         label: 'Livré 🎉',        icon: Rocket,       color: '#10B981' },
]

const STATUS_META = {
  new:               { color: '#22D3EE', label: 'Demande reçue' },
  demo:              { color: '#6366F1', label: 'Démo disponible' },
  payment_requested: { color: '#F59E0B', label: 'Paiement requis' },
  payment_confirmed: { color: '#8B5CF6', label: 'En développement' },
  delivered:         { color: '#10B981', label: 'Application livrée' },
}

const PAYMENT_METHODS = [
  { id: 'flouci',   label: 'Flouci',   emoji: '📱', desc: 'Portefeuille mobile' },
  { id: 'konnect',  label: 'Konnect',  emoji: '💳', desc: 'Carte Visa/Mastercard' },
  { id: 'd17',      label: 'D17',      emoji: '📲', desc: 'Mobile payment' },
  { id: 'virement', label: 'Virement', emoji: '🏦', desc: 'Virement bancaire' },
  { id: 'especes',  label: 'Espèces',  emoji: '💵', desc: 'Paiement en main' },
  { id: 'cheque',   label: 'Chèque',   emoji: '📄', desc: 'Chèque bancaire' },
]

// ─── CSS ─────────────────────────────────────────────────────────────────────
const CSS = `
  /* Stepper */
  .tp-stepper { display:flex; align-items:flex-start; margin-bottom:28px; overflow-x:auto; padding-bottom:6px; scrollbar-width:none; }
  .tp-stepper::-webkit-scrollbar { display:none; }
  .tp-step { display:flex; flex-direction:column; align-items:center; flex:1; min-width:64px; }
  .tp-step-row { display:flex; align-items:center; width:100%; }
  .tp-step-line { flex:1; height:2px; border-radius:1px; }
  .tp-step-circle { width:34px; height:34px; min-width:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; transition:all .3s; z-index:1; }
  .tp-step-label { font-size:10px; color:var(--tx-3); margin-top:7px; text-align:center; line-height:1.3; max-width:70px; }

  /* Cards */
  .tp-card { background:rgba(13,17,32,.60); border:1px solid rgba(255,255,255,.07); border-radius:18px; padding:20px; margin-bottom:14px; backdrop-filter:blur(14px); }
  .tp-card-title { font-size:11px; font-weight:700; color:var(--tx-3); text-transform:uppercase; letter-spacing:.08em; margin-bottom:14px; display:flex; align-items:center; gap:7px; }

  /* Status tag */
  .tp-status-tag { display:inline-flex; align-items:center; gap:6px; padding:4px 12px; border-radius:20px; font-size:11px; font-weight:700; margin-bottom:12px; }

  /* Buttons */
  .tp-btn { display:inline-flex; align-items:center; gap:8px; padding:10px 18px; border-radius:12px; font-size:13px; font-weight:700; font-family:var(--font-body); cursor:pointer; border:none; transition:all .2s; text-decoration:none; }
  .tp-btn--primary { background:linear-gradient(135deg,var(--ac),var(--ac-2)); color:#fff; box-shadow:0 4px 16px rgba(99,102,241,.28); }
  .tp-btn--gold { background:linear-gradient(135deg,#F59E0B,#D97706); color:#fff; box-shadow:0 4px 16px rgba(245,158,11,.28); }
  .tp-btn--ghost { background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.1); color:var(--tx-2); }
  .tp-btn:hover:not(:disabled) { transform:translateY(-1px); filter:brightness(1.08); }
  .tp-btn:disabled { opacity:.4; cursor:not-allowed; transform:none; filter:none; }
  @keyframes tp-pulse { 0%,100%{opacity:1}50%{opacity:.4} }
  .tp-pulse { animation:tp-pulse 1.8s ease-in-out infinite; }

  /* History timeline */
  .tp-timeline { display:flex; flex-direction:column; gap:0; }
  .tp-hist-item { display:flex; gap:12px; position:relative; }
  .tp-hist-item:not(:last-child)::before { content:''; position:absolute; left:16px; top:28px; bottom:-4px; width:1px; background:rgba(255,255,255,0.07); }
  .tp-hist-dot { width:32px; height:32px; min-width:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
  .tp-hist-content { flex:1; padding-bottom:18px; }
  .tp-hist-title { font-size:13px; font-weight:600; color:var(--tx); margin-bottom:2px; }
  .tp-hist-date { font-size:11px; color:var(--tx-3); display:flex; align-items:center; gap:5px; margin-bottom:4px; }
  .tp-hist-desc { font-size:12px; color:var(--tx-2); line-height:1.5; }

  /* Demo card */
  .tp-demo-card { border:1px solid rgba(255,255,255,0.09); border-radius:12px; padding:14px; margin-bottom:9px; background:rgba(8,11,20,0.5); }
  .tp-demo-card--validated { border-color:rgba(16,185,129,0.35); background:rgba(16,185,129,0.04); }
  .tp-demo-card--dim { opacity:0.38; pointer-events:none; }
  .tp-demo-head { display:flex; align-items:center; gap:8px; margin-bottom:11px; }
  .tp-demo-num { font-size:12px; font-weight:800; color:var(--tx); font-family:'Space Grotesk',sans-serif; }
  .tp-demo-badge { padding:2px 9px; border-radius:20px; font-size:10px; font-weight:700; }
  .tp-demo-actions { display:flex; gap:7px; flex-wrap:wrap; }
  .tp-demo-btn { display:flex; align-items:center; gap:6px; padding:7px 14px; border-radius:9px; font-size:12px; font-weight:700; cursor:pointer; border:none; transition:all .18s; font-family:'Inter',sans-serif; }
  .tp-demo-btn:disabled { opacity:.4; cursor:not-allowed; }
  .tp-demo-btn--view { background:rgba(99,102,241,0.14); border:1px solid rgba(99,102,241,0.28); color:var(--ac); }
  .tp-demo-btn--modify { background:rgba(251,146,60,0.1); border:1px solid rgba(251,146,60,0.25); color:#FB923C; }
  .tp-demo-btn--validate { background:linear-gradient(135deg,#10B981,#059669); color:#fff; box-shadow:0 3px 12px rgba(16,185,129,0.25); }
  .tp-demo-btn--view:hover:not(:disabled) { background:rgba(99,102,241,0.22); }
  .tp-demo-btn--modify:hover:not(:disabled) { background:rgba(251,146,60,0.2); }
  .tp-demo-btn--validate:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 5px 18px rgba(16,185,129,0.38); }

  /* Payment modal */
  .tp-modal-ov { position:fixed; inset:0; background:rgba(0,0,0,0.78); z-index:8000; display:flex; align-items:center; justify-content:center; padding:20px; backdrop-filter:blur(6px); }
  .tp-modal { background:#0D1120; border:1px solid rgba(255,255,255,0.12); border-radius:20px; padding:28px; width:460px; max-width:100%; box-shadow:0 24px 80px rgba(0,0,0,0.7); max-height:90vh; overflow-y:auto; }
  .tp-modal::-webkit-scrollbar { width:3px; }
  .tp-modal::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:2px; }
  .tp-modal-title { font-family:'Space Grotesk',sans-serif; font-weight:800; font-size:18px; color:var(--tx); margin-bottom:5px; }
  .tp-modal-sub { font-size:13px; color:var(--tx-2); margin-bottom:22px; line-height:1.5; }
  .tp-method-grid { display:grid; grid-template-columns:1fr 1fr; gap:9px; margin-bottom:18px; }
  .tp-method-card { padding:12px 14px; border-radius:11px; border:1.5px solid rgba(255,255,255,0.09); background:rgba(255,255,255,0.03); cursor:pointer; transition:all .18s; text-align:left; }
  .tp-method-card--on { border-color:rgba(99,102,241,0.5); background:rgba(99,102,241,0.1); }
  .tp-method-emoji { font-size:20px; margin-bottom:6px; }
  .tp-method-name { font-size:13px; font-weight:700; color:var(--tx); margin-bottom:2px; }
  .tp-method-desc { font-size:11px; color:var(--tx-3); }
  .tp-amount-box { background:rgba(245,158,11,0.07); border:1px solid rgba(245,158,11,0.2); border-radius:13px; padding:16px; margin-bottom:18px; display:flex; align-items:center; justify-content:space-between; }
  .tp-amount-label { font-size:12px; color:var(--tx-3); margin-bottom:4px; }
  .tp-amount-value { font-family:'JetBrains Mono',monospace; font-size:26px; font-weight:800; color:var(--gold); }
  .tp-confirm-btn { width:100%; padding:13px; border-radius:12px; background:linear-gradient(135deg,#6366F1,#8B5CF6); border:none; color:#fff; font-size:14px; font-weight:700; cursor:pointer; box-shadow:0 5px 20px rgba(99,102,241,0.32); font-family:'Space Grotesk',sans-serif; display:flex; align-items:center; justify-content:center; gap:9px; }
  .tp-confirm-btn:disabled { opacity:.5; cursor:not-allowed; }
  .tp-cancel-btn { width:100%; padding:11px; border-radius:12px; background:transparent; border:1px solid rgba(255,255,255,0.1); color:var(--tx-3); font-size:13px; cursor:pointer; margin-top:8px; font-family:'Inter',sans-serif; }

  /* Preview */
  .tp-prev-ov { position:fixed; inset:0; background:rgba(0,0,0,0.88); z-index:9999; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:20px; }
  .tp-prev-head { padding:10px 14px; border-bottom:1px solid rgba(255,255,255,0.08); display:flex; gap:8px; align-items:center; }
  .tp-prev-url { flex:1; font-size:11px; color:var(--tx-3); font-family:'JetBrains Mono',monospace; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .tp-toggle-wrap { display:flex; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09); border-radius:8px; padding:2px; gap:2px; }
  .tp-toggle-btn { padding:4px 10px; border-radius:6px; border:none; font-size:11px; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:4px; background:transparent; color:var(--tx-3); font-family:'Inter',sans-serif; }
  .tp-toggle-btn--on { background:rgba(99,102,241,0.2); color:var(--ac); }
  .tp-close-btn { width:28px; height:28px; border-radius:7px; border:none; background:rgba(248,113,113,0.12); color:#F87171; cursor:pointer; display:flex; align-items:center; justify-content:center; }
  .tp-phone-shell { background:rgba(13,17,32,0.95); border:2px solid rgba(255,255,255,0.15); border-radius:36px; padding:14px; box-shadow:0 40px 100px rgba(0,0,0,0.8); }
  .tp-phone-notch { width:60px; height:5px; background:rgba(255,255,255,0.1); border-radius:3px; margin:0 auto 10px; }
  .tp-phone-screen { width:260px; height:520px; border-radius:24px; overflow:hidden; background:#000; }

  /* Info grid */
  .tp-info-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(130px,1fr)); gap:12px; }
  .tp-info-label { font-size:11px; font-weight:600; color:var(--tx-3); text-transform:uppercase; letter-spacing:.05em; margin-bottom:4px; }
  .tp-info-value { font-size:13px; color:var(--tx); font-weight:500; }
  .tp-note { margin-top:14px; padding:12px 14px; background:rgba(99,102,241,.07); border:1px solid rgba(99,102,241,.14); border-radius:11px; }
  .tp-note-tag { font-size:10px; font-weight:700; color:var(--ac); text-transform:uppercase; letter-spacing:.06em; display:block; margin-bottom:5px; }
  .tp-note-text { font-size:13px; color:var(--tx-2); line-height:1.6; margin:0; }
  .tp-empty { text-align:center; padding:48px 20px; color:var(--tx-3); }
`

// ─── Preview modal ────────────────────────────────────────────────────────────
function DemoPreviewModal({ url, onClose }) {
  const [mode, setMode] = useState('mobile')
  const screenRef = useRef(null)
  const iframeRef = useRef(null)

  const scaleMobile = useCallback(() => {
    if (!screenRef.current || !iframeRef.current) return
    const mw = 390, scale = screenRef.current.clientWidth / mw
    iframeRef.current.style.width = mw + 'px'
    iframeRef.current.style.height = Math.ceil(screenRef.current.clientHeight / scale) + 'px'
    iframeRef.current.style.transform = `scale(${scale})`
    iframeRef.current.style.transformOrigin = 'top left'
  }, [])

  useEffect(() => { if (mode === 'mobile') setTimeout(scaleMobile, 120) }, [mode, scaleMobile])

  return (
    <div className="tp-prev-ov" onClick={onClose}>
      <div style={{ background: '#0D1120', borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 40px 100px rgba(0,0,0,0.8)', width: mode === 'mobile' ? 'auto' : 'min(900px,92vw)', display: 'flex', flexDirection: 'column' }}
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
                <iframe ref={iframeRef} src={url} sandbox="allow-scripts allow-forms allow-popups" title="preview" style={{ border: 'none', display: 'block' }} onLoad={scaleMobile} />
              </div>
            </div>
          </div>
        ) : (
          <>
            <div style={{ background: 'rgba(17,24,39,0.9)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ display: 'flex', gap: 5 }}>
                {['#F87171','#FBBF24','#34D399'].map(c => <div key={c} style={{ width: 9, height: 9, borderRadius: '50%', background: c }} />)}
              </div>
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 5, padding: '3px 10px', fontSize: 11, color: 'var(--tx-3)', fontFamily: "'JetBrains Mono',monospace", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{url}</div>
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

// ─── Payment Modal ─────────────────────────────────────────────────────────────
function PaymentModal({ lead, amount, title, description, onClose, onConfirm, saving }) {
  const [method, setMethod] = useState('flouci')

  const selected = PAYMENT_METHODS.find(p => p.id === method)

  const instructions = {
    flouci: ['Ouvrez l\'app Flouci sur votre téléphone', 'Scannez le QR ou envoyez au : 00 000 000', 'Montant exact : ' + amount + ' DT', 'Envoyez une capture à votre conseiller Walaup'],
    konnect: ['Cliquez sur "Confirmer" pour accéder au paiement sécurisé', 'Entrez vos informations de carte', 'Validez et revenez ici', 'Notre équipe confirme sous 24h'],
    d17: ['Ouvrez D17 sur votre téléphone', 'Choisissez "Paiement marchand"', 'Montant : ' + amount + ' DT', 'Envoyez une capture à votre conseiller'],
    virement: ['Banque : BIAT', 'RIB : 08 006 0123456789012 56', 'Montant exact : ' + amount + ' DT', 'Objet : Walaup - ' + (lead?.name || '')],
    especes: ['Contactez votre conseiller Walaup', 'Rendez-vous au bureau ou à votre domicile', 'Montant : ' + amount + ' DT', 'Un reçu vous sera remis immédiatement'],
    cheque: ['Libellé : "Walaup"', 'Montant : ' + amount + ' DT', 'Envoyez par courrier ou remise en main propre', 'Confirmation sous 2-3 jours ouvrés'],
  }

  return (
    <div className="tp-modal-ov" onClick={onClose}>
      <div className="tp-modal" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div className="tp-modal-title">{title}</div>
            <div className="tp-modal-sub">{description}</div>
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.06)', color: 'var(--tx-3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <X size={14} />
          </button>
        </div>

        {/* Montant */}
        <div className="tp-amount-box">
          <div>
            <div className="tp-amount-label">Montant à payer</div>
            <div className="tp-amount-value">{amount} DT</div>
          </div>
          <div style={{ fontSize: 36 }}>💳</div>
        </div>

        {/* Choix méthode */}
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--tx-3)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 10 }}>Choisissez votre méthode</div>
        <div className="tp-method-grid">
          {PAYMENT_METHODS.map(pm => (
            <button key={pm.id} className={`tp-method-card${method === pm.id ? ' tp-method-card--on' : ''}`}
              onClick={() => setMethod(pm.id)}>
              <div className="tp-method-emoji">{pm.emoji}</div>
              <div className="tp-method-name">{pm.label}</div>
              <div className="tp-method-desc">{pm.desc}</div>
            </button>
          ))}
        </div>

        {/* Instructions */}
        {instructions[method] && (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 11, padding: '13px 15px', marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--tx-3)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 10 }}>
              {selected?.emoji} Instructions — {selected?.label}
            </div>
            {instructions[method].map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8, alignItems: 'flex-start' }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 10, fontWeight: 700, color: 'var(--ac)' }}>{i + 1}</div>
                <span style={{ fontSize: 12, color: 'var(--tx-2)', lineHeight: 1.5 }}>{step}</span>
              </div>
            ))}
          </div>
        )}

        <button className="tp-confirm-btn" onClick={() => onConfirm(method)} disabled={saving}>
          {saving ? 'Envoi en cours…' : <><Send size={15} /> Confirmer et notifier Walaup</>}
        </button>
        <button className="tp-cancel-btn" onClick={onClose}>Annuler</button>

        <p style={{ fontSize: 11, color: 'var(--tx-3)', textAlign: 'center', marginTop: 12, lineHeight: 1.5 }}>
          Votre conseiller confirmera la réception du paiement sous 24h.
        </p>
      </div>
    </div>
  )
}

// ─── History timeline ──────────────────────────────────────────────────────────
function HistoryTimeline({ lead, meta }) {
  const events = []

  const fmt = (d) => {
    if (!d) return null
    const dt = new Date(d)
    return dt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) + ' à ' +
      dt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  }

  // Demande reçue
  if (lead.created_at) events.push({ color: '#22D3EE', icon: CheckCircle2, title: 'Demande reçue', date: lead.created_at, desc: `Demande ${lead.type || ''} — Pack ${lead.pack || 'non défini'}` })

  // Events from meta.history
  const histMap = {}
  ;(meta.history || []).forEach(h => { histMap[h.event] = h })

  if (histMap.demo_sent) events.push({ color: '#6366F1', icon: Zap, title: 'Démo envoyée', date: histMap.demo_sent.date, desc: histMap.demo_sent.description || 'Première démo disponible' })
  if (histMap.modify_1) events.push({ color: '#FB923C', icon: RefreshCw, title: 'Modification demandée', date: histMap.modify_1.date, desc: histMap.modify_1.description || 'Retour client sur démo 1' })
  if (histMap.demo_2_sent) events.push({ color: '#6366F1', icon: Zap, title: 'Démo 2 envoyée', date: histMap.demo_2_sent.date, desc: histMap.demo_2_sent.description || 'Deuxième version disponible' })
  if (histMap.modify_2) events.push({ color: '#FB923C', icon: RefreshCw, title: 'Modification demandée (2)', date: histMap.modify_2.date, desc: histMap.modify_2.description || 'Retour client sur démo 2' })
  if (histMap.demo_3_sent) events.push({ color: '#6366F1', icon: Zap, title: 'Démo 3 envoyée', date: histMap.demo_3_sent.date, desc: histMap.demo_3_sent.description || 'Troisième version disponible' })
  if (histMap.validated) events.push({ color: '#10B981', icon: CheckCircle2, title: `Démo validée (version ${meta.validatedSlot || '?'})`, date: histMap.validated.date, desc: 'Vous avez approuvé cette version' })
  if (histMap.payment_requested) events.push({ color: '#F59E0B', icon: CreditCard, title: 'Paiement demandé', date: histMap.payment_requested.date, desc: `${lead.pay_amount || '?'} DT via ${lead.pay_method || '?'}` })
  if (histMap.payment_pending) events.push({ color: '#FB923C', icon: Clock, title: 'Paiement en cours', date: histMap.payment_pending.date, desc: 'En attente de confirmation par Walaup' })
  if (histMap.payment_confirmed || lead.status === 'payment_confirmed' || lead.status === 'delivered') {
    const h = histMap.payment_confirmed
    events.push({ color: '#10B981', icon: CheckCircle2, title: 'Paiement confirmé', date: h?.date || null, desc: `${lead.pay_amount || '?'} DT reçu — Développement lancé` })
  }
  if (histMap.delivered || lead.status === 'delivered') {
    const h = histMap.delivered
    events.push({ color: '#10B981', icon: Rocket, title: '🎉 Application livrée', date: h?.date || null, desc: meta.finalUrl || 'Application déployée et opérationnelle' })
  }

  // Sort by date
  events.sort((a, b) => {
    if (!a.date) return 1
    if (!b.date) return -1
    return new Date(a.date) - new Date(b.date)
  })

  if (events.length === 0) return null

  return (
    <div className="tp-card">
      <div className="tp-card-title"><Calendar size={12} /> Historique du projet</div>
      <div className="tp-timeline">
        {events.map((ev, i) => {
          const Icon = ev.icon
          return (
            <div key={i} className="tp-hist-item">
              <div className="tp-hist-dot" style={{ background: `${ev.color}18`, border: `2px solid ${ev.color}40` }}>
                <Icon size={14} color={ev.color} strokeWidth={2} />
              </div>
              <div className="tp-hist-content">
                <div className="tp-hist-title">{ev.title}</div>
                {ev.date && (
                  <div className="tp-hist-date">
                    <Calendar size={10} color="var(--tx-3)" />
                    {fmt(ev.date)}
                  </div>
                )}
                {ev.desc && <div className="tp-hist-desc">{ev.desc}</div>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── DemoViewer client ────────────────────────────────────────────────────────
function DemoViewer({ lead, setLead, meta }) {
  const [previewUrl, setPreviewUrl] = useState(null)
  const [acting, setActing] = useState(false)

  const visibleDemos = (meta.demos || []).filter(d =>
    ['sent', 'modify_requested', 'validated'].includes(d.status) && d.url
  )

  if (visibleDemos.length === 0) return null

  const persist = async (newMeta, extra = {}) => {
    await supabase.from('leads').update({ note: encodeMeta(newMeta), ...extra }).eq('id', lead.id)
    const { data } = await supabase.from('leads').select('*').eq('id', lead.id).maybeSingle()
    if (data && setLead) setLead(data)
  }

  const handleModify = async (slot) => {
    if (acting) return
    setActing(true)
    WalaupSound.click()
    let m = deepClone(meta)
    const idx = m.demos.findIndex(d => d.slot === slot)
    m.demos[idx].status = 'modify_requested'
    const nextIdx = m.demos.findIndex(d => d.slot === slot + 1)
    if (nextIdx !== -1 && m.demos[nextIdx].status === 'locked') m.demos[nextIdx].status = 'pending'
    m = addHistory(m, `modify_${slot}`, `Retour client — Modification demandée pour démo ${slot}`)
    await persist(m)
    await supabase.from('messages').insert({ lead_id: lead.id, sender: 'client', text: `↩️ Demande de modification pour la démo ${slot}. Merci d'envoyer une nouvelle version.` })
    setActing(false)
  }

  const handleValidate = async (slot) => {
    if (acting) return
    if (!confirm(`Valider la démo ${slot} ? Cela déclenchera la demande de paiement.`)) return
    setActing(true)
    WalaupSound.success()
    let m = deepClone(meta)
    m.demos = m.demos.map(d => ({ ...d, status: d.slot === slot ? 'validated' : (d.status !== 'locked' ? 'disabled' : 'locked') }))
    m.validatedSlot = slot
    m.payStatus = 'requested'
    m = addHistory(m, 'validated', `Démo ${slot} validée par le client`)
    m = addHistory(m, 'payment_requested', 'Paiement demandé automatiquement après validation')
    await persist(m, { status: 'payment_requested' })
    await supabase.from('messages').insert({ lead_id: lead.id, sender: 'client', text: `✅ J'ai validé la démo ${slot} et je suis prêt à effectuer le paiement.` })
    setActing(false)
  }

  const anyValidated = (meta.demos || []).some(d => d.status === 'validated')
  const isDelivered = lead.status === 'delivered'

  return (
    <>
      {previewUrl && <DemoPreviewModal url={previewUrl} onClose={() => setPreviewUrl(null)} />}
      <div className="tp-card" style={{ borderColor: 'rgba(99,102,241,0.2)' }}>
        <div className="tp-card-title"><Zap size={12} color="var(--ac)" /> Vos démos ({visibleDemos.length})</div>
        {visibleDemos.map(demo => {
          const isSent      = demo.status === 'sent'
          const isModReq    = demo.status === 'modify_requested'
          const isValidated = demo.status === 'validated'
          const canModify   = isSent && !anyValidated && demo.slot < 3 && !isDelivered
          const canValidate = isSent && !anyValidated && !isDelivered
          let statusColor = '#6366F1', statusBg = 'rgba(99,102,241,0.1)', statusLabel = '📨 Envoyée'
          if (isModReq)    { statusColor = '#FB923C'; statusBg = 'rgba(251,146,60,0.1)';  statusLabel = '↩️ Modification demandée' }
          if (isValidated) { statusColor = '#10B981'; statusBg = 'rgba(16,185,129,0.12)'; statusLabel = '✅ Validée' }
          return (
            <div key={demo.slot} className={`tp-demo-card${isValidated ? ' tp-demo-card--validated' : ''}${isModReq ? ' tp-demo-card--dim' : ''}`}>
              <div className="tp-demo-head">
                <span className="tp-demo-num">Démo {demo.slot}</span>
                <span className="tp-demo-badge" style={{ background: statusBg, color: statusColor }}>{statusLabel}</span>
              </div>
              <div className="tp-demo-actions">
                <button className="tp-demo-btn tp-demo-btn--view" onClick={() => { setPreviewUrl(demo.url); WalaupSound.click() }}>
                  <Eye size={13} /> Visualiser
                </button>
                {canModify && (
                  <button className="tp-demo-btn tp-demo-btn--modify" onClick={() => handleModify(demo.slot)} disabled={acting}>
                    <RefreshCw size={13} /> Demander modification
                  </button>
                )}
                {canValidate && (
                  <button className="tp-demo-btn tp-demo-btn--validate" onClick={() => handleValidate(demo.slot)} disabled={acting}>
                    <CheckCircle2 size={13} /> Valider cette démo
                  </button>
                )}
                {isValidated && !isDelivered && (
                  <span style={{ fontSize: 12, color: '#10B981', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <CheckCircle2 size={13} /> Validée — paiement en attente
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}

// ─── TabProjet principal ──────────────────────────────────────────────────────
export default function TabProjet({ lead, session, setLead }) {
  const [payModalOpen, setPayModalOpen] = useState(false)
  const [paying, setPaying] = useState(false)
  const [config, setConfig] = useState(null)

  // Load tarifs config for pay amount
  useEffect(() => {
    supabase.from('config').select('value').eq('key', 'tarifs').maybeSingle()
      .then(({ data }) => { if (data) setConfig(data.value) })
  }, [])

  const meta = parseMeta(lead?.note)

  const payAmount = lead?.pay_amount || (() => {
    if (!config || !lead?.pack) return 0
    const pack = lead.pack.toLowerCase()
    return config[pack]?.annual || config[pack]?.one_time || 0
  })()

  const handlePayConfirm = async (method) => {
    if (!lead?.id) return
    setPaying(true)
    WalaupSound.send()
    let m = deepClone(meta)
    m = addHistory(m, 'payment_pending', `Paiement initié via ${method} — en attente de confirmation`)
    await supabase.from('leads').update({
      note: encodeMeta(m),
      status: 'payment_requested',
      pay_method: method,
      pay_amount: payAmount,
    }).eq('id', lead.id)
    await supabase.from('messages').insert({
      lead_id: lead.id, sender: 'client',
      text: `💳 J'ai effectué le paiement de ${payAmount} DT via ${method}. Merci de confirmer la réception.`
    })
    // Enregistrer dans payments
    await supabase.from('payments').insert({
      lead_id: lead.id,
      client_name: lead.name,
      description: `Achat Pack ${lead.pack} — ${lead.type || ''}`,
      method,
      amount: payAmount,
      status: 'pending',
      type: 'annual',
    })
    const { data } = await supabase.from('leads').select('*').eq('id', lead.id).maybeSingle()
    if (data && setLead) setLead(data)
    setPayModalOpen(false)
    setPaying(false)
    WalaupSound.success()
  }

  if (!lead) return (
    <>
      <style>{CSS}</style>
      <div className="tp-empty">
        <div style={{ fontSize: 40, marginBottom: 16 }}>🚀</div>
        <h3 style={{ color: 'var(--tx)', fontSize: 16, marginBottom: 8 }}>Aucun projet en cours</h3>
        <p style={{ fontSize: 13, lineHeight: 1.6, maxWidth: 280, margin: '0 auto 20px' }}>
          Décrivez votre besoin dans notre estimateur et recevez une démo en 48h.
        </p>
        <a href="/estimateur" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 22px', background: 'rgba(99,102,241,.15)', border: '1px solid rgba(99,102,241,.28)', borderRadius: 11, color: 'var(--ac)', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
          Estimer mon app <ExternalLink size={13} />
        </a>
      </div>
    </>
  )

  const status = lead.status || 'new'
  const smeta  = STATUS_META[status] || STATUS_META.new
  const currentIdx = STEPS.findIndex(s => s.id === status)
  const payPending = meta.history?.find(h => h.event === 'payment_pending') && status === 'payment_requested'

  return (
    <>
      <style>{CSS}</style>

      {/* Payment modal */}
      {payModalOpen && (
        <PaymentModal
          lead={lead}
          amount={payAmount}
          title="Effectuer le paiement"
          description={`Pack ${lead.pack || ''} — Démo validée. Choisissez votre méthode de paiement.`}
          onClose={() => setPayModalOpen(false)}
          onConfirm={handlePayConfirm}
          saving={paying}
        />
      )}

      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 800, color: 'var(--tx)', marginBottom: 24 }}>Mon Projet</h2>

      {/* Stepper */}
      <div className="tp-stepper">
        {STEPS.map((step, i) => {
          const done = i < currentIdx, active = i === currentIdx
          const Icon = step.icon
          return (
            <div key={step.id} className="tp-step">
              <div className="tp-step-row">
                {i > 0 && <div className="tp-step-line" style={{ background: done ? step.color : 'rgba(255,255,255,.08)' }} />}
                <div className="tp-step-circle" style={{ background: done ? step.color : active ? `${step.color}1A` : 'rgba(255,255,255,.05)', border: `2px solid ${done || active ? step.color : 'rgba(255,255,255,.09)'}`, boxShadow: active ? `0 0 18px ${step.color}55` : 'none' }}>
                  <Icon size={14} strokeWidth={2.2} color={done ? '#fff' : active ? step.color : 'var(--tx-3)'} />
                </div>
                {i < STEPS.length - 1 && <div className="tp-step-line" style={{ background: done ? step.color : 'rgba(255,255,255,.08)' }} />}
              </div>
              <span className="tp-step-label" style={{ color: active ? step.color : done ? 'var(--tx-2)' : 'var(--tx-3)', fontWeight: active ? 600 : 400 }}>{step.label}</span>
            </div>
          )
        })}
      </div>

      {/* Status card */}
      <div className="tp-card" style={{ borderColor: `${smeta.color}22` }}>
        <span className="tp-status-tag" style={{ background: `${smeta.color}15`, color: smeta.color, border: `1px solid ${smeta.color}28` }}>
          {status === 'payment_requested' && <span className="tp-pulse">●</span>}
          {smeta.label}
        </span>
        <p style={{ color: 'var(--tx-2)', fontSize: 14, lineHeight: 1.65, margin: '0 0 16px' }}>
          {status === 'new' && 'Votre demande a bien été reçue. Notre équipe vous contacte sous 24h pour démarrer.'}
          {status === 'demo' && 'Votre démo est disponible ! Visualisez-la ci-dessous et donnez-nous votre retour.'}
          {status === 'payment_requested' && !payPending && 'Votre démo a été validée ✓ — Effectuez le paiement pour lancer le développement.'}
          {status === 'payment_requested' && payPending && '⏳ Paiement notifié — notre équipe vérifie la réception. Confirmation sous 24h.'}
          {status === 'payment_confirmed' && 'Paiement confirmé ✓ — Notre équipe travaille sur votre application finale.'}
          {status === 'delivered' && '🎉 Félicitations ! Votre application est déployée et prête à utiliser.'}
        </p>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {status === 'payment_requested' && !payPending && (
            <button className="tp-btn tp-btn--gold" onClick={() => setPayModalOpen(true)}>
              <CreditCard size={15} /> Effectuer le paiement — {payAmount} DT
            </button>
          )}
          {status === 'payment_requested' && payPending && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px', borderRadius: 11, background: 'rgba(251,146,60,0.1)', border: '1px solid rgba(251,146,60,0.25)', fontSize: 13, color: '#FB923C', fontWeight: 600 }}>
              <Clock size={14} /> Paiement en cours de vérification…
            </div>
          )}
          {status === 'delivered' && meta.finalUrl && (
            <a href={meta.finalUrl} target="_blank" rel="noopener noreferrer" className="tp-btn tp-btn--primary">
              <Rocket size={14} /> Accéder à mon application
            </a>
          )}
        </div>
      </div>

      {/* Démos */}
      {['demo', 'payment_requested', 'payment_confirmed', 'delivered'].includes(status) && (
        <DemoViewer lead={lead} setLead={setLead} meta={meta} />
      )}

      {/* Historique complet */}
      <HistoryTimeline lead={lead} meta={meta} />

      {/* Infos projet */}
      <div className="tp-card">
        <div className="tp-card-title"><AlertCircle size={12} /> Détails du projet</div>
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
            <div className="tp-info-label">Date demande</div>
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
