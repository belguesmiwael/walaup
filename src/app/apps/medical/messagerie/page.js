'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Send, Search, MessageSquare,
  User, Clock, ChevronRight, RefreshCw
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

const CSS = `
  .msg-root {
    position:fixed; inset:0; background:var(--bg-base);
    display:flex; flex-direction:column; overflow:hidden;
  }

  /* ── Topbar ── */
  .msg-topbar {
    height:56px; display:flex; align-items:center;
    padding:0 20px; gap:12px; flex-shrink:0;
    background:rgba(8,11,20,.96); border-bottom:1px solid var(--border);
    backdrop-filter:blur(20px); z-index:100;
  }
  .msg-back { display:flex; align-items:center; gap:6px; color:var(--tx-2);
    font-size:.85rem; font-weight:600; cursor:pointer; background:none;
    border:none; transition:color .15s; padding:0; }
  .msg-back:hover { color:#0EA5E9; }
  .msg-title { font-family:var(--font-display); font-weight:700;
    font-size:.95rem; color:var(--tx); flex:1; }

  /* ── Layout ── */
  .msg-body { flex:1; display:flex; overflow:hidden; }

  /* ── Inbox ── */
  .msg-inbox {
    width:300px; flex-shrink:0;
    border-right:1px solid var(--border);
    display:flex; flex-direction:column; overflow:hidden;
  }
  @media (max-width:767px) {
    .msg-inbox { width:100%; }
    .msg-inbox.hidden { display:none; }
    .msg-thread { display:none; }
    .msg-thread.visible { display:flex; }
  }
  .msg-inbox-search {
    padding:12px; border-bottom:1px solid var(--border); flex-shrink:0;
  }
  .msg-search-bar {
    display:flex; align-items:center; gap:8px;
    background:var(--bg-surface); border:1px solid var(--border);
    border-radius:10px; padding:0 12px; height:36px;
  }
  .msg-search-bar input { flex:1; background:none; border:none; outline:none;
    color:var(--tx); font-size:.82rem; }
  .msg-search-bar input::placeholder { color:var(--tx-3); }
  .msg-inbox-list { flex:1; overflow-y:auto; }
  .msg-thread-item {
    display:flex; align-items:center; gap:10px; padding:12px 14px;
    cursor:pointer; transition:background .15s;
    border-bottom:1px solid var(--border);
  }
  .msg-thread-item:hover { background:var(--bg-hover); }
  .msg-thread-item.active { background:rgba(14,165,233,.08); }
  .msg-thread-avatar {
    width:38px; height:38px; border-radius:50%; flex-shrink:0;
    display:flex; align-items:center; justify-content:center;
    font-size:.82rem; font-weight:800; color:white;
    background:linear-gradient(135deg,#0EA5E9,#38BDF8);
  }
  .msg-thread-info { flex:1; min-width:0; }
  .msg-thread-name { font-weight:700; font-size:.85rem; color:var(--tx); }
  .msg-thread-preview { font-size:.73rem; color:var(--tx-3); margin-top:2px;
    white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .msg-thread-time { font-size:.68rem; color:var(--tx-3); flex-shrink:0; }
  .msg-unread-dot { width:8px; height:8px; border-radius:50%;
    background:#0EA5E9; flex-shrink:0; }
  .msg-inbox-empty { padding:40px 20px; text-align:center; color:var(--tx-3); font-size:.82rem; }

  /* ── Thread view ── */
  .msg-thread {
    flex:1; display:flex; flex-direction:column; overflow:hidden;
  }
  .msg-thread-header {
    padding:14px 20px; border-bottom:1px solid var(--border); flex-shrink:0;
    display:flex; align-items:center; gap:10px;
  }
  .msg-thread-header-name { font-weight:700; font-size:.95rem; color:var(--tx); }
  .msg-thread-header-role { font-size:.73rem; color:var(--tx-3); margin-top:2px; }
  .msg-messages { flex:1; overflow-y:auto; padding:16px 20px;
    display:flex; flex-direction:column; gap:10px; }
  .msg-bubble-wrap { display:flex; }
  .msg-bubble-wrap.mine { justify-content:flex-end; }
  .msg-bubble {
    max-width:70%; padding:10px 14px; border-radius:14px;
    font-size:.875rem; line-height:1.45; word-break:break-word;
  }
  .msg-bubble.mine {
    background:#0EA5E9; color:white;
    border-bottom-right-radius:4px;
  }
  .msg-bubble.theirs {
    background:var(--bg-surface); color:var(--tx);
    border:1px solid var(--border); border-bottom-left-radius:4px;
  }
  .msg-bubble-time { font-size:.65rem; margin-top:4px; opacity:.7; text-align:right; }
  .msg-bubble.theirs .msg-bubble-time { text-align:left; }

  /* ── Composer ── */
  .msg-composer {
    padding:12px 16px; border-top:1px solid var(--border); flex-shrink:0;
    display:flex; gap:10px; align-items:flex-end;
  }
  .msg-composer textarea {
    flex:1; padding:10px 14px; border-radius:12px;
    border:1px solid var(--border); background:var(--bg-surface);
    color:var(--tx); font-size:.875rem; outline:none;
    resize:none; font-family:var(--font-body); max-height:100px;
    transition:border-color .15s;
  }
  .msg-composer textarea:focus { border-color:#0EA5E9; }
  .msg-composer textarea::placeholder { color:var(--tx-3); }
  .msg-send {
    width:40px; height:40px; border-radius:12px; flex-shrink:0;
    background:#0EA5E9; border:none; color:white;
    display:flex; align-items:center; justify-content:center;
    cursor:pointer; transition:all .18s;
  }
  .msg-send:hover { background:#0284C7; transform:scale(1.05); }
  .msg-send:disabled { opacity:.4; cursor:not-allowed; transform:none; }

  /* ── No thread selected ── */
  .msg-no-thread {
    flex:1; display:flex; align-items:center; justify-content:center;
    flex-direction:column; gap:12px; color:var(--tx-3);
  }
  .msg-no-thread-icon { opacity:.2; }

  .msg-skeleton { background:linear-gradient(90deg,var(--bg-surface) 25%,var(--bg-hover) 50%,var(--bg-surface) 75%);
    background-size:200% 100%; animation:msgShimmer 1.5s infinite; border-radius:8px; }
  @keyframes msgShimmer { 0%{background-position:200%} 100%{background-position:-200%} }
`

function formatTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  const diff = now - d
  if (diff < 60000) return 'À l\'instant'
  if (diff < 3600000) return `${Math.floor(diff/60000)}min`
  if (diff < 86400000) return d.toLocaleTimeString('fr-TN', { hour:'2-digit', minute:'2-digit' })
  return d.toLocaleDateString('fr-TN', { day:'2-digit', month:'short' })
}
function initials(name) {
  return (name||'?').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()
}

export default function Messagerie() {
  const router = useRouter()
  const [user,        setUser]        = useState(null)
  const [tenantUsers, setTenantUsers] = useState([])
  const [messages,    setMessages]    = useState([])
  const [selectedUser,setSelectedUser]= useState(null)
  const [body,        setBody]        = useState('')
  const [loading,     setLoading]     = useState(true)
  const [sending,     setSending]     = useState(false)
  const [search,      setSearch]      = useState('')
  const [showInbox,   setShowInbox]   = useState(true)
  const messagesEndRef = useRef(null)
  const subRef = useRef(null)

  /* ── Auth ── */
  useEffect(() => {
    async function init() {
      try {
        const { data: { user: u } } = await supabase.auth.getUser()
        if (!u) { router.push('/apps/medical/login'); return }
        const { data: ud } = await supabase.from('users')
          .select('role, tenant_id, app_type, full_name')
          .eq('id', u.id).maybeSingle()
        if (!ud || ud.app_type !== 'medical') { router.push('/apps/medical/login'); return }
        setUser({ ...u, ...ud })

        // Charger tous les users du même tenant
        const { data: tUsers } = await supabase.from('users')
          .select('id, full_name, role')
          .eq('tenant_id', ud.tenant_id)
          .neq('id', u.id)
        setTenantUsers(tUsers || [])
      } catch { router.push('/apps/medical/login') }
      finally { setLoading(false) }
    }
    init()
  }, [router])

  /* ── Charger messages avec selectedUser ── */
  const loadMessages = useCallback(async () => {
    if (!user || !selectedUser) return
    const { data } = await supabase.from('med_messages')
      .select('*')
      .or(`and(from_uid.eq.${user.id},to_uid.eq.${selectedUser.id}),and(from_uid.eq.${selectedUser.id},to_uid.eq.${user.id})`)
      .order('sent_at', { ascending: true })
      .limit(50)
    setMessages(data || [])

    // Marquer comme lus
    await supabase.from('med_messages')
      .update({ read: true })
      .eq('to_uid', user.id)
      .eq('from_uid', selectedUser.id)
      .eq('read', false)
  }, [user, selectedUser])

  useEffect(() => {
    loadMessages()
    // Subscription temps réel
    if (subRef.current) subRef.current.unsubscribe()
    if (!user || !selectedUser) return
    subRef.current = supabase.channel('med_messages_channel')
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'med_messages',
        filter: `to_uid=eq.${user.id}`
      }, () => loadMessages())
      .subscribe()
    return () => { if (subRef.current) subRef.current.unsubscribe() }
  }, [selectedUser, loadMessages, user])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage() {
    if (!body.trim() || !selectedUser || !user) return
    setSending(true)
    try {
      await supabase.from('med_messages').insert({
        tenant_id: user.tenant_id,
        from_uid:  user.id,
        to_uid:    selectedUser.id,
        body:      body.trim().slice(0, 2000),
        read:      false,
      })
      setBody('')
      loadMessages()
    } catch { /* silencieux */ }
    setSending(false)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  function selectUser(u) {
    setSelectedUser(u)
    setShowInbox(false)
  }

  const filteredUsers = tenantUsers.filter(u =>
    !search || (u.full_name||'').toLowerCase().includes(search.toLowerCase())
  )

  const roleLabel = (role) => {
    if (role === 'tenant_admin')  return 'Médecin'
    if (role === 'tenant_user')   return 'Secrétaire'
    if (role === 'app_end_user')  return 'Patient'
    return role
  }

  if (loading) return (
    <div style={{ background:'var(--bg-base)', height:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div className="msg-skeleton" style={{ width:140, height:8 }} />
    </div>
  )

  const backRoute = user?.role === 'tenant_admin' ? '/apps/medical/doctor'
    : user?.role === 'tenant_user' ? '/apps/medical/secretary'
    : '/apps/medical/patient'

  return (
    <>
      <style>{CSS}</style>
      <div className="msg-root">
        <div className="msg-topbar">
          <button className="msg-back" onClick={() => router.push(backRoute)}>
            <ArrowLeft size={15}/> Retour
          </button>
          <span className="msg-title">Messagerie</span>
          {!showInbox && (
            <button className="msg-back" onClick={() => setShowInbox(true)}>
              Contacts
            </button>
          )}
        </div>

        <div className="msg-body">
          {/* Inbox */}
          <div className={`msg-inbox ${!showInbox ? 'hidden' : ''}`}>
            <div className="msg-inbox-search">
              <div className="msg-search-bar">
                <Search size={14} color="var(--tx-3)"/>
                <input placeholder="Rechercher…" value={search}
                  onChange={e => setSearch(e.target.value)}/>
              </div>
            </div>
            <div className="msg-inbox-list">
              {filteredUsers.length === 0 ? (
                <div className="msg-inbox-empty">
                  <MessageSquare size={28} style={{ margin:'0 auto 8px', display:'block', opacity:.3 }}/>
                  Aucun contact disponible
                </div>
              ) : filteredUsers.map(u => (
                <div key={u.id}
                  className={`msg-thread-item ${selectedUser?.id === u.id ? 'active' : ''}`}
                  onClick={() => selectUser(u)}>
                  <div className="msg-thread-avatar">{initials(u.full_name)}</div>
                  <div className="msg-thread-info">
                    <div className="msg-thread-name">{u.full_name || 'Utilisateur'}</div>
                    <div className="msg-thread-preview">{roleLabel(u.role)}</div>
                  </div>
                  <ChevronRight size={14} color="var(--tx-3)"/>
                </div>
              ))}
            </div>
          </div>

          {/* Thread */}
          <div className={`msg-thread ${!showInbox ? 'visible' : ''}`}>
            {!selectedUser ? (
              <div className="msg-no-thread">
                <div className="msg-no-thread-icon">
                  <MessageSquare size={48}/>
                </div>
                <div style={{ fontWeight:600, color:'var(--tx-2)' }}>Sélectionnez un contact</div>
                <div style={{ fontSize:'.8rem' }}>pour démarrer une conversation</div>
              </div>
            ) : (
              <>
                <div className="msg-thread-header">
                  <div className="msg-thread-avatar" style={{ width:38, height:38, borderRadius:'50%', background:'linear-gradient(135deg,#0EA5E9,#38BDF8)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.8rem', fontWeight:800, color:'white', flexShrink:0 }}>
                    {initials(selectedUser.full_name)}
                  </div>
                  <div>
                    <div className="msg-thread-header-name">{selectedUser.full_name || 'Utilisateur'}</div>
                    <div className="msg-thread-header-role">{roleLabel(selectedUser.role)}</div>
                  </div>
                  <button onClick={loadMessages} style={{ marginLeft:'auto', background:'none', border:'none', color:'var(--tx-3)', cursor:'pointer' }}>
                    <RefreshCw size={14}/>
                  </button>
                </div>

                <div className="msg-messages">
                  {messages.length === 0 ? (
                    <div style={{ textAlign:'center', color:'var(--tx-3)', fontSize:'.82rem', margin:'auto' }}>
                      <MessageSquare size={28} style={{ margin:'0 auto 8px', display:'block', opacity:.3 }}/>
                      Aucun message — commencez la conversation
                    </div>
                  ) : messages.map(msg => {
                    const isMine = msg.from_uid === user.id
                    return (
                      <div key={msg.id} className={`msg-bubble-wrap ${isMine ? 'mine' : ''}`}>
                        <div className={`msg-bubble ${isMine ? 'mine' : 'theirs'}`}>
                          {msg.body}
                          <div className="msg-bubble-time">{formatTime(msg.sent_at)}</div>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </div>

                <div className="msg-composer">
                  <textarea
                    placeholder="Écrire un message… (Entrée pour envoyer)"
                    value={body}
                    onChange={e => setBody(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={1}
                    maxLength={2000}
                  />
                  <button className="msg-send" onClick={sendMessage} disabled={sending || !body.trim()}>
                    <Send size={16}/>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
