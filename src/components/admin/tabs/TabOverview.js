'use client'
import { useEffect, useState } from 'react'
import { TrendingUp, Users, CreditCard, Package, AlertTriangle, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function TabOverview() {
  const [kpis, setKpis] = useState(null)
  const [activity, setActivity] = useState([])
  const [revenue, setRevenue] = useState([])
  const [packDist, setPackDist] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      const [leadsRes, revenueRes, clientsRes, appsRes, subsRes, cancelRes] = await Promise.all([
        supabase.from('leads').select('id', { count: 'exact' }).gte('created_at', monthStart),
        supabase.from('payments').select('amount').eq('status', 'completed').gte('created_at', monthStart),
        supabase.from('leads').select('id', { count: 'exact' }).not('status', 'in', '("new","cancelled")'),
        supabase.from('leads').select('id', { count: 'exact' }).in('status', ['demo', 'dev']),
        supabase.from('leads').select('id', { count: 'exact' }).eq('status', 'delivered').not('pay_status', 'eq', 'none'),
        supabase.from('leads').select('id', { count: 'exact' }).eq('status', 'cancelled').gte('created_at', monthStart),
      ])
      const totalRevenue = (revenueRes.data || []).reduce((s, p) => s + (p.amount || 0), 0)
      setKpis([
        { label: 'Leads ce mois',    value: leadsRes.count  || 0, unit: '',    color: '#6366F1', icon: Users },
        { label: 'Revenus (DT)',     value: totalRevenue,         unit: ' DT', color: '#F59E0B', icon: CreditCard },
        { label: 'Clients actifs',   value: clientsRes.count || 0, unit: '',   color: '#10B981', icon: TrendingUp },
        { label: 'Apps en cours',    value: appsRes.count   || 0, unit: '',    color: '#22D3EE', icon: Package },
        { label: 'Apps livrées',     value: subsRes.count   || 0, unit: '',    color: '#8B5CF6', icon: TrendingUp },
        { label: 'Résiliations',     value: cancelRes.count || 0, unit: '',    color: '#F87171', icon: AlertTriangle },
      ])
      const actRes = await supabase.from('messages').select('id, text, sender, created_at, leads(name, app)').order('created_at', { ascending: false }).limit(10)
      if (actRes.data) {
        setActivity(actRes.data.map(m => ({
          id: m.id, time: formatRelTime(m.created_at),
          text: m.sender === 'client' ? `Message client — ${m.leads?.name || '?'} — "${m.text?.slice(0,60)}…"` : `Réponse admin — ${m.leads?.name || '?'}`,
          color: m.sender === 'client' ? '#6366F1' : '#10B981',
        })))
      }
      const revRes = await supabase.from('payments').select('amount, created_at, type').eq('status', 'completed').gte('created_at', new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString())
      const months = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
        return { month: d.toLocaleString('fr-FR', { month: 'short' }), annual: 0, monthly: 0, key: `${d.getFullYear()}-${d.getMonth()}` }
      })
      ;(revRes.data || []).forEach(p => {
        const d = new Date(p.created_at); const key = `${d.getFullYear()}-${d.getMonth()}`
        const m = months.find(m => m.key === key)
        if (m) { if (p.type === 'monthly') m.monthly += p.amount; else m.annual += p.amount }
      })
      setRevenue(months)
      const packRes = await supabase.from('leads').select('pack').not('pack', 'is', null)
      const counts = {};(packRes.data || []).forEach(l => { counts[l.pack] = (counts[l.pack] || 0) + 1 })
      const total = Object.values(counts).reduce((s, v) => s + v, 0) || 1
      setPackDist([
        { label: 'Pack Pro',        count: counts['Pro']        || 0, color: '#6366F1', pct: Math.round(((counts['Pro']        || 0) / total) * 100) },
        { label: 'Pack Essentiel',  count: counts['Essentiel']  || 0, color: '#10B981', pct: Math.round(((counts['Essentiel']  || 0) / total) * 100) },
        { label: 'Pack Partenaire', count: counts['Partenaire'] || 0, color: '#F59E0B', pct: Math.round(((counts['Partenaire'] || 0) / total) * 100) },
      ])
      setLastRefresh(new Date())
    } catch (err) { console.error('TabOverview', err) }
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 60000)
    const ch = supabase.channel('admin-overview')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, fetchData)
      .subscribe()
    return () => { clearInterval(interval); supabase.removeChannel(ch) }
  }, [])

  // ─ Style constants (safe from Notion corruption) ─
  const sRefreshIcon = loading ? { animation: 'spin 1s linear infinite' } : {}
  const sChartsWrap  = { flex: 2 }
  const sPackLabel   = { fontSize: 11, color: 'var(--tx-2)', width: 110 }
  const sEmptyAct    = { fontSize: 12, color: 'var(--tx-3)', padding: '12px 0' }
  const sSkel1       = { height: 28, width: '60%', marginBottom: 8 }
  const sSkel2       = { height: 12, width: '80%' }

  const CSS = `
    .adm-ov { padding:24px; overflow-y:auto; height:100%; }
    .adm-ov::-webkit-scrollbar { width:4px; }
    .adm-ov::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:4px; }
    .adm-ov-title { font-family:'Space Grotesk',sans-serif; font-weight:800; font-size:22px; color:var(--tx); margin-bottom:4px; }
    .adm-ov-sub { font-size:13px; color:var(--tx-3); margin-bottom:24px; display:flex; align-items:center; gap:10px; }
    .adm-kpi-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; margin-bottom:20px; }
    @media(max-width:900px){ .adm-kpi-grid { grid-template-columns:repeat(2,1fr); } }
    @media(max-width:600px){ .adm-kpi-grid { grid-template-columns:1fr; } }
    .adm-kpi-card { background:rgba(13,17,32,0.7); border:1px solid rgba(255,255,255,0.08); border-radius:14px; padding:18px; backdrop-filter:blur(12px); transition:border-color 200ms; }
    .adm-kpi-card:hover { border-color:rgba(99,102,241,0.2); }
    .adm-kpi-head { display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; }
    .adm-kpi-icon { width:34px; height:34px; border-radius:9px; display:flex; align-items:center; justify-content:center; }
    .adm-kpi-val { font-family:'Space Grotesk',sans-serif; font-weight:800; font-size:28px; margin-bottom:4px; line-height:1; }
    .adm-kpi-label { font-size:12px; color:var(--tx-2); }
    .adm-charts { display:flex; gap:14px; margin-bottom:20px; }
    @media(max-width:700px){ .adm-charts { flex-direction:column; } }
    .adm-chart-card { flex:1; background:rgba(13,17,32,0.7); border:1px solid rgba(255,255,255,0.08); border-radius:14px; padding:20px; backdrop-filter:blur(12px); }
    .adm-chart-title { font-family:'Space Grotesk',sans-serif; font-weight:700; font-size:14px; color:var(--tx); margin-bottom:16px; }
    .adm-bars { display:flex; align-items:flex-end; gap:8px; height:120px; }
    .adm-bar-col { flex:1; display:flex; flex-direction:column; align-items:center; gap:4px; height:100%; justify-content:flex-end; }
    .adm-bar-stack { width:100%; display:flex; flex-direction:column-reverse; gap:2px; }
    .adm-bar-seg { border-radius:3px; width:100%; min-height:2px; transition:height 1s cubic-bezier(0.16,1,0.3,1); }
    .adm-bar-month { font-size:9px; color:var(--tx-3); margin-top:4px; }
    .adm-bottom { display:flex; gap:14px; }
    @media(max-width:700px){ .adm-bottom { flex-direction:column; } }
    .adm-activity { flex:1; background:rgba(13,17,32,0.7); border:1px solid rgba(255,255,255,0.08); border-radius:14px; padding:20px; backdrop-filter:blur(12px); }
    .adm-activity-title { font-family:'Space Grotesk',sans-serif; font-weight:700; font-size:14px; color:var(--tx); margin-bottom:14px; }
    .adm-act-item { display:flex; gap:10px; align-items:flex-start; padding:8px 0; border-bottom:1px solid rgba(255,255,255,0.04); }
    .adm-act-item:last-child { border-bottom:none; }
    .adm-act-dot { width:7px; height:7px; border-radius:50%; margin-top:5px; flex-shrink:0; }
    .adm-act-text { font-size:12px; color:var(--tx-2); flex:1; line-height:1.5; }
    .adm-act-time { font-size:10px; color:var(--tx-3); white-space:nowrap; }
    .adm-pack-row { display:flex; align-items:center; gap:8px; margin-bottom:10px; }
    .adm-pack-bar { flex:1; height:6px; border-radius:3px; background:rgba(255,255,255,0.06); overflow:hidden; }
    .adm-pack-fill { height:100%; border-radius:3px; transition:width 1s cubic-bezier(0.16,1,0.3,1); }
    .adm-refresh-btn { display:flex; align-items:center; gap:5px; padding:4px 10px; border-radius:8px; border:1px solid rgba(255,255,255,0.1); background:transparent; color:var(--tx-3); font-size:11px; cursor:pointer; transition:all 150ms; }
    .adm-refresh-btn:hover { background:rgba(99,102,241,0.1); color:var(--ac); }
    .adm-skeleton { background:linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0.04) 75%); background-size:200% 100%; animation:adm-shimmer 1.5s infinite; border-radius:8px; }
    @keyframes adm-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
  `

  const max = revenue.length ? Math.max(...revenue.map(r => r.annual + r.monthly), 1) : 1

  return (
    <>
      <style>{CSS}</style>
      <div className="adm-ov">
        <div className="adm-ov-title">Vue d'ensemble</div>
        <div className="adm-ov-sub">
          Données en temps réel · Walaup Platform
          {lastRefresh && <span>· {lastRefresh.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>}
          <button className="adm-refresh-btn" onClick={fetchData}>
            <RefreshCw size={11} style={sRefreshIcon} /> Actualiser
          </button>
        </div>

        <div className="adm-kpi-grid">
          {(kpis || Array(6).fill(null)).map((k, i) => {
            const Icon = k?.icon || Users
            const sIcon = { background: k ? `${k.color}18` : 'rgba(255,255,255,0.04)' }
            const sVal  = { color: k ? k.color : 'var(--tx)' }
            return (
              <div key={i} className="adm-kpi-card">
                <div className="adm-kpi-head">
                  <div className="adm-kpi-icon" style={sIcon}>
                    {k && <Icon size={16} color={k.color} strokeWidth={1.8} />}
                  </div>
                </div>
                {k ? (
                  <>
                    <div className="adm-kpi-val" style={sVal}>
                      {k.unit === ' DT' ? k.value.toLocaleString('fr-TN') : k.value}{k.unit}
                    </div>
                    <div className="adm-kpi-label">{k.label}</div>
                  </>
                ) : (
                  <>
                    <div className="adm-skeleton" style={sSkel1} />
                    <div className="adm-skeleton" style={sSkel2} />
                  </>
                )}
              </div>
            )
          })}
        </div>

        <div className="adm-charts">
          <div className="adm-chart-card" style={sChartsWrap}>
            <div className="adm-chart-title">Revenus — 6 derniers mois (DT)</div>
            <div className="adm-bars">
              {revenue.map((r, i) => {
                const total = r.annual + r.monthly
                const hAnn = total ? Math.round((r.annual / max) * 110) : 0
                const hMon = total ? Math.round((r.monthly / max) * 110) : 0
                const sSegAnn = { height: hAnn, background: 'linear-gradient(180deg,#6366F1,#4f46e5)' }
                const sSegMon = { height: hMon, background: 'linear-gradient(180deg,#F59E0B,#d97706)' }
                return (
                  <div key={i} className="adm-bar-col">
                    <div className="adm-bar-stack">
                      <div className="adm-bar-seg" style={sSegAnn} />
                      <div className="adm-bar-seg" style={sSegMon} />
                    </div>
                    <div className="adm-bar-month">{r.month}</div>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="adm-chart-card">
            <div className="adm-chart-title">Répartition packs</div>
            {packDist.map((p, i) => {
              const sPackCount = { fontSize: 11, color: p.color, fontWeight: 700, width: 24, textAlign: 'right' }
              const sPackFill  = { width: `${p.pct}%`, background: p.color }
              return (
                <div key={i} className="adm-pack-row">
                  <span style={sPackLabel}>{p.label}</span>
                  <div className="adm-pack-bar"><div className="adm-pack-fill" style={sPackFill} /></div>
                  <span style={sPackCount}>{p.count}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="adm-bottom">
          <div className="adm-activity">
            <div className="adm-activity-title">Activité récente</div>
            {activity.length === 0 && !loading && <div style={sEmptyAct}>Aucune activité récente.</div>}
            {activity.map((a, i) => {
              const sDot = { background: a.color }
              return (
                <div key={a.id || i} className="adm-act-item">
                  <div className="adm-act-dot" style={sDot} />
                  <span className="adm-act-text">{a.text}</span>
                  <span className="adm-act-time">{a.time}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}

function formatRelTime(ts) {
  if (!ts) return ''
  const diff = Date.now() - new Date(ts).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'À l\'instant'
  if (m < 60) return `Il y a ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `Il y a ${h}h`
  return new Date(ts).toLocaleDateString('fr-FR')
}
