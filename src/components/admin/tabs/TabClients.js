'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Search, Send, CheckCheck, X, CheckCircle2,
  Monitor, Smartphone, ExternalLink, Lock,
  AlertTriangle, CreditCard, Rocket, Eye,
  RefreshCw, Plus, MessageSquare
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

const STATUS_CONFIG = {
  new:                { label: 'Nouveau',           color: '#22D3EE', bg: 'rgba(34,211,238,0.1)' },
  demo:               { label: 'Démo prête',        color: '#6366F1', bg: 'rgba(99,102,241,0.1)' },
  dev:                { label: 'En développement',  color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  payment_requested:  { label: 'Paiement demandé',  color: '#FB923C', bg: 'rgba(251,146,60,0.1)' },
  payment_confirmed:  { label: 'Paiement confirmé', color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
  delivered:          { label: 'Livré',             color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
  cancelled:          { label: 'Annulé',            color: '#F87171', bg: 'rgba(248,113,113,0.1)' },
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
  locked:   { label: '🔒 Verrouillée',      color: '#525878', bg: 'rgba(82,88,120,0.1)' },
  ready:    { label: '✏️ Prête à envoyer', color: '#22D3EE', bg: 'rgba(34,211,238,0.08)' },
  sent:     { label: '📨 Envoyée',         color: '#6366F1', bg: 'rgba(99,102,241,0.1)' },
  confirmed:{ label: '✅ Confirmée',       color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  rejected: { label: '↩️ Modif. demandée',color: '#FB923C', bg: 'rgba(251,146,60,0.1)' },
  disabled: { label: '🚫 Désactivée',     color: '#374151', bg: 'rgba(55,65,81,0.1)' },
}

// ─────────────────────────────────────────────────────────────────
// DemoPanel — Gestion des démos (Supabase)
// ─────────────────────────────────────────────────────────────────
function DemoPanel({ lead, onRefresh }) {
  const [demos, setDemos]           = useState([])
  const [previewUrl, setPreviewUrl] = useState(null)
  const [previewMode, setPreviewMode] = useState('browser')
  const [payMethod, setPayMethod]   = useState('flouci')
  const [demoUrls, setDemoUrls]     = useState({})
  const [saving, setSaving]         = useState(false)

  const fetchDemos = useCallback(async () => {
    const { data } = await supabase.from('demos').select('*').eq('lead_id', lead.id).order('slot')
    if (data) {
      setDemos(data)
      const urls = {}
      data.forEach(d => { urls[d.slot] = d.url || '' })
      setDemoUrls(urls)
    }
  }, [lead.id])

  useEffect(() => {
    fetchDemos()
  }, [fetchDemos])

  const sentCount     = demos.filter(d => ['sent','confirmed','rejected'].includes(d.status)).length
  const confirmedDemo = demos.find(d => d.status === 'confirmed')
  const allUsed       = sentCount >= 3
  const isDelivered   = lead.final_sent

  const sendDemo = async (slot) => {
    const url = demoUrls[slot]?.trim()
    if (!url) return alert('Entre l\'URL de la démo avant d\'envoyer.')
    setSaving(true)
    await supabase.from('demos').update({
      url, status: 'sent',
      sent_at: new Date().toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit' })
    }).eq('lead_id', lead.id).eq('slot', slot)
    // Unlock next slot
    await supabase.from('demos').update({ status: 'ready' }).eq('lead_id', lead.id).eq('slot', slot + 1).eq('status', 'locked')
    // Update lead status
    await supabase.from('leads').update({ status: 'demo' }).eq('id', lead.id)
    await fetchDemos()
    onRefresh()
    setSaving(false)
  }

  const confirmDemo = async (slot) => {
    setSaving(true)
    await supabase.from('demos').update({ status: 'confirmed' }).eq('lead_id', lead.id).eq('slot', slot)
    await supabase.from('demos').update({ status: 'disabled' }).eq('lead_id', lead.id).neq('slot', slot).not('status', 'eq', 'rejected')
    await supabase.from('leads').update({ status: 'payment_requested', pay_status: 'requested' }).eq('id', lead.id)
    await fetchDemos()
    onRefresh()
    setSaving(false)
  }

  const rejectDemo = async (slot) => {
    setSaving(true)
    await supabase.from('demos').update({ status: 'rejected' }).eq('lead_id', lead.id).eq('slot', slot)
    await supabase.from('demos').update({ status: 'ready' }).eq('lead_id', lead.id).eq('slot', slot + 1).eq('status', 'locked')
    await fetchDemos()
    setSaving(false)
  }

  const requestPayment = async () => {
    setSaving(true)
    await supabase.from('leads').update({ pay_status: 'requested', status: 'payment_requested' }).eq('id', lead.id)
    // Ajouter un message automatique
    await supabase.from('messages').insert([{ lead_id: lead.id, sender: 'admin', text: `Votre démo est validée ! Paiement requis via ${PAYMENT_METHODS.find(p => p.id === payMethod)?.label} pour continuer.` }])
    onRefresh()
    setSaving(false)
  }

  const confirmPayment = async () => {
    setSaving(true)
    await supabase.from('leads').update({ pay_status: 'confirmed', status: 'payment_confirmed' }).eq('id', lead.id)
    // Enregistrer le paiement
    await supabase.from('payments').insert([{
      lead_id: lead.id, client_name: lead.name,
      description: `Paiement confirmé — ${lead.app || lead.app_name} — Pack ${lead.pack}`,
      method: payMethod, status: 'completed', type: 'annual',
      amount: 0, // à mettre à jour manuellement si besoin
    }])
    onRefresh()
    setSaving(false)
  }

  const sendFinal = async (finalUrl) => {
    if (!finalUrl?.trim()) return alert('Entre l\'URL de la version finale.')
    setSaving(true)
    await supabase.from('demos').update({ status: 'disabled' }).eq('lead_id', lead.id)
    await supabase.from('leads').update({ final_sent: true, final_url: finalUrl, status: 'delivered' }).eq('id', lead.id)
    await supabase.from('messages').insert([{ lead_id: lead.id, sender: 'admin', text: `🎉 Félicitations ! Votre application est prête. Accédez-y ici : ${finalUrl}` }])
    await fetchDemos()
    onRefresh()
    setSaving(false)
  }

  const [finalUrl, setFinalUrl] = useState(lead.final_url || '')

  return (
    <div className="dp-root">
      {/* Header */}
      <div className="dp-header">
        <div className="dp-title">
          <Rocket size={14} color="var(--ac)" />
          Système de démos
        </div>
        <div className="dp-counter">
          <span style=color: sentCount >= 3 ? '#F87171' : 'var(--ac)', fontWeight: 700>{sentCount}</span>
          <span style=color: 'var(--tx-3)'>/3 modifications</span>
        </div>
      </div>

      {/* Démo slots */}
      {demos.map(d => {
        const sui = DEMO_STATUS_UI[d.status] || DEMO_STATUS_UI.locked
        const canSend = d.status === 'ready' && !confirmedDemo
        return (
          <div key={d.id} className={`dp-slot${d.status === 'disabled' ? ' dp-slot--disabled' : ''}`}>
            <div className="dp-slot-head">
              <span className="dp-slot-num">Démo {d.slot}</span>
              <span className="dp-slot-badge" style=background: sui.bg, color: sui.color>{sui.label}</span>
              {d.sent_at && <span className="dp-slot-date">{d.sent_at}</span>}
            </div>

            {['ready','sent','confirmed','rejected'].includes(d.status) && (
              <div className="dp-url-row">
                <input
                  className="dp-url-inp"
                  placeholder="https://demo.walaup.tn/..."
                  value={demoUrls[d.slot] || ''}
                  onChange={e => setDemoUrls(p => ({ ...p, [d.slot]: e.target.value }))}
                  readOnly={['confirmed','disabled'].includes(d.status)}
                />
                {d.url && (
                  <button className="dp-preview-btn" onClick={() => setPreviewUrl(d.url)}>
                    <Eye size={12} />
                  </button>
                )}
              </div>
            )}

            {canSend && (
              <button className="dp-send-btn" onClick={() => sendDemo(d.slot)} disabled={saving}>
                <Send size={11} /> Envoyer au client
              </button>
            )}

            {d.status === 'sent' && !confirmedDemo && (
              <div className="dp-client-actions">
                <span className="dp-client-label">Réponse client :</span>
                <button className="dp-confirm-sim" onClick={() => confirmDemo(d.slot)} disabled={saving}>
                  <CheckCircle2 size={11} /> Client confirme
                </button>
                {d.slot < 3 && (
                  <button className="dp-reject-sim" onClick={() => rejectDemo(d.slot)} disabled={saving}>
                    <X size={11} /> Demande modif
                  </button>
                )}
              </div>
            )}
          </div>
        )
      })}

      {allUsed && !confirmedDemo && (
        <div className="dp-limit-warn">
          <AlertTriangle size={13} /> 3 modifications atteintes — le client doit acheter ou quitter.
        </div>
      )}

      {/* PAIEMENT */}
      {confirmedDemo && lead.pay_status !== 'confirmed' && !isDelivered && (
        <div className="dp-pay-section">
          <div className="dp-pay-title"><CreditCard size={13} /> Paiement</div>
          <div className="dp-pay-sub">Démo {confirmedDemo.slot} confirmée — demandez le paiement.</div>

          {lead.pay_status === 'none' || !lead.pay_status ? (
            <>
              <div className="dp-pay-methods">
                {PAYMENT_METHODS.map(pm => (
                  <button key={pm.id} className={`dp-pay-method${payMethod === pm.id ? ' dp-pay-method--active' : ''}`}
                    onClick={() => setPayMethod(pm.id)}>
                    {pm.emoji} {pm.label}
                  </button>
                ))}
              </div>
              <button className="dp-pay-req-btn" onClick={requestPayment} disabled={saving}>
                Demander le paiement via {PAYMENT_METHODS.find(p => p.id === payMethod)?.label}
              </button>
            </>
          ) : lead.pay_status === 'requested' ? (
            <>
              <div style=fontSize: 12, color: 'var(--tx-3)', marginBottom: 10>⏳ En attente du paiement client…</div>
              <button className="dp-pay-req-btn" style=background: 'linear-gradient(135deg,#10B981,#059669)' onClick={confirmPayment} disabled={saving}>
                <CheckCircle2 size={12} /> Confirmer réception paiement
              </button>
            </>
          ) : null}
        </div>
      )}

      {/* VERSION FINALE */}
      {lead.pay_status === 'confirmed' && !isDelivered && (
        <div className="dp-final-section">
          <div className="dp-pay-title"><Rocket size={13} /> Version finale</div>
          <div className="dp-pay-sub">Paiement confirmé ✓ — Envoie la version finale.</div>
          <input className="dp-url-inp" style=marginBottom: 8
            placeholder="https://app.walaup.tn/..."
            value={finalUrl}
            onChange={e => setFinalUrl(e.target.value)}
          />
          <button className="dp-send-btn" style=background: 'linear-gradient(135deg,#10B981,#059669)'
            onClick={() => sendFinal(finalUrl)} disabled={saving}>
            <Rocket size={11} /> Envoyer la version finale
          </button>
        </div>
      )}

      {/* LIVRÉ */}
      {isDelivered && (
        <div style=padding: '14px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 10, display: 'flex', gap: 10, alignItems: 'center'>
          <CheckCircle2 size={18} color="#10B981" />
          <div>
            <div style=fontSize: 12, fontWeight: 700, color: '#10B981'>App livrée ✓</div>
            <div style=fontSize: 11, color: 'var(--tx-3)'>{lead.final_url}</div>
          </div>
        </div>
      )}

      {/* Preview iframe */}
      {previewUrl && (
        <div style=position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20
          onClick={() => setPreviewUrl(null)}>
          <div style=background: '#0D1120', borderRadius: 16, overflow: 'hidden', width: previewMode === 'phone' ? 390 : '90%', maxWidth: 1000, height: '85vh', display: 'flex', flexDirection: 'column'
            onClick={e => e.stopPropagation()}>
            <div style=padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: 8, alignItems: 'center'>
              <span style=flex: 1, fontSize: 12, color: 'var(--tx-2)'>Aperçu démo</span>
              <button style=padding: '4px 10px', borderRadius: 7, border: '1px solid rgba(255,255,255,0.1)', background: previewMode === 'browser' ? 'rgba(99,102,241,0.15)' : 'transparent', color: 'var(--tx-2)', fontSize: 11, cursor: 'pointer' onClick={() => setPreviewMode('browser')}><Monitor size={11} /></button>
              <button style=padding: '4px 10px', borderRadius: 7, border: '1px solid rgba(255,255,255,0.1)', background: previewMode === 'phone' ? 'rgba(99,102,241,0.15)' : 'transparent', color: 'var(--tx-2)', fontSize: 11, cursor: 'pointer' onClick={() => setPreviewMode('phone')}><Smartphone size={11} /></button>
              <button style=padding: '4px 8px', borderRadius: 7, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(248,113,113,0.1)', color: '#F87171', fontSize: 11, cursor: 'pointer' onClick={() => setPreviewUrl(null)}><X size={11} /></button>
            </div>
            <iframe src={previewUrl} style=flex: 1, border: 'none', width: '100%' title="Aperçu" />
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// MAIN TabClients
// ─────────────────────────────────────────────────────────────────
export default function TabClients() {
  const [leads, setLeads]       = useState([])
  const [selected, setSelected] = useState(null)
  const [messages, setMessages] = useState([])
  const [search, setSearch]     = useState('')
  const [msg, setMsg]           = useState('')
  const [activePanel, setActivePanel] = useState('chat')
  const [loading, setLoading]   = useState(true)
  const [sending, setSending]   = useState(false)
  const chatRef = useRef(null)
  const channelRef = useRef(null)

  // Fetch leads
  const fetchLeads = useCallback(async () => {
    const { data } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) {
      setLeads(data)
      // Select first if none selected
      setSelected(prev => prev ? (data.find(l => l.id === prev.id) || data[0]) : data[0])
    }
    setLoading(false)
  }, [])

  // Fetch messages for selected lead
  const fetchMessages = useCallback(async (leadId) => {
    if (!leadId) return
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: true })
    if (data) setMessages(data)
    // Mark as read
    await supabase.from('leads').update({ unread_count: 0 }).eq('id', leadId)
    setTimeout(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight }, 50)
  }, [])

  useEffect(() => {
    fetchLeads()
    // Realtime on leads
    const ch = supabase.channel('admin-leads')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, fetchLeads)
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [fetchLeads])

  useEffect(() => {
    if (!selected) return
    fetchMessages(selected.id)
    // Subscribe to new messages for this lead
    if (channelRef.current) supabase.removeChannel(channelRef.current)
    channelRef.current = supabase.channel(`msgs-${selected.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `lead_id=eq.${selected.id}`
      }, payload => {
        setMessages(prev => {
          if (prev.find(m => m.id === payload.new.id)) return prev
          const next = [...prev, payload.new]
          setTimeout(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight }, 50)
          return next
        })
      })
      .subscribe()
    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current) }
  }, [selected?.id, fetchMessages])

  const sendMsg = async () => {
    if (!msg.trim() || !selected || sending) return
    setSending(true)
    await supabase.from('messages').insert([{
      lead_id: selected.id, sender: 'admin', text: msg.trim()
    }])
    await supabase.from('leads').update({ last_message: msg.trim(), last_message_at: new Date().toISOString() }).eq('id', selected.id)
    setMsg('')
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
    (l.app || l.app_name || '').toLowerCase().includes(search.toLowerCase())
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
    .adm-cl-new-lead { padding:8px 10px; margin:8px; border-radius:10px; border:1px dashed rgba(99,102,241,0.3); background:rgba(99,102,241,0.06); display:flex; align-items:center; gap:6px; font-size:11px; color:var(--ac); cursor:pointer; }
    .adm-cl-new-lead:hover { background:rgba(99,102,241,0.12); }
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
    .adm-ptab:hover { color:var(--tx-2); background:rgba(255,255,255,0.02); }
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
    .adm-empty-state { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; color:var(--tx-3); font-size:13px; }
    /* Demo panel */
    .dp-root { flex:1; overflow-y:auto; padding:14px 16px; display:flex; flex-direction:column; gap:10px; }
    .dp-root::-webkit-scrollbar { width:3px; }
    .dp-root::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:2px; }
    .dp-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:4px; }
    .dp-title { display:flex; align-items:center; gap:7px; font-size:13px; font-weight:700; color:var(--tx); }
    .dp-counter { font-size:12px; }
    .dp-slot { background:rgba(13,17,32,0.6); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:12px; display:flex; flex-direction:column; gap:8px; }
    .dp-slot--disabled { opacity:.4; pointer-events:none; }
    .dp-slot-head { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
    .dp-slot-num { font-size:12px; font-weight:700; color:var(--tx); }
    .dp-slot-badge { padding:2px 8px; border-radius:20px; font-size:10px; font-weight:600; }
    .dp-slot-date { font-size:10px; color:var(--tx-3); margin-left:auto; }
    .dp-url-row { display:flex; gap:6px; }
    .dp-url-inp { flex:1; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.09); border-radius:8px; padding:7px 10px; color:var(--tx); font-size:11px; outline:none; font-family:'JetBrains Mono',monospace; }
    .dp-url-inp:focus { border-color:rgba(99,102,241,0.4); }
    .dp-preview-btn { width:28px; height:28px; flex-shrink:0; border-radius:7px; border:1px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.04); color:var(--tx-2); cursor:pointer; display:flex; align-items:center; justify-content:center; }
    .dp-send-btn { align-self:flex-start; display:flex; align-items:center; gap:6px; padding:6px 14px; border-radius:8px; border:none; background:linear-gradient(135deg,#6366F1,#8B5CF6); color:#fff; font-size:11px; font-weight:700; cursor:pointer; transition:transform 150ms; font-family:'Space Grotesk',sans-serif; }
    .dp-send-btn:hover { transform:scale(1.04); }
    .dp-send-btn:disabled { opacity:.6; transform:none; cursor:not-allowed; }
    .dp-client-actions { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
    .dp-client-label { font-size:10px; color:var(--tx-3); }
    .dp-confirm-sim { display:flex; align-items:center; gap:4px; padding:4px 10px; border-radius:7px; border:1px solid rgba(16,185,129,0.4); background:rgba(16,185,129,0.1); color:#10B981; font-size:10px; font-weight:600; cursor:pointer; }
    .dp-reject-sim { display:flex; align-items:center; gap:4px; padding:4px 10px; border-radius:7px; border:1px solid rgba(251,146,60,0.4); background:rgba(251,146,60,0.1); color:#FB923C; font-size:10px; font-weight:600; cursor:pointer; }
    .dp-limit-warn { display:flex; align-items:center; gap:7px; padding:10px 12px; border-radius:9px; background:rgba(248,113,113,0.08); border:1px solid rgba(248,113,113,0.2); font-size:11px; color:#F87171; }
    .dp-pay-section,.dp-final-section { background:rgba(245,158,11,0.06); border:1px solid rgba(245,158,11,0.2); border-radius:12px; padding:14px; display:flex; flex-direction:column; gap:8px; }
    .dp-pay-title { display:flex; align-items:center; gap:6px; font-size:12px; font-weight:700; color:var(--gold); }
    .dp-pay-sub { font-size:11px; color:var(--tx-3); }
    .dp-pay-methods { display:flex; gap:6px; flex-wrap:wrap; margin-bottom:4px; }
    .dp-pay-method { padding:4px 10px; border-radius:7px; border:1px solid rgba(255,255,255,0.1); background:transparent; color:var(--tx-2); font-size:11px; cursor:pointer; }
    .dp-pay-method--active { border-color:rgba(245,158,11,0.5); background:rgba(245,158,11,0.1); color:var(--gold); }
    .dp-pay-req-btn { padding:8px 14px; border-radius:9px; border:none; background:linear-gradient(135deg,#F59E0B,#D97706); color:#000; font-size:12px; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:6px; }
    .dp-pay-req-btn:disabled { opacity:.6; cursor:not-allowed; }
    @media(max-width:768px) { .adm-cl-list { width:200px; } .adm-cl-imsg { max-width:100px; } }
    @media(max-width:580px) { .adm-cl { flex-direction:column; } .adm-cl-list { width:100%; height:200px; border-right:none; border-bottom:1px solid rgba(255,255,255,0.07); } }
  `

  return (
    <>
      <style>{CSS}</style>
      <div className="adm-cl">
        {/* ─── Liste leads ─── */}
        <div className="adm-cl-list">
          <div className="adm-cl-search">
            <Search size={12} color="var(--tx-3)" className="adm-cl-sico" />
            <input className="adm-cl-sinp" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="adm-cl-items">
            {loading ? (
              <div style=padding: 16, fontSize: 12, color: 'var(--tx-3)'>Chargement…</div>
            ) : filtered.length === 0 ? (
              <div style=padding: 16, fontSize: 12, color: 'var(--tx-3)'>Aucun client.</div>
            ) : filtered.map(lead => {
              const sc = STATUS_CONFIG[lead.status] || STATUS_CONFIG.new
              const initials = (lead.name || 'AA').slice(0, 2).toUpperCase()
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
                    <span className="adm-cl-imsg">{lead.last_message || lead.app || lead.app_name || '—'}</span>
                    <div style=display: 'flex', gap: 4, alignItems: 'center'>
                      <span className="adm-badge" style=background: sc.bg, color: sc.color>{sc.label}</span>
                      {(lead.unread_count > 0) && <div className="adm-cl-ibadge">{lead.unread_count}</div>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ─── Détail ─── */}
        {!selected ? (
          <div className="adm-empty-state">
            <MessageSquare size={32} color="var(--border)" />
            <span>Sélectionnez un client</span>
          </div>
        ) : (
          <div className="adm-cl-detail">
            {/* Info bar */}
            <div className="adm-cl-info">
              <div className="adm-cl-avatar">{(selected.name || 'AA').slice(0, 2).toUpperCase()}</div>
              <div className="adm-cl-meta">
                <div className="adm-cl-meta-name">{selected.name}</div>
                <div className="adm-cl-meta-app">{selected.app || selected.app_name} · {selected.phone}</div>
              </div>
              {selected.pack && (
                <span className="adm-badge" style=background: 'rgba(99,102,241,0.12)', color: 'var(--ac)'>{selected.pack}</span>
              )}
              {(() => { const sc = STATUS_CONFIG[selected.status] || STATUS_CONFIG.new; return (
                <span className="adm-badge" style=background: sc.bg, color: sc.color>{sc.label}</span>
              )})()}
            </div>

            {/* Status bar */}
            <div className="adm-status-bar">
              <span style=fontSize: 10, color: 'var(--tx-3)', marginRight: 4>Statut :</span>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                <button key={k}
                  className={`adm-status-btn${selected.status === k ? ' adm-status-btn--active' : ''}`}
                  onClick={() => changeStatus(k)}
                >{v.label}</button>
              ))}
            </div>

            {/* Panel tabs */}
            <div className="adm-panel-tabs">
              <div className={`adm-ptab${activePanel === 'chat' ? ' adm-ptab--active' : ''}`} onClick={() => setActivePanel('chat')}>💬 Chat</div>
              <div className={`adm-ptab${activePanel === 'demos' ? ' adm-ptab--active' : ''}`} onClick={() => setActivePanel('demos')}>🚀 Démos & Livraison</div>
            </div>

            {/* Chat */}
            {activePanel === 'chat' && (
              <>
                <div className="adm-chat" ref={chatRef}>
                  {messages.length === 0 && (
                    <div style=textAlign: 'center', color: 'var(--tx-3)', fontSize: 12, padding: 20>Aucun message. Commencez la conversation.</div>
                  )}
                  {messages.map(m => (
                    <div key={m.id} className={`adm-bubble adm-bubble--${m.sender}`}>
                      {m.text}
                      <div className="adm-bubble-ts">
                        {new Date(m.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        {m.sender === 'admin' && <CheckCheck size={10} style=marginLeft: 4 />}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="adm-chat-inp">
                  <textarea
                    className="adm-chat-field"
                    placeholder="Écrire un message..."
                    value={msg}
                    rows={1}
                    onChange={e => setMsg(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg() } }}
                  />
                  <button className="adm-chat-send" onClick={sendMsg} disabled={sending || !msg.trim()}>
                    <Send size={14} />
                  </button>
                </div>
              </>
            )}

            {/* Demos */}
            {activePanel === 'demos' && (
              <DemoPanel lead={selected} onRefresh={fetchLeads} />
            )}
          </div>
        )}
      </div>
    </>
  )
}
