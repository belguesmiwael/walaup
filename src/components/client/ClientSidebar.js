'use client'
import Link from 'next/link'
import {
  Home, MessageSquare, Package, CreditCard,
  AppWindow, ChevronLeft, ChevronRight, LogOut, ArrowLeft
} from 'lucide-react'

const NAV = [
  { id: 'projet',     icon: Home,          label: 'Mon Projet'   },
  { id: 'messages',   icon: MessageSquare, label: 'Messages',   hasBadge: true },
  { id: 'abonnement', icon: Package,       label: 'Abonnement'  },
  { id: 'paiements',  icon: CreditCard,    label: 'Paiements'   },
  { id: 'apps',       icon: AppWindow,     label: 'Mes Apps'    },
]

const CSS = `
  .csb {
    height: 100%;
    display: flex;
    flex-direction: column;
    background: rgba(10,14,28,.88);
    border-right: 1px solid rgba(255,255,255,.06);
    backdrop-filter: blur(24px);
    overflow: hidden;
    position: relative;
    z-index: 10;
    flex-shrink: 0;
    transition: width .26s cubic-bezier(0.16,1,0.3,1);
  }
  .csb--open  { width: 260px; }
  .csb--closed { width: 64px; }

  /* Header */
  .csb-header {
    display: flex;
    align-items: center;
    padding: 18px 14px;
    border-bottom: 1px solid rgba(255,255,255,.05);
    flex-shrink: 0;
    min-height: 60px;
  }
  .csb-logo {
    font-family: var(--font-display);
    font-size: 1.15rem;
    font-weight: 800;
    background: linear-gradient(135deg, #6366F1, #8B5CF6);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    white-space: nowrap;
    overflow: hidden;
    flex: 1;
    opacity: 0;
    width: 0;
    transition: opacity .18s, width .26s cubic-bezier(0.16,1,0.3,1);
  }
  .csb--open .csb-logo { opacity: 1; width: auto; }

  .csb-toggle {
    width: 30px;
    height: 30px;
    min-width: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(255,255,255,.09);
    border-radius: 8px;
    background: rgba(255,255,255,.04);
    cursor: pointer;
    color: var(--tx-3);
    transition: all .18s;
    margin-left: auto;
  }
  .csb-toggle:hover {
    background: rgba(255,255,255,.09);
    color: var(--tx);
    border-color: rgba(255,255,255,.14);
  }

  /* Nav */
  .csb-nav {
    flex: 1;
    padding: 10px 8px;
    display: flex;
    flex-direction: column;
    gap: 2px;
    overflow: hidden;
  }
  .csb-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 12px;
    height: 42px;
    border-radius: 10px;
    cursor: pointer;
    transition: all .18s;
    color: var(--tx-3);
    border: 1px solid transparent;
    text-decoration: none;
    position: relative;
    white-space: nowrap;
    overflow: hidden;
  }
  .csb--closed .csb-item {
    justify-content: center;
    padding: 0;
  }
  .csb-item:hover {
    background: rgba(255,255,255,.05);
    color: var(--tx-2);
  }
  .csb-item.active {
    background: rgba(99,102,241,.14);
    color: var(--ac);
    border-color: rgba(99,102,241,.22);
  }
  .csb-item-icon { flex-shrink: 0; display: flex; align-items: center; }
  .csb-item-label {
    font-size: 13px;
    font-weight: 500;
    overflow: hidden;
    opacity: 0;
    width: 0;
    transition: opacity .18s, width .26s cubic-bezier(0.16,1,0.3,1);
  }
  .csb--open .csb-item-label { opacity: 1; width: auto; }

  .csb-badge {
    background: var(--red);
    color: #fff;
    font-size: 10px;
    font-weight: 700;
    min-width: 18px;
    height: 18px;
    padding: 0 4px;
    border-radius: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: auto;
    flex-shrink: 0;
  }
  .csb-dot {
    position: absolute;
    top: 7px;
    right: 10px;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--red);
  }

  /* Tooltip (collapsed mode only) */
  .csb-tooltip {
    position: absolute;
    left: calc(100% + 10px);
    top: 50%;
    transform: translateY(-50%);
    background: rgba(13,17,32,.98);
    border: 1px solid rgba(255,255,255,.12);
    color: var(--tx);
    font-size: 12px;
    font-weight: 500;
    padding: 6px 12px;
    border-radius: 8px;
    white-space: nowrap;
    opacity: 0;
    pointer-events: none;
    transition: opacity .15s;
    z-index: 200;
    box-shadow: 0 4px 16px rgba(0,0,0,.5);
  }
  .csb--closed .csb-item:hover .csb-tooltip { opacity: 1; }

  /* Footer */
  .csb-footer {
    padding: 10px 8px;
    border-top: 1px solid rgba(255,255,255,.05);
    flex-shrink: 0;
  }
  .csb-user {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 8px;
    overflow: hidden;
    border-radius: 10px;
    margin-bottom: 2px;
  }
  .csb--closed .csb-user { justify-content: center; padding: 8px 0; }
  .csb-avatar {
    width: 34px;
    height: 34px;
    min-width: 34px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--ac) 0%, var(--ac-2) 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: 700;
    color: #fff;
  }
  .csb-user-info {
    overflow: hidden;
    opacity: 0;
    width: 0;
    transition: opacity .18s, width .26s cubic-bezier(0.16,1,0.3,1);
  }
  .csb--open .csb-user-info { opacity: 1; width: auto; }
  .csb-user-name {
    font-size: 12.5px;
    font-weight: 600;
    color: var(--tx);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 150px;
  }
  .csb-user-email {
    font-size: 11px;
    color: var(--tx-3);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 150px;
  }
  .csb-logout {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 0 12px;
    height: 38px;
    border-radius: 10px;
    cursor: pointer;
    color: var(--tx-3);
    transition: all .18s;
    border: none;
    background: none;
    font-family: var(--font-body);
    width: 100%;
    white-space: nowrap;
    overflow: hidden;
  }
  .csb--closed .csb-logout { justify-content: center; padding: 0; }
  .csb-logout:hover { background: rgba(248,113,113,.09); color: var(--red); }
  .csb-logout-label {
    font-size: 12.5px;
    font-weight: 500;
    opacity: 0;
    width: 0;
    transition: opacity .18s, width .26s cubic-bezier(0.16,1,0.3,1);
  }
  .csb--open .csb-logout-label { opacity: 1; width: auto; }

  .csb-back {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 0 12px;
    height: 38px;
    border-radius: 10px;
    cursor: pointer;
    color: var(--tx-3);
    transition: all .18s;
    text-decoration: none;
    font-family: var(--font-body);
    width: 100%;
    white-space: nowrap;
    overflow: hidden;
    margin-bottom: 2px;
  }
  .csb--closed .csb-back { justify-content: center; padding: 0; }
  .csb-back:hover { background: rgba(255,255,255,.06); color: var(--tx-2); }
  .csb-back-label {
    font-size: 12.5px;
    font-weight: 500;
    opacity: 0;
    width: 0;
    transition: opacity .18s, width .26s cubic-bezier(0.16,1,0.3,1);
  }
  .csb--open .csb-back-label { opacity: 1; width: auto; }
`

export default function ClientSidebar({ activeTab, onTabChange, open, onToggle, session, lead, onLogout, unread = 0 }) {
  const userName = session?.user?.user_metadata?.full_name
    || session?.user?.email?.split('@')[0]
    || 'Client'
  const userEmail = session?.user?.email || ''
  const initial = userName.charAt(0).toUpperCase()
  const cls = open ? 'csb csb--open' : 'csb csb--closed'

  return (
    <>
      <style>{CSS}</style>
      <aside className={cls}>
        {/* Header */}
        <div className="csb-header">
          <span className="csb-logo">Walaup</span>
          <button className="csb-toggle" onClick={onToggle} aria-label="Toggle sidebar">
            {open ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="csb-nav">
          {NAV.map(item => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            const hasUnread = item.hasBadge && unread > 0
            return (
              <div
                key={item.id}
                className={`csb-item ${isActive ? 'active' : ''}`}
                onClick={() => onTabChange(item.id)}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && onTabChange(item.id)}
              >
                <span className="csb-item-icon">
                  <Icon size={18} strokeWidth={isActive ? 2.1 : 1.6} />
                </span>
                <span className="csb-item-label">{item.label}</span>
                {hasUnread && open && (
                  <span className="csb-badge">{unread > 9 ? '9+' : unread}</span>
                )}
                {hasUnread && !open && <span className="csb-dot" />}
                {!open && <span className="csb-tooltip">{item.label}</span>}
              </div>
            )
          })}
        </nav>

        {/* Footer user */}
        <div className="csb-footer">
          <div className="csb-user">
            <div className="csb-avatar">{initial}</div>
            <div className="csb-user-info">
              <div className="csb-user-name">{userName}</div>
              <div className="csb-user-email">{userEmail}</div>
            </div>
          </div>
          <Link href="/" className="csb-back">
            <ArrowLeft size={15} strokeWidth={1.8} />
            <span className="csb-back-label">Retour accueil</span>
          </Link>
          <button className="csb-logout" onClick={onLogout}>
            <LogOut size={15} strokeWidth={1.8} />
            <span className="csb-logout-label">Déconnexion</span>
          </button>
        </div>
      </aside>
    </>
  )
}
