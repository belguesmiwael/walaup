'use client'
import { Home, MessageSquare, Package, CreditCard, AppWindow } from 'lucide-react'

const TABS = [
  { id: 'projet',     icon: Home,          label: 'Projet'      },
  { id: 'messages',   icon: MessageSquare, label: 'Messages',   hasBadge: true },
  { id: 'abonnement', icon: Package,       label: 'Abonnement'  },
  { id: 'paiements',  icon: CreditCard,    label: 'Paiements'   },
  { id: 'apps',       icon: AppWindow,     label: 'Apps'        },
]

const CSS = `
  .cbt {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 64px;
    background: rgba(10,14,28,.94);
    border-top: 1px solid rgba(255,255,255,.07);
    backdrop-filter: blur(24px);
    display: flex;
    align-items: stretch;
    z-index: 100;
    padding-bottom: env(safe-area-inset-bottom, 0);
  }
  .cbt-btn {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    cursor: pointer;
    color: var(--tx-3);
    border: none;
    background: none;
    transition: color .18s;
    position: relative;
    padding: 0;
    font-family: var(--font-body);
    -webkit-tap-highlight-color: transparent;
  }
  .cbt-btn.active { color: var(--ac); }

  /* Animated top indicator */
  .cbt-btn::before {
    content: '';
    position: absolute;
    top: 0;
    left: 30%;
    right: 30%;
    height: 2px;
    background: var(--ac);
    border-radius: 0 0 3px 3px;
    transform: scaleX(0);
    transition: transform .22s cubic-bezier(0.34,1.56,0.64,1);
  }
  .cbt-btn.active::before { transform: scaleX(1); }

  .cbt-label {
    font-size: 10px;
    font-weight: 500;
    line-height: 1;
  }
  .cbt-dot {
    position: absolute;
    top: 8px;
    right: calc(50% - 14px);
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--red);
    border: 1.5px solid rgba(10,14,28,.9);
  }

  @media (min-width: 768px) { .cbt { display: none !important; } }
`

export default function ClientBottomTabs({ activeTab, onTabChange, unread = 0 }) {
  return (
    <>
      <style>{CSS}</style>
      <nav className="cbt" role="navigation" aria-label="Navigation mobile">
        {TABS.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          const hasUnread = tab.hasBadge && unread > 0
          return (
            <button
              key={tab.id}
              className={`cbt-btn ${isActive ? 'active' : ''}`}
              onClick={() => onTabChange(tab.id)}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon size={20} strokeWidth={isActive ? 2.2 : 1.6} />
              <span className="cbt-label">{tab.label}</span>
              {hasUnread && <span className="cbt-dot" />}
            </button>
          )
        })}
      </nav>
    </>
  )
}
