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
  .tv { position:fixed; inset:0; background:#050A12; display:flex; flex-direction:column; overflow:hidden; }
  .tv-hdr { position:absolute; top:0; left:0; right:0; z-index:50; height:52px;
    display:flex; align-items:center; padding:0 16px; gap:10px;
    background:linear-gradient(to bottom,rgba(0,0,0,.8),transparent); }
  .tv-logo { font-family:var(--font-display); font-weight:800; font-size:.88rem;
    background:linear-gradient(135deg,#0EA5E9,#38BDF8);
    -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
  .tv-room { font-size:.68rem; color:rgba(255,255,255,.3); font-family:monospace; }
  .tv-sep { flex:1; }
  .tv-pill { display:flex; align-items:center; gap:5px; padding:3px 10px; border-radius:20px;
    font-size:.68rem; font-weight:700; background:rgba(0,0,0,.6);
    border:1px solid rgba(255,255,255,.1); color:white; }
  .tv-dot { width:7px; height:7px; border-radius:50%; }
  .tv-dot.w { background:rgba(255,255,255,.3); }
  .tv-dot.c { background:#FCD34D; animation:tvblink 1s infinite; }
  .tv-dot.l { background:#34D399; box-shadow:0 0 8px #34D399; }
  @keyframes tvblink { 0%,100%{opacity:1}50%{opacity:.2} }

  /* Videos */
  .tv-videos { flex:1; position:relative; background:#0A0A14; }
  video.tv-remote { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }
  .tv-remote-off { position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
    flex-direction:column; gap:14px; color:rgba(255,255,255,.25); }
  .tv-remote-avatar { width:90px; height:90px; border-radius:50%;
    background:linear-gradient(135deg,rgba(14,165,233,.3),rgba(56,189,248,.1));
    display:flex; align-items:center; justify-content:center;
    border:2px solid rgba(14,165,233,.2); }
  .tv-remote-name { font-size:.88rem; font-weight:600; color:rgba(255,255,255,.4); }

  /* Local PiP */
  .tv-local { position:absolute; bottom:90px; right:14px; width:160px; height:118px;
    border-radius:14px; overflow:hidden; border:2px solid rgba(255,255,255,.15);
    box-shadow:0 4px 24px rgba(0,0,0,.8); z-index:20; background:#111; }
  video.tv-local-v { width:100%; height:100%; object-fit:cover; transform:scaleX(-1); }
  .tv-cam-off { position:absolute; inset:0; background:#111; display:flex;
    align-items:center; justify-content:center; color:rgba(255,255,255,.2); font-size:.7rem; }
  .tv-pip-label { position:absolute; bottom:5px; left:8px; font-size:.58rem;
    color:rgba(255,255,255,.6); font-weight:600; text-shadow:0 1px 3px rgba(0,0,0,.9); }

  /* Waiting screen */
  .tv-waiting { position:absolute; inset:0; display:flex; flex-direction:column;
    align-items:center; justify-content:center; gap:20px; padding:20px; }
  .tv-waiting-icon { width:80px; height:80px; border-radius:50%;
    background:rgba(14,165,233,.12); display:flex; align-items:center; justify-content:center;
    border:2px solid rgba(14,165,233,.25); animation:tvpulse 2s infinite; }
  @keyframes tvpulse { 0%,100%{opacity:.7;transform:scale(1)}50%{opacity:1;transform:scale(1.04)} }
  .tv-waiting-title { color:rgba(255,255,255,.8); font-size:.95rem; font-weight:700; }
  .tv-waiting-sub { color:rgba(255,255,255,.3); font-size:.78rem; }
  .tv-link-box { background:rgba(14,165,233,.07); border:1px solid rgba(14,165,233,.2);
    border-radius:12px; padding:12px 16px; max-width:380px; width:100%; text-align:center; }
  .tv-link-url { font-size:.7rem; color:rgba(255,255,255,.4); word-break:break-all; margin-bottom:10px; font-family:monospace; }
  .tv-copy { display:flex; align-items:center; gap:6px; margin:0 auto; padding:7px 18px;
    border-radius:9px; background:rgba(14,165,233,.15); border:1px solid rgba(14,165,233,.35);
    color:#38BDF8; font-size:.78rem; font-weight:700; cursor:pointer; transition:all .15s;
    width:fit-content; }
  .tv-copy:hover { background:rgba(14,165,233,.28); }
  .tv-copy.ok { background:rgba(16,185,129,.15); border-color:rgba(16,185,129,.35); color:#34D399; }

  /* Controls */
  .tv-ctrl-bar { position:absolute; bottom:0; left:0; right:0; z-index:30;
    padding:14px 20px; display:flex; align-items:center; justify-content:center; gap:12px;
    background:linear-gradient(to top,rgba(0,0,0,.85) 60%,transparent); }
  .tv-btn { width:52px; height:52px; border-radius:50%; border:none; cursor:pointer;
    display:flex; align-items:center; justify-content:center; transition:all .2s; }
  .tv-btn.on  { background:rgba(255,255,255,.15); color:white; }
  .tv-btn.on:hover  { background:rgba(255,255,255,.28); transform:scale(1.08); }
  .tv-btn.off { background:rgba(248,113,113,.2); color:#F87171; border:1px solid rgba(248,113,113,.3); }
  .tv-btn.off:hover { background:rgba(248,113,113,.35); }
  .tv-btn.end { background:#DC2626; color:white; width:58px; height:58px; }
  .tv-btn.end:hover { background:#B91C1C; transform:scale(1.1); }

  /* Debug */
  .tv-debug { position:absolute; top:60px; left:12px; font-size:.62rem; font-family:monospace;
    color:rgba(255,255,255,.25); z-index:40; pointer-events:none; max-width:280px; }

  /* Toast */
  .tv-toast { position:absolute; top:60px; left:50%; transform:translateX(-50%);
    padding:8px 16px; border-radius:10px; background:rgba(16,185,129,.9); color:white;
    font-size:.78rem; font-weight:700; z-index:9999; animation:tvslide .2s; white-space:nowrap; }
  @keyframes tvslide { from{opacity:0;transform:translateX(-50%) translateY(-8px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
`

// ── Peer ID unique par session ──────────────────────────────────────────────
function makePeerId() {
  return Math.random().toString(36).slice(2, 10)
}

function TelemedecineInner() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const roomId       = searchParams.get('room') || 'default'

  const [status,  setStatus]  = useState('waiting') // waiting | connecting | connected
  const [micOn,   setMicOn]   = useState(true)
  const [camOn,   setCamOn]   = useState(true)
  const [copied,  setCopied]  = useState(false)
  const [toast,   setToast]   = useState('')
  const [remoteName, setRemoteName] = useState('')
  const [debugLog,   setDebugLog]   = useState([])
  const [peersCount, setPeersCount] = useState(1)

  const localRef   = useRef(null)
  const remoteRef  = useRef(null)
  const pcRef      = useRef(null)
  const streamRef  = useRef(null)
  const channelRef = useRef(null)
  const myPeerId   = useRef(makePeerId())
  const isCaller   = useRef(false)
  const pendingCandidates = useRef([])

  const log = useCallback((msg) => {
    console.log('[WebRTC]', msg)
    setDebugLog(d => [...d.slice(-6), msg])
  }, [])

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  // ── Initialiser WebRTC ───────────────────────────────────────────────────
  const initWebRTC = useCallback(async () => {
    log('Getting user media...')
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    streamRef.current = stream
    if (localRef.current) {
      localRef.current.srcObject = stream
      localRef.current.play().catch(() => {})
    }

    const pc = new RTCPeerConnection(ICE)
    pcRef.current = pc

    // Ajouter les tracks locaux
    stream.getTracks().forEach(track => {
      pc.addTrack(track, stream)
      log(`Added track: ${track.kind}`)
    })

    // Recevoir les tracks distants
    pc.ontrack = (e) => {
      log(`Remote track received: ${e.track.kind}`)
      if (remoteRef.current && e.streams[0]) {
        remoteRef.current.srcObject = e.streams[0]
        remoteRef.current.play().catch(() => {})
        setStatus('connected')
        showToast('Connexion établie ✓')
      }
    }

    // ICE candidates
    pc.onicecandidate = (e) => {
      if (e.candidate) {
        log(`ICE candidate: ${e.candidate.type}`)
        channelRef.current?.send({
          type: 'broadcast',
          event: 'ice',
          payload: { from: myPeerId.current, candidate: e.candidate }
        })
      }
    }

    pc.oniceconnectionstatechange = () => {
      log(`ICE state: ${pc.iceConnectionState}`)
      if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
        setStatus('connected')
      }
      if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
        setStatus('waiting')
        log('Connection lost, resetting...')
      }
    }

    pc.onnegotiationneeded = () => {
      log('Negotiation needed')
    }

    return pc
  }, [log])

  // ── Créer l'offre (caller) ──────────────────────────────────────────────
  const createOffer = useCallback(async (pc) => {
    log('Creating offer...')
    isCaller.current = true
    setStatus('connecting')
    const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true })
    await pc.setLocalDescription(offer)
    log('Local description set (offer)')
    channelRef.current?.send({
      type: 'broadcast',
      event: 'offer',
      payload: { from: myPeerId.current, sdp: offer }
    })
  }, [log])

  // ── Répondre à l'offre (callee) ─────────────────────────────────────────
  const handleOffer = useCallback(async (sdp, fromId) => {
    if (!pcRef.current) return
    log(`Received offer from ${fromId}`)
    setStatus('connecting')
    await pcRef.current.setRemoteDescription(new RTCSessionDescription(sdp))

    // Ajouter les candidats en attente
    for (const c of pendingCandidates.current) {
      await pcRef.current.addIceCandidate(new RTCIceCandidate(c))
      log('Added pending ICE candidate')
    }
    pendingCandidates.current = []

    const answer = await pcRef.current.createAnswer()
    await pcRef.current.setLocalDescription(answer)
    log('Local description set (answer)')
    channelRef.current?.send({
      type: 'broadcast',
      event: 'answer',
      payload: { from: myPeerId.current, to: fromId, sdp: answer }
    })
  }, [log])

  // ── Recevoir la réponse ──────────────────────────────────────────────────
  const handleAnswer = useCallback(async (sdp) => {
    if (!pcRef.current) return
    log('Received answer')
    await pcRef.current.setRemoteDescription(new RTCSessionDescription(sdp))
  }, [log])

  // ── Recevoir ICE candidate ───────────────────────────────────────────────
  const handleIce = useCallback(async (candidate) => {
    if (!pcRef.current) return
    if (!pcRef.current.remoteDescription) {
      pendingCandidates.current.push(candidate)
      log('ICE candidate queued (no remote desc yet)')
      return
    }
    try {
      await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate))
      log('ICE candidate added')
    } catch (e) {
      log(`ICE error: ${e.message}`)
    }
  }, [log])

  // ── Main setup ───────────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true

    async function start() {
      try {
        const pc = await initWebRTC()
        if (!mounted) return

        // Channel Supabase Realtime — Broadcast (pas de DB, P2P via serveur Supabase)
        const channel = supabase.channel(`medilink_room_${roomId}`, {
          config: { broadcast: { self: false } }
        })
        channelRef.current = channel

        // Écouter les messages de signalisation
        channel
          .on('broadcast', { event: 'join' }, ({ payload }) => {
            if (payload.peerId === myPeerId.current) return
            log(`Peer joined: ${payload.peerId}`)
            setRemoteName(payload.name || 'Participant')
            setPeersCount(2)
            // Je suis le premier → je crée l'offre
            if (!isCaller.current && !pcRef.current?.remoteDescription) {
              createOffer(pc)
            }
          })
          .on('broadcast', { event: 'offer' }, ({ payload }) => {
            if (payload.from === myPeerId.current) return
            handleOffer(payload.sdp, payload.from)
          })
          .on('broadcast', { event: 'answer' }, ({ payload }) => {
            if (payload.from === myPeerId.current) return
            if (payload.to && payload.to !== myPeerId.current) return
            handleAnswer(payload.sdp)
          })
          .on('broadcast', { event: 'ice' }, ({ payload }) => {
            if (payload.from === myPeerId.current) return
            handleIce(payload.candidate)
          })
          .on('broadcast', { event: 'leave' }, ({ payload }) => {
            if (payload.from === myPeerId.current) return
            log('Peer left')
            setStatus('waiting')
            setRemoteName('')
            setPeersCount(1)
            if (remoteRef.current) remoteRef.current.srcObject = null
          })
          .on('presence', { event: 'sync' }, () => {
            const state = channel.presenceState()
            const count = Object.keys(state).length
            setPeersCount(count)
            log(`Presence: ${count} peer(s)`)
          })
          .on('presence', { event: 'join' }, ({ newPresences }) => {
            const other = newPresences.filter(p => p.peer_id !== myPeerId.current)
            if (other.length > 0) {
              log(`Presence join: ${other[0].peer_id}`)
              setRemoteName(other[0].name || 'Participant')
              // Délai pour laisser le channel se stabiliser
              setTimeout(() => {
                if (!pcRef.current?.remoteDescription) {
                  createOffer(pcRef.current)
                }
              }, 500)
            }
          })
          .on('presence', { event: 'leave' }, () => {
            setStatus('waiting')
            setRemoteName('')
            if (remoteRef.current) remoteRef.current.srcObject = null
          })
          .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
              log('Channel subscribed, tracking presence...')
              // Track ma présence
              await channel.track({
                peer_id: myPeerId.current,
                name: 'Médecin',
                joined_at: Date.now(),
              })
              // Annoncer mon arrivée
              channel.send({
                type: 'broadcast',
                event: 'join',
                payload: { peerId: myPeerId.current, name: 'Médecin' }
              })
            }
          })

      } catch (err) {
        log(`Error: ${err.message}`)
        console.error(err)
      }
    }

    start()

    return () => {
      mounted = false
      // Annoncer le départ
      channelRef.current?.send({
        type: 'broadcast',
        event: 'leave',
        payload: { from: myPeerId.current }
      })
      channelRef.current?.unsubscribe()
      if (pcRef.current) { pcRef.current.close(); pcRef.current = null }
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
    }
  }, [roomId, initWebRTC, createOffer, handleOffer, handleAnswer, handleIce, log])

  // ── Controls ─────────────────────────────────────────────────────────────
  function toggleMic() {
    streamRef.current?.getAudioTracks().forEach(t => { t.enabled = !micOn })
    setMicOn(m => !m)
  }

  function toggleCam() {
    streamRef.current?.getVideoTracks().forEach(t => { t.enabled = !camOn })
    setCamOn(c => !c)
  }

  function endCall() {
    channelRef.current?.send({
      type: 'broadcast', event: 'leave',
      payload: { from: myPeerId.current }
    })
    channelRef.current?.unsubscribe()
    if (pcRef.current) { pcRef.current.close(); pcRef.current = null }
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
    router.push('/apps/medical/doctor')
  }

  function copyLink() {
    const url = window.location.href
    navigator.clipboard.writeText(url)
    setCopied(true)
    showToast('Lien copié !')
    setTimeout(() => setCopied(false), 3000)
  }

  const joinUrl  = typeof window !== 'undefined' ? window.location.href : ''
  const statusLabel = { waiting:'En attente', connecting:'Connexion…', connected:'En ligne' }
  const statusCls   = { waiting:'w', connecting:'c', connected:'l' }

  return (
    <>
      <style>{CSS}</style>
      <div className="tv">
        {/* Header */}
        <div className="tv-hdr">
          <span className="tv-logo">MediLink OS</span>
          <span className="tv-room">#{roomId.slice(-8).toUpperCase()}</span>
          <span className="tv-sep"/>
          <div className="tv-pill">
            <div className={`tv-dot ${statusCls[status]}`}/>
            <span>{statusLabel[status]}</span>
            {peersCount > 1 && <span style={{ marginLeft:4, color:'rgba(255,255,255,.4)' }}>· {peersCount}</span>}
          </div>
        </div>

        {/* Videos */}
        <div className="tv-videos">
          {/* Vidéo distante */}
          {status === 'connected' ? (
            <video
              ref={remoteRef}
              className="tv-remote"
              autoPlay
              playsInline
              style={{ display: status === 'connected' ? 'block' : 'none' }}
            />
          ) : (
            <div className="tv-remote-off">
              <div className="tv-remote-avatar">
                <Users size={32} color="rgba(56,189,248,.5)"/>
              </div>
              <div className="tv-waiting-title">
                {status === 'connecting' ? 'Connexion en cours…' : 'Salle ouverte — en attente'}
              </div>
              <div style={{ color:'rgba(255,255,255,.3)', fontSize:'.78rem' }}>
                Partagez le lien pour inviter un participant
              </div>
              <div className="tv-link-box">
                <div className="tv-link-url">{joinUrl}</div>
                <div className={`tv-copy ${copied?'ok':''}`} onClick={copyLink}>
                  {copied ? <><CheckCircle2 size={13}/> Copié !</> : <><Copy size={13}/> Copier le lien</>}
                </div>
              </div>
            </div>
          )}

          {/* Vidéo locale PiP — toujours visible */}
          <div className="tv-local">
            {camOn
              ? <video ref={localRef} className="tv-local-v" autoPlay playsInline muted/>
              : <div className="tv-cam-off"><VideoOff size={20}/></div>}
            <div className="tv-pip-label">Vous</div>
          </div>

          {/* Debug log discret */}
          {debugLog.length > 0 && (
            <div className="tv-debug">
              {debugLog.slice(-4).map((l, i) => <div key={i}>▸ {l}</div>)}
            </div>
          )}

          {/* Controls */}
          <div className="tv-ctrl-bar">
            <button className={`tv-btn ${micOn?'on':'off'}`} onClick={toggleMic} title={micOn?'Couper micro':'Activer micro'}>
              {micOn ? <Mic size={20}/> : <MicOff size={20}/>}
            </button>
            <button className="tv-btn end" onClick={endCall} title="Raccrocher">
              <PhoneOff size={22}/>
            </button>
            <button className={`tv-btn ${camOn?'on':'off'}`} onClick={toggleCam} title={camOn?'Couper caméra':'Activer caméra'}>
              {camOn ? <Video size={20}/> : <VideoOff size={20}/>}
            </button>
          </div>
        </div>

        {/* Toast */}
        {toast && <div className="tv-toast">{toast}</div>}
      </div>
    </>
  )
}

export default function Telemedicine() {
  return (
    <Suspense fallback={
      <div style={{ background:'#050A12', height:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ color:'rgba(56,189,248,.5)', fontSize:'.85rem' }}>Connexion à la salle…</div>
      </div>
    }>
      <TelemedecineInner/>
    </Suspense>
  )
}
