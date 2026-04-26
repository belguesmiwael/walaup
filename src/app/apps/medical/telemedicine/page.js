'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Video, VideoOff, Mic, MicOff, PhoneOff, Copy, Users, Loader } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const CSS = `
  .tv-root { position:fixed; inset:0; background:#0A0A0F; display:flex; flex-direction:column; overflow:hidden; }
  .tv-header { height:54px; display:flex; align-items:center; padding:0 20px; gap:12px; flex-shrink:0;
    background:rgba(0,0,0,.6); border-bottom:1px solid rgba(255,255,255,.08); backdrop-filter:blur(20px); z-index:100; }
  .tv-logo { font-family:var(--font-display); font-weight:800; font-size:.95rem;
    background:linear-gradient(135deg,#0EA5E9,#38BDF8); -webkit-background-clip:text;
    -webkit-text-fill-color:transparent; background-clip:text; }
  .tv-room { font-size:.72rem; color:rgba(255,255,255,.4); }
  .tv-status { display:flex; align-items:center; gap:6px; margin-left:auto;
    font-size:.75rem; font-weight:600; }
  .tv-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
  .tv-dot.connecting { background:var(--gold); animation:tvPulse 1.2s infinite; }
  .tv-dot.connected   { background:var(--green); }
  .tv-dot.waiting     { background:rgba(255,255,255,.3); }
  @keyframes tvPulse { 0%,100%{opacity:1}50%{opacity:.3} }

  /* ── Video grid ── */
  .tv-videos { flex:1; position:relative; overflow:hidden; }
  .tv-remote { width:100%; height:100%; object-fit:cover; background:#111; }
  .tv-local { position:absolute; bottom:80px; right:16px; width:160px; height:120px;
    border-radius:14px; overflow:hidden; border:2px solid rgba(255,255,255,.2);
    box-shadow:0 4px 20px rgba(0,0,0,.6); z-index:10; }
  .tv-local video { width:100%; height:100%; object-fit:cover; }
  .tv-waiting { width:100%; height:100%; display:flex; flex-direction:column;
    align-items:center; justify-content:center; gap:16px; }
  .tv-waiting-icon { width:80px; height:80px; border-radius:50%;
    background:rgba(14,165,233,.15); display:flex; align-items:center; justify-content:center;
    border:2px solid rgba(14,165,233,.3); animation:tvPulse 2s infinite; }
  .tv-waiting-text { color:rgba(255,255,255,.7); font-size:.9rem; font-weight:600; }
  .tv-waiting-sub { color:rgba(255,255,255,.35); font-size:.78rem; margin-top:4px; text-align:center; }
  .tv-link-box { background:rgba(14,165,233,.1); border:1px solid rgba(14,165,233,.25);
    border-radius:12px; padding:12px 16px; max-width:380px; text-align:center; }
  .tv-link-text { font-size:.75rem; color:rgba(255,255,255,.5); word-break:break-all; }
  .tv-copy-btn { display:flex; align-items:center; gap:6px; margin:10px auto 0;
    padding:7px 16px; border-radius:8px; background:rgba(14,165,233,.2); border:1px solid rgba(14,165,233,.4);
    color:#38BDF8; font-size:.78rem; font-weight:700; cursor:pointer; transition:all .15s; width:fit-content; }
  .tv-copy-btn:hover { background:rgba(14,165,233,.35); }

  /* ── Controls ── */
  .tv-controls { position:absolute; bottom:0; left:0; right:0;
    padding:16px; display:flex; align-items:center; justify-content:center; gap:12px;
    background:linear-gradient(to top,rgba(0,0,0,.8),transparent); z-index:20; }
  .tv-ctrl { width:52px; height:52px; border-radius:50%; border:none;
    display:flex; align-items:center; justify-content:center;
    cursor:pointer; transition:all .2s; }
  .tv-ctrl.mic  { background:rgba(255,255,255,.15); color:white; }
  .tv-ctrl.mic:hover  { background:rgba(255,255,255,.25); }
  .tv-ctrl.cam  { background:rgba(255,255,255,.15); color:white; }
  .tv-ctrl.cam:hover  { background:rgba(255,255,255,.25); }
  .tv-ctrl.end  { background:#DC2626; color:white; width:58px; height:58px; }
  .tv-ctrl.end:hover  { background:#B91C1C; transform:scale(1.08); }
  .tv-ctrl.off  { background:rgba(220,38,38,.2); color:#F87171; }
  .tv-toast { position:fixed; bottom:90px; left:50%; transform:translateX(-50%);
    padding:9px 18px; border-radius:10px; background:rgba(14,165,233,.9); color:white;
    font-size:.82rem; font-weight:600; z-index:9999; animation:tvFade .2s; pointer-events:none; }
  @keyframes tvFade { from{opacity:0;transform:translateX(-50%) translateY(8px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
`

const ICE = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ]
}

function TelemedecineInner() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const roomId       = searchParams.get('room') || 'default'

  const [user,       setUser]       = useState(null)
  const [status,     setStatus]     = useState('waiting') // waiting | connecting | connected
  const [micOn,      setMicOn]      = useState(true)
  const [camOn,      setCamOn]      = useState(true)
  const [toast,      setToast]      = useState('')
  const [copied,     setCopied]     = useState(false)

  const localRef   = useRef(null)
  const remoteRef  = useRef(null)
  const pcRef      = useRef(null)
  const streamRef  = useRef(null)
  const subsRef    = useRef([])

  const joinUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/apps/medical/telemedicine?room=${roomId}`
    : ''

  /* ── Auth ── */
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (!u) { router.push('/apps/medical/login'); return }
      setUser(u)
      startSession(u)
    })
    return () => cleanup()
  }, [])

  async function cleanup() {
    subsRef.current.forEach(s => s?.unsubscribe())
    if (pcRef.current) { pcRef.current.close(); pcRef.current = null }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()) }
    // Nettoyer signaling Supabase
    await supabase.from('med_signaling').delete().eq('room_id', roomId).eq('user_id', user?.id || '')
  }

  async function startSession(u) {
    try {
      // Obtenir stream local
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      streamRef.current = stream
      if (localRef.current) localRef.current.srcObject = stream

      // Créer PeerConnection
      const pc = new RTCPeerConnection(ICE)
      pcRef.current = pc
      stream.getTracks().forEach(t => pc.addTrack(t, stream))

      pc.ontrack = e => {
        if (remoteRef.current) remoteRef.current.srcObject = e.streams[0]
        setStatus('connected')
      }
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
          setStatus('waiting')
        }
      }

      // Vérifier si quelqu'un attend déjà dans la room
      const { data: existing } = await supabase.from('med_signaling')
        .select('*').eq('room_id', roomId).neq('user_id', u.id).limit(1)

      if (existing?.length > 0 && existing[0].type === 'offer') {
        // Rejoindre en tant que callee
        await joinAsCallee(pc, existing[0], u)
      } else {
        // Créer l'offre en tant que caller
        await createOffer(pc, u)
      }

      // Écouter les ICE candidates
      pc.onicecandidate = async ({ candidate }) => {
        if (candidate) {
          await supabase.from('med_signaling').insert({
            room_id: roomId, user_id: u.id,
            type: 'ice', payload: JSON.stringify(candidate)
          })
        }
      }

    } catch (err) {
      showToast('Caméra/micro non disponible')
    }
  }

  async function createOffer(pc, u) {
    setStatus('connecting')
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)

    await supabase.from('med_signaling').insert({
      room_id: roomId, user_id: u.id,
      type: 'offer', payload: JSON.stringify(offer)
    })

    // Écouter la réponse
    const sub = supabase.channel(`sig_${roomId}_answer`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'med_signaling',
        filter: `room_id=eq.${roomId}`
      }, async ({ new: row }) => {
        if (row.user_id === u.id) return
        if (row.type === 'answer') {
          await pc.setRemoteDescription(JSON.parse(row.payload))
          setStatus('connected')
        }
        if (row.type === 'ice') {
          try { await pc.addIceCandidate(new RTCIceCandidate(JSON.parse(row.payload))) } catch {}
        }
      }).subscribe()
    subsRef.current.push(sub)
  }

  async function joinAsCallee(pc, offerRow, u) {
    setStatus('connecting')
    await pc.setRemoteDescription(JSON.parse(offerRow.payload))
    const answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)

    await supabase.from('med_signaling').insert({
      room_id: roomId, user_id: u.id,
      type: 'answer', payload: JSON.stringify(answer)
    })

    // Écouter les ICE du caller
    const sub = supabase.channel(`sig_${roomId}_ice`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'med_signaling',
        filter: `room_id=eq.${roomId}`
      }, async ({ new: row }) => {
        if (row.user_id === u.id) return
        if (row.type === 'ice') {
          try { await pc.addIceCandidate(new RTCIceCandidate(JSON.parse(row.payload))) } catch {}
        }
      }).subscribe()
    subsRef.current.push(sub)
  }

  function toggleMic() {
    if (!streamRef.current) return
    streamRef.current.getAudioTracks().forEach(t => { t.enabled = !t.enabled })
    setMicOn(on => !on)
  }

  function toggleCam() {
    if (!streamRef.current) return
    streamRef.current.getVideoTracks().forEach(t => { t.enabled = !t.enabled })
    setCamOn(on => !on)
  }

  function endCall() {
    cleanup()
    router.push(BACK_ROUTES[user?.role] || '/apps/medical/login')
  }

  function copyLink() {
    navigator.clipboard.writeText(joinUrl).then(() => {
      setCopied(true)
      showToast('Lien copié !')
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  const BACK_ROUTES = {
    tenant_admin: '/apps/medical/doctor',
    tenant_user:  '/apps/medical/secretary',
    app_end_user: '/apps/medical/patient',
  }

  const statusText = {
    waiting:    'En attente',
    connecting: 'Connexion…',
    connected:  'En ligne',
  }
  const statusColor = {
    waiting: 'rgba(255,255,255,.3)',
    connecting: 'var(--gold)',
    connected: 'var(--green)',
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="tv-root">
        {/* Header */}
        <div className="tv-header">
          <span className="tv-logo">MediLink OS</span>
          <span className="tv-room">Salle: {roomId.slice(-8)}</span>
          <div className="tv-status">
            <div className="tv-dot" style={{ background: statusColor[status] }}/>
            <span style={{ color: statusColor[status] }}>{statusText[status]}</span>
          </div>
        </div>

        {/* Videos */}
        <div className="tv-videos">
          {/* Vidéo distante */}
          <video
            ref={remoteRef}
            className="tv-remote"
            autoPlay
            playsInline
            style={{ display: status === 'connected' ? 'block' : 'none' }}
          />

          {/* Écran d'attente */}
          {status !== 'connected' && (
            <div className="tv-waiting">
              <div className="tv-waiting-icon">
                <Users size={32} color="#0EA5E9"/>
              </div>
              <div>
                <div className="tv-waiting-text">
                  {status === 'connecting' ? 'Connexion en cours…' : 'En attente d\'un participant'}
                </div>
                <div className="tv-waiting-sub">
                  Partagez ce lien pour inviter quelqu'un
                </div>
              </div>
              <div className="tv-link-box">
                <div className="tv-link-text">{joinUrl}</div>
                <div className="tv-copy-btn" onClick={copyLink}>
                  <Copy size={13}/> {copied ? 'Copié !' : 'Copier le lien'}
                </div>
              </div>
            </div>
          )}

          {/* Vidéo locale (PiP) */}
          <div className="tv-local">
            <video ref={localRef} autoPlay playsInline muted/>
          </div>

          {/* Contrôles */}
          <div className="tv-controls">
            <button className={`tv-ctrl ${micOn ? 'mic' : 'off'}`} onClick={toggleMic}>
              {micOn ? <Mic size={20}/> : <MicOff size={20}/>}
            </button>
            <button className="tv-ctrl end" onClick={endCall}>
              <PhoneOff size={22}/>
            </button>
            <button className={`tv-ctrl ${camOn ? 'cam' : 'off'}`} onClick={toggleCam}>
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
      <div style={{ background:'#0A0A0F', height:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <Loader size={24} color="#0EA5E9" style={{ animation:'spin 1s linear infinite' }}/>
      </div>
    }>
      <TelemedecineInner/>
    </Suspense>
  )
}
