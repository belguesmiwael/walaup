'use client'
import { useState, useEffect, useRef, Suspense, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Video, VideoOff, Mic, MicOff, PhoneOff, Copy, Users, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const ICE = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' },
  ]
}

const CSS = `
  .tv{position:fixed;inset:0;background:#050A12;display:flex;flex-direction:column;overflow:hidden}
  .tv-hdr{position:absolute;top:0;left:0;right:0;z-index:50;height:52px;display:flex;align-items:center;padding:0 16px;gap:10px;background:linear-gradient(to bottom,rgba(0,0,0,.8),transparent)}
  .tv-logo{font-family:var(--font-display);font-weight:800;font-size:.88rem;background:linear-gradient(135deg,#0EA5E9,#38BDF8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
  .tv-room{font-size:.68rem;color:rgba(255,255,255,.3);font-family:monospace}
  .tv-sep{flex:1}
  .tv-pill{display:flex;align-items:center;gap:5px;padding:3px 10px;border-radius:20px;font-size:.68rem;font-weight:700;background:rgba(0,0,0,.6);border:1px solid rgba(255,255,255,.1);color:white}
  .tv-dot{width:7px;height:7px;border-radius:50%}
  .tv-dot.w{background:rgba(255,255,255,.3)}
  .tv-dot.c{background:#FCD34D;animation:tvblink 1s infinite}
  .tv-dot.l{background:#34D399;box-shadow:0 0 8px #34D399}
  @keyframes tvblink{0%,100%{opacity:1}50%{opacity:.2}}
  .tv-videos{flex:1;position:relative;background:#0A0A14}
  /* Remote video — TOUJOURS dans le DOM, juste caché */
  video.tv-remote{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:opacity .4s}
  video.tv-remote.hidden{opacity:0;pointer-events:none}
  .tv-waiting{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;padding:20px;transition:opacity .4s}
  .tv-waiting.hidden{opacity:0;pointer-events:none}
  .tv-wait-icon{width:80px;height:80px;border-radius:50%;background:rgba(14,165,233,.1);display:flex;align-items:center;justify-content:center;border:2px solid rgba(14,165,233,.2);animation:tvpulse 2s infinite}
  @keyframes tvpulse{0%,100%{transform:scale(1);opacity:.7}50%{transform:scale(1.05);opacity:1}}
  .tv-wait-title{color:rgba(255,255,255,.8);font-size:.95rem;font-weight:700}
  .tv-wait-sub{color:rgba(255,255,255,.3);font-size:.75rem}
  .tv-link-box{background:rgba(14,165,233,.07);border:1px solid rgba(14,165,233,.2);border-radius:12px;padding:12px 16px;max-width:380px;width:100%;text-align:center}
  .tv-link-url{font-size:.68rem;color:rgba(255,255,255,.35);word-break:break-all;margin-bottom:10px;font-family:monospace}
  .tv-copy-btn{display:flex;align-items:center;gap:6px;margin:0 auto;padding:7px 18px;border-radius:9px;background:rgba(14,165,233,.15);border:1px solid rgba(14,165,233,.35);color:#38BDF8;font-size:.78rem;font-weight:700;cursor:pointer;transition:all .15s;width:fit-content}
  .tv-copy-btn:hover{background:rgba(14,165,233,.28)}
  .tv-copy-btn.ok{background:rgba(16,185,129,.15);border-color:rgba(16,185,129,.35);color:#34D399}
  /* Local PiP */
  .tv-local{position:absolute;bottom:90px;right:14px;width:160px;height:118px;border-radius:14px;overflow:hidden;border:2px solid rgba(255,255,255,.15);box-shadow:0 4px 24px rgba(0,0,0,.8);z-index:20;background:#111}
  video.tv-local-v{width:100%;height:100%;object-fit:cover;transform:scaleX(-1)}
  .tv-cam-off{position:absolute;inset:0;background:#111;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:4px;color:rgba(255,255,255,.2);font-size:.65rem}
  .tv-pip-label{position:absolute;bottom:5px;left:8px;font-size:.58rem;color:rgba(255,255,255,.6);font-weight:600;text-shadow:0 1px 3px rgba(0,0,0,.9)}
  /* Controls */
  .tv-ctrl-bar{position:absolute;bottom:0;left:0;right:0;z-index:30;padding:14px 20px;display:flex;align-items:center;justify-content:center;gap:12px;background:linear-gradient(to top,rgba(0,0,0,.85) 60%,transparent)}
  .tv-btn{width:52px;height:52px;border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s}
  .tv-btn.on{background:rgba(255,255,255,.15);color:white}
  .tv-btn.on:hover{background:rgba(255,255,255,.28);transform:scale(1.08)}
  .tv-btn.off{background:rgba(248,113,113,.2);color:#F87171;border:1px solid rgba(248,113,113,.3)}
  .tv-btn.end{background:#DC2626;color:white;width:58px;height:58px}
  .tv-btn.end:hover{background:#B91C1C;transform:scale(1.1)}
  .tv-debug{position:absolute;top:58px;left:12px;font-size:.58rem;font-family:monospace;color:rgba(255,255,255,.2);z-index:40;pointer-events:none;line-height:1.5}
  .tv-toast{position:absolute;top:60px;left:50%;transform:translateX(-50%);padding:8px 16px;border-radius:10px;background:rgba(16,185,129,.9);color:white;font-size:.78rem;font-weight:700;z-index:9999;white-space:nowrap;animation:tvslide .2s}
  @keyframes tvslide{from{opacity:0;transform:translateX(-50%) translateY(-8px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
`

function uid() { return Math.random().toString(36).slice(2,10) }

function Inner() {
  const router       = useRouter()
  const sp           = useSearchParams()
  const roomId       = sp.get('room') || 'default'
  const myId         = useRef(uid())

  const [status,  setStatus]  = useState('waiting')
  const [micOn,   setMicOn]   = useState(true)
  const [camOn,   setCamOn]   = useState(true)
  const [copied,  setCopied]  = useState(false)
  const [toast,   setToast]   = useState('')
  const [dbg,     setDbg]     = useState([])

  // CRITIQUE: les deux video refs DOIVENT toujours être dans le DOM
  const localRef  = useRef(null)
  const remoteRef = useRef(null)
  const pcRef     = useRef(null)
  const streamRef = useRef(null)
  const chanRef   = useRef(null)
  const pendingIce = useRef([])

  function log(msg) {
    console.log('[TV]', msg)
    setDbg(d => [...d.slice(-5), msg])
  }

  function toast2(msg) { setToast(msg); setTimeout(()=>setToast(''),3000) }

  // ── Setup media + PeerConnection ──────────────────────────────────────────
  async function setupPeer() {
    log('getUserMedia...')
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width:1280, height:720, facingMode:'user' },
      audio: { echoCancellation:true, noiseSuppression:true, sampleRate:44100 }
    })
    streamRef.current = stream

    // Local video — mirroir
    if (localRef.current) {
      localRef.current.srcObject = stream
      await localRef.current.play().catch(()=>{})
    }
    log(`Local stream: ${stream.getVideoTracks().length}v ${stream.getAudioTracks().length}a`)

    const pc = new RTCPeerConnection(ICE)
    pcRef.current = pc

    // Ajouter TOUS les tracks locaux
    stream.getTracks().forEach(t => {
      pc.addTrack(t, stream)
      log(`Track added: ${t.kind} enabled=${t.enabled}`)
    })

    // CRITIQUE: ontrack — assigner immédiatement au remoteRef
    pc.ontrack = (ev) => {
      log(`ontrack: ${ev.track.kind} streams=${ev.streams.length}`)
      if (ev.streams && ev.streams[0] && remoteRef.current) {
        // Ne pas recréer le stream si déjà assigné
        if (remoteRef.current.srcObject !== ev.streams[0]) {
          remoteRef.current.srcObject = ev.streams[0]
          remoteRef.current.play().catch(e => log(`play err: ${e.message}`))
        }
        setStatus('connected')
        toast2('Connexion établie ✓')
      }
    }

    pc.onicecandidate = (ev) => {
      if (!ev.candidate) return
      log(`ICE: ${ev.candidate.type} ${ev.candidate.protocol}`)
      chanRef.current?.send({
        type:'broadcast', event:'ice',
        payload:{ from:myId.current, candidate:ev.candidate.toJSON() }
      })
    }

    pc.oniceconnectionstatechange = () => {
      log(`ICE state: ${pc.iceConnectionState}`)
      if (['disconnected','failed','closed'].includes(pc.iceConnectionState)) {
        setStatus('waiting')
        if (remoteRef.current) remoteRef.current.srcObject = null
      }
    }

    pc.onconnectionstatechange = () => {
      log(`Conn state: ${pc.connectionState}`)
    }

    return pc
  }

  // ── Signalisation ─────────────────────────────────────────────────────────
  async function sendOffer(pc) {
    log('Creating offer...')
    setStatus('connecting')
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    chanRef.current?.send({
      type:'broadcast', event:'offer',
      payload:{ from:myId.current, sdp:{ type:offer.type, sdp:offer.sdp } }
    })
    log('Offer sent')
  }

  async function handleOffer(payload) {
    const pc = pcRef.current
    if (!pc) return
    log(`Offer received from ${payload.from} — state: ${pc.signalingState}`)
    // Ignorer si déjà en train de négocier
    if (pc.signalingState !== 'stable') {
      log(`Ignoring offer in state: ${pc.signalingState}`)
      return
    }
    setStatus('connecting')
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp))
    } catch(e) {
      log(`setRemoteDescription error: ${e.message}`)
      return
    }

    // Flush pending ICE
    for (const c of pendingIce.current) {
      try { await pc.addIceCandidate(new RTCIceCandidate(c)) } catch {}
    }
    pendingIce.current = []

    const answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)
    chanRef.current?.send({
      type:'broadcast', event:'answer',
      payload:{ from:myId.current, to:payload.from, sdp:{ type:answer.type, sdp:answer.sdp } }
    })
    log('Answer sent')
  }

  async function handleAnswer(payload) {
    const pc = pcRef.current
    if (!pc) return
    log(`Answer received — signalingState: ${pc.signalingState}`)
    // Accepter seulement si on attend une réponse
    if (pc.signalingState !== 'have-local-offer') {
      log(`Ignoring answer in state: ${pc.signalingState}`)
      return
    }
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp))
      log('Remote description set (answer)')
    } catch(e) {
      log(`setRemoteDescription error: ${e.message}`)
    }
  }

  async function handleIce(payload) {
    const pc = pcRef.current
    if (!pc) return
    if (!pc.remoteDescription) {
      pendingIce.current.push(payload.candidate)
      log('ICE queued')
      return
    }
    try {
      await pc.addIceCandidate(new RTCIceCandidate(payload.candidate))
      log('ICE added')
    } catch(e) { log(`ICE err: ${e.message}`) }
  }

  // ── Main effect ───────────────────────────────────────────────────────────
  useEffect(() => {
    let pc = null

    async function main() {
      pc = await setupPeer()

      const ch = supabase.channel(`ml_tv_${roomId}`, {
        config:{ broadcast:{ self:false }, presence:{ key: myId.current } }
      })
      chanRef.current = ch

      ch
        .on('broadcast', { event:'offer' }, ({ payload }) => {
          if (payload.from === myId.current) return
          handleOffer(payload)
        })
        .on('broadcast', { event:'answer' }, ({ payload }) => {
          if (payload.from === myId.current) return
          if (payload.to !== myId.current) return
          handleAnswer(payload)
        })
        .on('broadcast', { event:'ice' }, ({ payload }) => {
          if (payload.from === myId.current) return
          handleIce(payload)
        })
        .on('presence', { event:'join' }, ({ newPresences }) => {
          const others = newPresences.filter(p => p.key !== myId.current)
          if (others.length === 0) return
          log(`Peer joined: ${others[0].key}`)
          // Attendre un tick puis envoyer l'offre
          setTimeout(() => sendOffer(pc), 600)
        })
        .on('presence', { event:'leave' }, () => {
          log('Peer left')
          setStatus('waiting')
          if (remoteRef.current) remoteRef.current.srcObject = null
        })
        .subscribe(async (s) => {
          if (s === 'SUBSCRIBED') {
            log('Subscribed — tracking...')
            await ch.track({ key: myId.current, ts: Date.now() })
          }
        })
    }

    main().catch(e => log(`FATAL: ${e.message}`))

    return () => {
      ch?.unsubscribe?.()
      chanRef.current?.unsubscribe?.()
      if (pc) { pc.close(); pcRef.current = null }
      if (streamRef.current) streamRef.current.getTracks().forEach(t=>t.stop())
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId])

  function toggleMic() {
    streamRef.current?.getAudioTracks().forEach(t=>{ t.enabled = !micOn })
    setMicOn(m=>!m)
  }
  function toggleCam() {
    streamRef.current?.getVideoTracks().forEach(t=>{ t.enabled = !camOn })
    setCamOn(c=>!c)
  }
  function endCall() {
    chanRef.current?.unsubscribe()
    if (pcRef.current) { pcRef.current.close(); pcRef.current=null }
    if (streamRef.current) streamRef.current.getTracks().forEach(t=>t.stop())
    router.push('/apps/medical/doctor')
  }
  function copyLink() {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true); toast2('Lien copié !'); setTimeout(()=>setCopied(false),3000)
  }

  const statusCls = { waiting:'w', connecting:'c', connected:'l' }
  const statusLbl = { waiting:'En attente', connecting:'Connexion…', connected:'En ligne' }

  return (
    <>
      <style>{CSS}</style>
      <div className="tv">
        <div className="tv-hdr">
          <span className="tv-logo">MediLink OS</span>
          <span className="tv-room">#{roomId.toUpperCase().slice(-8)}</span>
          <span className="tv-sep"/>
          <div className="tv-pill">
            <div className={`tv-dot ${statusCls[status]}`}/>
            <span>{statusLbl[status]}</span>
          </div>
        </div>

        <div className="tv-videos">
          {/* ── Remote video TOUJOURS dans le DOM ── */}
          <video
            ref={remoteRef}
            className={`tv-remote ${status !== 'connected' ? 'hidden' : ''}`}
            autoPlay playsInline
          />

          {/* Écran d'attente — visible seulement si pas connecté */}
          <div className={`tv-waiting ${status === 'connected' ? 'hidden' : ''}`}>
            <div className="tv-wait-icon"><Users size={32} color="rgba(56,189,248,.6)"/></div>
            <div className="tv-wait-title">
              {status === 'connecting' ? 'Connexion en cours…' : 'Salle ouverte'}
            </div>
            <div className="tv-wait-sub">Partagez le lien pour inviter votre patient</div>
            <div className="tv-link-box">
              <div className="tv-link-url">{typeof window !== 'undefined' ? window.location.href : ''}</div>
              <div className={`tv-copy-btn ${copied?'ok':''}`} onClick={copyLink}>
                {copied ? <><CheckCircle2 size={13}/> Copié !</> : <><Copy size={13}/> Copier le lien</>}
              </div>
            </div>
          </div>

          {/* ── Local PiP ── */}
          <div className="tv-local">
            {camOn
              ? <video ref={localRef} className="tv-local-v" autoPlay playsInline muted/>
              : <div className="tv-cam-off"><VideoOff size={18}/><span>Caméra off</span></div>}
            <div className="tv-pip-label">Vous</div>
          </div>

          {/* Debug */}
          <div className="tv-debug">{dbg.map((l,i)=><div key={i}>▸ {l}</div>)}</div>

          {/* Controls */}
          <div className="tv-ctrl-bar">
            <button className={`tv-btn ${micOn?'on':'off'}`} onClick={toggleMic}>
              {micOn ? <Mic size={20}/> : <MicOff size={20}/>}
            </button>
            <button className="tv-btn end" onClick={endCall}>
              <PhoneOff size={22}/>
            </button>
            <button className={`tv-btn ${camOn?'on':'off'}`} onClick={toggleCam}>
              {camOn ? <Video size={20}/> : <VideoOff size={20}/>}
            </button>
          </div>
        </div>

        {toast && <div className="tv-toast">{toast}</div>}
      </div>
    </>
  )
}

export default function Telemedicine() {
  return (
    <Suspense fallback={
      <div style={{background:'#050A12',height:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}>
        <div style={{color:'rgba(56,189,248,.5)',fontSize:'.85rem'}}>Connexion à la salle…</div>
      </div>
    }>
      <Inner/>
    </Suspense>
  )
}
