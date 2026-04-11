'use client'
import { LayoutDashboard, Users, ShoppingBag, CreditCard, Settings } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AdminSidebar    from '@/components/admin/AdminSidebar'
import TabOverview     from '@/components/admin/tabs/TabOverview'
import TabClients      from '@/components/admin/tabs/TabClients'
import TabMarketplace  from '@/components/admin/tabs/TabMarketplace'
import TabPaiements    from '@/components/admin/tabs/TabPaiements'
import TabConfig       from '@/components/admin/tabs/TabConfig'

/* ─────────────────────────────────────────────────────────────────
   CSS — scoped, no tailwind dependency
───────────────────────────────────────────────────────────────── */
const CSS = `
  @keyframes adm-fade-in {
    from { opacity:0; transform:translateY(8px); }
    to   { opacity:1; transform:translateY(0);   }
  }
  @keyframes adm-tab-in {
    from { opacity:0; transform:translateX(10px); }
    to   { opacity:1; transform:translateX(0);    }
  }

  /* ── Root : couvre tout l'écran ── */
  .adm-root {
    position: fixed;
    inset: 0;
    display: flex;
    flex-direction: column;
    background: var(--bg-base);
    z-index: 1000;
    overflow: hidden;
  }

  /* ── Aurora orbs ── */
  .adm-orb { position:fixed; pointer-events:none; z-index:0; border-radius:50%; }
  .adm-orb-1 {
    width:600px; height:600px; top:-200px; left:-100px;
    background:radial-gradient(ellipse,rgba(99,102,241,.18) 0%,rgba(139,92,246,.08) 40%,transparent 70%);
    filter:blur(60px);
  }
  .adm-orb-2 {
    width:500px; height:500px; bottom:-150px; right:-100px;
    background:radial-gradient(ellipse,rgba(139,92,246,.15) 0%,transparent 70%);
    filter:blur(55px);
  }
  .adm-orb-3 {
    width:400px; height:400px; top:40%; right:30%;
    background:radial-gradient(ellipse,rgba(245,158,11,.10) 0%,transparent 70%);
    filter:blur(70px);
  }

  /* ── Body : sidebar + contenu ── */
  .adm-body {
    position: relative;
    flex: 1;
    display: flex;
    overflow: hidden;
    z-index: 1;
    min-height: 0;
  }

  /* ── Sidebar wrapper ── */
  .adm-sidebar-wrap {
    display: flex;
    height: 100%;
    flex-shrink: 0;
  }

  /* ── Zone de contenu ── */
  .adm-content {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    animation: adm-fade-in .3s cubic-bezier(0.16,1,0.3,1);
  }
  .adm-content-inner {
    flex: 1;
    overflow: hidden;
    min-height: 0;
    animation: adm-tab-in .24s cubic-bezier(0.16,1,0.3,1);
  }

  /* ── Login overlay ── */
  .adm-login {
    position: fixed; inset: 0;
    background: var(--bg-base);
    z-index: 9999;
    display: flex; align-items: center; justify-content: center;
    padding: 16px;
  }
  .adm-login-card {
    width: 380px; max-width: 100%;
    background: rgba(13,17,32,0.95);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 20px; padding: 32px;
    box-shadow: 0 24px 80px rgba(0,0,0,0.7);
    animation: adm-fade-in .4s cubic-bezier(0.16,1,0.3,1);
  }
  .adm-login-logo {
    width:44px; height:44px; border-radius:14px; margin:0 auto 16px;
    background: linear-gradient(135deg,#6366F1,#8B5CF6);
    display:flex; align-items:center; justify-content:center;
    font-weight:800; font-size:20px; color:#fff;
    font-family:'Space Grotesk',sans-serif;
  }
  .adm-login-title {
    font-family:'Space Grotesk',sans-serif; font-weight:800;
    font-size:20px; color:var(--tx); text-align:center; margin-bottom:6px;
  }
  .adm-login-sub { font-size:12px; color:var(--tx-3); text-align:center; margin-bottom:24px; }
  .adm-login-label {
    font-size:11px; font-weight:700; color:var(--tx-3);
    letter-spacing:.06em; text-transform:uppercase;
    margin-bottom:6px; display:block;
  }
  .adm-login-inp {
    width:100%; background:rgba(255,255,255,0.05);
    border:1px solid rgba(255,255,255,0.1); border-radius:10px;
    padding:11px 14px; color:var(--tx); font-size:14px;
    outline:none; margin-bottom:14px;
    font-family:'Inter',sans-serif; box-sizing:border-box;
    transition:border-color 150ms;
  }
  .adm-login-inp:focus { border-color:rgba(99,102,241,0.5); }
  .adm-login-btn {
    width:100%; padding:13px; border-radius:11px;
    background:linear-gradient(135deg,#6366F1,#8B5CF6); border:none;
    color:#fff; font-size:14px; font-weight:700; cursor:pointer; margin-top:4px;
    font-family:'Space Grotesk',sans-serif;
    transition:transform 150ms, box-shadow 200ms;
    box-shadow:0 0 30px rgba(99,102,241,0.3);
  }
  .adm-login-btn:hover  { transform:scale(1.02); box-shadow:0 0 40px rgba(99,102,241,0.45); }
  .adm-login-btn:active { transform:scale(0.97); }
  .adm-login-btn:disabled { opacity:.7; cursor:not-allowed; transform:none; }
  .adm-login-err { font-size:12px; color:var(--red); text-align:center; margin-top:8px; }

  /* ── Chargement ── */
  .adm-loading {
    position:fixed; inset:0;
    background:var(--bg-base); z-index:9999;
    display:flex; align-items:center; justify-content:center;
    font-size:13px; color:var(--tx-3); font-family:'Inter',sans-serif;
    gap:10px;
  }
  .adm-loading-dot {
    width:6px; height:6px; border-radius:50%;
    background:var(--ac); animation:adm-fade-in .6s ease-in-out infinite alternate;
  }
  .adm-loading-dot:nth-child(2) { animation-delay:.2s; }
  .adm-loading-dot:nth-child(3) { animation-delay:.4s; }

  /* ── Mobile bottom tabs ── */
  .adm-mobile-tabs { display:none; }

  /* ── Responsive ── */
  @media(max-width:767px) {
  .adm-sidebar-wrap { display:none !important; }
  .adm-mobile-tabs {
    display: flex;
    border-top: 1px solid rgba(255,255,255,0.07);
    background: rgba(8,11,20,0.97);
    flex-shrink: 0;
    z-index: 10;
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }
  .adm-mob-tab {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 10px 4px 8px;
    font-size: 9px;
    font-weight: 600;
    color: var(--tx-3);
    cursor: pointer;
    transition: color 150ms;
    border: none;
    background: transparent;
    font-family: 'Inter', sans-serif;
  }
  .adm-mob-tab--active { color: var(--ac); }
  .adm-mob-tab svg { transition: stroke-width 150ms; }
}
  @media(min-width:768px) {
    .adm-sidebar-wrap { display:flex !important; }
    .adm-mobile-tabs  { display:none !important; }
  }
`

/* ─────────────────────────────────────────────────────────────────
   Mobile nav config
───────────────────────────────────────────────────────────────── */
const MOB_NAV = [
  { id: 'overview',    label: 'KPIs',    icon: LayoutDashboard },
  { id: 'clients',     label: 'Clients', icon: Users           },
  { id: 'marketplace', label: 'Market',  icon: ShoppingBag     },
  { id: 'paiements',   label: 'Paiem.',  icon: CreditCard      },
  { id: 'config',      label: 'Config',  icon: Settings        },
]

/* ─────────────────────────────────────────────────────────────────
   Page
───────────────────────────────────────────────────────────────── */
export default function AdminPage() {
  const router = useRouter()

  const [authed,       setAuthed]       = useState(false)
  const [loading,      setLoading]      = useState(true)
  const [tab,          setTab]          = useState('overview')
  const [loginForm,    setLoginForm]    = useState({ email: '', password: '' })
  const [loginErr,     setLoginErr]     = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [unreadCount,  setUnreadCount]  = useState(0)   
  const [pendingCount, setPendingCount] = useState(0)   
  const leadsRtRef = useRef(null)                       
  const msgsRtRef  = useRef(null) 

  /* ── Masquer navbar / footer globaux ── */
  useEffect(() => {
    const toHide = [
      ...document.querySelectorAll('nav'),
      ...document.querySelectorAll('header'),
      ...document.querySelectorAll('footer'),
    ]
    toHide.forEach(el => el.style.setProperty('display', 'none', 'important'))
    return () => toHide.forEach(el => el.style.removeProperty('display'))
  }, [])

/* ── Vérifier la session existante ── */
  useEffect(() => {
    const check = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
         const { data: userData } = await supabase
  .from('users')
  .select('role')
  .eq('id', session.user.id)
  .maybeSingle()
if (userData?.role === 'super_admin') setAuthed(true)
   }
      } catch (_) {}
      setLoading(false)
    }
    check()
  }, [])   // ← FIN DU USEEFFECT EXISTANT

  /* ── Realtime badges admin — se lance seulement après auth ── */  // ← COLLE ICI
  useEffect(() => {
    if (!authed) return

    const fetchCounts = async () => {
      const { count: pending } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'new')
      if (pending != null) setPendingCount(pending)

      const { count: unread } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('sender', 'client')
        .eq('is_read', false)
      if (unread != null) setUnreadCount(unread)
    }
    fetchCounts()

    if (leadsRtRef.current) supabase.removeChannel(leadsRtRef.current)
    leadsRtRef.current = supabase
      .channel('admin-leads-rt')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'leads' }, () => {
        setPendingCount(c => c + 1)
        WalaupSound.notif()
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'leads' }, ({ new: lead }) => {
        if (lead.status !== 'new') setPendingCount(c => Math.max(0, c - 1))
      })
      .subscribe()

    if (msgsRtRef.current) supabase.removeChannel(msgsRtRef.current)
    msgsRtRef.current = supabase
      .channel('admin-msgs-rt')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, ({ new: msg }) => {
        if (msg.sender === 'client') {
          setUnreadCount(c => c + 1)
          WalaupSound.receive()
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, ({ new: msg }) => {
        if (msg.is_read && msg.sender === 'client') {
          setUnreadCount(c => Math.max(0, c - 1))
        }
      })
      .subscribe()

    return () => {
      if (leadsRtRef.current) supabase.removeChannel(leadsRtRef.current)
      if (msgsRtRef.current) supabase.removeChannel(msgsRtRef.current)
    }
  }, [authed])

  /* ── Login ── */
  const handleLogin = async (e) => {
    e?.preventDefault()
    setLoginErr('')
    setLoginLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email:    loginForm.email,
        password: loginForm.password,
      })
      if (error) {
        setLoginErr('Email ou mot de passe incorrect.')
        setLoginLoading(false)
        return
      }
      const { data: userData } = await supabase
  .from('users')
  .select('role')
  .eq('id', data.user.id)
  .maybeSingle()
if (userData?.role !== 'super_admin') {
        setLoginErr('Accès refusé — compte non autorisé.')
        await supabase.auth.signOut()
      } else {
        setAuthed(true)
      }
    } catch (_) {
      setLoginErr('Erreur réseau. Réessayez.')
    }
    setLoginLoading(false)
  }

  /* ── Logout ── */
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  /* ── Tabs ── */
  const TABS = {
    overview:    <TabOverview />,
    clients:     <TabClients />,
    marketplace: <TabMarketplace />,
    paiements:   <TabPaiements />,
    config:      <TabConfig />,
  }

  /* ── Loading screen ── */
  if (loading) return (
    <>
      <style>{CSS}</style>
      <div className="adm-loading">
        <div className="adm-loading-dot" />
        <div className="adm-loading-dot" />
        <div className="adm-loading-dot" />
      </div>
    </>
  )

  /* ── Render ── */
  return (
    <>
      <style>{CSS}</style>

      {/* Aurora */}
      <div className="adm-orb adm-orb-1" />
      <div className="adm-orb adm-orb-2" />
      <div className="adm-orb adm-orb-3" />

      <div className="adm-root">

        {/* ══ Login gate ══ */}
        {!authed && (
          <div className="adm-login">
            <div className="adm-login-card">
              <div className="adm-login-logo">W</div>
              <div className="adm-login-title">Walaup Admin</div>
              <div className="adm-login-sub">Accès réservé à l'équipe Walaup</div>

              <label className="adm-login-label">Email</label>
              <input
                className="adm-login-inp"
                type="email"
                placeholder="admin@walaup.tn"
                value={loginForm.email}
                onChange={e => setLoginForm(p => ({ ...p, email: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                autoComplete="email"
              />

              <label className="adm-login-label">Mot de passe</label>
              <input
                className="adm-login-inp"
                type="password"
                placeholder="••••••••••"
                value={loginForm.password}
                onChange={e => setLoginForm(p => ({ ...p, password: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                autoComplete="current-password"
              />

              <button
                className="adm-login-btn"
                onClick={handleLogin}
                disabled={loginLoading}
              >
                {loginLoading ? 'Connexion...' : 'Accéder au dashboard'}
              </button>

              {loginErr && <div className="adm-login-err">{loginErr}</div>}
            </div>
          </div>
        )}

        {/* ══ Dashboard ══ */}
        {authed && (
          <>
            {/* Body : sidebar + contenu */}
            <div className="adm-body">

              {/* Sidebar — visible desktop uniquement via CSS */}
              <div className="adm-sidebar-wrap">
               <AdminSidebar
                 active={tab}
                 onTab={setTab}
                 unreadCount={unreadCount}
                 pendingCount={pendingCount}
                 onLogout={handleLogout}
                />
              </div>

              {/* Contenu principal */}
              <div className="adm-content" key={tab}>
                <div className="adm-content-inner">
                  {TABS[tab]}
                </div>
              </div>

            </div>

            {/* Bottom tabs — visible mobile uniquement via CSS */}
<div className="adm-mobile-tabs">
  {MOB_NAV.map(n => {
    const Icon = n.icon
    const isActive = tab === n.id
    return (
      <button
        key={n.id}
        className={`adm-mob-tab${isActive ? ' adm-mob-tab--active' : ''}`}
        onClick={() => setTab(n.id)}
      >
        <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
        <span>{n.label}</span>
      </button>
    )
  })}
</div>
          </>
        )}

      </div>
    </>
  )
}
