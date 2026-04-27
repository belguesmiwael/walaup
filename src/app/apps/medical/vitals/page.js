'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Heart, Wind, Thermometer, Activity,
  AlertTriangle, CheckCircle2, RefreshCw, Plus,
  TrendingUp, TrendingDown, Minus, Zap
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

const CSS = `
  .vt-root { min-height:100vh; background:#030810; padding-bottom:40px; color:white; }
  .vt-bar { position:sticky; top:0; z-index:100; height:54px; display:flex; align-items:center;
    padding:0 20px; gap:12px; background:rgba(3,8,16,.97);
    border-bottom:1px solid rgba(16,185,129,.12); backdrop-filter:blur(20px); }
  .vt-back { display:flex; align-items:center; gap:5px; color:rgba(255,255,255,.4);
    font-size:.83rem; font-weight:600; cursor:pointer; background:none; border:none; padding:0; }
  .vt-back:hover { color:#34D399; }
  .vt-h1 { font-family:var(--font-display); font-weight:800; font-size:.9rem;
    color:#34D399; flex:1; }
  .vt-live { display:flex; align-items:center; gap:6px; font-size:.7rem;
    font-weight:700; color:#34D399; }
  .vt-live-dot { width:7px; height:7px; border-radius:50%; background:#34D399;
    box-shadow:0 0 8px #34D399; animation:vtPulse 1.2s infinite; }
  @keyframes vtPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.8)} }

  .vt-content { max-width:1100px; margin:0 auto; padding:20px; }

  /* ── Patient bar ── */
  .vt-pt-bar { display:flex; align-items:center; gap:12px; padding:12px 18px;
    background:rgba(16,185,129,.06); border:1px solid rgba(16,185,129,.15);
    border-radius:14px; margin-bottom:20px; }
  .vt-pt-av { width:38px; height:38px; border-radius:50%; background:linear-gradient(135deg,#10B981,#34D399);
    display:flex; align-items:center; justify-content:center; font-size:.85rem; font-weight:800; flex-shrink:0; }
  .vt-pt-name { font-weight:700; font-size:.9rem; color:white; }
  .vt-pt-meta { font-size:.72rem; color:rgba(255,255,255,.4); margin-top:2px; }
  .vt-sel { background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.1);
    border-radius:9px; padding:7px 12px; color:white; font-size:.8rem; outline:none;
    cursor:pointer; flex:1; max-width:300px; }

  /* ── ECG Canvas ── */
  .vt-ecg-wrap { background:rgba(3,8,16,.95); border:1px solid rgba(16,185,129,.15);
    border-radius:16px; overflow:hidden; margin-bottom:16px; }
  .vt-ecg-header { display:flex; align-items:center; justify-content:space-between;
    padding:12px 18px; border-bottom:1px solid rgba(16,185,129,.1); }
  .vt-ecg-title { font-size:.78rem; font-weight:700; letter-spacing:.08em;
    text-transform:uppercase; color:rgba(16,185,129,.8); display:flex; align-items:center; gap:6px; }
  .vt-ecg-bpm { font-family:var(--font-display); font-size:1.8rem; font-weight:900;
    color:#34D399; line-height:1; }
  .vt-ecg-bpm-label { font-size:.62rem; color:rgba(255,255,255,.3); margin-top:2px; text-align:right; }
  canvas.vt-ecg { width:100%; height:120px; display:block; }

  /* ── Vitals grid ── */
  .vt-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:12px; margin-bottom:16px; }
  .vt-card { background:rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.07);
    border-radius:14px; padding:16px; position:relative; overflow:hidden; transition:all .2s; }
  .vt-card.alert-high   { border-color:rgba(239,68,68,.4); background:rgba(239,68,68,.06); }
  .vt-card.alert-medium { border-color:rgba(245,158,11,.35); background:rgba(245,158,11,.05); }
  .vt-card.normal       { border-color:rgba(16,185,129,.2); }
  .vt-card::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; }
  .vt-card.normal::before       { background:linear-gradient(90deg,#10B981,#34D399); }
  .vt-card.alert-high::before   { background:linear-gradient(90deg,#EF4444,#F87171); }
  .vt-card.alert-medium::before { background:linear-gradient(90deg,#F59E0B,#FCD34D); }
  .vt-card-label { font-size:.65rem; font-weight:700; letter-spacing:.08em;
    text-transform:uppercase; color:rgba(255,255,255,.3); margin-bottom:8px; }
  .vt-card-value { font-family:var(--font-display); font-size:2rem; font-weight:900; color:white; line-height:1; }
  .vt-card-unit  { font-size:.75rem; color:rgba(255,255,255,.35); margin-left:4px; }
  .vt-card-sub   { font-size:.7rem; color:rgba(255,255,255,.3); margin-top:4px; }
  .vt-card-trend { position:absolute; top:14px; right:14px; }
  .vt-card-icon  { position:absolute; bottom:12px; right:12px; opacity:.08; }
  .vt-alert-badge { display:flex; align-items:center; gap:4px; padding:2px 8px;
    border-radius:20px; font-size:.62rem; font-weight:700; margin-top:6px;
    background:rgba(239,68,68,.15); color:#F87171; border:1px solid rgba(239,68,68,.25);
    width:fit-content; }

  /* ── Mini chart ── */
  canvas.vt-mini { width:100%; height:40px; display:block; margin-top:8px; }

  /* ── Log table ── */
  .vt-log { background:rgba(255,255,255,.02); border:1px solid rgba(255,255,255,.07);
    border-radius:14px; overflow:hidden; }
  .vt-log-header { display:flex; align-items:center; justify-content:space-between;
    padding:12px 18px; border-bottom:1px solid rgba(255,255,255,.06); }
  .vt-log-title { font-size:.75rem; font-weight:700; letter-spacing:.06em;
    text-transform:uppercase; color:rgba(255,255,255,.3); }
  .vt-log-row { display:grid; grid-template-columns:1fr 1fr 1fr 1fr 1fr 1fr 1fr;
    gap:8px; padding:10px 18px; border-bottom:1px solid rgba(255,255,255,.04);
    align-items:center; font-size:.75rem; transition:background .15s; }
  .vt-log-row:hover { background:rgba(255,255,255,.02); }
  .vt-log-row.header { color:rgba(255,255,255,.25); font-size:.65rem; font-weight:700;
    letter-spacing:.05em; text-transform:uppercase; }
  .vt-val-norm { color:rgba(255,255,255,.7); }
  .vt-val-high { color:#F87171; font-weight:700; }
  .vt-val-low  { color:#38BDF8; font-weight:700; }

  /* ── Add entry modal ── */
  .vt-modal-bg { position:fixed; inset:0; z-index:9000; background:rgba(0,0,0,.8);
    backdrop-filter:blur(6px); display:flex; align-items:center; justify-content:center; padding:16px; }
  .vt-modal { background:#0A1628; border:1px solid rgba(16,185,129,.2); border-radius:20px;
    padding:26px; width:100%; max-width:480px; }
  .vt-modal-title { font-weight:800; font-size:1rem; color:white; margin-bottom:20px; }
  .vt-form-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px; }
  .vt-fg { display:flex; flex-direction:column; gap:5px; }
  .vt-label { font-size:.7rem; font-weight:600; color:rgba(255,255,255,.35); letter-spacing:.04em; }
  .vt-input { padding:9px 12px; border-radius:9px; border:1px solid rgba(255,255,255,.1);
    background:rgba(255,255,255,.05); color:white; font-size:.875rem; outline:none;
    transition:border-color .15s; }
  .vt-input:focus { border-color:#10B981; }
  .vt-btn { padding:9px 20px; border-radius:10px; font-size:.83rem; font-weight:700;
    cursor:pointer; border:none; transition:all .18s; }
  .vt-btn.primary { background:linear-gradient(135deg,#10B981,#059669); color:white; }
  .vt-btn.ghost   { background:rgba(255,255,255,.06); color:rgba(255,255,255,.6); }

  @media(max-width:600px) { .vt-grid { grid-template-columns:1fr 1fr; } }
`

/* ── Normal ranges ── */
const RANGES = {
  systolic:    { min:90,   max:140, unit:'mmHg', label:'TA Systolique' },
  diastolic:   { min:60,   max:90,  unit:'mmHg', label:'TA Diastolique' },
  hr:          { min:60,   max:100, unit:'bpm',  label:'Fréquence cardiaque' },
  spo2:        { min:95,   max:100, unit:'%',    label:'SpO2' },
  temp:        { min:36.5, max:37.5,unit:'°C',   label:'Température' },
  rr:          { min:12,   max:20,  unit:'/min', label:'Fréquence respiratoire' },
  glucose:     { min:0.7,  max:1.26,unit:'g/L',  label:'Glycémie' },
}

function getStatus(key, val) {
  const r = RANGES[key]
  if (!r) return 'normal'
  if (val > r.max * 1.1 || val < r.min * 0.9) return 'alert-high'
  if (val > r.max || val < r.min) return 'alert-medium'
  return 'normal'
}

function initVitals(pt) {
  const base = {
    systolic:  pt?.chronic_cond?.some(c=>c.toLowerCase().includes('hypertension')) ? 158 : 120,
    diastolic: pt?.chronic_cond?.some(c=>c.toLowerCase().includes('hypertension')) ? 98  : 78,
    hr:        pt?.chronic_cond?.some(c=>c.toLowerCase().includes('arythmie'))     ? 112 : 72,
    spo2:      pt?.chronic_cond?.some(c=>c.toLowerCase().includes('asthme'))       ? 93  : 98,
    temp:      37.2,
    rr:        16,
    glucose:   pt?.chronic_cond?.some(c=>c.toLowerCase().includes('diab'))        ? 1.85 : 1.0,
  }
  return base
}

/* ── ECG Canvas ── */
function ECGCanvas({ bpm, status }) {
  const ref   = useRef(null)
  const animRef = useRef(null)
  const xRef  = useRef(0)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.offsetWidth, H = 120
    canvas.width = W * window.devicePixelRatio
    canvas.height = H * window.devicePixelRatio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

    const period = 60000 / bpm // ms per beat
    const color  = status === 'alert-high' ? '#F87171' : status === 'alert-medium' ? '#FCD34D' : '#34D399'
    const data   = new Float32Array(W)
    let  lastT   = 0

    function ecgY(phase) {
      const p = ((phase % period) / period)
      if (p < 0.05) return -H * 0.05 * (p / 0.05)
      if (p < 0.08) return -H * 0.35 * ((p-0.05)/0.03)
      if (p < 0.12) return H * 0.6 * ((p-0.08)/0.04)
      if (p < 0.15) return -H * 0.3 * ((p-0.12)/0.03)
      if (p < 0.18) return -H * 0.15 * (1-(p-0.15)/0.03)
      if (p < 0.28) return -H * 0.08 * Math.sin((p-0.18)/0.1 * Math.PI)
      return 0
    }

    function draw(ts) {
      const dt = ts - lastT; lastT = ts
      const speed = W / (period * 3) * dt

      // Shift left
      data.copyWithin(0, Math.round(speed))
      // New data right
      const phase = ts % (period * 3)
      for (let i = W - Math.ceil(speed); i < W; i++) {
        const phaseAt = phase - (W - i) / W * period * 3
        data[i] = ecgY(((phaseAt % period) + period) % period)
      }

      ctx.clearRect(0, 0, W, H)

      // Grid
      ctx.strokeStyle = color + '18'
      ctx.lineWidth = 1
      for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke() }
      for (let y = 0; y < H; y += 20) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke() }

      // ECG line
      ctx.beginPath()
      ctx.strokeStyle = color
      ctx.lineWidth   = 1.8
      ctx.shadowColor = color
      ctx.shadowBlur  = 6
      ctx.moveTo(0, H / 2)
      for (let x = 1; x < W; x++) {
        ctx.lineTo(x, H / 2 + data[x])
      }
      ctx.stroke()

      animRef.current = requestAnimationFrame(draw)
    }
    animRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(animRef.current)
  }, [bpm, status])

  return <canvas ref={ref} className="vt-ecg" style={{ height:120 }}/>
}

/* ── Mini sparkline ── */
function MiniChart({ data, color }) {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas || !data?.length) return
    const ctx = canvas.getContext('2d')
    const W = canvas.offsetWidth, H = 40
    canvas.width = W * window.devicePixelRatio
    canvas.height = H * window.devicePixelRatio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    ctx.clearRect(0, 0, W, H)
    const min = Math.min(...data), max = Math.max(...data)
    const range = max - min || 1
    const points = data.map((v, i) => ({ x: i/(data.length-1)*W, y: H - (v-min)/range*(H*0.8) - H*0.1 }))
    const grad = ctx.createLinearGradient(0,0,0,H)
    grad.addColorStop(0, color + '40')
    grad.addColorStop(1, color + '00')
    ctx.beginPath()
    points.forEach((p,i) => i===0?ctx.moveTo(p.x,p.y):ctx.lineTo(p.x,p.y))
    ctx.lineTo(W,H); ctx.lineTo(0,H); ctx.closePath()
    ctx.fillStyle = grad; ctx.fill()
    ctx.beginPath()
    points.forEach((p,i) => i===0?ctx.moveTo(p.x,p.y):ctx.lineTo(p.x,p.y))
    ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.stroke()
  }, [data, color])
  return <canvas ref={ref} className="vt-mini"/>
}

function initials(fn, ln) { return `${(fn||'')[0]||''}${(ln||'')[0]||''}`.toUpperCase() }
function calcAge(dob) { if(!dob) return null; return Math.floor((Date.now()-new Date(dob))/(1000*60*60*24*365.25)) }

export default function Vitals() {
  const router = useRouter()
  const [user,     setUser]     = useState(null)
  const [patients, setPatients] = useState([])
  const [selPt,    setSelPt]    = useState('')
  const [ptData,   setPtData]   = useState(null)
  const [vitals,   setVitals]   = useState(null)
  const [history,  setHistory]  = useState([])
  const [logs,     setLogs]     = useState([])
  const [showModal,setShowModal] = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [form,     setForm]     = useState({ systolic:'',diastolic:'',hr:'',spo2:'',temp:'',rr:'',glucose:'',notes:'' })
  const tickRef = useRef(null)

  useEffect(() => {
    async function init() {
      const { data: { user: u } } = await supabase.auth.getUser()
      if (!u) { router.push('/apps/medical/login'); return }
      const { data: ud } = await supabase.from('users').select('role,tenant_id,app_type').eq('id',u.id).maybeSingle()
      if (!ud||ud.app_type!=='medical') { router.push('/apps/medical/login'); return }
      setUser({ ...u, ...ud })
      const { data: pts } = await supabase.from('med_patients')
        .select('id,first_name,last_name,birth_date,gender,blood_type,chronic_cond,allergies')
        .order('last_name',{ ascending:true }).limit(100)
      setPatients(pts||[])
    }
    init()
  }, [router])

  useEffect(() => {
    if (!selPt) { setPtData(null); setVitals(null); setHistory([]); return }
    const pt = patients.find(p=>p.id===selPt)
    setPtData(pt)
    const base = initVitals(pt)
    setVitals(base)
    // Charger logs existants
    loadLogs(selPt)
    // Historique simulé pour les graphiques
    const hist = Array.from({ length:24 }, (_, i) => ({
      systolic:  base.systolic + (Math.random()-0.5)*20,
      diastolic: base.diastolic + (Math.random()-0.5)*12,
      hr:        base.hr + (Math.random()-0.5)*15,
      spo2:      Math.min(100, base.spo2 + (Math.random()-0.5)*4),
      temp:      base.temp + (Math.random()-0.5)*0.8,
      glucose:   base.glucose + (Math.random()-0.5)*0.4,
    }))
    setHistory(hist)
  }, [selPt, patients])

  async function loadLogs(ptId) {
    const { data } = await supabase.from('med_vitals')
      .select('*').eq('patient_id', ptId)
      .order('recorded_at',{ ascending:false }).limit(20)
    setLogs(data||[])
  }

  // Simulation fluctuation temps réel
  useEffect(() => {
    if (!vitals) return
    tickRef.current = setInterval(() => {
      setVitals(v => ({
        ...v,
        hr:      Math.max(40, Math.min(180, v.hr + (Math.random()-0.5)*2)),
        spo2:    Math.max(85, Math.min(100, v.spo2 + (Math.random()-0.48)*0.3)),
        temp:    Math.max(35, Math.min(42, v.temp + (Math.random()-0.5)*0.05)),
        rr:      Math.max(8, Math.min(30, v.rr + (Math.random()-0.5)*0.5)),
      }))
      setHistory(h => {
        const last = h[h.length-1] || {}
        return [...h.slice(-23), {
          ...last,
          hr:   Math.max(40, Math.min(180, (last.hr||72) + (Math.random()-0.5)*3)),
          spo2: Math.max(85, Math.min(100, (last.spo2||98) + (Math.random()-0.48)*0.4)),
          temp: Math.max(35, Math.min(42, (last.temp||37.2) + (Math.random()-0.5)*0.06)),
        }]
      })
    }, 1500)
    return () => clearInterval(tickRef.current)
  }, [vitals])

  async function saveVitals(e) {
    e.preventDefault()
    if (!selPt) return
    setSaving(true)
    try {
      const payload = {
        patient_id:  selPt,
        tenant_id:   user.tenant_id,
        recorded_by: user.id,
        systolic:    +form.systolic || null,
        diastolic:   +form.diastolic || null,
        heart_rate:  +form.hr || null,
        spo2:        +form.spo2 || null,
        temperature: +form.temp || null,
        resp_rate:   +form.rr || null,
        glucose:     +form.glucose || null,
        notes:       form.notes,
      }
      await supabase.from('med_vitals').insert(payload)
      if (form.systolic)  setVitals(v=>({...v, systolic:+form.systolic, diastolic:+form.diastolic}))
      if (form.hr)        setVitals(v=>({...v, hr:+form.hr}))
      if (form.spo2)      setVitals(v=>({...v, spo2:+form.spo2}))
      if (form.temp)      setVitals(v=>({...v, temp:+form.temp}))
      setShowModal(false)
      setForm({ systolic:'',diastolic:'',hr:'',spo2:'',temp:'',rr:'',glucose:'',notes:'' })
      loadLogs(selPt)
    } catch(err) { console.error(err) }
    setSaving(false)
  }

  const VITAL_CARDS = vitals ? [
    { key:'systolic',  label:'Tension artérielle', value:`${Math.round(vitals.systolic)}/${Math.round(vitals.diastolic)}`, unit:'mmHg', Icon:Activity, color:'#38BDF8', histKey:'systolic' },
    { key:'hr',        label:'Fréquence cardiaque',value:Math.round(vitals.hr),   unit:'bpm',  Icon:Heart,        color:'#F87171', histKey:'hr' },
    { key:'spo2',      label:'Saturation O2',       value:vitals.spo2.toFixed(1),  unit:'%',    Icon:Wind,         color:'#34D399', histKey:'spo2' },
    { key:'temp',      label:'Température',          value:vitals.temp.toFixed(1),  unit:'°C',   Icon:Thermometer,  color:'#FCD34D', histKey:'temp' },
    { key:'rr',        label:'Fréquence resp.',      value:Math.round(vitals.rr),   unit:'/min', Icon:Wind,         color:'#A78BFA', histKey:null },
    { key:'glucose',   label:'Glycémie',             value:vitals.glucose.toFixed(2),unit:'g/L', Icon:Activity,     color:'#FB923C', histKey:'glucose' },
  ] : []

  const hrStatus = vitals ? getStatus('hr', vitals.hr) : 'normal'

  return (
    <>
      <style>{CSS}</style>
      <div className="vt-root">
        <div className="vt-bar">
          <button className="vt-back" onClick={()=>router.push('/apps/medical/doctor')}><ArrowLeft size={14}/> Retour</button>
          <span className="vt-h1">Monitoring Vital Signs</span>
          <div className="vt-live"><div className="vt-live-dot"/> LIVE</div>
        </div>

        <div className="vt-content">
          {/* Patient selector */}
          <div className="vt-pt-bar">
            {ptData
              ? <div className="vt-pt-av">{initials(ptData.first_name, ptData.last_name)}</div>
              : <Activity size={20} color="rgba(16,185,129,.5)"/>
            }
            <div style={{ flex:1, minWidth:0 }}>
              {ptData
                ? <><div className="vt-pt-name">{ptData.first_name} {ptData.last_name}</div>
                    <div className="vt-pt-meta">
                      {calcAge(ptData.birth_date)} ans · {ptData.blood_type||'?'} · {(ptData.chronic_cond||[]).join(', ')||'RAS'}
                    </div></>
                : <div className="vt-pt-name" style={{ color:'rgba(255,255,255,.3)' }}>Sélectionner un patient pour démarrer le monitoring</div>
              }
            </div>
            <select className="vt-sel" value={selPt} onChange={e=>setSelPt(e.target.value)}>
              <option value="">— Choisir un patient —</option>
              {patients.map(p=><option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
            </select>
            {selPt && (
              <button onClick={()=>setShowModal(true)}
                style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:10,
                  border:'1px solid rgba(16,185,129,.3)', background:'rgba(16,185,129,.1)',
                  color:'#34D399', fontWeight:700, fontSize:'.8rem', cursor:'pointer' }}>
                <Plus size={14}/> Saisir mesures
              </button>
            )}
          </div>

          {vitals && (
            <>
              {/* ECG */}
              <div className="vt-ecg-wrap">
                <div className="vt-ecg-header">
                  <div className="vt-ecg-title">
                    <div style={{ width:7,height:7,borderRadius:'50%',background:'#34D399',boxShadow:'0 0 8px #34D399',animation:'vtPulse 1.2s infinite' }}/>
                    Électrocardiogramme
                  </div>
                  <div>
                    <div className="vt-ecg-bpm">{Math.round(vitals.hr)}</div>
                    <div className="vt-ecg-bpm-label">BPM</div>
                  </div>
                </div>
                <ECGCanvas bpm={vitals.hr} status={hrStatus}/>
              </div>

              {/* Vital cards */}
              <div className="vt-grid">
                {VITAL_CARDS.map(vc => {
                  const st  = getStatus(vc.key, parseFloat(String(vc.value).split('/')[0]))
                  const trend = vc.histKey && history.length > 4
                    ? history[history.length-1][vc.histKey] > history[history.length-5][vc.histKey] ? 'up' : 'down'
                    : null

                  return (
                    <div key={vc.key} className={`vt-card ${st}`}>
                      <div className="vt-card-label">{vc.label}</div>
                      <div>
                        <span className="vt-card-value" style={{ color: st==='normal' ? 'white' : st==='alert-high' ? '#F87171' : '#FCD34D' }}>
                          {vc.value}
                        </span>
                        <span className="vt-card-unit">{vc.unit}</span>
                      </div>
                      <div className="vt-card-sub">
                        {RANGES[vc.key] ? `Normal: ${RANGES[vc.key].min}–${RANGES[vc.key].max} ${vc.unit}` : ''}
                      </div>
                      {st !== 'normal' && (
                        <div className="vt-alert-badge">
                          <AlertTriangle size={9}/>
                          {st === 'alert-high' ? 'Hors normes critiques' : 'Légèrement anormal'}
                        </div>
                      )}
                      <div className="vt-card-trend">
                        {trend === 'up'   && <TrendingUp size={14} color={vc.color} opacity={.6}/>}
                        {trend === 'down' && <TrendingDown size={14} color={vc.color} opacity={.6}/>}
                        {!trend && <Minus size={14} color="rgba(255,255,255,.2)"/>}
                      </div>
                      <div className="vt-card-icon"><vc.Icon size={36} color={vc.color}/></div>
                      {vc.histKey && (
                        <MiniChart data={history.map(h=>h[vc.histKey]).filter(Boolean)} color={vc.color}/>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Log historique */}
              {logs.length > 0 && (
                <div className="vt-log">
                  <div className="vt-log-header">
                    <div className="vt-log-title">Historique des mesures</div>
                  </div>
                  <div className="vt-log-row header">
                    <span>Date</span><span>TA</span><span>FC</span><span>SpO2</span><span>T°</span><span>FR</span><span>Glycémie</span>
                  </div>
                  {logs.slice(0,10).map(log => (
                    <div key={log.id} className="vt-log-row">
                      <span style={{ color:'rgba(255,255,255,.35)', fontSize:'.68rem' }}>
                        {new Date(log.recorded_at).toLocaleDateString('fr-TN',{ day:'2-digit',month:'short', hour:'2-digit', minute:'2-digit' })}
                      </span>
                      <span className={getStatus('systolic',log.systolic)==='normal'?'vt-val-norm':'vt-val-high'}>
                        {log.systolic&&log.diastolic?`${log.systolic}/${log.diastolic}`:'—'}
                      </span>
                      <span className={log.heart_rate&&(log.heart_rate>100||log.heart_rate<60)?'vt-val-high':'vt-val-norm'}>
                        {log.heart_rate||'—'}
                      </span>
                      <span className={log.spo2&&log.spo2<95?'vt-val-low':'vt-val-norm'}>{log.spo2||'—'}</span>
                      <span className={log.temperature&&(log.temperature>37.5||log.temperature<36.5)?'vt-val-high':'vt-val-norm'}>
                        {log.temperature||'—'}
                      </span>
                      <span className="vt-val-norm">{log.resp_rate||'—'}</span>
                      <span className={log.glucose&&log.glucose>1.26?'vt-val-high':'vt-val-norm'}>
                        {log.glucose||'—'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal saisie */}
      {showModal && (
        <div className="vt-modal-bg" onClick={e=>e.target===e.currentTarget&&setShowModal(false)}>
          <div className="vt-modal">
            <div className="vt-modal-title">Saisir les constantes vitales</div>
            <form onSubmit={saveVitals}>
              <div className="vt-form-grid">
                <div className="vt-fg">
                  <label className="vt-label">TA Systolique (mmHg)</label>
                  <input className="vt-input" type="number" placeholder="120" value={form.systolic} onChange={e=>setForm(f=>({...f,systolic:e.target.value}))}/>
                </div>
                <div className="vt-fg">
                  <label className="vt-label">TA Diastolique (mmHg)</label>
                  <input className="vt-input" type="number" placeholder="80" value={form.diastolic} onChange={e=>setForm(f=>({...f,diastolic:e.target.value}))}/>
                </div>
                <div className="vt-fg">
                  <label className="vt-label">Fréquence cardiaque (bpm)</label>
                  <input className="vt-input" type="number" placeholder="72" value={form.hr} onChange={e=>setForm(f=>({...f,hr:e.target.value}))}/>
                </div>
                <div className="vt-fg">
                  <label className="vt-label">SpO2 (%)</label>
                  <input className="vt-input" type="number" placeholder="98" step="0.1" value={form.spo2} onChange={e=>setForm(f=>({...f,spo2:e.target.value}))}/>
                </div>
                <div className="vt-fg">
                  <label className="vt-label">Température (°C)</label>
                  <input className="vt-input" type="number" placeholder="37.2" step="0.1" value={form.temp} onChange={e=>setForm(f=>({...f,temp:e.target.value}))}/>
                </div>
                <div className="vt-fg">
                  <label className="vt-label">Glycémie (g/L)</label>
                  <input className="vt-input" type="number" placeholder="1.0" step="0.01" value={form.glucose} onChange={e=>setForm(f=>({...f,glucose:e.target.value}))}/>
                </div>
              </div>
              <div className="vt-fg" style={{ marginBottom:16 }}>
                <label className="vt-label">Notes</label>
                <input className="vt-input" placeholder="Contexte, observations…" value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))}/>
              </div>
              <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
                <button type="button" className="vt-btn ghost" onClick={()=>setShowModal(false)}>Annuler</button>
                <button type="submit" className="vt-btn primary" disabled={saving}>{saving?'Enregistrement…':'Enregistrer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
