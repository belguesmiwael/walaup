'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  CalendarDays, Users, MessageSquare, LogOut,
  Plus, Search, Clock, ChevronLeft, ChevronRight,
  CheckCircle2, XCircle, Phone, RefreshCw, UserPlus
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

const CSS = `
  .sec-root { position:fixed; inset:0; display:flex; flex-direction:column; background:var(--bg-base); overflow:hidden; }
  .sec-topbar {
    height:52px; flex-shrink:0; display:flex; align-items:center;
    padding:0 16px; gap:12px; border-bottom:1px solid var(--border);
    background:rgba(8,11,20,.9); backdrop-filter:blur(20px); z-index:200;
  }
  .sec-logo { font-family:var(--font-display); font-weight:800; font-size:.95rem;
    background:linear-gradient(135deg,#0EA5E9,#38BDF8);
    -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
  .sec-badge { padding:2px 10px; border-radius:20px; font-size:.68rem; font-weight:700;
    background:rgba(245,158,11,.1); color:var(--gold); border:1px solid rgba(245,158,11,.2); }
  .sec-avatar { width:30px; height:30px; border-radius:50%; display:flex; align-items:center;
    justify-content:center; font-size:.7rem; font-weight:800; color:white;
    background:linear-gradient(135deg,var(--gold),var(--gold-light)); }
  .sec-icon-btn { width:32px; height:32px; display:flex; align-items:center; justify-content:center;
    border:1px solid var(--border); border-radius:8px; background:transparent;
    color:var(--tx-2); cursor:pointer; transition:all .16s; }
  .sec-icon-btn:hover { background:var(--bg-hover); color:var(--tx); }
  .sec-sep { flex:1; }

  .sec-body { flex:1; display:flex; overflow:hidden; }
  .sec-sidebar {
    flex-shrink:0; border-right:1px solid var(--border);
    background:rgba(8,11,20,.72); backdrop-filter:blur(24px);
    display:flex; flex-direction:column; overflow:hidden;
    transition:width .26s cubic-bezier(.16,1,.3,1);
  }
  .sec-sidebar--open { width:200px; } .sec-sidebar--closed { width:56px; }
  .sec-sb-header { height:52px; display:flex; align-items:center; padding:0 10px; gap:8px;
    border-bottom:1px solid var(--border); flex-shrink:0; }
  .sec-sb-text { font-family:var(--font-display); font-size:.85rem; font-weight:800;
    background:linear-gradient(135deg,var(--gold),var(--gold-light));
    -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
    white-space:nowrap; flex:1; opacity:0; max-width:0;
    transition:opacity .18s, max-width .26s cubic-bezier(.16,1,.3,1); }
  .sec-sidebar--open .sec-sb-text { opacity:1; max-width:130px; }
  .sec-toggle { width:26px; height:26px; min-width:26px; display:flex; align-items:center;
    justify-content:center; border:1px solid var(--border); border-radius:8px;
    background:rgba(245,158,11,.08); color:var(--gold); cursor:pointer; transition:all .18s; margin-left:auto; }
  .sec-toggle:hover { background:rgba(245,158,11,.18); }
  .sec-sidebar--closed .sec-toggle { margin-left:0; }

  .sec-nav { flex:1; padding:10px 8px; display:flex; flex-direction:column; gap:2px; overflow:hidden; }
  .sec-nav-item { display:flex; align-items:center; gap:10px; padding:0 10px; height:40px;
    border-radius:10px; cursor:pointer; transition:all .18s;
    color:var(--tx-2); font-size:.85rem; font-weight:500; white-space:nowrap;
    border:1px solid transparent; overflow:hidden; }
  .sec-nav-item:hover { background:var(--bg-hover); color:var(--tx); }
  .sec-nav-item.active { background:rgba(245,158,11,.1); color:var(--gold); border-color:rgba(245,158,11,.25); }
  .sec-nav-label { opacity:0; max-width:0; overflow:hidden;
    transition:opacity .18s, max-width .26s cubic-bezier(.16,1,.3,1); }
  .sec-sidebar--open .sec-nav-label { opacity:1; max-width:130px; }
  .sec-sb-footer { padding:10px 8px; border-top:1px solid var(--border); flex-shrink:0; }
  .sec-logout { display:flex; align-items:center; gap:10px; padding:0 10px; height:40px;
    border-radius:10px; cursor:pointer; transition:all .18s; color:var(--tx-3);
    font-size:.85rem; font-weight:500; white-space:nowrap; border:none; background:transparent; width:100%; }
  .sec-logout:hover { background:rgba(248,113,113,.08); color:var(--red); }

  .sec-content { flex:1; overflow-y:auto; padding:24px;
    scrollbar-width:thin; scrollbar-color:var(--border) transparent; }

  .sec-bottom-nav { display:none; height:62px; flex-shrink:0;
    border-top:1px solid var(--border); background:rgba(8,11,20,.95); backdrop-filter:blur(20px); }
  .sec-bn-inner { display:flex; height:100%; align-items:center; }
  .sec-bn-btn { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center;
    gap:3px; cursor:pointer; color:var(--tx-3); font-size:.6rem; font-weight:600;
    letter-spacing:.03em; text-transform:uppercase; transition:color .15s;
    border:none; background:none; }
  .sec-bn-btn.active { color:var(--gold); }
  .sec-bn-btn svg { width:20px; height:20px; }

  @media (max-width:767px) {
    .sec-sidebar { display:none; }
    .sec-bottom-nav { display:flex; }
    .sec-content { padding:16px; }
  }

  .sec-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; }
  .sec-title { font-family:var(--font-display); font-size:1.2rem; font-weight:700; color:var(--tx); }
  .sec-sub { font-size:.8rem; color:var(--tx-2); margin-top:2px; }

  .sec-card { background:var(--bg-surface); border:1px solid var(--border); border-radius:14px; overflow:hidden; margin-bottom:20px; }
  .sec-card-header { display:flex; align-items:center; justify-content:space-between;
    padding:14px 18px; border-bottom:1px solid var(--border); }
  .sec-card-title { font-weight:700; font-size:.88rem; color:var(--tx);
    display:flex; align-items:center; gap:8px; }
  .sec-empty { padding:40px 20px; text-align:center; color:var(--tx-3); font-size:.85rem; }

  .sec-appt-item { display:flex; align-items:center; gap:12px; padding:13px 18px;
    border-bottom:1px solid var(--border); transition:background .15s; }
  .sec-appt-item:last-child { border-bottom:none; }
  .sec-appt-item:hover { background:var(--bg-hover); }
  .sec-appt-num { width:26px; height:26px; border-radius:50%; display:flex; align-items:center;
    justify-content:center; font-size:.7rem; font-weight:800;
    background:rgba(245,158,11,.12); color:var(--gold); flex-shrink:0; }
  .sec-appt-info { flex:1; min-width:0; }
  .sec-appt-name { font-weight:600; font-size:.87rem; color:var(--tx); }
  .sec-appt-time { font-size:.72rem; color:var(--tx-3); margin-top:2px; }
  .sec-appt-actions { display:flex; gap:6px; }
  .sec-btn { padding:5px 11px; border-radius:8px; font-size:.72rem; font-weight:600;
    cursor:pointer; transition:all .16s; border:1px solid var(--border);
    background:transparent; color:var(--tx-2); }
  .sec-btn:hover { background:var(--bg-hover); color:var(--tx); }
  .sec-btn.confirm { background:rgba(245,158,11,.1); color:var(--gold); border-color:rgba(245,158,11,.3); }
  .sec-btn.confirm:hover { background:rgba(245,158,11,.2); }
  .sec-btn.cancel { background:rgba(248,113,113,.08); color:var(--red); border-color:rgba(248,113,113,.25); }
  .sec-btn.cancel:hover { background:rgba(248,113,113,.16); }
  .sec-btn.primary { background:#0EA5E9; color:white; border-color:transparent; }
  .sec-btn.primary:hover { background:#0284C7; }

  .sec-status { padding:2px 9px; border-radius:20px; font-size:.67rem; font-weight:700; white-space:nowrap; }
  .sec-status.pending   { background:rgba(251,191,36,.1);  color:var(--yellow); border:1px solid rgba(251,191,36,.2); }
  .sec-status.confirmed { background:rgba(14,165,233,.1);  color:#0EA5E9;       border:1px solid rgba(14,165,233,.2); }
  .sec-status.done      { background:rgba(16,185,129,.1);  color:var(--green);  border:1px solid rgba(16,185,129,.2); }
  .sec-status.cancelled { background:rgba(248,113,113,.1); color:var(--red);    border:1px solid rgba(248,113,113,.2); }

  .sec-search { display:flex; align-items:center; gap:10px; background:var(--bg-surface);
    border:1px solid var(--border); border-radius:12px; padding:0 14px; height:42px; margin-bottom:14px; }
  .sec-search input { flex:1; background:none; border:none; outline:none; color:var(--tx); font-size:.875rem; }
  .sec-search input::placeholder { color:var(--tx-3); }

  .sec-pt-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(240px,1fr)); gap:12px; }
  .sec-pt-card { background:var(--bg-surface); border:1px solid var(--border); border-radius:12px;
    padding:14px; cursor:pointer; transition:all .2s; }
  .sec-pt-card:hover { border-color:rgba(245,158,11,.35); transform:translateY(-1px); }
  .sec-pt-header { display:flex; align-items:center; gap:10px; margin-bottom:8px; }
  .sec-pt-avatar { width:38px; height:38px; border-radius:50%; display:flex; align-items:center;
    justify-content:center; font-weight:800; font-size:.8rem; color:white; flex-shrink:0;
    background:linear-gradient(135deg,var(--gold),var(--gold-light)); }
  .sec-pt-name { font-weight:700; font-size:.875rem; color:var(--tx); }
  .sec-pt-meta { font-size:.72rem; color:var(--tx-3); margin-top:2px; }

  .sec-modal-bg { position:fixed; inset:0; z-index:9000;
    background:rgba(0,0,0,.7); backdrop-filter:blur(4px);
    display:flex; align-items:center; justify-content:center; padding:16px;
    animation:secFadeIn .18s; }
  @keyframes secFadeIn { from{opacity:0} to{opacity:1} }
  .sec-modal { background:var(--bg-elevated); border:1px solid var(--border-strong);
    border-radius:20px; padding:26px; width:100%; max-width:480px;
    box-shadow:var(--shadow-modal); animation:secSlide .22s cubic-bezier(.16,1,.3,1); }
  @keyframes secSlide { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  .sec-modal-title { font-family:var(--font-display); font-size:1rem; font-weight:700;
    color:var(--tx); margin-bottom:18px; display:flex; align-items:center; gap:8px; }
  .sec-form-group { margin-bottom:13px; }
  .sec-form-row { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  .sec-label { display:block; font-size:.73rem; font-weight:600;
    color:var(--tx-2); margin-bottom:5px; letter-spacing:.03em; }
  .sec-input { width:100%; padding:8px 12px; border-radius:9px;
    border:1px solid var(--border); background:var(--bg-surface);
    color:var(--tx); font-size:.875rem; outline:none; transition:border-color .15s; box-sizing:border-box; }
  .sec-input:focus { border-color:var(--gold); box-shadow:0 0 0 3px rgba(245,158,11,.12); }
  .sec-select { width:100%; padding:8px 12px; border-radius:9px;
    border:1px solid var(--border); background:var(--bg-surface);
    color:var(--tx); font-size:.875rem; outline:none; cursor:pointer; box-sizing:border-box; }
  .sec-select:focus { border-color:var(--gold); }
  .sec-modal-actions { display:flex; gap:10px; justify-content:flex-end; margin-top:20px; }
  .sec-btn-lg { padding:9px 20px; border-radius:10px; font-size:.85rem; font-weight:600; cursor:pointer; border:none; transition:all .18s; }
  .sec-btn-lg.ghost { background:var(--bg-surface); color:var(--tx-2); border:1px solid var(--border); }
  .sec-btn-lg.ghost:hover { color:var(--tx); }
  .sec-btn-lg.gold { background:var(--gold); color:#000; font-weight:700; }
  .sec-btn-lg.gold:hover { background:var(--gold-light); }
  .sec-btn-lg:disabled { opacity:.5; cursor:not-allowed; }

  .sec-toast { position:fixed; bottom:80px; left:50%; transform:translateX(-50%);
    padding:10px 20px; border-radius:10px; font-size:.85rem; font-weight:600;
    z-index:9999; white-space:nowrap; animation:secSlide .22s; }
  .sec-toast.success { background:var(--green); color:white; }
  .sec-toast.error   { background:var(--red); color:white; }
  @media (min-width:768px) { .sec-toast { bottom:20px; } }
  .sec-skeleton { background:linear-gradient(90deg,var(--bg-surface) 25%,var(--bg-hover) 50%,var(--bg-surface) 75%);
    background-size:200% 100%; animation:secShimmer 1.5s infinite; border-radius:8px; }
  @keyframes secShimmer { 0%{background-position:200%} 100%{background-position:-200%} }
`

const NAV = [
  { id: 'agenda',   icon: CalendarDays, label: 'Agenda'   },
  { id: 'patients', icon: Users,        label: 'Patients' },
  { id: 'messages', icon: MessageSquare,label: 'Messages' },
]

function formatTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('fr-TN', { hour:'2-digit', minute:'2-digit' })
}
function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-TN', { day:'2-digit', month:'short', year:'numeric' })
}
function initials(fn, ln) {
  return `${(fn||'')[0]||''}${(ln||'')[0]||''}`.toUpperCase()
}

export default function SecretaryDashboard() {
  const router = useRouter()
  const [user,     setUser]     = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [tab,      setTab]      = useState('agenda')
  const [sideOpen, setSideOpen] = useState(true)
  const [toast,    setToast]    = useState(null)
  const toastRef = useRef(null)

  const [queue,    setQueue]    = useState([])
  const [patients, setPatients] = useState([])
  const [search,   setSearch]   = useState('')
  const [loadingQ, setLoadingQ] = useState(false)
  const [loadingP, setLoadingP] = useState(false)

  const [showNewAppt,    setShowNewAppt]    = useState(false)
  const [patientsForModal, setPatientsForModal] = useState([])
  const [showNewPatient, setShowNewPatient] = useState(false)
  const [saving, setSaving] = useState(false)
  const [apptForm, setApptForm] = useState({ patient_id:'', scheduled_at:'', duration_min:30, type:'presentiel', reason:'' })
  const [ptForm,   setPtForm]   = useState({ first_name:'', last_name:'', phone:'', city:'Tunis', email:'' })

  function showToast(msg, type='success') {
    setToast({ msg, type })
    if (toastRef.current) clearTimeout(toastRef.current)
    toastRef.current = setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    async function init() {
      try {
        const { data: { user: u } } = await supabase.auth.getUser()
        if (!u) { router.push('/apps/medical/login'); return }
        const { data } = await supabase.from('users').select('role,tenant_id,app_type').eq('id', u.id).maybeSingle()
        if (!data || data.role !== 'tenant_user' || data.app_type !== 'medical') { router.push('/apps/medical/login'); return }
        setUser({ ...u, ...data })
      } catch { router.push('/apps/medical/login') }
      finally { setLoading(false) }
    }
    init()
  }, [router])

  const loadQueue = useCallback(async () => {
    setLoadingQ(true)
    try {
      const today = new Date().toISOString().slice(0,10)
      const { data } = await supabase.from('med_appointments')
        .select('id, scheduled_at, duration_min, type, status, reason, patient:med_patients(id,first_name,last_name,phone)')
        .gte('scheduled_at', `${today}T00:00:00`).lte('scheduled_at', `${today}T23:59:59`)
        .order('scheduled_at', { ascending: true })
      setQueue(data || [])
    } catch { /* silencieux */ }
    setLoadingQ(false)
  }, [])

  const loadPatients = useCallback(async (q='') => {
    setLoadingP(true)
    try {
      let query = supabase.from('med_patients')
        .select('id,first_name,last_name,birth_date,phone,email,city,last_visit')
        .order('last_name', { ascending: true }).limit(30)
      if (q.trim()) query = query.or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%`)
      const { data } = await query
      setPatients(data || [])
    } catch { /* silencieux */ }
    setLoadingP(false)
  }, [])

  useEffect(() => {
    if (!user) return
    if (tab === 'agenda')   loadQueue()
    if (tab === 'patients') loadPatients(search)
  }, [tab, user, loadQueue, loadPatients, search])

  async function updateStatus(id, status) {
    try {
      await supabase.from('med_appointments').update({ status }).eq('id', id)
      setQueue(q => q.map(a => a.id === id ? { ...a, status } : a))
      showToast('Statut mis à jour')
    } catch { showToast('Erreur', 'error') }
  }

  async function handleCreateAppt(e) {
    e.preventDefault()
    if (!apptForm.patient_id || !apptForm.scheduled_at) { showToast('Patient et date requis', 'error'); return }
    setSaving(true)
    try {
      const { data: { user: u } } = await supabase.auth.getUser()
      await supabase.from('med_appointments').insert({ ...apptForm, status:'pending', created_by:u.id })
      showToast('Rendez-vous créé')
      setShowNewAppt(false)
      setApptForm({ patient_id:'', scheduled_at:'', duration_min:30, type:'presentiel', reason:'' })
      loadQueue()
    } catch { showToast('Erreur lors de la création', 'error') }
    setSaving(false)
  }

  async function handleCreatePatient(e) {
    e.preventDefault()
    if (!ptForm.first_name.trim() || !ptForm.last_name.trim()) { showToast('Prénom et nom requis', 'error'); return }
    setSaving(true)
    try {
      await supabase.from('med_patients').insert({
        ...ptForm, allergies:[], chronic_cond:[], current_meds:[],
        created_by: user.id,
      })
      showToast('Patient créé')
      setShowNewPatient(false)
      setPtForm({ first_name:'', last_name:'', phone:'', city:'Tunis', email:'' })
      if (tab === 'patients') loadPatients(search)
    } catch { showToast('Erreur', 'error') }
    setSaving(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut(); router.push('/apps/medical/login')
  }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'var(--bg-base)' }}>
      <div className="sec-skeleton" style={{ width:140, height:8, borderRadius:4 }} />
    </div>
  )

  return (
    <>
      <style>{CSS}</style>
      <div className="sec-root">
        <div className="sec-topbar">
          <span className="sec-logo">MediLink OS</span>
          <span className="sec-badge">Secrétaire</span>
          <span className="sec-sep" />
          <div className="sec-avatar">{(user?.email||'S')[0].toUpperCase()}</div>
        </div>

        <div className="sec-body">
          {/* Sidebar */}
          <div className={`sec-sidebar ${sideOpen?'sec-sidebar--open':'sec-sidebar--closed'}`}>
            <div className="sec-sb-header">
              <span className="sec-sb-text">Secrétariat</span>
              <button className="sec-toggle" onClick={() => setSideOpen(o=>!o)}>
                {sideOpen ? <ChevronLeft size={13} /> : <ChevronRight size={13} />}
              </button>
            </div>
            <nav className="sec-nav">
              {NAV.map(item => (
                <div key={item.id} className={`sec-nav-item ${tab===item.id?'active':''}`}
                  onClick={() => setTab(item.id)}>
                  <item.icon size={17} />
                  <span className="sec-nav-label">{item.label}</span>
                </div>
              ))}
            </nav>
            <div className="sec-sb-footer">
              <button className="sec-logout" onClick={handleLogout}>
                <LogOut size={16} />
                <span className="sec-nav-label">Déconnexion</span>
              </button>
            </div>
          </div>

          {/* Content */}
          <main className="sec-content">

            {/* AGENDA */}
            {tab === 'agenda' && (
              <>
                <div className="sec-header">
                  <div>
                    <div className="sec-title">Agenda du jour</div>
                    <div className="sec-sub">{new Date().toLocaleDateString('fr-TN',{weekday:'long',day:'numeric',month:'long'})}</div>
                  </div>
                  <div style={{ display:'flex', gap:8 }}>
                    <button className="sec-icon-btn" onClick={loadQueue}><RefreshCw size={14}/></button>
                    <button className="sec-btn primary" onClick={async () => {
                    setShowNewAppt(true)
                    if (patientsForModal.length === 0) {
                      const { data } = await supabase.from('med_patients')
                        .select('id, first_name, last_name').order('last_name', { ascending: true }).limit(100)
                      setPatientsForModal(data || [])
                    }
                  }}
                      style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <Plus size={14}/> Nouveau RDV
                    </button>
                  </div>
                </div>
                <div className="sec-card">
                  <div className="sec-card-header">
                    <div className="sec-card-title">
                      <div style={{ width:8, height:8, borderRadius:'50%', background:'var(--green)', boxShadow:'0 0 8px rgba(16,185,129,.6)', animation:'none' }} />
                      File d'attente — {queue.length} RDV
                    </div>
                  </div>
                  {loadingQ ? (
                    <div style={{ padding:16 }}>
                      {[1,2,3].map(i=><div key={i} className="sec-skeleton" style={{ height:52, marginBottom:8, borderRadius:10 }}/>)}
                    </div>
                  ) : queue.length === 0 ? (
                    <div className="sec-empty">
                      <CalendarDays size={30} style={{ margin:'0 auto 8px', display:'block', opacity:.3 }}/>
                      Aucun rendez-vous aujourd'hui
                    </div>
                  ) : queue.map((appt, idx) => {
                    const p = appt.patient || {}
                    return (
                      <div key={appt.id} className="sec-appt-item">
                        <div className="sec-appt-num">{idx+1}</div>
                        <div className="sec-appt-info">
                          <div className="sec-appt-name">{p.first_name} {p.last_name}</div>
                          <div className="sec-appt-time">
                            <Clock size={10} style={{ display:'inline', verticalAlign:'middle', marginRight:3 }}/>
                            {formatTime(appt.scheduled_at)} · {appt.duration_min}min
                            {p.phone && <span style={{ marginLeft:8 }}><Phone size={10} style={{ display:'inline', verticalAlign:'middle' }}/> {p.phone}</span>}
                          </div>
                          {appt.reason && <div style={{ fontSize:'.7rem', color:'var(--tx-3)', marginTop:2 }}>{appt.reason}</div>}
                        </div>
                        <span className={`sec-status ${appt.status}`}>
                          {appt.status==='pending'?'En attente':appt.status==='confirmed'?'Confirmé':appt.status==='done'?'Terminé':'Annulé'}
                        </span>
                        <div className="sec-appt-actions">
                          {appt.status==='pending' && <button className="sec-btn confirm" onClick={()=>updateStatus(appt.id,'confirmed')}>Confirmer</button>}
                          {['pending','confirmed'].includes(appt.status) && <button className="sec-btn cancel" onClick={()=>updateStatus(appt.id,'cancelled')}>Annuler</button>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}

            {/* PATIENTS */}
            {tab === 'patients' && (
              <>
                <div className="sec-header">
                  <div>
                    <div className="sec-title">Patients</div>
                    <div className="sec-sub">Données administratives uniquement</div>
                  </div>
                  <button className="sec-btn primary" onClick={() => setShowNewPatient(true)}
                    style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <UserPlus size={14}/> Nouveau
                  </button>
                </div>
                <div className="sec-search">
                  <Search size={15} color="var(--tx-3)"/>
                  <input placeholder="Rechercher…" value={search}
                    onChange={e => { setSearch(e.target.value); loadPatients(e.target.value) }}/>
                </div>
                {loadingP ? (
                  <div className="sec-pt-grid">
                    {[1,2,3,4].map(i=><div key={i} className="sec-skeleton" style={{ height:100, borderRadius:12 }}/>)}
                  </div>
                ) : patients.length === 0 ? (
                  <div style={{ textAlign:'center', padding:'60px 20px', color:'var(--tx-3)' }}>
                    <Users size={36} style={{ margin:'0 auto 10px', display:'block', opacity:.3 }}/>
                    {search ? 'Aucun résultat' : 'Aucun patient'}
                  </div>
                ) : (
                  <div className="sec-pt-grid">
                    {patients.map(pt => (
                      <div key={pt.id} className="sec-pt-card">
                        <div className="sec-pt-header">
                          <div className="sec-pt-avatar">{initials(pt.first_name, pt.last_name)}</div>
                          <div>
                            <div className="sec-pt-name">{pt.first_name} {pt.last_name}</div>
                            <div className="sec-pt-meta">{pt.city || '—'}</div>
                          </div>
                        </div>
                        {pt.phone && <div style={{ fontSize:'.72rem', color:'var(--tx-3)', display:'flex', alignItems:'center', gap:4 }}><Phone size={11}/> {pt.phone}</div>}
                        {pt.last_visit && <div style={{ fontSize:'.7rem', color:'var(--tx-3)', marginTop:4 }}>Dernière visite : {formatDate(pt.last_visit)}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* MESSAGES */}
            {tab === 'messages' && (
              <>
                <div className="sec-header"><div className="sec-title">Messages</div></div>
                <div className="sec-card">
                  <div className="sec-card-header"><div className="sec-card-title">Messagerie interne</div></div>
                  <div className="sec-empty">
                    <MessageSquare size={30} style={{ margin:'0 auto 8px', display:'block', opacity:.3 }}/>
                    Module messagerie — Prochainement
                  </div>
                </div>
              </>
            )}
          </main>
        </div>

        {/* Bottom nav */}
        <div className="sec-bottom-nav">
          <nav className="sec-bn-inner">
            {NAV.map(item => (
              <button key={item.id} className={`sec-bn-btn ${tab===item.id?'active':''}`} onClick={()=>setTab(item.id)}>
                <item.icon />{item.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Modal RDV */}
      {showNewAppt && (
        <div className="sec-modal-bg" onClick={e=>e.target===e.currentTarget&&setShowNewAppt(false)}>
          <div className="sec-modal">
            <div className="sec-modal-title"><CalendarDays size={18} color="var(--gold)"/>Nouveau rendez-vous</div>
            <form onSubmit={handleCreateAppt}>
              <div className="sec-form-group">
                <label className="sec-label">Patient *</label>
                <select className="sec-select" required value={apptForm.patient_id}
                  onChange={e=>setApptForm(f=>({...f,patient_id:e.target.value}))}>
                  <option value="">— Sélectionner —</option>
                  {(patientsForModal.length > 0 ? patientsForModal : patients).map(p=><option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
                </select>
              </div>
              <div className="sec-form-group">
                <label className="sec-label">Date et heure *</label>
                <input className="sec-input" type="datetime-local" required value={apptForm.scheduled_at}
                  onChange={e=>setApptForm(f=>({...f,scheduled_at:e.target.value}))}/>
              </div>
              <div className="sec-form-row">
                <div className="sec-form-group">
                  <label className="sec-label">Durée</label>
                  <select className="sec-select" value={apptForm.duration_min}
                    onChange={e=>setApptForm(f=>({...f,duration_min:+e.target.value}))}>
                    {[15,20,30,45,60,90].map(d=><option key={d} value={d}>{d} min</option>)}
                  </select>
                </div>
                <div className="sec-form-group">
                  <label className="sec-label">Type</label>
                  <select className="sec-select" value={apptForm.type}
                    onChange={e=>setApptForm(f=>({...f,type:e.target.value}))}>
                    <option value="presentiel">Présentiel</option>
                    <option value="telemedicine">Télémédecine</option>
                  </select>
                </div>
              </div>
              <div className="sec-form-group">
                <label className="sec-label">Motif</label>
                <input className="sec-input" maxLength={500} placeholder="Motif…" value={apptForm.reason}
                  onChange={e=>setApptForm(f=>({...f,reason:e.target.value}))}/>
              </div>
              <div className="sec-modal-actions">
                <button type="button" className="sec-btn-lg ghost" onClick={()=>setShowNewAppt(false)}>Annuler</button>
                <button type="submit" className="sec-btn-lg gold" disabled={saving}>{saving?'Enregistrement…':'Créer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Patient */}
      {showNewPatient && (
        <div className="sec-modal-bg" onClick={e=>e.target===e.currentTarget&&setShowNewPatient(false)}>
          <div className="sec-modal">
            <div className="sec-modal-title"><UserPlus size={18} color="var(--gold)"/>Nouveau patient</div>
            <form onSubmit={handleCreatePatient}>
              <div className="sec-form-row">
                <div className="sec-form-group">
                  <label className="sec-label">Prénom *</label>
                  <input className="sec-input" required maxLength={100} value={ptForm.first_name}
                    onChange={e=>setPtForm(f=>({...f,first_name:e.target.value}))}/>
                </div>
                <div className="sec-form-group">
                  <label className="sec-label">Nom *</label>
                  <input className="sec-input" required maxLength={100} value={ptForm.last_name}
                    onChange={e=>setPtForm(f=>({...f,last_name:e.target.value}))}/>
                </div>
              </div>
              <div className="sec-form-group">
                <label className="sec-label">Téléphone</label>
                <input className="sec-input" type="tel" maxLength={20} value={ptForm.phone}
                  onChange={e=>setPtForm(f=>({...f,phone:e.target.value}))}/>
              </div>
              <div className="sec-form-group">
                <label className="sec-label">Email</label>
                <input className="sec-input" type="email" value={ptForm.email}
                  onChange={e=>setPtForm(f=>({...f,email:e.target.value}))}/>
              </div>
              <div className="sec-form-group">
                <label className="sec-label">Ville</label>
                <input className="sec-input" maxLength={100} value={ptForm.city}
                  onChange={e=>setPtForm(f=>({...f,city:e.target.value}))}/>
              </div>
              <div className="sec-modal-actions">
                <button type="button" className="sec-btn-lg ghost" onClick={()=>setShowNewPatient(false)}>Annuler</button>
                <button type="submit" className="sec-btn-lg gold" disabled={saving}>{saving?'Enregistrement…':'Créer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && <div className={`sec-toast ${toast.type}`}>{toast.msg}</div>}
    </>
  )
}
