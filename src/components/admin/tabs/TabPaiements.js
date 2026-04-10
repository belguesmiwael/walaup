'use client'
import { useState, useEffect } from 'react'
import { Plus, Edit2, Eye, EyeOff, Trash2, ExternalLink, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const EMPTY_FORM = {
  name: '', tagline: '', description: '', category: 'Restaurant', app_type: '',
  price_from: '', demo_url: '', owner_type: 'walaup', active: true, icon: '📱',
  sort_order: 0,
}

export default function TabMarketplace() {
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editApp, setEditApp] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)

  const fetchApps = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('marketplace_apps')
      .select('*')
      .order('sort_order', { ascending: true })
    setApps(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchApps()
    const ch = supabase.channel('admin-marketplace')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'marketplace_apps' }, fetchApps)
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [])

  const openAdd = () => {
    setForm({ ...EMPTY_FORM, sort_order: apps.length + 1 })
    setEditApp(null)
    setShowModal(true)
    setMsg(null)
  }

  const openEdit = (app) => {
    setForm({ ...app, price_from: String(app.price_from || '') })
    setEditApp(app)
    setShowModal(true)
    setMsg(null)
  }

  const toggleActive = async (app) => {
    await supabase.from('marketplace_apps').update({ active: !app.active }).eq('id', app.id)
    fetchApps()
  }

  const handleDelete = async (app) => {
    if (!confirm(`Supprimer "${app.name}" ?`)) return
    await supabase.from('marketplace_apps').delete().eq('id', app.id)
    fetchApps()
  }

  const handleSave = async () => {
    if (!form.name.trim()) return setMsg({ type: 'error', text: 'Le nom est requis.' })
    setSaving(true)
    setMsg(null)
    const payload = {
      ...form,
      price_from: parseFloat(form.price_from) || 0,
      sort_order: parseInt(form.sort_order) || 0,
    }
    let error
    if (editApp) {
      ;({ error } = await supabase.from('marketplace_apps').update(payload).eq('id', editApp.id))
    } else {
      const { id, ...rest } = payload
      ;({ error } = await supabase.from('marketplace_apps').insert([rest]))
    }
    setSaving(false)
    if (error) return setMsg({ type: 'error', text: error.message })
    setMsg({ type: 'success', text: editApp ? 'App modifiée !' : 'App ajoutée !' })
    setTimeout(() => { setShowModal(false); fetchApps() }, 900)
  }

  const CSS = `
    .adm-mp { padding:24px; overflow-y:auto; height:100%; }
    .adm-mp::-webkit-scrollbar { width:4px; }
    .adm-mp::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:4px; }
    .adm-mp-head { display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; flex-wrap:wrap; gap:10px; }
    .adm-mp-title { font-family:'Space Grotesk',sans-serif; font-weight:800; font-size:20px; color:var(--tx); }
    .adm-mp-sub { font-size:12px; color:var(--tx-3); margin-top:2px; }
    .adm-mp-actions { display:flex; gap:8px; }
    .adm-mp-add { display:flex; align-items:center; gap:6px; padding:8px 16px; border-radius:10px; background:linear-gradient(135deg,#6366F1,#8B5CF6); border:none; color:#fff; font-size:12px; font-weight:700; cursor:pointer; transition:transform 150ms; font-family:'Space Grotesk',sans-serif; }
    .adm-mp-add:hover { transform:scale(1.03); }
    .adm-mp-section { font-size:11px; font-weight:700; color:var(--tx-3); letter-spacing:.08em; text-transform:uppercase; margin-bottom:12px; margin-top:20px; }
    .adm-app-row { display:flex; align-items:center; gap:12px; padding:14px 16px; border-radius:12px; background:rgba(13,17,32,0.7); border:1px solid rgba(255,255,255,0.07); margin-bottom:8px; backdrop-filter:blur(8px); transition:border-color 180ms; }
    .adm-app-row:hover { border-color:rgba(99,102,241,0.2); }
    .adm-app-icon { width:42px; height:42px; border-radius:12px; background:rgba(99,102,241,0.12); display:flex; align-items:center; justify-content:center; font-size:20px; flex-shrink:0; }
    .adm-app-info { flex:1; min-width:0; }
    .adm-app-name { font-weight:700; font-size:13px; color:var(--tx); margin-bottom:2px; }
    .adm-app-tag { font-size:11px; color:var(--tx-3); }
    .adm-app-price { font-family:'JetBrains Mono',monospace; font-size:13px; font-weight:700; color:var(--gold); }
    .adm-app-actions { display:flex; gap:6px; }
    .adm-act-btn { width:30px; height:30px; border-radius:8px; border:1px solid rgba(255,255,255,0.09); background:rgba(255,255,255,0.04); display:flex; align-items:center; justify-content:center; cursor:pointer; color:var(--tx-2); transition:all 150ms; }
    .adm-act-btn:hover { background:rgba(99,102,241,0.12); border-color:rgba(99,102,241,0.3); color:var(--ac); }
    .adm-act-btn--danger:hover { background:rgba(248,113,113,0.12); border-color:rgba(248,113,113,0.3); color:#F87171; }
    .adm-inactive { opacity:.45; }
    .adm-mpo { position:fixed; inset:0; background:rgba(0,0,0,0.75); z-index:9000; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(4px); }
    .adm-mpc { background:#0D1120; border:1px solid rgba(255,255,255,0.12); border-radius:18px; padding:24px; width:520px; max-width:92vw; max-height:90vh; overflow-y:auto; box-shadow:0 24px 80px rgba(0,0,0,0.7); }
    .adm-mpc::-webkit-scrollbar { width:3px; }
    .adm-mpc::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:2px; }
    .adm-mpc-head { display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; }
    .adm-mpc-title { font-family:'Space Grotesk',sans-serif; font-weight:800; font-size:16px; color:var(--tx); }
    .adm-mpc-close { width:28px; height:28px; border-radius:8px; border:none; background:rgba(255,255,255,0.07); color:var(--tx-2); cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:16px; }
    .adm-form-label { font-size:11px; font-weight:600; color:var(--tx-3); letter-spacing:.06em; text-transform:uppercase; margin-bottom:6px; display:block; }
    .adm-form-row { margin-bottom:14px; }
    .adm-form-inp { width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:10px; padding:9px 12px; color:var(--tx); font-size:13px; outline:none; font-family:'Inter',sans-serif; box-sizing:border-box; }
    .adm-form-inp:focus { border-color:rgba(99,102,241,0.4); }
    .adm-form-2col { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
    .adm-form-toggle { display:flex; align-items:center; gap:8px; font-size:13px; color:var(--tx-2); cursor:pointer; }
    .adm-mpc-save { width:100%; padding:12px; border-radius:11px; background:linear-gradient(135deg,#6366F1,#8B5CF6); border:none; color:#fff; font-size:13px; font-weight:700; cursor:pointer; margin-top:6px; font-family:'Space Grotesk',sans-serif; transition:transform 150ms; }
    .adm-mpc-save:hover { transform:scale(1.02); }
    .adm-mpc-save:disabled { opacity:.6; cursor:not-allowed; transform:none; }
    .adm-form-msg { padding:8px 12px; border-radius:8px; font-size:12px; margin-bottom:12px; }
    .adm-form-msg--success { background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.3); color:#10B981; }
    .adm-form-msg--error { background:rgba(248,113,113,0.1); border:1px solid rgba(248,113,113,0.3); color:#F87171; }
    .adm-empty { padding:40px; text-align:center; color:var(--tx-3); font-size:13px; }
  `

  const f = (key) => (e) => setForm(p => ({ ...p, [key]: e.target.value }))

  return (
    <>
      <style>{CSS}</style>
      <div className="adm-mp">
        <div className="adm-mp-head">
          <div>
            <div className="adm-mp-title">Marketplace</div>
            <div className="adm-mp-sub">{apps.filter(a => a.active).length} apps actives · {apps.length} au total</div>
          </div>
          <div className="adm-mp-actions">
            <button className="adm-act-btn" onClick={fetchApps} title="Rafraîchir"><RefreshCw size={13} /></button>
            <button className="adm-mp-add" onClick={openAdd}><Plus size={13} /> Ajouter une app</button>
          </div>
        </div>

        <div className="adm-mp-section">Apps publiées</div>
        {loading ? (
          <div className="adm-empty">Chargement…</div>
        ) : apps.length === 0 ? (
          <div className="adm-empty">Aucune app. Ajoutez votre première application.</div>
        ) : apps.map(app => (
          <div key={app.id} className={`adm-app-row${!app.active ? ' adm-inactive' : ''}`}>
            <div className="adm-app-icon">{app.icon || '📱'}</div>
            <div className="adm-app-info">
              <div className="adm-app-name">{app.name}</div>
              <div className="adm-app-tag">{app.category} · {app.tagline}</div>
            </div>
            <div style= display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' >
              <span className="adm-app-price">{app.price_from} DT</span>
              <span style= padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, color: app.owner_type === 'walaup' ? '#6366F1' : '#F59E0B', background: app.owner_type === 'walaup' ? 'rgba(99,102,241,0.12)' : 'rgba(245,158,11,0.12)' >
                {app.owner_type === 'walaup' ? '🔵 Walaup' : '🟡 Partenaire'}
              </span>
              {app.demo_url && (
                <a href={app.demo_url} target="_blank" rel="noreferrer" className="adm-act-btn" title="Voir démo"><ExternalLink size={12} /></a>
              )}
            </div>
            <div className="adm-app-actions">
              <button className="adm-act-btn" onClick={() => openEdit(app)} title="Modifier"><Edit2 size={12} /></button>
              <button className="adm-act-btn" onClick={() => toggleActive(app)} title={app.active ? 'Désactiver' : 'Activer'}>
                {app.active ? <EyeOff size={12} /> : <Eye size={12} />}
              </button>
              <button className="adm-act-btn adm-act-btn--danger" onClick={() => handleDelete(app)} title="Supprimer"><Trash2 size={12} /></button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="adm-mpo" onClick={() => setShowModal(false)}>
          <div className="adm-mpc" onClick={e => e.stopPropagation()}>
            <div className="adm-mpc-head">
              <span className="adm-mpc-title">{editApp ? 'Modifier l\'app' : 'Ajouter une app'}</span>
              <button className="adm-mpc-close" onClick={() => setShowModal(false)}>×</button>
            </div>

            {msg && <div className={`adm-form-msg adm-form-msg--${msg.type}`}>{msg.text}</div>}

            <div className="adm-form-2col">
              <div className="adm-form-row">
                <label className="adm-form-label">Icône (emoji)</label>
                <input className="adm-form-inp" value={form.icon} onChange={f('icon')} style= fontSize: 20, textAlign: 'center'  />
              </div>
              <div className="adm-form-row">
                <label className="adm-form-label">Prix depuis (DT)</label>
                <input className="adm-form-inp" type="number" value={form.price_from} onChange={f('price_from')} />
              </div>
            </div>

            <div className="adm-form-row">
              <label className="adm-form-label">Nom de l'application *</label>
              <input className="adm-form-inp" value={form.name} onChange={f('name')} placeholder="Ex: App Café & Restaurant" />
            </div>
            <div className="adm-form-row">
              <label className="adm-form-label">Tagline</label>
              <input className="adm-form-inp" value={form.tagline} onChange={f('tagline')} placeholder="Courte description" />
            </div>
            <div className="adm-form-row">
              <label className="adm-form-label">Description</label>
              <textarea className="adm-form-inp" rows={3} value={form.description} onChange={f('description')} placeholder="Fonctionnalités clés…" />
            </div>

            <div className="adm-form-2col">
              <div className="adm-form-row">
                <label className="adm-form-label">Catégorie</label>
                <select className="adm-form-inp" value={form.category} onChange={f('category')}>
                  {['Restaurant', 'Retail', 'Services', 'Médical', 'Education', 'Livraison', 'Autre'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="adm-form-row">
                <label className="adm-form-label">Type propriétaire</label>
                <select className="adm-form-inp" value={form.owner_type} onChange={f('owner_type')}>
                  <option value="walaup">🔵 Walaup</option>
                  <option value="partner">🟡 Partenaire</option>
                </select>
              </div>
            </div>

            <div className="adm-form-row">
              <label className="adm-form-label">URL démo</label>
              <input className="adm-form-inp" value={form.demo_url} onChange={f('demo_url')} placeholder="https://demo.walaup.tn/…" />
            </div>

            <div className="adm-form-row">
              <label className="adm-form-toggle">
                <input type="checkbox" checked={form.active} onChange={e => setForm(p => ({ ...p, active: e.target.checked }))} />
                Visible dans la marketplace
              </label>
            </div>

            <button className="adm-mpc-save" onClick={handleSave} disabled={saving}>
              {saving ? 'Enregistrement…' : editApp ? 'Enregistrer les modifications' : 'Ajouter l\'application'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
