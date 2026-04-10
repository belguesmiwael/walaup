'use client'
import { useState, useEffect } from 'react'
import { Download, CheckCircle2, Clock, XCircle, Plus, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const METHODS = {
  flouci:  { emoji: '📱', label: 'Flouci',  color: '#6366F1' },
  konnect: { emoji: '💳', label: 'Konnect', color: '#22D3EE' },
  d17:     { emoji: '📲', label: 'D17',     color: '#10B981' },
  virement:{ emoji: '🏦', label: 'Virement',color: '#F59E0B' },
  especes: { emoji: '💵', label: 'Espèces', color: '#8B5CF6' },
  cheque:  { emoji: '📄', label: 'Chèque',  color: '#FB923C' },
}

const STATUS_UI = {
  completed: { label: 'Payé',     color: '#10B981', bg: 'rgba(16,185,129,0.1)',  Icon: CheckCircle2 },
  pending:   { label: 'En cours', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', Icon: Clock },
  failed:    { label: 'Échoué',   color: '#F87171', bg: 'rgba(248,113,113,0.1)',Icon: XCircle },
  upcoming:  { label: 'À venir',  color: '#525878', bg: 'rgba(82,88,120,0.1)',  Icon: Clock },
}

export default function TabPaiements() {
  const [payments, setPayments] = useState([])
  const [filter, setFilter] = useState('all')
  const [kpis, setKpis] = useState({ thisMonth: 0, total: 0, count: 0, topMethod: '—' })
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ client_name: '', description: '', amount: '', method: 'flouci', status: 'completed', reference: '', lead_id: '' })
  const [leads, setLeads] = useState([])

  const fetchPayments = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('payments')
      .select('*, leads(name)')
      .order('created_at', { ascending: false })
      .limit(100)
    if (data) {
      const enriched = data.map(p => ({
        ...p,
        client_name: p.client_name || p.leads?.name || '—',
        date: new Date(p.created_at).toLocaleDateString('fr-FR'),
      }))
      setPayments(enriched)

      // KPIs
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const completed = enriched.filter(p => p.status === 'completed')
      const thisMonth = completed.filter(p => new Date(p.created_at) >= monthStart).reduce((s, p) => s + (p.amount || 0), 0)
      const total = completed.reduce((s, p) => s + (p.amount || 0), 0)
      const methodCounts = {}
      completed.forEach(p => { if (p.method) methodCounts[p.method] = (methodCounts[p.method] || 0) + 1 })
      const topMethod = Object.entries(methodCounts).sort((a, b) => b[1] - a[1])[0]?.[0]
      setKpis({ thisMonth, total, count: completed.length, topMethod: topMethod ? `${METHODS[topMethod]?.emoji} ${METHODS[topMethod]?.label}` : '—' })
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchPayments()
    supabase.from('leads').select('id, name').then(({ data }) => setLeads(data || []))
    const ch = supabase.channel('admin-payments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, fetchPayments)
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [])

  const handleAdd = async () => {
    if (!form.amount || !form.client_name) return
    const { error } = await supabase.from('payments').insert([{
      client_name: form.client_name,
      description: form.description,
      amount: parseFloat(form.amount),
      method: form.method,
      status: form.status,
      reference: form.reference || null,
      lead_id: form.lead_id || null,
      type: 'annual',
    }])
    if (!error) { setShowAdd(false); setForm({ client_name: '', description: '', amount: '', method: 'flouci', status: 'completed', reference: '', lead_id: '' }); fetchPayments() }
  }

  const exportCSV = () => {
    const rows = [['Date', 'Client', 'Description', 'Méthode', 'Montant (DT)', 'Statut', 'Référence']]
    filtered.forEach(p => rows.push([p.date, p.client_name, p.description || '', METHODS[p.method]?.label || '—', p.amount, STATUS_UI[p.status]?.label || p.status, p.reference || '']))
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
    a.download = `paiements-walaup-${new Date().toLocaleDateString('fr-FR')}.csv`
    a.click()
  }

  const filtered = filter === 'all' ? payments : payments.filter(p => p.status === filter)

  const CSS = `
    .adm-pay { padding:24px; overflow-y:auto; height:100%; }
    .adm-pay::-webkit-scrollbar { width:4px; }
    .adm-pay::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:4px; }
    .adm-pay-head { display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; flex-wrap:wrap; gap:10px; }
    .adm-pay-title { font-family:'Space Grotesk',sans-serif; font-weight:800; font-size:20px; color:var(--tx); }
    .adm-pay-kpis { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:20px; }
    @media(max-width:900px){ .adm-pay-kpis { grid-template-columns:repeat(2,1fr); } }
    .adm-pay-kpi { padding:16px; border-radius:12px; background:rgba(13,17,32,0.7); border:1px solid rgba(255,255,255,0.07); backdrop-filter:blur(10px); }
    .adm-pay-kpi-val { font-family:'Space Grotesk',sans-serif; font-weight:800; font-size:20px; margin-bottom:4px; }
    .adm-pay-kpi-label { font-size:11px; color:var(--tx-2); }
    .adm-pay-toolbar { display:flex; gap:8px; align-items:center; margin-bottom:14px; flex-wrap:wrap; }
    .adm-pay-filter { padding:5px 12px; border-radius:20px; font-size:11px; font-weight:600; border:1px solid rgba(255,255,255,0.1); background:transparent; color:var(--tx-2); cursor:pointer; transition:all 150ms; }
    .adm-pay-filter:hover { background:rgba(99,102,241,0.1); color:var(--tx); }
    .adm-pay-filter--active { background:rgba(99,102,241,0.15); border-color:rgba(99,102,241,0.4); color:var(--ac); }
    .adm-pay-export { margin-left:auto; display:flex; align-items:center; gap:6px; padding:6px 14px; border-radius:9px; border:1px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.04); color:var(--tx-2); font-size:11px; font-weight:600; cursor:pointer; transition:all 150ms; }
    .adm-pay-export:hover { background:rgba(99,102,241,0.1); color:var(--tx); }
    .adm-pay-add { display:flex; align-items:center; gap:6px; padding:6px 14px; border-radius:9px; background:linear-gradient(135deg,#6366F1,#8B5CF6); border:none; color:#fff; font-size:11px; font-weight:700; cursor:pointer; }
    .adm-pay-table { background:rgba(13,17,32,0.7); border:1px solid rgba(255,255,255,0.07); border-radius:14px; overflow:hidden; backdrop-filter:blur(10px); }
    .adm-pay-table-head { display:grid; grid-template-columns:90px 1fr 1fr 100px 100px 100px; padding:10px 16px; border-bottom:1px solid rgba(255,255,255,0.07); font-size:10px; font-weight:700; color:var(--tx-3); letter-spacing:.06em; text-transform:uppercase; }
    .adm-pay-row { display:grid; grid-template-columns:90px 1fr 1fr 100px 100px 100px; padding:12px 16px; border-bottom:1px solid rgba(255,255,255,0.04); align-items:center; transition:background 150ms; }
    .adm-pay-row:last-child { border-bottom:none; }
    .adm-pay-row:hover { background:rgba(255,255,255,0.03); }
    .adm-pay-date { font-size:11px; color:var(--tx-3); font-family:'JetBrains Mono',monospace; }
    .adm-pay-client { font-size:12px; font-weight:600; color:var(--tx); }
    .adm-pay-desc { font-size:11px; color:var(--tx-3); margin-top:2px; }
    .adm-pay-amount { font-family:'JetBrains Mono',monospace; font-size:13px; font-weight:700; color:var(--gold); }
    .adm-pay-status { display:inline-flex; align-items:center; gap:5px; padding:3px 8px; border-radius:20px; font-size:10px; font-weight:700; }
    .adm-modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.7); z-index:9000; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(4px); }
    .adm-modal-card { background:#0D1120; border:1px solid rgba(255,255,255,0.12); border-radius:18px; padding:24px; width:460px; max-width:92vw; }
    .adm-modal-title { font-family:'Space Grotesk',sans-serif; font-weight:700; font-size:16px; color:var(--tx); margin-bottom:18px; }
    .adm-modal-label { font-size:11px; font-weight:600; color:var(--tx-3); text-transform:uppercase; letter-spacing:.06em; margin-bottom:5px; display:block; }
    .adm-modal-inp { width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:9px; padding:9px 12px; color:var(--tx); font-size:13px; outline:none; font-family:'Inter',sans-serif; margin-bottom:12px; box-sizing:border-box; }
    .adm-modal-inp:focus { border-color:rgba(99,102,241,0.4); }
    .adm-modal-row { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
    .adm-modal-save { width:100%; padding:11px; border-radius:10px; background:linear-gradient(135deg,#6366F1,#8B5CF6); border:none; color:#fff; font-size:13px; font-weight:700; cursor:pointer; margin-top:4px; }
    @media(max-width:768px){ .adm-pay-table-head { display:none; } .adm-pay-row { grid-template-columns:1fr auto; } }
  `

  const FILTERS = [
    { id: 'all', label: 'Tous' },
    { id: 'completed', label: '✓ Payé' },
    { id: 'pending', label: '⏳ En cours' },
    { id: 'upcoming', label: '📅 À venir' },
    { id: 'failed', label: '✗ Échoué' },
  ]

  const kpiList = [
    { label: 'Total ce mois', value: `${kpis.thisMonth.toLocaleString('fr-TN')} DT`, color: '#F59E0B' },
    { label: 'Total cumulé', value: `${kpis.total.toLocaleString('fr-TN')} DT`, color: '#6366F1' },
    { label: 'Transactions', value: kpis.count, color: '#10B981' },
    { label: 'Méthode clé', value: kpis.topMethod, color: '#22D3EE' },
  ]

  return (
    <>
      <style>{CSS}</style>
      <div className="adm-pay">
        <div className="adm-pay-head">
          <div className="adm-pay-title">Paiements</div>
          <button className="adm-pay-add" onClick={() => setShowAdd(true)}><Plus size={13} /> Enregistrer paiement</button>
        </div>

        <div className="adm-pay-kpis">
          {kpiList.map((k, i) => (
            <div key={i} className="adm-pay-kpi">
              <div className="adm-pay-kpi-val" style= color: k.color >{loading ? '…' : k.value}</div>
              <div className="adm-pay-kpi-label">{k.label}</div>
            </div>
          ))}
        </div>

        <div className="adm-pay-toolbar">
          {FILTERS.map(f => (
            <button key={f.id} className={`adm-pay-filter${filter === f.id ? ' adm-pay-filter--active' : ''}`} onClick={() => setFilter(f.id)}>{f.label}</button>
          ))}
          <button className="adm-pay-export" onClick={fetchPayments}><RefreshCw size={11} /> Rafraîchir</button>
          <button className="adm-pay-export" onClick={exportCSV}><Download size={11} /> Exporter CSV</button>
        </div>

        <div className="adm-pay-table">
          <div className="adm-pay-table-head">
            <span>Date</span><span>Client</span><span>Description</span><span>Méthode</span><span>Montant</span><span>Statut</span>
          </div>
          {loading ? (
            <div style= padding: '24px 16px', fontSize: 13, color: 'var(--tx-3)', textAlign: 'center' >Chargement…</div>
          ) : filtered.length === 0 ? (
            <div style= padding: '24px 16px', fontSize: 13, color: 'var(--tx-3)', textAlign: 'center' >Aucun paiement trouvé.</div>
          ) : filtered.map(p => {
            const m = p.method ? METHODS[p.method] : null
            const s = STATUS_UI[p.status] || STATUS_UI.pending
            const SIcon = s.Icon
            return (
              <div key={p.id} className="adm-pay-row">
                <span className="adm-pay-date">{p.date}</span>
                <div>
                  <div className="adm-pay-client">{p.client_name}</div>
                  {p.description && <div className="adm-pay-desc">{p.description}</div>}
                </div>
                <div style= fontSize: 12, color: 'var(--tx-2)' >{m ? <>{m.emoji} {m.label}</> : '—'}</div>
                <div className="adm-pay-amount">{p.amount?.toLocaleString('fr-TN')} DT</div>
                <div className="adm-pay-status" style= background: s.bg, color: s.color >
                  <SIcon size={10} />{s.label}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {showAdd && (
        <div className="adm-modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="adm-modal-card" onClick={e => e.stopPropagation()}>
            <div className="adm-modal-title">Enregistrer un paiement</div>
            <label className="adm-modal-label">Client (lead)</label>
            <select className="adm-modal-inp" value={form.lead_id} onChange={e => {
              const lead = leads.find(l => l.id === e.target.value)
              setForm(p => ({ ...p, lead_id: e.target.value, client_name: lead?.name || p.client_name }))
            }}>
              <option value="">— Sélectionner un lead —</option>
              {leads.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
            <label className="adm-modal-label">Nom client (manuel)</label>
            <input className="adm-modal-inp" placeholder="Nom client" value={form.client_name} onChange={e => setForm(p => ({ ...p, client_name: e.target.value }))} />
            <label className="adm-modal-label">Description</label>
            <input className="adm-modal-inp" placeholder="Ex: Pack Pro 2026" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            <div className="adm-modal-row">
              <div>
                <label className="adm-modal-label">Montant (DT)</label>
                <input className="adm-modal-inp" type="number" placeholder="450" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} />
              </div>
              <div>
                <label className="adm-modal-label">Méthode</label>
                <select className="adm-modal-inp" value={form.method} onChange={e => setForm(p => ({ ...p, method: e.target.value }))}>
                  {Object.entries(METHODS).map(([k, v]) => <option key={k} value={k}>{v.emoji} {v.label}</option>)}
                </select>
              </div>
            </div>
            <div className="adm-modal-row">
              <div>
                <label className="adm-modal-label">Statut</label>
                <select className="adm-modal-inp" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                  <option value="completed">✓ Payé</option>
                  <option value="pending">⏳ En cours</option>
                  <option value="upcoming">📅 À venir</option>
                  <option value="failed">✗ Échoué</option>
                </select>
              </div>
              <div>
                <label className="adm-modal-label">Référence</label>
                <input className="adm-modal-inp" placeholder="FLC-2026-…" value={form.reference} onChange={e => setForm(p => ({ ...p, reference: e.target.value }))} />
              </div>
            </div>
            <button className="adm-modal-save" onClick={handleAdd}>Enregistrer le paiement</button>
          </div>
        </div>
      )}
    </>
  )
}
