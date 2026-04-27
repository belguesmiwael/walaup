'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Plus, Trash2, Printer, Download,
  PenTool, CheckCircle2, AlertCircle, Pill,
  QrCode, FileText, RefreshCw, Eye
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

const CSS = `
  .rx-root { min-height:100vh; background:var(--bg-base); padding-bottom:60px; }
  .rx-bar { position:sticky; top:0; z-index:100; height:56px; display:flex; align-items:center;
    padding:0 20px; gap:12px; background:rgba(8,11,20,.96);
    border-bottom:1px solid var(--border); backdrop-filter:blur(20px); }
  .rx-back { display:flex; align-items:center; gap:5px; color:var(--tx-2); font-size:.83rem;
    font-weight:600; cursor:pointer; background:none; border:none; padding:0; transition:color .15s; }
  .rx-back:hover { color:#0EA5E9; }
  .rx-h1 { font-family:var(--font-display); font-weight:700; font-size:.95rem; color:var(--tx); flex:1; }
  .rx-content { max-width:1100px; margin:0 auto; padding:20px; display:grid;
    grid-template-columns:1fr 420px; gap:20px; }
  @media(max-width:900px) { .rx-content { grid-template-columns:1fr; } }

  /* ── Form panel ── */
  .rx-panel { background:var(--bg-surface); border:1px solid var(--border); border-radius:16px; overflow:hidden; }
  .rx-panel-header { padding:14px 18px; border-bottom:1px solid var(--border);
    display:flex; align-items:center; gap:8px; }
  .rx-panel-title { font-weight:700; font-size:.88rem; color:var(--tx); flex:1; }
  .rx-panel-body { padding:18px; }

  .rx-fg { margin-bottom:13px; }
  .rx-label { display:block; font-size:.72rem; font-weight:600; color:var(--tx-2);
    margin-bottom:5px; letter-spacing:.03em; }
  .rx-input { width:100%; padding:9px 12px; border-radius:10px;
    border:1px solid var(--border); background:var(--bg-base);
    color:var(--tx); font-size:.875rem; outline:none; box-sizing:border-box;
    transition:border-color .15s; }
  .rx-input:focus { border-color:#0EA5E9; }
  .rx-select { width:100%; padding:9px 12px; border-radius:10px;
    border:1px solid var(--border); background:var(--bg-base);
    color:var(--tx); font-size:.875rem; outline:none; cursor:pointer; box-sizing:border-box; }
  .rx-row { display:grid; grid-template-columns:2fr 1fr 1fr; gap:10px; margin-bottom:10px; }
  .rx-textarea { width:100%; padding:9px 12px; border-radius:10px;
    border:1px solid var(--border); background:var(--bg-base);
    color:var(--tx); font-size:.875rem; outline:none; resize:vertical;
    min-height:60px; font-family:var(--font-body); box-sizing:border-box; }
  .rx-textarea:focus { border-color:#0EA5E9; }

  /* ── Drug item ── */
  .rx-drug { background:var(--bg-base); border:1px solid var(--border); border-radius:12px;
    padding:14px; margin-bottom:10px; }
  .rx-drug-num { display:flex; align-items:center; gap:8px; margin-bottom:10px; }
  .rx-drug-badge { width:24px; height:24px; border-radius:7px; display:flex; align-items:center;
    justify-content:center; background:rgba(14,165,233,.12); color:#0EA5E9;
    font-size:.72rem; font-weight:800; flex-shrink:0; }
  .rx-drug-name-preview { font-weight:600; font-size:.83rem; color:var(--tx); flex:1;
    white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .rx-remove { width:26px; height:26px; border-radius:7px; border:1px solid rgba(248,113,113,.25);
    background:rgba(248,113,113,.08); color:var(--red); cursor:pointer;
    display:flex; align-items:center; justify-content:center; transition:all .15s; flex-shrink:0; }
  .rx-remove:hover { background:rgba(248,113,113,.18); }
  .rx-add-drug { display:flex; align-items:center; gap:6px; padding:9px 14px;
    border:1px dashed rgba(14,165,233,.35); border-radius:10px; background:rgba(14,165,233,.04);
    color:#0EA5E9; cursor:pointer; font-size:.8rem; font-weight:600; transition:all .15s; width:100%; }
  .rx-add-drug:hover { background:rgba(14,165,233,.1); border-style:solid; }

  /* ── Signature pad ── */
  .rx-sig-wrap { border:1px solid var(--border); border-radius:10px; overflow:hidden;
    position:relative; background:rgba(255,255,255,.02); }
  canvas.rx-sig { display:block; cursor:crosshair; touch-action:none; }
  .rx-sig-clear { position:absolute; top:8px; right:8px; padding:3px 8px; border-radius:7px;
    border:1px solid var(--border); background:var(--bg-base); color:var(--tx-3);
    font-size:.68rem; cursor:pointer; transition:all .15s; }
  .rx-sig-clear:hover { color:var(--red); border-color:rgba(248,113,113,.3); }
  .rx-sig-hint { position:absolute; bottom:8px; left:50%; transform:translateX(-50%);
    font-size:.68rem; color:rgba(255,255,255,.15); pointer-events:none; white-space:nowrap; }

  /* ── Actions ── */
  .rx-actions { display:flex; gap:8px; margin-top:16px; flex-wrap:wrap; }
  .rx-btn { display:flex; align-items:center; gap:6px; padding:9px 18px; border-radius:11px;
    font-size:.82rem; font-weight:700; cursor:pointer; border:none; transition:all .18s; }
  .rx-btn.primary  { background:#0EA5E9; color:white; }
  .rx-btn.primary:hover  { background:#0284C7; }
  .rx-btn.print   { background:rgba(16,185,129,.12); color:var(--green); border:1px solid rgba(16,185,129,.3); }
  .rx-btn.print:hover { background:rgba(16,185,129,.22); }
  .rx-btn.ghost { background:var(--bg-surface); color:var(--tx-2); border:1px solid var(--border); }
  .rx-btn:disabled { opacity:.5; cursor:not-allowed; }

  /* ── Preview panel ── */
  .rx-preview { background:white; border-radius:16px; overflow:hidden;
    box-shadow:0 8px 40px rgba(0,0,0,.3); }
  .rx-preview-inner { padding:32px 28px; font-family:'DM Serif Display', Georgia, serif; color:#1a1a2e; }

  /* ── Ordonnance styles (print) ── */
  .rx-doc-header { display:flex; justify-content:space-between; align-items:flex-start;
    border-bottom:3px solid #0EA5E9; padding-bottom:16px; margin-bottom:20px; }
  .rx-doc-clinic-name { font-size:1.15rem; font-weight:800; color:#0EA5E9; margin-bottom:3px; }
  .rx-doc-clinic-spec { font-size:.78rem; color:#64748B; }
  .rx-doc-clinic-addr { font-size:.72rem; color:#94A3B8; margin-top:4px; }
  .rx-doc-logo { width:50px; height:50px; border-radius:14px; background:linear-gradient(135deg,#0EA5E9,#0284C7);
    display:flex; align-items:center; justify-content:center; flex-shrink:0; }
  .rx-doc-title { text-align:center; margin:16px 0; }
  .rx-doc-title h2 { font-size:1.1rem; letter-spacing:.15em; color:#0EA5E9; text-transform:uppercase; margin:0; }
  .rx-doc-patient { background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px;
    padding:12px 14px; margin-bottom:20px; display:flex; gap:20px; flex-wrap:wrap; }
  .rx-doc-pt-field { }
  .rx-doc-pt-label { font-size:.63rem; color:#94A3B8; font-weight:600; letter-spacing:.06em;
    text-transform:uppercase; margin-bottom:2px; }
  .rx-doc-pt-val { font-size:.82rem; color:#1a1a2e; font-weight:600; }
  .rx-doc-drug { margin-bottom:16px; padding:12px 0; border-bottom:1px dashed #E2E8F0; }
  .rx-doc-drug:last-child { border-bottom:none; }
  .rx-doc-drug-name { font-size:1rem; font-weight:700; color:#1a1a2e; display:flex; align-items:center; gap:8px; }
  .rx-doc-drug-rp { width:22px; height:22px; border-radius:6px; background:#0EA5E9;
    color:white; font-size:.72rem; font-weight:800; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
  .rx-doc-drug-detail { font-size:.82rem; color:#475569; margin-top:4px; padding-left:30px; }
  .rx-doc-drug-warn { font-size:.72rem; color:#DC2626; margin-top:3px; padding-left:30px; }
  .rx-doc-footer { display:flex; justify-content:space-between; align-items:flex-end;
    border-top:1px solid #E2E8F0; padding-top:16px; margin-top:24px; }
  .rx-doc-sig-box { text-align:center; }
  .rx-doc-sig-label { font-size:.68rem; color:#94A3B8; margin-bottom:4px; }
  .rx-doc-date { font-size:.75rem; color:#64748B; }
  .rx-doc-qr { width:60px; height:60px; border:1px solid #E2E8F0; border-radius:8px;
    display:flex; align-items:center; justify-content:center; }
  .rx-doc-validity { text-align:center; margin-top:12px; font-size:.68rem; color:#94A3B8; }

  /* ── Print styles ── */
  @media print {
    .rx-bar, .rx-panel { display:none !important; }
    .rx-content { grid-template-columns:1fr !important; padding:0 !important; }
    .rx-preview { box-shadow:none !important; border-radius:0 !important; }
    @page { size:A4; margin:1.5cm; }
  }
`

/* ── Drug suggestions par spécialité ── */
const DRUG_TEMPLATES = {
  'Médecine générale': [
    { drug:'Paracétamol 500mg', dosage:'1 comprimé × 3/jour', duration:'5 jours', instructions:'Après les repas' },
    { drug:'Ibuprofène 400mg', dosage:'1 comprimé × 3/jour', duration:'5 jours', instructions:'Avec repas — contre-indiqué si ulcère' },
    { drug:'Amoxicilline 1g', dosage:'1 comprimé × 2/jour', duration:'7 jours', instructions:'Terminer le traitement' },
    { drug:'Oméprazole 20mg', dosage:'1 gélule/jour', duration:'1 mois', instructions:'À jeun, le matin' },
  ],
  'Cardiologie': [
    { drug:'Amlodipine 5mg', dosage:'1 comprimé/jour', duration:'1 mois', instructions:'Matin' },
    { drug:'Bisoprolol 5mg', dosage:'1 comprimé/jour', duration:'1 mois', instructions:'Matin — ne pas arrêter brutalement' },
    { drug:'Aspirine 100mg', dosage:'1 comprimé/jour', duration:'3 mois', instructions:'Après dîner' },
    { drug:'Atorvastatine 20mg', dosage:'1 comprimé/jour', duration:'3 mois', instructions:'Soir' },
  ],
  'Diabétologie': [
    { drug:'Metformine 850mg', dosage:'1 comprimé × 2/jour', duration:'1 mois', instructions:'Pendant les repas' },
    { drug:'Gliclazide 30mg', dosage:'1 comprimé/jour', duration:'1 mois', instructions:'Matin — surveiller glycémie' },
    { drug:'Insuline Glargine', dosage:'Selon prescription', duration:'1 mois', instructions:'Injection SC le soir' },
  ],
  'Pédiatrie': [
    { drug:'Paracétamol sirop 2.4%', dosage:'15 mg/kg × 4/jour', duration:'3 jours', instructions:'Selon le poids' },
    { drug:'Ibuprofène sirop', dosage:'10 mg/kg × 3/jour', duration:'3 jours', instructions:'Avec repas' },
    { drug:'Amoxicilline 125mg/5ml', dosage:'50 mg/kg/jour en 3 prises', duration:'7 jours', instructions:'Bien agiter' },
  ],
}

function generateQRCode(text) {
  // QR code simple via API publique
  return `https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${encodeURIComponent(text)}`
}

function SignaturePad({ onSave }) {
  const ref     = useRef(null)
  const drawing = useRef(false)
  const hasSig  = useRef(false)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    canvas.width  = canvas.offsetWidth
    canvas.height = 100
    const ctx = canvas.getContext('2d')
    ctx.strokeStyle = '#0EA5E9'
    ctx.lineWidth   = 2.5
    ctx.lineCap     = 'round'
    ctx.lineJoin    = 'round'

    function getPos(e) {
      const rect = canvas.getBoundingClientRect()
      const src  = e.touches?.[0] || e
      return { x: src.clientX - rect.left, y: src.clientY - rect.top }
    }

    function start(e) { e.preventDefault(); drawing.current = true; const p = getPos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y) }
    function move(e) {
      if (!drawing.current) return
      e.preventDefault()
      const p = getPos(e)
      ctx.lineTo(p.x, p.y); ctx.stroke(); ctx.beginPath(); ctx.moveTo(p.x, p.y)
      hasSig.current = true
    }
    function end() {
      drawing.current = false
      if (hasSig.current) onSave?.(canvas.toDataURL())
    }

    canvas.addEventListener('mousedown', start)
    canvas.addEventListener('mousemove', move)
    canvas.addEventListener('mouseup',   end)
    canvas.addEventListener('touchstart', start, { passive: false })
    canvas.addEventListener('touchmove',  move,  { passive: false })
    canvas.addEventListener('touchend',   end)

    return () => {
      canvas.removeEventListener('mousedown', start)
      canvas.removeEventListener('mousemove', move)
      canvas.removeEventListener('mouseup',   end)
    }
  }, [onSave])

  function clear() {
    const canvas = ref.current
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    hasSig.current = false
    onSave?.(null)
  }

  return (
    <div className="rx-sig-wrap">
      <canvas ref={ref} className="rx-sig" style={{ width:'100%', height:100 }}/>
      <button className="rx-sig-clear" onClick={clear}><RefreshCw size={10}/> Effacer</button>
      <span className="rx-sig-hint">Signez ici avec la souris ou le doigt</span>
    </div>
  )
}

export default function Prescription() {
  const router = useRouter()
  const [user,      setUser]      = useState(null)
  const [doctor,    setDoctor]    = useState(null)
  const [patients,  setPatients]  = useState([])
  const [selPt,     setSelPt]     = useState('')
  const [ptData,    setPtData]    = useState(null)
  const [specialty, setSpecialty] = useState('Médecine générale')
  const [drugs,     setDrugs]     = useState([{ drug:'', dosage:'', duration:'', instructions:'', warning:'' }])
  const [notes,     setNotes]     = useState('')
  const [diagnosis, setDiagnosis] = useState('')
  const [sigData,   setSigData]   = useState(null)
  const [saving,    setSaving]    = useState(false)
  const [saved,     setSaved]     = useState(false)
  const [showSig,   setShowSig]   = useState(false)

  useEffect(() => {
    async function init() {
      const { data: { user: u } } = await supabase.auth.getUser()
      if (!u) { router.push('/apps/medical/login'); return }
      const { data: ud } = await supabase.from('users').select('role,tenant_id,app_type,full_name').eq('id',u.id).maybeSingle()
      if (!ud||ud.app_type!=='medical') { router.push('/apps/medical/login'); return }
      setUser({ ...u, ...ud })
      const { data: tenant } = await supabase.from('med_tenants').select('*').eq('tenant_id',ud.tenant_id).maybeSingle()
      setDoctor(tenant || { doctor_name: ud.full_name, specialty:'Médecine générale' })
      if (tenant?.specialty) setSpecialty(tenant.specialty)
      const { data: pts } = await supabase.from('med_patients')
        .select('id,first_name,last_name,birth_date,gender,allergies').order('last_name',{ ascending:true }).limit(100)
      setPatients(pts||[])
    }
    init()
  }, [router])

  useEffect(() => {
    if (!selPt) { setPtData(null); return }
    setPtData(patients.find(p=>p.id===selPt)||null)
  }, [selPt, patients])

  function addDrug() { setDrugs(d=>[...d,{ drug:'',dosage:'',duration:'',instructions:'',warning:'' }]) }
  function removeDrug(i) { setDrugs(d=>d.filter((_,j)=>j!==i)) }
  function updateDrug(i, field, val) { setDrugs(d=>d.map((x,j)=>j===i?{...x,[field]:val}:x)) }
  function applyTemplate(tpl) { updateDrug(drugs.length-1, 'drug', tpl.drug); updateDrug(drugs.length-1, 'dosage', tpl.dosage); updateDrug(drugs.length-1, 'duration', tpl.duration); updateDrug(drugs.length-1, 'instructions', tpl.instructions) }

  function calcAge(dob) { if(!dob) return null; return Math.floor((Date.now()-new Date(dob))/(1000*60*60*24*365.25)) }

  async function savePrescription() {
    if (!selPt || !drugs.some(d=>d.drug.trim())) return
    setSaving(true)
    try {
      await supabase.from('med_consultations').insert({
        tenant_id: user.tenant_id,
        patient_id: selPt,
        motif: diagnosis || 'Consultation',
        prescriptions: drugs.filter(d=>d.drug.trim()),
        notes,
        status:'done',
        created_by: user.id,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch(e) { console.error(e) }
    setSaving(false)
  }

  function printRx() {
    window.print()
  }

  const rxId = `RX-${Date.now().toString(36).toUpperCase()}`
  const today = new Date().toLocaleDateString('fr-TN', { day:'2-digit', month:'long', year:'numeric' })
  const critAllergies = (ptData?.allergies||[]).filter(a=>a.severity==='CRITIQUE')
  const templates = DRUG_TEMPLATES[specialty] || DRUG_TEMPLATES['Médecine générale']

  return (
    <>
      <style>{CSS}</style>
      <div className="rx-root">
        <div className="rx-bar">
          <button className="rx-back" onClick={()=>router.push('/apps/medical/doctor')}><ArrowLeft size={14}/> Retour</button>
          <span className="rx-h1">Ordonnances & Prescriptions</span>
          {saved && <div style={{ display:'flex', alignItems:'center', gap:5, color:'var(--green)', fontSize:'.78rem', fontWeight:700 }}><CheckCircle2 size={14}/> Sauvegardée</div>}
          <button className="rx-btn print" onClick={printRx}><Printer size={14}/> Imprimer</button>
        </div>

        <div className="rx-content">
          {/* ── LEFT — Form ── */}
          <div>
            {/* Patient + Médecin */}
            <div className="rx-panel" style={{ marginBottom:14 }}>
              <div className="rx-panel-header">
                <FileText size={15} color="#0EA5E9"/>
                <span className="rx-panel-title">Informations générales</span>
              </div>
              <div className="rx-panel-body">
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <div className="rx-fg">
                    <label className="rx-label">Patient *</label>
                    <select className="rx-select" value={selPt} onChange={e=>setSelPt(e.target.value)}>
                      <option value="">— Sélectionner —</option>
                      {patients.map(p=><option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
                    </select>
                  </div>
                  <div className="rx-fg">
                    <label className="rx-label">Spécialité</label>
                    <select className="rx-select" value={specialty} onChange={e=>setSpecialty(e.target.value)}>
                      {Object.keys(DRUG_TEMPLATES).map(s=><option key={s} value={s}>{s}</option>)}
                      <option value="Neurologie">Neurologie</option>
                      <option value="Rhumatologie">Rhumatologie</option>
                      <option value="Dermatologie">Dermatologie</option>
                      <option value="Ophtalmologie">Ophtalmologie</option>
                      <option value="Vétérinaire">Vétérinaire</option>
                    </select>
                  </div>
                </div>
                {critAllergies.length > 0 && (
                  <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px',
                    background:'rgba(220,38,38,.08)', border:'1px solid rgba(220,38,38,.25)',
                    borderRadius:9, marginTop:8, fontSize:'.78rem', color:'#DC2626', fontWeight:700 }}>
                    <AlertCircle size={14}/>
                    ⚠ ALLERGIES CRITIQUES : {critAllergies.map(a=>a.name).join(', ')}
                  </div>
                )}
                <div className="rx-fg" style={{ marginTop:12 }}>
                  <label className="rx-label">Diagnostic</label>
                  <input className="rx-input" placeholder="Diagnostic principal…" value={diagnosis} onChange={e=>setDiagnosis(e.target.value)}/>
                </div>
              </div>
            </div>

            {/* Médicaments */}
            <div className="rx-panel" style={{ marginBottom:14 }}>
              <div className="rx-panel-header">
                <Pill size={15} color="#0EA5E9"/>
                <span className="rx-panel-title">Médicaments prescrits</span>
              </div>
              <div className="rx-panel-body">
                {/* Templates rapides */}
                <div style={{ marginBottom:14 }}>
                  <div style={{ fontSize:'.7rem', fontWeight:700, color:'var(--tx-3)', letterSpacing:'.05em', textTransform:'uppercase', marginBottom:6 }}>
                    Suggestions — {specialty}
                  </div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                    {templates.map(t=>(
                      <button key={t.drug} onClick={()=>applyTemplate(t)}
                        style={{ padding:'4px 10px', borderRadius:20, border:'1px solid rgba(14,165,233,.25)',
                          background:'rgba(14,165,233,.06)', color:'#0EA5E9', fontSize:'.7rem',
                          fontWeight:600, cursor:'pointer', transition:'all .15s' }}>
                        + {t.drug.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>

                {drugs.map((drug, i) => (
                  <div key={i} className="rx-drug">
                    <div className="rx-drug-num">
                      <div className="rx-drug-badge">Rp{i+1}</div>
                      <span className="rx-drug-name-preview">{drug.drug || `Médicament ${i+1}`}</span>
                      {drugs.length > 1 && (
                        <button className="rx-remove" onClick={()=>removeDrug(i)}><Trash2 size={12}/></button>
                      )}
                    </div>
                    <div className="rx-row">
                      <div className="rx-fg">
                        <label className="rx-label">Médicament + dosage</label>
                        <input className="rx-input" placeholder="ex: Amoxicilline 1g" value={drug.drug}
                          onChange={e=>updateDrug(i,'drug',e.target.value)}/>
                      </div>
                      <div className="rx-fg">
                        <label className="rx-label">Posologie</label>
                        <input className="rx-input" placeholder="ex: 2×/jour" value={drug.dosage}
                          onChange={e=>updateDrug(i,'dosage',e.target.value)}/>
                      </div>
                      <div className="rx-fg">
                        <label className="rx-label">Durée</label>
                        <input className="rx-input" placeholder="ex: 7 jours" value={drug.duration}
                          onChange={e=>updateDrug(i,'duration',e.target.value)}/>
                      </div>
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                      <div className="rx-fg">
                        <label className="rx-label">Instructions</label>
                        <input className="rx-input" placeholder="ex: Après repas" value={drug.instructions}
                          onChange={e=>updateDrug(i,'instructions',e.target.value)}/>
                      </div>
                      <div className="rx-fg">
                        <label className="rx-label">Mise en garde</label>
                        <input className="rx-input" placeholder="ex: Éviter alcool" value={drug.warning}
                          onChange={e=>updateDrug(i,'warning',e.target.value)}/>
                      </div>
                    </div>
                  </div>
                ))}
                <button className="rx-add-drug" onClick={addDrug}>
                  <Plus size={14}/> Ajouter un médicament
                </button>
              </div>
            </div>

            {/* Notes + Signature */}
            <div className="rx-panel">
              <div className="rx-panel-header">
                <PenTool size={15} color="#0EA5E9"/>
                <span className="rx-panel-title">Notes & Signature</span>
              </div>
              <div className="rx-panel-body">
                <div className="rx-fg">
                  <label className="rx-label">Notes complémentaires</label>
                  <textarea className="rx-textarea" placeholder="Recommandations, prochain RDV, examens complémentaires…"
                    value={notes} onChange={e=>setNotes(e.target.value)} rows={3}/>
                </div>
                <div className="rx-fg">
                  <label className="rx-label">Signature électronique du médecin</label>
                  <SignaturePad onSave={setSigData}/>
                </div>
                <div className="rx-actions">
                  <button className="rx-btn primary" onClick={savePrescription} disabled={saving||!selPt}>
                    <CheckCircle2 size={14}/>{saving?'Sauvegarde…':'Sauvegarder'}
                  </button>
                  <button className="rx-btn print" onClick={printRx}>
                    <Printer size={14}/> Imprimer ordonnance
                  </button>
                  <button className="rx-btn ghost" onClick={()=>{ setDrugs([{ drug:'',dosage:'',duration:'',instructions:'',warning:'' }]); setNotes(''); setDiagnosis(''); setSigData(null) }}>
                    <RefreshCw size={14}/> Réinitialiser
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT — Preview ordonnance ── */}
          <div>
            <div style={{ position:'sticky', top:72 }}>
              <div style={{ fontSize:'.7rem', fontWeight:700, color:'var(--tx-3)', letterSpacing:'.07em', textTransform:'uppercase', marginBottom:10, display:'flex', alignItems:'center', gap:6 }}>
                <Eye size={12}/> Aperçu ordonnance
              </div>
              <div className="rx-preview" id="rx-preview-print">
                <div className="rx-preview-inner">
                  {/* Header cabinet */}
                  <div className="rx-doc-header">
                    <div>
                      <div className="rx-doc-clinic-name">{doctor?.doctor_name || 'Dr Médecin'}</div>
                      <div className="rx-doc-clinic-spec">{doctor?.specialty || specialty}</div>
                      <div className="rx-doc-clinic-addr">
                        {doctor?.address && <span>{doctor.address} — </span>}
                        {doctor?.city || 'Tunis'} · {doctor?.phone || ''}
                      </div>
                    </div>
                    <div className="rx-doc-logo">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M9 3h6v6h6v6h-6v6H9v-6H3v-6h6V3z" fill="white"/>
                      </svg>
                    </div>
                  </div>

                  {/* Titre */}
                  <div className="rx-doc-title">
                    <h2>Ordonnance Médicale</h2>
                  </div>

                  {/* Patient */}
                  {ptData && (
                    <div className="rx-doc-patient">
                      <div className="rx-doc-pt-field">
                        <div className="rx-doc-pt-label">Patient</div>
                        <div className="rx-doc-pt-val">{ptData.first_name} {ptData.last_name}</div>
                      </div>
                      <div className="rx-doc-pt-field">
                        <div className="rx-doc-pt-label">Âge</div>
                        <div className="rx-doc-pt-val">{calcAge(ptData.birth_date) ? calcAge(ptData.birth_date) + ' ans' : '—'}</div>
                      </div>
                      <div className="rx-doc-pt-field">
                        <div className="rx-doc-pt-label">Date</div>
                        <div className="rx-doc-pt-val">{today}</div>
                      </div>
                      {diagnosis && (
                        <div className="rx-doc-pt-field" style={{ flex:1 }}>
                          <div className="rx-doc-pt-label">Diagnostic</div>
                          <div className="rx-doc-pt-val" style={{ fontSize:'.75rem' }}>{diagnosis}</div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Médicaments */}
                  {drugs.filter(d=>d.drug.trim()).map((drug, i) => (
                    <div key={i} className="rx-doc-drug">
                      <div className="rx-doc-drug-name">
                        <div className="rx-doc-drug-rp">Rp</div>
                        {drug.drug}
                      </div>
                      <div className="rx-doc-drug-detail">
                        {drug.dosage && <span>{drug.dosage}</span>}
                        {drug.duration && <span> — {drug.duration}</span>}
                        {drug.instructions && <span><br/>⟶ {drug.instructions}</span>}
                      </div>
                      {drug.warning && (
                        <div className="rx-doc-drug-warn">⚠ {drug.warning}</div>
                      )}
                    </div>
                  ))}

                  {/* Notes */}
                  {notes && (
                    <div style={{ background:'#F8FAFC', borderRadius:8, padding:'10px 12px', marginTop:8, fontSize:'.78rem', color:'#475569' }}>
                      <strong style={{ color:'#1a1a2e' }}>Notes : </strong>{notes}
                    </div>
                  )}

                  {/* Footer avec signature + QR */}
                  <div className="rx-doc-footer">
                    <div>
                      <div className="rx-doc-date">{today}</div>
                      <div style={{ fontSize:'.68rem', color:'#94A3B8', marginTop:2 }}>Réf: {rxId}</div>
                    </div>
                    <div className="rx-doc-sig-box">
                      <div className="rx-doc-sig-label">Cachet & Signature</div>
                      {sigData
                        ? <img src={sigData} alt="signature" style={{ height:50, maxWidth:120 }}/>
                        : <div style={{ width:120, height:50, border:'1px dashed #CBD5E1', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', color:'#CBD5E1', fontSize:'.65rem' }}>À signer</div>
                      }
                    </div>
                    <div className="rx-doc-qr">
                      <img src={generateQRCode(rxId)} alt="QR" width={56} height={56}/>
                    </div>
                  </div>
                  <div className="rx-doc-validity">
                    Ordonnance valable 3 mois · Rédigée par {doctor?.doctor_name || 'Dr Médecin'} · MediLink OS
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
