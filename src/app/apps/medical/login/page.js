'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Mail, Lock, Eye, EyeOff, AlertCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const CSS = `
  /* ── Full screen overlay — cache Navbar/Footer Walaup ── */
  .ml-root {
    position: fixed; inset: 0; z-index: 1000;
    display: flex; align-items: center; justify-content: center;
    background: #020B18;
    overflow: hidden;
  }

  /* ── Orbs médicaux ── */
  .ml-orb {
    position: absolute; border-radius: 50%; pointer-events: none;
  }
  .ml-orb--1 {
    width: 700px; height: 700px; top: -300px; left: -200px;
    background: radial-gradient(ellipse, rgba(14,165,233,.18) 0%, rgba(56,189,248,.08) 45%, transparent 70%);
    filter: blur(60px);
  }
  .ml-orb--2 {
    width: 500px; height: 500px; bottom: -200px; right: -150px;
    background: radial-gradient(ellipse, rgba(14,165,233,.12) 0%, transparent 70%);
    filter: blur(55px);
  }
  .ml-orb--3 {
    width: 300px; height: 300px; top: 50%; left: 55%;
    background: radial-gradient(ellipse, rgba(56,189,248,.06) 0%, transparent 70%);
    filter: blur(50px);
  }

  /* ── Card ── */
  .ml-card {
    position: relative; z-index: 1;
    width: 100%; max-width: 420px;
    background: rgba(8, 20, 36, 0.85);
    border: 1px solid rgba(14,165,233,.2);
    border-radius: 24px; padding: 36px 32px;
    box-shadow: 0 0 0 1px rgba(14,165,233,.08), 0 24px 80px rgba(0,0,0,.6);
    backdrop-filter: blur(20px);
    animation: mlSlideUp .3s cubic-bezier(.16,1,.3,1);
  }
  @keyframes mlSlideUp {
    from { opacity:0; transform: translateY(24px); }
    to   { opacity:1; transform: translateY(0); }
  }

  /* ── Logo ── */
  .ml-logo {
    display: flex; align-items: center; gap: 12px; margin-bottom: 28px;
  }
  .ml-logo-icon {
    width: 44px; height: 44px; border-radius: 14px;
    background: linear-gradient(135deg, #0EA5E9, #38BDF8);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 0 20px rgba(14,165,233,.4);
    flex-shrink: 0;
  }
  .ml-logo-icon svg { color: white; }
  .ml-logo-text { }
  .ml-logo-name {
    font-family: 'Space Grotesk', system-ui, sans-serif;
    font-weight: 800; font-size: 1.1rem;
    background: linear-gradient(135deg, #0EA5E9, #38BDF8);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text; line-height: 1;
  }
  .ml-logo-sub {
    font-size: .68rem; color: rgba(148,163,184,.7);
    letter-spacing: .06em; text-transform: uppercase;
    margin-top: 2px;
  }

  /* ── Title ── */
  .ml-title {
    font-family: 'Space Grotesk', system-ui, sans-serif;
    font-size: 1.4rem; font-weight: 700;
    color: #EEF0FF; margin-bottom: 6px;
  }
  .ml-subtitle {
    font-size: .82rem; color: rgba(148,163,184,.8);
    margin-bottom: 28px;
  }

  /* ── Form ── */
  .ml-form-group { margin-bottom: 16px; }
  .ml-label {
    display: block; font-size: .74rem; font-weight: 600;
    color: rgba(148,163,184,.9); margin-bottom: 7px;
    letter-spacing: .04em;
  }
  .ml-input-wrap {
    position: relative; display: flex; align-items: center;
  }
  .ml-input-icon {
    position: absolute; left: 13px; color: rgba(148,163,184,.5);
    pointer-events: none; display: flex;
  }
  .ml-input {
    width: 100%; padding: 11px 14px 11px 40px;
    background: rgba(14,165,233,.06);
    border: 1px solid rgba(14,165,233,.2);
    border-radius: 12px; color: #EEF0FF;
    font-size: .9rem; outline: none;
    transition: border-color .18s, box-shadow .18s;
    box-sizing: border-box;
  }
  .ml-input::placeholder { color: rgba(148,163,184,.4); }
  .ml-input:focus {
    border-color: #0EA5E9;
    box-shadow: 0 0 0 3px rgba(14,165,233,.15);
  }
  .ml-eye {
    position: absolute; right: 13px; cursor: pointer;
    color: rgba(148,163,184,.5); transition: color .15s;
    background: none; border: none; display: flex; padding: 0;
  }
  .ml-eye:hover { color: #0EA5E9; }

  /* ── Reset password ── */
  .ml-forgot {
    text-align: right; margin-top: -8px; margin-bottom: 16px;
  }
  .ml-forgot button {
    background: none; border: none; color: rgba(14,165,233,.8);
    font-size: .75rem; cursor: pointer; transition: color .15s;
  }
  .ml-forgot button:hover { color: #0EA5E9; }

  /* ── Error ── */
  .ml-error {
    display: flex; align-items: center; gap: 8px;
    padding: 10px 14px; border-radius: 10px;
    background: rgba(248,113,113,.1); border: 1px solid rgba(248,113,113,.25);
    color: #F87171; font-size: .8rem; margin-bottom: 16px;
  }

  /* ── Success ── */
  .ml-success {
    padding: 10px 14px; border-radius: 10px;
    background: rgba(16,185,129,.1); border: 1px solid rgba(16,185,129,.25);
    color: #10B981; font-size: .8rem; margin-bottom: 16px; text-align: center;
  }

  /* ── Submit ── */
  .ml-submit {
    width: 100%; padding: 12px;
    background: linear-gradient(135deg, #0EA5E9, #0284C7);
    border: none; border-radius: 12px;
    color: white; font-size: .92rem; font-weight: 700;
    cursor: pointer; transition: all .2s;
    box-shadow: 0 4px 20px rgba(14,165,233,.3);
    margin-top: 4px;
  }
  .ml-submit:hover { opacity: .9; box-shadow: 0 4px 28px rgba(14,165,233,.45); transform: translateY(-1px); }
  .ml-submit:disabled { opacity: .5; cursor: not-allowed; transform: none; }

  /* ── Divider ── */
  .ml-divider {
    display: flex; align-items: center; gap: 12px;
    margin: 20px 0; color: rgba(148,163,184,.4); font-size: .75rem;
  }
  .ml-divider::before, .ml-divider::after {
    content: ''; flex: 1; height: 1px;
    background: rgba(14,165,233,.15);
  }

  /* ── Role badges ── */
  .ml-roles {
    display: flex; gap: 6px; margin-bottom: 20px; flex-wrap: wrap;
  }
  .ml-role-badge {
    padding: 4px 10px; border-radius: 20px; font-size: .68rem;
    font-weight: 700; letter-spacing: .04em;
  }
  .ml-role-badge.doctor    { background: rgba(14,165,233,.12); color: #0EA5E9; border: 1px solid rgba(14,165,233,.25); }
  .ml-role-badge.secretary { background: rgba(245,158,11,.1);  color: #F59E0B; border: 1px solid rgba(245,158,11,.2); }
  .ml-role-badge.patient   { background: rgba(16,185,129,.1);  color: #10B981; border: 1px solid rgba(16,185,129,.2); }

  /* ── Back to Walaup ── */
  .ml-back {
    display: flex; align-items: center; justify-content: center;
    gap: 6px; margin-top: 24px;
    color: rgba(148,163,184,.5); font-size: .76rem;
    text-decoration: none; transition: color .15s;
  }
  .ml-back:hover { color: rgba(148,163,184,.9); }

  /* ── Powered by ── */
  .ml-powered {
    text-align: center; margin-top: 10px;
    font-size: .68rem; color: rgba(148,163,184,.3);
  }
  .ml-powered span { color: rgba(99,102,241,.6); font-weight: 700; }
`

/* ── Role redirect map ── */
const ROLE_REDIRECT = {
  tenant_admin:  '/apps/medical/doctor',
  tenant_user:   '/apps/medical/secretary',
  app_end_user:  '/apps/medical/patient',
  super_admin:   '/admin',
}

/* ── Sanitize ── */
function sanitizeEmail(v) {
  return String(v).trim().toLowerCase().slice(0, 254)
}

export default function MedicalLogin() {
  const router = useRouter()
  const [loginMethod, setLoginMethod] = useState('email') // 'email' | 'phone'
  const [email,    setEmail]    = useState('')
  const [phone,    setPhone]    = useState('')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [success,  setSuccess]  = useState('')

  async function handleLogin(e) {
    e.preventDefault()
    setError('')

    if (!password || password.length < 6) {
      setError('Mot de passe requis (minimum 6 caractères).'); return
    }

    let loginEmail = ''

    if (loginMethod === 'phone') {
      // Recherche email par téléphone dans public.users
      const cleanPhone = phone.trim().replace(/\s/g, '')
      if (!cleanPhone) { setError('Numéro de téléphone requis.'); return }
      const { data: userData } = await supabase
        .from('users').select('id').eq('phone', cleanPhone).maybeSingle()
      if (!userData) {
        // Chercher aussi dans med_patients
        const { data: ptData } = await supabase
          .from('med_patients').select('user_id').eq('phone', cleanPhone).maybeSingle()
        if (!ptData?.user_id) { setError('Aucun compte trouvé avec ce numéro.'); return }
        const { data: authUser } = await supabase.auth.admin?.getUserById?.(ptData.user_id) || {}
        if (!authUser) { setError('Compte introuvable.'); return }
      }
      // Récupérer l'email via auth (on cherche dans users par phone)
      const { data: userByPhone } = await supabase
        .from('users').select('id').eq('phone', cleanPhone).maybeSingle()
      if (!userByPhone) { setError('Aucun compte trouvé avec ce numéro.'); return }
      // On utilise une edge function ou on demande au user de saisir son email
      // Fallback simple: chercher l'email dans auth.users via phone stocké en metadata
      setError('Connexion par téléphone : utilisez votre email associé ou contactez votre médecin.'); 
      setLoading(false); return
    } else {
      const cleanEmail = sanitizeEmail(email)
      if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        setError('Adresse email invalide.'); return
      }
      loginEmail = cleanEmail
    }

    setLoading(true)
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password,
      })

      if (authError) {
        if (authError.message.includes('Invalid login')) {
          setError('Email ou mot de passe incorrect.')
        } else {
          setError('Erreur de connexion. Veuillez réessayer.')
        }
        setLoading(false)
        return
      }

      // Récupérer rôle + app_type
      const { data: userData } = await supabase
        .from('users')
        .select('role, app_type, is_active')
        .eq('id', data.user.id)
        .maybeSingle()

      if (!userData) {
        // RLS ou user non configuré — on continue quand même avec les infos de base
        setError('Compte non configuré. Contactez votre administrateur.')
        setLoading(false)
        return
      }

      if (userData.is_active === false) {
        setError('Compte inactif. Contactez votre médecin.')
        setLoading(false)
        return
      }

      if (userData.app_type !== 'medical') {
        setError("Ce compte n'est pas associé à MediLink OS.")
        setLoading(false)
        return
      }

      const redirect = ROLE_REDIRECT[userData.role] || '/apps/medical/patient'
      setLoading(false)
      router.push(redirect)

    } catch (err) {
      console.error('Login error:', err)
      setError('Erreur inattendue. Veuillez réessayer.')
      setLoading(false)
    }
  }

  async function handleForgotPassword() {
    const cleanEmail = sanitizeEmail(email)
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Saisissez votre email ci-dessus d\'abord.'); return
    }
    setLoading(true)
    try {
      await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${window.location.origin}/apps/medical/login`,
      })
      setSuccess('Email de réinitialisation envoyé. Vérifiez votre boîte mail.')
      setError('')
    } catch {
      setError('Erreur lors de l\'envoi. Réessayez.')
    }
    setLoading(false)
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="ml-root">
        {/* Orbs */}
        <div className="ml-orb ml-orb--1" />
        <div className="ml-orb ml-orb--2" />
        <div className="ml-orb ml-orb--3" />

        <div className="ml-card">
          {/* Logo */}
          <div className="ml-logo">
            <div className="ml-logo-icon">
              {/* Croix médicale SVG */}
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M9 3h6v6h6v6h-6v6H9v-6H3v-6h6V3z" fill="white"/>
              </svg>
            </div>
            <div className="ml-logo-text">
              <div className="ml-logo-name">MediLink OS</div>
              <div className="ml-logo-sub">Healthcare Operating System</div>
            </div>
          </div>

          {/* Rôles */}
          <div className="ml-roles">
            <span className="ml-role-badge doctor">Médecin</span>
            <span className="ml-role-badge secretary">Secrétaire</span>
            <span className="ml-role-badge patient">Patient</span>
          </div>

          {/* Toggle email/phone */}
          <div style={{ display:'flex', gap:4, marginBottom:18, background:'rgba(255,255,255,.05)', borderRadius:10, padding:4 }}>
            <button type="button" onClick={() => setLoginMethod('email')} style={{
              flex:1, padding:'7px', borderRadius:8, border:'none', cursor:'pointer', transition:'all .16s',
              background: loginMethod==='email' ? 'rgba(14,165,233,.2)' : 'transparent',
              color: loginMethod==='email' ? '#0EA5E9' : 'rgba(148,163,184,.6)',
              fontSize:'.78rem', fontWeight:700,
            }}>Email</button>
            <button type="button" onClick={() => setLoginMethod('phone')} style={{
              flex:1, padding:'7px', borderRadius:8, border:'none', cursor:'pointer', transition:'all .16s',
              background: loginMethod==='phone' ? 'rgba(14,165,233,.2)' : 'transparent',
              color: loginMethod==='phone' ? '#0EA5E9' : 'rgba(148,163,184,.6)',
              fontSize:'.78rem', fontWeight:700,
            }}>Téléphone</button>
          </div>

          <div className="ml-title">Connexion</div>
          <div className="ml-subtitle">Accédez à votre espace médical sécurisé</div>

          {error   && <div className="ml-error"><AlertCircle size={15}/>{error}</div>}
          {success && <div className="ml-success">{success}</div>}

          <form onSubmit={handleLogin} noValidate>
            {loginMethod === 'email' ? (
              <div className="ml-form-group">
                <label className="ml-label">Adresse email</label>
                <div className="ml-input-wrap">
                  <span className="ml-input-icon"><Mail size={16}/></span>
                  <input className="ml-input" type="email" placeholder="votre@email.com"
                    maxLength={254} value={email} onChange={e => setEmail(e.target.value)}
                    autoComplete="email" required/>
                </div>
              </div>
            ) : (
              <div className="ml-form-group">
                <label className="ml-label">Numéro de téléphone</label>
                <div className="ml-input-wrap">
                  <span className="ml-input-icon"><span style={{ fontSize:'.85rem', color:'rgba(148,163,184,.5)' }}>+216</span></span>
                  <input className="ml-input" type="tel" placeholder="XX XXX XXX"
                    style={{ paddingLeft:52 }}
                    maxLength={20} value={phone} onChange={e => setPhone(e.target.value)}
                    autoComplete="tel"/>
                </div>
              </div>
            )}

            <div className="ml-form-group">
              <label className="ml-label">Mot de passe</label>
              <div className="ml-input-wrap">
                <span className="ml-input-icon"><Lock size={16}/></span>
                <input
                  className="ml-input"
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  maxLength={128}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button type="button" className="ml-eye" onClick={() => setShowPw(p => !p)}>
                  {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </div>

            <div className="ml-forgot">
              <button type="button" onClick={handleForgotPassword} disabled={loading}>
                Mot de passe oublié ?
              </button>
            </div>

            <button type="submit" className="ml-submit" disabled={loading}>
              {loading ? 'Connexion en cours…' : 'Se connecter'}
            </button>
          </form>

          <Link href="/login" className="ml-back">
            <ArrowLeft size={13}/> Retour à l'espace client Walaup
          </Link>

          <div className="ml-powered">Propulsé par <span>Walaup</span></div>
        </div>
      </div>
    </>
  )
}
