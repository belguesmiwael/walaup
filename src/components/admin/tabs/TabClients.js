'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Search, Send, CheckCheck, X, CheckCircle2,
  Monitor, Smartphone, CreditCard, Rocket, Eye, MessageSquare, Link2
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

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

// ─── Static style constants ───────────────────────────────────────────────────
const sEmptyState  = { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, color: 'var(--tx-3)', fontSize: 13 }
const sLoadingList = { padding: 16, fontSize: 12, color: 'var(--tx-3)' }
const sStatusLabel = { fontSize: 10, color: 'var(--tx-3)', marginRight: 4 }
const sPackBadge   = { padding: '2px 9px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: 'rgba(99,102,241,0.12)', color: 'var(--ac)' }
const sNoMessages  = { textAlign: 'center', color: 'var(--tx-3)', fontSize: 12, padding: 20 }
const sCheckMark   = { marginLeft: 4 }

// ─── Helpers pour stocker l'URL démo/finale dans leads.note ──────────────────
// leads.note peut contenir soit du texte brut, soit un JSON préfixé par "walaup_meta:"
function parseMeta(note) {
  if (!note) return { userNote: '', demoUrl: '', finalUrl: '', payStatus: 'none' }
  try {
    if (note.startsWith('walaup_meta:')) {
      return { userNote: '', demoUrl: '', finalUrl: '', payStatus: 'none', ...JSON.parse(note.slice(12)) }
    }
  } catch {}
  return { userNote: note, demoUrl: '', finalUrl: '', payStatus: 'none' }
}

function encodeMeta(meta) {
  return 'walaup_meta:' + JSON.stringify(meta)
}

// ─── DemoPanel — utilise uniquement les colonnes existantes de leads ──────────
// Colonnes utilisées : note (pour demoUrl/finalUrl/payStatus), status, pay_method, pay_amount
function DemoPanel({ lead, onRefresh }) {
  const meta = parseMeta(lead.note)
  const [demoUrl, setDemoUrl]   = useState(meta.demoUrl || '')
  const [finalUrl, setFinalUrl] = useState(meta.finalUrl || '')
  const [payMethod, setPayMethod] = useState(lead.pay_method || 'flouci')
  const [payAmount, setPayAmount] = useState(lead.pay_amount ? String(lead.pay_amount) : '')
  const [saving, setSaving]     = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [previewMode, setPreviewMode] = useState('browser')

  const payStatus = meta.payStatus || 'none'
  const isDelivered = lead.status === 'delivered'

  const saveMeta = async (patch) => {
    const current = parseMeta(lead.note)
    const updated = { ...current, ...patch }
    await supabase.from('leads').update({ note: encodeMeta(updated) }).eq('id', lead.id)
  }

  // 1. Envoyer la démo au client
  const sendDemo = async () => {
    if (!demoUrl.trim()) return alert('Entre l\'URL de la démo avant d\'envoyer.')
    setSaving(true)
    await saveMeta({ demoUrl: demoUrl.trim() })
    await supabase.from('leads').update({ status: 'demo' }).eq('id', lead.id)
    await supabase.from('messages').insert({
      lead_id: lead.id,
      sender: 'admin',
      text: `🎯 Votre démo est prête ! Consultez-la ici : ${demoUrl.trim()} — Dites-nous si vous souhaitez des modifications.`,
    })
    await onRefresh()
    setSaving(false)
  }

  // 2. Demander le paiement
  const requestPayment = async () => {
    if (!payAmount || isNaN(parseFloat(payAmount))) return alert('Entre le montant avant de demander le paiement.')
    setSaving(true)
    const pm = PAYMENT_METHODS.find(p => p.id === payMethod)
    await saveMeta({ payStatus: 'requested' })
    await supabase.from('leads').update({
      status: 'payment_requested',
      pay_method: payMethod,
      pay_amount: parseFloat(payAmount),
    }).eq('id', lead.id)
    await supabase.from('messages').insert({
      lead_id: lead.id,
      sender: 'admin',
      text: `💳 Paiement requis pour continuer : ${payAmount} DT via ${pm?.label || payMethod}. Contactez-nous pour procéder.`,
    })
    await onRefresh()
    setSaving(false)
  }

  // 3. Confirmer le paiement reçu
  const confirmPayment = async () => {
    setSaving(true)
    await saveMeta({ payStatus: 'confirmed' })
    await supabase.from('leads').update({ status: 'payment_confirmed' }).eq('id', lead.id)
    await supabase.from('messages').insert({
      lead_id: lead.id,
      sender: 'admin',
      text: '✅ Paiement confirmé ! Votre application est en cours de développement final.',
    })
    await onRefresh()
    setSaving(false)
  }

  // 4. Livrer l'app finale
  const deliverApp = async () => {
    if (!finalUrl.trim()) return alert('Entre l\'URL de la version finale avant de livrer.')
    setSaving(true)
    await saveMeta({ finalUrl: finalUrl.trim(), payStatus: 'confirmed' })
    await supabase.from('leads').update({
      status: 'delivered',
      pay_ref: finalUrl.trim(),
    }).eq('id', lead.id)
    await supabase.from('messages').insert({
      lead_id: lead.id,
      sender: 'admin',
      text: `🎉 Félicitations ! Votre application est prête et déployée : ${finalUrl.trim()}`,
    })
    await onRefresh()
    setSaving(false)
  }

  const sSection  = { marginBottom: 14, padding: 14, borderRadius: 12, background: 'rgba(13,17,32,0.7)', border: '1px solid rgba(255,255,255,0.08)' }
  const sTitle    = { fontSize: 12, fontWeight: 700, color: 'var(--tx)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 7 }
  const sInp      = { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 9, padding: '8px 11px', color: 'var(--tx)', fontSize: 12, outline: 'none', fontFamily: "'JetBrains Mono',monospace", boxSizing: 'border-box', marginBottom: 8 }
  const sBtn      = (color='#6366F1') => ({ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 9, border: 'none', background: `linear-gradient(135deg,${color},${color}dd)`, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1 })
  const sBtnGhost = { display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 9, border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'var(--tx-2)', fontSize: 11, cursor: 'pointer', marginLeft: 8 }
  const sRow      = { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }
  const sMethodGrid = { display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }

  const previewOverlay = previewUrl && (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={() => setPreviewUrl(null)}>
      <div style={{ background: '#0D1120', borderRadius: 16, overflow: 'hidden', width: previewMode === 'phone' ? 390 : '90%', maxWidth: 1000, height: '85vh', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ flex: 1, fontSize: 12, color: 'var(--tx-2)' }}>{previewUrl}</span>
          <button style={{ ...sBtnGhost, marginLeft: 0 }} onClick={() => setPreviewMode('browser')}><Monitor size={11} /></button>
          <button style={{ ...sBtnGhost, marginLeft: 0 }} onClick={() => setPreviewMode('phone')}><Smartphone size={11} /></button>
          <button style={{ ...sBtnGhost, marginLeft: 0, color: '#F87171' }} onClick={() => setPreviewUrl(null)}><X size={11} /></button>
        </div>
        <iframe src={previewUrl} sandbox="allow-scripts allow-forms allow-popups" title="Aperçu" style={{ flex: 1, border: 'none', width: '100%' }} />
      </div>
    </div>
  )

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {previewOverlay}

      {/* Section 1 — Démo */}
      <div style={sSection}>
        <div style={sTitle}><Rocket size={14} color="var(--ac)" /> Envoyer la démo</div>
        <input style={sInp} placeholder="https://demo.walaup.tn/..." value={demoUrl}
          onChange={e => setDemoUrl(e.target.value)} />
        <div style={sRow}>
          <button style={sBtn()} onClick={sendDemo} disabled={saving || !demoUrl.trim()}>
            <Send size={11} /> {lead.status === 'demo' ? 'Renvoyer la démo' : 'Envoyer au client'}
          </button>
          {demoUrl && (
            <button style={sBtnGhost} onClick={() => setPreviewUrl(demoUrl)}>
              <Eye size={11} /> Aperçu
            </button>
          )}
        </div>
        {lead.status === 'demo' && (
          <div style={{ marginTop: 8, fontSize: 11, color: '#22D3EE', display: 'flex', alignItems: 'center', gap: 5 }}>
            <CheckCircle2 size={11} /> Démo envoyée au client
          </div>
        )}
      </div>

      {/* Section 2 — Paiement */}
      {['demo', 'payment_requested', 'payment_confirmed', 'delivered'].includes(lead.status) && (
        <div style={sSection}>
          <div style={sTitle}><CreditCard size={14} color="#F59E0B" /> Paiement</div>

          {payStatus === 'none' || payStatus === '' ? (
            <>
              <div style={sMethodGrid}>
                {PAYMENT_METHODS.map(pm => {
                  const active = payMethod === pm.id
                  return (
                    <button key={pm.id}
                      style={{ padding: '4px 10px', borderRadius: 7, border: `1px solid ${active ? 'rgba(245,158,11,0.5)' : 'rgba(255,255,255,0.1)'}`, background: active ? 'rgba(245,158,11,0.1)' : 'transparent', color: active ? 'var(--gold)' : 'var(--tx-2)', fontSize: 11, cursor: 'pointer' }}
                      onClick={() => setPayMethod(pm.id)}>
                      {pm.emoji} {pm.label}
                    </button>
                  )
                })}
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input style={{ ...sInp, marginBottom: 0, flex: 1, fontFamily: "'Inter',sans-serif" }}
                  type="number" placeholder="Montant (DT)" value={payAmount}
                  onChange={e => setPayAmount(e.target.value)} />
              </div>
              <button style={sBtn('#F59E0B')} onClick={requestPayment} disabled={saving || !payAmount}>
                Demander le paiement
              </button>
            </>
          ) : payStatus === 'requested' ? (
            <>
              <div style={{ fontSize: 12, color: 'var(--tx-3)', marginBottom: 8 }}>
                ⏳ Paiement demandé — {lead.pay_amount} DT via {PAYMENT_METHODS.find(p => p.id === lead.pay_method)?.label || lead.pay_method}
              </div>
              <button style={sBtn('#10B981')} onClick={confirmPayment} disabled={saving}>
                <CheckCircle2 size={12} /> Confirmer réception paiement
              </button>
            </>
          ) : (
            <div style={{ fontSize: 12, color: '#10B981', display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={13} /> Paiement confirmé — {lead.pay_amount} DT
            </div>
          )}
        </div>
      )}

      {/* Section 3 — Livraison finale */}
      {(payStatus === 'confirmed' || lead.status === 'payment_confirmed') && !isDelivered && (
        <div style={sSection}>
          <div style={sTitle}><Rocket size={14} color="#10B981" /> Livrer la version finale</div>
          <input style={sInp} placeholder="https://app.monbusiness.tn/..." value={finalUrl}
            onChange={e => setFinalUrl(e.target.value)} />
          <button style={sBtn('#10B981')} onClick={deliverApp} disabled={saving || !finalUrl.trim()}>
            <Rocket size={11} /> Livrer l'application
          </button>
        </div>
      )}

      {/* Section 4 — Livré */}
      {isDelivered && (
        <div style={{ ...sSection, borderColor: 'rgba(16,185,129,0.3)' }}>
          <div style={sTitle}><CheckCircle2 size={14} color="#10B981" /> Application livrée ✓</div>
          <div style={{ fontSize: 12, color: 'var(--tx-2)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Link2 size={11} />
            <a href={meta.finalUrl || lead.pay_ref} target="_blank" rel="noreferrer"
              style={{ color: 'var(--ac)', textDecoration: 'none' }}>
              {meta.finalUrl || lead.pay_ref}
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Push notifications helper ──────────────────────────────────────────────
function pushNotif(title, body) {
  if (typeof Notification === 'undefined') return
  if (Notification.permission !== 'granted') return
  try { new Notification(title, { body: body.slice(0, 100), icon: '/favicon.ico', tag: 'walaup-admin-msg', renotify: true }) } catch(e) {}
}

// ─── TabClients principal ─────────────────────────────────────────────────────
export default function TabClients() {
  const [leads, setLeads]       = useState([])
  const [selected, setSelected] = useState(null)
  const [messages, setMessages] = useState([])
  const [search, setSearch]     = useState('')
  const [msg, setMsg]           = useState('')
  const [activePanel, setActivePanel] = useState('chat')
  const [loading, setLoading]   = useState(true)
  const [sending, setSending]   = useState(false)
  const chatRef    = useRef(null)
  const channelRef = useRef(null)

  // ── Fetch leads ────────────────────────────────────────────────────────────
  const fetchLeads = useCallback(async () => {
    const { data } = await supabase.from('leads').select('*').order('created_at', { ascending: false })
    if (data) {
      setLeads(data)
      setSelected(prev => prev ? (data.find(l => l.id === prev.id) || data[0]) : (data[0] || null))
    }
    setLoading(false)
  }, [])

  // ── Fetch messages ─────────────────────────────────────────────────────────
  const fetchMessages = useCallback(async (leadId) => {
    if (!leadId) return
    const { data } = await supabase.from('messages').select('*').eq('lead_id', leadId).order('created_at', { ascending: true })
    if (data) setMessages(data)
    await supabase.from('leads').update({ unread_count: 0 }).eq('id', leadId)
    setTimeout(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight }, 50)
  }, [])

  // ── Init ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchLeads()
    const ch = supabase.channel('admin-leads')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, fetchLeads)
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [fetchLeads])

  // ── Subscription messages du lead sélectionné ─────────────────────────────
  useEffect(() => {
    if (!selected) return
    fetchMessages(selected.id)
    if (channelRef.current) supabase.removeChannel(channelRef.current)
    channelRef.current = supabase.channel(`admin-msgs-${selected.id}-${Date.now()}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        if (payload.new.lead_id !== selected.id) return
        setMessages(prev => {
          if (prev.find(m => m.id === payload.new.id)) return prev
          const withoutTemp = prev.filter(m => !(m._temp && m.sender === 'admin' && m.text === payload.new.text))
          const next = [...withoutTemp, payload.new]
          setTimeout(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight }, 30)
          return next
        })
        if (payload.new.sender === 'client' && document.hidden) {
          pushNotif(`💬 ${selected?.name || 'Client'}`, payload.new.text)
        }
      })
      .subscribe()
    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current) }
  }, [selected?.id, fetchMessages])

  // ── FIX : visibilitychange → refetch messages quand l'onglet redevient actif
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        fetchLeads()
        if (selected?.id) fetchMessages(selected.id)
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [selected?.id, fetchLeads, fetchMessages])

  // Demander permission push
  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  const sendMsg = async () => {
    if (!msg.trim() || !selected || sending) return
    setSending(true)
    const text = msg.trim()
    setMsg('')
    const tempMsg = { id: `temp-${Date.now()}`, lead_id: selected.id, sender: 'admin', text, created_at: new Date().toISOString(), _temp: true }
    setMessages(prev => [...prev, tempMsg])
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
    (l.app || l.type || '').toLowerCase().includes(search.toLowerCase())
  )

  const CSS = `
    .adm-cl { display:flex; height:100%; overflow:hidden; }
    .adm-cl-list { width:272px; flex-shrink:0; border-right:1px solid rgba(255,255,255,0.07); display:flex; flex-direction:column; }
    .adm-cl-search { padding:10px; border-bottom:1px solid rgba(255,255,255,0.06); position:relative; }
    .adm-cl-sinp { width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09); border-radius:10px; padding:8px 10px 8px 32px; color:var(--tx); font-size:12px; outline:none; box-sizing:border-box; }
    .adm-cl-sinp:focus { border-color:rgba(99,102,241,0.4); }
    .adm-cl-sico { position:absolute; left:20px; top:50%; transform:translateY(-50%); pointer-events:none; }
    .adm-cl-items { flex:1; overflow-y:auto; }
    .adm-cl-items::-webkit-scrollbar { width:3px; }
    .adm-cl-items::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.08); border-radius:2px; }
    .adm-cl-item { padding:11px 13px; border-bottom:1px solid rgba(255,255,255,0.04); cursor:pointer; transition:background 150ms; }
    .adm-cl-item:hover { background:rgba(255,255,255,0.03); }
    .adm-cl-item--active { background:rgba(99,102,241,0.08); }
    .adm-cl-row1 { display:flex; justify-content:space-between; align-items:center; margin-bottom:4px; }
    .adm-cl-iname { font-size:13px; font-weight:600; color:var(--tx); }
    .adm-cl-itime { font-size:10px; color:var(--tx-3); }
    .adm-cl-row2 { display:flex; justify-content:space-between; align-items:center; }
    .adm-cl-imsg { font-size:11px; color:var(--tx-3); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:160px; }
    .adm-cl-ibadge { width:16px; height:16px; border-radius:8px; background:var(--red); font-size:9px; color:#fff; font-weight:700; display:flex; align-items:center; justify-content:center; }
    .adm-cl-detail { flex:1; display:flex; flex-direction:column; min-width:0; overflow:hidden; }
    .adm-cl-info { padding:12px 16px; border-bottom:1px solid rgba(255,255,255,0.07); display:flex; align-items:center; gap:10px; flex-shrink:0; flex-wrap:wrap; }
    .adm-cl-avatar { width:36px; height:36px; border-radius:50%; flex-shrink:0; background:linear-gradient(135deg,#6366F1,#8B5CF6); display:flex; align-items:center; justify-content:center; font-weight:800; font-size:14px; color:#fff; font-family:'Space Grotesk',sans-serif; }
    .adm-cl-meta { flex:1; min-width:0; }
    .adm-cl-meta-name { font-weight:700; font-size:14px; color:var(--tx); }
    .adm-cl-meta-app { font-size:11px; color:var(--tx-3); margin-top:2px; }
    .adm-badge { padding:2px 9px; border-radius:20px; font-size:10px; font-weight:700; }
    .adm-status-bar { padding:8px 14px; border-bottom:1px solid rgba(255,255,255,0.06); display:flex; gap:5px; flex-wrap:wrap; align-items:center; flex-shrink:0; }
    .adm-status-btn { padding:4px 9px; border-radius:7px; font-size:10px; font-weight:600; cursor:pointer; border:1px solid rgba(255,255,255,0.1); background:transparent; color:var(--tx-2); transition:all 150ms; }
    .adm-status-btn:hover { background:rgba(99,102,241,0.1); color:var(--tx); }
    .adm-status-btn--active { background:rgba(99,102,241,0.15); border-color:rgba(99,102,241,0.4); color:var(--ac); }
    .adm-panel-tabs { display:flex; border-bottom:1px solid rgba(255,255,255,0.06); flex-shrink:0; }
    .adm-ptab { flex:1; padding:9px; text-align:center; font-size:12px; font-weight:600; color:var(--tx-3); cursor:pointer; transition:all 150ms; border-bottom:2px solid transparent; }
    .adm-ptab--active { color:var(--ac); border-bottom-color:var(--ac); }
    .adm-chat { flex:1; overflow-y:auto; padding:14px 16px; display:flex; flex-direction:column; gap:7px; }
    .adm-chat::-webkit-scrollbar { width:3px; }
    .adm-chat::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.08); border-radius:2px; }
    .adm-bubble { max-width:72%; padding:8px 12px; border-radius:14px; font-size:13px; line-height:1.5; word-break:break-word; }
    .adm-bubble--admin { align-self:flex-end; background:linear-gradient(135deg,#6366F1,#8B5CF6); color:#fff; border-bottom-right-radius:4px; }
    .adm-bubble--client { align-self:flex-start; background:rgba(255,255,255,0.07); border:1px solid rgba(255,255,255,0.1); color:var(--tx); border-bottom-left-radius:4px; }
    .adm-bubble-ts { font-size:10px; opacity:.6; margin-top:3px; text-align:right; }
    .adm-chat-inp { padding:10px 12px; border-top:1px solid rgba(255,255,255,0.07); display:flex; gap:8px; align-items:flex-end; flex-shrink:0; }
    .adm-chat-field { flex:1; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09); border-radius:10px; padding:8px 12px; color:var(--tx); font-size:13px; outline:none; resize:none; font-family:'Inter',sans-serif; max-height:100px; }
    .adm-chat-field:focus { border-color:rgba(99,102,241,0.4); }
    .adm-chat-send { width:34px; height:34px; border-radius:9px; background:linear-gradient(135deg,#6366F1,#8B5CF6); border:none; display:flex; align-items:center; justify-content:center; cursor:pointer; color:#fff; transition:transform 150ms; flex-shrink:0; }
    .adm-chat-send:hover { transform:scale(1.08); }
    .adm-chat-send:disabled { opacity:.5; cursor:not-allowed; transform:none; }
    @media(max-width:768px) { .adm-cl-list { width:200px; } }
    @media(max-width:580px) { .adm-cl { flex-direction:column; } .adm-cl-list { width:100%; height:200px; border-right:none; border-bottom:1px solid rgba(255,255,255,0.07); } }
  `

  return (
    <>
      <style>{CSS}</style>
      <div className="adm-cl">

        {/* ── Liste leads ── */}
        <div className="adm-cl-list">
          <div className="adm-cl-search">
            <Search size={12} color="var(--tx-3)" className="adm-cl-sico" />
            <input className="adm-cl-sinp" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="adm-cl-items">
            {loading ? (
              <div style={sLoadingList}>Chargement…</div>
            ) : filtered.length === 0 ? (
              <div style={sLoadingList}>Aucun client.</div>
            ) : filtered.map(lead => {
              const sc = STATUS_CONFIG[lead.status] || STATUS_CONFIG.new
              return (
                <div key={lead.id}
                  className={`adm-cl-item${selected?.id === lead.id ? ' adm-cl-item--active' : ''}`}
                  onClick={() => { setSelected(lead); setActivePanel('chat') }}
                >
                  <div className="adm-cl-row1">
                    <span className="adm-cl-iname">{lead.name}</span>
                    <span className="adm-cl-itime">
                      {lead.last_message_at ? new Date(lead.last_message_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                  <div className="adm-cl-row2">
                    <span className="adm-cl-imsg">{lead.last_message || lead.type || '—'}</span>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      <span className="adm-badge" style={{ background: sc.bg, color: sc.color }}>{sc.label}</span>
                      {(lead.unread_count > 0) && <div className="adm-cl-ibadge">{lead.unread_count}</div>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Détail lead ── */}
        {!selected ? (
          <div style={sEmptyState}>
            <MessageSquare size={32} color="var(--border)" />
            <span>Sélectionnez un client</span>
          </div>
        ) : (
          <div className="adm-cl-detail">
            {/* Header */}
            <div className="adm-cl-info">
              <div className="adm-cl-avatar">{(selected.name || 'AA').slice(0, 2).toUpperCase()}</div>
              <div className="adm-cl-meta">
                <div className="adm-cl-meta-name">{selected.name}</div>
                <div className="adm-cl-meta-app">{selected.type} · {selected.phone}</div>
              </div>
              {selected.pack && <span className="adm-badge" style={sPackBadge}>{selected.pack}</span>}
              {(() => {
                const sc = STATUS_CONFIG[selected.status] || STATUS_CONFIG.new
                return <span className="adm-badge" style={{ background: sc.bg, color: sc.color }}>{sc.label}</span>
              })()}
            </div>

            {/* Barre de statuts */}
            <div className="adm-status-bar">
              <span style={sStatusLabel}>Statut :</span>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                <button key={k}
                  className={`adm-status-btn${selected.status === k ? ' adm-status-btn--active' : ''}`}
                  onClick={() => changeStatus(k)}>{v.label}</button>
              ))}
            </div>

            {/* Onglets */}
            <div className="adm-panel-tabs">
              <div className={`adm-ptab${activePanel === 'chat' ? ' adm-ptab--active' : ''}`} onClick={() => setActivePanel('chat')}>💬 Chat</div>
              <div className={`adm-ptab${activePanel === 'demos' ? ' adm-ptab--active' : ''}`} onClick={() => setActivePanel('demos')}>🚀 Démo & Livraison</div>
            </div>

            {/* Panneau Chat */}
            {activePanel === 'chat' && (
              <>
                <div className="adm-chat" ref={chatRef}>
                  {messages.length === 0 && <div style={sNoMessages}>Aucun message. Commencez la conversation.</div>}
                  {messages.map(m => (
                    <div key={m.id} className={`adm-bubble adm-bubble--${m.sender}`}>
                      {m.text}
                      <div className="adm-bubble-ts">
                        {new Date(m.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        {m.sender === 'admin' && <CheckCheck size={10} style={sCheckMark} />}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="adm-chat-inp">
                  <textarea className="adm-chat-field" placeholder="Écrire un message..." value={msg} rows={1}
                    onChange={e => setMsg(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg() } }}
                  />
                  <button className="adm-chat-send" onClick={sendMsg} disabled={sending || !msg.trim()}>
                    <Send size={14} />
                  </button>
                </div>
              </>
            )}

            {/* Panneau Démo & Livraison */}
            {activePanel === 'demos' && (
              <DemoPanel key={selected.id} lead={selected} onRefresh={fetchLeads} />
            )}
          </div>
        )}
      </div>
    </>
  )
}
