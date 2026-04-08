'use client'
import { useState } from 'react'
import { WalaupSound } from '@/lib/sound'
import { Plus, Edit2, Eye, EyeOff, X, Upload, Globe, Cpu, ShoppingBag, Heart, GraduationCap, Truck } from 'lucide-react'

const MOCK_APPS = [
  {
    id: '1', name: 'App Café & Restaurant', tagline: 'Gérez votre café comme un pro', icon: '☕',
    category: 'Restaurant', app_type: 'caisse', price_from: 299, active: true,
    owner_type: 'walaup', demo_url: 'https://demo.walaup.tn/cafe',
    sort_order: 1, desc: 'Caisse anti-vol, commandes tables, gestion employés, rapports CA'
  },
  {
    id: '2', name: 'App Grossiste / Recharge', tagline: 'Stock et clients sous contrôle', icon: '📦',
    category: 'Retail', app_type: 'stock', price_from: 349, active: true,
    owner_type: 'walaup', demo_url: 'https://demo.walaup.tn/stock',
    sort_order: 2, desc: 'Gestion stock, crédits clients, suivi dettes, alertes automatiques'
  },
  {
    id: '3', name: 'App Suivi Dettes', tagline: 'Plus jamais un dirham perdu', icon: '💸',
    category: 'Services', app_type: 'dettes', price_from: 249, active: true,
    owner_type: 'walaup', demo_url: 'https://demo.walaup.tn/dettes',
    sort_order: 3, desc: 'Clients débiteurs, relances automatiques, rapports mensuels'
  },
  {
    id: '4', name: 'App Médicale', tagline: 'Agenda + dossiers patients', icon: '🏥',
    category: 'Médical', app_type: 'medical', price_from: 499, active: true,
    owner_type: 'walaup', demo_url: '',
    sort_order: 4, desc: 'RDV, dossiers patients, ordonnances, téléconsultation'
  },
  {
    id: '5', name: 'App Café Sonia', tagline: 'Café & Pâtisserie — Sfax', icon: '🍰',
    category: 'Restaurant', app_type: 'caisse', price_from: 279, active: true,
    owner_type: 'partner', demo_url: '',
    sort_order: 5, desc: 'Version adaptée par Sonia M. — disponible à la vente'
  },
]

const CAT_ICONS = {
  Restaurant: { Icon: ShoppingBag, color: '#FB923C' },
  Retail:     { Icon: ShoppingBag, color: '#818CF8' },
  Services:   { Icon: Globe,       color: '#22D3EE' },
  Médical:    { Icon: Heart,       color: '#10B981' },
  Education:  { Icon: GraduationCap, color: '#F59E0B' },
  Livraison:  { Icon: Truck,       color: '#22D3EE' },
}

const PLACEHOLDER_APPS = [
  { id: 'pl1', name: 'App Crèche / École', icon: '🏫', status: 'En développement', eta: 'Q3 2026' },
  { id: 'pl2', name: 'App Livraison',      icon: '🚚', status: 'Planifié',          eta: 'Q3 2026' },
  { id: 'pl3', name: 'App Pharmacie',      icon: '💊', status: 'Planifié',          eta: 'Q4 2026' },
  { id: 'pl4', name: 'E-commerce TN',      icon: '🛒', status: 'Planifié',          eta: 'Q4 2026' },
]

const EMPTY_FORM = {
  name: '', tagline: '', description: '', category: 'Restaurant', app_type: '',
  price_from: '', demo_url: '', owner_type: 'walaup', active: true, icon: '📱'
}

export default function TabMarketplace() {
  const [apps, setApps] = useState(MOCK_APPS)
  const [editApp, setEditApp] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  const openAdd = () => { setForm(EMPTY_FORM); setEditApp(null); setShowModal(true) }
  const openEdit = (app) => {
    setForm({ ...app, price_from: app.price_from.toString() })
    setEditApp(app)
    setShowModal(true)
  }

  const toggleActive = (id) => {
    setApps(prev => prev.map(a => a.id === id ? { ...a, active: !a.active } : a))
    WalaupSound.toggle?.()
  }

  const handleSave = () => {
    if (!form.name.trim()) return
    if (editApp) {
      setApps(prev => prev.map(a => a.id === editApp.id ? { ...a, ...form, price_from: parseFloat(form.price_from) || 0 } : a))
    } else {
      setApps(prev => [...prev, { ...form, id: Date.now().toString(), price_from: parseFloat(form.price_from) || 0, sort_order: prev.length + 1 }])
    }
    WalaupSound.success?.()
    setShowModal(false)
  }

  const CSS = `
    .adm-mp { padding:24px; overflow-y:auto; height:100%; }
    .adm-mp::-webkit-scrollbar { width:4px; }
    .adm-mp::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:4px; }

    .adm-mp-head { display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; }
    .adm-mp-title { font-family:'Space Grotesk',sans-serif; font-weight:800; font-size:20px; color:var(--tx); }
    .adm-mp-add { display:flex; align-items:center; gap:6px; padding:8px 16px;
      border-radius:10px; background:linear-gradient(135deg,#6366F1,#8B5CF6); border:none;
      color:#fff; font-size:12px; font-weight:700; cursor:pointer; transition:transform 150ms;
      font-family:'Space Grotesk',sans-serif; }
    .adm-mp-add:hover { transform:scale(1.03); }

    .adm-mp-section { font-size:11px; font-weight:700; color:var(--tx-3); letter-spacing:.08em;
      text-transform:uppercase; margin-bottom:12px; margin-top:20px; }

    .adm-app-row { display:flex; align-items:center; gap:12px; padding:14px 16px;
      border-radius:12px; background:rgba(13,17,32,0.7); border:1px solid rgba(255,255,255,0.07);
      margin-bottom:8px; backdrop-filter:blur(8px); transition:border-color 180ms; }
    .adm-app-row:hover { border-color:rgba(99,102,241,0.2); }
    .adm-app-icon { width:42px; height:42px; border-radius:12px; background:rgba(99,102,241,0.12);
      display:flex; align-items:center; justify-content:center; font-size:20px; flex-shrink:0; }
    .adm-app-info { flex:1; min-width:0; }
    .adm-app-name { font-weight:700; font-size:13px; color:var(--tx); margin-bottom:3px; }
    .adm-app-tag { font-size:11px; color:var(--tx-3); }
    .adm-app-badges { display:flex; gap:6px; align-items:center; flex-wrap:wrap; }
    .adm-app-price { font-family:'JetBrains Mono',monospace; font-size:13px;
      font-weight:700; color:var(--gold); }
    .adm-owner-badge { padding:2px 8px; border-radius:20px; font-size:10px; font-weight:700; }
    .adm-owner-walaup  { color:#6366F1; background:rgba(99,102,241,0.12); border:1px solid rgba(99,102,241,0.25); }
    .adm-owner-partner { color:#F59E0B; background:rgba(245,158,11,0.12); border:1px solid rgba(245,158,11,0.25); }
    .adm-app-actions { display:flex; gap:6px; }
    .adm-act-btn { width:30px; height:30px; border-radius:8px; border:1px solid rgba(255,255,255,0.09);
      background:rgba(255,255,255,0.04); display:flex; align-items:center; justify-content:center;
      cursor:pointer; color:var(--tx-2); transition:all 150ms; }
    .adm-act-btn:hover { background:rgba(99,102,241,0.12); border-color:rgba(99,102,241,0.3); color:var(--ac); }
    .adm-inactive { opacity:.45; }

    .adm-pl-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(180px,1fr)); gap:10px; }
    .adm-pl-card { padding:16px; border-radius:12px; border:1px dashed rgba(255,255,255,0.1);
      background:rgba(13,17,32,0.5); text-align:center; }
    .adm-pl-icon { font-size:28px; margin-bottom:8px; }
    .adm-pl-name { font-size:12px; font-weight:600; color:var(--tx-2); margin-bottom:6px; }
    .adm-pl-status { font-size:10px; padding:2px 8px; border-radius:10px;
      background:rgba(245,158,11,0.1); color:#F59E0B; display:inline-block; margin-bottom:4px; }
    .adm-pl-eta { font-size:10px; color:var(--tx-3); }

    /* Modal */
    .adm-mpo { position:fixed; inset:0; background:rgba(0,0,0,0.75); z-index:9000;
      display:flex; align-items:center; justify-content:center; backdrop-filter:blur(4px); }
    .adm-mpc { background:#0D1120; border:1px solid rgba(255,255,255,0.12); border-radius:18px;
      padding:24px; width:520px; max-width:92vw; max-height:90vh; overflow-y:auto;
      box-shadow:0 24px 80px rgba(0,0,0,0.7); }
    .adm-mpc::-webkit-scrollbar { width:3px; }
    .adm-mpc::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:2px; }
    .adm-mpc-head { display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; }
    .adm-mpc-title { font-family:'Space Grotesk',sans-serif; font-weight:800; font-size:16px; color:var(--tx); }
    .adm-mpc-close { width:28px; height:28px; border-radius:8px; border:none;
      background:rgba(255,255,255,0.07); color:var(--tx-2); cursor:pointer;
      display:flex; align-items:center; justify-content:center; }
    .adm-form-row { margin-bottom:14px; }
    .adm-form-label { font-size:11px; font-weight:600; color:var(--tx-3); letter-spacing:.06em;
      text-transform:uppercase; margin-bottom:6px; display:block; }
    .adm-form-inp { width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1);
      border-radius:10px; padding:9px 12px; color:var(--tx); font-size:13px; outline:none;
      font-family:'Inter',sans-serif; }
    .adm-form-inp:focus { border-color:rgba(99,102,241,0.4); }
    .adm-form-sel { appearance:none; cursor:pointer; }
    .adm-form-2col { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
    .adm-form-row-inline { display:flex; gap:12px; align-items:center; margin-bottom:14px; }
    .adm-form-toggle { display:flex; align-items:center; gap:8px; font-size:13px; color:var(--tx-2); cursor:pointer; }
    .adm-mpc-save { width:100%; padding:12px; border-radius:11px;
      background:linear-gradient(135deg,#6366F1,#8B5CF6); border:none;
      color:#fff; font-size:13px; font-weight:700; cursor:pointer; margin-top:6px;
      font-family:'Space Grotesk',sans-serif; transition:transform 150ms;
      box-shadow:0 0 30px rgba(99,102,241,0.3); }
    .adm-mpc-save:hover { transform:scale(1.02); }
    .adm-mpc-note { padding:8px 12px; border-radius:8px; background:rgba(245,158,11,0.08);
      border:1px solid rgba(245,158,11,0.2); font-size:11px; color:#F59E0B; margin-bottom:14px; }
  `

  const f = (key) => (e) => setForm(p => ({ ...p, [key]: e.target.value }))

  return (
    <>
      <style>{CSS}</style>
      <div className="adm-mp">
        <div className="adm-mp-head">
          <div>
            <div className="adm-mp-title">Marketplace</div>
            <div style={{ fontSize: 12, color: 'var(--tx-3)', marginTop: 3 }}>{apps.filter(a => a.active).length} apps actives · {apps.length} au total</div>
          </div>
          <button className="adm-mp-add" onClick={openAdd}>
            <Plus size={14} /> Ajouter une app
          </button>
        </div>

        <div className="adm-mp-section">Apps publiées</div>
        {apps.map(app => (
          <div key={app.id} className={`adm-app-row ${!app.active ? 'adm-inactive' : ''}`}>
            <div className="adm-app-icon">{app.icon}</div>
            <div className="adm-app-info">
              <div className="adm-app-name">{app.name}</div>
              <div className="adm-app-tag">{app.category} · {app.app_type}</div>
            </div>
            <div className="adm-app-badges">
              <span className="adm-app-price">{app.price_from} DT</span>
              <span className={`adm-owner-badge adm-owner-${app.owner_type}`}>
                {app.owner_type === 'walaup' ? '🔵 Walaup' : '🟡 Partenaire'}
              </span>
            </div>
            <div className="adm-app-actions">
              <button className="adm-act-btn" onClick={() => openEdit(app)} title="Modifier">
                <Edit2 size={13} />
              </button>
              <button className="adm-act-btn" onClick={() => toggleActive(app.id)} title={app.active ? 'Désactiver' : 'Activer'}>
                {app.active ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            </div>
          </div>
        ))}

        <div className="adm-mp-section">Apps en développement — Placeholders</div>
        <div className="adm-pl-grid">
          {PLACEHOLDER_APPS.map(pl => (
            <div key={pl.id} className="adm-pl-card">
              <div className="adm-pl-icon">{pl.icon}</div>
              <div className="adm-pl-name">{pl.name}</div>
              <div className="adm-pl-status">{pl.status}</div>
              <div className="adm-pl-eta">ETA : {pl.eta}</div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="adm-mpo" onClick={() => setShowModal(false)}>
          <div className="adm-mpc" onClick={e => e.stopPropagation()}>
            <div className="adm-mpc-head">
              <div className="adm-mpc-title">{editApp ? 'Modifier l\'app' : 'Ajouter une app'}</div>
              <button className="adm-mpc-close" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>

            <div className="adm-mpc-note">📌 Upload thumbnail — intégration Supabase Storage à connecter en prod</div>

            <div className="adm-form-2col">
              <div className="adm-form-row">
                <label className="adm-form-label">Icône (emoji)</label>
                <input className="adm-form-inp" value={form.icon} onChange={f('icon')} style={{ fontSize: 20 }} />
              </div>
              <div className="adm-form-row">
                <label className="adm-form-label">Prix depuis (DT)</label>
                <input className="adm-form-inp" type="number" value={form.price_from} onChange={f('price_from')} placeholder="299" />
              </div>
            </div>

            <div className="adm-form-row">
              <label className="adm-form-label">Nom de l'application</label>
              <input className="adm-form-inp" value={form.name} onChange={f('name')} placeholder="App Café & Restaurant" />
            </div>

            <div className="adm-form-row">
              <label className="adm-form-label">Tagline</label>
              <input className="adm-form-inp" value={form.tagline} onChange={f('tagline')} placeholder="Gérez votre café comme un pro" />
            </div>

            <div className="adm-form-row">
              <label className="adm-form-label">Description</label>
              <textarea className="adm-form-inp" rows={2} value={form.description} onChange={f('description')} placeholder="Fonctionnalités clés..." />
            </div>

            <div className="adm-form-2col">
              <div className="adm-form-row">
                <label className="adm-form-label">Catégorie</label>
                <select className="adm-form-inp adm-form-sel" value={form.category} onChange={f('category')}>
                  {['Restaurant', 'Retail', 'Services', 'Médical', 'Education', 'Livraison'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="adm-form-row">
                <label className="adm-form-label">Type app</label>
                <input className="adm-form-inp" value={form.app_type} onChange={f('app_type')} placeholder="caisse / medical / stock" />
              </div>
            </div>

            <div className="adm-form-2col">
              <div className="adm-form-row">
                <label className="adm-form-label">Type propriétaire</label>
                <select className="adm-form-inp adm-form-sel" value={form.owner_type} onChange={f('owner_type')}>
                  <option value="walaup">🔵 Walaup</option>
                  <option value="partner">🟡 Partenaire</option>
                </select>
              </div>
              <div className="adm-form-row">
                <label className="adm-form-label">URL démo</label>
                <input className="adm-form-inp" value={form.demo_url} onChange={f('demo_url')} placeholder="https://..." />
              </div>
            </div>

            <button className="adm-mpc-save" onClick={handleSave}>
              {editApp ? 'Enregistrer les modifications' : 'Ajouter l\'application'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
