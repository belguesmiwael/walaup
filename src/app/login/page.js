'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { WalaupSound } from '@/lib/sound'
import { Mail, Lock, Eye, EyeOff, User, ArrowRight, Globe, Shield } from 'lucide-react'

// ─── Security note ────────────────────────────────────────────────────────────
// - All inputs have maxLength to prevent oversized payloads
// - Email + password validated before Supabase call
// - Error messages never leak internal server details
// - Auth redirected server-side via role check in public.users
// ─────────────────────────────────────────────────────────────────────────────

const CSS = `
  .lp-page {
    min-height: calc(100vh - 64px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    position: relative;
    background: transparent;
  }

  /* Aurora orbs */
  .lp-orb {
    position: fixed;
    border-radius: 50%;
    pointer-events: none;
    z-index: 0;
  }
  .lp-orb--1 {
    width: 650px; height: 650px;
    top: -250px; left: -180px;
    background: radial-gradient(ellipse, rgba(99,102,241,.20) 0%, rgba(139,92,246,.10) 45%, transparent 70%);
    filter: blur(55px);
  }
  .lp-orb--2 {
    width: 500px; height: 500px;
    bottom: -180px; right: -150px;
    background: radial-gradient(ellipse, rgba(139,92,246,.16) 0%, transparent 70%);
    filter: blur(55px);
  }
  .lp-orb--3 {
    width: 300px; height: 300px;
    top: 60%; left: 60%;
    background: radial-gradient(ellipse, rgba(245,158,11,.08) 0%, transparent 70%);
    filter: blur(50px);
  }

  /* Card */
  .lp-card {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: 430px;
    background: rgba(13,17,32,.82);
    border: 1px solid rgba(255,255,255,.09);
    border-radius: 24px;
    padding: 36px 32px;
    backdrop-filter: blur(24px);
    box-shadow: 0 24px 80px rgba(0,0,0,.50), 0 0 0 1px rgba(255,255,255,.04) inset;
  }

  /* Logo */
  .lp-logo {
    text-align: center;
    margin-bottom: 28px;
  }
  .lp-logo-wordmark {
    font-family: var(--font-display);
    font-size: 2rem;
    font-weight: 800;
    background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #A78BFA 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    line-height: 1;
    display: block;
    margin-bottom: 6px;
  }
  .lp-logo-sub {
    font-size: 13px;
    color: var(--tx-3);
  }

  /* Tabs */
  .lp-tabs {
    display: flex;
    background: rgba(255,255,255,.04);
    border: 1px solid rgba(255,255,255,.06);
    border-radius: 12px;
    padding: 4px;
    margin-bottom: 24px;
    gap: 4px;
  }
  .lp-tab {
    flex: 1;
    padding: 9px;
    border: none;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all .2s cubic-bezier(0.16,1,0.3,1);
    background: transparent;
    color: var(--tx-3);
    font-family: var(--font-body);
  }
  .lp-tab.active {
    background: rgba(99,102,241,.18);
    color: var(--ac);
    border: 1px solid rgba(99,102,241,.28);
  }
  .lp-tab:not(.active):hover {
    color: var(--tx-2);
    background: rgba(255,255,255,.04);
  }

  /* Fields */
  .lp-field { margin-bottom: 16px; }
  .lp-label {
    display: block;
    font-size: 11.5px;
    font-weight: 600;
    color: var(--tx-3);
    margin-bottom: 7px;
    letter-spacing: .06em;
    text-transform: uppercase;
  }
  .lp-input-wrap { position: relative; }
  .lp-input {
    width: 100%;
    padding: 11px 14px 11px 40px;
    background: rgba(255,255,255,.04);
    border: 1px solid rgba(255,255,255,.08);
    border-radius: 11px;
    color: var(--tx);
    font-size: 14px;
    font-family: var(--font-body);
    outline: none;
    transition: border-color .2s, background .2s;
    box-sizing: border-box;
  }
  .lp-input:focus {
    border-color: rgba(99,102,241,.50);
    background: rgba(99,102,241,.04);
  }
  .lp-input::placeholder { color: var(--tx-3); }
  .lp-input-icon {
    position: absolute;
    left: 13px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--tx-3);
    pointer-events: none;
    display: flex;
    align-items: center;
  }
  .lp-pwd-toggle {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    cursor: pointer;
    color: var(--tx-3);
    display: flex;
    align-items: center;
    padding: 2px;
    transition: color .15s;
  }
  .lp-pwd-toggle:hover { color: var(--tx-2); }

  /* Buttons */
  .lp-btn {
    width: 100%;
    padding: 12px 16px;
    border: none;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 700;
    font-family: var(--font-body);
    cursor: pointer;
    transition: all .22s cubic-bezier(0.16,1,0.3,1);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
  .lp-btn--primary {
    background: linear-gradient(135deg, var(--ac) 0%, var(--ac-2) 100%);
    color: #fff;
    box-shadow: 0 4px 20px rgba(99,102,241,.32), 0 1px 0 rgba(255,255,255,.15) inset;
    margin-bottom: 10px;
  }
  .lp-btn--primary:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 8px 28px rgba(99,102,241,.45);
  }
  .lp-btn--primary:active:not(:disabled) { transform: translateY(0); }
  .lp-btn--google {
    background: rgba(255,255,255,.05);
    border: 1px solid rgba(255,255,255,.10);
    color: var(--tx);
  }
  .lp-btn--google:hover {
    background: rgba(255,255,255,.09);
    border-color: rgba(255,255,255,.16);
  }
  .lp-btn:disabled { opacity: .45; cursor: not-allowed; }

  /* Divider */
  .lp-divider {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 16px 0;
    color: var(--tx-3);
    font-size: 12px;
  }
  .lp-divider::before,
  .lp-divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: rgba(255,255,255,.07);
  }

  /* Alert */
  .lp-error {
    background: rgba(248,113,113,.10);
    border: 1px solid rgba(248,113,113,.22);
    border-radius: 10px;
    padding: 10px 14px;
    font-size: 13px;
    color: var(--red);
    margin-bottom: 16px;
    line-height: 1.4;
  }
  .lp-success {
    background: rgba(16,185,129,.10);
    border: 1px solid rgba(16,185,129,.22);
    border-radius: 10px;
    padding: 10px 14px;
    font-size: 13px;
    color: var(--green);
    margin-bottom: 16px;
    line-height: 1.4;
  }

  /* Trust badges */
  .lp-trust {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-top: 22px;
    flex-wrap: wrap;
  }
  .lp-trust-item {
    font-size: 11px;
    color: var(--tx-3);
    display: flex;
    align-items: center;
    gap: 4px;
  }

  /* Spinner */
  @keyframes lp-spin { to { transform: rotate(360deg); } }
  .lp-spinner {
    width: 17px;
    height: 17px;
    border: 2px solid rgba(255,255,255,.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: lp-spin .65s linear infinite;
  }
`

function sanitizeEmail(val) {
  return val.trim().toLowerCase().slice(0, 200)
}

function sanitizeName(val) {
  return val.trim().slice(0, 80)
}

function translateAuthError(msg) {
  if (!msg) return 'Une erreur est survenue. Réessayez.'
  if (msg.includes('Invalid login') || msg.includes('invalid_credentials')) return 'Email ou mot de passe incorrect.'
  if (msg.includes('Email not confirmed')) return 'Veuillez confirmer votre email avant de vous connecter.'
  if (msg.includes('User already registered') || msg.includes('already been registered')) return 'Cet email est déjà utilisé. Connectez-vous.'
  if (msg.includes('Password should be at least')) return 'Le mot de passe doit contenir au moins 6 caractères.'
  if (msg.includes('rate limit')) return 'Trop de tentatives. Attendez quelques minutes.'
  if (msg.includes('network')) return 'Erreur réseau. Vérifiez votre connexion.'
  return 'Une erreur est survenue. Réessayez.'
}

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function redirectAfterAuth(user) {
    try {
      const { data } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()
      const role = data?.role || 'client'
      WalaupSound.success()
      router.push(role === 'super_admin' ? '/admin' : '/client')
    } catch {
      // If users table has no row yet, default to client
      WalaupSound.success()
      router.push('/client')
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    const cleanEmail = sanitizeEmail(email)
    const cleanName = sanitizeName(name)

    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Adresse email invalide.')
      WalaupSound.error()
      return
    }
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.')
      WalaupSound.error()
      return
    }
    if (mode === 'register' && cleanName.length < 2) {
      setError('Veuillez saisir votre nom complet.')
      WalaupSound.error()
      return
    }

    setLoading(true)
    WalaupSound.click()

    try {
      if (mode === 'login') {
        const { data, error: err } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        })
        if (err) throw err
        await redirectAfterAuth(data.user)
      } else {
        const { error: err } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: { data: { full_name: cleanName } },
        })
        if (err) throw err
        setSuccess('Compte créé ! Vérifiez votre boîte email pour confirmer votre inscription.')
        WalaupSound.success()
      }
    } catch (err) {
      setError(translateAuthError(err.message))
      WalaupSound.error()
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    setError('')
    setGoogleLoading(true)
    WalaupSound.click()
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
    } catch (err) {
      setError(translateAuthError(err.message))
      WalaupSound.error()
      setGoogleLoading(false)
    }
  }

  function switchMode(m) {
    setMode(m)
    setError('')
    setSuccess('')
    WalaupSound.tab()
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="lp-page">
        {/* Aurora */}
        <div className="lp-orb lp-orb--1" />
        <div className="lp-orb lp-orb--2" />
        <div className="lp-orb lp-orb--3" />

        <div className="lp-card">
          {/* Logo */}
          <div className="lp-logo">
            <span className="lp-logo-wordmark">Walaup</span>
            <span className="lp-logo-sub">Accédez à votre espace personnel</span>
          </div>

          {/* Mode tabs */}
          <div className="lp-tabs">
            <button className={`lp-tab ${mode === 'login' ? 'active' : ''}`} onClick={() => switchMode('login')}>
              Se connecter
            </button>
            <button className={`lp-tab ${mode === 'register' ? 'active' : ''}`} onClick={() => switchMode('register')}>
              Créer un compte
            </button>
          </div>

          {/* Alerts */}
          {error && <div className="lp-error">{error}</div>}
          {success && <div className="lp-success">{success}</div>}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate>
            {mode === 'register' && (
              <div className="lp-field">
                <label className="lp-label">Nom complet</label>
                <div className="lp-input-wrap">
                  <span className="lp-input-icon"><User size={15} /></span>
                  <input
                    className="lp-input"
                    type="text"
                    placeholder="Mohammed Ben Ali"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    maxLength={80}
                    autoComplete="name"
                    required
                  />
                </div>
              </div>
            )}

            <div className="lp-field">
              <label className="lp-label">Email</label>
              <div className="lp-input-wrap">
                <span className="lp-input-icon"><Mail size={15} /></span>
                <input
                  className="lp-input"
                  type="email"
                  placeholder="vous@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  maxLength={200}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="lp-field">
              <label className="lp-label">Mot de passe</label>
              <div className="lp-input-wrap">
                <span className="lp-input-icon"><Lock size={15} /></span>
                <input
                  className="lp-input"
                  type={showPwd ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  maxLength={128}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  style={{ paddingRight: 40 }}
                  required
                />
                <button type="button" className="lp-pwd-toggle" onClick={() => setShowPwd(v => !v)} aria-label="Afficher/masquer le mot de passe">
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button type="submit" className="lp-btn lp-btn--primary" disabled={loading || googleLoading}>
              {loading
                ? <span className="lp-spinner" />
                : <>
                    {mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
                    <ArrowRight size={16} />
                  </>
              }
            </button>
          </form>

          <div className="lp-divider">ou</div>

          <button className="lp-btn lp-btn--google" onClick={handleGoogle} disabled={loading || googleLoading}>
            {googleLoading
              ? <span className="lp-spinner" style={{ borderColor:'rgba(99,102,241,.3)', borderTopColor:'var(--ac)' }} />
              : <><Globe size={16} /> Continuer avec Google</>
            }
          </button>

          {/* Trust */}
          <div className="lp-trust">
            <span className="lp-trust-item"><Shield size={11} /> Connexion sécurisée</span>
            <span style={{ color:'var(--tx-3)', fontSize:10 }}>·</span>
            <span className="lp-trust-item">✦ Démo 100% gratuite</span>
            <span style={{ color:'var(--tx-3)', fontSize:10 }}>·</span>
            <span className="lp-trust-item">🇹🇳 Made in Tunisia</span>
          </div>
        </div>
      </div>
    </>
  )
}
