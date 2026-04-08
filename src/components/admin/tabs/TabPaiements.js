'use client'
import { useState } from 'react'
import { Download, Filter, TrendingUp, CheckCircle2, Clock, XCircle } from 'lucide-react'

const METHODS = {
  flouci:   { emoji: '📱', label: 'Flouci',   color: '#6366F1' },
  konnect:  { emoji: '💳', label: 'Konnect',  color: '#22D3EE' },
  d17:      { emoji: '📲', label: 'D17',      color: '#10B981' },
  virement: { emoji: '🏦', label: 'Virement', color: '#F59E0B' },
  especes:  { emoji: '💵', label: 'Espèces',  color: '#8B5CF6' },
  cheque:   { emoji: '📄', label: 'Chèque',   color: '#FB923C' },
}

const STATUS_UI = {
  completed: { label: 'Payé',     color: '#10B981', bg: 'rgba(16,185,129,0.1)',  Icon: CheckCircle2 },
  pending:   { label: 'En cours', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)',  Icon: Clock },
  failed:    { label: 'Échoué',   color: '#F87171', bg: 'rgba(248,113,113,0.1)', Icon: XCircle },
  upcoming:  { label: 'À venir',  color: '#525878', bg: 'rgba(82,88,120,0.1)',   Icon: Clock },
}

const MOCK_PAYMENTS = [
  { id: 'p1',  date: '08/04/2026', client: 'Mehdi Bouaziz',  desc: 'Achat annuel Pack Pro 2026',        amount: 450,  method: 'flouci',   status: 'completed', ref: 'FLC-2026-0481' },
  { id: 'p2',  date: '07/04/2026', client: 'Sonia Mejri',    desc: 'Achat annuel Pack Essentiel 2026',  amount: 300,  method: 'konnect',  status: 'completed', ref: 'KNT-2026-0229' },
  { id: 'p3',  date: '07/04/2026', client: 'Nadia Khediri',  desc: 'Abonnement mensuel Avr 2026',       amount: 35,   method: 'flouci',   status: 'completed', ref: 'FLC-2026-0480' },
  { id: 'p4',  date: '06/04/2026', client: 'Ahmed Trabelsi', desc: 'Achat unique Pack Partenaire',      amount: 1500, method: 'virement', status: 'completed', ref: 'VIR-2026-0042' },
  { id: 'p5',  date: '05/04/2026', client: 'Karim Lakhal',   desc: 'Achat annuel Pack Pro 2026',        amount: 450,  method: 'especes',  status: 'completed', ref: 'ESP-2026-0018' },
  { id: 'p6',  date: '05/04/2026', client: 'Farouk Saad',    desc: 'Abonnement mensuel Avr 2026',       amount: 40,   method: 'd17',      status: 'failed',    ref: 'D17-2026-0091' },
  { id: 'p7',  date: '04/04/2026', client: 'Youssef Ben Ali',desc: 'Abonnement mensuel Avr 2026',       amount: 35,   method: 'konnect',  status: 'completed', ref: 'KNT-2026-0228' },
  { id: 'p8',  date: '03/04/2026', client: 'Rim Azizi',      desc: 'Achat annuel Pack Essentiel 2026',  amount: 280,  method: 'cheque',   status: 'completed', ref: 'CHQ-2026-0011' },
  { id: 'p9',  date: '01/05/2026', client: 'Nadia Khediri',  desc: 'Abonnement mensuel Mai 2026',       amount: 35,   method: null,       status: 'upcoming',  ref: null },
  { id: 'p10', date: '01/05/2026', client: 'Mehdi Bouaziz',  desc: 'Abonnement mensuel Mai 2026',       amount: 35,   method: null,       status: 'upcoming',  ref: null },
]

const KPIS = [
  { label: 'Total ce mois',  value: '8 450 DT',  color: '#F59E0B', sub: 'Achat annuel + mensuel' },
  { label: 'Total annuel',   value: '31 200 DT', color: '#6366F1', sub: 'Depuis Jan 2026' },
  { label: 'Transactions',   value: '47',        color: '#10B981', sub: 'Ce mois' },
  { label: 'Méthode clé',    value: 'Flouci 📱', color: '#22D3EE', sub: '38% des transactions' },
]

export default function TabPaiements() {
  const [filter, setFilter] = useState('all')

  const filtered = filter === 'all' ? MOCK_PAYMENTS
    : MOCK_PAYMENTS.filter(p => p.status === filter)

  const CSS = `
    .adm-pay { padding:24px; overflow-y:auto; height:100%; }
    .adm-pay::-webkit-scrollbar { width:4px; }
    .adm-pay::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:4px; }

    .adm-pay-title { font-family:'Space Grotesk',sans-serif; font-weight:800;
      font-size:20px; color:var(--tx); margin-bottom:16px; }

    .adm-pay-kpis { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:20px; }
    @media(max-width:900px){ .adm-pay-kpis { grid-template-columns:repeat(2,1fr); } }
    @media(max-width:500px){ .adm-pay-kpis { grid-template-columns:1fr; } }

    .adm-pay-kpi { padding:16px; border-radius:12px; background:rgba(13,17,32,0.7);
      border:1px solid rgba(255,255,255,0.07); backdrop-filter:blur(10px); }
    .adm-pay-kpi-val { font-family:'Space Grotesk',sans-serif; font-weight:800;
      font-size:20px; margin-bottom:4px; }
    .adm-pay-kpi-label { font-size:11px; color:var(--tx-2); margin-bottom:3px; }
    .adm-pay-kpi-sub { font-size:10px; color:var(--tx-3); }

    .adm-pay-toolbar { display:flex; gap:8px; align-items:center; margin-bottom:14px; flex-wrap:wrap; }
    .adm-pay-filter { padding:5px 12px; border-radius:20px; font-size:11px; font-weight:600;
      border:1px solid rgba(255,255,255,0.1); background:transparent;
      color:var(--tx-2); cursor:pointer; transition:all 150ms; }
    .adm-pay-filter:hover { background:rgba(99,102,241,0.1); color:var(--tx); }
    .adm-pay-filter--active { background:rgba(99,102,241,0.15); border-color:rgba(99,102,241,0.4); color:var(--ac); }
    .adm-pay-export { margin-left:auto; display:flex; align-items:center; gap:6px;
      padding:6px 14px; border-radius:9px; border:1px solid rgba(255,255,255,0.1);
      background:rgba(255,255,255,0.04); color:var(--tx-2); font-size:11px; font-weight:600;
      cursor:pointer; transition:all 150ms; }
    .adm-pay-export:hover { background:rgba(99,102,241,0.1); color:var(--tx); }

    .adm-pay-table { background:rgba(13,17,32,0.7); border:1px solid rgba(255,255,255,0.07);
      border-radius:14px; overflow:hidden; backdrop-filter:blur(10px); }
    .adm-pay-table-head { display:grid;
      grid-template-columns:90px 1fr 1fr 100px 100px 100px;
      padding:10px 16px; border-bottom:1px solid rgba(255,255,255,0.07);
      font-size:10px; font-weight:700; color:var(--tx-3); letter-spacing:.06em; text-transform:uppercase; }
    .adm-pay-row { display:grid;
      grid-template-columns:90px 1fr 1fr 100px 100px 100px;
      padding:12px 16px; border-bottom:1px solid rgba(255,255,255,0.04);
      align-items:center; transition:background 150ms; }
    .adm-pay-row:last-child { border-bottom:none; }
    .adm-pay-row:hover { background:rgba(255,255,255,0.03); }

    .adm-pay-date { font-size:11px; color:var(--tx-3); font-family:'JetBrains Mono',monospace; }
    .adm-pay-client { font-size:12px; font-weight:600; color:var(--tx); }
    .adm-pay-desc { font-size:11px; color:var(--tx-3); margin-top:2px; }
    .adm-pay-method { display:flex; align-items:center; gap:5px; font-size:12px; }
    .adm-pay-amount { font-family:'JetBrains Mono',monospace; font-size:13px; font-weight:700; color:var(--gold); }
    .adm-pay-status { display:inline-flex; align-items:center; gap:5px;
      padding:3px 8px; border-radius:20px; font-size:10px; font-weight:700; }

    .adm-pay-mock { margin-top:20px; padding:12px 16px; border-radius:10px;
      background:rgba(245,158,11,0.07); border:1px solid rgba(245,158,11,0.2);
      font-size:12px; color:#F59E0B; }

    @media(max-width:768px){
      .adm-pay-table-head { display:none; }
      .adm-pay-row { grid-template-columns:1fr auto; grid-template-rows:auto auto;
        gap:4px; }
    }
  `

  const FILTERS = [
    { id: 'all',       label: 'Tous' },
    { id: 'completed', label: '✓ Payé' },
    { id: 'pending',   label: '⏳ En cours' },
    { id: 'upcoming',  label: '📅 À venir' },
    { id: 'failed',    label: '✗ Échoué' },
  ]

  return (
    <>
      <style>{CSS}</style>
      <div className="adm-pay">
        <div className="adm-pay-title">Paiements</div>

        <div className="adm-pay-kpis">
          {KPIS.map((k, i) => (
            <div key={i} className="adm-pay-kpi">
              <div className="adm-pay-kpi-val" style={{ color: k.color }}>{k.value}</div>
              <div className="adm-pay-kpi-label">{k.label}</div>
              <div className="adm-pay-kpi-sub">{k.sub}</div>
            </div>
          ))}
        </div>

        <div className="adm-pay-toolbar">
          {FILTERS.map(f => (
            <button
              key={f.id}
              className={`adm-pay-filter ${filter === f.id ? 'adm-pay-filter--active' : ''}`}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
          <button className="adm-pay-export">
            <Download size={12} /> Exporter CSV
          </button>
        </div>

        <div className="adm-pay-table">
          <div className="adm-pay-table-head">
            <span>Date</span>
            <span>Client</span>
            <span>Description</span>
            <span>Méthode</span>
            <span>Montant</span>
            <span>Statut</span>
          </div>

          {filtered.map(p => {
            const m = p.method ? METHODS[p.method] : null
            const s = STATUS_UI[p.status]
            const SIcon = s.Icon
            return (
              <div key={p.id} className="adm-pay-row">
                <span className="adm-pay-date">{p.date}</span>
                <div>
                  <div className="adm-pay-client">{p.client}</div>
                </div>
                <span className="adm-pay-desc">{p.desc}</span>
                <span className="adm-pay-method">
                  {m ? <>{m.emoji} <span style={{ color: m.color }}>{m.label}</span></> : '—'}
                </span>
                <span className="adm-pay-amount">{p.amount} DT</span>
                <span className="adm-pay-status" style={{ color: s.color, background: s.bg }}>
                  <SIcon size={10} /> {s.label}
                </span>
              </div>
            )
          })}
        </div>

        <div className="adm-pay-mock">
          ⚠️ <strong>Mode démo</strong> — Les transactions sont simulées. Les intégrations Flouci, Konnect et D17 seront activées en production avec vérification HMAC webhook.
        </div>
      </div>
    </>
  )
}
