'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AdminSidebar from '@/components/admin/AdminSidebar'
import TabOverview   from '@/components/admin/tabs/TabOverview'
import TabClients    from '@/components/admin/tabs/TabClients'
import TabMarketplace from '@/components/admin/tabs/TabMarketplace'
import TabPaiements  from '@/components/admin/tabs/TabPaiements'
import TabConfig     from '@/components/admin/tabs/TabConfig'


const CSS = `
  @keyframes adm-fade-in { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
  @keyframes adm-tab-in  { from { opacity:0; transform:translateX(12px); } to { opacity:1; transform:translateX(0); } }

  /* ── Root fullscreen ── */
  .adm-root { position:fixed; top:0; left:0; right:0; bottom:0;
    display:flex; flex-direction:column; overflow:hidden;
    background:var(--bg-base); z-index:1000; }

  /* ── Aurora ── */
  .adm-orb { position:fixed; pointer-events:none; z-index:0; border-radius:50%; }
  .adm-orb-1 { width:600px; height:600px; top:-200px; left:-100px;
    background:radial-gradient(ellipse,rgba(99,102,241,.18) 0%,rgba(139,92,246,.08) 40%,transparent 70%);
    filter:blur(60px); }
  .adm-orb-2 { width:500px; height:500px; bottom:-150px; right:-100px;
    background:radial-gradient(ellipse,rgba(139,92,246,.15) 0%,transparent 70%);
    filter:blur(55px); }
  .adm-orb-3 { width:400px; height:400px; top:40%; right:30%;
    background:radial-gradient(ellipse,rgba(245,158,11,.10) 0%,transparent 70%);
    filter:blur(70px); }

  /* ── Body ── */
  .adm-body { position:relative; flex:1; display:flex; overflow:hidden; z-index:1; }

  /* ── Content area ── */
  .adm-content { flex:1; overflow:hidden; display:flex; flex-direction:column; animation:adm-fade-in .3s cubic-bezier(0.16,1,0.3,1); }
  .adm-content-inner { flex:1; overflow:hidden; animation:adm-tab-in .24s cubic-bezier(0.16,1,0.3,1); }

  /* ── Login overlay ── */
  .adm-login { position:fixed; inset:0; background:var(--bg-base); z-index:9999;
    display:flex; align-items:center; justify-content:center; }
  .adm-login-card { width:380px; max-width:90vw; background:rgba(13,17,32,0.95);
    border:1px solid rgba(255,255,255,0.1); border-radius:20px; padding:32px;
    box-shadow:0 24px 80px rgba(0,0,0,0.7); animation:adm-fade-in .4s cubic-bezier(0.16,1,0.3,1); }
  .adm-login-logo { width:44px; height:44px; border-radius:14px; margin:0 auto 16px;
    background:linear-gradient(135deg,#6366F1,#8B5CF6);
    display:flex; align-items:center; justify-content:center;
    font-weight:800; font-size:20px; color:#fff; font-family:'Space Grotesk',sans-serif; }
  .adm-login-title { font-family:'Space Grotesk',sans-serif; font-weight:800;
    font-size:20px; color:var(--tx); text-align:center; margin-bottom:6px; }
  .adm-login-sub { font-size:12px; color:var(--tx-3); text-align:center; margin-bottom:24px; }
  .adm-login-label { font-size:11px; font-weight:700; color:var(--tx-3);
    letter-spacing:.06em; text-transform:uppercase; margin-bottom:6px; display:block; }
  .adm-login-inp { width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1);
    border-radius:10px; padding:11px 14px; color:var(--tx); font-size:14px;
    outline:none; margin-bottom:14px; font-family:'Inter',sans-serif; box-sizing:border-box; }
  .adm-login-inp:focus { border-color:rgba(99,102,241,0.5); }
  .adm-login-btn { width:100%; padding:13px; border-radius:11px;
    background:linear-gradient(135deg,#6366F1,#8B5CF6); border:none;
    color:#fff; font-size:14px; font-weight:700; cursor:pointer; margin-top:4px;
    font-family:'Space Grotesk',sans-serif; transition:transform 150ms, box-shadow 200ms;
    box-shadow:0 0 30px rgba(99,102,241,0.3); }
  .adm-login-btn:hover { transform:scale(1.02); box-shadow:0 0 40px rgba(99,102,241,0.45); }
  .adm-login-btn:active { transform:scale(0.97); }
  .adm-login-err { font-size:12px; color:var(--red); text-align:center; margin-top:8px; }
  .adm-login-demo { font-size:11px; color:var(--tx-3); text-align:center; margin-top:12px; }

  /* ── Mobile tabs ── */
  .adm-mobile-tabs { display:none; }
  @media(max-width:767px) {
    .adm-mobile-tabs { display:flex; border-top:1px solid rgba(255,255,255,0.07);
      background:rgba(8,11,20,0.96); flex-shrink:0; z-index:10; }
    .adm-mob-tab { flex:1; display:flex; flex-direction:column; align-items:center;
      gap:3px; padding:8px 4px; font-size:9px; font-weight:600; color:var(--tx-3);
      cursor:pointer; transition:color 150ms; border:none; background:transparent; }
    .adm-mob-tab--active { color:var(--ac); }
  }
`

const MOB_NAV = [
  { id: 'overview',    label: 'KPIs',    emoji: '📊' },
  { id: 'clients',     label: 'Clients', emoji: '👥' },
  { id: 'marketplace', label: 'Market',  emoji: '🏪' },
  { id: 'paiements',   label: 'Paiem.',  emoji: '💳' },
  { id: 'config',      label: 'Config',  emoji: '⚙️' },
]

export default function AdminPage() {
  const router = useRouter()
  const [authed, setAuthed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('overview')
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [loginErr, setLoginErr] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  // Hide Navbar/Footer (same pattern as client)
  useEffect(() => {
    const toHide = [
      ...document.querySelectorAll('nav'),
      ...document.querySelectorAll('header'),
      ...document.querySelectorAll('footer'),
    ]
    toHide.forEach(el => {
      el.dataset.admHidden = el.style.display
      el.style.setProperty('display', 'none', 'important')
    })
    return () => toHide.forEach(el => {
      el.style.removeProperty('display')
      delete el.dataset.admHidden
    })
  }, [])

  // Check existing session
useEffect(() => {
  const check = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const { data } = await supabase.from('users').select('role').eq('id', session.user.id).maybeSingle()
        if (data?.role === 'super_admin') { setAuthed(true) }
      }
    } catch (e) {}
    setLoading(false)
  }
  check()
}, [])

  const handleLogin = async (e) => {
    e?.preventDefault()
    setLoginErr('')
    setLoginLoading(true)


    // Supabase auth
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginForm.email,
        password: loginForm.password,
      })
      if (error) { setLoginErr('Email ou mot de passe incorrect.'); setLoginLoading(false); return }
      const { data: userData } = await supabase.from('users').select('role').eq('id', data.user.id).maybeSingle()
      if (userData?.role !== 'super_admin') {
        setLoginErr('Accès refusé — compte non autorisé.')
        await supabase.auth.signOut()
      } else {
        setAuthed(true)
      }
    } catch (e) {
      setLoginErr('Erreur réseau. Réessayez.')
    }
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
      <div className="adm-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--tx-2)', fontSize: 13 }}>Chargement...</div>
      </div>
    </>
  )

  return (
    <>
      <style>{CSS}</style>

      {/* Aurora orbs */}
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
              <input
                className="adm-login-inp" type="email" placeholder="admin@walaup.tn"
                value={loginForm.email}
                onChange={e => setLoginForm(p => ({ ...p, email: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
              <label className="adm-login-label">Mot de passe</label>
              <input
                className="adm-login-inp" type="password" placeholder="••••••••••"
                value={loginForm.password}
                onChange={e => setLoginForm(p => ({ ...p, password: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
              <button className="adm-login-btn" onClick={handleLogin} disabled={loginLoading}>
                {loginLoading ? 'Connexion...' : 'Accéder au dashboard'}
              </button>
              {loginErr && <div className="adm-login-err">{loginErr}</div>}
              
            </div>
          </div>
        )}

        {/* Main layout */}
        <div className="adm-body">
          {/* Sidebar (desktop) */}
          <div style={{ display: 'none' }} className="adm-sidebar-desktop">
            <AdminSidebar
              active={tab}
              onTab={setTab}
              unreadCount={3}
              pendingCount={2}
              onLogout={handleLogout}
            />
          </div>

          {/* Sidebar visible desktop */}
          <div style={{ display: 'flex', height: '100%' }} className="adm-layout-inner">
            <div className="adm-sidebar-wrap" style={{ display: 'flex', height: '100%' }}>
              <AdminSidebar
                active={tab}
                onTab={setTab}
                unreadCount={3}
                pendingCount={2}
                onLogout={handleLogout}
              />
            </div>

            {/* Content */}
            <div className="adm-content" key={tab}>
              <div className="adm-content-inner" style={{ height: '100%', overflow: 'hidden' }}>
                {TABS[tab]}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile bottom tabs */}
        <div className="adm-mobile-tabs">
          {MOB_NAV.map(n => (
            <button
              key={n.id}
              className={`adm-mob-tab ${tab === n.id ? 'adm-mob-tab--active' : ''}`}
              onClick={() => setTab(n.id)}
            >
              <span style={{ fontSize: 18 }}>{n.emoji}</span>
              {n.label}
            </button>
          ))}
        </div>
      </div>

      <style>{`
        @media(max-width:767px) {
          .adm-sidebar-wrap { display:none !important; }
        }
        @media(min-width:768px) {
          .adm-sidebar-wrap { display:flex !important; }
          .adm-mobile-tabs  { display:none !important; }
        }
      `}</style>
    </>
  )
}
