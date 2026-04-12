'use client'
import { useState, useEffect } from 'react'
import {
  Plus, Edit2, Eye, EyeOff, Trash2, ExternalLink,
  RefreshCw, X, Percent, Monitor, Layers
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { WalaupSound } from '@/lib/sound'

/* ─────────────────────────────────────────────────────────────────
   Constants
───────────────────────────────────────────────────────────────── */
const CATS = ['Restaurant','Retail','Services','Médical','Education','Livraison','Immobilier','Autre']

const EMPTY_FORM = {
  name: '', tagline: '', description: '',
  icon: '📱', category: 'Restaurant', app_type: '',
  price_from: '', owner_type: 'walaup',
  active: true, sort_order: 0,
  bg_image_url: '', thumbnail_url: '',
  discount_pct: '', discount_label: '', discount_expires_at: '',
  for_who: '',
  problems: [],
  features: [],
  demo_views: [],
  commission_partner_pct: '',
}

/* ─────────────────────────────────────────────────────────────────
   Secure helpers
───────────────────────────────────────────────────────────────── */
const sanitizeText = (v) => String(v || '').slice(0, 500)
const sanitizeURL  = (v) => {
  const s = String(v || '').trim().slice(0, 500)
  // Allow relative paths (/apps/...) and https URLs only
  if (s && !s.startsWith('/') && !s.startsWith('https://') && !s.startsWith('http://')) return ''
  return s
}
const sanitizeNum  = (v) => { const n = parseFloat(v); return isNaN(n) ? null : Math.max(0, n) }
const sanitizeInt  = (v) => { const n = parseInt(v);   return isNaN(n) ? 0 : Math.max(0, n) }

/* ─────────────────────────────────────────────────────────────────
   Static styles (outside component — no re-creation on render)
───────────────────────────────────────────────────────────────── */
const sAddBtn  = { display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:10, background:'linear-gradient(135deg,#6366F1,#8B5CF6)', border:'none', color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:"'Space Grotesk',sans-serif" }
const sMsgOk   = { padding:'8px 12px', borderRadius:8, fontSize:12, marginBottom:12, background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.3)', color:'#10B981' }
const sMsgErr  = { padding:'8px 12px', borderRadius:8, fontSize:12, marginBottom:12, background:'rgba(248,113,113,0.1)', border:'1px solid rgba(248,113,113,0.3)', color:'#F87171' }
const sSaveBtn = { width:'100%', padding:13, borderRadius:11, background:'linear-gradient(135deg,#6366F1,#8B5CF6)', border:'none', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', marginTop:20, fontFamily:"'Space Grotesk',sans-serif", boxShadow:'0 0 28px rgba(99,102,241,0.25)', transition:'opacity 150ms' }

/* ─────────────────────────────────────────────────────────────────
   CSS — scoped adm-mp- prefix
───────────────────────────────────────────────────────────────── */
const CSS = `
  /* ── Scrollable container ── */
  .adm-mp { padding:24px; overflow-y:auto; height:100%; box-sizing:border-box; }
  .adm-mp::-webkit-scrollbar { width:4px; }
  .adm-mp::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:4px; }

  /* ── Header ── */
  .adm-mp-head { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:24px; flex-wrap:wrap; gap:12px; }
  .adm-mp-title { font-family:'Space Grotesk',sans-serif; font-weight:800; font-size:20px; color:var(--tx); }
  .adm-mp-sub { font-size:12px; color:var(--tx-3); margin-top:3px; }
  .adm-mp-hactions { display:flex; gap:8px; align-items:center; }
  .adm-mp-section { font-size:10px; font-weight:700; color:var(--tx-3); letter-spacing:.10em; text-transform:uppercase; margin-bottom:10px; }
  .adm-mp-empty { padding:40px; text-align:center; color:var(--tx-3); font-size:13px; }

  /* ── App row ── */
  .adm-app-row { display:flex; align-items:center; gap:12px; padding:14px 16px; border-radius:14px; background:rgba(13,17,32,0.7); border:1px solid rgba(255,255,255,0.07); margin-bottom:8px; backdrop-filter:blur(8px); transition:border-color 180ms; }
  .adm-app-row:hover { border-color:rgba(99,102,241,0.22); }
  .adm-app-icon { width:44px; height:44px; border-radius:12px; background:rgba(99,102,241,0.12); border:1px solid rgba(99,102,241,0.18); display:flex; align-items:center; justify-content:center; font-size:20px; flex-shrink:0; overflow:hidden; }
  .adm-app-icon img { width:100%; height:100%; object-fit:cover; }
  .adm-app-info { flex:1; min-width:0; }
  .adm-app-name { font-weight:700; font-size:13px; color:var(--tx); margin-bottom:3px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .adm-app-meta { font-size:11px; color:var(--tx-3); margin-bottom:5px; }
  .adm-app-badges { display:flex; gap:5px; flex-wrap:wrap; }
  .adm-badge { padding:2px 7px; border-radius:20px; font-size:10px; font-weight:700; white-space:nowrap; }
  .adm-badge--walaup   { background:rgba(99,102,241,0.12); color:#818cf8; }
  .adm-badge--partner  { background:rgba(245,158,11,0.12);  color:#F59E0B; }
  .adm-badge--discount { background:rgba(16,185,129,0.12);  color:#10B981; }
  .adm-badge--views    { background:rgba(34,211,238,0.10);  color:#22d3ee; }
  .adm-app-price { font-family:'JetBrains Mono',monospace; font-size:13px; font-weight:700; color:var(--gold); white-space:nowrap; flex-shrink:0; }
  .adm-app-actions { display:flex; gap:6px; flex-shrink:0; }
  .adm-act-btn { width:30px; height:30px; border-radius:8px; border:1px solid rgba(255,255,255,0.09); background:rgba(255,255,255,0.04); display:flex; align-items:center; justify-content:center; cursor:pointer; color:var(--tx-2); transition:all 150ms; text-decoration:none; }
  .adm-act-btn:hover { background:rgba(99,102,241,0.12); border-color:rgba(99,102,241,0.3); color:var(--ac); }
  .adm-act-btn--danger:hover { background:rgba(248,113,113,0.12); border-color:rgba(248,113,113,0.3); color:#F87171; }
  .adm-inactive { opacity:.4; }

  /* ── Modal overlay ── */
  .adm-mpo { position:fixed; inset:0; background:rgba(0,0,0,0.82); z-index:9000; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(6px); padding:16px; }
  .adm-mpc { background:#0D1120; border:1px solid rgba(255,255,255,0.12); border-radius:20px; width:580px; max-width:100%; max-height:92vh; overflow:hidden; display:flex; flex-direction:column; box-shadow:0 24px 80px rgba(0,0,0,0.75); }
  .adm-mpc-hd { padding:20px 24px 14px; border-bottom:1px solid rgba(255,255,255,0.06); display:flex; justify-content:space-between; align-items:center; flex-shrink:0; }
  .adm-mpc-title { font-family:'Space Grotesk',sans-serif; font-weight:800; font-size:17px; color:var(--tx); }
  .adm-mpc-close { width:30px; height:30px; border-radius:8px; border:1px solid rgba(255,255,255,0.09); background:rgba(255,255,255,0.05); color:var(--tx-2); cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all 130ms; }
  .adm-mpc-close:hover { background:rgba(248,113,113,0.12); border-color:rgba(248,113,113,0.3); color:#F87171; }
  .adm-mpc-body { overflow-y:auto; flex:1; padding:20px 24px 24px; }
  .adm-mpc-body::-webkit-scrollbar { width:3px; }
  .adm-mpc-body::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:2px; }

  /* ── Section dividers ── */
  .adm-sec { margin-top:24px; }
  .adm-sec-hd { display:flex; align-items:center; gap:10px; margin-bottom:14px; }
  .adm-sec-line { flex:1; height:1px; background:rgba(255,255,255,0.07); }
  .adm-sec-lbl { font-size:10px; font-weight:700; color:var(--tx-3); letter-spacing:.08em; text-transform:uppercase; white-space:nowrap; }

  /* ── Form inputs ── */
  .adm-frow { margin-bottom:12px; }
  .adm-flabel { font-size:11px; font-weight:600; color:var(--tx-3); letter-spacing:.05em; text-transform:uppercase; margin-bottom:5px; display:block; }
  .adm-finp { width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09); border-radius:10px; padding:9px 12px; color:var(--tx); font-size:13px; outline:none; font-family:'Inter',sans-serif; box-sizing:border-box; transition:border-color 150ms, background 150ms; }
  .adm-finp:focus { border-color:rgba(99,102,241,0.45); background:rgba(99,102,241,0.04); }
  .adm-finp::placeholder { color:var(--tx-3); }
  .adm-f2col { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  .adm-f3col { display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; }
  .adm-fhint { font-size:10px; color:var(--tx-3); margin-top:4px; }
  .adm-ftoggle { display:flex; align-items:center; gap:8px; font-size:13px; color:var(--tx-2); cursor:pointer; user-select:none; }

  /* ── Dynamic list items ── */
  .adm-li { display:flex; gap:8px; align-items:flex-start; margin-bottom:7px; }
  .adm-li-inp { flex:1; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:9px; padding:8px 10px; color:var(--tx); font-size:12px; outline:none; font-family:'Inter',sans-serif; transition:border-color 140ms; }
  .adm-li-inp:focus { border-color:rgba(99,102,241,0.35); }
  .adm-li-inp::placeholder { color:var(--tx-3); }
  .adm-rm { width:28px; height:28px; border-radius:7px; border:1px solid rgba(248,113,113,0.25); background:rgba(248,113,113,0.07); color:#F87171; cursor:pointer; display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:all 120ms; margin-top:1px; }
  .adm-rm:hover { background:rgba(248,113,113,0.16); border-color:rgba(248,113,113,0.45); }
  .adm-add-item { display:flex; align-items:center; gap:6px; padding:7px 14px; border-radius:8px; border:1px dashed rgba(99,102,241,0.3); background:transparent; color:var(--ac); font-size:12px; font-weight:600; cursor:pointer; font-family:'Inter',sans-serif; transition:all 150ms; width:100%; justify-content:center; }
  .adm-add-item:hover { background:rgba(99,102,241,0.08); border-color:rgba(99,102,241,0.5); }

  /* ── Demo view card ── */
  .adm-dv-card { background:rgba(99,102,241,0.06); border:1px solid rgba(99,102,241,0.18); border-radius:12px; padding:13px; margin-bottom:10px; }
  .adm-dv-top { display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; }
  .adm-dv-num { font-size:10px; font-weight:700; color:var(--ac); letter-spacing:.06em; text-transform:uppercase; display:flex; align-items:center; gap:5px; }
  .adm-dv-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
  .adm-dv-full { grid-column:1/-1; }

  /* ── Image preview ── */
  .adm-img-prev { width:100%; height:88px; border-radius:9px; object-fit:cover; margin-top:6px; border:1px solid rgba(255,255,255,0.08); display:block; }

  @media(max-width:520px) {
    .adm-f3col { grid-template-columns:1fr 1fr; }
    .adm-dv-grid { grid-template-columns:1fr; }
    .adm-dv-full { grid-column:auto; }
  }
`

/* ─────────────────────────────────────────────────────────────────
   Component
───────────────────────────────────────────────────────────────── */
export default function TabMarketplace() {
  const [apps,      setApps]      = useState([])
  const [loading,   setLoading]   = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editApp,   setEditApp]   = useState(null)
  const [form,      setForm]      = useState(EMPTY_FORM)
  const [saving,    setSaving]    = useState(false)
  const [msg,       setMsg]       = useState(null) // { type: 'success'|'error', text }

  /* ── Fetch — client-side sort, no orderBy composite ── */
  const fetchApps = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('marketplace_apps').select('*')
    if (!error && data) {
      data.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
      setApps(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchApps()
    const ch = supabase.channel('adm-mkt-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'marketplace_apps' }, fetchApps)
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [])

  /* ── Modal open/close ── */
  const openAdd = () => {
    setForm({ ...EMPTY_FORM, sort_order: apps.length + 1 })
    setEditApp(null)
    setShowModal(true)
    setMsg(null)
  }

  const openEdit = (app) => {
    setForm({
      ...EMPTY_FORM,
      ...app,
      price_from:             String(app.price_from ?? ''),
      discount_pct:           String(app.discount_pct ?? ''),
      commission_partner_pct: String(app.commission_partner_pct ?? ''),
      // Date input requires YYYY-MM-DD
      discount_expires_at: app.discount_expires_at
        ? String(app.discount_expires_at).split('T')[0]
        : '',
      // Ensure arrays are never null
      problems:   Array.isArray(app.problems)   ? [...app.problems]                          : [],
      features:   Array.isArray(app.features)   ? app.features.map(f => ({ ...f }))          : [],
      demo_views: Array.isArray(app.demo_views) ? app.demo_views.map(v => ({ ...v }))        : [],
    })
    setEditApp(app)
    setShowModal(true)
    setMsg(null)
  }

  const closeModal = () => { setShowModal(false); setMsg(null) }

  /* ── Field updater ── */
  const f = (key) => (e) => setForm(p => ({ ...p, [key]: e.target.value }))

  /* ── Problems CRUD ── */
  const addProblem    = () => setForm(p => ({ ...p, problems: [...p.problems, ''] }))
  const editProblem   = (i, v) => setForm(p => {
    const arr = [...p.problems]; arr[i] = v; return { ...p, problems: arr }
  })
  const removeProblem = (i) => setForm(p => ({ ...p, problems: p.problems.filter((_, idx) => idx !== i) }))

  /* ── Features CRUD ── */
  const addFeature    = () => setForm(p => ({ ...p, features: [...p.features, { title: '', desc: '' }] }))
  const editFeature   = (i, key, v) => setForm(p => ({
    ...p, features: p.features.map((ft, idx) => idx === i ? { ...ft, [key]: v } : ft)
  }))
  const removeFeature = (i) => setForm(p => ({ ...p, features: p.features.filter((_, idx) => idx !== i) }))

  /* ── Demo Views CRUD ── */
  const addDemoView    = () => setForm(p => ({ ...p, demo_views: [...p.demo_views, { label: '', url: '', desc: '' }] }))
  const editDemoView   = (i, key, v) => setForm(p => ({
    ...p, demo_views: p.demo_views.map((dv, idx) => idx === i ? { ...dv, [key]: v } : dv)
  }))
  const removeDemoView = (i) => setForm(p => ({ ...p, demo_views: p.demo_views.filter((_, idx) => idx !== i) }))

  /* ── Toggle active ── */
  const toggleActive = async (app) => {
    const { error } = await supabase
      .from('marketplace_apps')
      .update({ active: !app.active })
      .eq('id', app.id)
    if (!error) { WalaupSound.toggle(); fetchApps() }
  }

  /* ── Delete ── */
  const handleDelete = async (app) => {
    if (!confirm(`Supprimer "${sanitizeText(app.name)}" définitivement ?`)) return
    const { error } = await supabase.from('marketplace_apps').delete().eq('id', app.id)
    if (!error) { WalaupSound.error(); fetchApps() }
  }

  /* ── Save — validation + sanitization before write ── */
  const handleSave = async () => {
    // Validation
    if (!form.name.trim())     return setMsg({ type: 'error', text: 'Le nom est requis.' })
    if (!form.app_type.trim()) return setMsg({ type: 'error', text: "Le type d'app est requis (ex: medical, caisse, stock)." })
    if (form.price_from !== '' && isNaN(parseFloat(form.price_from)))
      return setMsg({ type: 'error', text: 'Le prix doit être un nombre.' })
    if (form.discount_pct && (parseFloat(form.discount_pct) < 0 || parseFloat(form.discount_pct) > 100))
      return setMsg({ type: 'error', text: 'La remise doit être entre 0 et 100%.' })
    // Demo views: each view needs at least label + url
    const invalidView = form.demo_views.find(v => (v.label?.trim() && !v.url?.trim()) || (!v.label?.trim() && v.url?.trim()))
    if (invalidView) return setMsg({ type: 'error', text: 'Chaque vue démo requiert un label ET une URL.' })

    setSaving(true); setMsg(null)

    // Sanitized payload
    const payload = {
      name:                   sanitizeText(form.name).trim(),
      tagline:                sanitizeText(form.tagline).trim(),
      description:            sanitizeText(form.description).trim(),
      icon:                   sanitizeText(form.icon) || '📱',
      category:               sanitizeText(form.category),
      app_type:               sanitizeText(form.app_type).trim().toLowerCase(),
      price_from:             sanitizeNum(form.price_from) ?? 0,
      owner_type:             form.owner_type === 'partner' ? 'partner' : 'walaup',
      active:                 Boolean(form.active),
      sort_order:             sanitizeInt(form.sort_order),
      bg_image_url:           sanitizeURL(form.bg_image_url) || null,
      thumbnail_url:          sanitizeURL(form.thumbnail_url) || null,
      discount_pct:           form.discount_pct ? sanitizeNum(form.discount_pct) : null,
      discount_label:         sanitizeText(form.discount_label).trim() || null,
      discount_expires_at:    form.discount_expires_at || null,
      for_who:                sanitizeText(form.for_who).trim() || null,
      // Arrays — filter empties, sanitize each value
      problems:  form.problems
        .map(p => sanitizeText(p).trim())
        .filter(Boolean),
      features:  form.features
        .filter(ft => ft.title?.trim())
        .map(ft => ({ title: sanitizeText(ft.title).trim(), desc: sanitizeText(ft.desc).trim() })),
      demo_views: form.demo_views
        .filter(v => v.label?.trim() && v.url?.trim())
        .map(v => ({
          label: sanitizeText(v.label).trim(),
          url:   sanitizeURL(v.url),
          desc:  sanitizeText(v.desc || '').trim(),
        })),
      commission_partner_pct: form.owner_type === 'partner' && form.commission_partner_pct
        ? sanitizeNum(form.commission_partner_pct)
        : null,
    }

    let error
    if (editApp) {
      ;({ error } = await supabase.from('marketplace_apps').update(payload).eq('id', editApp.id))
    } else {
      ;({ error } = await supabase.from('marketplace_apps').insert([payload]))
    }

    setSaving(false)
    if (error) return setMsg({ type: 'error', text: error.message })
    WalaupSound.success()
    setMsg({ type: 'success', text: editApp ? 'App modifiée avec succès ✓' : 'App ajoutée avec succès ✓' })
    setTimeout(() => { closeModal(); fetchApps() }, 1000)
  }

  /* ─────────────────────────────────────────────────────────────
     Render
  ───────────────────────────────────────────────────────────── */
  return (
    <>
      <style>{CSS}</style>
      <div className="adm-mp">

        {/* ── Header ── */}
        <div className="adm-mp-head">
          <div>
            <div className="adm-mp-title">Marketplace</div>
            <div className="adm-mp-sub">
              {apps.filter(a => a.active).length} apps actives · {apps.length} au total
            </div>
          </div>
          <div className="adm-mp-hactions">
            <button className="adm-act-btn" onClick={fetchApps} title="Rafraîchir"><RefreshCw size={13} /></button>
            <button style={sAddBtn} onClick={openAdd}><Plus size={13} /> Ajouter une app</button>
          </div>
        </div>

        {/* ── Apps list ── */}
        <div className="adm-mp-section">Applications</div>
        {loading ? (
          <div className="adm-mp-empty">Chargement…</div>
        ) : apps.length === 0 ? (
          <div className="adm-mp-empty">Aucune app. Ajoutez votre première application.</div>
        ) : apps.map(app => {
          const firstDemoUrl = app.demo_views?.[0]?.url || app.demo_url || null
          return (
            <div key={app.id} className={`adm-app-row${!app.active ? ' adm-inactive' : ''}`}>
              {/* Icon / thumbnail */}
              <div className="adm-app-icon">
                {app.thumbnail_url
                  ? (() => { const img = new Image(); return null })() || // createElement pattern
                    <span style={{ fontSize: 20 }}>{app.icon || '📱'}</span>
                  : <span style={{ fontSize: 20 }}>{app.icon || '📱'}</span>
                }
              </div>

              {/* Info */}
              <div className="adm-app-info">
                <div className="adm-app-name">{app.name}</div>
                <div className="adm-app-meta">
                  {app.category}{app.app_type ? ` · ${app.app_type}` : ''}
                  {app.tagline ? ` — ${app.tagline.slice(0, 50)}${app.tagline.length > 50 ? '…' : ''}` : ''}
                </div>
                <div className="adm-app-badges">
                  <span className={`adm-badge adm-badge--${app.owner_type}`}>
                    {app.owner_type === 'walaup' ? '🔵 Walaup' : '🟡 Partenaire'}
                  </span>
                  {app.discount_pct > 0 && (
                    <span className="adm-badge adm-badge--discount">
                      -{app.discount_pct}%{app.discount_label ? ` ${app.discount_label}` : ''}
                    </span>
                  )}
                  {Array.isArray(app.demo_views) && app.demo_views.length > 0 && (
                    <span className="adm-badge adm-badge--views">
                      <Monitor size={8} style={{ display:'inline', verticalAlign:'middle', marginRight:3 }} />
                      {app.demo_views.length} vue{app.demo_views.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>

              {/* Price */}
              <span className="adm-app-price">
                {app.price_from ? `${app.price_from} DT` : 'Devis'}
              </span>

              {/* Actions */}
              <div className="adm-app-actions">
                {firstDemoUrl && (
                  <a
                    href={firstDemoUrl.startsWith('/') ? `https://walaup.vercel.app${firstDemoUrl}` : firstDemoUrl}
                    target="_blank" rel="noreferrer noopener"
                    className="adm-act-btn" title="Voir démo"
                  >
                    <ExternalLink size={12} />
                  </a>
                )}
                <button className="adm-act-btn" onClick={() => openEdit(app)} title="Modifier">
                  <Edit2 size={12} />
                </button>
                <button className="adm-act-btn" onClick={() => toggleActive(app)} title={app.active ? 'Désactiver' : 'Activer'}>
                  {app.active ? <EyeOff size={12} /> : <Eye size={12} />}
                </button>
                <button className="adm-act-btn adm-act-btn--danger" onClick={() => handleDelete(app)} title="Supprimer">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* ══════════════════════════════════════════════════════════
          MODAL — Add / Edit
      ══════════════════════════════════════════════════════════ */}
      {showModal && (
        <div className="adm-mpo" onClick={closeModal}>
          <div className="adm-mpc" onClick={e => e.stopPropagation()}>

            {/* Fixed header */}
            <div className="adm-mpc-hd">
              <span className="adm-mpc-title">
                {editApp ? 'Modifier l\'application' : 'Ajouter une application'}
              </span>
              <button className="adm-mpc-close" onClick={closeModal}><X size={14} /></button>
            </div>

            {/* Scrollable body */}
            <div className="adm-mpc-body">
              {msg && <div style={msg.type === 'success' ? sMsgOk : sMsgErr}>{msg.text}</div>}

              {/* ────── SECTION 1 : Identité ────── */}
              <div className="adm-sec">
                <div className="adm-sec-hd">
                  <div className="adm-sec-line" /><span className="adm-sec-lbl">Identité</span><div className="adm-sec-line" />
                </div>

                <div className="adm-f3col" style={{ marginBottom: 12 }}>
                  <div>
                    <label className="adm-flabel">Icône</label>
                    <input className="adm-finp" value={form.icon} onChange={f('icon')} style={{ textAlign:'center', fontSize:20 }} maxLength={10} />
                  </div>
                  <div>
                    <label className="adm-flabel">Ordre</label>
                    <input className="adm-finp" type="number" min={0} value={form.sort_order} onChange={f('sort_order')} />
                  </div>
                  <div style={{ paddingTop: 20, display:'flex', alignItems:'center' }}>
                    <label className="adm-ftoggle">
                      <input type="checkbox" checked={form.active} onChange={e => setForm(p => ({ ...p, active: e.target.checked }))} />
                      <span>Visible</span>
                    </label>
                  </div>
                </div>

                <div className="adm-frow">
                  <label className="adm-flabel">Nom de l'application *</label>
                  <input className="adm-finp" value={form.name} onChange={f('name')} placeholder="Ex: App Cabinet Médical" maxLength={200} />
                </div>

                <div className="adm-frow">
                  <label className="adm-flabel">Tagline</label>
                  <input className="adm-finp" value={form.tagline} onChange={f('tagline')} placeholder="Courte accroche — ex: Modernisez votre cabinet en 48h" maxLength={200} />
                </div>

                <div className="adm-f3col">
                  <div>
                    <label className="adm-flabel">Catégorie</label>
                    <select className="adm-finp" value={form.category} onChange={f('category')}>
                      {CATS.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="adm-flabel">App type *</label>
                    <input className="adm-finp" value={form.app_type} onChange={f('app_type')} placeholder="medical / caisse…" maxLength={50} />
                    <div className="adm-fhint">Dossier /apps/[type]</div>
                  </div>
                  <div>
                    <label className="adm-flabel">Propriétaire</label>
                    <select className="adm-finp" value={form.owner_type} onChange={f('owner_type')}>
                      <option value="walaup">🔵 Walaup</option>
                      <option value="partner">🟡 Partenaire</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* ────── SECTION 2 : Prix & Remise ────── */}
              <div className="adm-sec">
                <div className="adm-sec-hd">
                  <div className="adm-sec-line" /><span className="adm-sec-lbl">Prix & Remise</span><div className="adm-sec-line" />
                </div>

                <div className="adm-f2col" style={{ marginBottom: 12 }}>
                  <div>
                    <label className="adm-flabel">Prix depuis (DT)</label>
                    <input className="adm-finp" type="number" min={0} value={form.price_from} onChange={f('price_from')} placeholder="299" />
                  </div>
                  {form.owner_type === 'partner' && (
                    <div>
                      <label className="adm-flabel">Commission partenaire (%)</label>
                      <input className="adm-finp" type="number" min={0} max={100} value={form.commission_partner_pct} onChange={f('commission_partner_pct')} placeholder="60" />
                      <div className="adm-fhint">% reversé au partenaire sur chaque vente</div>
                    </div>
                  )}
                </div>

                <div className="adm-f3col">
                  <div>
                    <label className="adm-flabel" style={{ display:'flex', alignItems:'center', gap:4 }}>
                      <Percent size={10} /> Remise (%)
                    </label>
                    <input className="adm-finp" type="number" min={0} max={100} value={form.discount_pct} onChange={f('discount_pct')} placeholder="20" />
                  </div>
                  <div>
                    <label className="adm-flabel">Label remise</label>
                    <input className="adm-finp" value={form.discount_label} onChange={f('discount_label')} placeholder="Offre lancement 🔥" maxLength={50} />
                  </div>
                  <div>
                    <label className="adm-flabel">Expire le</label>
                    <input className="adm-finp" type="date" value={form.discount_expires_at} onChange={f('discount_expires_at')} />
                    <div className="adm-fhint">Vide = permanent</div>
                  </div>
                </div>
              </div>

              {/* ────── SECTION 3 : Visuels ────── */}
              <div className="adm-sec">
                <div className="adm-sec-hd">
                  <div className="adm-sec-line" /><span className="adm-sec-lbl">Visuels</span><div className="adm-sec-line" />
                </div>

                <div className="adm-frow">
                  <label className="adm-flabel">Image de fond — card marketplace</label>
                  <input className="adm-finp" value={form.bg_image_url} onChange={f('bg_image_url')} placeholder="https://… ou /images/…" maxLength={500} />
                  <div className="adm-fhint">Utilisée comme background visuel de la card</div>
                  {form.bg_image_url && (
                    <img
                      alt="Aperçu fond"
                      className="adm-img-prev"
                      onError={e => { e.target.style.display = 'none' }}
                      /* src assigné via JS ref pattern — pas dans HTML string */
                      ref={el => { if (el) el.src = form.bg_image_url }}
                    />
                  )}
                </div>

                <div className="adm-frow">
                  <label className="adm-flabel">Thumbnail / Icône image</label>
                  <input className="adm-finp" value={form.thumbnail_url} onChange={f('thumbnail_url')} placeholder="https://… ou /images/…" maxLength={500} />
                  {form.thumbnail_url && (
                    <img
                      alt="Aperçu thumbnail"
                      className="adm-img-prev"
                      style={{ height: 60, width: 60, borderRadius: 12, objectFit:'cover' }}
                      onError={e => { e.target.style.display = 'none' }}
                      ref={el => { if (el) el.src = form.thumbnail_url }}
                    />
                  )}
                </div>
              </div>

              {/* ────── SECTION 4 : Contenu marketing ────── */}
              <div className="adm-sec">
                <div className="adm-sec-hd">
                  <div className="adm-sec-line" /><span className="adm-sec-lbl">Contenu marketing</span><div className="adm-sec-line" />
                </div>

                <div className="adm-frow">
                  <label className="adm-flabel">Pour qui ?</label>
                  <input className="adm-finp" value={form.for_who} onChange={f('for_who')} placeholder="Médecins, dentistes, cliniques privées" maxLength={200} />
                </div>

                <div className="adm-frow">
                  <label className="adm-flabel">Description complète</label>
                  <textarea className="adm-finp" rows={3} value={form.description} onChange={f('description')} placeholder="Description détaillée — affichée dans le panel info et la page de l'app…" maxLength={2000} style={{ resize:'vertical', minHeight:70 }} />
                </div>

                {/* Problems list */}
                <div className="adm-frow">
                  <label className="adm-flabel">Problèmes résolus</label>
                  {form.problems.map((p, i) => (
                    <div key={i} className="adm-li">
                      <input
                        className="adm-li-inp"
                        value={p}
                        placeholder={`Problème ${i + 1} — ex: Gestion manuelle chronophage`}
                        maxLength={200}
                        onChange={e => editProblem(i, e.target.value)}
                      />
                      <button className="adm-rm" onClick={() => removeProblem(i)} title="Supprimer"><X size={11} /></button>
                    </div>
                  ))}
                  <button className="adm-add-item" onClick={addProblem}>
                    <Plus size={12} /> Ajouter un problème
                  </button>
                </div>

                {/* Features list */}
                <div className="adm-frow" style={{ marginTop: 14 }}>
                  <label className="adm-flabel">Fonctionnalités incluses</label>
                  {form.features.map((ft, i) => (
                    <div key={i} className="adm-li" style={{ alignItems:'flex-start' }}>
                      <div style={{ flex:1, display:'grid', gridTemplateColumns:'1fr 1.5fr', gap:6 }}>
                        <input
                          className="adm-li-inp"
                          value={ft.title}
                          placeholder="Titre — ex: 📅 Agenda"
                          maxLength={100}
                          onChange={e => editFeature(i, 'title', e.target.value)}
                        />
                        <input
                          className="adm-li-inp"
                          value={ft.desc}
                          placeholder="Description courte"
                          maxLength={200}
                          onChange={e => editFeature(i, 'desc', e.target.value)}
                        />
                      </div>
                      <button className="adm-rm" onClick={() => removeFeature(i)} title="Supprimer"><X size={11} /></button>
                    </div>
                  ))}
                  <button className="adm-add-item" onClick={addFeature}>
                    <Plus size={12} /> Ajouter une fonctionnalité
                  </button>
                </div>
              </div>

              {/* ────── SECTION 5 : Vues démo ────── */}
              <div className="adm-sec">
                <div className="adm-sec-hd">
                  <div className="adm-sec-line" />
                  <span className="adm-sec-lbl" style={{ display:'flex', alignItems:'center', gap:5 }}>
                    <Layers size={10} /> Vues démo
                  </span>
                  <div className="adm-sec-line" />
                </div>
                <div className="adm-fhint" style={{ marginBottom:12, lineHeight:1.5 }}>
                  Chaque vue est un espace navigable dans la démo (ex: Médecin, Secrétaire, Patient).
                  Le visiteur voit des boutons pour basculer entre les vues.
                </div>

                {form.demo_views.length === 0 && (
                  <div style={{ textAlign:'center', padding:'10px 0 14px', color:'var(--tx-3)', fontSize:12 }}>
                    Aucune vue — l'overlay démo affichera un message "Démo non disponible".
                  </div>
                )}

                {form.demo_views.map((v, i) => (
                  <div key={i} className="adm-dv-card">
                    <div className="adm-dv-top">
                      <span className="adm-dv-num">
                        <Monitor size={10} /> Vue {i + 1}
                      </span>
                      <button className="adm-rm" style={{ margin:0 }} onClick={() => removeDemoView(i)} title="Supprimer la vue">
                        <X size={11} />
                      </button>
                    </div>
                    <div className="adm-dv-grid">
                      <div>
                        <label className="adm-flabel" style={{ fontSize:10 }}>Label bouton *</label>
                        <input
                          className="adm-li-inp"
                          value={v.label}
                          placeholder="Ex: Espace Médecin"
                          maxLength={50}
                          onChange={e => editDemoView(i, 'label', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="adm-flabel" style={{ fontSize:10 }}>URL démo * (chemin relatif)</label>
                        <input
                          className="adm-li-inp"
                          value={v.url}
                          placeholder="/apps/medical/demo/doctor"
                          maxLength={300}
                          onChange={e => editDemoView(i, 'url', e.target.value)}
                        />
                      </div>
                      <div className="adm-dv-full">
                        <label className="adm-flabel" style={{ fontSize:10 }}>Description (optionnel)</label>
                        <input
                          className="adm-li-inp"
                          value={v.desc || ''}
                          placeholder="Ex: Dashboard complet de gestion du médecin"
                          maxLength={150}
                          onChange={e => editDemoView(i, 'desc', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <button className="adm-add-item" onClick={addDemoView}>
                  <Plus size={12} /> Ajouter une vue démo
                </button>
              </div>

              {/* ── Save button ── */}
              <button
                style={{ ...sSaveBtn, opacity: saving ? 0.62 : 1, cursor: saving ? 'not-allowed' : 'pointer' }}
                onClick={handleSave}
                disabled={saving}
              >
                {saving
                  ? 'Enregistrement…'
                  : editApp
                    ? '✓ Enregistrer les modifications'
                    : '+ Ajouter l\'application'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
