'use client'
import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowLeft, User, Phone, MapPin, Heart, AlertCircle,
  CalendarDays, FileText, Plus, Clock, CheckCircle2,
  Stethoscope, Pill, ChevronRight, Edit2, LogOut, MessageSquare, FolderOpen
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

const CSS = `
  .pd-root {
    min-height: 100vh;
    background: var(--bg-base);
    padding-bottom: 40px;
  }

  /* ── Topbar ── */
  .pd-topbar {
    position: sticky; top: 0; z-index: 100;
    height: 56px; display: flex; align-items: center;
    padding: 0 20px; gap: 12px;
    background: rgba(8,11,20,.95);
    border-bottom: 1px solid var(--border);
    backdrop-filter: blur(20px);
  }
  .pd-back {
    display: flex; align-items: center; gap: 6px;
    color: var(--tx-2); font-size: .85rem; font-weight: 600;
    cursor: pointer; background: none; border: none;
    transition: color .15s; padding: 0;
  }
  .pd-back:hover { color: #0EA5E9; }
  .pd-topbar-title {
    font-family: var(--font-display); font-weight: 700;
    font-size: .95rem; color: var(--tx); flex: 1;
  }

  /* ── Content ── */
  .pd-content {
    max-width: 860px; margin: 0 auto; padding: 24px 20px;
  }

  /* ── Hero patient ── */
  .pd-hero {
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: 18px; padding: 24px;
    margin-bottom: 20px;
    display: flex; align-items: flex-start; gap: 20px;
    position: relative; overflow: hidden;
  }
  .pd-hero::before {
    content: ''; position: absolute;
    top: 0; left: 0; right: 0; height: 3px;
    background: linear-gradient(90deg, #0EA5E9, #38BDF8);
  }
  .pd-avatar {
    width: 72px; height: 72px; border-radius: 50%;
    background: linear-gradient(135deg, #0EA5E9, #38BDF8);
    display: flex; align-items: center; justify-content: center;
    font-size: 1.6rem; font-weight: 800; color: white;
    flex-shrink: 0;
  }
  .pd-hero-info { flex: 1; min-width: 0; }
  .pd-name {
    font-family: var(--font-display);
    font-size: 1.4rem; font-weight: 800; color: var(--tx);
    margin-bottom: 4px;
  }
  .pd-meta {
    display: flex; flex-wrap: wrap; gap: 10px;
    font-size: .8rem; color: var(--tx-2); margin-bottom: 12px;
  }
  .pd-meta-item {
    display: flex; align-items: center; gap: 4px;
  }
  .pd-blood-type {
    display: inline-block; padding: 2px 10px;
    border-radius: 20px; font-size: .75rem; font-weight: 800;
    background: rgba(220,38,38,.12); color: #DC2626;
    border: 1px solid rgba(220,38,38,.25);
  }
  .pd-badges { display: flex; flex-wrap: wrap; gap: 6px; }
  .pd-badge {
    padding: 3px 10px; border-radius: 20px;
    font-size: .68rem; font-weight: 700;
  }
  .pd-badge.crit    { background:rgba(220,38,38,.12); color:#DC2626; border:1px solid rgba(220,38,38,.25); }
  .pd-badge.mod     { background:rgba(251,191,36,.1);  color:var(--yellow); border:1px solid rgba(251,191,36,.2); }
  .pd-badge.leg     { background:rgba(16,185,129,.1);  color:var(--green);  border:1px solid rgba(16,185,129,.2); }
  .pd-badge.chronic { background:rgba(99,102,241,.1);  color:var(--ac);     border:1px solid rgba(99,102,241,.2); }

  /* ── CTA Consultation ── */
  .pd-cta {
    display: flex; align-items: center; justify-content: space-between;
    background: linear-gradient(135deg, rgba(14,165,233,.12), rgba(56,189,248,.06));
    border: 1px solid rgba(14,165,233,.3);
    border-radius: 14px; padding: 16px 20px;
    margin-bottom: 20px; cursor: pointer;
    transition: all .2s;
  }
  .pd-cta:hover {
    background: linear-gradient(135deg, rgba(14,165,233,.2), rgba(56,189,248,.1));
    border-color: rgba(14,165,233,.5);
    transform: translateY(-1px);
  }
  .pd-cta-left { display: flex; align-items: center; gap: 14px; }
  .pd-cta-icon {
    width: 44px; height: 44px; border-radius: 12px;
    background: linear-gradient(135deg, #0EA5E9, #0284C7);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 14px rgba(14,165,233,.35);
  }
  .pd-cta-title {
    font-weight: 700; font-size: .95rem; color: var(--tx);
  }
  .pd-cta-sub {
    font-size: .75rem; color: var(--tx-2); margin-top: 2px;
  }

  /* ── Alert allergie critique ── */
  .pd-alert-crit {
    display: flex; align-items: center; gap: 12px;
    background: rgba(220,38,38,.1);
    border: 1px solid rgba(220,38,38,.35);
    border-radius: 12px; padding: 14px 18px;
    margin-bottom: 20px;
    animation: pdPulse 2s infinite;
  }
  @keyframes pdPulse {
    0%,100% { border-color: rgba(220,38,38,.35); }
    50%      { border-color: rgba(220,38,38,.7); }
  }
  .pd-alert-text { flex: 1; }
  .pd-alert-title { font-weight: 700; color: #DC2626; font-size: .88rem; }
  .pd-alert-list  { font-size: .78rem; color: rgba(220,38,38,.85); margin-top: 3px; }

  /* ── Sections ── */
  .pd-section {
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: 14px; overflow: hidden;
    margin-bottom: 16px;
  }
  .pd-section-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 18px; border-bottom: 1px solid var(--border);
  }
  .pd-section-title {
    font-weight: 700; font-size: .88rem; color: var(--tx);
    display: flex; align-items: center; gap: 8px;
  }
  .pd-section-body { padding: 16px 18px; }
  .pd-empty-section {
    padding: 24px 18px; text-align: center;
    color: var(--tx-3); font-size: .82rem;
  }

  /* ── Info grid ── */
  .pd-info-grid {
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 14px;
  }
  @media (max-width: 480px) { .pd-info-grid { grid-template-columns: 1fr; } }
  .pd-info-label {
    font-size: .7rem; font-weight: 600; letter-spacing: .05em;
    text-transform: uppercase; color: var(--tx-3); margin-bottom: 4px;
  }
  .pd-info-value {
    font-size: .875rem; font-weight: 600; color: var(--tx);
  }

  /* ── Timeline consultations ── */
  .pd-consult-item {
    display: flex; gap: 14px; padding: 14px 18px;
    border-bottom: 1px solid var(--border);
    cursor: pointer; transition: background .15s;
  }
  .pd-consult-item:last-child { border-bottom: none; }
  .pd-consult-item:hover { background: var(--bg-hover); }
  .pd-consult-dot {
    width: 36px; height: 36px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .pd-consult-dot.done  { background: rgba(16,185,129,.1);  color: var(--green); }
  .pd-consult-dot.draft { background: rgba(251,191,36,.1);  color: var(--yellow); }
  .pd-consult-info { flex: 1; min-width: 0; }
  .pd-consult-date {
    font-weight: 700; font-size: .85rem; color: var(--tx);
  }
  .pd-consult-motif {
    font-size: .78rem; color: var(--tx-2); margin-top: 2px;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .pd-consult-diag {
    font-size: .73rem; color: var(--tx-3); margin-top: 3px;
  }

  /* ── RDV items ── */
  .pd-appt-item {
    display: flex; align-items: center; gap: 12px;
    padding: 12px 18px; border-bottom: 1px solid var(--border);
  }
  .pd-appt-item:last-child { border-bottom: none; }
  .pd-appt-icon {
    width: 34px; height: 34px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    background: rgba(14,165,233,.1); color: #0EA5E9; flex-shrink: 0;
  }
  .pd-appt-info { flex: 1; }
  .pd-appt-date { font-weight: 600; font-size: .85rem; color: var(--tx); }
  .pd-appt-sub  { font-size: .72rem; color: var(--tx-3); margin-top: 2px; }
  .pd-status {
    padding: 2px 8px; border-radius: 20px;
    font-size: .66rem; font-weight: 700;
  }
  .pd-status.pending   { background:rgba(251,191,36,.1); color:var(--yellow); }
  .pd-status.confirmed { background:rgba(14,165,233,.1); color:#0EA5E9; }
  .pd-status.done      { background:rgba(16,185,129,.1); color:var(--green); }
  .pd-status.cancelled { background:rgba(248,113,113,.1);color:var(--red); }

  /* ── Skeleton ── */
  .pd-skeleton {
    background: linear-gradient(90deg, var(--bg-surface) 25%, var(--bg-hover) 50%, var(--bg-surface) 75%);
    background-size: 200% 100%;
    animation: pdShimmer 1.5s infinite; border-radius: 8px;
  }
  @keyframes pdShimmer { 0%{background-position:200%} 100%{background-position:-200%} }
`

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-TN', { day:'2-digit', month:'long', year:'numeric' })
}
function formatDateTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-TN', { weekday:'short', day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })
}
function calcAge(dob) {
  if (!dob) return null
  return Math.floor((Date.now() - new Date(dob).getTime()) / (1000*60*60*24*365.25))
}
function initials(fn, ln) {
  return `${(fn||'')[0]||''}${(ln||'')[0]||''}`.toUpperCase()
}

function PatientDetailInner() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const patientId    = searchParams.get('id')

  const [user,        setUser]        = useState(null)
  const [doctorName,  setDoctorName]  = useState('')
  const [patient,     setPatient]     = useState(null)
  const [consultations, setConsults]  = useState([])
  const [appointments,  setAppts]     = useState([])
  const [loading,     setLoading]     = useState(true)

  /* ── Auth guard ── */
  useEffect(() => {
    async function init() {
      try {
        const { data: { user: u } } = await supabase.auth.getUser()
        if (!u) { router.push('/apps/medical/login'); return }

        const { data: userData } = await supabase
          .from('users')
          .select('role, tenant_id, app_type')
          .eq('id', u.id)
          .maybeSingle()

        if (!userData || userData.app_type !== 'medical') {
          router.push('/apps/medical/login'); return
        }
        setUser({ ...u, ...userData })
        if (userData.full_name) setDoctorName(userData.full_name)

        if (!patientId) { router.push('/apps/medical/doctor'); return }

        // Charger patient
        const { data: pt } = await supabase
          .from('med_patients')
          .select('*')
          .eq('id', patientId)
          .maybeSingle()

        if (!pt) { router.push('/apps/medical/doctor'); return }
        setPatient(pt)

        // Charger consultations
        const { data: consults } = await supabase
          .from('med_consultations')
          .select('id, created_at, motif, diagnostic, status, duration_min')
          .eq('patient_id', patientId)
          .order('created_at', { ascending: false })
          .limit(10)
        setConsults(consults || [])

        // Charger RDV
        const { data: appts } = await supabase
          .from('med_appointments')
          .select('id, scheduled_at, duration_min, type, status, reason')
          .eq('patient_id', patientId)
          .order('scheduled_at', { ascending: false })
          .limit(10)
        setAppts(appts || [])

      } catch { router.push('/apps/medical/login') }
      finally { setLoading(false) }
    }
    init()
  }, [router, patientId])

  const goToConsultation = useCallback(() => {
    router.push(`/apps/medical/consultation?patient_id=${patientId}`)
  }, [router, patientId])

  if (loading) return (
    <div style={{ background:'var(--bg-base)', minHeight:'100vh' }}>
      <div style={{ maxWidth:860, margin:'0 auto', padding:'24px 20px' }}>
        <div className="pd-skeleton" style={{ height:200, marginBottom:16, borderRadius:18 }} />
        <div className="pd-skeleton" style={{ height:80,  marginBottom:16, borderRadius:14 }} />
        <div className="pd-skeleton" style={{ height:160, marginBottom:16, borderRadius:14 }} />
      </div>
    </div>
  )

  if (!patient) return null

  const age          = calcAge(patient.birth_date)
  const critAllergies = (patient.allergies||[]).filter(a => a.severity === 'CRITIQUE')
  const modAllergies  = (patient.allergies||[]).filter(a => a.severity === 'MODERE')
  const legAllergies  = (patient.allergies||[]).filter(a => a.severity === 'LEGER')
  const isDoctor      = user?.role === 'tenant_admin'

  return (
    <>
      <style>{CSS}</style>
      <div className="pd-root">

        {/* Topbar */}
        <div className="pd-topbar">
          <button className="pd-back" onClick={() => router.push('/apps/medical/doctor')}>
            <ArrowLeft size={16} /> Retour
          </button>
          <span className="pd-topbar-title">Dossier patient</span>
        </div>

        <div className="pd-content">

          {/* Alerte allergie critique */}
          {critAllergies.length > 0 && (
            <div className="pd-alert-crit">
              <AlertCircle size={22} color="#DC2626" style={{ flexShrink:0 }} />
              <div className="pd-alert-text">
                <div className="pd-alert-title">⚠ Allergie(s) CRITIQUE(S)</div>
                <div className="pd-alert-list">
                  {critAllergies.map(a => a.name).join(' · ')}
                </div>
              </div>
            </div>
          )}

          {/* Hero */}
          <div className="pd-hero">
            <div className="pd-avatar">{initials(patient.first_name, patient.last_name)}</div>
            <div className="pd-hero-info">
              <div className="pd-name">{patient.first_name} {patient.last_name}</div>
              <div className="pd-meta">
                {age && <span className="pd-meta-item"><User size={12}/> {age} ans</span>}
                {patient.gender && <span className="pd-meta-item" style={{ textTransform:'capitalize' }}>{patient.gender}</span>}
                {patient.blood_type && <span className="pd-blood-type">{patient.blood_type}</span>}
                {patient.phone && <span className="pd-meta-item"><Phone size={12}/> {patient.phone}</span>}
                {patient.city && <span className="pd-meta-item"><MapPin size={12}/> {patient.city}</span>}
              </div>
              <div className="pd-badges">
                {critAllergies.map(a => <span key={a.name} className="pd-badge crit">⚠ {a.name}</span>)}
                {modAllergies.map(a  => <span key={a.name} className="pd-badge mod">{a.name}</span>)}
                {legAllergies.map(a  => <span key={a.name} className="pd-badge leg">{a.name}</span>)}
                {(patient.chronic_cond||[]).map(c => <span key={c} className="pd-badge chronic">{c}</span>)}
              </div>
              {patient.last_visit && (
                <div style={{ fontSize:'.72rem', color:'var(--tx-3)', marginTop:8 }}>
                  Dernière visite : {formatDate(patient.last_visit)}
                </div>
              )}
            </div>
          </div>

          {/* CTA IA + Consultation */}
          {isDoctor && (
            <div style={{ display:'flex', gap:10, marginBottom:14 }}>
              <button onClick={() => router.push('/apps/medical/ai?patient=' + patientId)}
                style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'10px 16px', borderRadius:12, border:'1px solid rgba(99,102,241,.35)', background:'rgba(99,102,241,.08)', color:'#A78BFA', fontWeight:700, fontSize:'.82rem', cursor:'pointer' }}>
                🧠 Analyser avec l'IA
              </button>
            </div>
          )}
          {/* CTA Nouvelle consultation — médecin uniquement */}
          {isDoctor && (
            <div className="pd-cta" onClick={goToConsultation}>
              <div className="pd-cta-left">
                <div className="pd-cta-icon">
                  <Stethoscope size={20} color="white" />
                </div>
                <div>
                  <div className="pd-cta-title">Nouvelle consultation</div>
                  <div className="pd-cta-sub">Démarrer une consultation pour ce patient</div>
                </div>
              </div>
              <ChevronRight size={18} color="var(--tx-2)" />
            </div>
          )}

          {/* CTA Message — disponible pour tous */}
          <div style={{ display:'flex', gap:10, marginBottom:20 }}>
            {isDoctor && patient.phone && (
              <a href={`https://wa.me/216${patient.phone.replace(/\D/g,'')}?text=Bonjour ${patient.first_name}, Dr ${doctorName?.split(' ').pop() || ''} ici.`}
                target="_blank" rel="noreferrer"
                style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'10px 16px', borderRadius:12, border:'1px solid rgba(37,211,102,.35)', background:'rgba(37,211,102,.08)', color:'#25D366', fontWeight:700, fontSize:'.82rem', textDecoration:'none', transition:'all .2s' }}>
                <Phone size={15}/> WhatsApp
              </a>
            )}
            {patient.user_id && (
              <button
                onClick={() => router.push('/apps/medical/messagerie?contact=' + patient.user_id)}
                style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'10px 16px', borderRadius:12, border:'1px solid rgba(14,165,233,.35)', background:'rgba(14,165,233,.08)', color:'#0EA5E9', fontWeight:700, fontSize:'.82rem', cursor:'pointer', transition:'all .2s' }}>
                <MessageSquare size={15}/> Message
              </button>
            )}
          </div>

          {/* Informations personnelles */}
          <div className="pd-section">
            <div className="pd-section-header">
              <div className="pd-section-title"><User size={15} color="#0EA5E9"/>Informations</div>
            </div>
            <div className="pd-section-body">
              <div className="pd-info-grid">
                <div>
                  <div className="pd-info-label">Date de naissance</div>
                  <div className="pd-info-value">{patient.birth_date ? formatDate(patient.birth_date) : '—'}</div>
                </div>
                <div>
                  <div className="pd-info-label">Email</div>
                  <div className="pd-info-value" style={{ fontSize:'.82rem' }}>{patient.email || '—'}</div>
                </div>
                <div>
                  <div className="pd-info-label">Adresse</div>
                  <div className="pd-info-value">{patient.address || '—'}</div>
                </div>
                <div>
                  <div className="pd-info-label">Ville</div>
                  <div className="pd-info-value">{patient.city || '—'}</div>
                </div>
                {patient.emergency_name && <>
                  <div>
                    <div className="pd-info-label">Contact urgence</div>
                    <div className="pd-info-value">{patient.emergency_name}</div>
                  </div>
                  <div>
                    <div className="pd-info-label">Tél. urgence</div>
                    <div className="pd-info-value">{patient.emergency_phone || '—'}</div>
                  </div>
                </>}
              </div>
            </div>
          </div>

          {/* Consultations (médecin uniquement) */}
          {isDoctor && (
            <div className="pd-section">
              <div className="pd-section-header">
                <div className="pd-section-title">
                  <FileText size={15} color="#0EA5E9"/>
                  Consultations ({consultations.length})
                </div>
                <button onClick={goToConsultation} style={{
                  display:'flex', alignItems:'center', gap:5,
                  padding:'5px 12px', borderRadius:8, border:'1px solid rgba(14,165,233,.3)',
                  background:'rgba(14,165,233,.08)', color:'#0EA5E9',
                  fontSize:'.75rem', fontWeight:700, cursor:'pointer'
                }}>
                  <Plus size={13}/> Nouvelle
                </button>
              </div>
              {consultations.length === 0 ? (
                <div className="pd-empty-section">
                  <FileText size={28} style={{ margin:'0 auto 8px', display:'block', opacity:.3 }}/>
                  Aucune consultation enregistrée
                </div>
              ) : consultations.map(c => (
                <div key={c.id} className="pd-consult-item">
                  <div className={`pd-consult-dot ${c.status}`}>
                    {c.status === 'done'
                      ? <CheckCircle2 size={16}/>
                      : <Clock size={16}/>}
                  </div>
                  <div className="pd-consult-info">
                    <div className="pd-consult-date">{formatDate(c.created_at)}</div>
                    <div className="pd-consult-motif">{c.motif || 'Motif non renseigné'}</div>
                    {c.diagnostic && <div className="pd-consult-diag">Diagnostic : {c.diagnostic}</div>}
                  </div>
                  <span style={{ fontSize:'.7rem', color:'var(--tx-3)', flexShrink:0 }}>
                    {c.duration_min ? `${c.duration_min}min` : ''}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Rendez-vous */}
          <div className="pd-section">
            <div className="pd-section-header">
              <div className="pd-section-title">
                <CalendarDays size={15} color="#0EA5E9"/>
                Rendez-vous ({appointments.length})
              </div>
            </div>
            {appointments.length === 0 ? (
              <div className="pd-empty-section">
                <CalendarDays size={28} style={{ margin:'0 auto 8px', display:'block', opacity:.3 }}/>
                Aucun rendez-vous
              </div>
            ) : appointments.map(a => (
              <div key={a.id} className="pd-appt-item">
                <div className="pd-appt-icon"><CalendarDays size={16}/></div>
                <div className="pd-appt-info">
                  <div className="pd-appt-date">{formatDateTime(a.scheduled_at)}</div>
                  <div className="pd-appt-sub">
                    {a.duration_min}min
                    {a.type === 'telemedicine' && ' · Vidéo'}
                    {a.reason && ` · ${a.reason}`}
                  </div>
                </div>
                <span className={`pd-status ${a.status}`}>
                  {a.status==='pending'?'En attente':a.status==='confirmed'?'Confirmé':a.status==='done'?'Terminé':'Annulé'}
                </span>
              </div>
            ))}
          </div>

          {/* Documents patient */}
          {isDoctor && (
            <PatientDocuments patientId={patient.id} tenantId={user.tenant_id} />
          )}

          {/* Médicaments en cours */}
          {isDoctor && (patient.current_meds||[]).length > 0 && (
            <div className="pd-section">
              <div className="pd-section-header">
                <div className="pd-section-title"><Pill size={15} color="#0EA5E9"/>Médicaments en cours</div>
              </div>
              <div className="pd-section-body">
                {(patient.current_meds||[]).map((m, i) => (
                  <div key={i} style={{
                    padding:'8px 12px', background:'var(--bg-elevated)',
                    borderRadius:8, marginBottom:6, fontSize:'.85rem', color:'var(--tx)'
                  }}>{m}</div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  )
}

function PatientDocuments({ patientId, tenantId }) {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('med_files')
        .select('id, file_name, file_type, category, public_url, created_at, description')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })
        .limit(20)
      setFiles(data || [])
      setLoading(false)
    }
    load()
  }, [patientId])

  if (loading) return null
  if (files.length === 0) return (
    <div className="pd-section" style={{ marginBottom:16 }}>
      <div className="pd-section-header">
        <div className="pd-section-title"><FolderOpen size={15} color="#0EA5E9"/>Documents ({files.length})</div>
      </div>
      <div className="pd-empty-section">Aucun document — les fichiers envoyés dans la messagerie apparaîtront ici</div>
    </div>
  )

  return (
    <div className="pd-section" style={{ marginBottom:16 }}>
      <div className="pd-section-header">
        <div className="pd-section-title"><FolderOpen size={15} color="#0EA5E9"/>Documents ({files.length})</div>
      </div>
      {files.map(f => (
        <div key={f.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 18px', borderBottom:'1px solid var(--border)' }}>
          <div style={{ width:34, height:34, borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
            background: f.category==='image' ? 'rgba(14,165,233,.1)' : f.category==='audio' ? 'rgba(99,102,241,.1)' : 'rgba(245,158,11,.1)',
            color: f.category==='image' ? '#0EA5E9' : f.category==='audio' ? 'var(--ac)' : 'var(--gold)',
            fontSize:'.7rem', fontWeight:800 }}>
            {f.category==='image'?'IMG':f.category==='audio'?'MIC':'DOC'}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontWeight:600, fontSize:'.83rem', color:'var(--tx)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{f.file_name}</div>
            <div style={{ fontSize:'.7rem', color:'var(--tx-3)', marginTop:2 }}>
              {new Date(f.created_at).toLocaleDateString('fr-TN', {day:'2-digit',month:'short',year:'numeric'})}
              {f.description && ' · ' + f.description}
            </div>
          </div>
          {f.public_url && (
            <a href={f.public_url} target="_blank" rel="noreferrer"
              style={{ padding:'4px 12px', borderRadius:8, border:'1px solid var(--border)', background:'var(--bg-base)', color:'var(--tx-2)', fontSize:'.72rem', fontWeight:600, textDecoration:'none' }}>
              Ouvrir
            </a>
          )}
        </div>
      ))}
    </div>
  )
}

export default function PatientDetail() {
  return (
    <Suspense fallback={
      <div style={{ background:'var(--bg-base)', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ width:140, height:8, borderRadius:4, background:'var(--bg-surface)' }} />
      </div>
    }>
      <PatientDetailInner />
    </Suspense>
  )
}
