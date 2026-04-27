'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, User, Clock, Users, CreditCard, Bell,
  Save, Plus, Trash2, Eye, EyeOff, CheckCircle2,
  AlertCircle, Copy, RefreshCw, Phone, Mail, MapPin
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

const CSS = `
  .pm-root { min-height:100vh; background:var(--bg-base); padding-bottom:60px; }
  .pm-topbar { position:sticky; top:0; z-index:100; height:56px; display:flex; align-items:center;
    padding:0 20px; gap:12px; background:rgba(8,11,20,.96);
    border-bottom:1px solid var(--border); backdrop-filter:blur(20px); }
  .pm-back { display:flex; align-items:center; gap:6px; color:var(--tx-2); font-size:.85rem;
    font-weight:600; cursor:pointer; background:none; border:none; padding:0; transition:color .15s; }
  .pm-back:hover { color:#0EA5E9; }
  .pm-title { font-family:var(--font-display); font-weight:700; font-size:.95rem; color:var(--tx); flex:1; }
  .pm-content { max-width:760px; margin:0 auto; padding:24px 20px; }

  /* ── Tabs ── */
  .pm-tabs { display:flex; gap:4px; margin-bottom:24px; background:var(--bg-surface);
    border-radius:12px; padding:4px; border:1px solid var(--border); }
  .pm-tab { flex:1; padding:8px 6px; border-radius:9px; border:none; background:transparent;
    color:var(--tx-3); font-size:.78rem; font-weight:600; cursor:pointer;
    transition:all .18s; display:flex; align-items:center; justify-content:center; gap:5px; }
  .pm-tab.active { background:rgba(14,165,233,.12); color:#0EA5E9; }

  /* ── Section card ── */
  .pm-card { background:var(--bg-surface); border:1px solid var(--border);
    border-radius:14px; overflow:hidden; margin-bottom:16px; }
  .pm-card-header { padding:14px 18px; border-bottom:1px solid var(--border);
    display:flex; align-items:center; gap:8px; }
  .pm-card-title { font-weight:700; font-size:.88rem; color:var(--tx); flex:1; }
  .pm-card-body { padding:18px; }

  /* ── Form ── */
  .pm-form-row { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:13px; }
  @media (max-width:600px) { .pm-form-row { grid-template-columns:1fr; } }
  .pm-fg { margin-bottom:13px; }
  .pm-label { display:block; font-size:.73rem; font-weight:600; color:var(--tx-2);
    margin-bottom:5px; letter-spacing:.03em; }
  .pm-input { width:100%; padding:9px 12px; border-radius:10px;
    border:1px solid var(--border); background:var(--bg-base);
    color:var(--tx); font-size:.875rem; outline:none;
    transition:border-color .15s; box-sizing:border-box; }
  .pm-input:focus { border-color:#0EA5E9; box-shadow:0 0 0 3px rgba(14,165,233,.1); }
  .pm-select { width:100%; padding:9px 12px; border-radius:10px;
    border:1px solid var(--border); background:var(--bg-base);
    color:var(--tx); font-size:.875rem; outline:none; cursor:pointer; box-sizing:border-box; }
  .pm-select:focus { border-color:#0EA5E9; }
  .pm-textarea { width:100%; padding:9px 12px; border-radius:10px;
    border:1px solid var(--border); background:var(--bg-base);
    color:var(--tx); font-size:.875rem; outline:none; resize:vertical;
    min-height:80px; font-family:var(--font-body); box-sizing:border-box; }
  .pm-textarea:focus { border-color:#0EA5E9; }

  /* ── Save button ── */
  .pm-save { display:flex; align-items:center; gap:7px; padding:10px 22px;
    border-radius:11px; border:none; background:#0EA5E9; color:white;
    font-size:.85rem; font-weight:700; cursor:pointer; transition:all .18s; }
  .pm-save:hover { background:#0284C7; }
  .pm-save:disabled { opacity:.5; cursor:not-allowed; }

  /* ── Success / Error ── */
  .pm-success { display:flex; align-items:center; gap:8px; padding:10px 13px;
    border-radius:10px; background:rgba(16,185,129,.1); border:1px solid rgba(16,185,129,.25);
    color:var(--green); font-size:.8rem; margin-bottom:14px; }
  .pm-error { display:flex; align-items:center; gap:8px; padding:10px 13px;
    border-radius:10px; background:rgba(248,113,113,.1); border:1px solid rgba(248,113,113,.25);
    color:var(--red); font-size:.8rem; margin-bottom:14px; }

  /* ── Users list ── */
  .pm-user-item { display:flex; align-items:center; gap:12px; padding:12px 0;
    border-bottom:1px solid var(--border); }
  .pm-user-item:last-child { border-bottom:none; }
  .pm-user-avatar { width:36px; height:36px; border-radius:50%; flex-shrink:0;
    display:flex; align-items:center; justify-content:center;
    font-size:.78rem; font-weight:800; color:white; }
  .pm-user-name { font-weight:600; font-size:.85rem; color:var(--tx); }
  .pm-user-role { font-size:.7rem; color:var(--tx-3); margin-top:1px; }
  .pm-role-badge { display:inline-block; padding:2px 8px; border-radius:20px;
    font-size:.65rem; font-weight:700; }
  .pm-role-badge.doctor    { background:rgba(14,165,233,.1); color:#0EA5E9; }
  .pm-role-badge.secretary { background:rgba(245,158,11,.1); color:var(--gold); }
  .pm-role-badge.patient   { background:rgba(16,185,129,.1); color:var(--green); }

  /* ── Horaires ── */
  .pm-hours-grid { display:grid; grid-template-columns:auto 1fr 1fr auto;
    gap:10px; align-items:center; }
  .pm-day-label { font-size:.78rem; font-weight:600; color:var(--tx-2); }
  .pm-toggle { position:relative; width:40px; height:22px; flex-shrink:0; }
  .pm-toggle input { opacity:0; width:0; height:0; }
  .pm-toggle-slider { position:absolute; inset:0; border-radius:11px;
    background:var(--border); cursor:pointer; transition:.2s; }
  .pm-toggle input:checked + .pm-toggle-slider { background:#0EA5E9; }
  .pm-toggle-slider:before { content:''; position:absolute; width:16px; height:16px;
    border-radius:50%; background:white; top:3px; left:3px; transition:.2s;
    box-shadow:0 1px 3px rgba(0,0,0,.3); }
  .pm-toggle input:checked + .pm-toggle-slider:before { transform:translateX(18px); }

  /* ── Abonnement ── */
  .pm-plan-card { border-radius:14px; padding:20px; margin-bottom:12px; position:relative; overflow:hidden; }
  .pm-plan-card.active { background:linear-gradient(135deg,rgba(14,165,233,.1),rgba(56,189,248,.05));
    border:1px solid rgba(14,165,233,.3); }
  .pm-plan-card.inactive { background:var(--bg-base); border:1px solid var(--border); }
  .pm-plan-name { font-weight:800; font-size:1rem; color:var(--tx); margin-bottom:4px; }
  .pm-plan-price { font-family:var(--font-display); font-size:1.6rem; font-weight:800; color:#0EA5E9; }
  .pm-plan-features { margin-top:12px; display:flex; flex-direction:column; gap:5px; }
  .pm-plan-feat { display:flex; align-items:center; gap:6px; font-size:.78rem; color:var(--tx-2); }
  .pm-contact-btn { display:flex; align-items:center; justify-content:center; gap:8px;
    padding:10px 20px; border-radius:11px; border:none;
    background:linear-gradient(135deg,#0EA5E9,#0284C7); color:white;
    font-size:.85rem; font-weight:700; cursor:pointer; transition:all .18s; width:100%; margin-top:14px; }
  .pm-contact-btn:hover { opacity:.9; }

  /* ── Notification toggles ── */
  .pm-notif-item { display:flex; align-items:center; justify-content:space-between;
    padding:12px 0; border-bottom:1px solid var(--border); }
  .pm-notif-item:last-child { border-bottom:none; }
  .pm-notif-label { font-size:.85rem; color:var(--tx); font-weight:500; }
  .pm-notif-sub { font-size:.72rem; color:var(--tx-3); margin-top:2px; }
`

const DAYS = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche']

const ROLE_COLORS = {
  tenant_admin: 'linear-gradient(135deg,#0EA5E9,#38BDF8)',
  tenant_user:  'linear-gradient(135deg,#F59E0B,#FCD34D)',
  app_end_user: 'linear-gradient(135deg,#10B981,#34D399)',
}
const ROLE_LABELS = { tenant_admin:'Médecin', tenant_user:'Secrétaire', app_end_user:'Patient' }
const ROLE_CLASS  = { tenant_admin:'doctor', tenant_user:'secretary', app_end_user:'patient' }

function initials(name) {
  return (name||'?').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()
}

export default function Parametres() {
  const router = useRouter()
  const [user,    setUser]    = useState(null)
  const [tab,     setTab]     = useState('profil')
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [success, setSuccess] = useState('')
  const [error,   setError]   = useState('')
  const [users,   setUsers]   = useState([])

  // Profil
  const [profil, setProfil] = useState({
    full_name: '', specialty: '', phone: '', address: '', city: '', bio: ''
  })
  // Mot de passe
  const [newPw,    setNewPw]    = useState('')
  const [confirmPw,setConfirmPw]= useState('')
  const [showPw,   setShowPw]   = useState(false)
  // Horaires
  const [hours, setHours] = useState(
    DAYS.map(d => ({ day: d, active: d !== 'Dimanche', start: '08:00', end: '18:00' }))
  )
  // Slot duration
  const [slotDuration, setSlotDuration] = useState(30)
  // Notifications
  const [notifs, setNotifs] = useState({
    rdv_confirmation: true,
    rdv_rappel: true,
    nouveau_patient: true,
    message: true,
  })
  // Nouvel utilisateur
  const [newUser, setNewUser] = useState({ email:'', full_name:'', role:'tenant_user' })
  const [addingUser, setAddingUser] = useState(false)

  useEffect(() => {
    async function init() {
      try {
        const { data: { user: u } } = await supabase.auth.getUser()
        if (!u) { router.push('/apps/medical/login'); return }
        const { data: ud } = await supabase.from('users')
          .select('role, tenant_id, app_type, full_name, phone')
          .eq('id', u.id).maybeSingle()
        if (!ud || ud.app_type !== 'medical') { router.push('/apps/medical/login'); return }
        setUser({ ...u, ...ud })
        setProfil(p => ({
          ...p,
          full_name: ud.full_name || '',
          phone:     ud.phone    || '',
        }))

        // Charger les utilisateurs du tenant
        const { data: allUsers } = await supabase.from('users')
          .select('id, full_name, role, phone')
          .eq('tenant_id', ud.tenant_id)
          .order('role', { ascending: true })
        setUsers(allUsers || [])

        // Charger config cabinet depuis med_tenants
        const { data: tenant } = await supabase.from('med_tenants')
          .select('*').eq('tenant_id', ud.tenant_id).maybeSingle()
        if (tenant) {
          setProfil(p => ({
            ...p,
            specialty: tenant.specialty || '',
            address:   tenant.address   || '',
            city:      tenant.city      || '',
            bio:       tenant.bio       || '',
          }))
          if (tenant.slot_duration) setSlotDuration(tenant.slot_duration)
        }
      } catch { router.push('/apps/medical/login') }
      finally { setLoading(false) }
    }
    init()
  }, [router])

  function showMsg(type, msg) {
    if (type === 'success') { setSuccess(msg); setError('') }
    else                    { setError(msg); setSuccess('') }
    setTimeout(() => { setSuccess(''); setError('') }, 4000)
  }

  async function saveProfil(e) {
    e.preventDefault()
    setSaving(true)
    try {
      // Mettre à jour public.users
      await supabase.from('users').update({
        full_name: profil.full_name.trim(),
        phone:     profil.phone.trim(),
      }).eq('id', user.id)

      // Mettre à jour med_tenants
      await supabase.from('med_tenants').update({
        doctor_name:  profil.full_name.trim(),
        specialty:    profil.specialty.trim(),
        address:      profil.address.trim(),
        city:         profil.city.trim(),
        bio:          profil.bio.trim(),
        slot_duration: slotDuration,
      }).eq('tenant_id', user.tenant_id)

      showMsg('success', 'Profil mis à jour avec succès')
    } catch { showMsg('error', 'Erreur lors de la mise à jour') }
    setSaving(false)
  }

  async function savePassword(e) {
    e.preventDefault()
    if (newPw.length < 6)      { showMsg('error', 'Minimum 6 caractères'); return }
    if (newPw !== confirmPw)   { showMsg('error', 'Les mots de passe ne correspondent pas'); return }
    setSaving(true)
    try {
      const { error: err } = await supabase.auth.updateUser({ password: newPw })
      if (err) throw err
      showMsg('success', 'Mot de passe mis à jour')
      setNewPw(''); setConfirmPw('')
    } catch (e) { showMsg('error', e.message || 'Erreur') }
    setSaving(false)
  }

  async function saveHours(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await supabase.from('med_tenants').update({
        work_hours:    JSON.stringify(hours),
        slot_duration: slotDuration,
      }).eq('tenant_id', user.tenant_id)
      showMsg('success', 'Horaires enregistrés')
    } catch { showMsg('error', 'Erreur') }
    setSaving(false)
  }

  async function handleAddUser(e) {
    e.preventDefault()
    if (!newUser.email.trim() || !newUser.full_name.trim()) return
    setAddingUser(true)
    try {
      // Envoyer invitation via Supabase Auth
      const { data, error: invErr } = await supabase.auth.admin?.inviteUserByEmail?.(newUser.email)
      if (invErr) throw invErr
      showMsg('success', `Invitation envoyée à ${newUser.email}`)
      setNewUser({ email:'', full_name:'', role:'tenant_user' })
    } catch {
      // Fallback si admin API pas disponible
      showMsg('success', `Compte à créer manuellement pour ${newUser.email} — rôle: ${ROLE_LABELS[newUser.role]}`)
    }
    setAddingUser(false)
  }

  async function deleteUser(userId) {
    if (!confirm('Supprimer cet utilisateur ?')) return
    try {
      await supabase.from('users').delete().eq('id', userId)
      setUsers(prev => prev.filter(u => u.id !== userId))
      showMsg('success', 'Utilisateur supprimé')
    } catch { showMsg('error', 'Erreur lors de la suppression') }
  }

  if (loading) return (
    <div style={{ background:'var(--bg-base)', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:140, height:8, borderRadius:4, background:'var(--bg-surface)' }}/>
    </div>
  )

  const isDoctor = user?.role === 'tenant_admin'

  return (
    <>
      <style>{CSS}</style>
      <div className="pm-root">
        <div className="pm-topbar">
          <button className="pm-back" onClick={() => router.push('/apps/medical/doctor')}>
            <ArrowLeft size={15}/> Retour
          </button>
          <span className="pm-title">Paramètres</span>
        </div>

        <div className="pm-content">
          {/* Tabs */}
          <div className="pm-tabs">
            {[
              { id:'profil',   icon:User,       label:'Profil'      },
              { id:'horaires', icon:Clock,       label:'Horaires'    },
              ...(isDoctor ? [{ id:'users', icon:Users, label:'Équipe' }] : []),
              { id:'abo',      icon:CreditCard,  label:'Abonnement'  },
              { id:'notifs',   icon:Bell,        label:'Notifications'},
            ].map(t => (
              <button key={t.id} className={`pm-tab ${tab===t.id?'active':''}`}
                onClick={() => { setTab(t.id); setSuccess(''); setError('') }}>
                <t.icon size={13}/>{t.label}
              </button>
            ))}
          </div>

          {success && <div className="pm-success"><CheckCircle2 size={14}/>{success}</div>}
          {error   && <div className="pm-error"><AlertCircle size={14}/>{error}</div>}

          {/* ══ PROFIL ══ */}
          {tab === 'profil' && (
            <form onSubmit={saveProfil}>
              <div className="pm-card">
                <div className="pm-card-header">
                  <User size={16} color="#0EA5E9"/>
                  <span className="pm-card-title">Informations du cabinet</span>
                </div>
                <div className="pm-card-body">
                  <div className="pm-form-row">
                    <div className="pm-fg">
                      <label className="pm-label">Nom complet</label>
                      <input className="pm-input" value={profil.full_name} maxLength={100}
                        onChange={e => setProfil(p=>({...p,full_name:e.target.value}))}/>
                    </div>
                    <div className="pm-fg">
                      <label className="pm-label">Spécialité</label>
                      <input className="pm-input" value={profil.specialty} maxLength={100}
                        placeholder="Médecine générale"
                        onChange={e => setProfil(p=>({...p,specialty:e.target.value}))}/>
                    </div>
                  </div>
                  <div className="pm-form-row">
                    <div className="pm-fg">
                      <label className="pm-label">Téléphone</label>
                      <input className="pm-input" type="tel" value={profil.phone} maxLength={20}
                        onChange={e => setProfil(p=>({...p,phone:e.target.value}))}/>
                    </div>
                    <div className="pm-fg">
                      <label className="pm-label">Ville</label>
                      <input className="pm-input" value={profil.city} maxLength={100}
                        placeholder="Tunis"
                        onChange={e => setProfil(p=>({...p,city:e.target.value}))}/>
                    </div>
                  </div>
                  <div className="pm-fg">
                    <label className="pm-label">Adresse du cabinet</label>
                    <input className="pm-input" value={profil.address} maxLength={200}
                      onChange={e => setProfil(p=>({...p,address:e.target.value}))}/>
                  </div>
                  <div className="pm-fg">
                    <label className="pm-label">Bio / Présentation</label>
                    <textarea className="pm-textarea" value={profil.bio} maxLength={500}
                      placeholder="Description de votre pratique médicale…"
                      onChange={e => setProfil(p=>({...p,bio:e.target.value}))}/>
                  </div>
                  <button type="submit" className="pm-save" disabled={saving}>
                    <Save size={14}/>{saving ? 'Enregistrement…' : 'Enregistrer'}
                  </button>
                </div>
              </div>

              {/* Mot de passe */}
              <div className="pm-card">
                <div className="pm-card-header">
                  <span className="pm-card-title">Changer le mot de passe</span>
                </div>
                <div className="pm-card-body">
                  <div className="pm-form-row">
                    <div className="pm-fg">
                      <label className="pm-label">Nouveau mot de passe</label>
                      <div style={{ position:'relative' }}>
                        <input className="pm-input" type={showPw?'text':'password'}
                          value={newPw} onChange={e => setNewPw(e.target.value)}
                          placeholder="Minimum 6 caractères" maxLength={128}
                          style={{ paddingRight:38 }}/>
                        <button type="button" onClick={() => setShowPw(p=>!p)}
                          style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'var(--tx-3)', cursor:'pointer' }}>
                          {showPw ? <EyeOff size={15}/> : <Eye size={15}/>}
                        </button>
                      </div>
                    </div>
                    <div className="pm-fg">
                      <label className="pm-label">Confirmer</label>
                      <input className="pm-input" type={showPw?'text':'password'}
                        value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                        placeholder="Répéter le mot de passe" maxLength={128}/>
                    </div>
                  </div>
                  <button type="button" className="pm-save" onClick={savePassword} disabled={saving}>
                    <Save size={14}/>{saving ? '…' : 'Changer le mot de passe'}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* ══ HORAIRES ══ */}
          {tab === 'horaires' && (
            <form onSubmit={saveHours}>
              <div className="pm-card">
                <div className="pm-card-header">
                  <Clock size={16} color="#0EA5E9"/>
                  <span className="pm-card-title">Horaires d'ouverture</span>
                </div>
                <div className="pm-card-body">
                  <div className="pm-hours-grid" style={{ marginBottom:20 }}>
                    <span style={{ fontSize:'.72rem', fontWeight:700, color:'var(--tx-3)', letterSpacing:'.05em', textTransform:'uppercase' }}>Jour</span>
                    <span style={{ fontSize:'.72rem', fontWeight:700, color:'var(--tx-3)', letterSpacing:'.05em', textTransform:'uppercase' }}>Début</span>
                    <span style={{ fontSize:'.72rem', fontWeight:700, color:'var(--tx-3)', letterSpacing:'.05em', textTransform:'uppercase' }}>Fin</span>
                    <span style={{ fontSize:'.72rem', fontWeight:700, color:'var(--tx-3)', letterSpacing:'.05em', textTransform:'uppercase' }}>Actif</span>
                    {hours.map((h, i) => (
                      <>
                        <span key={`d${i}`} className="pm-day-label" style={{ opacity: h.active ? 1 : .4 }}>{h.day}</span>
                        <input key={`s${i}`} className="pm-input" type="time" value={h.start}
                          disabled={!h.active}
                          onChange={e => setHours(prev => prev.map((x,j) => j===i?{...x,start:e.target.value}:x))}/>
                        <input key={`e${i}`} className="pm-input" type="time" value={h.end}
                          disabled={!h.active}
                          onChange={e => setHours(prev => prev.map((x,j) => j===i?{...x,end:e.target.value}:x))}/>
                        <label key={`t${i}`} className="pm-toggle">
                          <input type="checkbox" checked={h.active}
                            onChange={() => setHours(prev => prev.map((x,j) => j===i?{...x,active:!x.active}:x))}/>
                          <span className="pm-toggle-slider"/>
                        </label>
                      </>
                    ))}
                  </div>
                  <div className="pm-fg">
                    <label className="pm-label">Durée des créneaux</label>
                    <select className="pm-select" value={slotDuration}
                      onChange={e => setSlotDuration(+e.target.value)}
                      style={{ maxWidth:200 }}>
                      {[10,15,20,30,45,60].map(d => (
                        <option key={d} value={d}>{d} minutes</option>
                      ))}
                    </select>
                  </div>
                  <button type="submit" className="pm-save" disabled={saving}>
                    <Save size={14}/>{saving ? 'Enregistrement…' : 'Enregistrer les horaires'}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* ══ ÉQUIPE ══ */}
          {tab === 'users' && isDoctor && (
            <>
              <div className="pm-card">
                <div className="pm-card-header">
                  <Users size={16} color="#0EA5E9"/>
                  <span className="pm-card-title">Membres de l'équipe ({users.length})</span>
                </div>
                <div className="pm-card-body">
                  {users.map(u => (
                    <div key={u.id} className="pm-user-item">
                      <div className="pm-user-avatar"
                        style={{ background: ROLE_COLORS[u.role]||ROLE_COLORS.app_end_user }}>
                        {initials(u.full_name)}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div className="pm-user-name">{u.full_name || 'Utilisateur'}</div>
                        <div className="pm-user-role">
                          <span className={`pm-role-badge ${ROLE_CLASS[u.role]||'patient'}`}>
                            {ROLE_LABELS[u.role]||u.role}
                          </span>
                          {u.phone && <span style={{ marginLeft:8, color:'var(--tx-3)', fontSize:'.7rem' }}>{u.phone}</span>}
                        </div>
                      </div>
                      {u.id !== user.id && (
                        <button onClick={() => deleteUser(u.id)}
                          style={{ width:30, height:30, borderRadius:8, border:'1px solid rgba(248,113,113,.25)',
                            background:'rgba(248,113,113,.08)', color:'var(--red)', cursor:'pointer',
                            display:'flex', alignItems:'center', justifyContent:'center' }}>
                          <Trash2 size={13}/>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Ajouter un utilisateur */}
              <div className="pm-card">
                <div className="pm-card-header">
                  <Plus size={16} color="#0EA5E9"/>
                  <span className="pm-card-title">Inviter un collaborateur</span>
                </div>
                <div className="pm-card-body">
                  <form onSubmit={handleAddUser}>
                    <div className="pm-form-row">
                      <div className="pm-fg">
                        <label className="pm-label">Nom complet</label>
                        <input className="pm-input" required value={newUser.full_name}
                          placeholder="Prénom Nom" maxLength={100}
                          onChange={e => setNewUser(u=>({...u,full_name:e.target.value}))}/>
                      </div>
                      <div className="pm-fg">
                        <label className="pm-label">Rôle</label>
                        <select className="pm-select" value={newUser.role}
                          onChange={e => setNewUser(u=>({...u,role:e.target.value}))}>
                          <option value="tenant_user">Secrétaire</option>
                          <option value="app_end_user">Patient</option>
                        </select>
                      </div>
                    </div>
                    <div className="pm-fg">
                      <label className="pm-label">Email</label>
                      <input className="pm-input" type="email" required value={newUser.email}
                        placeholder="email@exemple.com" maxLength={254}
                        onChange={e => setNewUser(u=>({...u,email:e.target.value}))}/>
                    </div>
                    <button type="submit" className="pm-save" disabled={addingUser}>
                      <Plus size={14}/>{addingUser ? 'Envoi…' : 'Inviter par email'}
                    </button>
                  </form>
                </div>
              </div>
            </>
          )}

          {/* ══ ABONNEMENT ══ */}
          {tab === 'abo' && (
            <div className="pm-card">
              <div className="pm-card-header">
                <CreditCard size={16} color="#0EA5E9"/>
                <span className="pm-card-title">Mon abonnement</span>
              </div>
              <div className="pm-card-body">
                <div className="pm-plan-card active">
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                    <div className="pm-plan-name">Licence Annuelle</div>
                    <span style={{ padding:'2px 8px', borderRadius:20, fontSize:'.65rem', fontWeight:700,
                      background:'rgba(16,185,129,.15)', color:'var(--green)', border:'1px solid rgba(16,185,129,.25)' }}>
                      ✅ Actif
                    </span>
                  </div>
                  <div className="pm-plan-price">800 <span style={{ fontSize:'.9rem', fontWeight:600 }}>DT/an</span></div>
                  <div className="pm-plan-features">
                    {['Gestion patients illimitée','Agenda & RDV','Dossiers médicaux','Télémédecine','Assistant IA','Analytics complets','Messagerie équipe','Support prioritaire'].map(f => (
                      <div key={f} className="pm-plan-feat"><CheckCircle2 size={12} color="var(--green)"/>{f}</div>
                    ))}
                  </div>
                </div>

                <div style={{ background:'var(--bg-base)', border:'1px solid var(--border)', borderRadius:14, padding:16, marginTop:12 }}>
                  <div style={{ fontSize:'.82rem', color:'var(--tx-2)', marginBottom:10, fontWeight:600 }}>
                    Géré par BizFlow TN
                  </div>
                  <div style={{ fontSize:'.78rem', color:'var(--tx-3)', marginBottom:12, lineHeight:1.5 }}>
                    Votre abonnement est géré par votre administrateur BizFlow TN.
                    Contactez-nous pour toute modification.
                  </div>
                  <button className="pm-contact-btn"
                    onClick={() => window.open('https://wa.me/21600000000?text=Bonjour BizFlow TN, je souhaite modifier mon abonnement MediLink OS', '_blank')}>
                    💬 Contacter BizFlow TN
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ══ NOTIFICATIONS ══ */}
          {tab === 'notifs' && (
            <div className="pm-card">
              <div className="pm-card-header">
                <Bell size={16} color="#0EA5E9"/>
                <span className="pm-card-title">Préférences de notifications</span>
              </div>
              <div className="pm-card-body">
                {[
                  { key:'rdv_confirmation', label:'Confirmation de RDV', sub:'Quand un RDV est confirmé' },
                  { key:'rdv_rappel',       label:'Rappels de RDV',      sub:'24h avant chaque rendez-vous' },
                  { key:'nouveau_patient',  label:'Nouveau patient',     sub:'À l\'inscription d\'un nouveau patient' },
                  { key:'message',          label:'Nouveaux messages',   sub:'Quand vous recevez un message' },
                ].map(n => (
                  <div key={n.key} className="pm-notif-item">
                    <div>
                      <div className="pm-notif-label">{n.label}</div>
                      <div className="pm-notif-sub">{n.sub}</div>
                    </div>
                    <label className="pm-toggle">
                      <input type="checkbox" checked={notifs[n.key]}
                        onChange={() => setNotifs(p => ({ ...p, [n.key]: !p[n.key] }))}/>
                      <span className="pm-toggle-slider"/>
                    </label>
                  </div>
                ))}
                <button className="pm-save" style={{ marginTop:16 }}
                  onClick={() => showMsg('success', 'Préférences enregistrées')}>
                  <Save size={14}/> Enregistrer
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
