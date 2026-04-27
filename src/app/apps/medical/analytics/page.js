'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, TrendingUp, Users, CalendarDays,
  CheckCircle2, XCircle, RefreshCw, Download, Activity, Heart
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

const CSS = `
  .an-root { min-height:100vh; background:var(--bg-base); padding-bottom:40px; }
  .an-topbar {
    position:sticky; top:0; z-index:100;
    height:56px; display:flex; align-items:center;
    padding:0 20px; gap:12px; flex-shrink:0;
    background:rgba(8,11,20,.96); border-bottom:1px solid var(--border);
    backdrop-filter:blur(20px);
  }
  .an-back { display:flex; align-items:center; gap:6px; color:var(--tx-2);
    font-size:.85rem; font-weight:600; cursor:pointer;
    background:none; border:none; transition:color .15s; padding:0; }
  .an-back:hover { color:#0EA5E9; }
  .an-title { font-family:var(--font-display); font-weight:700;
    font-size:.95rem; color:var(--tx); flex:1; }

  .an-content { max-width:960px; margin:0 auto; padding:24px 20px; }

  /* ── Period selector ── */
  .an-periods { display:flex; gap:6px; margin-bottom:24px; }
  .an-period-btn {
    padding:6px 16px; border-radius:20px; font-size:.78rem;
    font-weight:600; cursor:pointer; border:1px solid var(--border);
    background:transparent; color:var(--tx-2); transition:all .18s;
  }
  .an-period-btn.active {
    background:rgba(14,165,233,.12); color:#0EA5E9;
    border-color:rgba(14,165,233,.35);
  }
  .an-period-btn:hover { color:var(--tx); }

  /* ── KPI Grid ── */
  .an-kpi-grid {
    display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr));
    gap:14px; margin-bottom:24px;
  }
  .an-kpi-card {
    background:var(--bg-surface); border:1px solid var(--border);
    border-radius:14px; padding:18px; position:relative; overflow:hidden;
    transition:all .2s;
  }
  .an-kpi-card::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; }
  .an-kpi-card.blue::before  { background:linear-gradient(90deg,#0EA5E9,#38BDF8); }
  .an-kpi-card.green::before { background:linear-gradient(90deg,var(--green),#34D399); }
  .an-kpi-card.gold::before  { background:linear-gradient(90deg,var(--gold),var(--gold-light)); }
  .an-kpi-card.red::before   { background:linear-gradient(90deg,var(--red),#FB7185); }
  .an-kpi-label { font-size:.7rem; font-weight:600; letter-spacing:.06em;
    text-transform:uppercase; color:var(--tx-2); margin-bottom:8px; }
  .an-kpi-value { font-family:var(--font-display); font-size:2rem;
    font-weight:800; color:var(--tx); line-height:1; margin-bottom:4px; }
  .an-kpi-sub { font-size:.72rem; color:var(--tx-3); }
  .an-kpi-icon { position:absolute; bottom:12px; right:14px; opacity:.1; }

  /* ── Charts ── */
  .an-charts-grid {
    display:grid; grid-template-columns:1fr 1fr;
    gap:14px; margin-bottom:24px;
  }
  @media (max-width:700px) { .an-charts-grid { grid-template-columns:1fr; } }
  .an-chart-card {
    background:var(--bg-surface); border:1px solid var(--border);
    border-radius:14px; padding:18px;
  }
  .an-chart-title { font-weight:700; font-size:.88rem; color:var(--tx);
    margin-bottom:16px; display:flex; align-items:center; gap:8px; }
  .an-chart-canvas { width:100% !important; }

  /* ── Table activité ── */
  .an-table-card {
    background:var(--bg-surface); border:1px solid var(--border);
    border-radius:14px; overflow:hidden; margin-bottom:16px;
  }
  .an-table-header {
    padding:14px 18px; border-bottom:1px solid var(--border);
    font-weight:700; font-size:.88rem; color:var(--tx);
    display:flex; align-items:center; gap:8px;
  }
  .an-table-row {
    display:grid; grid-template-columns:2fr 1fr 1fr 1fr;
    padding:12px 18px; border-bottom:1px solid var(--border);
    align-items:center;
  }
  .an-table-row:last-child { border-bottom:none; }
  .an-table-row:hover { background:var(--bg-hover); }
  .an-table-head { background:var(--bg-base); }
  .an-table-head span { font-size:.7rem; font-weight:700; color:var(--tx-3);
    letter-spacing:.05em; text-transform:uppercase; }
  .an-cell { font-size:.82rem; color:var(--tx); }
  .an-cell.muted { color:var(--tx-3); }
  .an-cell.green { color:var(--green); font-weight:700; }
  .an-cell.red   { color:var(--red);   font-weight:700; }

  /* ── Premium lock ── */
  .an-premium {
    background:var(--bg-surface); border:1px dashed rgba(99,102,241,.4);
    border-radius:14px; padding:32px; text-align:center; margin-bottom:16px;
  }
  .an-premium-icon { width:52px; height:52px; border-radius:16px; margin:0 auto 14px;
    display:flex; align-items:center; justify-content:center;
    background:rgba(99,102,241,.1); color:var(--ac); }
  .an-premium-title { font-weight:700; color:var(--tx); margin-bottom:6px; font-size:1rem; }
  .an-premium-desc  { font-size:.82rem; color:var(--tx-2); margin-bottom:16px; }
  .an-premium-btn {
    padding:9px 22px; border-radius:10px; font-size:.85rem; font-weight:700;
    background:linear-gradient(135deg,var(--ac),var(--ac-2)); color:white;
    border:none; cursor:pointer;
  }

  .an-skeleton { background:linear-gradient(90deg,var(--bg-surface) 25%,var(--bg-hover) 50%,var(--bg-surface) 75%);
    background-size:200% 100%; animation:anShimmer 1.5s infinite; border-radius:8px; }
  @keyframes anShimmer { 0%{background-position:200%} 100%{background-position:-200%} }
`

const PERIODS = [
  { id: '7d',  label: '7 jours' },
  { id: '30d', label: '30 jours' },
  { id: '90d', label: '3 mois' },
]

function AdvancedAnalytics({ tenantId, daily, stats, period }) {
  const [exporting, setExporting] = useState(false)

  function exportCSV() {
    setExporting(true)
    const rows = [
      ['Date', 'RDV Total', 'Terminés', 'Annulés', 'Nouveaux Patients'],
      ...(daily||[]).map(d => [d.date, d.rdv, d.done, 0, d.new_pt])
    ]
    const csv = rows.map(r => r.join(',')).join('
')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = `analytics_${period}_${new Date().toISOString().slice(0,10)}.csv`
    a.click(); URL.revokeObjectURL(url)
    setExporting(false)
  }

  return (
    <div style={{ marginBottom:16 }}>
      <div style={{ background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:14, padding:'16px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div>
          <div style={{ fontWeight:700, fontSize:'.88rem', color:'var(--tx)', marginBottom:4 }}>
            Analytics avancés ✅
          </div>
          <div style={{ fontSize:'.75rem', color:'var(--tx-3)' }}>
            {stats?.total ?? 0} RDV · {stats?.new_patients ?? 0} nouveaux patients · Taux présence {stats?.taux_presence ?? 0}%
          </div>
        </div>
        <button onClick={exportCSV} disabled={exporting}
          style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:10, border:'1px solid rgba(14,165,233,.3)', background:'rgba(14,165,233,.08)', color:'#0EA5E9', fontWeight:700, fontSize:'.8rem', cursor:'pointer', transition:'all .15s' }}>
          <Download size={14}/> {exporting ? 'Export…' : 'Exporter CSV'}
        </button>
      </div>
    </div>
  )
}

export default function Analytics() {
  const router  = useRouter()
  const [user,    setUser]    = useState(null)
  const [period,  setPeriod]  = useState('7d')
  const [stats,   setStats]   = useState(null)
  const [daily,   setDaily]   = useState([])
  const [loading, setLoading] = useState(true)
  const [isPremium, setIsPremium] = useState(false)
  const chartRef1 = useRef(null)
  const chartRef2 = useRef(null)
  const chart1    = useRef(null)
  const chart2    = useRef(null)

  /* ── Auth ── */
  useEffect(() => {
    async function init() {
      try {
        const { data: { user: u } } = await supabase.auth.getUser()
        if (!u) { router.push('/apps/medical/login'); return }
        const { data: ud } = await supabase.from('users')
          .select('role, tenant_id, app_type')
          .eq('id', u.id).maybeSingle()
        if (!ud || ud.role !== 'tenant_admin' || ud.app_type !== 'medical') {
          router.push('/apps/medical/login'); return
        }
        setUser({ ...u, ...ud })

        // Check premium
        const { data: tenant } = await supabase.from('med_tenants')
          .select('support_active').eq('tenant_id', ud.tenant_id).maybeSingle()
        setIsPremium(true) // Toutes features débloquées
      } catch { router.push('/apps/medical/login') }
      finally { setLoading(false) }
    }
    init()
  }, [router])

  /* ── Charger stats ── */
  useEffect(() => {
    if (!user) return
    loadStats()
  }, [user, period])

  async function loadStats() {
    setLoading(true)
    try {
      const days = period === '7d' ? 7 : period === '30d' ? 30 : 90
      const since = new Date()
      since.setDate(since.getDate() - days)

      const [apptRes, ptRes] = await Promise.all([
        supabase.from('med_appointments')
          .select('id, status, type, scheduled_at')
          .gte('scheduled_at', since.toISOString()),
        supabase.from('med_patients')
          .select('id, created_at')
          .gte('created_at', since.toISOString())
      ])

      const appts  = apptRes.data || []
      const newPts = ptRes.data   || []

      setStats({
        total:    appts.length,
        done:     appts.filter(a => a.status === 'done').length,
        cancelled:appts.filter(a => a.status === 'cancelled').length,
        new_patients: newPts.length,
        taux_presence: appts.length > 0
          ? Math.round((appts.filter(a=>a.status==='done').length / appts.length) * 100)
          : 0,
      })

      // Préparer données journalières pour chart
      const byDay = {}
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        const key = d.toISOString().slice(0, 10)
        byDay[key] = { date: key, rdv: 0, done: 0, new_pt: 0 }
      }
      appts.forEach(a => {
        const key = a.scheduled_at.slice(0, 10)
        if (byDay[key]) {
          byDay[key].rdv++
          if (a.status === 'done') byDay[key].done++
        }
      })
      newPts.forEach(p => {
        const key = p.created_at.slice(0, 10)
        if (byDay[key]) byDay[key].new_pt++
      })
      setDaily(Object.values(byDay))
    } catch { /* silencieux */ }
    setLoading(false)
  }

  /* ── Charger Chart.js et dessiner les graphiques ── */
  useEffect(() => {
    if (!daily.length || !chartRef1.current || !chartRef2.current) return

    async function drawCharts() {
      // Charger Chart.js dynamiquement
      if (!window.Chart) {
        await new Promise((resolve) => {
          const s = document.createElement('script')
          s.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js'
          s.onload = resolve
          document.head.appendChild(s)
        })
      }
      const Chart = window.Chart

      const labels = daily.map(d => {
        const date = new Date(d.date)
        return date.toLocaleDateString('fr-TN', { day:'2-digit', month:'short' })
      })
      const rdvData  = daily.map(d => d.rdv)
      const doneData = daily.map(d => d.done)
      const ptData   = daily.map(d => d.new_pt)

      // Détruire charts existants
      if (chart1.current) chart1.current.destroy()
      if (chart2.current) chart2.current.destroy()

      const commonOptions = {
        responsive: true,
        plugins: { legend: { labels: { color: '#8B90B8', font: { size: 11 } } } },
        scales: {
          x: { ticks: { color: '#8B90B8', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,.04)' } },
          y: { ticks: { color: '#8B90B8', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,.06)' }, beginAtZero: true }
        }
      }

      chart1.current = new Chart(chartRef1.current, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            { label: 'RDV total', data: rdvData, backgroundColor: 'rgba(14,165,233,.6)', borderRadius: 4 },
            { label: 'Terminés',  data: doneData, backgroundColor: 'rgba(16,185,129,.6)', borderRadius: 4 },
          ]
        },
        options: commonOptions
      })

      chart2.current = new Chart(chartRef2.current, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: 'Nouveaux patients',
            data: ptData,
            borderColor: '#0EA5E9',
            backgroundColor: 'rgba(14,165,233,.1)',
            fill: true, tension: 0.4,
            pointBackgroundColor: '#0EA5E9',
          }]
        },
        options: commonOptions
      })
    }

    drawCharts()
  }, [daily])

  if (loading && !stats) return (
    <div style={{ background:'var(--bg-base)', minHeight:'100vh' }}>
      <div style={{ maxWidth:960, margin:'0 auto', padding:'24px 20px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:24 }}>
          {[1,2,3,4].map(i=><div key={i} className="an-skeleton" style={{ height:100, borderRadius:14 }}/>)}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          {[1,2].map(i=><div key={i} className="an-skeleton" style={{ height:200, borderRadius:14 }}/>)}
        </div>
      </div>
    </div>
  )

  return (
    <>
      <style>{CSS}</style>
      <div className="an-root">
        <div className="an-topbar">
          <button className="an-back" onClick={() => router.push('/apps/medical/doctor')}>
            <ArrowLeft size={15}/> Retour
          </button>
          <span className="an-title">Analytics</span>
          <button onClick={loadStats} style={{ background:'none', border:'none', color:'var(--tx-3)', cursor:'pointer' }}>
            <RefreshCw size={15}/>
          </button>
        </div>

        <div className="an-content">
          {/* Period selector */}
          <div className="an-periods">
            {PERIODS.map(p => (
              <button key={p.id} className={`an-period-btn ${period===p.id?'active':''}`}
                onClick={() => setPeriod(p.id)}>
                {p.label}
              </button>
            ))}
          </div>

          {/* KPIs */}
          <div className="an-kpi-grid">
            <div className="an-kpi-card blue">
              <div className="an-kpi-label">RDV total</div>
              <div className="an-kpi-value">{stats?.total ?? '—'}</div>
              <div className="an-kpi-sub">Sur {period === '7d' ? '7' : period === '30d' ? '30' : '90'} jours</div>
              <div className="an-kpi-icon"><CalendarDays size={40} color="#0EA5E9"/></div>
            </div>
            <div className="an-kpi-card green">
              <div className="an-kpi-label">Taux de présence</div>
              <div className="an-kpi-value">{stats?.taux_presence ?? '—'}%</div>
              <div className="an-kpi-sub">{stats?.done ?? 0} consultations terminées</div>
              <div className="an-kpi-icon"><CheckCircle2 size={40} color="var(--green)"/></div>
            </div>
            <div className="an-kpi-card gold">
              <div className="an-kpi-label">Nouveaux patients</div>
              <div className="an-kpi-value">{stats?.new_patients ?? '—'}</div>
              <div className="an-kpi-sub">Enregistrés sur la période</div>
              <div className="an-kpi-icon"><Users size={40} color="var(--gold)"/></div>
            </div>
            <div className="an-kpi-card red">
              <div className="an-kpi-label">Annulations</div>
              <div className="an-kpi-value">{stats?.cancelled ?? '—'}</div>
              <div className="an-kpi-sub">RDV annulés</div>
              <div className="an-kpi-icon"><XCircle size={40} color="var(--red)"/></div>
            </div>
          </div>

          {/* Graphiques */}
          <div className="an-charts-grid">
            <div className="an-chart-card">
              <div className="an-chart-title"><CalendarDays size={15} color="#0EA5E9"/>Activité RDV</div>
              <canvas ref={chartRef1} className="an-chart-canvas" height={180}/>
            </div>
            <div className="an-chart-card">
              <div className="an-chart-title"><Users size={15} color="#0EA5E9"/>Nouveaux patients</div>
              <canvas ref={chartRef2} className="an-chart-canvas" height={180}/>
            </div>
          </div>

          {/* Tableau activité récente */}
          <div className="an-table-card">
            <div className="an-table-header">
              <TrendingUp size={15} color="#0EA5E9"/> Activité journalière
            </div>
            <div className="an-table-row an-table-head">
              <span>Date</span><span>RDV</span><span>Terminés</span><span>Nouveaux pts</span>
            </div>
            {daily.slice(-10).reverse().map(d => (
              <div key={d.date} className="an-table-row">
                <span className="an-cell">{new Date(d.date).toLocaleDateString('fr-TN', { weekday:'short', day:'2-digit', month:'short' })}</span>
                <span className="an-cell">{d.rdv}</span>
                <span className={`an-cell ${d.done > 0 ? 'green' : 'muted'}`}>{d.done}</span>
                <span className={`an-cell ${d.new_pt > 0 ? 'green' : 'muted'}`}>{d.new_pt}</span>
              </div>
            ))}
          </div>

          {/* Analytics avancés — toujours disponibles */}
          <AdvancedAnalytics tenantId={user?.tenant_id} daily={daily} stats={stats} period={period}/>
        </div>
      </div>
    </>
  )
}
