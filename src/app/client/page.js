'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { WalaupSound } from '@/lib/sound'
import ClientSidebar from '@/components/client/ClientSidebar'
import ClientBottomTabs from '@/components/client/ClientBottomTabs'
import TabProjet from '@/components/client/tabs/TabProjet'
import TabMessages from '@/components/client/tabs/TabMessages'
import { TabAbonnement, TabPaiements, TabApps } from '@/components/client/tabs/index.js'
import { LogOut, ArrowLeft } from 'lucide-react'

const CSS = `
  .cl-root {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: var(--bg-base);
    z-index: 1000;
  }

  /* ── Top bar mobile ── */
  .cl-topbar {
    display: none;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    height: 52px;
    flex-shrink: 0;
    background: rgba(10,14,28,.92);
    border-bottom: 1px solid rgba(255,255,255,.06);
    backdrop-filter: blur(20px);
    position: relative;
    z-index: 20;
  }
  .cl-topbar-logo {
    font-family: var(--font-display);
    font-size: 1.1rem;
    font-weight: 800;
    background: linear-gradient(135deg, #6366F1, #8B5CF6);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    text-decoration: none;
  }
  .cl-topbar-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 7px 12px;
    border-radius: 10px;
    font-size: 12px;
    font-weight: 600;
    font-family: var(--font-body);
    cursor: pointer;
    border: none;
    transition: all .18s;
    text-decoration: none;
  }
  .cl-topbar-btn--back {
    background: rgba(255,255,255,.06);
    border: 1px solid rgba(255,255,255,.09);
    color: var(--tx-2);
  }
  .cl-topbar-btn--back:hover { background: rgba(255,255,255,.10); color: var(--tx); }
  .cl-topbar-btn--logout {
    background: rgba(248,113,113,.08);
    border: 1px solid rgba(248,113,113,.16);
    color: var(--red);
  }
  .cl-topbar-btn--logout:hover { background: rgba(248,113,113,.16); }

  /* ── Body ── */
  .cl-body {
    display: flex;
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }
  .cl-main {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    position: relative;
    z-index: 1;
  }
  .cl-scroll {
    flex: 1;
    overflow-y: auto;
    padding: 28px 28px 40px;
    scrollbar-width: thin;
    scrollbar-color: rgba(255,255,255,.08) transparent;
  }
  .cl-scroll::-webkit-scrollbar { width: 4px; }
  .cl-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,.08); border-radius: 4px; }

  /* ── Aurora ── */
  .cl-orb {
    position: fixed;
    border-radius: 50%;
    pointer-events: none;
    z-index: 0;
  }
  .cl-orb--1 {
    width: 700px; height: 700px;
    top: -280px; right: -220px;
    background: radial-gradient(ellipse, rgba(99,102,241,.17) 0%, transparent 70%);
    filter: blur(60px);
  }
  .cl-orb--2 {
    width: 550px; height: 550px;
    bottom: -220px; left: 50px;
    background: radial-gradient(ellipse, rgba(139,92,246,.13) 0%, transparent 70%);
    filter: blur(58px);
  }
  .cl-orb--3 {
    width: 350px; height: 350px;
    top: 40%; left: 30%;
    background: radial-gradient(ellipse, rgba(245,158,11,.07) 0%, transparent 70%);
    filter: blur(55px);
  }

  /* ── Responsive ── */
  @media (max-width: 767px) {
    .cl-topbar       { display: flex; }
    .cl-sidebar-wrap { display: none; }
    .cl-scroll       { padding: 20px 16px 80px; }
  }
  @media (min-width: 768px) {
    .cl-bottomtabs-wrap { display: none; }
  }

  /* ── Loading ── */
  @keyframes cl-spin { to { transform: rotate(360deg); } }
  .cl-loading {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: var(--bg-base);
    gap: 14px;
    z-index: 1000;
  }
  .cl-spinner {
    width: 38px;
    height: 38px;
    border: 2px solid rgba(99,102,241,.18);
    border-top-color: #6366F1;
    border-radius: 50%;
    animation: cl-spin .85s linear infinite;
  }
`

function LoadingScreen() {
  return (
    <>
      <style>{CSS}</style>
      <div className="cl-loading">
        <div className="cl-spinner" />
        <p style={{ color: 'var(--tx-3)', fontSize: 13 }}>Chargement de votre espace...</p>
      </div>
    </>
  )
}

export default function ClientPage() {
  const router = useRouter()
  const [session, setSession] = useState(null)
  const [lead, setLead] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('projet')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [unread, setUnread] = useState(0)

  // ── Fullscreen — hide navbar + footer directly via DOM ──────────────────
  useEffect(() => {
    // Query all possible nav/header/footer elements from the root layout
    const toHide = [
      ...document.querySelectorAll('nav'),
      ...document.querySelectorAll('header'),
      ...document.querySelectorAll('footer'),
    ]
    toHide.forEach(el => {
      el.dataset.clHidden = el.style.display
      el.style.setProperty('display', 'none', 'important')
    })
    return () => {
      toHide.forEach(el => {
        el.style.removeProperty('display')
        delete el.dataset.clHidden
      })
    }
  }, [])

  // ── Realtime unread count ────────────────────────────────────────────────
  const listenUnread = useCallback((leadId) => {
    const ch = supabase
      .channel(`cl-unread-${leadId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages', filter: `lead_id=eq.${leadId}` },
        async () => {
          const { count } = await supabase
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .eq('lead_id', leadId)
            .eq('sender', 'admin')
            .eq('is_read', false)
          setUnread(count || 0)
        }
      )
      .subscribe()
    return ch
  }, [])

  // ── Init ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    let unreadChannel = null

    async function init() {
      try {
        const { data: { session: s }, error } = await supabase.auth.getSession()
        if (error || !s) { router.push('/login'); return }
        setSession(s)

        const { data: leads, error: leadErr } = await supabase
          .from('leads')
          .select('*')
          .eq('email', s.user.email)
          .order('created_at', { ascending: false })
          .limit(1)

        if (!leadErr && leads && leads.length > 0) {
          const l = leads[0]
          setLead(l)
          const { count } = await supabase
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .eq('lead_id', l.id)
            .eq('sender', 'admin')
            .eq('is_read', false)
          setUnread(count || 0)
          unreadChannel = listenUnread(l.id)
        }
      } catch (err) {
        console.error('[ClientPage] init error', err)
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === 'SIGNED_OUT' || !s) router.push('/login')
    })

    return () => {
      subscription.unsubscribe()
      if (unreadChannel) supabase.removeChannel(unreadChannel)
    }
  }, [router, listenUnread])

  // ── Clear unread on messages tab ─────────────────────────────────────────
  useEffect(() => {
    if (activeTab === 'messages' && lead?.id && unread > 0) {
      supabase
        .from('messages')
        .update({ is_read: true })
        .eq('lead_id', lead.id)
        .eq('sender', 'admin')
        .then(() => setUnread(0))
    }
  }, [activeTab, lead?.id, unread])

  function handleTabChange(tab) {
    WalaupSound.tab()
    setActiveTab(tab)
  }

  function handleLogout() {
    WalaupSound.click()
    supabase.auth.signOut().then(() => router.push('/'))
  }

  if (loading) return <LoadingScreen />

  const sharedProps = { lead, session, setLead }
  const TABS = {
    projet:     <TabProjet     {...sharedProps} />,
    messages:   <TabMessages   {...sharedProps} />,
    abonnement: <TabAbonnement {...sharedProps} />,
    paiements:  <TabPaiements  {...sharedProps} />,
    apps:       <TabApps       {...sharedProps} />,
  }

  return (
    <>
      <style>{CSS}</style>

      {/* Aurora */}
      <div className="cl-orb cl-orb--1" />
      <div className="cl-orb cl-orb--2" />
      <div className="cl-orb cl-orb--3" />

      <div className="cl-root">

        {/* ── Mobile top bar : Accueil | Walaup | Quitter ── */}
        <div className="cl-topbar">
          <Link href="/" className="cl-topbar-btn cl-topbar-btn--back" onClick={() => WalaupSound.click()}>
            <ArrowLeft size={13} /> Accueil
          </Link>
          <span className="cl-topbar-logo">Walaup</span>
          <button className="cl-topbar-btn cl-topbar-btn--logout" onClick={handleLogout}>
            <LogOut size={13} /> Quitter
          </button>
        </div>

        <div className="cl-body">
          {/* Desktop sidebar — contient déjà le bouton retour accueil + déconnexion */}
          <div className="cl-sidebar-wrap">
            <ClientSidebar
              activeTab={activeTab}
              onTabChange={handleTabChange}
              open={sidebarOpen}
              onToggle={() => setSidebarOpen(v => !v)}
              session={session}
              lead={lead}
              onLogout={handleLogout}
              unread={unread}
            />
          </div>

          <main className="cl-main">
            <div className="cl-scroll">
              {TABS[activeTab]}
            </div>
          </main>
        </div>

        {/* Mobile bottom tabs */}
        <div className="cl-bottomtabs-wrap">
          <ClientBottomTabs
            activeTab={activeTab}
            onTabChange={handleTabChange}
            unread={unread}
          />
        </div>

      </div>
    </>
  )
}
