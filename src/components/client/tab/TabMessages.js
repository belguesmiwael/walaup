'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { WalaupSound } from '@/lib/sound'
import { Send } from 'lucide-react'

// Security: text is trimmed + sliced server-side by Supabase, maxLength on input
const MAX_MSG_LENGTH = 2000

function formatTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const now = new Date()
  const diffSec = (now - d) / 1000
  if (diffSec < 60) return 'maintenant'
  if (diffSec < 3600) return `il y a ${Math.floor(diffSec / 60)}min`
  if (diffSec < 86400) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

const CSS = `
  .tm-root { display: flex; flex-direction: column; height: calc(100vh - 64px - 116px); }
  @media (max-width: 767px) { .tm-root { height: calc(100vh - 64px - 64px - 80px); } }

  .tm-msgs {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 4px 2px;
    scrollbar-width: thin;
    scrollbar-color: rgba(255,255,255,.08) transparent;
  }
  .tm-msgs::-webkit-scrollbar { width: 4px; }
  .tm-msgs::-webkit-scrollbar-thumb { background: rgba(255,255,255,.08); border-radius: 4px; }

  /* Message row */
  .tm-row { display: flex; flex-direction: column; max-width: 76%; }
  .tm-row--admin { align-self: flex-start; }
  .tm-row--client { align-self: flex-end; }

  .tm-sender { font-size: 10.5px; color: var(--tx-3); margin-bottom: 4px; font-weight: 500; }

  .tm-bubble {
    padding: 10px 14px;
    font-size: 13.5px;
    line-height: 1.58;
    word-break: break-word;
  }
  .tm-bubble--admin {
    background: rgba(255,255,255,.07);
    border: 1px solid rgba(255,255,255,.07);
    color: var(--tx);
    border-radius: 4px 16px 16px 16px;
  }
  .tm-bubble--client {
    background: linear-gradient(135deg, rgba(99,102,241,.32), rgba(139,92,246,.22));
    border: 1px solid rgba(99,102,241,.28);
    color: var(--tx);
    border-radius: 16px 16px 4px 16px;
  }
  .tm-ts {
    font-size: 10px;
    color: var(--tx-3);
    margin-top: 4px;
  }
  .tm-row--client .tm-ts { text-align: right; }

  /* Typing indicator */
  .tm-typing {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 10px 14px;
    background: rgba(255,255,255,.06);
    border: 1px solid rgba(255,255,255,.07);
    border-radius: 4px 16px 16px 16px;
  }
  .tm-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--tx-3);
  }
  .tm-dot:nth-child(1) { animation: tm-bounce .9s ease-in-out infinite; }
  .tm-dot:nth-child(2) { animation: tm-bounce .9s ease-in-out .15s infinite; }
  .tm-dot:nth-child(3) { animation: tm-bounce .9s ease-in-out .30s infinite; }
  @keyframes tm-bounce { 0%,60%,100% { transform:translateY(0); } 30% { transform:translateY(-6px); } }

  /* Compose */
  .tm-compose {
    display: flex;
    gap: 10px;
    align-items: flex-end;
    padding-top: 14px;
    border-top: 1px solid rgba(255,255,255,.06);
    margin-top: 8px;
  }
  .tm-textarea {
    flex: 1;
    padding: 10px 14px;
    background: rgba(255,255,255,.05);
    border: 1px solid rgba(255,255,255,.09);
    border-radius: 14px;
    color: var(--tx);
    font-size: 13.5px;
    font-family: var(--font-body);
    outline: none;
    resize: none;
    max-height: 120px;
    min-height: 42px;
    transition: border-color .2s;
    line-height: 1.5;
  }
  .tm-textarea:focus { border-color: rgba(99,102,241,.42); }
  .tm-textarea::placeholder { color: var(--tx-3); }
  .tm-send {
    width: 42px;
    height: 42px;
    flex-shrink: 0;
    border-radius: 13px;
    background: linear-gradient(135deg, var(--ac), var(--ac-2));
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all .22s cubic-bezier(0.16,1,0.3,1);
    box-shadow: 0 3px 12px rgba(99,102,241,.30);
  }
  .tm-send:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 5px 18px rgba(99,102,241,.42); }
  .tm-send:active:not(:disabled) { transform: translateY(0); }
  .tm-send:disabled { opacity: .35; cursor: not-allowed; }

  /* Entry animation */
  @keyframes tm-in { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:none; } }
  .tm-row { animation: tm-in .2s ease-out; }

  /* Empty / Loading */
  .tm-center { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; color:var(--tx-3); text-align:center; padding:20px; }

  @keyframes tm-spin { to { transform: rotate(360deg); } }
  .tm-spin { width:24px; height:24px; border:2px solid rgba(99,102,241,.2); border-top-color:var(--ac); border-radius:50%; animation:tm-spin .8s linear infinite; }
`

export default function TabMessages({ lead, session }) {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [adminTyping, setAdminTyping] = useState(false)
  const [loading, setLoading] = useState(true)
  const endRef = useRef(null)
  const typingTimer = useRef(null)
  const msgChannelRef = useRef(null)
  const typingChannelRef = useRef(null)

  const scrollToEnd = useCallback((smooth = true) => {
    endRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'instant' })
  }, [])

  useEffect(() => {
    if (!lead?.id) { setLoading(false); return }

    // Initial load
    supabase
      .from('messages')
      .select('id, sender, text, is_read, created_at')
      .eq('lead_id', lead.id)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) setMessages(data)
        setLoading(false)
        setTimeout(() => scrollToEnd(false), 80)
      })

    // Mark admin messages as read
    supabase
      .from('messages')
      .update({ is_read: true })
      .eq('lead_id', lead.id)
      .eq('sender', 'admin')
      .then(() => {})

    // Realtime: new messages
    msgChannelRef.current = supabase
      .channel(`cl-msgs-${lead.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `lead_id=eq.${lead.id}` },
        ({ new: msg }) => {
          setMessages(prev => {
            // Deduplicate (optimistic update may have added it)
            if (prev.find(m => m.id === msg.id)) return prev
            return [...prev, msg]
          })
          if (msg.sender === 'admin') WalaupSound.receive()
          // Mark as read immediately since tab is open
          if (msg.sender === 'admin') {
            supabase.from('messages').update({ is_read: true }).eq('id', msg.id).then(() => {})
          }
          setTimeout(() => scrollToEnd(true), 50)
        }
      )
      .subscribe()

    // Realtime: typing state on lead doc
    typingChannelRef.current = supabase
      .channel(`cl-typing-${lead.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'leads', filter: `id=eq.${lead.id}` },
        ({ new: data }) => {
          setAdminTyping(!!data.admin_typing)
          if (data.admin_typing) setTimeout(() => scrollToEnd(true), 50)
        }
      )
      .subscribe()

    return () => {
      if (msgChannelRef.current) supabase.removeChannel(msgChannelRef.current)
      if (typingChannelRef.current) supabase.removeChannel(typingChannelRef.current)
      clearTimeout(typingTimer.current)
      // Clear client typing on unmount
      supabase.from('leads').update({ client_typing: false }).eq('id', lead.id).then(() => {})
    }
  }, [lead?.id, scrollToEnd])

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

  async function sendMsg(e) {
    e?.preventDefault()
    const t = text.trim()
    if (!t || !lead?.id || sending) return
    if (t.length > MAX_MSG_LENGTH) return

    setSending(true)
    WalaupSound.send()
    setText('')
    clearTimeout(typingTimer.current)
    supabase.from('leads').update({ client_typing: false }).eq('id', lead.id).then(() => {})

    try {
      await supabase.from('messages').insert({
        lead_id: lead.id,
        sender: 'client',
        text: t,
        is_read: false,
      })
    } catch (err) {
      console.error('[TabMessages] send failed', err)
    } finally {
      setSending(false)
    }
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMsg()
    }
  }

  if (!lead) {
    return (
      <>
        <style>{CSS}</style>
        <div className="tm-root">
          <div className="tm-center">
            <span style={{ fontSize: 32 }}>💬</span>
            <p style={{ fontSize: 13 }}>Aucun projet actif — créez votre demande d&apos;abord.</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <style>{CSS}</style>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 800, color: 'var(--tx)', marginBottom: 16 }}>
        Messages
      </h2>
      <div className="tm-root">
        <div className="tm-msgs">
          {loading && (
            <div className="tm-center"><div className="tm-spin" /></div>
          )}
          {!loading && messages.length === 0 && (
            <div className="tm-center">
              <span style={{ fontSize: 28 }}>✉️</span>
              <p style={{ fontSize: 13, lineHeight: 1.6 }}>Commencez la conversation avec l&apos;équipe Walaup.<br />Nous répondons en moins de 24h.</p>
            </div>
          )}
          {messages.map(msg => (
            <div key={msg.id} className={`tm-row tm-row--${msg.sender}`}>
              {msg.sender === 'admin' && <span className="tm-sender">Walaup</span>}
              <div className={`tm-bubble tm-bubble--${msg.sender}`}>{msg.text}</div>
              <span className="tm-ts">{formatTime(msg.created_at)}</span>
            </div>
          ))}
          {adminTyping && (
            <div className="tm-row tm-row--admin">
              <span className="tm-sender">Walaup écrit...</span>
              <div className="tm-typing">
                <div className="tm-dot" />
                <div className="tm-dot" />
                <div className="tm-dot" />
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <form className="tm-compose" onSubmit={sendMsg}>
          <textarea
            className="tm-textarea"
            rows={1}
            placeholder="Votre message... (Entrée pour envoyer)"
            value={text}
            onChange={onInput}
            onKeyDown={onKeyDown}
            maxLength={MAX_MSG_LENGTH}
            disabled={sending}
          />
          <button
            type="submit"
            className="tm-send"
            disabled={!text.trim() || sending}
            aria-label="Envoyer le message"
          >
            <Send size={16} color="#fff" strokeWidth={2.2} />
          </button>
        </form>
      </div>
    </>
  )
}
