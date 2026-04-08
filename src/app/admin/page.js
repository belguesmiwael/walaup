'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AdminSidebar from '@/components/admin/AdminSidebar'
import TabOverview    from '@/components/admin/tabs/TabOverview'
import TabClients     from '@/components/admin/tabs/TabClients'
import TabMarketplace from '@/components/admin/tabs/TabMarketplace'
import TabPaiements   from '@/components/admin/tabs/TabPaiements'
import TabConfig      from '@/components/admin/tabs/TabConfig'
import { LayoutDashboard, Users, ShoppingBag, CreditCard, Settings } from 'lucide-react'

const DEMO_PASSWORD = 'walaup2025'

const MOB_NAV = [
  { id: 'overview',    label: 'KPIs',    Icon: LayoutDashboard },
  { id: 'clients',     label: 'Clients', Icon: Users },
  { id: 'marketplace', label: 'Market',  Icon: ShoppingBag },
  { id: 'paiements',   label: 'Paiem.',  Icon: CreditCard },
  { id: 'config',      label: 'Config',  Icon: Settings },
]

const CSS = `
  @keyframes adm-fade-in { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
  @keyframes adm-tab-in  { from{opacity:0;transform:translateX(10px)} to{opacity:1;transform:none} }

  *,*::before,*::after { box-sizing:border-box; }

  /* ── Fullscreen root ── */
  .adm-root {
    position: fixed !important;
    top: 0 !important; left: 0 !important;
    right: 0 !important; bottom: 0 !important;
    width: 100vw !important; height: 100vh !important;
    display: flex; flex-direction: column;
    overflow: hidden;
    background: var(--bg-base);
    z-index: 1000;
  }

  /* ── Aurora ── */
  .adm-orb { position:fixed; pointer-events:none; z-index:0; border-radius:50%; }
  .adm-orb-1 { width:600px;height:600px;top:-200px;left:-100px;
    background:radial-gradient(ellipse,rgba(99,102,241,.18) 0%,rgba(139,92,246,.08) 40%,transparent 70%);
    filter:blur(60px); }
  .adm-orb-2 { width:500px;height:500px;bottom:-150px;right:-100px;
    background:radial-gradient(ellipse,rgba(139,92,246,.15) 0%,transparent 70%);
    filter:blur(55px); }
  .adm-orb-3 { width:400px;height:400px;top:40%;right:30%;
    background:radial-gradient(ellipse,rgba(245,158,11,.10) 0%,transparent 70%);
    filter:blur(70px); }

  /* ── Body row ── */
  .adm-body {
    position: relative; z-index: 1;
    flex: 1; min-height: 0;
    display: flex; flex-direction: row;
    width: 100%; overflow: hidden;
  }

  /* ── Content fills remaining space ── */
  .adm-content {
    flex: 1; min-width: 0;
    overflow: hidden;
    display: flex; flex-direction: column;
    animation: adm-tab-in .22s cubic-bezier(0.16,1,0.3,1);
  }
  .adm-content-inner { flex:1; min-height:0; overflow:hidden; }

  /* ── Mobile bottom tabs ── */
  .adm-mobile-tabs {
    display: none;
    border-top: 1px solid rgba(255,255,255,0.07);
    background: rgba(8,11,20,0.97);
    flex-shrink: 0;
    z-index: 10;
  }
  .adm-mob-tab {
    flex: 1; display: flex; flex-direction: column;
    align-items: center; gap: 3px;
    padding: 9px 4px 7px;
    font-size: 9px; font-weight: 600;
    color: var(--tx-3); cursor: pointer;
    transition: color 150ms; border: none;
    background: transparent; font-family: 'Inter',sans-serif;
  }
  .adm-mob-tab--active { color: var(--ac); }

  @media (max-width:767px) {
    .adm-sidebar-wrap { display:none !important; }
    .adm-mobile-tabs  { display:flex !important; }
  }
  @media (min-width:768px) {
    .adm-sidebar-wrap { display:flex !important; }
    .adm-mobile-tabs  { display:none !important; }
  }

  /* ── Login ── */
  .adm-login {
    position:fixed; inset:0; background:var(--bg-base); z-index:9999;
    display:flex; align-items:center; justify-content:center;
  }
  .adm-login-card {
    width:380px; max-width:90vw;
    background:rgba(13,17,32,0.97); border:1px solid rgba(255,255,255,0.1);
    border-radius:20px; padding:32px;
    box-shadow:0 24px 80px rgba(0,0,0,0.7);
    animation:adm-fade-in .4s cubic-bezier(0.16,1,0.3,1);
  }
  .adm-login-logo {
    width:48px;height:48px;border-radius:14px;margin:0 auto 18px;
    background:linear-gradient(135deg,#6366F1,#8B5CF6);
    display:flex;align-items:center;justify-content:center;
    font-weight:800;font-size:22px;color:#fff;font-family:'Space Grotesk',sans-serif;
  }
  .adm-login-title { font-family:'Space Grotesk',sans-serif;font-weight:800;font-size:20px;color:var(--tx);text-align:center;margin-bottom:6px; }
  .adm-login-sub   { font-size:12px;color:var(--tx-3);text-align:center;margin-bottom:24px; }
  .adm-login-label { font-size:11px;font-weight:700;color:var(--tx-3);letter-spacing:.06em;text-transform:uppercase;margin-bottom:6px;display:block; }
  .adm-login-inp   { width:100%;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:11px 14px;color:var(--tx);font-size:14px;outline:none;margin-bottom:14px;font-family:'Inter',sans-serif; }
  .adm-login-inp:focus { border-color:rgba(99,102,241,0.5); }
  .adm-login-btn   { width:100%;padding:13px;border-radius:11px;background:linear-gradient(135deg,#6366F1,#8B5CF6);border:none;color:#fff;font-size:14px;font-weight:700;cursor:pointer;font-family:'Space Grotesk',sans-serif;transition:transform 150ms,box-shadow 200ms;box-shadow:0 0 30px rgba(99,102,241,0.3); }
  .adm-login-btn:hover  { transform:scale(1.02);box-shadow:0 0 40px rgba(99,102,241,0.45); }
  .adm-login-btn:active { transform:scale(0.97); }
  .adm-login-err  { font-size:12px;color:var(--red);text-align:center;margin-top:10px; }
  .adm-login-hint { font-size:11px;color:var(--tx-3);text-align:center;margin-top:14px;padding:8px 12px;border-radius:8px;background:rgba(99,102,241,0.06);border:1px solid rgba(99,102,241,0.15); }
`

export default function AdminPage() {
  const router = useRouter()
  const [authed, setAuthed]             = useState(false)
  const [loading, setLoading]           = useState(true)
  const [tab, setTab]                   = useState('overview')
  const [loginForm, setLoginForm]       = useState({ email: '', password: '' })
  const [loginErr, setLoginErr]         = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  /* ── Cache Navbar / Footer ── */
  useEffect(() => {
    if (typeof window === 'undefined') return
    const els = [
      ...document.querySelectorAll('nav'),
      ...document.querySelectorAll('header'),
      ...document.querySelectorAll('footer'),
    ]
    els.forEach(el => el.style.setProperty('display', 'none', 'important'))
    return () => els.forEach(el => el.style.removeProperty('display'))
  }, [])

  /* ── Vérifie session existante ── */
  useEffect(() => {
    const check = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          const { data } = await supabase.from('users').select('role').eq('id', session.user.id).maybeSingle()
          if (data?.role === 'super_admin') setAuthed(true)
        }
      } catch (_) {}
      if (typeof window !== 'undefined' && localStorage.getItem('walaup_admin_demo') === '1')
        setAuthed(true)
      setLoading(false)
    }
    check()
  }, [])

  const handleLogin = async () => {
    setLoginErr('')
    setLoginLoading(true)
    /* Demo bypass */
    if (loginForm.password === DEMO_PASSWORD) {
      if (typeof window !== 'undefined') localStorage.setItem('walaup_admin_demo', '1')
      setAuthed(true); setLoginLoading(false); return
    }
    /* Supabase */
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: loginForm.email, password: loginForm.password })
      if (error) { setLoginErr('Email ou mot de passe incorrect.'); setLoginLoading(false); return }
      const { data: ud } = await supabase.from('users').select('role').eq('id', data.user.id).maybeSingle()
      if (ud?.role !== 'super_admin') { setLoginErr('Accès refusé.'); await supabase.auth.signOut() }
      else setAuthed(true)
    } catch (_) { setLoginErr('Erreur réseau. Réessayez.') }
    setLoginLoading(false)
  }

  const handleLogout = async () => {
    if (typeof window !== 'undefined') localStorage.removeItem('walaup_admin_demo')
    await supabase.auth.signOut()
    router.push('/')
  }

  const TABS = {
    overview:    <TabOverview />,
    clients:     <TabClients />,
    marketplace: <TabMarketplace />,
    paiements:   <TabPaiements />,
    config:      <TabConfig />,
  }

  if (loading) return (
    <>
      <style>{CSS}</style>
      <div className="adm-root" style={{ alignItems:'center', justifyContent:'center' }}>
        <div style={{ color:'var(--tx-2)', fontSize:13 }}>Chargement...</div>
      </div>
    </>
  )

  return (
    <>
      <style>{CSS}</style>
      <div className="adm-orb adm-orb-1" />
      <div className="adm-orb adm-orb-2" />
      <div className="adm-orb adm-orb-3" />

      <div className="adm-root">

        {/* Login gate */}
        {!authed && (
          <div className="adm-login">
            <div className="adm-login-card">
              <div className="adm-login-logo">W</div>
              <div className="adm-login-title">Walaup Admin</div>
              <div className="adm-login-sub">Accès réservé à l'équipe Walaup</div>
              <label className="adm-login-label">Email</label>
              <input className="adm-login-inp" type="email" placeholder="admin@walaup.tn"
                value={loginForm.email} onChange={e => setLoginForm(p => ({ ...p, email: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && handleLogin()} />
              <label className="adm-login-label">Mot de passe</label>
              <input className="adm-login-inp" type="password" placeholder="••••••••••"
                value={loginForm.password} onChange={e => setLoginForm(p => ({ ...p, password: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && handleLogin()} />
              <button className="adm-login-btn" onClick={handleLogin} disabled={loginLoading}>
                {loginLoading ? 'Connexion...' : 'Accéder au dashboard'}
              </button>
              {loginErr && <div className="adm-login-err">{loginErr}</div>}
              <div className="adm-login-hint">Mode démo · mot de passe = <strong>walaup2025</strong></div>
            </div>
          </div>
        )}

        {/* Main */}
        <div className="adm-body">
          <div className="adm-sidebar-wrap">
            <AdminSidebar active={tab} onTab={setTab} unreadCount={3} pendingCount={2} onLogout={handleLogout} />
          </div>
          <div className="adm-content" key={tab}>
            <div className="adm-content-inner">{TABS[tab]}</div>
          </div>
        </div>

        {/* Mobile tabs — Lucide icons */}
        <div className="adm-mobile-tabs">
          {MOB_NAV.map(({ id, label, Icon }) => (
            <button key={id} className={`adm-mob-tab ${tab === id ? 'adm-mob-tab--active' : ''}`} onClick={() => setTab(id)}>
              <Icon size={18} strokeWidth={1.8} color={tab === id ? 'var(--ac)' : 'var(--tx-3)'} />
              {label}
            </button>
          ))}
        </div>

      </div>
    </>
  )
}
