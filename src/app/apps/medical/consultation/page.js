'use client'
import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowLeft, Save, CheckCircle2, AlertCircle, Plus, Trash2,
  Printer, Clock, User, Stethoscope, FileText, Pill, ChevronDown, ChevronUp
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

const CSS = `
  .cs-root { min-height:100vh; background:var(--bg-base); padding-bottom:60px; }

  /* ── Topbar ── */
  .cs-topbar {
    position:sticky; top:0; z-index:100;
    height:56px; display:flex; align-items:center;
    padding:0 20px; gap:12px;
    background:rgba(8,11,20,.96); border-bottom:1px solid var(--border);
    backdrop-filter:blur(20px);
  }
  .cs-back { display:flex; align-items:center; gap:6px; color:var(--tx-2);
    font-size:.85rem; font-weight:600; cursor:pointer; background:none;
    border:none; transition:color .15s; padding:0; }
  .cs-back:hover { color:#0EA5E9; }
  .cs-topbar-title { font-family:var(--font-display); font-weight:700;
    font-size:.95rem; color:var(--tx); flex:1; }
  .cs-topbar-actions { display:flex; gap:8px; }
  .cs-btn { padding:7px 16px; border-radius:10px; font-size:.8rem;
    font-weight:700; cursor:pointer; border:none; transition:all .18s;
    display:flex; align-items:center; gap:6px; }
  .cs-btn.ghost { background:var(--bg-surface); color:var(--tx-2);
    border:1px solid var(--border); }
  .cs-btn.ghost:hover { color:var(--tx); }
  .cs-btn.save { background:rgba(14,165,233,.12); color:#0EA5E9;
    border:1px solid rgba(14,165,233,.3); }
  .cs-btn.save:hover { background:rgba(14,165,233,.22); }
  .cs-btn.done { background:linear-gradient(135deg,#16A34A,#15803D); color:white; }
  .cs-btn.done:hover { opacity:.9; }
  .cs-btn.print { background:var(--bg-surface); color:var(--tx-2);
    border:1px solid var(--border); }
  .cs-btn.print:hover { color:var(--tx); }
  .cs-btn:disabled { opacity:.5; cursor:not-allowed; }
  .cs-autosave { font-size:.72rem; color:var(--tx-3);
    display:flex; align-items:center; gap:4px; }

  /* ── Content ── */
  .cs-content { max-width:800px; margin:0 auto; padding:24px 20px; }

  /* ── Patient header ── */
  .cs-patient-header {
    background:var(--bg-surface); border:1px solid var(--border);
    border-radius:14px; padding:16px 20px; margin-bottom:20px;
    display:flex; align-items:center; gap:14px;
  }
  .cs-pt-avatar {
    width:48px; height:48px; border-radius:50%;
    background:linear-gradient(135deg,#0EA5E9,#38BDF8);
    display:flex; align-items:center; justify-content:center;
    font-size:1rem; font-weight:800; color:white; flex-shrink:0;
  }
  .cs-pt-name { font-weight:700; font-size:1rem; color:var(--tx); }
  .cs-pt-meta { font-size:.78rem; color:var(--tx-2); margin-top:3px; }
  .cs-pt-badges { display:flex; gap:5px; margin-top:6px; flex-wrap:wrap; }
  .cs-badge-crit { padding:2px 8px; border-radius:20px; font-size:.65rem;
    font-weight:700; background:rgba(220,38,38,.12); color:#DC2626;
    border:1px solid rgba(220,38,38,.3); }

  /* ── Alert allergie ── */
  .cs-allergy-alert {
    display:flex; align-items:center; gap:10px;
    background:rgba(220,38,38,.1); border:1px solid rgba(220,38,38,.4);
    border-radius:12px; padding:12px 16px; margin-bottom:16px;
    animation:csAlertPulse 2s infinite;
  }
  @keyframes csAlertPulse {
    0%,100%{border-color:rgba(220,38,38,.4)} 50%{border-color:rgba(220,38,38,.8)}
  }
  .cs-allergy-text { font-size:.83rem; font-weight:700; color:#DC2626; }

  /* ── Sections accordéon ── */
  .cs-section {
    background:var(--bg-surface); border:1px solid var(--border);
    border-radius:14px; overflow:hidden; margin-bottom:12px;
  }
  .cs-section-header {
    display:flex; align-items:center; justify-content:space-between;
    padding:14px 18px; cursor:pointer; transition:background .15s;
    border-bottom:1px solid transparent;
    user-select:none;
  }
  .cs-section-header:hover { background:var(--bg-hover); }
  .cs-section-header.open { border-bottom-color:var(--border); }
  .cs-section-title { display:flex; align-items:center; gap:10px;
    font-weight:700; font-size:.88rem; color:var(--tx); }
  .cs-section-icon { width:32px; height:32px; border-radius:9px;
    display:flex; align-items:center; justify-content:center; flex-shrink:0; }
  .cs-section-icon.blue   { background:rgba(14,165,233,.1); color:#0EA5E9; }
  .cs-section-icon.green  { background:rgba(16,185,129,.1);  color:var(--green); }
  .cs-section-icon.violet { background:rgba(99,102,241,.1);  color:var(--ac); }
  .cs-section-icon.gold   { background:rgba(245,158,11,.1);  color:var(--gold); }
  .cs-section-icon.red    { background:rgba(248,113,113,.1); color:var(--red); }
  .cs-section-body { padding:18px; }

  /* ── Form elements ── */
  .cs-form-group { margin-bottom:14px; }
  .cs-form-row { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  @media (max-width:600px) { .cs-form-row { grid-template-columns:1fr; } }
  .cs-label { display:block; font-size:.73rem; font-weight:600;
    color:var(--tx-2); margin-bottom:6px; letter-spacing:.03em; }
  .cs-textarea {
    width:100%; padding:10px 13px; border-radius:10px;
    border:1px solid var(--border); background:var(--bg-base);
    color:var(--tx); font-size:.875rem; outline:none;
    transition:border-color .15s; resize:vertical; min-height:80px;
    font-family:var(--font-body); box-sizing:border-box;
  }
  .cs-textarea:focus { border-color:#0EA5E9; box-shadow:0 0 0 3px rgba(14,165,233,.1); }
  .cs-input {
    width:100%; padding:9px 13px; border-radius:10px;
    border:1px solid var(--border); background:var(--bg-base);
    color:var(--tx); font-size:.875rem; outline:none;
    transition:border-color .15s; box-sizing:border-box;
  }
  .cs-input:focus { border-color:#0EA5E9; box-shadow:0 0 0 3px rgba(14,165,233,.1); }

  /* ── Checkboxes examen clinique ── */
  .cs-check-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(160px,1fr)); gap:8px; }
  .cs-check-item {
    display:flex; align-items:center; gap:8px; padding:8px 10px;
    border-radius:8px; border:1px solid var(--border);
    cursor:pointer; transition:all .15s; background:var(--bg-base);
    font-size:.8rem; color:var(--tx-2);
  }
  .cs-check-item.checked { background:rgba(14,165,233,.08);
    border-color:rgba(14,165,233,.3); color:#0EA5E9; }
  .cs-check-item input { display:none; }
  .cs-check-box { width:16px; height:16px; border-radius:4px;
    border:2px solid var(--border); flex-shrink:0; transition:all .15s;
    display:flex; align-items:center; justify-content:center; }
  .cs-check-item.checked .cs-check-box {
    background:#0EA5E9; border-color:#0EA5E9; }
  .cs-check-mark { color:white; font-size:10px; font-weight:800; }

  /* ── Ordonnances ── */
  .cs-drug-item {
    display:grid; grid-template-columns:2fr 1fr 1fr auto;
    gap:8px; align-items:center; margin-bottom:8px;
  }
  @media (max-width:600px) { .cs-drug-item { grid-template-columns:1fr 1fr; } }
  .cs-drug-remove {
    width:32px; height:32px; display:flex; align-items:center;
    justify-content:center; border-radius:8px; border:1px solid rgba(248,113,113,.3);
    background:rgba(248,113,113,.08); color:var(--red);
    cursor:pointer; transition:all .15s; flex-shrink:0;
  }
  .cs-drug-remove:hover { background:rgba(248,113,113,.18); }
  .cs-add-drug {
    display:flex; align-items:center; gap:6px; padding:8px 14px;
    border-radius:9px; border:1px dashed rgba(14,165,233,.4);
    background:rgba(14,165,233,.04); color:#0EA5E9;
    cursor:pointer; font-size:.8rem; font-weight:600;
    transition:all .15s; margin-top:8px;
  }
  .cs-add-drug:hover { background:rgba(14,165,233,.1); border-style:solid; }

  /* ── Status bar ── */
  .cs-status-bar {
    position:fixed; bottom:0; left:0; right:0; z-index:200;
    padding:12px 20px; background:rgba(8,11,20,.95);
    border-top:1px solid var(--border); backdrop-filter:blur(20px);
    display:flex; align-items:center; justify-content:space-between;
    gap:12px;
  }
  .cs-status-info { font-size:.78rem; color:var(--tx-3); }
  .cs-status-actions { display:flex; gap:8px; }

  /* ── Toast ── */
  .cs-toast {
    position:fixed; bottom:80px; left:50%; transform:translateX(-50%);
    padding:10px 20px; border-radius:10px; font-size:.85rem; font-weight:600;
    z-index:9999; white-space:nowrap; animation:csSlide .2s;
  }
  @keyframes csSlide { from{opacity:0;transform:translateX(-50%) translateY(10px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
  .cs-toast.success { background:var(--green); color:white; }
  .cs-toast.error   { background:var(--red);   color:white; }
  .cs-toast.info    { background:#0EA5E9;       color:white; }

  /* ── Print styles ── */
  @media print {
    .cs-topbar, .cs-status-bar, .cs-back, .cs-topbar-actions { display:none !important; }
    .cs-root { background:white; }
    .cs-section { border:1px solid #ddd; page-break-inside:avoid; }
    .cs-content { max-width:100%; padding:0; }
    .cs-patient-header { border:1px solid #ddd; }
    .cs-textarea, .cs-input { border:1px solid #ddd; background:white; color:#000; }
  }
`

const EXAMEN_ITEMS = [
  'Cardiovasculaire', 'Respiratoire', 'Abdomen', 'Neurologique',
  'ORL', 'Dermatologie', 'Locomoteur', 'Ophtalmologique',
  'Urogénital', 'Endocrinien', 'Psychologique', 'Général'
]

function calcAge(dob) {
  if (!dob) return null
  return Math.floor((Date.now() - new Date(dob).getTime()) / (1000*60*60*24*365.25))
}
function initials(fn, ln) {
  return `${(fn||'')[0]||''}${(ln||'')[0]||''}`.toUpperCase()
}

function ConsultationInner() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const patientId    = searchParams.get('patient_id')
  const consultId    = searchParams.get('consult_id') // reprise d'un brouillon

  const [user,    setUser]    = useState(null)
  const [patient, setPatient] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [toast,   setToast]   = useState(null)
  const [consultationId, setConsultationId] = useState(consultId || null)

  // Sections ouvertes
  const [openSections, setOpenSections] = useState({
    motif: true, anamnese: false, examen: false,
    diagnostic: false, traitement: false, notes: false
  })

  // Formulaire
  const [form, setForm] = useState({
    motif:           '',
    anamnese:        '',
    examen_clinique: '',
    diagnostic:      '',
    traitement:      '',
    notes:           '',
  })
  const [examenChecks, setExamenChecks] = useState({})
  const [prescriptions, setPrescriptions] = useState([
    { drug:'', dosage:'', duration:'', instructions:'' }
  ])

  const toastRef   = useRef(null)
  const autoSaveRef = useRef(null)

  function showToast(msg, type='success') {
    setToast({ msg, type })
    if (toastRef.current) clearTimeout(toastRef.current)
    toastRef.current = setTimeout(() => setToast(null), 3000)
  }

  function toggleSection(key) {
    setOpenSections(s => ({ ...s, [key]: !s[key] }))
  }

  /* ── Auth + chargement patient ── */
  useEffect(() => {
    async function init() {
      try {
        const { data: { user: u } } = await supabase.auth.getUser()
        if (!u) { router.push('/apps/medical/login'); return }

        const { data: userData } = await supabase
          .from('users').select('role, tenant_id, app_type')
          .eq('id', u.id).maybeSingle()

        if (!userData || userData.role !== 'tenant_admin' || userData.app_type !== 'medical') {
          router.push('/apps/medical/login'); return
        }
        setUser({ ...u, ...userData })

        if (!patientId) { router.push('/apps/medical/doctor'); return }

        const { data: pt } = await supabase
          .from('med_patients').select('*').eq('id', patientId).maybeSingle()
        if (!pt) { router.push('/apps/medical/doctor'); return }
        setPatient(pt)

        // Reprendre un brouillon existant
        if (consultId) {
          const { data: c } = await supabase
            .from('med_consultations').select('*').eq('id', consultId).maybeSingle()
          if (c) {
            setForm({
              motif:           c.motif || '',
              anamnese:        c.anamnese || '',
              examen_clinique: c.examen_clinique || '',
              diagnostic:      c.diagnostic || '',
              traitement:      c.traitement || '',
              notes:           c.notes || '',
            })
            if (c.prescriptions?.length) setPrescriptions(c.prescriptions)
          }
        }
      } catch { router.push('/apps/medical/login') }
      finally { setLoading(false) }
    }
    init()
  }, [router, patientId, consultId])

  /* ── Auto-save toutes les 30s ── */
  const saveConsultation = useCallback(async (status = 'draft') => {
    if (!user || !patientId) return
    setSaving(true)
    try {
      const examenText = Object.entries(examenChecks)
        .filter(([,v]) => v).map(([k]) => k).join(', ')
      
      const payload = {
        ...form,
        examen_clinique: examenText + (form.examen_clinique ? '\n' + form.examen_clinique : ''),
        prescriptions: prescriptions.filter(p => p.drug.trim()),
        status,
        tenant_id:  user.tenant_id,
        patient_id: patientId,
      }

      if (consultationId) {
        await supabase.from('med_consultations').update(payload).eq('id', consultationId)
      } else {
        const { data } = await supabase.from('med_consultations')
          .insert({ ...payload, created_by: user.id })
          .select('id').single()
        if (data?.id) setConsultationId(data.id)
      }

      setSaved(true)
      if (status === 'done') {
        // Mettre à jour last_visit du patient
        await supabase.from('med_patients')
          .update({ last_visit: new Date().toISOString() })
          .eq('id', patientId)
        showToast('Consultation terminée et enregistrée', 'success')
        setTimeout(() => router.push(`/apps/medical/patient-detail?id=${patientId}`), 1500)
      } else {
        showToast('Brouillon sauvegardé', 'info')
      }
    } catch {
      showToast('Erreur lors de la sauvegarde', 'error')
    }
    setSaving(false)
  }, [user, patientId, consultationId, form, examenChecks, prescriptions, router])

  useEffect(() => {
    if (!user) return
    autoSaveRef.current = setInterval(() => saveConsultation('draft'), 30000)
    return () => clearInterval(autoSaveRef.current)
  }, [user, saveConsultation])

  function addPrescription() {
    setPrescriptions(p => [...p, { drug:'', dosage:'', duration:'', instructions:'' }])
  }
  function removePrescription(i) {
    setPrescriptions(p => p.filter((_, idx) => idx !== i))
  }
  function updatePrescription(i, field, val) {
    setPrescriptions(p => p.map((item, idx) => idx === i ? { ...item, [field]: val } : item))
  }

  if (loading) return (
    <div style={{ background:'var(--bg-base)', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:140, height:8, borderRadius:4, background:'var(--bg-surface)' }} />
    </div>
  )

  if (!patient) return null

  const age = calcAge(patient.birth_date)
  const critAllergies = (patient.allergies||[]).filter(a => a.severity === 'CRITIQUE')

  return (
    <>
      <style>{CSS}</style>
      <div className="cs-root">

        {/* Topbar */}
        <div className="cs-topbar">
          <button className="cs-back" onClick={() => router.push(`/apps/medical/patient-detail?id=${patientId}`)}>
            <ArrowLeft size={15}/> Retour
          </button>
          <span className="cs-topbar-title">Nouvelle consultation</span>
          {saved && <span className="cs-autosave"><CheckCircle2 size={12} color="var(--green)"/>Sauvegardé</span>}
          <div className="cs-topbar-actions">
            <button className="cs-btn print" onClick={() => window.print()}>
              <Printer size={14}/> Imprimer
            </button>
            <button className="cs-btn save" onClick={() => saveConsultation('draft')} disabled={saving}>
              <Save size={14}/> {saving ? 'Sauvegarde…' : 'Brouillon'}
            </button>
          </div>
        </div>

        <div className="cs-content">

          {/* Alerte allergie critique */}
          {critAllergies.length > 0 && (
            <div className="cs-allergy-alert">
              <AlertCircle size={20} color="#DC2626" style={{ flexShrink:0 }}/>
              <div className="cs-allergy-text">
                ⚠ ALLERGIE(S) CRITIQUE(S) : {critAllergies.map(a => a.name).join(' · ')}
              </div>
            </div>
          )}

          {/* Patient header */}
          <div className="cs-patient-header">
            <div className="cs-pt-avatar">{initials(patient.first_name, patient.last_name)}</div>
            <div>
              <div className="cs-pt-name">{patient.first_name} {patient.last_name}</div>
              <div className="cs-pt-meta">
                {age ? `${age} ans` : ''}
                {age && patient.gender ? ' · ' : ''}
                {patient.gender}
                {patient.blood_type ? ` · ${patient.blood_type}` : ''}
              </div>
              <div className="cs-pt-badges">
                {critAllergies.map(a => (
                  <span key={a.name} className="cs-badge-crit">⚠ {a.name}</span>
                ))}
              </div>
            </div>
          </div>

          {/* 1 — Motif */}
          <div className="cs-section">
            <div className={`cs-section-header ${openSections.motif ? 'open' : ''}`}
              onClick={() => toggleSection('motif')}>
              <div className="cs-section-title">
                <div className="cs-section-icon blue"><FileText size={15}/></div>
                Motif de consultation *
              </div>
              {openSections.motif ? <ChevronUp size={16} color="var(--tx-3)"/> : <ChevronDown size={16} color="var(--tx-3)"/>}
            </div>
            {openSections.motif && (
              <div className="cs-section-body">
                <textarea className="cs-textarea" rows={3}
                  placeholder="Décrivez le motif principal de la consultation…"
                  value={form.motif}
                  onChange={e => setForm(f => ({...f, motif: e.target.value}))}
                  maxLength={1000}
                />
              </div>
            )}
          </div>

          {/* 2 — Anamnèse */}
          <div className="cs-section">
            <div className={`cs-section-header ${openSections.anamnese ? 'open' : ''}`}
              onClick={() => toggleSection('anamnese')}>
              <div className="cs-section-title">
                <div className="cs-section-icon gold"><User size={15}/></div>
                Anamnèse
              </div>
              {openSections.anamnese ? <ChevronUp size={16} color="var(--tx-3)"/> : <ChevronDown size={16} color="var(--tx-3)"/>}
            </div>
            {openSections.anamnese && (
              <div className="cs-section-body">
                <textarea className="cs-textarea" rows={4}
                  placeholder="Histoire de la maladie, antécédents pertinents, traitements en cours…"
                  value={form.anamnese}
                  onChange={e => setForm(f => ({...f, anamnese: e.target.value}))}
                  maxLength={3000}
                />
              </div>
            )}
          </div>

          {/* 3 — Examen clinique */}
          <div className="cs-section">
            <div className={`cs-section-header ${openSections.examen ? 'open' : ''}`}
              onClick={() => toggleSection('examen')}>
              <div className="cs-section-title">
                <div className="cs-section-icon blue"><Stethoscope size={15}/></div>
                Examen clinique
              </div>
              {openSections.examen ? <ChevronUp size={16} color="var(--tx-3)"/> : <ChevronDown size={16} color="var(--tx-3)"/>}
            </div>
            {openSections.examen && (
              <div className="cs-section-body">
                <label className="cs-label" style={{ marginBottom:10 }}>Systèmes examinés</label>
                <div className="cs-check-grid" style={{ marginBottom:14 }}>
                  {EXAMEN_ITEMS.map(item => (
                    <div key={item}
                      className={`cs-check-item ${examenChecks[item] ? 'checked' : ''}`}
                      onClick={() => setExamenChecks(e => ({...e, [item]: !e[item]}))}>
                      <div className="cs-check-box">
                        {examenChecks[item] && <span className="cs-check-mark">✓</span>}
                      </div>
                      {item}
                    </div>
                  ))}
                </div>
                <label className="cs-label">Notes d'examen</label>
                <textarea className="cs-textarea" rows={3}
                  placeholder="Observations cliniques détaillées…"
                  value={form.examen_clinique}
                  onChange={e => setForm(f => ({...f, examen_clinique: e.target.value}))}
                  maxLength={3000}
                />
              </div>
            )}
          </div>

          {/* 4 — Diagnostic */}
          <div className="cs-section">
            <div className={`cs-section-header ${openSections.diagnostic ? 'open' : ''}`}
              onClick={() => toggleSection('diagnostic')}>
              <div className="cs-section-title">
                <div className="cs-section-icon violet"><CheckCircle2 size={15}/></div>
                Diagnostic
              </div>
              {openSections.diagnostic ? <ChevronUp size={16} color="var(--tx-3)"/> : <ChevronDown size={16} color="var(--tx-3)"/>}
            </div>
            {openSections.diagnostic && (
              <div className="cs-section-body">
                <textarea className="cs-textarea" rows={3}
                  placeholder="Diagnostic principal, diagnostics différentiels…"
                  value={form.diagnostic}
                  onChange={e => setForm(f => ({...f, diagnostic: e.target.value}))}
                  maxLength={2000}
                />
              </div>
            )}
          </div>

          {/* 5 — Traitement & Ordonnances */}
          <div className="cs-section">
            <div className={`cs-section-header ${openSections.traitement ? 'open' : ''}`}
              onClick={() => toggleSection('traitement')}>
              <div className="cs-section-title">
                <div className="cs-section-icon green"><Pill size={15}/></div>
                Traitement & Ordonnances
              </div>
              {openSections.traitement ? <ChevronUp size={16} color="var(--tx-3)"/> : <ChevronDown size={16} color="var(--tx-3)"/>}
            </div>
            {openSections.traitement && (
              <div className="cs-section-body">
                <label className="cs-label">Conduite thérapeutique</label>
                <textarea className="cs-textarea" rows={2}
                  placeholder="Description du plan de traitement…"
                  value={form.traitement}
                  onChange={e => setForm(f => ({...f, traitement: e.target.value}))}
                  maxLength={2000}
                  style={{ marginBottom:16 }}
                />
                <label className="cs-label">Ordonnances</label>
                <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr auto', gap:6, marginBottom:6 }}>
                  <span style={{ fontSize:'.7rem', color:'var(--tx-3)', fontWeight:600 }}>Médicament</span>
                  <span style={{ fontSize:'.7rem', color:'var(--tx-3)', fontWeight:600 }}>Dosage</span>
                  <span style={{ fontSize:'.7rem', color:'var(--tx-3)', fontWeight:600 }}>Durée</span>
                  <span />
                </div>
                {prescriptions.map((p, i) => (
                  <div key={i} className="cs-drug-item">
                    <input className="cs-input" placeholder="Nom du médicament"
                      value={p.drug} maxLength={100}
                      onChange={e => updatePrescription(i, 'drug', e.target.value)}/>
                    <input className="cs-input" placeholder="ex: 500mg"
                      value={p.dosage} maxLength={50}
                      onChange={e => updatePrescription(i, 'dosage', e.target.value)}/>
                    <input className="cs-input" placeholder="ex: 7 jours"
                      value={p.duration} maxLength={50}
                      onChange={e => updatePrescription(i, 'duration', e.target.value)}/>
                    <button className="cs-drug-remove" onClick={() => removePrescription(i)}>
                      <Trash2 size={13}/>
                    </button>
                  </div>
                ))}
                <button className="cs-add-drug" onClick={addPrescription}>
                  <Plus size={14}/> Ajouter un médicament
                </button>
              </div>
            )}
          </div>

          {/* 6 — Notes complémentaires */}
          <div className="cs-section">
            <div className={`cs-section-header ${openSections.notes ? 'open' : ''}`}
              onClick={() => toggleSection('notes')}>
              <div className="cs-section-title">
                <div className="cs-section-icon gold"><FileText size={15}/></div>
                Notes complémentaires
              </div>
              {openSections.notes ? <ChevronUp size={16} color="var(--tx-3)"/> : <ChevronDown size={16} color="var(--tx-3)"/>}
            </div>
            {openSections.notes && (
              <div className="cs-section-body">
                <textarea className="cs-textarea" rows={3}
                  placeholder="Recommandations, suivi, examens complémentaires à prévoir…"
                  value={form.notes}
                  onChange={e => setForm(f => ({...f, notes: e.target.value}))}
                  maxLength={2000}
                />
              </div>
            )}
          </div>

          {/* Espace pour la barre fixe */}
          <div style={{ height: 80 }} />
        </div>

        {/* Barre de statut fixe en bas */}
        <div className="cs-status-bar">
          <div className="cs-status-info">
            <Clock size={12} style={{ display:'inline', verticalAlign:'middle', marginRight:4 }}/>
            Auto-sauvegarde toutes les 30 secondes
          </div>
          <div className="cs-status-actions">
            <button className="cs-btn ghost"
              onClick={() => router.push(`/apps/medical/patient-detail?id=${patientId}`)}>
              Annuler
            </button>
            <button className="cs-btn save" onClick={() => saveConsultation('draft')} disabled={saving}>
              <Save size={13}/> Sauvegarder
            </button>
            <button className="cs-btn done" onClick={() => saveConsultation('done')} disabled={saving}>
              <CheckCircle2 size={13}/> Terminer la consultation
            </button>
          </div>
        </div>

        {/* Toast */}
        {toast && <div className={`cs-toast ${toast.type}`}>{toast.msg}</div>}
      </div>
    </>
  )
}

export default function Consultation() {
  return (
    <Suspense fallback={
      <div style={{ background:'var(--bg-base)', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ width:140, height:8, borderRadius:4, background:'var(--bg-surface)' }} />
      </div>
    }>
      <ConsultationInner />
    </Suspense>
  )
}
