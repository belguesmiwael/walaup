'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  User, CalendarDays, MessageSquare, LogOut,
  Clock, AlertCircle, CheckCircle2, Heart,
  Phone, MapPin, ChevronRight, RefreshCw
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

const CSS = `
  .pt-root { position:fixed; inset:0; display:flex; flex-direction:column; background:var(--bg-base); overflow:hidden; }
  .pt-topbar {
    height:52px; flex-shrink:0; display:flex; align-items:center;
    padding:0 16px; gap:12px; border-bottom:1px solid var(--border);
    background:rgba(8,11,20,.92); backdrop-filter:blur(20px); z-index:100;
  }
  .pt-logo { font-family:var(--font-display); font-weight:800; font-size:.95rem;
    background:linear-gradient(135deg,#0EA5E9,#38BDF8);
    -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
  .pt-badge { padding:2px 10px; border-radius:20px; font-size:.68rem; font-weight:700;
    background:rgba(16,185,129,.1); color:var(--green); border:1px solid rgba(16,185,129,.2); }
  .pt-sep { flex:1; }
  .pt-logout-btn { display:flex; align-items:center; gap:6px; padding:6px 12px;
    border-radius:8px; border:1px solid var(--border); background:transparent;
    color:var(--tx-2); font-size:.78rem; cursor:pointer; transition:all .16s; }
  .pt-logout-btn:hover { color:var(--red); border-color:rgba(248,113,113,.3); }

  .pt-body { flex:1; overflow-y:auto; overflow-x:hidden; padding:20px;
    scrollbar-width:thin; scrollbar-color:var(--border) transparent; }

  .pt-bottom-nav { display:none; height:62px; flex-shrink:0;
    border-top:1px solid var(--border); background:rgba(8,11,20,.95); backdrop-filter:blur(20px); }
  .pt-bn { display:flex; height:100%; align-items:center; }
  .pt-bn-btn { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center;
    gap:3px; cursor:pointer; color:var(--tx-3); font-size:.6rem; font-weight:600;
    letter-spacing:.03em; text-transform:uppercase; transition:color .15s;
    border:none; background:none; }
  .pt-bn-btn.active { color:#0EA5E9; }
  .pt-bn-btn svg { width:20px; height:20px; }

  @media (max-width:767px) { .pt-bottom-nav { display:flex; } }

  .pt-tabs { display:flex; gap:6px; margin-bottom:22px; overflow-x:auto;
    padding-bottom:4px; -webkit-overflow-scrolling:touch; }
  .pt-tab { padding:7px 18px; border-radius:20px; border:1px solid var(--border);
    background:transparent; color:var(--tx-2); font-size:.82rem; font-weight:600;
    cursor:pointer; transition:all .18s; white-space:nowrap; }
  .pt-tab.active { background:rgba(14,165,233,.12); color:#0EA5E9; border-color:rgba(14,165,233,.35); }
  .pt-tab:hover { color:var(--tx); }

  .pt-welcome { background:linear-gradient(135deg,rgba(14,165,233,.1),rgba(56,189,248,.05));
    border:1px solid rgba(14,165,233,.2); border-radius:16px; padding:20px;
    margin-bottom:20px; display:flex; align-items:center; gap:16px; }
  .pt-welcome-avatar { width:52px; height:52px; border-radius:50%; flex-shrink:0;
    background:linear-gradient(135deg,#0EA5E9,#38BDF8);
    display:flex; align-items:center; justify-content:center;
    font-size:1.2rem; font-weight:800; color:white; }
  .pt-welcome-title { font-family:var(--font-display); font-size:1.1rem; font-weight:700; color:var(--tx); }
  .pt-welcome-sub { font-size:.8rem; color:var(--tx-2); margin-top:4px; }

  .pt-card { background:var(--bg-surface); border:1px solid var(--border);
    border-radius:14px; overflow:hidden; margin-bottom:16px; }
  .pt-card-header { display:flex; align-items:center; justify-content:space-between;
    padding:14px 18px; border-bottom:1px solid var(--border); }
  .pt-card-title { font-weight:700; font-size:.88rem; color:var(--tx);
    display:flex; align-items:center; gap:8px; }
  .pt-card-body { padding:16px 18px; }
  .pt-empty { padding:32px 18px; text-align:center; color:var(--tx-3); font-size:.83rem; }

  .pt-info-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  .pt-info-item { }
  .pt-info-label { font-size:.7rem; font-weight:600; letter-spacing:.04em;
    color:var(--tx-3); text-transform:uppercase; margin-bottom:4px; }
  .pt-info-value { font-size:.875rem; font-weight:600; color:var(--tx); }

  .pt-allergy { display:inline-flex; align-items:center; gap:4px; margin:3px;
    padding:3px 10px; border-radius:20px; font-size:.72rem; font-weight:700; }
  .pt-allergy.crit { background:rgba(220,38,38,.12); color:#DC2626; border:1px solid rgba(220,38,38,.25); }
  .pt-allergy.mod  { background:rgba(251,191,36,.1);  color:var(--yellow); border:1px solid rgba(251,191,36,.2); }
  .pt-allergy.leg  { background:rgba(16,185,129,.08); color:var(--green);  border:1px solid rgba(16,185,129,.2); }

  .pt-appt-item { display:flex; align-items:center; gap:12px; padding:13px 18px;
    border-bottom:1px solid var(--border); }
  .pt-appt-item:last-child { border-bottom:none; }
  .pt-appt-icon { width:36px; height:36px; border-radius:10px; flex-shrink:0;
    display:flex; align-items:center; justify-content:center; }
  .pt-appt-icon.blue   { background:rgba(14,165,233,.1); color:#0EA5E9; }
  .pt-appt-icon.violet { background:rgba(99,102,241,.1);  color:var(--ac); }
  .pt-appt-info { flex:1; min-width:0; }
  .pt-appt-name { font-weight:600; font-size:.87rem; color:var(--tx); }
  .pt-appt-time { font-size:.72rem; color:var(--tx-3); margin-top:2px; }
  .pt-status { padding:2px 8px; border-radius:20px; font-size:.66rem; font-weight:700; }
  .pt-status.pending   { background:rgba(251,191,36,.1); color:var(--yellow); }
  .pt-status.confirmed { background:rgba(14,165,233,.1); color:#0EA5E9; }
  .pt-status.done      { background:rgba(16,185,129,.1); color:var(--green); }
  .pt-status.cancelled { background:rgba(248,113,113,.1);color:var(--red); }

  .pt-skeleton { background:linear-gradient(90deg,var(--bg-surface) 25%,var(--bg-hover) 50%,var(--bg-surface) 75%);
    background-size:200% 100%; animation:ptShimmer 1.5s infinite; border-radius:8px; }
  @keyframes ptShimmer { 0%{background-position:200%} 100%{background-position:-200%} }
`

const TABS = [
  { id: 'dossier',  icon: User,         label: 'Mon dossier' },
  { id: 'rdv',      icon: CalendarDays, label: 'Mes RDV'     },
  { id: 'messages', icon: MessageSquare,label: 'Messages'    },
]

function formatDateTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-TN', { weekday:'long', day:'numeric', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' })
}
function calcAge(dob) {
  if (!dob) return null
  return Math.floor((Date.now() - new Date(dob).getTime()) / (1000*60*60*24*365.25))
}

export default function PatientPortal() {
  const router = useRouter()
  const [user,      setUser]      = useState(null)
  const [patient,   setPatient]   = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [tab,       setTab]       = useState('dossier')
  const [appts,     setAppts]     = useState([])
  const [loadingAppts, setLoadingAppts] = useState(false)
  const toastRef = useRef(null)

  useEffect(() => {
    async function init() {
      try {
        const { data: { user: u } } = await supabase.auth.getUser()
        if (!u) { router.push('/apps/medical/login'); return }

        const { data: userData } = await supabase
          .from('users').select('role,tenant_id,app_type').eq('id', u.id).maybeSingle()
        if (!userData || userData.role !== 'app_end_user' || userData.app_type !== 'medical') {
          router.push('/apps/medical/login'); return
        }
        setUser({ ...u, ...userData })

        // Charger le dossier patient lié au compte
        const { data: pt } = await supabase.schema('medical').from('patients')
          .select('*').eq('user_id', u.id).maybeSingle()
        setPatient(pt)
      } catch { router.push('/apps/medical/login') }
      finally { setLoading(false) }
    }
    init()
  }, [router])

  const loadAppts = useCallback(async () => {
    if (!patient) return
    setLoadingAppts(true)
    try {
      const { data } = await supabase.schema('medical').from('appointments')
        .select('id, scheduled_at, duration_min, type, status, reason')
        .eq('patient_id', patient.id)
        .order('scheduled_at', { ascending: false })
        .limit(20)
      setAppts(data || [])
    } catch { /* silencieux */ }
    setLoadingAppts(false)
  }, [patient])

  useEffect(() => {
    if (tab === 'rdv' && patient) loadAppts()
  }, [tab, patient, loadAppts])

  async function handleLogout() {
    await supabase.auth.signOut(); router.push('/apps/medical/login')
  }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'var(--bg-base)' }}>
      <div className="pt-skeleton" style={{ width:140, height:8, borderRadius:4 }} />
    </div>
  )

  const age = calcAge(patient?.birth_date)
  const critAllergies = (patient?.allergies||[]).filter(a=>a.severity==='CRITIQUE')

  return (
    <>
      <style>{CSS}</style>
      <div className="pt-root">
        <div className="pt-topbar">
          <span className="pt-logo">MediLink OS</span>
          <span className="pt-badge">Portail Patient</span>
          <span className="pt-sep" />
          <button className="pt-logout-btn" onClick={handleLogout}>
            <LogOut size={14} /> Déconnexion
          </button>
        </div>

        <div className="pt-body">
          {/* Welcome */}
          {patient && (
            <div className="pt-welcome">
              <div className="pt-welcome-avatar">
                {(patient.first_name||'P')[0]}{(patient.last_name||'')[0]}
              </div>
              <div>
                <div className="pt-welcome-title">
                  Bonjour, {patient.first_name} {patient.last_name} 👋
                </div>
                <div className="pt-welcome-sub">
                  {age ? `${age} ans` : ''}
                  {age && patient.blood_type ? ' · ' : ''}
                  {patient.blood_type && <span style={{ color:'#DC2626', fontWeight:700 }}>Groupe {patient.blood_type}</span>}
                </div>
                {critAllergies.length > 0 && (
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:6 }}>
                    <AlertCircle size={13} color="#DC2626" />
                    <span style={{ fontSize:'.72rem', color:'#DC2626', fontWeight:700 }}>
                      Allergies critiques : {critAllergies.map(a=>a.name).join(', ')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="pt-tabs">
            {TABS.map(t => (
              <button key={t.id} className={`pt-tab ${tab===t.id?'active':''}`} onClick={()=>setTab(t.id)}>
                {t.label}
              </button>
            ))}
          </div>

          {/* DOSSIER */}
          {tab === 'dossier' && (
            <>
              {!patient ? (
                <div className="pt-card">
                  <div className="pt-empty">
                    <User size={30} style={{ margin:'0 auto 8px', display:'block', opacity:.3 }}/>
                    Votre dossier médical n'est pas encore lié à ce compte.
                    <br/>Contactez votre médecin.
                  </div>
                </div>
              ) : (
                <>
                  <div className="pt-card">
                    <div className="pt-card-header">
                      <div className="pt-card-title"><User size={16} color="#0EA5E9"/>Informations personnelles</div>
                    </div>
                    <div className="pt-card-body">
                      <div className="pt-info-grid">
                        <div className="pt-info-item">
                          <div className="pt-info-label">Prénom</div>
                          <div className="pt-info-value">{patient.first_name}</div>
                        </div>
                        <div className="pt-info-item">
                          <div className="pt-info-label">Nom</div>
                          <div className="pt-info-value">{patient.last_name}</div>
                        </div>
                        <div className="pt-info-item">
                          <div className="pt-info-label">Âge</div>
                          <div className="pt-info-value">{age ? `${age} ans` : '—'}</div>
                        </div>
                        <div className="pt-info-item">
                          <div className="pt-info-label">Sexe</div>
                          <div className="pt-info-value" style={{ textTransform:'capitalize' }}>{patient.gender || '—'}</div>
                        </div>
                        <div className="pt-info-item">
                          <div className="pt-info-label">Groupe sanguin</div>
                          <div className="pt-info-value" style={{ color:'#DC2626', fontWeight:800 }}>{patient.blood_type || '—'}</div>
                        </div>
                        <div className="pt-info-item">
                          <div className="pt-info-label">Téléphone</div>
                          <div className="pt-info-value">{patient.phone || '—'}</div>
                        </div>
                        {patient.city && (
                          <div className="pt-info-item">
                            <div className="pt-info-label">Ville</div>
                            <div className="pt-info-value">{patient.city}</div>
                          </div>
                        )}
                        {patient.email && (
                          <div className="pt-info-item">
                            <div className="pt-info-label">Email</div>
                            <div className="pt-info-value" style={{ fontSize:'.82rem' }}>{patient.email}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Allergies */}
                  {(patient.allergies||[]).length > 0 && (
                    <div className="pt-card">
                      <div className="pt-card-header">
                        <div className="pt-card-title">
                          <AlertCircle size={16} color="#DC2626"/>Allergies
                        </div>
                      </div>
                      <div className="pt-card-body">
                        {(patient.allergies||[]).map(a => (
                          <span key={a.name} className={`pt-allergy ${a.severity==='CRITIQUE'?'crit':a.severity==='MODERE'?'mod':'leg'}`}>
                            {a.severity==='CRITIQUE' && '⚠ '}{a.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Maladies chroniques */}
                  {(patient.chronic_cond||[]).length > 0 && (
                    <div className="pt-card">
                      <div className="pt-card-header">
                        <div className="pt-card-title"><Heart size={16} color="var(--ac)"/>Conditions chroniques</div>
                      </div>
                      <div className="pt-card-body">
                        {(patient.chronic_cond||[]).map(c => (
                          <span key={c} style={{ display:'inline-block', margin:3, padding:'3px 10px', borderRadius:20,
                            fontSize:'.72rem', fontWeight:700, background:'rgba(99,102,241,.1)',
                            color:'var(--ac)', border:'1px solid rgba(99,102,241,.2)' }}>
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Contact urgence */}
                  {patient.emergency_name && (
                    <div className="pt-card">
                      <div className="pt-card-header">
                        <div className="pt-card-title"><Phone size={16} color="var(--gold)"/>Contact d'urgence</div>
                      </div>
                      <div className="pt-card-body">
                        <div className="pt-info-grid">
                          <div className="pt-info-item">
                            <div className="pt-info-label">Nom</div>
                            <div className="pt-info-value">{patient.emergency_name}</div>
                          </div>
                          <div className="pt-info-item">
                            <div className="pt-info-label">Téléphone</div>
                            <div className="pt-info-value">{patient.emergency_phone || '—'}</div>
                          </div>
                          {patient.emergency_rel && (
                            <div className="pt-info-item">
                              <div className="pt-info-label">Relation</div>
                              <div className="pt-info-value">{patient.emergency_rel}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* RDV */}
          {tab === 'rdv' && (
            <>
              <div className="pt-card">
                <div className="pt-card-header">
                  <div className="pt-card-title"><CalendarDays size={16} color="#0EA5E9"/>Mes rendez-vous</div>
                  <button onClick={loadAppts} style={{ background:'none', border:'none', color:'var(--tx-3)', cursor:'pointer' }}>
                    <RefreshCw size={14}/>
                  </button>
                </div>
                {loadingAppts ? (
                  <div style={{ padding:16 }}>
                    {[1,2,3].map(i=><div key={i} className="pt-skeleton" style={{ height:52, marginBottom:8, borderRadius:10 }}/>)}
                  </div>
                ) : appts.length === 0 ? (
                  <div className="pt-empty">
                    <CalendarDays size={30} style={{ margin:'0 auto 8px', display:'block', opacity:.3 }}/>
                    Aucun rendez-vous trouvé
                  </div>
                ) : appts.map(appt => (
                  <div key={appt.id} className="pt-appt-item">
                    <div className={`pt-appt-icon ${appt.type==='telemedicine'?'violet':'blue'}`}>
                      {appt.type==='telemedicine' ? <CalendarDays size={16}/> : <CalendarDays size={16}/>}
                    </div>
                    <div className="pt-appt-info">
                      <div className="pt-appt-name">
                        {appt.type==='telemedicine' ? 'Téléconsultation' : 'Consultation présentielle'}
                      </div>
                      <div className="pt-appt-time">{formatDateTime(appt.scheduled_at)} · {appt.duration_min}min</div>
                      {appt.reason && <div style={{ fontSize:'.7rem', color:'var(--tx-3)', marginTop:2 }}>{appt.reason}</div>}
                    </div>
                    <span className={`pt-status ${appt.status}`}>
                      {appt.status==='pending'?'En attente':appt.status==='confirmed'?'Confirmé':appt.status==='done'?'Terminé':'Annulé'}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* MESSAGES */}
          {tab === 'messages' && (
            <div className="pt-card">
              <div className="pt-card-header">
                <div className="pt-card-title"><MessageSquare size={16} color="#0EA5E9"/>Messages</div>
              </div>
              <div className="pt-empty">
                <MessageSquare size={30} style={{ margin:'0 auto 8px', display:'block', opacity:.3 }}/>
                Messagerie avec votre médecin — Prochainement
              </div>
            </div>
          )}
        </div>

        {/* Bottom nav */}
        <div className="pt-bottom-nav">
          <nav className="pt-bn">
            {TABS.map(t => (
              <button key={t.id} className={`pt-bn-btn ${tab===t.id?'active':''}`} onClick={()=>setTab(t.id)}>
                <t.icon />{t.label.split(' ')[1]||t.label}
              </button>
            ))}
          </nav>
        </div>
      </div>
    </>
  )
}
