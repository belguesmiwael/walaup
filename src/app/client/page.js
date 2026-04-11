'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard, MessageSquare, CreditCard,
  Smartphone, Star, LogOut, Menu, X, ArrowLeft,
  ChevronLeft, ChevronRight, PlusCircle, Bell,
  CheckCircle2, AlertCircle, Info
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import TabProjet from '@/components/client/tabs/TabProjet'
import TabMessages from '@/components/client/tabs/TabMessages'
import { TabAbonnement, TabPaiements, TabApps } from '@/components/client/tabs'

// ─── CSS ────────────────────────────────────────────────────────────────────────
const CSS = `
  /* ── Root layout ── */
  .cl-root {
    position: fixed;
    top: 0; left: 0;
    right: 0; bottom: 0;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    background: var(--bg-base);
    overflow: hidden;
  }

  /* ── Top bar (mobile) ── */
  .cl-topbar {
    display: none;
    align-items: center;
    justify-content: center;
    padding: 0 16px;
    height: 48px;
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

  /* ── Sidebar (desktop) ── */
  .cl-sidebar {
    flex-shrink: 0;
    border-right: 1px solid rgba(255,255,255,0.07);
    background: rgba(8,11,20,0.6);
    backdrop-filter: blur(16px);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transition: width .26s cubic-bezier(0.16,1,0.3,1);
  }
  .cl-sidebar--open   { width: 240px; }
  .cl-sidebar--closed { width: 60px; }

  .cl-sb-header {
    display: flex;
    align-items: center;
    padding: 16px 10px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    flex-shrink: 0;
    gap: 8px;
    min-height: 58px;
  }
  .cl-sidebar-logo {
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 900;
    font-size: 20px;
    background: linear-gradient(135deg, var(--ac), var(--ac-2));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    white-space: nowrap;
    flex: 1;
    overflow: hidden;
    opacity: 0;
    max-width: 0;
    transition: opacity .18s, max-width .26s cubic-bezier(0.16,1,0.3,1);
  }
  .cl-sidebar--open .cl-sidebar-logo { opacity: 1; max-width: 160px; }

  .cl-sb-toggle {
    width: 32px; height: 32px; min-width: 32px;
    display: flex; align-items: center; justify-content: center;
    border: 1px solid rgba(99,102,241,0.3);
    border-radius: 9px;
    background: rgba(99,102,241,0.1);
    cursor: pointer;
    color: var(--ac);
    transition: all .18s;
    flex-shrink: 0;
    margin-left: auto;
  }
  .cl-sb-toggle:hover { background: rgba(99,102,241,0.2); border-color: rgba(99,102,241,0.5); }
  .cl-sidebar--closed .cl-sb-toggle { margin-left: 0; }

  .cl-sb-nav {
    flex: 1;
    padding: 10px 0;
    overflow-y: auto;
  }
  .cl-nav-item {
    display: flex; align-items: center; gap: 11px;
    padding: 10px 12px;
    border-radius: 11px;
    margin: 2px 8px;
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
    width: calc(100% - 16px);
    white-space: nowrap;
    overflow: hidden;
  }
  .cl-sidebar--closed .cl-nav-item { justify-content: center; padding: 10px 0; }
  .cl-nav-item:hover { background: rgba(255,255,255,0.05); color: var(--tx); }
  .cl-nav-item--active {
    background: rgba(99,102,241,0.12);
    border-color: rgba(99,102,241,0.25);
    color: var(--ac);
  }
  .cl-nav-label {
    overflow: hidden; opacity: 0; max-width: 0;
    transition: opacity .18s, max-width .26s cubic-bezier(0.16,1,0.3,1);
  }
  .cl-sidebar--open .cl-nav-label { opacity: 1; max-width: 160px; }
  .cl-nav-badge {
    position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
    min-width: 18px; height: 18px; border-radius: 9px;
    background: var(--red); color: #fff;
    font-size: 10px; font-weight: 700;
    display: flex; align-items: center; justify-content: center;
    padding: 0 4px;
    opacity: 0; max-width: 0;
    transition: opacity .18s, max-width .26s cubic-bezier(0.16,1,0.3,1);
  }
  .cl-sidebar--open .cl-nav-badge { opacity: 1; max-width: 40px; }
  .cl-nav-dot {
    position: absolute; top: 8px; right: 8px;
    width: 7px; height: 7px; border-radius: 50%;
    background: var(--red);
  }
  .cl-nav-tooltip {
    position: absolute;
    left: calc(100% + 12px);
    top: 50%; transform: translateY(-50%);
    background: rgba(8,11,20,.98);
    border: 1px solid rgba(255,255,255,.12);
    color: var(--tx); font-size: 12px; font-weight: 500;
    padding: 5px 11px; border-radius: 8px;
    white-space: nowrap;
    opacity: 0; pointer-events: none;
    transition: opacity .15s;
    z-index: 300;
    box-shadow: 0 4px 16px rgba(0,0,0,.5);
  }
  .cl-sidebar--closed .cl-nav-item:hover .cl-nav-tooltip { opacity: 1; }

  .cl-sidebar-footer {
    padding: 8px;
    border-top: 1px solid rgba(255,255,255,0.06);
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .cl-user-block {
    padding: 10px;
    margin-bottom: 4px;
    background: rgba(99,102,241,0.07);
    border: 1px solid rgba(99,102,241,0.15);
    border-radius: 10px;
    overflow: hidden;
    opacity: 0; max-width: 0;
    transition: opacity .18s, max-width .26s cubic-bezier(0.16,1,0.3,1), padding .26s, margin .26s;
  }
  .cl-sidebar--open .cl-user-block { opacity: 1; max-width: 240px; }
  .cl-user-name { font-size: 13px; font-weight: 700; color: var(--tx); margin-bottom: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .cl-user-pack {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 2px 8px; border-radius: 20px;
    font-size: 10px; font-weight: 700;
    background: rgba(99,102,241,0.15); color: var(--ac);
    text-transform: capitalize;
  }
  .cl-sb-footer-btn {
    display: flex; align-items: center; gap: 9px;
    padding: 0 12px; height: 38px;
    border-radius: 10px; cursor: pointer;
    border: none; background: none;
    font-family: 'Inter', sans-serif;
    width: 100%; white-space: nowrap; overflow: hidden;
    text-decoration: none;
    transition: all .18s;
    position: relative;
  }
  .cl-sidebar--closed .cl-sb-footer-btn { justify-content: center; padding: 0; }
  .cl-sb-footer-label {
    font-size: 12.5px; font-weight: 500;
    opacity: 0; max-width: 0;
    transition: opacity .18s, max-width .26s cubic-bezier(0.16,1,0.3,1);
  }
  .cl-sidebar--open .cl-sb-footer-label { opacity: 1; max-width: 160px; }
  .cl-sb-footer-btn--back { color: var(--tx-3); }
  .cl-sb-footer-btn--back:hover { background: rgba(255,255,255,.06); color: var(--tx-2); }
  .cl-sb-footer-btn--logout { color: var(--tx-3); }
  .cl-sb-footer-btn--logout:hover { background: rgba(248,113,113,.09); color: var(--red); }

  .cl-body {
    flex: 1;
    display: flex;
    overflow: hidden;
    min-height: 0;
  }

  .cl-content {
    flex: 1;
    overflow-y: auto;
    padding: 24px;
    min-height: 0;
    scrollbar-width: thin;
    scrollbar-color: rgba(255,255,255,0.08) transparent;
  }
  .cl-content::-webkit-scrollbar { width: 4px; }
  .cl-content::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }
  .cl-content--messages {
    padding: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .cl-newapp-fab {
    position: fixed; bottom: 28px; right: 28px;
    display: flex; align-items: center; gap: 8px;
    padding: 11px 18px; border-radius: 50px;
    background: linear-gradient(135deg, #6366F1, #8B5CF6);
    color: #fff; font-size: 13px; font-weight: 700;
    font-family: 'Inter', sans-serif; text-decoration: none;
    box-shadow: 0 6px 24px rgba(99,102,241,.4);
    transition: all .22s cubic-bezier(0.16,1,0.3,1);
    z-index: 50;
  }
  .cl-newapp-fab:hover { transform: translateY(-2px); box-shadow: 0 10px 32px rgba(99,102,241,.55); }

  .cl-bottom-nav {
    display: none;
    flex-shrink: 0;
    z-index: 100;
  }
  .cl-bottom-nav-inner {
    display: flex;
    height: 62px;
    border-top: 1px solid rgba(255,255,255,0.08);
    background: rgba(8,11,20,0.97);
    backdrop-filter: blur(20px);
  }
  .cl-bottom-util {
    width: 46px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; border: none; background: none;
    text-decoration: none;
    transition: all .18s;
    -webkit-tap-highlight-color: transparent;
  }
  .cl-bottom-util--back { color: var(--tx-3); border-right: 1px solid rgba(255,255,255,.06); }
  .cl-bottom-util--back:hover { color: var(--tx-2); background: rgba(255,255,255,.04); }
  .cl-bottom-util--logout { color: var(--tx-3); border-left: 1px solid rgba(255,255,255,.06); }
  .cl-bottom-util--logout:hover { color: var(--red); background: rgba(248,113,113,.07); }
  .cl-bottom-tabs { flex: 1; display: flex; }
  .cl-bottom-tab {
    flex: 1;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 3px; cursor: pointer;
    font-size: 9px; font-weight: 600;
    color: var(--tx-3);
    border: none; background: transparent;
    font-family: 'Inter', sans-serif;
    position: relative;
    transition: color 0.18s;
    -webkit-tap-highlight-color: transparent;
  }
  .cl-bottom-tab--active { color: var(--ac); }
  .cl-bottom-tab::before {
    content: '';
    position: absolute; top: 0; left: 20%; right: 20%;
    height: 2px; background: var(--ac);
    border-radius: 0 0 3px 3px;
    transform: scaleX(0);
    transition: transform .22s cubic-bezier(0.34,1.56,0.64,1);
  }
  .cl-bottom-tab--active::before { transform: scaleX(1); }
  .cl-bottom-badge {
    position: absolute;
    top: 6px; right: calc(50% - 18px);
    min-width: 15px; height: 15px; border-radius: 8px;
    background: var(--red); color: #fff;
    font-size: 9px; font-weight: 700;
    display: flex; align-items: center; justify-content: center;
    padding: 0 3px;
  }

  .cl-drawer-ov {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.6);
    z-index: 200; backdrop-filter: blur(4px);
  }
  .cl-drawer {
    position: absolute;
    top: 0; left: 0; bottom: 0;
    width: 260px;
    background: rgba(8,11,20,0.98);
    border-right: 1px solid rgba(255,255,255,0.1);
    padding: 20px 0;
    overflow-y: auto;
    display: flex; flex-direction: column;
  }

  @media (max-width: 768px) {
    .cl-topbar     { display: flex; }
    .cl-sidebar    { display: none !important; }
    .cl-bottom-nav { display: block; }
    .cl-content    { padding: 16px 14px 80px; }
    .cl-content--messages { padding: 0; }
    .cl-newapp-fab { bottom: 74px; right: 14px; padding: 10px 14px; font-size: 12px; }
  }

  /* ── Toast notifications ── */
  .cl-toasts {
    position: fixed;
    top: 16px; right: 16px;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 10px;
    pointer-events: none;
  }
  .cl-toast {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 14px 16px;
    background: rgba(13,17,32,0.97);
    border: 1px solid rgba(99,102,241,0.3);
    border-radius: 14px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.5);
    backdrop-filter: blur(20px);
    min-width: 280px;
    max-width: 340px;
    pointer-events: all;
    animation: cl-toast-in .3s cubic-bezier(0.34,1.56,0.64,1);
    position: relative;
    overflow: hidden;
  }
  .cl-toast--success { border-color: rgba(16,185,129,0.4); }
  .cl-toast--warning { border-color: rgba(245,158,11,0.4); }
  .cl-toast--error   { border-color: rgba(248,113,113,0.4); }
  .cl-toast-icon {
    width: 34px; height: 34px; min-width: 34px;
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .cl-toast-body { flex: 1; min-width: 0; }
  .cl-toast-title {
    font-size: 13px; font-weight: 700;
    color: var(--tx); margin-bottom: 3px;
    font-family: 'Space Grotesk', sans-serif;
  }
  .cl-toast-text {
    font-size: 12px; color: var(--tx-2);
    line-height: 1.45;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .cl-toast-close {
    width: 22px; height: 22px;
    border: none; background: none;
    color: var(--tx-3); cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    border-radius: 6px; flex-shrink: 0;
    transition: all .15s;
  }
  .cl-toast-close:hover { background: rgba(255,255,255,.08); color: var(--tx); }
  .cl-toast-progress {
    position: absolute;
    bottom: 0; left: 0;
    height: 2px;
    background: var(--ac);
    animation: cl-toast-progress 5s linear forwards;
    border-radius: 0 0 14px 14px;
  }
  .cl-toast--success .cl-toast-progress { background: #10B981; }
  .cl-toast--warning .cl-toast-progress { background: #F59E0B; }
  @keyframes cl-toast-in {
    from { opacity: 0; transform: translateX(60px) scale(0.92); }
    to   { opacity: 1; transform: translateX(0) scale(1); }
  }
  @keyframes cl-toast-progress {
    from { width: 100%; }
    to   { width: 0%; }
  }
  @media (max-width: 768px) {
    .cl-toasts { top: 56px; right: 10px; left: 10px; }
    .cl-toast  { min-width: unset; max-width: 100%; }
  }
`

const TABS = [
  { id: 'projet',     label: 'Projet',     icon: LayoutDashboard },
  { id: 'messages',   label: 'Messages',   icon: MessageSquare, hasBadge: true },
  { id: 'paiements',  label: 'Paiements',  icon: CreditCard     },
  { id: 'apps',       label: 'Mes Apps',   icon: Smartphone     },
  { id: 'abonnement', label: 'Abonn.',     icon: Star           },
]

export default function ClientPage() {
  const router = useRouter()
  const [session, setSession]       = useState(null)
  const [lead, setLead]             = useState(null)
  const [leads, setLeads]           = useState([])   // ✅ tous les projets du client
  const [activeTab, setActiveTab]   = useState('projet')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [unreadMsg, setUnreadMsg]   = useState(0)
  const [loading, setLoading]       = useState(true)
  const [toasts, setToasts]         = useState([])
  const notifChannelRef             = useRef(null)

  // ── Fullscreen — cache navbar + footer du layout global
  useEffect(() => {
    const toHide = [
      ...document.querySelectorAll('nav'),
      ...document.querySelectorAll('header'),
      ...document.querySelectorAll('footer'),
    ]
    toHide.forEach(el => el.style.setProperty('display', 'none', 'important'))
    document.body.style.overflow = 'hidden'
    return () => {
      toHide.forEach(el => el.style.removeProperty('display'))
      document.body.style.overflow = ''
    }
  }, [])

  // ── Charge TOUS les leads du client (multi-projets) ✅
  const loadLeads = useCallback(async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return

  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .ilike('email', user.email)
    .order('created_at', { ascending: false })

  if (!error && data && data.length > 0) {
    setLeads(data)
    setLead(data[0])
  }
}, [])

  // ── Système de notifications toast ──────────────────────────────────────────
const addToast = useCallback((notif) => {
  const id = Date.now()
  setToasts(prev => [...prev.slice(-3), { ...notif, id }]) // max 4 toasts
  WalaupSound.notif()
  // Auto-dismiss après 5s
  setTimeout(() => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, 5000)
}, [])

useEffect(() => {
  if (!leads || leads.length === 0) return

  const leadIds = leads.map(l => l.id)

  if (notifChannelRef.current) supabase.removeChannel(notifChannelRef.current)
  notifChannelRef.current = supabase
    .channel('client-notifications')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications'
    }, ({ new: notif }) => {
      // Filtre côté client — uniquement nos leads
      if (notif.target_role !== 'client') return
      if (!leadIds.includes(notif.target_id)) return
      addToast(notif)
      // Marquer comme lu après 5s
      setTimeout(() => {
        supabase.from('notifications').update({ is_read: true }).eq('id', notif.id).then(() => {})
      }, 5000)
    })
    .subscribe()

  return () => {
    if (notifChannelRef.current) supabase.removeChannel(notifChannelRef.current)
  }
}, [leads, addToast])

  // ── Auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (!session) { router.push('/login'); return }
      loadLeads().finally(() => setLoading(false))
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => {
      setSession(s)
      if (!s) router.push('/login')
    })
    return () => subscription.unsubscribe()
  }, [router, loadLeads])

  // ── Realtime : met à jour tous les leads du client sans filtre DB (plus fiable) ✅
 useEffect(() => {
  if (!session?.user?.id) return
  const channel = supabase
    .channel(`client-leads-rt-${session.user.id}`)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'leads' }, (payload) => {
      if (!payload.new) return
      const updated = payload.new
      setLeads(prev => {
        const idx = prev.findIndex(l => l.id === updated.id)
        if (idx === -1) return prev
        const next = [...prev]
        next[idx] = updated
        return next
      })
      setLead(prev => prev?.id === updated.id ? updated : prev)
    })
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'leads' }, (payload) => {
      // Nouveau lead — recharge tout pour appliquer le filtre email correctement
      if (session?.user?.id) loadLeads()
    })
    .subscribe()
  return () => supabase.removeChannel(channel)
}, [session?.user?.id, loadLeads])

  // ── Unread messages (polling 10s)
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

  useEffect(() => { if (activeTab === 'messages') setUnreadMsg(0) }, [activeTab])

  const logout = async () => { await supabase.auth.signOut(); router.push('/') }

  const switchTab = (id) => {
    setActiveTab(id)
    setDrawerOpen(false)
    if (id === 'messages') setUnreadMsg(0)
  }

  // ── Handler setLead qui synchronise aussi le tableau leads ✅
  const handleSetLead = (updatedLead) => {
    setLead(updatedLead)
    setLeads(prev => prev.map(l => l.id === updatedLead.id ? updatedLead : l))
  }

  const sbCls = sidebarOpen ? 'cl-sidebar cl-sidebar--open' : 'cl-sidebar cl-sidebar--closed'

  const sLoadWrap    = { height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }
  const sLoadSpinner = { width: 32, height: 32, border: '2px solid rgba(99,102,241,.2)', borderTopColor: 'var(--ac)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }

  if (loading) {
    return (
      <div style={sLoadWrap}>
        <div style={sLoadSpinner} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  const sBadgeDrawer  = { position: 'static', transform: 'none', marginLeft: 'auto', opacity: 1, maxWidth: 40 }
  const sDrawerLogo   = { padding: '0 18px 16px', borderBottom: '1px solid rgba(255,255,255,.06)', marginBottom: 10 }
  const sDrawerUser   = { margin: '0 10px 12px', padding: '10px 14px', background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 12 }
  const sDrawerFooter = { marginTop: 'auto', padding: '12px 10px 0', borderTop: '1px solid rgba(255,255,255,.06)', display: 'flex', flexDirection: 'column', gap: 4 }
  const sDrawerBack   = { display: 'flex', alignItems: 'center', gap: 9, padding: '9px 14px', borderRadius: 10, color: 'var(--tx-3)', textDecoration: 'none', fontSize: 12, fontWeight: 600, fontFamily: 'Inter, sans-serif' }
  const sDrawerLogout = { display: 'flex', alignItems: 'center', gap: 9, padding: '9px 14px', borderRadius: 10, background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.15)', color: '#F87171', cursor: 'pointer', fontSize: 12, fontWeight: 600, width: '100%', fontFamily: 'Inter, sans-serif' }

  const NavItems = ({ inDrawer = false }) => (
    <>
      {TABS.map(tab => {
        const Icon = tab.icon
        const isActive = activeTab === tab.id
        const badge = tab.hasBadge && unreadMsg > 0 ? unreadMsg : 0
        return (
          <button
            key={tab.id}
            className={`cl-nav-item${isActive ? ' cl-nav-item--active' : ''}`}
            onClick={() => switchTab(tab.id)}>
            <Icon size={17} />
            {inDrawer
              ? tab.label
              : <span className="cl-nav-label">{tab.label}</span>
            }
            {badge > 0 && (
              inDrawer
                ? <span className="cl-nav-badge" style={sBadgeDrawer}>{badge}</span>
                : <><span className="cl-nav-badge">{badge}</span><span className="cl-nav-dot" /></>
            )}
            {!inDrawer && <span className="cl-nav-tooltip">{tab.label}</span>}
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
          <span className="cl-topbar-logo">Walaup</span>
        </div>

        {/* ── Mobile drawer overlay ── */}
        {drawerOpen && (
          <div className="cl-drawer-ov" onClick={() => setDrawerOpen(false)}>
            <div className="cl-drawer" onClick={e => e.stopPropagation()}>
              <div className="cl-sidebar-logo" style={sDrawerLogo}>Walaup</div>
              {lead && (
                <div style={sDrawerUser}>
                  <div className="cl-user-name">{lead.name}</div>
                  {lead.pack && <span className="cl-user-pack">Pack {lead.pack}</span>}
                </div>
              )}
              <NavItems inDrawer />
              <div style={sDrawerFooter}>
                <Link href="/" style={sDrawerBack}>
                  <ArrowLeft size={14} /> Retour accueil
                </Link>
                <button style={sDrawerLogout} onClick={logout}>
                  <LogOut size={14} /> Se déconnecter
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Body ── */}
        <div className="cl-body">

          {/* Desktop sidebar */}
          <aside className={sbCls}>
            <div className="cl-sb-header">
              <span className="cl-sidebar-logo">Walaup</span>
              <button className="cl-sb-toggle" onClick={() => setSidebarOpen(v => !v)} aria-label={sidebarOpen ? 'Fermer' : 'Ouvrir'}>
                {sidebarOpen ? <ChevronLeft size={15} /> : <ChevronRight size={15} />}
              </button>
            </div>
            <div className="cl-sb-nav">
              <NavItems />
            </div>
            <div className="cl-sidebar-footer">
              {lead && (
                <div className="cl-user-block">
                  <div className="cl-user-name">{lead.name}</div>
                  {lead.pack && <span className="cl-user-pack">Pack {lead.pack}</span>}
                </div>
              )}
              <Link href="/" className="cl-sb-footer-btn cl-sb-footer-btn--back">
                <ArrowLeft size={15} />
                <span className="cl-sb-footer-label">Retour accueil</span>
                <span className="cl-nav-tooltip">Retour accueil</span>
              </Link>
              <button className="cl-sb-footer-btn cl-sb-footer-btn--logout" onClick={logout}>
                <LogOut size={15} />
                <span className="cl-sb-footer-label">Déconnexion</span>
                <span className="cl-nav-tooltip">Déconnexion</span>
              </button>
            </div>
          </aside>

          {/* Content */}
          <main className={`cl-content${activeTab === 'messages' ? ' cl-content--messages' : ''}`}>
            {activeTab === 'projet' && (
              <TabProjet
                lead={lead}
                leads={leads}
                session={session}
                setLead={handleSetLead}
              />
            )}
            {activeTab === 'messages'   && <TabMessages   lead={lead} session={session} isActive={activeTab === 'messages'} onUnreadChange={setUnreadMsg} />}
            {activeTab === 'paiements'  && <TabPaiements  lead={lead} />}
            {activeTab === 'apps'       && <TabApps       lead={lead} />}
            {activeTab === 'abonnement' && <TabAbonnement lead={lead} setLead={handleSetLead} />}
          </main>
        </div>

        {/* ── Mobile bottom nav ── */}
        <nav className="cl-bottom-nav">
          <div className="cl-bottom-nav-inner">
            <a href="/" className="cl-bottom-util cl-bottom-util--back" aria-label="Accueil">
              <ArrowLeft size={18} />
            </a>
            <div className="cl-bottom-tabs">
              {TABS.map(tab => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                const badge = tab.hasBadge && unreadMsg > 0 ? unreadMsg : 0
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
            <button className="cl-bottom-util cl-bottom-util--logout" aria-label="Déconnecter" onClick={logout}>
              <LogOut size={17} />
            </button>
          </div>
        </nav>

        {/* FAB nouvelle app */}
        {activeTab === 'projet' && (
          <Link href="/estimateur" className="cl-newapp-fab">
            <PlusCircle size={15} /> Nouvelle app
          </Link>
        )}

      </div>

        {/* ── Toast notifications ── */}
      {toasts.length > 0 && (
        <div className="cl-toasts">
          {toasts.map(toast => {
            const typeMap = {
              success: { icon: CheckCircle2, color: '#10B981', bg: 'rgba(16,185,129,0.12)', cls: 'cl-toast--success' },
              warning: { icon: AlertCircle,  color: '#F59E0B', bg: 'rgba(245,158,11,0.12)',  cls: 'cl-toast--warning' },
              error:   { icon: AlertCircle,  color: '#F87171', bg: 'rgba(248,113,113,0.12)', cls: 'cl-toast--error'   },
              info:    { icon: Info,         color: '#6366F1', bg: 'rgba(99,102,241,0.12)',  cls: ''                  },
              message: { icon: MessageSquare,color: '#6366F1', bg: 'rgba(99,102,241,0.12)',  cls: ''                  },
            }
            const t = typeMap[toast.type] || typeMap.info
            const Icon = t.icon
            return (
              <div key={toast.id} className={`cl-toast ${t.cls}`}>
                <div className="cl-toast-icon" style={{ background: t.bg }}>
                  <Icon size={16} color={t.color} />
                </div>
                <div className="cl-toast-body">
                  <div className="cl-toast-title">{toast.title}</div>
                  {toast.body && <div className="cl-toast-text">{toast.body}</div>}
                </div>
                <button
                  className="cl-toast-close"
                  onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}>
                  <X size={13} />
                </button>
                <div className="cl-toast-progress" />
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
