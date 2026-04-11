'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { WalaupSound } from '@/lib/sound'
import { Send, CheckCheck } from 'lucide-react'

const MAX_LEN = 2000

function formatTime(ts) {
  if (!ts) return ''
  const d = new Date(ts), now = new Date(), diff = (now - d) / 1000
  if (diff < 60) return 'maintenant'
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)}min`
  if (diff < 86400) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function pushNotif(body) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
  try {
    new Notification('💬 Walaup — Nouveau message', {
      body: body.slice(0, 100),
      icon: '/favicon.ico',
      tag: 'walaup-msg',
      renotify: true,
    })
  } catch {}
}

const CSS = `
  .tm-wrap {
    display:flex;
    flex-direction:column;
    height:100%;
    min-height:0;
    padding:0 16px 16px 16px;
    box-sizing:border-box;
  }
  .tm-title {
    font-family:var(--font-display);
    font-size:1.15rem;
    font-weight:800;
    color:var(--tx);
    padding: 0 0 14px 0;
    flex-shrink:0;
  }
  .tm-chat-box {
    flex:1;
    min-height:0;
    overflow-y:auto;
    display:flex;
    flex-direction:column;
    gap:10px;
    padding:16px;
    background:rgba(13,17,32,0.5);
    border:1px solid rgba(255,255,255,0.07);
    border-radius:16px;
    scrollbar-width:thin;
    scrollbar-color:rgba(255,255,255,.07) transparent;
    margin-bottom:12px;
  }
  .tm-chat-box::-webkit-scrollbar { width:4px; }
  .tm-chat-box::-webkit-scrollbar-thumb { background:rgba(255,255,255,.08); border-radius:4px; }
  .tm-row { display:flex; flex-direction:column; max-width:76%; animation:tm-in .2s ease-out; }
  .tm-row--admin { align-self:flex-start; }
  .tm-row--client { align-self:flex-end; }
  .tm-row--temp { opacity:0.55; }
  .tm-sender { font-size:10.5px; color:var(--tx-3); margin-bottom:4px; font-weight:500; }
  .tm-bubble { padding:10px 14px; font-size:13.5px; line-height:1.58; word-break:break-word; }
  .tm-bubble--admin {
    background:rgba(255,255,255,.07);
    border:1px solid rgba(255,255,255,.07);
    color:var(--tx);
    border-radius:4px 16px 16px 16px;
  }
  .tm-bubble--client {
    background:linear-gradient(135deg,rgba(99,102,241,.32),rgba(139,92,246,.22));
    border:1px solid rgba(99,102,241,.28);
    color:var(--tx);
    border-radius:16px 16px 4px 16px;
  }
  .tm-ts {
    font-size:10px;
    color:var(--tx-3);
    margin-top:4px;
    display:flex;
    align-items:center;
    gap:4px;
  }
  .tm-row--client .tm-ts { justify-content:flex-end; }
  .tm-typing {
    display:inline-flex;
    align-items:center;
    gap:5px;
    padding:10px 14px;
    background:rgba(255,255,255,.06);
    border:1px solid rgba(255,255,255,.07);
    border-radius:4px 16px 16px 16px;
  }
  .tm-dot { width:6px; height:6px; border-radius:50%; background:var(--tx-3); }
  .tm-dot:nth-child(1){animation:tm-bounce .9s ease-in-out infinite}
  .tm-dot:nth-child(2){animation:tm-bounce .9s ease-in-out .15s infinite}
  .tm-dot:nth-child(3){animation:tm-bounce .9s ease-in-out .30s infinite}
  @keyframes tm-bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-6px)}}
  .tm-compose {
    display:flex;
    gap:10px;
    align-items:flex-end;
    flex-shrink:0;
  }
  .tm-textarea {
    flex:1;
    padding:10px 14px;
    background:rgba(255,255,255,.05);
    border:1px solid rgba(255,255,255,.09);
    border-radius:14px;
    color:var(--tx);
    font-size:13.5px;
    font-family:var(--font-body);
    outline:none;
    resize:none;
    max-height:120px;
    min-height:42px;
    transition:border-color .2s;
    line-height:1.5;
    box-sizing:border-box;
  }
  .tm-textarea:focus { border-color:rgba(99,102,241,.42); }
  .tm-textarea::placeholder { color:var(--tx-3); }
  .tm-send {
    width:42px;
    height:42px;
    flex-shrink:0;
    border-radius:13px;
    background:linear-gradient(135deg,var(--ac),var(--ac-2));
    border:none;
    cursor:pointer;
    display:flex;
    align-items:center;
    justify-content:center;
    transition:all .22s;
    box-shadow:0 3px 12px rgba(99,102,241,.30);
  }
  .tm-send:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 5px 18px rgba(99,102,241,.42); }
  .tm-send:disabled { opacity:.35; cursor:not-allowed; }
  .tm-empty {
    flex:1;
    display:flex;
    flex-direction:column;
    align-items:center;
    justify-content:center;
    gap:10px;
    color:var(--tx-3);
    text-align:center;
  }
  @keyframes tm-in { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
  @keyframes tm-spin { to{transform:rotate(360deg)} }
  .tm-spin {
    width:24px; height:24px;
    border:2px solid rgba(99,102,241,.2);
    border-top-color:var(--ac);
    border-radius:50%;
    animation:tm-spin .8s linear infinite;
  }
`

export default function TabMessages({ lead, session, isActive, onUnreadChange }) {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [adminTyping, setAdminTyping] = useState(false)
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const endRef = useRef(null)
  const typingTimer = useRef(null)
  const msgChannelRef = useRef(null)
  const typingChannelRef = useRef(null)
  const pollRef = useRef(null)

  const scrollToEnd = useCallback((smooth = true) => {
    endRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'instant' })
  }, [])

  const fetchMessages = useCallback(async () => {
    if (!lead?.id) return
    const { data, error } = await supabase
      .from('messages')
      .select('id, sender, text, is_read, created_at')
      .eq('lead_id', lead.id)
      .order('created_at', { ascending: true })
    if (!error && data) {
      setMessages(prev => {
        const temps = prev.filter(m => m._temp && !data.some(s => s.text === m.text && s.sender === m.sender))
        return [...data, ...temps].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      })
      setTimeout(() => scrollToEnd(false), 60)

      // Badge non-lus uniquement si l'onglet messages n'est pas actif
      if (!isActive) {
        const unread = data.filter(m => m.sender === 'admin' && !m.is_read).length
        setUnreadCount(unread)
        if (onUnreadChange) onUnreadChange(unread)
      }
    }
    // Marquer lus si onglet actif
    if (isActive) {
      await supabase.from('messages').update({ is_read: true }).eq('lead_id', lead.id).eq('sender', 'admin')
      setUnreadCount(0)
      if (onUnreadChange) onUnreadChange(0)
    }
  }, [lead?.id, isActive, scrollToEnd, onUnreadChange])

  useEffect(() => {
    if (!lead?.id) { setLoading(false); return }

    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission()
    }

    fetchMessages().then(() => setLoading(false))

    // POLLING PRIMARY — 6s garantit la réception même sans WebSocket
    clearInterval(pollRef.current)
    pollRef.current = setInterval(fetchMessages, 6000)

    // REALTIME SECONDARY — boost instantané
    if (msgChannelRef.current) supabase.removeChannel(msgChannelRef.current)
    msgChannelRef.current = supabase
      .channel(`cl-msgs-${lead.id}-${Date.now()}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, ({ new: msg }) => {
        if (msg.lead_id !== lead.id) return
        setMessages(prev => {
          if (prev.find(m => m.id === msg.id)) return prev
          const clean = prev.filter(m => !(m._temp && m.sender === msg.sender && m.text === msg.text))
          return [...clean, msg]
        })
        if (msg.sender === 'admin') {
          WalaupSound.receive()
          if (!isActive || document.hidden) {
            pushNotif(msg.text)
            setUnreadCount(c => {
              const next = c + 1
              if (onUnreadChange) onUnreadChange(next)
              return next
            })
          }
        }
        setTimeout(() => scrollToEnd(true), 40)
      })
      .subscribe()

    // TYPING admin
    if (typingChannelRef.current) supabase.removeChannel(typingChannelRef.current)
    typingChannelRef.current = supabase
      .channel(`cl-typing-${lead.id}-${Date.now()}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'leads' }, ({ new: d }) => {
        if (d.id !== lead.id) return
        setAdminTyping(!!d.admin_typing)
        if (d.admin_typing) setTimeout(() => scrollToEnd(true), 40)
      })
      .subscribe()

    // VISIBILITYCHANGE refetch
    const onVisible = () => {
      if (document.visibilityState === 'visible') fetchMessages()
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      clearInterval(pollRef.current)
      if (msgChannelRef.current) supabase.removeChannel(msgChannelRef.current)
      if (typingChannelRef.current) supabase.removeChannel(typingChannelRef.current)
      clearTimeout(typingTimer.current)
      document.removeEventListener('visibilitychange', onVisible)
      supabase.from('leads').update({ client_typing: false }).eq('id', lead.id).then(() => {})
    }
  }, [lead?.id, fetchMessages, scrollToEnd, isActive])

  // Marquer lus quand l'onglet devient actif
  useEffect(() => {
    if (isActive && lead?.id) {
      supabase.from('messages').update({ is_read: true }).eq('lead_id', lead.id).eq('sender', 'admin').then(() => {})
      setUnreadCount(0)
      if (onUnreadChange) onUnreadChange(0)
    }
  }, [isActive, lead?.id, onUnreadChange])

  useEffect(() => {
    if (!loading) setTimeout(() => scrollToEnd(true), 60)
  }, [adminTyping, loading, scrollToEnd])

  function onInput(e) {
    setText(e.target.value)
    if (!lead?.id) return
    supabase.from('leads').update({ client_typing: true }).eq('id', lead.id).then(() => {})
    clearTimeout(typingTimer.current)
    typingTimer.current = setTimeout(() => {
      supabase.from('leads').update({ client_typing: false }).eq('id', lead.id).then(() => {})
    }, 2200)
  }

  async function sendMsg() {
    const t = text.trim()
    if (!t || !lead?.id || sending || t.length > MAX_LEN) return
    setSending(true)
    WalaupSound.send()
    setText('')
    clearTimeout(typingTimer.current)
    supabase.from('leads').update({ client_typing: false }).eq('id', lead.id).then(() => {})
    const temp = {
      id: `temp-${Date.now()}`, sender: 'client', text: t,
      created_at: new Date().toISOString(), is_read: false, _temp: true,
    }
    setMessages(prev => [...prev, temp])
    setTimeout(() => scrollToEnd(true), 30)
    await supabase.from('messages').insert({ lead_id: lead.id, sender: 'client', text: t, is_read: false })
    setSending(false)
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg() }
  }

  if (!lead) return (
    <>
      <style>{CSS}</style>
      <div className="tm-wrap">
        <div className="tm-title">Messages</div>
        <div className="tm-empty">
          <span style={{ fontSize: 36 }}>💬</span>
          <p style={{ fontSize: 13, margin: 0 }}>Aucun projet actif pour le moment.</p>
        </div>
      </div>
    </>
  )

  return (
    <>
      <style>{CSS}</style>
      <div className="tm-wrap">
        <div className="tm-title">Messages</div>
        <div className="tm-chat-box">
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, padding: 20 }}>
              <div className="tm-spin" />
            </div>
          )}
          {!loading && messages.length === 0 && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, color: 'var(--tx-3)', textAlign: 'center', padding: 30 }}>
              <span style={{ fontSize: 32 }}>✉️</span>
              <p style={{ fontSize: 13, margin: 0 }}>Commencez la conversation avec l&apos;équipe Walaup.</p>
            </div>
          )}
          {messages.map(msg => (
            <div key={msg.id} className={`tm-row tm-row--${msg.sender}${msg._temp ? ' tm-row--temp' : ''}`}>
              {msg.sender === 'admin' && <span className="tm-sender">Walaup</span>}
              <div className={`tm-bubble tm-bubble--${msg.sender}`}>{msg.text}</div>
              <div className="tm-ts">
                {formatTime(msg.created_at)}
                {msg.sender === 'client' && <CheckCheck size={10} />}
              </div>
            </div>
          ))}
          {adminTyping && (
            <div className="tm-row tm-row--admin">
              <span className="tm-sender">Walaup écrit…</span>
              <div className="tm-typing">
                <div className="tm-dot" />
                <div className="tm-dot" />
                <div className="tm-dot" />
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div className="tm-compose">
          <textarea
            className="tm-textarea"
            placeholder="Votre message…"
            value={text}
            rows={1}
            maxLength={MAX_LEN}
            onChange={onInput}
            onKeyDown={onKeyDown}
          />
          <button className="tm-send" onClick={sendMsg} disabled={sending || !text.trim()} aria-label="Envoyer">
            <Send size={18} color="#fff" />
          </button>
        </div>
      </div>
    </>
  )
}
