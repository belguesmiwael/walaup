'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard, MessageSquare, CreditCard,
  Smartphone, Star, LogOut, Menu, X
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import TabProjet from '@/components/client/tabs/TabProjet'
import TabMessages from '@/components/client/tabs/TabMessages'
import { TabAbonnement, TabPaiements, TabApps } from '@/components/client/tabs'

// ─── CSS ─────────────────────────────────────────────────────────────────────
const CSS = `
  /* ── Root layout ── */
  .cl-root {
    height: 100dvh;
    display: flex;
    flex-direction: column;
    background: var(--bg-base);
    overflow: hidden;
  }

  /* ── Top bar (mobile) ── */
  .cl-topbar {
    display: none;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    height: 56px;
    border-bottom: 1px solid rgba(255,255,255,0.07);
    background: rgba(8,11,20,0.9);
    backdrop-filter: blur(14px);
    flex-shrink: 0;
    z-index: 100;
  }
  .cl-topbar-logo {
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 900;
    font-size: 18px;
    background: linear-gradient(135deg, var(--ac), var(--ac-2));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .cl-topbar-name {
    font-size: 13px;
    color: var(--tx-2);
    font-weight: 500;
  }
  .cl-hamburger {
    width: 36px; height: 36px;
    border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.04);
    color: var(--tx-2);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
  }

  /* ── Sidebar (desktop) ── */
  .cl-sidebar {
    width: 240px;
    flex-shrink: 0;
    border-right: 1px solid rgba(255,255,255,0.07);
    background: rgba(8,11,20,0.6);
    backdrop-filter: blur(16px);
    display: flex;
    flex-direction: column;
    padding: 20px 0;
    overflow-y: auto;
  }
  .cl-sidebar-logo {
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 900;
    font-size: 20px;
    background: linear-gradient(135deg, var(--ac), var(--ac-2));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    padding: 0 20px 20px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    margin-bottom: 12px;
  }
  .cl-nav-item {
    display: flex; align-items: center; gap: 11px;
    padding: 10px 18px;
    border-radius: 11px;
    margin: 2px 10px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
    color: var(--tx-3);
    border: 1px solid transparent;
    transition: all 0.18s;
    position: relative;
    font-family: 'Inter', sans-serif;
    background: transparent;
    text-align: left;
    width: calc(100% - 20px);
  }
  .cl-nav-item:hover { background: rgba(255,255,255,0.05); color: var(--tx); }
  .cl-nav-item--active {
    background: rgba(99,102,241,0.12);
    border-color: rgba(99,102,241,0.25);
    color: var(--ac);
  }
  .cl-nav-badge {
    position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
    min-width: 18px; height: 18px; border-radius: 9px;
    background: var(--red); color: #fff;
    font-size: 10px; font-weight: 700;
    display: flex; align-items: center; justify-content: center;
    padding: 0 4px;
  }
  .cl-sidebar-footer {
    margin-top: auto;
    padding: 14px 10px 0;
    border-top: 1px solid rgba(255,255,255,0.06);
  }
  .cl-logout-btn {
    display: flex; align-items: center; gap: 9px;
    padding: 9px 14px; border-radius: 10px;
    background: rgba(248,113,113,0.07);
    border: 1px solid rgba(248,113,113,0.15);
    color: #F87171; cursor: pointer; font-size: 12px;
    font-weight: 600; transition: all 0.18s; width: 100%;
    font-family: 'Inter', sans-serif;
  }
  .cl-logout-btn:hover { background: rgba(248,113,113,0.15); }

  /* ── Body (sidebar + content) ── */
  .cl-body {
    flex: 1;
    display: flex;
    overflow: hidden;
    min-height: 0;
  }

  /* ── Content area ── */
  .cl-content {
    flex: 1;
    overflow-y: auto;
    padding: 24px;
    min-height: 0;
    scrollbar-width: thin;
    scrollbar-color: rgba(255,255,255,0.08) transparent;
    /* Extra bottom padding on mobile to prevent content hidden behind bottom nav */
    padding-bottom: 24px;
  }
  .cl-content::-webkit-scrollbar { width: 4px; }
  .cl-content::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }

  /* Messages tab needs full height without extra padding */
  .cl-content--messages {
    padding: 16px;
    display: flex;
    flex-direction: column;
  }

  /* ── Mobile bottom tabs ── */
  .cl-bottom-nav {
    display: none;
    height: 60px;
    border-top: 1px solid rgba(255,255,255,0.08);
    background: rgba(8,11,20,0.95);
    backdrop-filter: blur(20px);
    flex-shrink: 0;
    z-index: 100;
  }
  .cl-bottom-nav-inner {
    display: flex;
    height: 100%;
  }
  .cl-bottom-tab {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    cursor: pointer;
    font-size: 9px;
    font-weight: 600;
    color: var(--tx-3);
    border: none;
    background: transparent;
    font-family: 'Inter', sans-serif;
    position: relative;
    transition: color 0.18s;
  }
  .cl-bottom-tab--active { color: var(--ac); }
  .cl-bottom-badge {
    position: absolute;
    top: 6px; right: calc(50% - 18px);
    min-width: 15px; height: 15px; border-radius: 8px;
    background: var(--red); color: #fff;
    font-size: 9px; font-weight: 700;
    display: flex; align-items: center; justify-content: center;
    padding: 0 3px;
  }

  /* ── Mobile drawer overlay ── */
  .cl-drawer-ov {
    display: none;
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.6);
    z-index: 200;
    backdrop-filter: blur(4px);
  }
  .cl-drawer {
    position: absolute;
    top: 0; left: 0; bottom: 0;
    width: 260px;
    background: rgba(8,11,20,0.98);
    border-right: 1px solid rgba(255,255,255,0.1);
    padding: 20px 0;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
  }

  /* ── Responsive ── */
  @media (max-width: 768px) {
    .cl-topbar { display: flex; }
    .cl-sidebar { display: none; }
    .cl-bottom-nav { display: block; }
    .cl-drawer-ov { display: block; }
    .cl-content {
      /* On mobile, avoid content hiding behind bottom nav (60px) + topbar (56px) */
      padding: 16px 14px;
      padding-bottom: 80px;
    }
    .cl-content--messages {
      padding: 10px 10px 70px 10px;
    }
  }

  /* ── User info block ── */
  .cl-user-block {
    padding: 14px 18px 16px;
    margin: 0 10px 8px;
    background: rgba(99,102,241,0.07);
    border: 1px solid rgba(99,102,241,0.15);
    border-radius: 12px;
  }
  .cl-user-name { font-size: 14px; font-weight: 700; color: var(--tx); margin-bottom: 2px; }
  .cl-user-pack {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 2px 8px; border-radius: 20px;
    font-size: 10px; font-weight: 700;
    background: rgba(99,102,241,0.15); color: var(--ac);
    text-transform: capitalize;
  }
`

const TABS = [
  { id: 'projet',     label: 'Mon Projet',    icon: LayoutDashboard },
  { id: 'messages',   label: 'Messages',      icon: MessageSquare  },
  { id: 'paiements',  label: 'Paiements',     icon: CreditCard     },
  { id: 'apps',       label: 'Mes Apps',      icon: Smartphone     },
  { id: 'abonnement', label: 'Abonnement',    icon: Star           },
]

export default function ClientPage() {
  const router = useRouter()
  const [session, setSession] = useState(null)
  const [lead, setLead] = useState(null)
  const [activeTab, setActiveTab] = useState('projet')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [unreadMsg, setUnreadMsg] = useState(0)
  const [loading, setLoading] = useState(true)

  // ── Auth + lead ────────────────────────────────────────────────────────────
  const loadLead = useCallback(async (userId) => {
    const { data } = await supabase.from('leads').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle()
    // Fallback: match by email
    if (!data) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) {
        const { data: byEmail } = await supabase.from('leads').select('*').ilike('email', user.email).order('created_at', { ascending: false }).limit(1).maybeSingle()
        if (byEmail) setLead(byEmail)
      }
    } else {
      setLead(data)
    }
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (!session) { router.push('/login'); return }
      loadLead(session.user.id).finally(() => setLoading(false))
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => {
      setSession(s)
      if (!s) router.push('/login')
    })
    return () => subscription.unsubscribe()
  }, [router, loadLead])

  // ── Unread messages count (polling 10s) ───────────────────────────────────
  useEffect(() => {
    if (!lead?.id || activeTab === 'messages') return
    const check = async () => {
      const { count } = await supabase.from('messages').select('id', { count: 'exact', head: true })
        .eq('lead_id', lead.id).eq('sender', 'admin').eq('is_read', false)
      setUnreadMsg(count || 0)
    }
    check()
    const t = setInterval(check, 10000)
    return () => clearInterval(t)
  }, [lead?.id, activeTab])

  // Clear badge when switching to messages
  useEffect(() => {
    if (activeTab === 'messages') setUnreadMsg(0)
  }, [activeTab])

  const logout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const switchTab = (id) => {
    setActiveTab(id)
    setDrawerOpen(false)
    if (id === 'messages') setUnreadMsg(0)
  }

  const isMessages = activeTab === 'messages'

  if (loading) {
    return (
      <div style={{ height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
        <div style={{ width: 32, height: 32, border: '2px solid rgba(99,102,241,.2)', borderTopColor: 'var(--ac)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  const NavItems = () => (
    <>
      {TABS.map(tab => {
        const Icon = tab.icon
        const isActive = activeTab === tab.id
        const badge = tab.id === 'messages' && unreadMsg > 0 ? unreadMsg : 0
        return (
          <button
            key={tab.id}
            className={`cl-nav-item${isActive ? ' cl-nav-item--active' : ''}`}
            onClick={() => switchTab(tab.id)}>
            <Icon size={16} />
            {tab.label}
            {badge > 0 && <span className="cl-nav-badge">{badge}</span>}
          </button>
        )
      })}
    </>
  )

  return (
    <>
      <style>{CSS}</style>
      <div className="cl-root">

        {/* ── Mobile topbar ── */}
        <div className="cl-topbar">
          <div className="cl-topbar-logo">Walaup</div>
          <div className="cl-topbar-name">{lead?.name || session?.user?.email?.split('@')[0] || '—'}</div>
          <button className="cl-hamburger" onClick={() => setDrawerOpen(o => !o)}>
            {drawerOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>

        {/* ── Mobile drawer overlay ── */}
        {drawerOpen && (
          <div className="cl-drawer-ov" onClick={() => setDrawerOpen(false)}>
            <div className="cl-drawer" onClick={e => e.stopPropagation()}>
              <div className="cl-sidebar-logo">Walaup</div>
              {lead && (
                <div className="cl-user-block" style={{ margin: '0 10px 12px' }}>
                  <div className="cl-user-name">{lead.name}</div>
                  {lead.pack && <span className="cl-user-pack">Pack {lead.pack}</span>}
                </div>
              )}
              <NavItems />
              <div className="cl-sidebar-footer">
                <button className="cl-logout-btn" onClick={logout}>
                  <LogOut size={14} /> Se déconnecter
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Body ── */}
        <div className="cl-body">
          {/* Desktop sidebar */}
          <aside className="cl-sidebar">
            <div className="cl-sidebar-logo">Walaup</div>
            {lead && (
              <div className="cl-user-block">
                <div className="cl-user-name">{lead.name}</div>
                {lead.pack && <span className="cl-user-pack">Pack {lead.pack}</span>}
              </div>
            )}
            <NavItems />
            <div className="cl-sidebar-footer">
              <button className="cl-logout-btn" onClick={logout}>
                <LogOut size={14} /> Se déconnecter
              </button>
            </div>
          </aside>

          {/* Content */}
          <main className={`cl-content${isMessages ? ' cl-content--messages' : ''}`}>
            {activeTab === 'projet'     && <TabProjet     lead={lead} session={session} setLead={setLead} />}
            {activeTab === 'messages'   && (
              <TabMessages
                lead={lead}
                session={session}
                isActive={activeTab === 'messages'}
                onUnreadChange={setUnreadMsg}
              />
            )}
            {activeTab === 'paiements'  && <TabPaiements  lead={lead} />}
            {activeTab === 'apps'       && <TabApps       lead={lead} />}
            {activeTab === 'abonnement' && <TabAbonnement lead={lead} setLead={setLead} />}
          </main>
        </div>

        {/* ── Mobile bottom nav ── */}
        <nav className="cl-bottom-nav">
          <div className="cl-bottom-nav-inner">
            {TABS.map(tab => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              const badge = tab.id === 'messages' && unreadMsg > 0 ? unreadMsg : 0
              return (
                <button
                  key={tab.id}
                  className={`cl-bottom-tab${isActive ? ' cl-bottom-tab--active' : ''}`}
                  onClick={() => switchTab(tab.id)}>
                  {badge > 0 && <span className="cl-bottom-badge">{badge}</span>}
                  <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </nav>
      </div>
    </>
  )
}
