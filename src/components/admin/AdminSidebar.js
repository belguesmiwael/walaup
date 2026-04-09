'use client'
import { useState } from 'react'
import Link from 'next/link'
import { WalaupSound } from '@/lib/sound'
import {
  LayoutDashboard, Users, ShoppingBag, CreditCard,
  Settings, LogOut, ArrowLeft, ChevronLeft, ChevronRight,
} from 'lucide-react'

const NAV = [
  { id: 'overview',    icon: LayoutDashboard, label: "Vue d'ensemble", badge: null },
  { id: 'clients',     icon: Users,           label: 'Clients',        badge: 'unread' },
  { id: 'marketplace', icon: ShoppingBag,     label: 'Marketplace',    badge: null },
  { id: 'paiements',   icon: CreditCard,      label: 'Paiements',      badge: 'pending' },
  { id: 'config',      icon: Settings,        label: 'Configuration',  badge: null },
]

export default function AdminSidebar({ active, onTab, unreadCount = 0, pendingCount = 0, onLogout }) {
  const [collapsed, setCollapsed] = useState(false)

  const toggle = () => {
    setCollapsed(c => !c)
    WalaupSound.toggle?.()
  }

  const getBadge = (b) => {
    if (b === 'unread'  && unreadCount  > 0) return unreadCount
    if (b === 'pending' && pendingCount > 0) return pendingCount
    return null
  }

  const CSS = `
    /* ── Container ── */
    .asb {
      position: relative;
      height: 100%;
      display: flex;
      flex-direction: column;
      background: rgba(13,17,32,0.97);
      border-right: 1px solid rgba(255,255,255,0.07);
      transition: width 280ms cubic-bezier(0.16,1,0.3,1);
      overflow: visible;
      flex-shrink: 0;
      backdrop-filter: blur(20px);
      z-index: 20;
    }
    .asb--open   { width: 220px; }
    .asb--closed { width: 56px; }

    /* ── Header ── */
    .asb-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 10px 12px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
      flex-shrink: 0;
      min-height: 56px;
    }

    /* ── Logo ── */
    .asb-logo { display:flex; align-items:center; gap:8px; text-decoration:none; overflow:hidden; }
    .asb-logo-mark {
      width:32px; height:32px; border-radius:10px; flex-shrink:0;
      background: linear-gradient(135deg,#6366F1,#8B5CF6);
      display:flex; align-items:center; justify-content:center;
      font-weight:800; font-size:14px; color:#fff;
      font-family:'Space Grotesk',sans-serif;
    }
    .asb-logo-text {
      font-family:'Space Grotesk',sans-serif;
      font-weight:800; font-size:14px; color:var(--tx);
      white-space:nowrap;
      transition: opacity 200ms, max-width 280ms;
      max-width:140px; overflow:hidden;
    }
    .asb--closed .asb-logo-text { opacity:0; max-width:0; }

    /* ── Toggle button (toujours visible) ── */
    .asb-toggle {
      width:26px; height:26px; border-radius:7px;
      background: rgba(99,102,241,0.15);
      border: 1px solid rgba(99,102,241,0.35);
      display:flex; align-items:center; justify-content:center;
      cursor:pointer; color:var(--ac);
      transition:all 180ms; flex-shrink:0;
    }
    .asb-toggle:hover {
      background: rgba(99,102,241,0.28);
      border-color: rgba(99,102,241,0.6);
      transform: scale(1.08);
    }

    /* ── Languette "rouvrir" (visible uniquement quand fermé) ── */
    .asb-reopen-tab {
      display: none;
      position: absolute;
      top: 50%;
      right: -14px;
      transform: translateY(-50%);
      width: 14px;
      height: 44px;
      background: rgba(99,102,241,0.8);
      border-radius: 0 8px 8px 0;
      cursor: pointer;
      align-items: center;
      justify-content: center;
      z-index: 30;
      transition: background 180ms, width 180ms, right 180ms;
    }
    .asb-reopen-tab:hover { background: rgba(99,102,241,1); width:18px; right:-18px; }
    .asb--closed .asb-reopen-tab { display:flex; }
    .asb-reopen-arrow {
      width:7px; height:7px;
      border-right:2px solid #fff;
      border-top:2px solid #fff;
      transform:rotate(45deg);
      margin-left:-3px;
    }

    /* ── Section label ── */
    .asb-tag {
      padding:8px 10px 4px;
      font-size:9px; font-weight:700; color:var(--tx-3);
      letter-spacing:.1em; text-transform:uppercase;
      white-space:nowrap; overflow:hidden;
      transition:opacity 200ms;
    }
    .asb--closed .asb-tag { opacity:0; }

    /* ── Nav ── */
    .asb-nav { flex:1; padding:6px; overflow-y:auto; overflow-x:hidden; }
    .asb-nav::-webkit-scrollbar { display:none; }

    .asb-item {
      display:flex; align-items:center; gap:10px;
      padding:9px; border-radius:10px;
      cursor:pointer; border:1px solid transparent;
      transition:all 180ms cubic-bezier(0.16,1,0.3,1);
      margin-bottom:2px; position:relative;
      white-space:nowrap; text-decoration:none;
      overflow:hidden;
    }
    .asb-item:hover { background:rgba(255,255,255,0.05); }
    .asb-item--active {
      background:rgba(99,102,241,0.14);
      border-color:rgba(99,102,241,0.25);
    }
    .asb-item-icon {
      width:20px; height:20px; flex-shrink:0;
      display:flex; align-items:center; justify-content:center;
      color:var(--tx-2);
    }
    .asb-item--active .asb-item-icon { color:var(--ac); }
    .asb-item-label {
      font-size:13px; font-weight:500; color:var(--tx-2);
      transition:opacity 200ms; flex:1;
    }
    .asb-item--active .asb-item-label { color:var(--tx); }
    .asb--closed .asb-item-label { opacity:0; pointer-events:none; }

    .asb-badge {
      min-width:18px; height:18px; border-radius:9px;
      background:var(--red); color:#fff;
      font-size:10px; font-weight:700;
      display:flex; align-items:center; justify-content:center;
      padding:0 5px; flex-shrink:0;
      transition:opacity 200ms;
    }
    .asb--closed .asb-badge { opacity:0; }

    /* Tooltip quand fermé */
    .asb-tooltip {
      position:fixed; left:66px;
      background:rgba(13,17,32,0.98);
      border:1px solid rgba(255,255,255,0.12);
      border-radius:8px; padding:6px 12px;
      font-size:12px; font-weight:500; color:var(--tx);
      pointer-events:none; white-space:nowrap;
      z-index:9999; box-shadow:0 8px 32px rgba(0,0,0,0.6);
      display:none;
    }
    .asb--closed .asb-item:hover .asb-tooltip { display:block; }

    /* ── Footer ── */
    .asb-foot {
      padding:8px 6px 14px;
      border-top:1px solid rgba(255,255,255,0.06);
      flex-shrink:0;
    }
    .asb-back {
      display:flex; align-items:center; gap:10px;
      padding:8px 9px; border-radius:10px;
      text-decoration:none; color:var(--tx-2);
      font-size:13px; font-weight:500;
      transition:all 180ms; border:1px solid transparent;
      white-space:nowrap; margin-bottom:4px; overflow:hidden;
    }
    .asb-back:hover { background:rgba(255,255,255,0.05); color:var(--tx); }
    .asb-back-label { transition:opacity 200ms; }
    .asb--closed .asb-back-label { opacity:0; }

    .asb-logout {
      display:flex; align-items:center; gap:10px;
      padding:8px 9px; border-radius:10px;
      cursor:pointer; color:#F87171;
      font-size:13px; font-weight:500;
      transition:all 180ms; border:1px solid transparent;
      white-space:nowrap; overflow:hidden;
    }
    .asb-logout:hover {
      background:rgba(248,113,113,0.1);
      border-color:rgba(248,113,113,0.2);
    }
    .asb-logout-label { transition:opacity 200ms; }
    .asb--closed .asb-logout-label { opacity:0; }
  `

  return (
    <>
      <style>{CSS}</style>
      <div className={`asb ${collapsed ? 'asb--closed' : 'asb--open'}`}>

        {/* Languette rouvrir (visible uniquement quand sidebar fermé) */}
        <div className="asb-reopen-tab" onClick={toggle} title="Ouvrir le menu">
          <div className="asb-reopen-arrow" />
        </div>

        {/* Header */}
        <div className="asb-head">
          <Link href="/" className="asb-logo">
            <div className="asb-logo-mark">W</div>
            <span className="asb-logo-text">Walaup Admin</span>
          </Link>
          <div className="asb-toggle" onClick={toggle} title={collapsed ? 'Ouvrir' : 'Réduire'}>
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </div>
        </div>

        {/* Nav */}
        <div className="asb-nav">
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
                <div className="asb-item-icon"><Icon size={17} /></div>
                <span className="asb-item-label">{item.label}</span>
                {badge ? <span className="asb-badge">{badge}</span> : null}
                <span className="asb-tooltip">{item.label}</span>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        {/* Footer */}
<div className="asb-foot">
  <Link href="/" className="asb-back">
    <ArrowLeft size={17} />
    <span className="asb-back-label">Retour accueil</span>
  </Link>
  <div className="asb-logout" onClick={onLogout}>
    <LogOut size={17} />
    <span className="asb-logout-label">Déconnexion</span>
  </div>
</div>

      </div>
    </>
  )
}
