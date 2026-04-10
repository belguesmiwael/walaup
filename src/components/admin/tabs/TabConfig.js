'use client'
import { useState, useEffect } from 'react'
import { Save, Plus, Trash2, CheckCircle2, Eye, EyeOff } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const GATEWAYS_DEFAULT = [
  { id: 'flouci',  name: 'Flouci',  emoji: '📱', desc: 'Mobile wallet tunisien', enabled: true  },
  { id: 'konnect', name: 'Konnect', emoji: '💳', desc: 'Visa/Mastercard',         enabled: true  },
  { id: 'd17',     name: 'D17',     emoji: '📲', desc: 'Mobile payment',          enabled: false },
]

const DEFAULT_FEATURES = [
  { id: 'f1', group: 'Base',          name: 'Caisse',             icon: '💰', price: 0,   days: 0 },
  { id: 'f2', group: 'Base',          name: 'Gestion Stock',      icon: '📦', price: 50,  days: 2 },
  { id: 'f3', group: 'Base',          name: 'Fiches Clients',     icon: '👥', price: 40,  days: 1 },
  { id: 'f4', group: 'Communication', name: 'Notifications SMS',  icon: '🔔', price: 80,  days: 1 },
  { id: 'f5', group: 'Communication', name: 'Email auto',         icon: '📧', price: 60,  days: 1 },
  { id: 'f6', group: 'Reporting',     name: 'Rapports CA',        icon: '📊', price: 70,  days: 2 },
  { id: 'f7', group: 'Reporting',     name: 'Export Excel',       icon: '📑', price: 40,  days: 1 },
  { id: 'f8', group: 'Avancé',        name: 'Multi-utilisateurs', icon: '🧑‍🤝‍🧑', price: 100, days: 2 },
  { id: 'f9', group: 'Avancé',        name: 'API publique',       icon: '🔌', price: 150, days: 3 },
]

const DEFAULT_TARIFS = {
  essentiel:  { annual: 300, renewal: 280 },
  pro:        { annual: 600, renewal: 550, monthly: 40, monetization_extra: 20 },
  partenaire: { one_time: 1500, monthly_support: 80 },
  commission_walaup: 40,
}

const DEFAULT_GENERAL = {
  agence: 'Walaup', email: 'contact@walaup.tn', phone: '+216 XX XXX XXX',
  delivery_label: '48h', welcome_text: 'Bienvenue sur votre espace Walaup !'
}

function SaveBtn({ onClick, saved, loading }) {
  const sBtn = {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '7px 16px', borderRadius: 9,
    background: saved ? 'linear-gradient(135deg,#10B981,#059669)' : 'linear-gradient(135deg,#6366F1,#8B5CF6)',
    border: 'none', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer',
    marginTop: 14, transition: 'transform 150ms', opacity: loading ? 0.7 : 1,
  }
  return (
    <button style={sBtn} onClick={onClick} disabled={loading}>
      {saved ? <><CheckCircle2 size={13} /> Enregistré</> : <><Save size={13} /> Enregistrer</>}
    </button>
  )
}

export default function TabConfig() {
  const [tarifs, setTarifs]   = useState(DEFAULT_TARIFS)
  const [features, setFeatures] = useState(DEFAULT_FEATURES)
  const [gateways, setGateways] = useState(GATEWAYS_DEFAULT)
  const [general, setGeneral]   = useState(DEFAULT_GENERAL)
  const [showKeys, setShowKeys] = useState({})
  const [saved, setSaved]       = useState({})
  const [saving, setSaving]     = useState({})
  const [loaded, setLoaded]     = useState(false)

  // Load config from Supabase
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('config').select('key, value')
      if (!data) return
      const cfg = {}
      data.forEach(row => { cfg[row.key] = row.value })
      if (cfg.tarifs)   setTarifs(cfg.tarifs)
      if (cfg.features) setFeatures(cfg.features)
      if (cfg.gateways) setGateways(cfg.gateways)
      if (cfg.general)  setGeneral(cfg.general)
      setLoaded(true)
    }
    load()
  }, [])

  const doSave = async (key, value) => {
    setSaving(p => ({ ...p, [key]: true }))
    await supabase.from('config').upsert([{ key, value }], { onConflict: 'key' })
    setSaving(p => ({ ...p, [key]: false }))
    setSaved(p => ({ ...p, [key]: true }))
    setTimeout(() => setSaved(p => ({ ...p, [key]: false })), 2500)
  }

  const setT = (pack, field) => (e) => {
    const v = parseFloat(e.target.value) || 0
    setTarifs(p => ({ ...p, [pack]: { ...p[pack], [field]: v } }))
  }

  const toggleGw = (id) => {
    setGateways(prev => prev.map(g => g.id === id ? { ...g, enabled: !g.enabled } : g))
  }

  const addFeature = () => {
    setFeatures(prev => [...prev, { id: Date.now().toString(), group: 'Base', name: 'Nouvelle feature', icon: '⭐', price: 0, days: 1 }])
  }
  const removeFeature = (id) => setFeatures(prev => prev.filter(f => f.id !== id))

  const commissionPartner = 100 - tarifs.commission_walaup
  const examplePrice = 299
  const partnerGets = Math.round(examplePrice * commissionPartner / 100)
  const walaupGets = examplePrice - partnerGets

  const CSS = `
    .adm-cfg { padding:24px; overflow-y:auto; height:100%; }
    .adm-cfg::-webkit-scrollbar { width:4px; }
    .adm-cfg::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:4px; }
    .adm-cfg-title { font-family:'Space Grotesk',sans-serif; font-weight:800; font-size:20px; color:var(--tx); margin-bottom:20px; }
    .adm-cfg-section { background:rgba(13,17,32,0.7); border:1px solid rgba(255,255,255,0.08); border-radius:14px; padding:20px; margin-bottom:16px; backdrop-filter:blur(10px); }
    .adm-cfg-sec-title { font-family:'Space Grotesk',sans-serif; font-weight:700; font-size:14px; color:var(--tx); margin-bottom:16px; padding-bottom:10px; border-bottom:1px solid rgba(255,255,255,0.06); }
    .adm-cfg-2col { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
    .adm-cfg-3col { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; }
    @media(max-width:600px){ .adm-cfg-2col,.adm-cfg-3col { grid-template-columns:1fr; } }
    .adm-cfg-field { display:flex; flex-direction:column; gap:5px; }
    .adm-cfg-label { font-size:10px; font-weight:700; color:var(--tx-3); letter-spacing:.07em; text-transform:uppercase; }
    .adm-cfg-inp { background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:9px; padding:8px 11px; color:var(--tx); font-size:13px; outline:none; font-family:'JetBrains Mono',monospace; }
    .adm-cfg-inp:focus { border-color:rgba(99,102,241,0.4); }
    .adm-cfg-inp-text { font-family:'Inter',sans-serif; }
    .adm-cfg-unit { font-size:11px; color:var(--tx-3); margin-top:2px; }
    .adm-cfg-preview { margin-top:12px; padding:10px 14px; border-radius:10px; background:rgba(99,102,241,0.08); border:1px solid rgba(99,102,241,0.2); font-size:12px; color:var(--tx-2); }
    .adm-feat-head { display:grid; grid-template-columns:36px 1fr 1fr 80px 70px 32px; gap:8px; padding:0 0 8px; border-bottom:1px solid rgba(255,255,255,0.06); }
    .adm-feat-col-label { font-size:9px; font-weight:700; color:var(--tx-3); letter-spacing:.07em; text-transform:uppercase; }
    .adm-feat-row { display:grid; grid-template-columns:36px 1fr 1fr 80px 70px 32px; gap:8px; align-items:center; padding:8px 0; border-bottom:1px solid rgba(255,255,255,0.04); }
    .adm-feat-row:last-child { border-bottom:none; }
    .adm-feat-icon-inp { width:36px; text-align:center; font-size:18px; background:transparent; border:none; outline:none; cursor:pointer; }
    .adm-feat-inp-sm { background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09); border-radius:7px; padding:5px 8px; color:var(--tx); font-size:12px; outline:none; width:100%; font-family:'Inter',sans-serif; }
    .adm-feat-num { font-family:'JetBrains Mono',monospace; }
    .adm-feat-rm { width:28px; height:28px; border-radius:7px; border:none; background:rgba(248,113,113,0.1); color:#F87171; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all 150ms; }
    .adm-feat-rm:hover { background:rgba(248,113,113,0.2); }
    .adm-feat-add { display:flex; align-items:center; gap:6px; padding:6px 14px; border-radius:8px; border:1px dashed rgba(255,255,255,0.15); background:transparent; color:var(--tx-2); font-size:12px; cursor:pointer; margin-top:10px; transition:all 150ms; }
    .adm-feat-add:hover { border-color:rgba(99,102,241,0.4); color:var(--ac); }
    .adm-gw-card { display:flex; align-items:center; gap:14px; padding:14px; border-radius:11px; border:1px solid rgba(255,255,255,0.08); margin-bottom:8px; background:rgba(255,255,255,0.02); }
    .adm-gw-icon { font-size:22px; }
    .adm-gw-info { flex:1; }
    .adm-gw-name { font-size:13px; font-weight:700; color:var(--tx); margin-bottom:2px; }
    .adm-gw-desc { font-size:11px; color:var(--tx-3); }
    .adm-gw-toggle { width:40px; height:22px; border-radius:11px; border:none; cursor:pointer; position:relative; transition:background 200ms; flex-shrink:0; }
    .adm-gw-dot { width:16px; height:16px; border-radius:50%; background:#fff; position:absolute; top:3px; transition:left 200ms; box-shadow:0 1px 4px rgba(0,0,0,0.3); }
    .adm-gw-key-row { display:flex; gap:8px; align-items:center; margin-top:8px; }
    .adm-gw-key-inp { flex:1; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:8px; padding:6px 10px; color:var(--tx-3); font-size:11px; font-family:'JetBrains Mono',monospace; outline:none; }
    .adm-gw-eye { width:28px; height:28px; border-radius:7px; border:none; background:rgba(255,255,255,0.05); color:var(--tx-3); cursor:pointer; display:flex; align-items:center; justify-content:center; }
    .adm-not-loaded { padding:40px; text-align:center; color:var(--tx-3); font-size:13px; }
  `

  return (
    <>
      <style>{CSS}</style>
      <div className="adm-cfg">
        <div className="adm-cfg-title">Configuration</div>

        {/* Tarifs packs */}
        <div className="adm-cfg-section">
          <div className="adm-cfg-sec-title">Tarifs packs</div>
          <div className="adm-cfg-2col" style=marginBottom: 14>
            <div className="adm-cfg-field">
              <label className="adm-cfg-label">Essentiel — Achat annuel</label>
              <input className="adm-cfg-inp" type="number" value={tarifs.essentiel?.annual || ''} onChange={setT('essentiel','annual')} />
              <span className="adm-cfg-unit">DT / an</span>
            </div>
            <div className="adm-cfg-field">
              <label className="adm-cfg-label">Essentiel — Renouvellement</label>
              <input className="adm-cfg-inp" type="number" value={tarifs.essentiel?.renewal || ''} onChange={setT('essentiel','renewal')} />
              <span className="adm-cfg-unit">DT / an</span>
            </div>
            <div className="adm-cfg-field">
              <label className="adm-cfg-label">Pro — Achat annuel</label>
              <input className="adm-cfg-inp" type="number" value={tarifs.pro?.annual || ''} onChange={setT('pro','annual')} />
            </div>
            <div className="adm-cfg-field">
              <label className="adm-cfg-label">Pro — Mensuel</label>
              <input className="adm-cfg-inp" type="number" value={tarifs.pro?.monthly || ''} onChange={setT('pro','monthly')} />
              <span className="adm-cfg-unit">DT / mois</span>
            </div>
            <div className="adm-cfg-field">
              <label className="adm-cfg-label">Partenaire — Achat unique</label>
              <input className="adm-cfg-inp" type="number" value={tarifs.partenaire?.one_time || ''} onChange={setT('partenaire','one_time')} />
              <span className="adm-cfg-unit">DT — one-time</span>
            </div>
            <div className="adm-cfg-field">
              <label className="adm-cfg-label">Partenaire — Support mensuel</label>
              <input className="adm-cfg-inp" type="number" value={tarifs.partenaire?.monthly_support || ''} onChange={setT('partenaire','monthly_support')} />
              <span className="adm-cfg-unit">DT / mois</span>
            </div>
          </div>
          <SaveBtn onClick={() => doSave('tarifs', tarifs)} saved={saved.tarifs} loading={saving.tarifs} />
        </div>

        {/* Commission marketplace */}
        <div className="adm-cfg-section">
          <div className="adm-cfg-sec-title">Commission Marketplace</div>
          <div className="adm-cfg-2col">
            <div className="adm-cfg-field">
              <label className="adm-cfg-label">Commission Walaup (%)</label>
              <input className="adm-cfg-inp" type="number" min="0" max="100"
                value={tarifs.commission_walaup}
                onChange={e => setTarifs(p => ({ ...p, commission_walaup: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <div className="adm-cfg-field">
              <label className="adm-cfg-label">Part Partenaire (%)</label>
              <input className="adm-cfg-inp" value={commissionPartner} readOnly style=color: 'var(--tx-3)' />
              <span className="adm-cfg-unit">Calculé automatiquement</span>
            </div>
          </div>
          <div className="adm-cfg-preview">
            Pour une app vendue <strong>{examplePrice} DT</strong> :
            Partenaire reçoit <strong>{partnerGets} DT ({commissionPartner}%)</strong>,
            Walaup <strong>{walaupGets} DT ({tarifs.commission_walaup}%)</strong>
          </div>
          <SaveBtn onClick={() => doSave('tarifs', tarifs)} saved={saved.tarifs} loading={saving.tarifs} />
        </div>

        {/* Features estimateur */}
        <div className="adm-cfg-section">
          <div className="adm-cfg-sec-title">Fonctionnalités estimateur</div>
          <div className="adm-feat-head">
            <span className="adm-feat-col-label">Ico</span>
            <span className="adm-feat-col-label">Nom</span>
            <span className="adm-feat-col-label">Groupe</span>
            <span className="adm-feat-col-label">Prix (DT)</span>
            <span className="adm-feat-col-label">Délai (j)</span>
            <span />
          </div>
          {features.map(feat => (
            <div key={feat.id} className="adm-feat-row">
              <input className="adm-feat-icon-inp" value={feat.icon}
                onChange={e => setFeatures(p => p.map(f => f.id === feat.id ? { ...f, icon: e.target.value } : f))} />
              <input className="adm-feat-inp-sm" value={feat.name}
                onChange={e => setFeatures(p => p.map(f => f.id === feat.id ? { ...f, name: e.target.value } : f))} />
              <input className="adm-feat-inp-sm" value={feat.group}
                onChange={e => setFeatures(p => p.map(f => f.id === feat.id ? { ...f, group: e.target.value } : f))} />
              <input className="adm-feat-inp-sm adm-feat-num" type="number" value={feat.price}
                onChange={e => setFeatures(p => p.map(f => f.id === feat.id ? { ...f, price: parseInt(e.target.value) || 0 } : f))} />
              <input className="adm-feat-inp-sm adm-feat-num" type="number" value={feat.days}
                onChange={e => setFeatures(p => p.map(f => f.id === feat.id ? { ...f, days: parseInt(e.target.value) || 0 } : f))} />
              <button className="adm-feat-rm" onClick={() => removeFeature(feat.id)}><Trash2 size={12} /></button>
            </div>
          ))}
          <button className="adm-feat-add" onClick={addFeature}><Plus size={12} /> Ajouter une fonctionnalité</button>
          <SaveBtn onClick={() => doSave('features', features)} saved={saved.features} loading={saving.features} />
        </div>

        {/* Gateways paiement */}
        <div className="adm-cfg-section">
          <div className="adm-cfg-sec-title">Passerelles de paiement</div>
          {gateways.map(gw => (
            <div key={gw.id} className="adm-gw-card">
              <span className="adm-gw-icon">{gw.emoji}</span>
              <div className="adm-gw-info">
                <div className="adm-gw-name">{gw.name}</div>
                <div className="adm-gw-desc">{gw.desc}</div>
                <div className="adm-gw-key-row">
                  <input
                    className="adm-gw-key-inp"
                    type={showKeys[gw.id] ? 'text' : 'password'}
                    placeholder={`Clé API ${gw.name}…`}
                    defaultValue=""
                  />
                  <button className="adm-gw-eye" onClick={() => setShowKeys(p => ({ ...p, [gw.id]: !p[gw.id] }))}>
                    {showKeys[gw.id] ? <EyeOff size={12} /> : <Eye size={12} />}
                  </button>
                </div>
                <div style=fontSize: 10, color: 'var(--tx-3)', marginTop: 4>
                  Webhook : https://walaup.vercel.app/api/webhooks/{gw.id}
                </div>
              </div>
              <button
                className="adm-gw-toggle"
                style=background: gw.enabled ? 'linear-gradient(90deg,#6366F1,#8B5CF6)' : 'rgba(255,255,255,0.1)'
                onClick={() => toggleGw(gw.id)}
              >
                <div className="adm-gw-dot" style=left: gw.enabled ? 21 : 3 />
              </button>
            </div>
          ))}
          <SaveBtn onClick={() => doSave('gateways', gateways)} saved={saved.gateways} loading={saving.gateways} />
        </div>

        {/* Général */}
        <div className="adm-cfg-section">
          <div className="adm-cfg-sec-title">Informations générales</div>
          <div className="adm-cfg-2col">
            {[{ key: 'agence', label: 'Nom agence' }, { key: 'email', label: 'Email contact' }, { key: 'phone', label: 'Téléphone' }, { key: 'delivery_label', label: 'Délai livraison démo' }].map(({ key, label }) => (
              <div key={key} className="adm-cfg-field">
                <label className="adm-cfg-label">{label}</label>
                <input className="adm-cfg-inp adm-cfg-inp-text" value={general[key] || ''}
                  onChange={e => setGeneral(p => ({ ...p, [key]: e.target.value }))} />
              </div>
            ))}
          </div>
          <div className="adm-cfg-field" style=marginTop: 14>
            <label className="adm-cfg-label">Texte d'accueil espace client</label>
            <textarea className="adm-cfg-inp adm-cfg-inp-text" rows={2} value={general.welcome_text || ''}
              onChange={e => setGeneral(p => ({ ...p, welcome_text: e.target.value }))} />
          </div>
          <SaveBtn onClick={() => doSave('general', general)} saved={saved.general} loading={saving.general} />
        </div>
      </div>
    </>
  )
}
