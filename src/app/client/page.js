'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { WalaupSound } from '@/lib/sound'
import ClientSidebar from '@/components/client/ClientSidebar'
import ClientBottomTabs from '@/components/client/ClientBottomTabs'
import TabProjet from '@/components/client/tabs/TabProjet'
import { TabMessages } from '@/components/client/tabs'
// Re-use the single-file exports for the simpler tabs
import { TabAbonnement, TabPaiements, TabApps } from '@/components/client/tabs/index.js'

// ─── Security notes ───────────────────────────────────────────────────────────
// - Auth checked on every mount — unauthenticated users redirected to /login
// - Lead fetched by email match only (ownership enforced)
// - onAuthStateChange watches for session expiry mid-session
// ─────────────────────────────────────────────────────────────────────────────

const CSS = `
  .cl-layout {
    display: flex;
    height: calc(100vh - 64px);
    overflow: hidden;
    background: transparent;
    position: relative;
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

  /* Aurora */
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

  /* Mobile: push content above bottom tabs */
  @media (max-width: 767px) {
    .cl-scroll { padding: 20px 16px 84px; }
    .cl-sidebar-wrap { display: none; }
  }
  @media (min-width: 768px) {
    .cl-bottomtabs-wrap { display: none; }
  }

  /* Loading screen */
  @keyframes cl-spin { to { transform: rotate(360deg); } }
  .cl-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: calc(100vh - 64px);
    gap: 14px;
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

  // ── Realtime unread count ────────────────────────────────────────────────
  const listenUnread = useCallback((leadId) => {
    // Count unread admin messages for the badge
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

  // ── Init: auth + lead ────────────────────────────────────────────────────
  useEffect(() => {
    let unreadChannel = null

    async function init() {
      try {
        const { data: { session: s }, error } = await supabase.auth.getSession()
        if (error || !s) {
          router.push('/login')
          return
        }
        setSession(s)

        // Fetch most recent lead by email
        const { data: leads, error: leadErr } = await supabase
          .from('leads')
          .select('*')
          .eq('email', s.user.email)
          .order('created_at', { ascending: false })
          .limit(1)

        if (!leadErr && leads && leads.length > 0) {
          const l = leads[0]
          setLead(l)
          // Initial unread count
          const { count } = await supabase
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .eq('lead_id', l.id)
            .eq('sender', 'admin')
            .eq('is_read', false)
          setUnread(count || 0)
          // Start listening
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

    // Watch for session changes (logout / expiry)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === 'SIGNED_OUT' || !s) router.push('/login')
    })

    return () => {
      subscription.unsubscribe()
      if (unreadChannel) supabase.removeChannel(unreadChannel)
    }
  }, [router, listenUnread])

  // ── Clear unread badge when switching to messages tab ───────────────────
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

      {/* Aurora orbs */}
      <div className="cl-orb cl-orb--1" />
      <div className="cl-orb cl-orb--2" />
      <div className="cl-orb cl-orb--3" />

      <div className="cl-layout">
        {/* Desktop sidebar */}
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

        {/* Main content */}
        <main className="cl-main">
          <div className="cl-scroll">
            {TABS[activeTab]}
          </div>
        </main>

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
