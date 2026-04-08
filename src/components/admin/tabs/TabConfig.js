'use client'
import { useState } from 'react'
import { WalaupSound } from '@/lib/sound'
import { Save, Plus, Trash2, CheckCircle2, Eye, EyeOff } from 'lucide-react'

const INIT_TARIFS = {
  essentiel: { annual: 300, renewal: 280 },
  pro:       { annual: 600, renewal: 550, monthly: 40, monetization_extra: 20 },
  partenaire:{ one_time: 1500, monthly_support: 80 },
  commission_walaup: 40,
}

const INIT_FEATURES = [
  { id: 'f1', group: 'Base',          name: 'Caisse',            icon: '💰', price: 0,   days: 0 },
  { id: 'f2', group: 'Base',          name: 'Gestion Stock',     icon: '📦', price: 50,  days: 2 },
  { id: 'f3', group: 'Base',          name: 'Fiches Clients',    icon: '👥', price: 40,  days: 1 },
  { id: 'f4', group: 'Communication', name: 'Notifications SMS', icon: '🔔', price: 80,  days: 1 },
  { id: 'f5', group: 'Communication', name: 'Email auto',        icon: '📧', price: 60,  days: 1 },
  { id: 'f6', group: 'Reporting',     name: 'Rapports CA',       icon: '📊', price: 70,  days: 2 },
  { id: 'f7', group: 'Reporting',     name: 'Export Excel',      icon: '📑', price: 40,  days: 1 },
  { id: 'f8', group: 'Avancé',        name: 'Multi-utilisateurs',icon: '🧑‍🤝‍🧑', price: 100, days: 2 },
  { id: 'f9', group: 'Avancé',        name: 'API publique',      icon: '🔌', price: 150, days: 3 },
]

const GATEWAYS = [
  { id: 'flouci',   name: 'Flouci',   emoji: '📱', desc: 'Mobile wallet tunisien', enabled: true },
  { id: 'konnect',  name: 'Konnect',  emoji: '💳', desc: 'Visa/Mastercard', enabled: true },
  { id: 'd17',      name: 'D17',      emoji: '📲', desc: 'Mobile payment', enabled: false },
]

function SaveBtn({ onClick, saved }) {
  return (
    <button className="adm-cfg-save" onClick={onClick}>
      {saved ? <><CheckCircle2 size={14} /> Enregistré</> : <><Save size={14} /> Enregistrer</>}
    </button>
  )
}

function Section({ title, children }) {
  return (
    <div className="adm-cfg-section">
      <div className="adm-cfg-sec-title">{title}</div>
      {children}
    </div>
  )
}

export default function TabConfig() {
  const [tarifs, setTarifs] = useState(INIT_TARIFS)
  const [features, setFeatures] = useState(INIT_FEATURES)
  const [gateways, setGateways] = useState(GATEWAYS)
  const [showKeys, setShowKeys] = useState({})
  const [saved, setSaved] = useState({})
  const [general, setGeneral] = useState({
    agence: 'Walaup', email: 'contact@walaup.tn', phone: '+216 XX XXX XXX',
    delivery_label: '48h', welcome_text: 'Bienvenue sur votre espace Walaup !'
  })

  const doSave = (key) => {
    WalaupSound.success?.()
    setSaved(p => ({ ...p, [key]: true }))
    setTimeout(() => setSaved(p => ({ ...p, [key]: false })), 2500)
  }

  const setT = (pack, field) => (e) => {
    const v = parseFloat(e.target.value) || 0
    setTarifs(p => ({ ...p, [pack]: { ...p[pack], [field]: v } }))
  }

  const toggleGw = (id) => {
    setGateways(prev => prev.map(g => g.id === id ? { ...g, enabled: !g.enabled } : g))
    WalaupSound.toggle?.()
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
    .adm-cfg-title { font-family:'Space Grotesk',sans-serif; font-weight:800;
      font-size:20px; color:var(--tx); margin-bottom:20px; }

    .adm-cfg-section { background:rgba(13,17,32,0.7); border:1px solid rgba(255,255,255,0.08);
      border-radius:14px; padding:20px; margin-bottom:16px; backdrop-filter:blur(10px); }
    .adm-cfg-sec-title { font-family:'Space Grotesk',sans-serif; font-weight:700;
      font-size:14px; color:var(--tx); margin-bottom:16px;
      padding-bottom:10px; border-bottom:1px solid rgba(255,255,255,0.06); }

    .adm-cfg-grid { display:grid; gap:14px; }
    .adm-cfg-2col { grid-template-columns:1fr 1fr; }
    .adm-cfg-3col { grid-template-columns:repeat(3,1fr); }
    @media(max-width:600px){ .adm-cfg-2col, .adm-cfg-3col { grid-template-columns:1fr; } }

    .adm-cfg-field { display:flex; flex-direction:column; gap:5px; }
    .adm-cfg-label { font-size:10px; font-weight:700; color:var(--tx-3);
      letter-spacing:.07em; text-transform:uppercase; }
    .adm-cfg-inp { background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1);
      border-radius:9px; padding:8px 11px; color:var(--tx); font-size:13px; outline:none;
      font-family:'JetBrains Mono',monospace; }
    .adm-cfg-inp:focus { border-color:rgba(99,102,241,0.4); }
    .adm-cfg-inp-text { font-family:'Inter',sans-serif; }
    .adm-cfg-unit { font-size:11px; color:var(--tx-3); margin-top:2px; }

    .adm-cfg-save { display:flex; align-items:center; gap:6px; padding:7px 16px;
      border-radius:9px; background:linear-gradient(135deg,#6366F1,#8B5CF6); border:none;
      color:#fff; font-size:12px; font-weight:700; cursor:pointer; margin-top:14px;
      transition:transform 150ms; }
    .adm-cfg-save:hover { transform:scale(1.03); }
    .adm-cfg-save:active { transform:scale(0.97); }

    .adm-cfg-commission-preview { margin-top:12px; padding:10px 14px; border-radius:10px;
      background:rgba(99,102,241,0.08); border:1px solid rgba(99,102,241,0.2);
      font-size:12px; color:var(--tx-2); }
    .adm-cfg-commission-preview strong { color:var(--tx); }

    .adm-feat-row { display:grid; grid-template-columns:36px 1fr 1fr 80px 70px 32px;
      gap:8px; align-items:center; padding:8px 0;
      border-bottom:1px solid rgba(255,255,255,0.04); }
    .adm-feat-row:last-child { border-bottom:none; }
    .adm-feat-icon-inp { width:36px; text-align:center; font-size:18px;
      background:transparent; border:none; outline:none; cursor:pointer; }
    .adm-feat-inp-sm { background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09);
      border-radius:7px; padding:5px 8px; color:var(--tx); font-size:12px;
      outline:none; width:100%; font-family:'Inter',sans-serif; }
    .adm-feat-num { font-family:'JetBrains Mono',monospace; }
    .adm-feat-rm { width:28px; height:28px; border-radius:7px; border:none;
      background:rgba(248,113,113,0.1); color:#F87171; cursor:pointer;
      display:flex; align-items:center; justify-content:center; transition:all 150ms; }
    .adm-feat-rm:hover { background:rgba(248,113,113,0.2); }
    .adm-feat-add { display:flex; align-items:center; gap:6px; padding:6px 14px;
      border-radius:8px; border:1px dashed rgba(255,255,255,0.15); background:transparent;
      color:var(--tx-2); font-size:12px; cursor:pointer; margin-top:10px; transition:all 150ms; }
    .adm-feat-add:hover { border-color:rgba(99,102,241,0.4); color:var(--ac); }
    .adm-feat-head { display:grid; grid-template-columns:36px 1fr 1fr 80px 70px 32px;
      gap:8px; padding:0 0 8px; margin-bottom:2px; border-bottom:1px solid rgba(255,255,255,0.06); }
    .adm-feat-col-label { font-size:9px; font-weight:700; color:var(--tx-3);
      letter-spacing:.07em; text-transform:uppercase; }

    .adm-gw-card { display:flex; align-items:center; gap:14px; padding:14px;
      border-radius:11px; border:1px solid rgba(255,255,255,0.08); margin-bottom:8px;
      background:rgba(255,255,255,0.02); }
    .adm-gw-icon { font-size:22px; }
    .adm-gw-info { flex:1; }
    .adm-gw-name { font-size:13px; font-weight:700; color:var(--tx); margin-bottom:2px; }
    .adm-gw-desc { font-size:11px; color:var(--tx-3); }
    .adm-gw-toggle { width:40px; height:22px; border-radius:11px; border:none;
      cursor:pointer; position:relative; transition:background 200ms;
      flex-shrink:0; }
    .adm-gw-toggle--on  { background:linear-gradient(90deg,#6366F1,#8B5CF6); }
    .adm-gw-toggle--off { background:rgba(255,255,255,0.1); }
    .adm-gw-dot { width:16px; height:16px; border-radius:50%; background:#fff;
      position:absolute; top:3px; transition:left 200ms; box-shadow:0 1px 4px rgba(0,0,0,0.3); }
    .adm-gw-dot--on  { left:21px; }
    .adm-gw-dot--off { left:3px; }
    .adm-gw-key-row { display:flex; gap:8px; align-items:center; margin-top:8px; }
    .adm-gw-key-inp { flex:1; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08);
      border-radius:8px; padding:6px 10px; color:var(--tx-3); font-size:11px;
      font-family:'JetBrains Mono',monospace; outline:none; }
    .adm-gw-eye { width:28px; height:28px; border-radius:7px; border:none;
      background:rgba(255,255,255,0.05); color:var(--tx-3); cursor:pointer;
      display:flex; align-items:center; justify-content:center; }
    .adm-gw-note { font-size:11px; color:var(--tx-3); margin-top:6px; font-style:italic; }

    .adm-cfg-gen-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
    @media(max-width:600px){ .adm-cfg-gen-grid { grid-template-columns:1fr; } }
  `

  const groups = [...new Set(features.map(f => f.group))]

  return (
    <>
      <style>{CSS}</style>
      <div className="adm-cfg">
        <div className="adm-cfg-title">Configuration</div>

        {/* 6.1 — Tarifs packs */}
        <Section title="6.1 — Tarifs des Packs">
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--tx-2)', marginBottom: 10 }}>Pack Essentiel</div>
            <div className="adm-cfg-grid adm-cfg-2col">
              <div className="adm-cfg-field">
                <span className="adm-cfg-label">Achat annuel</span>
                <input className="adm-cfg-inp" type="number" value={tarifs.essentiel.annual} onChange={setT('essentiel','annual')} />
                <span className="adm-cfg-unit">DT / an</span>
              </div>
              <div className="adm-cfg-field">
                <span className="adm-cfg-label">Renouvellement annuel</span>
                <input className="adm-cfg-inp" type="number" value={tarifs.essentiel.renewal} onChange={setT('essentiel','renewal')} />
                <span className="adm-cfg-unit">DT / an</span>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ac)', marginBottom: 10 }}>Pack Pro ⭐</div>
            <div className="adm-cfg-grid adm-cfg-3col">
              <div className="adm-cfg-field">
                <span className="adm-cfg-label">Achat annuel</span>
                <input className="adm-cfg-inp" type="number" value={tarifs.pro.annual} onChange={setT('pro','annual')} />
                <span className="adm-cfg-unit">DT</span>
              </div>
              <div className="adm-cfg-field">
                <span className="adm-cfg-label">Renouvellement</span>
                <input className="adm-cfg-inp" type="number" value={tarifs.pro.renewal} onChange={setT('pro','renewal')} />
                <span className="adm-cfg-unit">DT / an</span>
              </div>
              <div className="adm-cfg-field">
                <span className="adm-cfg-label">Abonnement mensuel</span>
                <input className="adm-cfg-inp" type="number" value={tarifs.pro.monthly} onChange={setT('pro','monthly')} />
                <span className="adm-cfg-unit">DT / mois</span>
              </div>
              <div className="adm-cfg-field">
                <span className="adm-cfg-label">Supplément monétisation</span>
                <input className="adm-cfg-inp" type="number" value={tarifs.pro.monetization_extra} onChange={setT('pro','monetization_extra')} />
                <span className="adm-cfg-unit">DT / mois (si activé)</span>
              </div>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#F59E0B', marginBottom: 10 }}>Pack Partenaire 🌟</div>
            <div className="adm-cfg-grid adm-cfg-2col">
              <div className="adm-cfg-field">
                <span className="adm-cfg-label">Achat unique (à vie)</span>
                <input className="adm-cfg-inp" type="number" value={tarifs.partenaire.one_time} onChange={setT('partenaire','one_time')} />
                <span className="adm-cfg-unit">DT — one-time</span>
              </div>
              <div className="adm-cfg-field">
                <span className="adm-cfg-label">Support mensuel</span>
                <input className="adm-cfg-inp" type="number" value={tarifs.partenaire.monthly_support} onChange={setT('partenaire','monthly_support')} />
                <span className="adm-cfg-unit">DT / mois (résiliable)</span>
              </div>
            </div>
          </div>

          <SaveBtn onClick={() => doSave('tarifs')} saved={saved.tarifs} />
        </Section>

        {/* 6.2 — Commission marketplace */}
        <Section title="6.2 — Commission Marketplace">
          <div className="adm-cfg-grid adm-cfg-2col">
            <div className="adm-cfg-field">
              <span className="adm-cfg-label">Commission Walaup (%)</span>
              <input
                className="adm-cfg-inp" type="number" min={0} max={100}
                value={tarifs.commission_walaup}
                onChange={e => setTarifs(p => ({ ...p, commission_walaup: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <div className="adm-cfg-field">
              <span className="adm-cfg-label">Part Partenaire (%)</span>
              <input className="adm-cfg-inp" readOnly value={commissionPartner} style={{ color: 'var(--green)' }} />
              <span className="adm-cfg-unit">Calculé automatiquement</span>
            </div>
          </div>
          <div className="adm-cfg-commission-preview">
            Pour une app vendue <strong>{examplePrice} DT</strong> :
            Partenaire reçoit <strong style={{ color: 'var(--green)' }}>{partnerGets} DT ({commissionPartner}%)</strong>,
            Walaup <strong style={{ color: 'var(--ac)' }}>{walaupGets} DT ({tarifs.commission_walaup}%)</strong>
          </div>
          <SaveBtn onClick={() => doSave('commission')} saved={saved.commission} />
        </Section>

        {/* 6.4 — Features estimateur */}
        <Section title="6.4 — Fonctionnalités Estimateur">
          <div className="adm-feat-head">
            <span className="adm-feat-col-label">Icône</span>
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
                onChange={e => setFeatures(p => p.map(f => f.id === feat.id ? { ...f, price: parseInt(e.target.value)||0 } : f))} />
              <input className="adm-feat-inp-sm adm-feat-num" type="number" value={feat.days}
                onChange={e => setFeatures(p => p.map(f => f.id === feat.id ? { ...f, days: parseInt(e.target.value)||0 } : f))} />
              <button className="adm-feat-rm" onClick={() => removeFeature(feat.id)}>
                <Trash2 size={11} />
              </button>
            </div>
          ))}
          <button className="adm-feat-add" onClick={addFeature}>
            <Plus size={13} /> Ajouter une fonctionnalité
          </button>
          <SaveBtn onClick={() => doSave('features')} saved={saved.features} />
        </Section>

        {/* 6.5 — Gateways */}
        <Section title="6.5 — Passerelles de Paiement (Mock — à brancher en prod)">
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
                    placeholder={`Clé API ${gw.name}...`}
                    defaultValue="••••••••••••••••••••••••••••"
                  />
                  <button className="adm-gw-eye" onClick={() => setShowKeys(p => ({ ...p, [gw.id]: !p[gw.id] }))}>
                    {showKeys[gw.id] ? <EyeOff size={12} /> : <Eye size={12} />}
                  </button>
                </div>
                <div className="adm-gw-note">Webhook URL : https://walaup.vercel.app/api/webhooks/{gw.id}</div>
              </div>
              <button
                className={`adm-gw-toggle adm-gw-toggle--${gw.enabled ? 'on' : 'off'}`}
                onClick={() => toggleGw(gw.id)}
              >
                <div className={`adm-gw-dot adm-gw-dot--${gw.enabled ? 'on' : 'off'}`} />
              </button>
            </div>
          ))}
          <SaveBtn onClick={() => doSave('gateways')} saved={saved.gateways} />
        </Section>

        {/* 6.6 — Général */}
        <Section title="6.6 — Paramètres Généraux">
          <div className="adm-cfg-gen-grid">
            {[
              { key: 'agence', label: 'Nom agence' },
              { key: 'email', label: 'Email contact' },
              { key: 'phone', label: 'Téléphone' },
              { key: 'delivery_label', label: 'Délai livraison démo' },
            ].map(({ key, label }) => (
              <div key={key} className="adm-cfg-field">
                <span className="adm-cfg-label">{label}</span>
                <input
                  className="adm-cfg-inp adm-cfg-inp-text"
                  value={general[key]}
                  onChange={e => setGeneral(p => ({ ...p, [key]: e.target.value }))}
                />
              </div>
            ))}
          </div>
          <div className="adm-cfg-field" style={{ marginTop: 12 }}>
            <span className="adm-cfg-label">Texte d'accueil espace client</span>
            <textarea
              className="adm-cfg-inp adm-cfg-inp-text" rows={2}
              value={general.welcome_text}
              onChange={e => setGeneral(p => ({ ...p, welcome_text: e.target.value }))}
            />
          </div>
          <SaveBtn onClick={() => doSave('general')} saved={saved.general} />
        </Section>
      </div>
    </>
  )
}
