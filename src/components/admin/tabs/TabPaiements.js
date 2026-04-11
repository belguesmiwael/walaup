'use client'
import { useState, useEffect } from 'react'
import { Download, CheckCircle2, Clock, XCircle, Plus, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase'

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

// Style constants
const sHead       = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }
const sTitle      = { fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: 20, color: 'var(--tx)' }
const sAddBtn     = { display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 9, background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', border: 'none', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }
const sEmpty      = { padding: '24px 16px', fontSize: 13, color: 'var(--tx-3)', textAlign: 'center' }
const sMsgOk      = { padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: 'var(--green)' }
const sMsgErr     = { padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: 'var(--red)' }
const sModalOv    = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }
const sModalCard  = { background: '#0D1120', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 18, padding: 24, width: 460, maxWidth: '92vw' }
const sModalTitle = { fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 16, color: 'var(--tx)', marginBottom: 18 }
const sLabel      = { fontSize: 11, fontWeight: 600, color: 'var(--tx-3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 5, display: 'block' }
const sInp        = { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 9, padding: '9px 12px', color: 'var(--tx)', fontSize: 13, outline: 'none', fontFamily: "'Inter',sans-serif", marginBottom: 12, boxSizing: 'border-box' }
const sModalRow   = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }
const sSaveBtn    = { width: '100%', padding: 11, borderRadius: 10, background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', marginTop: 4 }
const sDescTxt    = { fontSize: 11, color: 'var(--tx-3)' }
const sAmountTxt  = { fontFamily: "'JetBrains Mono',monospace", fontSize: 13, fontWeight: 700, color: 'var(--gold)' }
const sMethodTxt  = { fontSize: 12, color: 'var(--tx-2)' }

export default function TabPaiements() {
  const [payments, setPayments] = useState([])
  const [filter, setFilter]     = useState('all')
  const [kpis, setKpis]         = useState({ thisMonth: 0, total: 0, count: 0, topMethod: '—' })
  const [loading, setLoading]   = useState(true)
  const [showAdd, setShowAdd]   = useState(false)
  const [form, setForm]         = useState({ client_name: '', description: '', amount: '', method: 'flouci', status: 'completed', reference: '', lead_id: '' })
  const [leads, setLeads]       = useState([])
  const [formMsg, setFormMsg]   = useState(null)

  const fetchPayments = async () => {
    setLoading(true)
    const { data } = await supabase.from('payments').select('*, leads(name)').order('created_at', { ascending: false }).limit(100)
    if (data) {
      const enriched = data.map(p => ({
        ...p,
        client_name: p.client_name || p.leads?.name || '—',
        date: new Date(p.created_at).toLocaleDateString('fr-FR'),
      }))
      setPayments(enriched)
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const completed = enriched.filter(p => p.status === 'completed')
      const thisMonth = completed.filter(p => new Date(p.created_at) >= monthStart).reduce((s, p) => s + (p.amount || 0), 0)
      const total     = completed.reduce((s, p) => s + (p.amount || 0), 0)
      const mc = {};completed.forEach(p => { if (p.method) mc[p.method] = (mc[p.method] || 0) + 1 })
      const topMethod = Object.entries(mc).sort((a, b) => b[1] - a[1])[0]?.[0]
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
    if (!form.amount || !form.client_name) return setFormMsg({ type: 'error', text: 'Client et montant requis.' })
    const { error } = await supabase.from('payments').insert([{
      client_name: form.client_name, description: form.description,
      amount: parseFloat(form.amount), method: form.method,
      status: form.status, reference: form.reference || null,
      lead_id: form.lead_id || null, type: 'annual',
    }])
    if (error) return setFormMsg({ type: 'error', text: error.message })
    setShowAdd(false)
    setForm({ client_name: '', description: '', amount: '', method: 'flouci', status: 'completed', reference: '', lead_id: '' })
    setFormMsg(null)
    fetchPayments()
  }

  const exportCSV = () => {
    const rows = [['Date','Client','Description','Méthode','Montant (DT)','Statut','Référence']]
    filtered.forEach(p => rows.push([p.date, p.client_name, p.description || '', METHODS[p.method]?.label || '—', p.amount, STATUS_UI[p.status]?.label || p.status, p.reference || '']))
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
    a.download = `paiements-walaup-${new Date().toLocaleDateString('fr-FR')}.csv`
    a.click()
  }

  const filtered = filter === 'all' ? payments : payments.filter(p => p.status === filter)

  const kpiList = [
    { label: 'Total ce mois',  value: `${kpis.thisMonth.toLocaleString('fr-TN')} DT`, color: '#F59E0B' },
    { label: 'Total cumulé',   value: `${kpis.total.toLocaleString('fr-TN')} DT`,     color: '#6366F1' },
    { label: 'Transactions',   value: kpis.count,                                       color: '#10B981' },
    { label: 'Méthode clé',    value: kpis.topMethod,                                   color: '#22D3EE' },
  ]

  const FILTERS = [
    { id: 'all', label: 'Tous' }, { id: 'completed', label: '✓ Payé' },
    { id: 'pending', label: '⏳ En cours' }, { id: 'upcoming', label: '📅 À venir' }, { id: 'failed', label: '✗ Échoué' },
  ]

  const CSS = `
    .adm-pay { padding:24px; overflow-y:auto; height:100%; }
    .adm-pay::-webkit-scrollbar { width:4px; }
    .adm-pay::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:4px; }
    .adm-pay-kpis { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:20px; }
    @media(max-width:900px){ .adm-pay-kpis { grid-template-columns:repeat(2,1fr); } }
    .adm-pay-kpi { padding:16px; border-radius:12px; background:rgba(13,17,32,0.7); border:1px solid rgba(255,255,255,0.07); backdrop-filter:blur(10px); }
    .adm-pay-kpi-val { font-family:'Space Grotesk',sans-serif; font-weight:800; font-size:20px; margin-bottom:4px; }
    .adm-pay-kpi-label { font-size:11px; color:var(--tx-2); }
    .adm-pay-toolbar { display:flex; gap:8px; align-items:center; margin-bottom:14px; flex-wrap:wrap; }
    .adm-pay-filter { padding:5px 12px; border-radius:20px; font-size:11px; font-weight:600; border:1px solid rgba(255,255,255,0.1); background:transparent; color:var(--tx-2); cursor:pointer; transition:all 150ms; }
    .adm-pay-filter:hover { background:rgba(99,102,241,0.1); color:var(--tx); }
    .adm-pay-filter--active { background:rgba(99,102,241,0.15); border-color:rgba(99,102,241,0.4); color:var(--ac); }
    .adm-pay-export { display:flex; align-items:center; gap:6px; padding:6px 14px; border-radius:9px; border:1px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.04); color:var(--tx-2); font-size:11px; font-weight:600; cursor:pointer; transition:all 150ms; }
    .adm-pay-export:hover { background:rgba(99,102,241,0.1); color:var(--tx); }
    .adm-pay-table { background:rgba(13,17,32,0.7); border:1px solid rgba(255,255,255,0.07); border-radius:14px; overflow:hidden; backdrop-filter:blur(10px); }
    .adm-pay-table-head { display:grid; grid-template-columns:90px 130px 1fr 100px 100px 100px; padding:10px 16px; border-bottom:1px solid rgba(255,255,255,0.07); font-size:10px; font-weight:700; color:var(--tx-3); letter-spacing:.06em; text-transform:uppercase; }
    .adm-pay-row { display:grid; grid-template-columns:90px 130px 1fr 100px 100px 100px; padding:12px 16px; border-bottom:1px solid rgba(255,255,255,0.04); align-items:center; transition:background 150ms; }
    .adm-pay-row:last-child { border-bottom:none; }
    .adm-pay-row:hover { background:rgba(255,255,255,0.03); }
    .adm-pay-date { font-size:11px; color:var(--tx-3); font-family:'JetBrains Mono',monospace; }
    .adm-pay-client { font-size:12px; font-weight:600; color:var(--tx); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .adm-pay-status { display:inline-flex; align-items:center; gap:5px; padding:3px 8px; border-radius:20px; font-size:10px; font-weight:700; }
    @media(max-width:768px){ .adm-pay-table-head { display:none; } .adm-pay-row { grid-template-columns:1fr auto; gap:6px; } }
  `

  return (
    <>
      <style>{CSS}</style>
      <div className="adm-pay">
        <div style={sHead}>
          <span style={sTitle}>Paiements</span>
          <button style={sAddBtn} onClick={() => setShowAdd(true)}><Plus size={13} /> Enregistrer paiement</button>
        </div>

        <div className="adm-pay-kpis">
          {kpiList.map((k, i) => {
            const sKpiVal = { color: k.color }
            return (
              <div key={i} className="adm-pay-kpi">
                <div className="adm-pay-kpi-val" style={sKpiVal}>{loading ? '…' : k.value}</div>
                <div className="adm-pay-kpi-label">{k.label}</div>
              </div>
            )
          })}
        </div>

        <div className="adm-pay-toolbar">
          {FILTERS.map(f => (
            <button key={f.id} className={`adm-pay-filter${filter === f.id ? ' adm-pay-filter--active' : ''}`}
              onClick={() => setFilter(f.id)}>{f.label}</button>
          ))}
          <button className="adm-pay-export" onClick={fetchPayments}><RefreshCw size={11} /> Rafraîchir</button>
          <button className="adm-pay-export" onClick={exportCSV}><Download size={11} /> Exporter CSV</button>
        </div>

        <div className="adm-pay-table">
          {/* ✅ En-tête : 6 colonnes — Date | Client | Description | Méthode | Montant | Statut */}
          <div className="adm-pay-table-head">
            <span>Date</span>
            <span>Client</span>
            <span>Description</span>
            <span>Méthode</span>
            <span>Montant</span>
            <span>Statut</span>
          </div>
          {loading ? (
            <div style={sEmpty}>Chargement…</div>
          ) : filtered.length === 0 ? (
            <div style={sEmpty}>Aucun paiement trouvé.</div>
          ) : filtered.map(p => {
            const m = p.method ? METHODS[p.method] : null
            const s = STATUS_UI[p.status] || STATUS_UI.pending
            const SIcon = s.Icon
            const sStatus = { background: s.bg, color: s.color }
            return (
              <div key={p.id} className="adm-pay-row">
                {/* Col 1 — Date */}
                <span className="adm-pay-date">{p.date}</span>

                {/* Col 2 — Client */}
                <div className="adm-pay-client">{p.client_name}</div>

                {/* ✅ Col 3 — Description (fix: cellule séparée, ne fusionne plus avec client) */}
                <div style={sDescTxt}>{p.description || '—'}</div>

                {/* ✅ Col 4 — Méthode (fix: était décalée en col 3 avant) */}
                <div style={sMethodTxt}>{m ? <>{m.emoji} {m.label}</> : '—'}</div>

                {/* ✅ Col 5 — Montant (fix: était décalé en col 4) */}
                <div style={sAmountTxt}>{p.amount != null ? p.amount.toLocaleString('fr-TN') + ' DT' : '—'}</div>

                {/* ✅ Col 6 — Statut (fix: était vide avant — col 5 affichait le statut) */}
                <div className="adm-pay-status" style={sStatus}>
                  <SIcon size={10} />{s.label}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {showAdd && (
        <div style={sModalOv} onClick={() => setShowAdd(false)}>
          <div style={sModalCard} onClick={e => e.stopPropagation()}>
            <div style={sModalTitle}>Enregistrer un paiement</div>
            {formMsg && <div style={formMsg.type === 'success' ? sMsgOk : sMsgErr}>{formMsg.text}</div>}
            <label style={sLabel}>Client (lead)</label>
            <select style={sInp} value={form.lead_id} onChange={e => {
              const lead = leads.find(l => l.id === e.target.value)
              setForm(p => ({ ...p, lead_id: e.target.value, client_name: lead?.name || p.client_name }))
            }}>
              <option value="">— Sélectionner un lead —</option>
              {leads.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
            <label style={sLabel}>Nom client (manuel)</label>
            <input style={sInp} placeholder="Nom client" value={form.client_name} onChange={e => setForm(p => ({ ...p, client_name: e.target.value }))} />
            <label style={sLabel}>Description</label>
            <input style={sInp} placeholder="Ex: Pack Pro 2026" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            <div style={sModalRow}>
              <div>
                <label style={sLabel}>Montant (DT)</label>
                <input style={sInp} type="number" placeholder="450" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} />
              </div>
              <div>
                <label style={sLabel}>Méthode</label>
                <select style={sInp} value={form.method} onChange={e => setForm(p => ({ ...p, method: e.target.value }))}>
                  {Object.entries(METHODS).map(([k, v]) => <option key={k} value={k}>{v.emoji} {v.label}</option>)}
                </select>
              </div>
            </div>
            <div style={sModalRow}>
              <div>
                <label style={sLabel}>Statut</label>
                <select style={sInp} value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                  <option value="completed">✓ Payé</option>
                  <option value="pending">⏳ En cours</option>
                  <option value="upcoming">📅 À venir</option>
                  <option value="failed">✗ Échoué</option>
                </select>
              </div>
              <div>
                <label style={sLabel}>Référence</label>
                <input style={sInp} placeholder="FLC-2026-…" value={form.reference} onChange={e => setForm(p => ({ ...p, reference: e.target.value }))} />
              </div>
            </div>
            <button style={sSaveBtn} onClick={handleAdd}>Enregistrer le paiement</button>
          </div>
        </div>
      )}
    </>
  )
}
