'use client'
import { useEffect, useRef } from 'react'
import { TrendingUp, Users, CreditCard, Package, AlertTriangle, ArrowUpRight } from 'lucide-react'

// Mock data
const MOCK_KPIS = [
  { label: 'Leads ce mois',      value: 14,    unit: '',    color: '#6366F1', icon: Users,         trend: '+3 vs mois dernier' },
  { label: 'Revenus (DT)',       value: 8450,  unit: ' DT', color: '#F59E0B', icon: CreditCard,    trend: '+1200 DT vs mois dernier' },
  { label: 'Clients actifs',     value: 31,    unit: '',    color: '#10B981', icon: TrendingUp,    trend: '+2 ce mois' },
  { label: 'Apps en cours',      value: 5,     unit: '',    color: '#22D3EE', icon: Package,       trend: '3 en démo, 2 en dev' },
  { label: 'Abonnements actifs', value: 28,    unit: '',    color: '#8B5CF6', icon: TrendingUp,    trend: '18 Pro · 7 Ess · 3 Part' },
  { label: 'Résiliations',       value: 2,     unit: '',    color: '#F87171', icon: AlertTriangle, trend: 'Ce mois — motif collecté' },
]

const MOCK_REVENUE = [
  { month: 'Nov', annual: 3200, monthly: 840 },
  { month: 'Déc', month: 'Déc', annual: 4100, monthly: 960 },
  { month: 'Jan', annual: 5800, monthly: 1080 },
  { month: 'Fév', annual: 4400, monthly: 1020 },
  { month: 'Mar', annual: 7200, monthly: 1260 },
  { month: 'Avr', annual: 8450, monthly: 1380 },
]

const MOCK_ACTIVITY = [
  { time: 'Il y a 5 min',  type: 'lead',     text: 'Nouveau lead — Mehdi B. (App Café)', color: '#6366F1' },
  { time: 'Il y a 23 min', type: 'payment',  text: 'Paiement confirmé — Sonia M. — 450 DT (Flouci)', color: '#10B981' },
  { time: 'Il y a 1h',     type: 'delivery', text: 'App livrée — Ahmed T. (App Stock) — Pack Pro', color: '#F59E0B' },
  { time: 'Il y a 2h',     type: 'lead',     text: 'Nouveau lead — Karim L. (App Crèche)', color: '#6366F1' },
  { time: 'Il y a 3h',     type: 'cancel',   text: 'Résiliation — Farouk S. — motif: "Trop cher"', color: '#F87171' },
  { time: 'Hier 18:30',    type: 'payment',  text: 'Abonnement mensuel — Youssef B. — 35 DT (Konnect)', color: '#10B981' },
  { time: 'Hier 14:00',    type: 'lead',     text: 'Nouveau lead — Nadia K. (App Livraison)', color: '#6366F1' },
  { time: 'Hier 11:15',    type: 'delivery', text: 'App livrée — Rim A. (App Café) — Pack Essentiel', color: '#F59E0B' },
]

const PACK_DIST = [
  { label: 'Pack Pro',        count: 18, color: '#6366F1', pct: 58 },
  { label: 'Pack Essentiel',  count: 7,  color: '#10B981', pct: 23 },
  { label: 'Pack Partenaire', count: 3,  color: '#F59E0B', pct: 10 },
  { label: 'En attente',      count: 3,  color: '#525878', pct: 10 },
]

function KpiCard({ kpi, idx }) {
  const valRef = useRef(null)
  const Icon = kpi.icon

  useEffect(() => {
    const el = valRef.current
    if (!el) return
    const target = kpi.value
    const duration = 1200
    const start = performance.now()
    const step = (now) => {
      const t = Math.min((now - start) / duration, 1)
      const ease = 1 - Math.pow(1 - t, 3)
      el.textContent = Math.round(ease * target).toLocaleString('fr-TN') + kpi.unit
      if (t < 1) requestAnimationFrame(step)
    }
    const timer = setTimeout(() => requestAnimationFrame(step), idx * 80)
    return () => clearTimeout(timer)
  }, [kpi.value, kpi.unit, idx])

  return (
    <div className="adm-kpi-card">
      <div className="adm-kpi-head">
        <div className="adm-kpi-icon" style={{ background: `${kpi.color}18`, border: `1px solid ${kpi.color}40` }}>
          <Icon size={16} color={kpi.color} strokeWidth={1.8} />
        </div>
        <ArrowUpRight size={13} color="var(--tx-3)" />
      </div>
      <div className="adm-kpi-val" ref={valRef} style={{ color: kpi.color }}>0{kpi.unit}</div>
      <div className="adm-kpi-label">{kpi.label}</div>
      <div className="adm-kpi-trend">{kpi.trend}</div>
    </div>
  )
}

function RevenueChart() {
  const max = Math.max(...MOCK_REVENUE.map(r => r.annual + r.monthly))
  return (
    <div className="adm-chart-card">
      <div className="adm-chart-head">
        <div>
          <div className="adm-chart-title">Revenus — 6 derniers mois</div>
          <div className="adm-chart-sub">Achats annuels + abonnements mensuels (DT)</div>
        </div>
        <div className="adm-chart-legend">
          <span className="adm-legend-dot" style={{ background: '#6366F1' }} /> Annuel
          <span className="adm-legend-dot" style={{ background: '#F59E0B', marginLeft: 10 }} /> Mensuel
        </div>
      </div>
      <div className="adm-bars">
        {MOCK_REVENUE.map((r, i) => (
          <div key={i} className="adm-bar-col">
            <div className="adm-bar-stack" style={{ height: 120 }}>
              <div className="adm-bar-seg adm-bar-monthly" style={{ height: `${(r.monthly / max) * 100}%` }} />
              <div className="adm-bar-seg adm-bar-annual" style={{ height: `${(r.annual / max) * 100}%` }} />
            </div>
            <div className="adm-bar-month">{r.month || 'Avr'}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function PackChart() {
  return (
    <div className="adm-chart-card" style={{ flex: '0 0 260px' }}>
      <div className="adm-chart-title" style={{ marginBottom: 16 }}>Répartition packs</div>
      {PACK_DIST.map((p, i) => (
        <div key={i} style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span style={{ fontSize: 12, color: 'var(--tx-2)' }}>{p.label}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: p.color, fontFamily: 'JetBrains Mono' }}>{p.count}</span>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 3, width: `${p.pct}%`,
              background: p.color, transition: 'width 1s cubic-bezier(0.16,1,0.3,1)',
              boxShadow: `0 0 8px ${p.color}60`
            }} />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function TabOverview() {
  const CSS = `
    .adm-ov { padding:24px; overflow-y:auto; height:100%; }
    .adm-ov::-webkit-scrollbar { width:4px; }
    .adm-ov::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:4px; }
    .adm-ov-title { font-family:'Space Grotesk',sans-serif; font-weight:800;
      font-size:22px; color:var(--tx); margin-bottom:4px; }
    .adm-ov-sub { font-size:13px; color:var(--tx-3); margin-bottom:24px; }

    .adm-kpi-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; margin-bottom:20px; }
    @media(max-width:900px){ .adm-kpi-grid { grid-template-columns:repeat(2,1fr); } }
    @media(max-width:600px){ .adm-kpi-grid { grid-template-columns:1fr; } }

    .adm-kpi-card { background:rgba(13,17,32,0.7); border:1px solid rgba(255,255,255,0.08);
      border-radius:14px; padding:18px; backdrop-filter:blur(12px);
      transition:border-color 200ms; }
    .adm-kpi-card:hover { border-color:rgba(99,102,241,0.2); }
    .adm-kpi-head { display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; }
    .adm-kpi-icon { width:34px; height:34px; border-radius:9px; display:flex; align-items:center; justify-content:center; }
    .adm-kpi-val { font-family:'Space Grotesk',sans-serif; font-weight:800; font-size:28px;
      margin-bottom:4px; line-height:1; }
    .adm-kpi-label { font-size:12px; color:var(--tx-2); margin-bottom:4px; }
    .adm-kpi-trend { font-size:11px; color:var(--tx-3); }

    .adm-charts { display:flex; gap:14px; margin-bottom:20px; }
    @media(max-width:700px){ .adm-charts { flex-direction:column; } }

    .adm-chart-card { flex:1; background:rgba(13,17,32,0.7); border:1px solid rgba(255,255,255,0.08);
      border-radius:14px; padding:20px; backdrop-filter:blur(12px); }
    .adm-chart-head { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:18px; }
    .adm-chart-title { font-family:'Space Grotesk',sans-serif; font-weight:700; font-size:14px; color:var(--tx); }
    .adm-chart-sub { font-size:11px; color:var(--tx-3); margin-top:3px; }
    .adm-chart-legend { display:flex; align-items:center; font-size:11px; color:var(--tx-2); }
    .adm-legend-dot { width:8px; height:8px; border-radius:2px; display:inline-block; margin-right:5px; }

    .adm-bars { display:flex; align-items:flex-end; gap:8px; }
    .adm-bar-col { flex:1; display:flex; flex-direction:column; align-items:center; gap:6px; }
    .adm-bar-stack { width:100%; display:flex; flex-direction:column-reverse; gap:3px; }
    .adm-bar-seg { border-radius:4px; width:100%; transition:height 1s cubic-bezier(0.16,1,0.3,1); }
    .adm-bar-annual  { background:linear-gradient(180deg,#6366F1,#4f46e5); }
    .adm-bar-monthly { background:linear-gradient(180deg,#F59E0B,#d97706); }
    .adm-bar-month { font-size:10px; color:var(--tx-3); }

    .adm-bottom { display:flex; gap:14px; }
    @media(max-width:700px){ .adm-bottom { flex-direction:column; } }

    .adm-activity { flex:1; background:rgba(13,17,32,0.7); border:1px solid rgba(255,255,255,0.08);
      border-radius:14px; padding:20px; backdrop-filter:blur(12px); }
    .adm-activity-title { font-family:'Space Grotesk',sans-serif; font-weight:700;
      font-size:14px; color:var(--tx); margin-bottom:14px; }
    .adm-act-item { display:flex; gap:12px; align-items:flex-start; padding:8px 0;
      border-bottom:1px solid rgba(255,255,255,0.04); }
    .adm-act-item:last-child { border-bottom:none; }
    .adm-act-dot { width:8px; height:8px; border-radius:50%; margin-top:4px; flex-shrink:0; }
    .adm-act-text { font-size:12px; color:var(--tx-2); flex:1; line-height:1.5; }
    .adm-act-time { font-size:10px; color:var(--tx-3); white-space:nowrap; }
  `

  return (
    <>
      <style>{CSS}</style>
      <div className="adm-ov">
        <div className="adm-ov-title">Vue d'ensemble</div>
        <div className="adm-ov-sub">Données en temps réel · Walaup Platform · Avril 2026</div>

        <div className="adm-kpi-grid">
          {MOCK_KPIS.map((k, i) => <KpiCard key={i} kpi={k} idx={i} />)}
        </div>

        <div className="adm-charts">
          <RevenueChart />
          <PackChart />
        </div>

        <div className="adm-bottom">
          <div className="adm-activity">
            <div className="adm-activity-title">Activité récente</div>
            {MOCK_ACTIVITY.map((a, i) => (
              <div key={i} className="adm-act-item">
                <div className="adm-act-dot" style={{ background: a.color, boxShadow: `0 0 6px ${a.color}80` }} />
                <div className="adm-act-text">{a.text}</div>
                <div className="adm-act-time">{a.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
