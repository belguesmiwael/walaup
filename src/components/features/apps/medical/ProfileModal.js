'use client'
import { useState } from 'react'
import { X, User, Mail, Phone, Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const CSS = `
  .pm-bg {
    position:fixed; inset:0; z-index:9999;
    background:rgba(0,0,0,.75); backdrop-filter:blur(6px);
    display:flex; align-items:center; justify-content:center; padding:16px;
    animation:pmFade .18s;
  }
  @keyframes pmFade { from{opacity:0} to{opacity:1} }
  .pm-modal {
    background:var(--bg-elevated); border:1px solid var(--border-strong);
    border-radius:20px; padding:28px; width:100%; max-width:440px;
    box-shadow:var(--shadow-modal);
    animation:pmSlide .22s cubic-bezier(.16,1,.3,1);
  }
  @keyframes pmSlide { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
  .pm-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:22px; }
  .pm-title { font-family:var(--font-display); font-size:1.05rem; font-weight:700; color:var(--tx); }
  .pm-close { width:30px; height:30px; border-radius:8px; border:1px solid var(--border);
    background:transparent; color:var(--tx-2); cursor:pointer;
    display:flex; align-items:center; justify-content:center; transition:all .15s; }
  .pm-close:hover { background:var(--bg-hover); color:var(--tx); }

  /* ── Avatar ── */
  .pm-avatar-section { display:flex; align-items:center; gap:16px; margin-bottom:22px;
    padding-bottom:22px; border-bottom:1px solid var(--border); }
  .pm-avatar { width:60px; height:60px; border-radius:50%; flex-shrink:0;
    display:flex; align-items:center; justify-content:center;
    font-size:1.4rem; font-weight:800; color:white;
    background:linear-gradient(135deg,#0EA5E9,#38BDF8); }
  .pm-avatar.secretary { background:linear-gradient(135deg,var(--gold),var(--gold-light)); }
  .pm-avatar.patient   { background:linear-gradient(135deg,var(--green),#34D399); }
  .pm-avatar-info { flex:1; }
  .pm-avatar-name { font-weight:700; font-size:1rem; color:var(--tx); }
  .pm-avatar-role { font-size:.75rem; color:var(--tx-3); margin-top:3px; }
  .pm-role-badge { display:inline-block; padding:2px 10px; border-radius:20px;
    font-size:.68rem; font-weight:700; margin-top:5px; }
  .pm-role-badge.doctor    { background:rgba(14,165,233,.1); color:#0EA5E9; border:1px solid rgba(14,165,233,.2); }
  .pm-role-badge.secretary { background:rgba(245,158,11,.1); color:var(--gold); border:1px solid rgba(245,158,11,.2); }
  .pm-role-badge.patient   { background:rgba(16,185,129,.1); color:var(--green); border:1px solid rgba(16,185,129,.2); }

  /* ── Tabs ── */
  .pm-tabs { display:flex; gap:4px; margin-bottom:20px;
    background:var(--bg-base); border-radius:10px; padding:4px; }
  .pm-tab { flex:1; padding:7px; border-radius:8px; border:none;
    background:transparent; color:var(--tx-3); font-size:.78rem;
    font-weight:600; cursor:pointer; transition:all .16s; }
  .pm-tab.active { background:var(--bg-surface); color:var(--tx);
    box-shadow:0 1px 4px rgba(0,0,0,.2); }

  /* ── Form ── */
  .pm-fg { margin-bottom:13px; }
  .pm-label { display:block; font-size:.72rem; font-weight:600;
    color:var(--tx-2); margin-bottom:5px; letter-spacing:.03em; }
  .pm-input-wrap { position:relative; }
  .pm-input-icon { position:absolute; left:12px; top:50%; transform:translateY(-50%);
    color:var(--tx-3); pointer-events:none; display:flex; }
  .pm-input {
    width:100%; padding:9px 12px 9px 36px; border-radius:10px;
    border:1px solid var(--border); background:var(--bg-surface);
    color:var(--tx); font-size:.875rem; outline:none;
    transition:border-color .15s; box-sizing:border-box;
  }
  .pm-input:focus { border-color:#0EA5E9; box-shadow:0 0 0 3px rgba(14,165,233,.1); }
  .pm-input.readonly { opacity:.6; cursor:default; }
  .pm-eye { position:absolute; right:10px; top:50%; transform:translateY(-50%);
    background:none; border:none; color:var(--tx-3); cursor:pointer;
    display:flex; padding:2px; transition:color .15s; }
  .pm-eye:hover { color:#0EA5E9; }

  /* ── Messages ── */
  .pm-success { display:flex; align-items:center; gap:8px; padding:10px 13px;
    border-radius:10px; background:rgba(16,185,129,.1); border:1px solid rgba(16,185,129,.25);
    color:var(--green); font-size:.8rem; margin-bottom:12px; }
  .pm-error { display:flex; align-items:center; gap:8px; padding:10px 13px;
    border-radius:10px; background:rgba(248,113,113,.1); border:1px solid rgba(248,113,113,.25);
    color:var(--red); font-size:.8rem; margin-bottom:12px; }

  /* ── Actions ── */
  .pm-actions { display:flex; gap:8px; justify-content:flex-end; margin-top:16px; }
  .pm-btn { padding:8px 18px; border-radius:9px; font-size:.83rem; font-weight:600;
    cursor:pointer; border:none; transition:all .16s; }
  .pm-btn.ghost { background:var(--bg-surface); color:var(--tx-2); border:1px solid var(--border); }
  .pm-btn.ghost:hover { color:var(--tx); }
  .pm-btn.primary { background:#0EA5E9; color:white; }
  .pm-btn.primary:hover { background:#0284C7; }
  .pm-btn:disabled { opacity:.5; cursor:not-allowed; }
  .pm-divider { height:1px; background:var(--border); margin:16px 0; }
`

const ROLE_LABELS = {
  tenant_admin: 'Médecin',
  tenant_user:  'Secrétaire',
  app_end_user: 'Patient',
}
const ROLE_CLASS = {
  tenant_admin: 'doctor',
  tenant_user:  'secretary',
  app_end_user: 'patient',
}

export default function ProfileModal({ user, onClose }) {
  const [activeTab, setActiveTab] = useState('info')
  const [showPw,    setShowPw]    = useState(false)
  const [showPwNew, setShowPwNew] = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [success,   setSuccess]   = useState('')
  const [error,     setError]     = useState('')

  // Form login
  const [newEmail, setNewEmail] = useState(user?.email || '')
  const [newPhone, setNewPhone] = useState(user?.phone || '')

  // Form password
  const [currentPw, setCurrentPw] = useState('')
  const [newPw,     setNewPw]     = useState('')
  const [confirmPw, setConfirmPw] = useState('')

  const roleClass  = ROLE_CLASS[user?.role]  || 'doctor'
  const roleLabel  = ROLE_LABELS[user?.role] || user?.role
  const initials   = (user?.full_name || user?.email || '?')
    .split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

  function clear() { setSuccess(''); setError('') }

  async function handleUpdateEmail(e) {
    e.preventDefault()
    clear()
    if (!newEmail.trim()) { setError('Email requis'); return }
    setLoading(true)
    try {
      const { error: err } = await supabase.auth.updateUser({ email: newEmail.trim() })
      if (err) throw err
      setSuccess('Email mis à jour. Vérifiez votre boîte mail pour confirmer.')
    } catch (err) {
      setError(err.message || 'Erreur lors de la mise à jour')
    }
    setLoading(false)
  }

  async function handleUpdatePassword(e) {
    e.preventDefault()
    clear()
    if (newPw.length < 6) { setError('Minimum 6 caractères'); return }
    if (newPw !== confirmPw) { setError('Les mots de passe ne correspondent pas'); return }
    setLoading(true)
    try {
      const { error: err } = await supabase.auth.updateUser({ password: newPw })
      if (err) throw err
      setSuccess('Mot de passe mis à jour avec succès.')
      setCurrentPw(''); setNewPw(''); setConfirmPw('')
    } catch (err) {
      setError(err.message || 'Erreur lors de la mise à jour')
    }
    setLoading(false)
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="pm-bg" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="pm-modal">
          <div className="pm-header">
            <div className="pm-title">Mon profil</div>
            <button className="pm-close" onClick={onClose}><X size={14}/></button>
          </div>

          {/* Avatar */}
          <div className="pm-avatar-section">
            <div className={`pm-avatar ${roleClass}`}>{initials}</div>
            <div className="pm-avatar-info">
              <div className="pm-avatar-name">{user?.full_name || 'Utilisateur'}</div>
              <div className="pm-avatar-role">{user?.email}</div>
              <span className={`pm-role-badge ${roleClass}`}>{roleLabel}</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="pm-tabs">
            <button className={`pm-tab ${activeTab === 'info' ? 'active' : ''}`}
              onClick={() => { setActiveTab('info'); clear() }}>
              Informations
            </button>
            <button className={`pm-tab ${activeTab === 'password' ? 'active' : ''}`}
              onClick={() => { setActiveTab('password'); clear() }}>
              Mot de passe
            </button>
          </div>

          {success && <div className="pm-success"><CheckCircle2 size={14}/>{success}</div>}
          {error   && <div className="pm-error"><AlertCircle size={14}/>{error}</div>}

          {/* Tab Informations */}
          {activeTab === 'info' && (
            <form onSubmit={handleUpdateEmail}>
              <div className="pm-fg">
                <label className="pm-label">Nom complet</label>
                <div className="pm-input-wrap">
                  <span className="pm-input-icon"><User size={14}/></span>
                  <input className="pm-input readonly" value={user?.full_name || ''} readOnly/>
                </div>
              </div>
              <div className="pm-fg">
                <label className="pm-label">Adresse email</label>
                <div className="pm-input-wrap">
                  <span className="pm-input-icon"><Mail size={14}/></span>
                  <input className="pm-input" type="email" value={newEmail}
                    onChange={e => setNewEmail(e.target.value)} maxLength={254}/>
                </div>
              </div>
              {user?.phone && (
                <div className="pm-fg">
                  <label className="pm-label">Téléphone</label>
                  <div className="pm-input-wrap">
                    <span className="pm-input-icon"><Phone size={14}/></span>
                    <input className="pm-input readonly" value={user.phone} readOnly/>
                  </div>
                </div>
              )}
              <div className="pm-actions">
                <button type="button" className="pm-btn ghost" onClick={onClose}>Fermer</button>
                <button type="submit" className="pm-btn primary" disabled={loading}>
                  {loading ? 'Enregistrement…' : 'Mettre à jour'}
                </button>
              </div>
            </form>
          )}

          {/* Tab Mot de passe */}
          {activeTab === 'password' && (
            <form onSubmit={handleUpdatePassword}>
              <div className="pm-fg">
                <label className="pm-label">Nouveau mot de passe</label>
                <div className="pm-input-wrap">
                  <span className="pm-input-icon"><Lock size={14}/></span>
                  <input className="pm-input" type={showPwNew ? 'text' : 'password'}
                    placeholder="Minimum 6 caractères"
                    value={newPw} onChange={e => setNewPw(e.target.value)} maxLength={128}/>
                  <button type="button" className="pm-eye" onClick={() => setShowPwNew(p => !p)}>
                    {showPwNew ? <EyeOff size={14}/> : <Eye size={14}/>}
                  </button>
                </div>
              </div>
              <div className="pm-fg">
                <label className="pm-label">Confirmer le mot de passe</label>
                <div className="pm-input-wrap">
                  <span className="pm-input-icon"><Lock size={14}/></span>
                  <input className="pm-input" type={showPw ? 'text' : 'password'}
                    placeholder="Répétez le mot de passe"
                    value={confirmPw} onChange={e => setConfirmPw(e.target.value)} maxLength={128}/>
                  <button type="button" className="pm-eye" onClick={() => setShowPw(p => !p)}>
                    {showPw ? <EyeOff size={14}/> : <Eye size={14}/>}
                  </button>
                </div>
              </div>
              <div className="pm-actions">
                <button type="button" className="pm-btn ghost" onClick={onClose}>Fermer</button>
                <button type="submit" className="pm-btn primary" disabled={loading}>
                  {loading ? 'Mise à jour…' : 'Changer le mot de passe'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  )
}
