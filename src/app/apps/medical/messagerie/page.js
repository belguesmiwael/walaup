'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Send, Search, MessageSquare, ChevronRight, RefreshCw, User } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import ProfileModal from '@/components/features/apps/medical/ProfileModal'

const ROLE_LABELS = { tenant_admin:'Médecin', tenant_user:'Secrétaire', app_end_user:'Patient' }
const ROLE_COLORS = {
  tenant_admin:  'linear-gradient(135deg,#0EA5E9,#38BDF8)',
  tenant_user:   'linear-gradient(135deg,#F59E0B,#FCD34D)',
  app_end_user:  'linear-gradient(135deg,#10B981,#34D399)',
}
const ROLE_CLASS = { tenant_admin:'doctor', tenant_user:'secretary', app_end_user:'patient' }
const BACK_ROUTES = { tenant_admin:'/apps/medical/doctor', tenant_user:'/apps/medical/secretary', app_end_user:'/apps/medical/patient' }

function initials(name) {
  return (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}
function formatTime(iso) {
  if (!iso) return ''
  const d = new Date(iso), now = new Date(), diff = now - d
  if (diff < 60000) return 'À l\'instant'
  if (diff < 3600000) return Math.floor(diff/60000) + 'min'
  if (diff < 86400000) return d.toLocaleTimeString('fr-TN', {hour:'2-digit',minute:'2-digit'})
  return d.toLocaleDateString('fr-TN', {day:'2-digit',month:'short'}) + ' ' + d.toLocaleTimeString('fr-TN', {hour:'2-digit',minute:'2-digit'})
}

const CSS = `
  .msg-root{position:fixed;inset:0;background:var(--bg-base);display:flex;flex-direction:column;overflow:hidden}
  .msg-bar{height:56px;display:flex;align-items:center;padding:0 20px;gap:12px;flex-shrink:0;background:rgba(8,11,20,.96);border-bottom:1px solid var(--border);backdrop-filter:blur(20px);z-index:100}
  .msg-back{display:flex;align-items:center;gap:6px;color:var(--tx-2);font-size:.85rem;font-weight:600;cursor:pointer;background:none;border:none;transition:color .15s;padding:0}
  .msg-back:hover{color:#0EA5E9}
  .msg-h1{font-family:var(--font-display);font-weight:700;font-size:.95rem;color:var(--tx);flex:1}
  .msg-av{width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.72rem;font-weight:800;color:white;cursor:pointer;flex-shrink:0}
  .msg-body{flex:1;display:flex;overflow:hidden}
  .msg-side{width:280px;flex-shrink:0;border-right:1px solid var(--border);display:flex;flex-direction:column;overflow:hidden}
  .msg-side-head{padding:12px 14px;border-bottom:1px solid var(--border);flex-shrink:0}
  .msg-sr{display:flex;align-items:center;gap:8px;background:var(--bg-surface);border:1px solid var(--border);border-radius:10px;padding:0 12px;height:36px}
  .msg-sr input{flex:1;background:none;border:none;outline:none;color:var(--tx);font-size:.82rem}
  .msg-sr input::placeholder{color:var(--tx-3)}
  .msg-list{flex:1;overflow-y:auto}
  .msg-ci{display:flex;align-items:center;gap:10px;padding:12px 14px;cursor:pointer;transition:background .15s;border-bottom:1px solid rgba(255,255,255,.03)}
  .msg-ci:hover{background:var(--bg-hover)}
  .msg-ci.active{background:rgba(14,165,233,.08);border-left:3px solid #0EA5E9}
  .msg-ca{width:38px;height:38px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:.8rem;font-weight:800;color:white}
  .msg-cn{font-weight:700;font-size:.85rem;color:var(--tx)}
  .msg-cr{font-size:.7rem;color:var(--tx-3);margin-top:1px}
  .msg-ub{min-width:18px;height:18px;padding:0 5px;border-radius:9px;background:#0EA5E9;color:white;font-size:.65rem;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0}
  .msg-thread{flex:1;display:flex;flex-direction:column;overflow:hidden}
  .msg-th{padding:14px 18px;border-bottom:1px solid var(--border);flex-shrink:0;display:flex;align-items:center;gap:10px;background:var(--bg-surface)}
  .msg-thn{font-weight:700;font-size:.92rem;color:var(--tx);flex:1}
  .msg-thr{font-size:.72rem;color:var(--tx-3);margin-top:2px}
  .msg-msgs{flex:1;overflow-y:auto;padding:16px 18px;display:flex;flex-direction:column;gap:8px;scrollbar-width:thin;scrollbar-color:var(--border) transparent}
  .msg-sep{text-align:center;margin:6px 0}
  .msg-sep span{font-size:.67rem;color:var(--tx-3);background:var(--bg-base);padding:2px 10px;border-radius:10px}
  .msg-brow{display:flex}
  .msg-brow.mine{justify-content:flex-end}
  .msg-b{max-width:68%;padding:10px 14px;border-radius:16px;font-size:.875rem;line-height:1.45;word-break:break-word}
  .msg-b.mine{background:#0EA5E9;color:white;border-bottom-right-radius:4px}
  .msg-b.theirs{background:var(--bg-surface);color:var(--tx);border:1px solid var(--border);border-bottom-left-radius:4px}
  .msg-bt{font-size:.62rem;margin-top:4px;opacity:.65}
  .msg-b.mine .msg-bt{text-align:right}
  .msg-none{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;color:var(--tx-3);gap:10px}
  .msg-comp{padding:12px 16px;border-top:1px solid var(--border);flex-shrink:0;display:flex;gap:10px;align-items:flex-end;background:var(--bg-surface)}
  .msg-comp textarea{flex:1;padding:10px 14px;border-radius:12px;border:1px solid var(--border);background:var(--bg-base);color:var(--tx);font-size:.875rem;outline:none;resize:none;font-family:var(--font-body);max-height:100px;transition:border-color .15s}
  .msg-comp textarea:focus{border-color:#0EA5E9}
  .msg-comp textarea::placeholder{color:var(--tx-3)}
  .msg-send{width:40px;height:40px;border-radius:12px;flex-shrink:0;background:#0EA5E9;border:none;color:white;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .18s}
  .msg-send:hover{background:#0284C7;transform:scale(1.05)}
  .msg-send:disabled{opacity:.4;cursor:not-allowed;transform:none}
  @media(max-width:767px){.msg-side{width:100%}.msg-side.hidden{display:none}.msg-thread.hidden{display:none}}
`

export default function Messagerie() {
  const router = useRouter()
  const [user,         setUser]         = useState(null)
  const [contacts,     setContacts]     = useState([])
  const [selected,     setSelected]     = useState(null)
  const [messages,     setMessages]     = useState([])
  const [body,         setBody]         = useState('')
  const [loading,      setLoading]      = useState(true)
  const [sending,      setSending]      = useState(false)
  const [search,       setSearch]       = useState('')
  const [showSide,     setShowSide]     = useState(true)
  const [showProfile,  setShowProfile]  = useState(false)
  const [unread,       setUnread]       = useState({})
  const endRef = useRef(null)
  const subRef = useRef(null)

  useEffect(() => {
    async function init() {
      try {
        const { data: { user: u } } = await supabase.auth.getUser()
        if (!u) { router.push('/apps/medical/login'); return }
        const { data: ud } = await supabase.from('users')
          .select('role, tenant_id, app_type, full_name, phone')
          .eq('id', u.id).maybeSingle()
        if (!ud || ud.app_type !== 'medical') { router.push('/apps/medical/login'); return }
        setUser({ ...u, ...ud })
        const { data: all } = await supabase.from('users')
          .select('id, full_name, role')
          .eq('tenant_id', ud.tenant_id)
          .eq('app_type', 'medical')
          .neq('id', u.id)
        setContacts(all || [])
        const { data: unreadData } = await supabase.from('med_messages')
          .select('from_uid').eq('to_uid', u.id).eq('read', false)
        const counts = {}
        ;(unreadData || []).forEach(m => { counts[m.from_uid] = (counts[m.from_uid] || 0) + 1 })
        setUnread(counts)
      } catch { router.push('/apps/medical/login') }
      finally { setLoading(false) }
    }
    init()
  }, [router])

  const loadMsgs = useCallback(async () => {
    if (!user || !selected) return
    try {
      const { data } = await supabase.from('med_messages')
        .select('id, from_uid, to_uid, body, read, sent_at')
        .or(`and(from_uid.eq.${user.id},to_uid.eq.${selected.id}),and(from_uid.eq.${selected.id},to_uid.eq.${user.id})`)
        .order('sent_at', { ascending: true }).limit(100)
      setMessages(data || [])
      await supabase.from('med_messages').update({ read: true })
        .eq('to_uid', user.id).eq('from_uid', selected.id).eq('read', false)
      setUnread(prev => { const n = {...prev}; delete n[selected.id]; return n })
    } catch {}
  }, [user, selected])

  useEffect(() => {
    loadMsgs()
    if (subRef.current) subRef.current.unsubscribe()
    if (!user || !selected) return
    subRef.current = supabase.channel(`msg_${user.id}_${selected.id}`)
      .on('postgres_changes', { event:'INSERT', schema:'public', table:'med_messages' }, payload => {
        const m = payload.new
        if ((m.from_uid===user.id&&m.to_uid===selected.id)||(m.from_uid===selected.id&&m.to_uid===user.id)) {
          setMessages(p => [...p, m])
          if (m.to_uid===user.id) supabase.from('med_messages').update({read:true}).eq('id',m.id)
        }
      }).subscribe()
    return () => { if (subRef.current) subRef.current.unsubscribe() }
  }, [selected, loadMsgs, user])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior:'smooth' }) }, [messages])

  async function send() {
    if (!body.trim()||!selected||!user||sending) return
    setSending(true)
    const msg = body.trim().slice(0, 2000)
    setBody('')
    try {
      await supabase.from('med_messages').insert({
        tenant_id: user.tenant_id, from_uid: user.id, to_uid: selected.id, body: msg, read: false
      })
    } catch {}
    setSending(false)
  }

  const filtered = contacts.filter(c => !search || (c.full_name||'').toLowerCase().includes(search.toLowerCase()))
  const backRoute = BACK_ROUTES[user?.role] || '/apps/medical/login'
  const myInits = initials(user?.full_name || user?.email || '')

  if (loading) return <div style={{background:'var(--bg-base)',height:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}><div style={{width:140,height:8,borderRadius:4,background:'var(--bg-surface)'}} /></div>

  return (
    <>
      <style>{CSS}</style>
      <div className="msg-root">
        <div className="msg-bar">
          <button className="msg-back" onClick={() => router.push(backRoute)}><ArrowLeft size={15}/> Retour</button>
          <span className="msg-h1">Messagerie</span>
          {!showSide && <button className="msg-back" onClick={() => setShowSide(true)}>Contacts</button>}
          <div className="msg-av" style={{ background: ROLE_COLORS[user?.role] || ROLE_COLORS.app_end_user }}
            onClick={() => setShowProfile(true)} title="Mon profil">{myInits}</div>
        </div>
        <div className="msg-body">
          <div className={`msg-side ${!showSide ? 'hidden' : ''}`}>
            <div className="msg-side-head">
              <div className="msg-sr"><Search size={13} color="var(--tx-3)"/><input placeholder="Rechercher…" value={search} onChange={e=>setSearch(e.target.value)}/></div>
            </div>
            <div className="msg-list">
              {filtered.length===0 ? (
                <div style={{padding:'32px 16px',textAlign:'center',color:'var(--tx-3)',fontSize:'.82rem'}}>
                  <User size={28} style={{margin:'0 auto 8px',display:'block',opacity:.3}}/>Aucun contact
                </div>
              ) : filtered.map(c => (
                <div key={c.id} className={`msg-ci ${selected?.id===c.id?'active':''}`} onClick={() => { setSelected(c); setShowSide(false) }}>
                  <div className="msg-ca" style={{background:ROLE_COLORS[c.role]||ROLE_COLORS.app_end_user}}>{initials(c.full_name)}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div className="msg-cn">{c.full_name||'Utilisateur'}</div>
                    <div className="msg-cr">{ROLE_LABELS[c.role]||c.role}</div>
                  </div>
                  {unread[c.id]>0 && <div className="msg-ub">{unread[c.id]}</div>}
                  <ChevronRight size={13} color="var(--tx-3)"/>
                </div>
              ))}
            </div>
          </div>
          <div className={`msg-thread ${showSide&&contacts.length>0?'hidden':''}`}>
            {!selected ? (
              <div className="msg-none">
                <MessageSquare size={44} style={{opacity:.2}}/>
                <div style={{fontWeight:600,color:'var(--tx-2)'}}>Sélectionnez un contact</div>
              </div>
            ) : (
              <>
                <div className="msg-th">
                  <div className="msg-ca" style={{width:38,height:38,background:ROLE_COLORS[selected.role],borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.8rem',fontWeight:800,color:'white',flexShrink:0}}>{initials(selected.full_name)}</div>
                  <div><div className="msg-thn">{selected.full_name||'Utilisateur'}</div><div className="msg-thr">{ROLE_LABELS[selected.role]}</div></div>
                  <button onClick={loadMsgs} style={{marginLeft:'auto',background:'none',border:'none',color:'var(--tx-3)',cursor:'pointer'}}><RefreshCw size={14}/></button>
                </div>
                <div className="msg-msgs">
                  {messages.length===0 ? (
                    <div style={{textAlign:'center',color:'var(--tx-3)',fontSize:'.82rem',margin:'auto'}}>
                      <MessageSquare size={28} style={{margin:'0 auto 8px',display:'block',opacity:.3}}/>Commencez la conversation
                    </div>
                  ) : messages.map((m, idx) => {
                    const mine = m.from_uid===user.id
                    const prev = messages[idx-1]
                    const showDate = !prev || new Date(m.sent_at).toDateString()!==new Date(prev.sent_at).toDateString()
                    return (
                      <div key={m.id}>
                        {showDate && <div className="msg-sep"><span>{new Date(m.sent_at).toLocaleDateString('fr-TN',{weekday:'long',day:'numeric',month:'long'})}</span></div>}
                        <div className={`msg-brow ${mine?'mine':''}`}>
                          <div className={`msg-b ${mine?'mine':'theirs'}`}>
                            {m.body}
                            <div className="msg-bt">{formatTime(m.sent_at)}</div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={endRef}/>
                </div>
                <div className="msg-comp">
                  <textarea placeholder={`Message à ${selected.full_name||'ce contact'}… (Entrée pour envoyer)`}
                    value={body} onChange={e=>setBody(e.target.value)}
                    onKeyDown={e=>{ if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()} }}
                    rows={1} maxLength={2000}/>
                  <button className="msg-send" onClick={send} disabled={sending||!body.trim()}><Send size={16}/></button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      {showProfile && user && <ProfileModal user={{...user,full_name:user.full_name||user.email}} onClose={() => setShowProfile(false)}/>}
    </>
  )
}
