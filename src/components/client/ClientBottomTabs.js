'use client'
import { Home, MessageSquare, Package, CreditCard, AppWindow, ArrowLeft, LogOut } from 'lucide-react'

const TABS = [
  { id: 'projet',     icon: Home,          label: 'Projet'  },
  { id: 'messages',   icon: MessageSquare, label: 'Messages', hasBadge: true },
  { id: 'abonnement', icon: Package,        label: 'Abonn.'  },
  { id: 'paiements',  icon: CreditCard,     label: 'Paiem.'  },
  { id: 'apps',       icon: AppWindow,      label: 'Apps'    },
]

const CSS = `
  .cbt {
    position: fixed;
    bottom: 0; left: 0; right: 0;
    background: rgba(10,14,28,.96);
    border-top: 1px solid rgba(255,255,255,.07);
    backdrop-filter: blur(24px);
    display: flex;
    align-items: stretch;
    z-index: 100;
    padding-bottom: env(safe-area-inset-bottom, 0);
  }

  /* Boutons utilitaires (retour + logout) */
  .cbt-util {
    width: 44px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    border: none;
    background: none;
    text-decoration: none;
    transition: all .18s;
    -webkit-tap-highlight-color: transparent;
  }
  .cbt-util--back { color: var(--tx-3); border-right: 1px solid rgba(255,255,255,.05); }
  .cbt-util--back:hover { color: var(--tx-2); background: rgba(255,255,255,.04); }
  .cbt-util--logout { color: var(--tx-3); border-left: 1px solid rgba(255,255,255,.05); }
  .cbt-util--logout:hover { color: var(--red); background: rgba(248,113,113,.07); }

  /* Tabs nav */
  .cbt-nav {
    flex: 1;
    display: flex;
    align-items: stretch;
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
    height: 64px;
  }
  .cbt-btn.active { color: var(--ac); }
  .cbt-btn::before {
    content: '';
    position: absolute;
    top: 0; left: 20%; right: 20%;
    height: 2px;
    background: var(--ac);
    border-radius: 0 0 3px 3px;
    transform: scaleX(0);
    transition: transform .22s cubic-bezier(0.34,1.56,0.64,1);
  }
  .cbt-btn.active::before { transform: scaleX(1); }
  .cbt-label { font-size: 9px; font-weight: 500; line-height: 1; }
  .cbt-dot {
    position: absolute;
    top: 8px; right: calc(50% - 14px);
    width: 7px; height: 7px;
    border-radius: 50%;
    background: var(--red);
    border: 1.5px solid rgba(10,14,28,.9);
  }

  @media (min-width: 768px) { .cbt { display: none !important; } }
`

export default function ClientBottomTabs({ activeTab, onTabChange, unread = 0, onLogout }) {
  return (
    <>
      <style>{CSS}</style>
      <div className="cbt">

        {/* Retour landing page */}
        <a href="/" className="cbt-util cbt-util--back" aria-label="Retour accueil">
          <ArrowLeft size={18} />
        </a>

        {/* Tabs nav */}
        <div className="cbt-nav">
          {TABS.map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            const hasUnread = tab.hasBadge && unread > 0
            return (
              <button
                key={tab.id}
                className={`cbt-btn${isActive ? ' active' : ''}`}
                onClick={() => onTabChange(tab.id)}
                aria-label={tab.label}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon size={19} />
                <span className="cbt-label">{tab.label}</span>
                {hasUnread && <span className="cbt-dot" />}
              </button>
            )
          })}
        </div>

        {/* Déconnecter */}
        <button className="cbt-util cbt-util--logout" aria-label="Déconnecter" onClick={onLogout}>
          <LogOut size={17} />
        </button>

      </div>
    </>
  )
}
