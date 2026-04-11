'use client'
import { useState, useEffect, useCallback } from 'react'
import {
  Calendar, RefreshCw, Download, XCircle, Zap, CheckCircle2,
  CreditCard, Clock, AlertCircle, ExternalLink, Lock, Eye,
  EyeOff, BookOpen, Smartphone, Copy, ChevronRight, Sparkles
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { WalaupSound } from '@/lib/sound'

// ─── Shared helpers ───────────────────────────────────────────────────────────
const PAYMENT_METHODS = [
  { id: 'flouci',   label: 'Flouci',   emoji: '📱', desc: 'Portefeuille mobile' },
  { id: 'konnect',  label: 'Konnect',  emoji: '💳', desc: 'Carte Visa/Mastercard' },
  { id: 'd17',      label: 'D17',      emoji: '📲', desc: 'Mobile payment' },
  { id: 'virement', label: 'Virement', emoji: '🏦', desc: 'Virement bancaire' },
  { id: 'especes',  label: 'Espèces',  emoji: '💵', desc: 'Paiement en main' },
  { id: 'cheque',   label: 'Chèque',   emoji: '📄', desc: 'Chèque bancaire' },
]

function parseMeta(note) {
  if (!note) return {}
  try {
    if (note.startsWith('walaup_demos:')) return JSON.parse(note.slice(13))
  } catch {}
  return {}
}
function encodeMeta(m) { return 'walaup_demos:' + JSON.stringify(m) }
function deepClone(o) { return JSON.parse(JSON.stringify(o)) }

function addHistory(meta, event, description) {
  const m = deepClone(meta)
  if (!m.history) m.history = []
  if (!m.history.find(h => h.event === event)) {
    m.history.push({ event, description, date: new Date().toISOString() })
  }
  return m
}

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function addYears(d, n) { const dt = new Date(d); dt.setFullYear(dt.getFullYear() + n); return dt }
function addMonths(d, n) { const dt = new Date(d); dt.setMonth(dt.getMonth() + n); return dt }

const SHARED_CSS = `
  .ct-card {
    background:rgba(13,17,32,.60);
    border:1px solid rgba(255,255,255,.07);
    border-radius:18px;
    padding:20px;
    margin-bottom:14px;
    backdrop-filter:blur(14px);
  }
  .ct-card-title {
    font-size:11px; font-weight:700; color:var(--tx-3);
    text-transform:uppercase; letter-spacing:.08em;
    margin-bottom:14px; display:flex; align-items:center; gap:7px;
  }
  .ct-row { display:flex; align-items:center; justify-content:space-between; padding:10px 0; border-bottom:1px solid rgba(255,255,255,.05); gap:12px; }
  .ct-row:last-child { border-bottom:none; }
  .ct-row-label { font-size:12px; color:var(--tx-3); display:flex; align-items:center; gap:7px; }
  .ct-row-value { font-size:13px; color:var(--tx); font-weight:600; text-align:right; }
  .ct-btn { display:inline-flex; align-items:center; gap:7px; padding:9px 16px; border-radius:11px; font-size:12px; font-weight:700; cursor:pointer; border:none; font-family:'Inter',sans-serif; transition:all .18s; }
  .ct-btn--primary { background:linear-gradient(135deg,var(--ac),var(--ac-2)); color:#fff; }
  .ct-btn--gold { background:linear-gradient(135deg,#F59E0B,#D97706); color:#fff; }
  .ct-btn--ghost { background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.1); color:var(--tx-2); }
  .ct-btn--danger { background:rgba(248,113,113,.1); border:1px solid rgba(248,113,113,.2); color:#F87171; }
  .ct-btn--green { background:linear-gradient(135deg,#10B981,#059669); color:#fff; }
  .ct-btn:hover:not(:disabled) { transform:translateY(-1px); filter:brightness(1.08); }
  .ct-btn:disabled { opacity:.4; cursor:not-allowed; transform:none; }
  .ct-status-pill { display:inline-flex; align-items:center; gap:5px; padding:3px 10px; border-radius:20px; font-size:10px; font-weight:700; }
  .ct-badge-pack { display:inline-flex; align-items:center; gap:5px; padding:4px 13px; border-radius:20px; font-size:12px; font-weight:700; }
  /* Payment modal */
  .ct-modal-ov { position:fixed; inset:0; background:rgba(0,0,0,0.78); z-index:8000; display:flex; align-items:center; justify-content:center; padding:20px; backdrop-filter:blur(6px); }
  .ct-modal { background:#0D1120; border:1px solid rgba(255,255,255,.12); border-radius:20px; padding:24px; width:460px; max-width:100%; box-shadow:0 24px 80px rgba(0,0,0,.7); max-height:88vh; overflow-y:auto; }
  .ct-modal::-webkit-scrollbar { width:3px; }
  .ct-modal::-webkit-scrollbar-thumb { background:rgba(255,255,255,.1); border-radius:2px; }
  .ct-modal-title { font-family:'Space Grotesk',sans-serif; font-weight:800; font-size:18px; color:var(--tx); margin-bottom:4px; }
  .ct-modal-sub { font-size:13px; color:var(--tx-2); margin-bottom:18px; line-height:1.5; }
  .ct-method-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:16px; }
  .ct-method-card { padding:11px 13px; border-radius:11px; border:1.5px solid rgba(255,255,255,.09); background:rgba(255,255,255,.03); cursor:pointer; transition:all .18s; text-align:left; }
  .ct-method-card--on { border-color:rgba(99,102,241,.5); background:rgba(99,102,241,.1); }
  .ct-method-emoji { font-size:18px; margin-bottom:5px; }
  .ct-method-name { font-size:12px; font-weight:700; color:var(--tx); margin-bottom:2px; }
  .ct-method-desc { font-size:10px; color:var(--tx-3); }
  .ct-amount-box { background:rgba(245,158,11,.07); border:1px solid rgba(245,158,11,.2); border-radius:11px; padding:14px; margin-bottom:16px; display:flex; align-items:center; justify-content:space-between; }
  .ct-amount-value { font-family:'JetBrains Mono',monospace; font-size:24px; font-weight:800; color:var(--gold); }
  .ct-confirm-btn { width:100%; padding:12px; border-radius:12px; background:linear-gradient(135deg,#6366F1,#8B5CF6); border:none; color:#fff; font-size:14px; font-weight:700; cursor:pointer; font-family:'Space Grotesk',sans-serif; display:flex; align-items:center; justify-content:center; gap:8px; }
  .ct-confirm-btn:disabled { opacity:.5; cursor:not-allowed; }
  .ct-cancel-btn { width:100%; padding:10px; border-radius:11px; background:transparent; border:1px solid rgba(255,255,255,.1); color:var(--tx-3); font-size:12px; cursor:pointer; margin-top:7px; font-family:'Inter',sans-serif; }
  /* Credential card */
  .ct-cred-card { background:rgba(8,11,20,.6); border:1px solid rgba(99,102,241,.15); border-radius:13px; padding:16px; margin-bottom:10px; }
  .ct-cred-row { display:flex; align-items:center; gap:10px; margin-bottom:9px; }
  .ct-cred-label { font-size:10px; font-weight:700; color:var(--tx-3); text-transform:uppercase; letter-spacing:.06em; width:70px; flex-shrink:0; }
  .ct-cred-val { flex:1; font-family:'JetBrains Mono',monospace; font-size:13px; color:var(--tx); background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.08); border-radius:8px; padding:7px 11px; }
  .ct-copy-btn { width:30px; height:30px; border-radius:8px; border:1px solid rgba(255,255,255,.1); background:rgba(255,255,255,.04); color:var(--tx-3); cursor:pointer; display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:all .15s; }
  .ct-copy-btn:hover { background:rgba(99,102,241,.12); color:var(--ac); }
  /* Payment list */
  .ct-pay-item { display:flex; gap:12px; align-items:flex-start; padding:13px 0; border-bottom:1px solid rgba(255,255,255,.05); }
  .ct-pay-item:last-child { border-bottom:none; }
  .ct-pay-icon { width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
  .ct-pay-body { flex:1; min-width:0; }
  .ct-pay-desc { font-size:13px; color:var(--tx); font-weight:600; margin-bottom:3px; }
  .ct-pay-meta { font-size:11px; color:var(--tx-3); }
  .ct-pay-right { text-align:right; flex-shrink:0; }
  .ct-pay-amount { font-size:14px; font-weight:700; font-family:'JetBrains Mono',monospace; }
  /* Timeline payment */
  @keyframes ct-pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
  .ct-pulse { animation:ct-pulse 1.8s ease-in-out infinite; }
`

// ─── Shared Payment Modal ─────────────────────────────────────────────────────
function PaymentModal({ title, subtitle, amount, onClose, onConfirm, saving }) {
  const [method, setMethod] = useState('flouci')
  const sel = PAYMENT_METHODS.find(p => p.id === method)

  const instructions = {
    flouci:   ['Ouvrez l\'app Flouci', 'Envoyez ' + amount + ' DT au : 00 000 000', 'Envoyez une capture à votre conseiller Walaup'],
    konnect:  ['Cliquez "Confirmer" pour accéder au paiement sécurisé', 'Entrez vos infos de carte', 'Validez et revenez ici'],
    d17:      ['Ouvrez D17 → "Paiement marchand"', 'Montant : ' + amount + ' DT', 'Envoyez une capture à votre conseiller'],
    virement: ['Banque : BIAT — RIB : 08 006 0123456789012 56', 'Montant exact : ' + amount + ' DT', 'Objet : Walaup Paiement'],
    especes:  ['Contactez votre conseiller pour un rendez-vous', 'Montant : ' + amount + ' DT', 'Un reçu vous sera remis'],
    cheque:   ['Libellé : "Walaup" — Montant : ' + amount + ' DT', 'Remise en main propre ou par courrier', 'Confirmation sous 2-3 jours ouvrés'],
  }

  return (
    <div className="ct-modal-ov" onClick={onClose}>
      <div className="ct-modal" onClick={e => e.stopPropagation()}>
        <div className="ct-modal-title">{title}</div>
        <div className="ct-modal-sub">{subtitle}</div>
        <div className="ct-amount-box">
          <div>
            <div style={{ fontSize: 11, color: 'var(--tx-3)', marginBottom: 4 }}>Montant à payer</div>
            <div className="ct-amount-value">{amount} DT</div>
          </div>
          <div style={{ fontSize: 36 }}>💳</div>
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--tx-3)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 9 }}>Méthode de paiement</div>
        <div className="ct-method-grid">
          {PAYMENT_METHODS.map(pm => (
            <button key={pm.id} className={`ct-method-card${method === pm.id ? ' ct-method-card--on' : ''}`} onClick={() => setMethod(pm.id)}>
              <div className="ct-method-emoji">{pm.emoji}</div>
              <div className="ct-method-name">{pm.label}</div>
              <div className="ct-method-desc">{pm.desc}</div>
            </button>
          ))}
        </div>
        {instructions[method] && (
          <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 11, padding: '12px 14px', marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--tx-3)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 9 }}>
              {sel?.emoji} Instructions — {sel?.label}
            </div>
            {instructions[method].map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 9, marginBottom: 7, alignItems: 'flex-start' }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(99,102,241,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 10, fontWeight: 700, color: 'var(--ac)' }}>{i + 1}</div>
                <span style={{ fontSize: 12, color: 'var(--tx-2)', lineHeight: 1.5 }}>{s}</span>
              </div>
            ))}
          </div>
        )}
        <button className="ct-confirm-btn" onClick={() => onConfirm(method)} disabled={saving}>
          {saving ? 'Envoi…' : '✉️ Confirmer et notifier Walaup'}
        </button>
        <button className="ct-cancel-btn" onClick={onClose}>Annuler</button>
        <p style={{ fontSize: 11, color: 'var(--tx-3)', textAlign: 'center', marginTop: 10, lineHeight: 1.5 }}>
          Notre équipe confirme la réception sous 24h.
        </p>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB ABONNEMENT
// ══════════════════════════════════════════════════════════════════════════════
export function TabAbonnement({ lead, setLead }) {
  const [config, setConfig] = useState(null)
  const [monet, setMonet] = useState(false)  // modal monétisation
  const [saving, setSaving] = useState(false)
  const [confirm, setConfirm] = useState(null)  // 'cancel' | 'export'

  useEffect(() => {
    supabase.from('config').select('value').eq('key', 'tarifs').maybeSingle()
      .then(({ data }) => { if (data) setConfig(data.value) })
  }, [])

  if (!lead) return (
    <>
      <style>{SHARED_CSS}</style>
      <div style={{ padding: 24, color: 'var(--tx-3)', fontSize: 14 }}>Aucun abonnement actif.</div>
    </>
  )

  const pack    = (lead.pack || '').toLowerCase()
  const isPro   = pack === 'pro'
  const isEss   = pack === 'essentiel' || pack === 'essential'
  const isMensuel = isPro

  const startDate = lead.pay_confirmed_at || lead.created_at
  const renewAnnual  = startDate ? fmtDate(addYears(startDate, 1)) : '—'
  const renewMonthly = startDate ? fmtDate(addMonths(startDate, 1)) : '—'

  const monetAmount = config?.pro?.monetization_extra || config?.monetisation || 0

  const packColors = {
    essentiel: { color: '#22D3EE', bg: 'rgba(34,211,238,.1)' },
    essential:  { color: '#22D3EE', bg: 'rgba(34,211,238,.1)' },
    pro:       { color: '#8B5CF6', bg: 'rgba(139,92,246,.1)' },
    partenaire: { color: '#F59E0B', bg: 'rgba(245,158,11,.1)' },
  }
  const pc = packColors[pack] || packColors.pro

  const handleMonetPay = async (method) => {
    if (!lead?.id) return
    setSaving(true)
    WalaupSound.send()
    const meta = parseMeta(lead.note)
    let m = deepClone({ demos: [], finalUrl: '', payStatus: meta.payStatus || 'none', history: meta.history || [], ...meta })
    m = addHistory(m, 'monetisation_requested', `Demande de monétisation Pack Partenaire — ${monetAmount} DT via ${method}`)
    await supabase.from('leads').update({ note: encodeMeta(m), pay_method: method }).eq('id', lead.id)
    await supabase.from('payments').insert({
      lead_id: lead.id,
      client_name: lead.name,
      description: 'Monétisation — Pack Pro → Partenaire',
      method,
      amount: monetAmount,
      status: 'pending',
      type: 'monetization',
    })
    await supabase.from('messages').insert({
      lead_id: lead.id, sender: 'client',
      text: `⭐ J'ai effectué le paiement de monétisation (${monetAmount} DT) via ${method}. Je souhaite passer au Pack Partenaire.`
    })
    const { data } = await supabase.from('leads').select('*').eq('id', lead.id).maybeSingle()
    if (data && setLead) setLead(data)
    setMonet(false)
    setSaving(false)
    WalaupSound.success()
  }

  const handleCancelSubscription = async () => {
    if (!lead?.id) return
    setSaving(true)
    await supabase.from('leads').update({ status: 'cancelled' }).eq('id', lead.id)
    await supabase.from('messages').insert({
      lead_id: lead.id, sender: 'client',
      text: '🔴 Je souhaite résilier mon abonnement Walaup. Merci de traiter ma demande.'
    })
    const { data } = await supabase.from('leads').select('*').eq('id', lead.id).maybeSingle()
    if (data && setLead) setLead(data)
    setConfirm(null)
    setSaving(false)
  }

  const handleExportData = async () => {
    if (!lead?.id) return
    setSaving(true)
    await supabase.from('messages').insert({
      lead_id: lead.id, sender: 'client',
      text: '📦 Je souhaite récupérer mes données et que celles-ci soient supprimées de votre base de données conformément à mes droits.'
    })
    setConfirm(null)
    setSaving(false)
    WalaupSound.success()
    alert('✅ Votre demande d\'export de données a été envoyée. Notre équipe vous contactera sous 48h.')
  }

  return (
    <>
      <style>{SHARED_CSS}</style>
      {monet && (
        <PaymentModal
          title="Monétiser — Pack Partenaire"
          subtitle={`Passez au Pack Partenaire et accédez à tous ses avantages en payant ${monetAmount} DT.`}
          amount={monetAmount}
          onClose={() => setMonet(false)}
          onConfirm={handleMonetPay}
          saving={saving}
        />
      )}

      {/* Confirm dialog */}
      {confirm && (
        <div className="ct-modal-ov" onClick={() => setConfirm(null)}>
          <div className="ct-modal" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <div className="ct-modal-title">{confirm === 'cancel' ? '🔴 Résiliation' : '📦 Récupérer mes données'}</div>
            <div className="ct-modal-sub">
              {confirm === 'cancel'
                ? 'En résiliant, votre espace client et vos applications resteront accessibles jusqu\'à la fin de la période en cours. Cette action est irréversible.'
                : 'Notre plateforme garantit la sécurité de vos données. En récupérant vos données, elles seront exportées puis supprimées définitivement de notre base de données.'}
            </div>
            <button
              className={`ct-confirm-btn${confirm === 'cancel' ? '' : ''}`}
              style={confirm === 'cancel' ? { background: 'linear-gradient(135deg,#F87171,#EF4444)' } : {}}
              onClick={confirm === 'cancel' ? handleCancelSubscription : handleExportData}
              disabled={saving}>
              {saving ? 'Envoi…' : confirm === 'cancel' ? '⚠️ Confirmer la résiliation' : '✅ Confirmer la demande'}
            </button>
            <button className="ct-cancel-btn" onClick={() => setConfirm(null)}>Annuler</button>
          </div>
        </div>
      )}

      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 800, color: 'var(--tx)', marginBottom: 20 }}>Mon Abonnement</h2>

      {/* Pack actuel */}
      <div className="ct-card">
        <div className="ct-card-title"><Zap size={12} /> Pack actuel</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <span className="ct-badge-pack" style={{ background: pc.bg, color: pc.color, border: `1px solid ${pc.color}30` }}>
            {pack.charAt(0).toUpperCase() + pack.slice(1)}
          </span>
          {isPro && monetAmount > 0 && lead.status !== 'cancelled' && (
            <button className="ct-btn ct-btn--gold" onClick={() => setMonet(true)} style={{ fontSize: 11, padding: '6px 13px' }}>
              <Sparkles size={12} /> Monétiser → Partenaire
            </button>
          )}
        </div>
        <div className="ct-row">
          <span className="ct-row-label"><Calendar size={13} /> Début abonnement</span>
          <span className="ct-row-value">{fmtDate(startDate)}</span>
        </div>
        <div className="ct-row">
          <span className="ct-row-label"><RefreshCw size={13} /> Renouvellement annuel</span>
          <span className="ct-row-value">{renewAnnual}</span>
        </div>
        {isMensuel && (
          <div className="ct-row">
            <span className="ct-row-label"><RefreshCw size={13} /> Renouvellement mensuel</span>
            <span className="ct-row-value">{renewMonthly}</span>
          </div>
        )}
        <div className="ct-row">
          <span className="ct-row-label"><CheckCircle2 size={13} /> Statut</span>
          <span className="ct-row-value">
            {lead.status === 'cancelled'
              ? <span style={{ color: '#F87171' }}>Résilié</span>
              : <span style={{ color: '#10B981' }}>Actif</span>}
          </span>
        </div>
      </div>

      {/* Monétisation explication si Pro */}
      {isPro && monetAmount > 0 && (
        <div className="ct-card" style={{ borderColor: 'rgba(245,158,11,0.2)', background: 'rgba(245,158,11,0.04)' }}>
          <div className="ct-card-title"><Sparkles size={12} color="var(--gold)" /> Passer au Pack Partenaire</div>
          <p style={{ fontSize: 13, color: 'var(--tx-2)', lineHeight: 1.65, margin: '0 0 14px' }}>
            En tant qu&apos;abonné Pro, vous pouvez passer au Pack Partenaire en payant une fois <strong style={{ color: 'var(--gold)' }}>{monetAmount} DT</strong> supplémentaires. Accédez à tous les avantages Partenaire : visibilité premium, fonctionnalités avancées et support prioritaire.
          </p>
          <button className="ct-btn ct-btn--gold" onClick={() => setMonet(true)}>
            <Sparkles size={13} /> Monétiser maintenant — {monetAmount} DT
          </button>
        </div>
      )}

      {/* Garantie données */}
      <div className="ct-card" style={{ borderColor: 'rgba(16,185,129,0.15)', background: 'rgba(16,185,129,0.04)' }}>
        <div className="ct-card-title"><Lock size={12} color="#10B981" /> Sécurité & confidentialité</div>
        <p style={{ fontSize: 13, color: 'var(--tx-2)', lineHeight: 1.65, margin: '0 0 16px' }}>
          Walaup garantit la sécurité et la confidentialité de vos données. Si vous souhaitez résilier, nous vous fournirons une copie complète de vos données puis les supprimerons définitivement de notre base.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="ct-btn ct-btn--ghost" onClick={() => setConfirm('export')}>
            <Download size={13} /> Récupérer mes données
          </button>
          {lead.status !== 'cancelled' && (
            <button className="ct-btn ct-btn--danger" onClick={() => setConfirm('cancel')}>
              <XCircle size={13} /> Résilier l&apos;abonnement
            </button>
          )}
        </div>
      </div>
    </>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB PAIEMENTS
// ══════════════════════════════════════════════════════════════════════════════
export function TabPaiements({ lead }) {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchPayments = useCallback(async () => {
    if (!lead?.id) return
    const { data } = await supabase.from('payments').select('*').eq('lead_id', lead.id).order('created_at', { ascending: false })
    if (data) setPayments(data)
    setLoading(false)
  }, [lead?.id])

  useEffect(() => { fetchPayments() }, [fetchPayments])

// Realtime — mise à jour automatique quand un paiement change
useEffect(() => {
  if (!lead?.id) return
  const channel = supabase
    .channel(`payments-rt-${lead.id}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'payments',
      filter: `lead_id=eq.${lead.id}`
    }, () => { fetchPayments() })
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'payments',
      filter: `lead_id=eq.${lead.id}`
    }, () => { fetchPayments() })
    .subscribe()
  return () => supabase.removeChannel(channel)
}, [lead?.id, fetchPayments])

  // Construire liste combinée : payments table + statuts depuis lead
  const buildTimeline = () => {
    const events = []

    // Ajout depuis table payments
    payments.forEach(p => {
      const statusMap = {
        pending:   { color: '#FB923C', bg: 'rgba(251,146,60,.1)',  label: '⏳ En attente',    icon: Clock },
        confirmed: { color: '#10B981', bg: 'rgba(16,185,129,.1)',  label: '✅ Confirmé',       icon: CheckCircle2 },
        failed:    { color: '#F87171', bg: 'rgba(248,113,113,.1)', label: '❌ Échoué',          icon: XCircle },
      }
      const s = statusMap[p.status] || statusMap.pending
      const typeLabel = {
        annual: '🔄 Pack annuel',
        monthly: '📅 Mensualité',
        monetization: '⭐ Monétisation',
        one_time: '💳 Paiement unique',
      }
      events.push({
        id: p.id,
        icon: s.icon,
        iconColor: s.color,
        iconBg: s.bg,
        date: p.created_at,
        desc: p.description || typeLabel[p.type] || 'Paiement',
        amount: p.amount,
        method: PAYMENT_METHODS.find(m => m.id === p.method)?.label || p.method,
        status: p.status,
        statusLabel: s.label,
        statusColor: s.color,
        statusBg: s.bg,
      })
    })

    // Si aucun paiement en table mais lead a pay_amount (ancien système)
    if (events.length === 0 && lead?.pay_amount) {
      events.push({
        id: 'legacy-1',
        icon: lead.status === 'payment_confirmed' || lead.status === 'delivered' ? CheckCircle2 : Clock,
        iconColor: lead.status === 'payment_confirmed' || lead.status === 'delivered' ? '#10B981' : '#FB923C',
        iconBg: lead.status === 'payment_confirmed' || lead.status === 'delivered' ? 'rgba(16,185,129,.1)' : 'rgba(251,146,60,.1)',
        date: lead.created_at,
        desc: `Pack ${lead.pack} — ${lead.type || ''}`,
        amount: lead.pay_amount,
        method: PAYMENT_METHODS.find(m => m.id === lead.pay_method)?.label || lead.pay_method,
        status: lead.status === 'payment_confirmed' || lead.status === 'delivered' ? 'confirmed' : 'pending',
        statusLabel: lead.status === 'payment_confirmed' || lead.status === 'delivered' ? '✅ Confirmé' : '⏳ En attente',
        statusColor: lead.status === 'payment_confirmed' || lead.status === 'delivered' ? '#10B981' : '#FB923C',
        statusBg: lead.status === 'payment_confirmed' || lead.status === 'delivered' ? 'rgba(16,185,129,.1)' : 'rgba(251,146,60,.1)',
      })
    }

    return events
  }

  const timeline = buildTimeline()
  const total = timeline.filter(e => e.status === 'confirmed').reduce((s, e) => s + (Number(e.amount) || 0), 0)

  if (!lead) return (
    <>
      <style>{SHARED_CSS}</style>
      <div style={{ padding: 24, color: 'var(--tx-3)', fontSize: 14 }}>Aucun paiement disponible.</div>
    </>
  )

  return (
    <>
      <style>{SHARED_CSS}</style>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 800, color: 'var(--tx)', marginBottom: 20 }}>Paiements</h2>

      {/* Résumé */}
      <div className="ct-card" style={{ borderColor: 'rgba(245,158,11,.2)', background: 'rgba(245,158,11,.04)' }}>
        <div className="ct-card-title"><CreditCard size={12} color="var(--gold)" /> Résumé</div>
        <div className="ct-row">
          <span className="ct-row-label"><CheckCircle2 size={13} color="#10B981" /> Total confirmé</span>
          <span className="ct-row-value" style={{ color: '#10B981', fontFamily: "'JetBrains Mono',monospace" }}>{total} DT</span>
        </div>
        <div className="ct-row">
          <span className="ct-row-label"><Calendar size={13} /> Transactions</span>
          <span className="ct-row-value">{timeline.length}</span>
        </div>
        <div className="ct-row">
          <span className="ct-row-label"><Zap size={13} /> Pack</span>
          <span className="ct-row-value">{lead.pack || '—'}</span>
        </div>
      </div>

      {/* Liste paiements */}
      <div className="ct-card">
        <div className="ct-card-title"><Clock size={12} /> Historique des paiements</div>
        {loading && <div style={{ padding: 20, textAlign: 'center', color: 'var(--tx-3)', fontSize: 12 }}>Chargement…</div>}
        {!loading && timeline.length === 0 && (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--tx-3)', fontSize: 13 }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>💳</div>
            Aucun paiement enregistré pour le moment.
          </div>
        )}
        {timeline.map(ev => {
          const Icon = ev.icon
          return (
            <div key={ev.id} className="ct-pay-item">
              <div className="ct-pay-icon" style={{ background: ev.iconBg }}>
                <Icon size={16} color={ev.iconColor} />
              </div>
              <div className="ct-pay-body">
                <div className="ct-pay-desc">{ev.desc}</div>
                <div className="ct-pay-meta">
                  {ev.date ? fmtDate(ev.date) : '—'}
                  {ev.method ? ` · ${ev.method}` : ''}
                </div>
                <span className="ct-status-pill" style={{ background: ev.statusBg, color: ev.statusColor, marginTop: 5 }}>
                  {ev.status === 'pending' && <span className="ct-pulse">●</span>}
                  {ev.statusLabel}
                </span>
              </div>
              {ev.amount != null && (
                <div className="ct-pay-right">
                  <div className="ct-pay-amount" style={{ color: ev.statusColor }}>{ev.amount} DT</div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB APPS
// ══════════════════════════════════════════════════════════════════════════════
export function TabApps({ lead }) {
  const [showPass, setShowPass] = useState(false)
  const [copied, setCopied] = useState('')

  const copy = (text, key) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key)
      setTimeout(() => setCopied(''), 2000)
    })
  }

  const meta = parseMeta(lead?.note)
  const creds = meta.appCredentials || {}
  const finalUrl = meta.finalUrl || lead?.pay_ref || ''
  const isDelivered = lead?.status === 'delivered'

  if (!lead || !isDelivered || !finalUrl) {
    return (
      <>
        <style>{SHARED_CSS}</style>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 800, color: 'var(--tx)', marginBottom: 20 }}>Mes Applications</h2>
        <div className="ct-card">
          <div style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--tx-3)' }}>
            <div style={{ fontSize: 48, marginBottom: 14 }}>📱</div>
            <div style={{ fontSize: 15, color: 'var(--tx)', fontWeight: 600, marginBottom: 8 }}>Aucune application livrée</div>
            <div style={{ fontSize: 13, lineHeight: 1.65 }}>
              {lead?.status === 'payment_confirmed'
                ? 'Votre application est en cours de développement. Elle apparaîtra ici dès qu\'elle sera prête.'
                : 'Votre application sera disponible ici une fois le projet complété.'}
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <style>{SHARED_CSS}</style>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 800, color: 'var(--tx)', marginBottom: 20 }}>Mes Applications</h2>

      {/* App card */}
      <div className="ct-card" style={{ borderColor: 'rgba(99,102,241,.25)', background: 'linear-gradient(135deg,rgba(99,102,241,.06),rgba(139,92,246,.04))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>📱</div>
          <div>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: 16, color: 'var(--tx)', marginBottom: 2 }}>{lead.type || 'Mon Application'}</div>
            <div style={{ fontSize: 12, color: 'var(--tx-3)' }}>Pack {lead.pack} · Livré ✓</div>
          </div>
        </div>

        {/* Lien direct */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--tx-3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>🔗 Lien de votre application</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ flex: 1, fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: 'var(--ac)', background: 'rgba(99,102,241,.08)', border: '1px solid rgba(99,102,241,.2)', borderRadius: 9, padding: '9px 13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {finalUrl}
            </div>
            <button className="ct-copy-btn" onClick={() => copy(finalUrl, 'url')} title="Copier le lien">
              {copied === 'url' ? <CheckCircle2 size={13} color="#10B981" /> : <Copy size={13} />}
            </button>
            <a href={finalUrl} target="_blank" rel="noopener noreferrer" style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid rgba(99,102,241,.3)', background: 'rgba(99,102,241,.1)', color: 'var(--ac)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', transition: 'all .15s' }}>
              <ExternalLink size={13} />
            </a>
          </div>
        </div>

        {/* Accéder bouton */}
        <a href={finalUrl} target="_blank" rel="noopener noreferrer" className="ct-btn ct-btn--primary" style={{ marginBottom: 6, textDecoration: 'none', display: 'inline-flex' }}>
          <Smartphone size={14} /> Ouvrir mon application
        </a>
      </div>

      {/* Credentials */}
      {(creds.login || creds.password) && (
        <div className="ct-card">
          <div className="ct-card-title"><Lock size={12} /> Accès administrateur</div>
          <div className="ct-cred-card">
            {creds.login && (
              <div className="ct-cred-row">
                <span className="ct-cred-label">Login</span>
                <div className="ct-cred-val">{creds.login}</div>
                <button className="ct-copy-btn" onClick={() => copy(creds.login, 'login')}>
                  {copied === 'login' ? <CheckCircle2 size={12} color="#10B981" /> : <Copy size={12} />}
                </button>
              </div>
            )}
            {creds.password && (
              <div className="ct-cred-row">
                <span className="ct-cred-label">Mot de passe</span>
                <div className="ct-cred-val" style={{ letterSpacing: showPass ? 'normal' : '.15em' }}>
                  {showPass ? creds.password : '•'.repeat(Math.min(creds.password.length, 12))}
                </div>
                <button className="ct-copy-btn" onClick={() => setShowPass(p => !p)} title={showPass ? 'Masquer' : 'Afficher'}>
                  {showPass ? <EyeOff size={12} /> : <Eye size={12} />}
                </button>
                <button className="ct-copy-btn" onClick={() => copy(creds.password, 'pass')}>
                  {copied === 'pass' ? <CheckCircle2 size={12} color="#10B981" /> : <Copy size={12} />}
                </button>
              </div>
            )}
          </div>
          <p style={{ fontSize: 11, color: 'var(--tx-3)', margin: '8px 0 0', lineHeight: 1.5 }}>
            🔒 Conservez ces identifiants en sécurité. Ne les partagez pas.
          </p>
        </div>
      )}

      {/* Guide d'utilisation */}
      {creds.usageGuide && (
        <div className="ct-card">
          <div className="ct-card-title"><BookOpen size={12} /> Mode d&apos;utilisation</div>
          <div style={{ fontSize: 13, color: 'var(--tx-2)', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>
            {creds.usageGuide}
          </div>
        </div>
      )}

      {/* Si pas encore de credentials mais app livrée */}
      {!creds.login && !creds.password && (
        <div className="ct-card" style={{ borderColor: 'rgba(245,158,11,.15)' }}>
          <div className="ct-card-title"><AlertCircle size={12} color="var(--gold)" /> Identifiants</div>
          <p style={{ fontSize: 13, color: 'var(--tx-2)', lineHeight: 1.65, margin: 0 }}>
            Vos identifiants d&apos;accès administrateur seront communiqués par votre conseiller Walaup via la messagerie.
          </p>
        </div>
      )}
    </>
  )
}
