'use client'
import { useState } from 'react'
import Link from 'next/link'
import { WalaupSound } from '@/lib/sound'
import {
  LayoutDashboard, Users, ShoppingBag, CreditCard,
  Settings, LogOut, ArrowLeft, ChevronLeft, ChevronRight,
  RefreshCcw, Bell
} from 'lucide-react'

const NAV = [
  { id: 'overview',     icon: LayoutDashboard, label: 'Vue d\'ensemble', badge: null },
  { id: 'clients',      icon: Users,           label: 'Clients',         badge: 'unread' },
  { id: 'marketplace',  icon: ShoppingBag,     label: 'Marketplace',     badge: null },
  { id: 'paiements',    icon: CreditCard,      label: 'Paiements',       badge: 'pending' },
  { id: 'config',       icon: Settings,        label: 'Configuration',   badge: null },
]

export default function AdminSidebar({ active, onTab, unreadCount = 0, pendingCount = 0, onLogout }) {
  const [collapsed, setCollapsed] = useState(false)

  const toggle = () => {
    setCollapsed(c => !c)
    WalaupSound.toggle?.()
  }

  const getBadge = (b) => {
    if (b === 'unread' && unreadCount > 0) return unreadCount
    if (b === 'pending' && pendingCount > 0) return pendingCount
    return null
  }

  const CSS = `
    .asb { position:relative; height:100%; display:flex; flex-direction:column;
      background:rgba(13,17,32,0.96); border-right:1px solid rgba(255,255,255,0.07);
      transition:width 260ms cubic-bezier(0.16,1,0.3,1); overflow:hidden;
      flex-shrink:0; backdrop-filter:blur(20px); }
    .asb--open   { width:256px; }
    .asb--closed { width:64px; }

    .asb-head { display:flex; align-items:center; justify-content:space-between;
      padding:18px 16px 14px; border-bottom:1px solid rgba(255,255,255,0.06); flex-shrink:0; }
    .asb-logo { display:flex; align-items:center; gap:10px; text-decoration:none; }
    .asb-logo-mark { width:32px; height:32px; border-radius:10px; flex-shrink:0;
      background:linear-gradient(135deg,#6366F1,#8B5CF6);
      display:flex; align-items:center; justify-content:center;
      font-weight:800; font-size:14px; color:#fff; font-family:'Space Grotesk',sans-serif; }
    .asb-logo-text { font-family:'Space Grotesk',sans-serif; font-weight:800;
      font-size:15px; color:var(--tx); white-space:nowrap;
      opacity:1; transition:opacity 200ms; }
    .asb--closed .asb-logo-text { opacity:0; pointer-events:none; }

    .asb-toggle { width:24px; height:24px; border-radius:6px; background:rgba(255,255,255,0.06);
      border:1px solid rgba(255,255,255,0.1); display:flex; align-items:center; justify-content:center;
      cursor:pointer; color:var(--tx-2); transition:all 180ms; flex-shrink:0; }
    .asb-toggle:hover { background:rgba(99,102,241,0.15); color:var(--ac); border-color:rgba(99,102,241,0.3); }

    .asb-tag { padding:6px 14px 4px; font-size:9px; font-weight:700; color:var(--tx-3);
      letter-spacing:.1em; text-transform:uppercase; white-space:nowrap;
      overflow:hidden; opacity:1; transition:opacity 200ms; }
    .asb--closed .asb-tag { opacity:0; }

    .asb-nav { flex:1; padding:8px 8px; overflow-y:auto; overflow-x:hidden; }
    .asb-nav::-webkit-scrollbar { display:none; }

    .asb-item { display:flex; align-items:center; gap:10px; padding:9px 10px;
      border-radius:10px; cursor:pointer; border:1px solid transparent;
      transition:all 180ms cubic-bezier(0.16,1,0.3,1); margin-bottom:2px;
      text-decoration:none; position:relative; white-space:nowrap; }
    .asb-item:hover { background:rgba(255,255,255,0.05); }
    .asb-item--active { background:rgba(99,102,241,0.14); border-color:rgba(99,102,241,0.25); }
    .asb-item--active .asb-item-icon { color:var(--ac); }
    .asb-item--active .asb-item-label { color:var(--tx); }

    .asb-item-icon { width:20px; height:20px; flex-shrink:0; display:flex;
      align-items:center; justify-content:center; color:var(--tx-2); }
    .asb-item--active .asb-item-icon { color:var(--ac); }

    .asb-item-label { font-size:13px; font-weight:500; color:var(--tx-2);
      opacity:1; transition:opacity 200ms; }
    .asb--closed .asb-item-label { opacity:0; pointer-events:none; }

    .asb-badge { margin-left:auto; min-width:18px; height:18px; border-radius:9px;
      background:var(--red); color:#fff; font-size:10px; font-weight:700;
      display:flex; align-items:center; justify-content:center; padding:0 5px;
      opacity:1; transition:opacity 200ms; flex-shrink:0; }
    .asb--closed .asb-badge { opacity:0; }

    .asb-tooltip { position:fixed; left:72px; background:rgba(13,17,32,0.98);
      border:1px solid rgba(255,255,255,0.12); border-radius:8px;
      padding:6px 12px; font-size:12px; font-weight:500; color:var(--tx);
      pointer-events:none; white-space:nowrap; z-index:9999;
      box-shadow:0 8px 32px rgba(0,0,0,0.6); display:none; }
    .asb--closed .asb-item:hover .asb-tooltip { display:block; }

    .asb-foot { padding:10px 8px 16px; border-top:1px solid rgba(255,255,255,0.06); flex-shrink:0; }
    .asb-back { display:flex; align-items:center; gap:10px; padding:8px 10px;
      border-radius:10px; text-decoration:none; color:var(--tx-2); font-size:13px;
      font-weight:500; transition:all 180ms; border:1px solid transparent;
      white-space:nowrap; margin-bottom:4px; }
    .asb-back:hover { background:rgba(255,255,255,0.05); color:var(--tx); }
    .asb-back-label { opacity:1; transition:opacity 200ms; }
    .asb--closed .asb-back-label { opacity:0; }

    .asb-logout { display:flex; align-items:center; gap:10px; padding:8px 10px;
      border-radius:10px; cursor:pointer; color:#F87171; font-size:13px; font-weight:500;
      transition:all 180ms; border:1px solid transparent; white-space:nowrap; }
    .asb-logout:hover { background:rgba(248,113,113,0.1); border-color:rgba(248,113,113,0.2); }
    .asb-logout-label { opacity:1; transition:opacity 200ms; }
    .asb--closed .asb-logout-label { opacity:0; }

    .asb-dot { width:8px; height:8px; border-radius:50%; background:var(--green);
      position:absolute; top:8px; right:10px; box-shadow:0 0 8px var(--green); }
    .asb--closed .asb-dot { top:6px; right:6px; }
  `

  return (
    <>
      <style>{CSS}</style>
      <aside className={`asb ${collapsed ? 'asb--closed' : 'asb--open'}`}>
        {/* Header */}
        <div className="asb-head">
          <Link href="/" className="asb-logo">
            <div className="asb-logo-mark">W</div>
            <span className="asb-logo-text">Walaup Admin</span>
          </Link>
          <button className="asb-toggle" onClick={toggle}>
            {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="asb-nav">
          <div className="asb-tag">Navigation</div>
          {NAV.map(item => {
            const Icon = item.icon
            const badge = getBadge(item.badge)
            return (
              <div
                key={item.id}
                className={`asb-item ${active === item.id ? 'asb-item--active' : ''}`}
                onClick={() => { onTab(item.id); WalaupSound.tab?.() }}
              >
                <span className="asb-tooltip">{item.label}</span>
                <span className="asb-item-icon"><Icon size={16} strokeWidth={1.8} /></span>
                <span className="asb-item-label">{item.label}</span>
                {badge ? <span className="asb-badge">{badge}</span> : null}
              </div>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="asb-foot">
          <div className="asb-dot" title="En ligne" />
          <Link href="/" className="asb-back">
            <ArrowLeft size={14} strokeWidth={1.8} />
            <span className="asb-back-label">Retour accueil</span>
          </Link>
          <div className="asb-logout" onClick={onLogout}>
            <LogOut size={14} strokeWidth={1.8} />
            <span className="asb-logout-label">Déconnexion</span>
          </div>
        </div>
      </aside>
    </>
  )
}
