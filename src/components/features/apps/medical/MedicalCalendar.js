'use client'
import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Plus, Clock, User } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const CSS = `
  .cal-root { background:var(--bg-surface); border:1px solid var(--border); border-radius:14px; overflow:hidden; }

  /* ── Header ── */
  .cal-header {
    display:flex; align-items:center; justify-content:space-between;
    padding:14px 18px; border-bottom:1px solid var(--border);
    background:var(--bg-base);
  }
  .cal-nav-btn {
    width:32px; height:32px; border-radius:8px; border:1px solid var(--border);
    background:transparent; color:var(--tx-2); cursor:pointer;
    display:flex; align-items:center; justify-content:center;
    transition:all .15s;
  }
  .cal-nav-btn:hover { background:var(--bg-hover); color:var(--tx); }
  .cal-week-label { font-weight:700; font-size:.88rem; color:var(--tx); }
  .cal-today-btn {
    padding:4px 12px; border-radius:8px; font-size:.75rem; font-weight:600;
    border:1px solid var(--border); background:transparent; color:var(--tx-2);
    cursor:pointer; transition:all .15s;
  }
  .cal-today-btn:hover { background:rgba(14,165,233,.1); color:#0EA5E9; border-color:rgba(14,165,233,.3); }

  /* ── Days header ── */
  .cal-days-header {
    display:grid; border-bottom:1px solid var(--border);
    background:var(--bg-base);
  }
  .cal-day-label {
    padding:10px 6px; text-align:center;
    font-size:.72rem; font-weight:700; letter-spacing:.04em;
    text-transform:uppercase; color:var(--tx-3);
    border-right:1px solid var(--border);
  }
  .cal-day-label:last-child { border-right:none; }
  .cal-day-label.today { color:#0EA5E9; }
  .cal-day-num {
    display:block; font-size:1rem; font-weight:800;
    color:var(--tx); margin-top:2px;
  }
  .cal-day-label.today .cal-day-num {
    background:#0EA5E9; color:white; width:28px; height:28px;
    border-radius:50%; display:flex; align-items:center; justify-content:center;
    margin:2px auto 0;
  }

  /* ── Grid ── */
  .cal-grid {
    display:grid; overflow-y:auto; max-height:520px;
    scrollbar-width:thin; scrollbar-color:var(--border) transparent;
  }
  .cal-time-col { }
  .cal-slot-row { display:grid; border-bottom:1px solid rgba(255,255,255,.04); }
  .cal-time-label {
    padding:0 8px; display:flex; align-items:center;
    font-size:.65rem; font-weight:600; color:var(--tx-3);
    border-right:1px solid var(--border);
    height:56px; flex-shrink:0;
  }
  .cal-slot {
    height:56px; border-right:1px solid var(--border);
    position:relative; cursor:pointer;
    transition:background .12s;
  }
  .cal-slot:last-child { border-right:none; }
  .cal-slot.free:hover { background:rgba(14,165,233,.06); }
  .cal-slot.past { opacity:.4; cursor:default; }
  .cal-slot.past:hover { background:transparent; }

  /* ── Appointment block ── */
  .cal-appt {
    position:absolute; inset:2px 3px;
    border-radius:8px; padding:4px 8px;
    font-size:.72rem; font-weight:600;
    overflow:hidden; cursor:pointer;
    transition:filter .15s;
  }
  .cal-appt:hover { filter:brightness(1.15); }
  .cal-appt.confirmed { background:rgba(14,165,233,.2); color:#38BDF8; border-left:3px solid #0EA5E9; }
  .cal-appt.pending   { background:rgba(251,191,36,.15); color:#FCD34D; border-left:3px solid #F59E0B; }
  .cal-appt.done      { background:rgba(16,185,129,.15); color:#34D399; border-left:3px solid #10B981; }
  .cal-appt.cancelled { background:rgba(248,113,113,.1); color:#FCA5A5; border-left:3px solid #EF4444; opacity:.6; }
  .cal-appt.telemedicine { border-style:dashed; }
  .cal-appt-name { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .cal-appt-time { font-size:.62rem; opacity:.8; margin-top:1px; }

  /* ── Free slot indicator ── */
  .cal-free-hint {
    position:absolute; inset:0;
    display:flex; align-items:center; justify-content:center;
    opacity:0; transition:opacity .15s;
  }
  .cal-slot.free:hover .cal-free-hint { opacity:1; }
  .cal-free-hint-inner {
    padding:3px 8px; border-radius:6px;
    background:rgba(14,165,233,.15); color:#0EA5E9;
    font-size:.65rem; font-weight:700;
    display:flex; align-items:center; gap:4px;
    border:1px solid rgba(14,165,233,.3);
  }

  /* ── Modal nouveau RDV ── */
  .cal-modal-bg {
    position:fixed; inset:0; z-index:9000;
    background:rgba(0,0,0,.7); backdrop-filter:blur(4px);
    display:flex; align-items:center; justify-content:center; padding:16px;
    animation:calFade .18s;
  }
  @keyframes calFade { from{opacity:0} to{opacity:1} }
  .cal-modal {
    background:var(--bg-elevated); border:1px solid var(--border-strong);
    border-radius:20px; padding:26px; width:100%; max-width:440px;
    box-shadow:var(--shadow-modal);
    animation:calSlide .22s cubic-bezier(.16,1,.3,1);
  }
  @keyframes calSlide { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  .cal-modal-title { font-family:var(--font-display); font-size:1rem; font-weight:700;
    color:var(--tx); margin-bottom:18px; display:flex; align-items:center; gap:8px; }
  .cal-label { display:block; font-size:.73rem; font-weight:600;
    color:var(--tx-2); margin-bottom:5px; }
  .cal-input { width:100%; padding:9px 12px; border-radius:9px;
    border:1px solid var(--border); background:var(--bg-surface);
    color:var(--tx); font-size:.875rem; outline:none; transition:border-color .15s;
    box-sizing:border-box; }
  .cal-input:focus { border-color:#0EA5E9; box-shadow:0 0 0 3px rgba(14,165,233,.1); }
  .cal-select { width:100%; padding:9px 12px; border-radius:9px;
    border:1px solid var(--border); background:var(--bg-surface);
    color:var(--tx); font-size:.875rem; outline:none; cursor:pointer;
    box-sizing:border-box; }
  .cal-fg { margin-bottom:13px; }
  .cal-modal-row { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
  .cal-modal-actions { display:flex; gap:8px; justify-content:flex-end; margin-top:18px; }
  .cal-btn { padding:8px 18px; border-radius:9px; font-size:.83rem; font-weight:600;
    cursor:pointer; transition:all .16s; border:none; }
  .cal-btn.ghost { background:var(--bg-surface); color:var(--tx-2); border:1px solid var(--border); }
  .cal-btn.ghost:hover { color:var(--tx); }
  .cal-btn.primary { background:#0EA5E9; color:white; }
  .cal-btn.primary:hover { background:#0284C7; }
  .cal-btn:disabled { opacity:.5; cursor:not-allowed; }

  /* ── Legend ── */
  .cal-legend {
    display:flex; gap:14px; padding:10px 18px;
    border-top:1px solid var(--border); flex-wrap:wrap;
  }
  .cal-legend-item { display:flex; align-items:center; gap:5px;
    font-size:.68rem; font-weight:600; color:var(--tx-3); }
  .cal-legend-dot { width:8px; height:8px; border-radius:2px; }

  .cal-skeleton { background:linear-gradient(90deg,var(--bg-surface) 25%,var(--bg-hover) 50%,var(--bg-surface) 75%);
    background-size:200% 100%; animation:calShimmer 1.5s infinite; border-radius:4px; }
  @keyframes calShimmer { 0%{background-position:200%} 100%{background-position:-200%} }
`

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8) // 8h → 20h
const DAYS  = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const SLOT_DURATION = 30 // minutes

function getWeekStart(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function sameDay(a, b) {
  return a.toDateString() === b.toDateString()
}

function formatHour(h) {
  return `${String(h).padStart(2, '0')}:00`
}

function formatHalfHour(h, half) {
  return `${String(h).padStart(2, '0')}:${half ? '30' : '00'}`
}

export default function MedicalCalendar({ tenantId, userId, userRole, readOnly = false }) {
  const [weekStart,  setWeekStart]  = useState(() => getWeekStart(new Date()))
  const [appts,      setAppts]      = useState([])
  const [patients,   setPatients]   = useState([])
  const [loading,    setLoading]    = useState(false)
  const [modal,      setModal]      = useState(null) // { day, hour, half }
  const [saving,     setSaving]     = useState(false)
  const [form,       setForm]       = useState({ patient_id:'', duration_min:30, type:'presentiel', reason:'' })
  const today = new Date()

  const loadAppts = useCallback(async () => {
    setLoading(true)
    try {
      const weekEnd = addDays(weekStart, 7)
      const { data } = await supabase
        .from('med_appointments')
        .select('id, scheduled_at, duration_min, type, status, reason, patient:med_patients(id, first_name, last_name)')
        .gte('scheduled_at', weekStart.toISOString())
        .lt('scheduled_at',  weekEnd.toISOString())
        .order('scheduled_at', { ascending: true })
      setAppts(data || [])
    } catch { /* silencieux */ }
    setLoading(false)
  }, [weekStart])

  const loadPatients = useCallback(async () => {
    const { data } = await supabase
      .from('med_patients')
      .select('id, first_name, last_name')
      .order('last_name', { ascending: true })
      .limit(100)
    setPatients(data || [])
  }, [])

  useEffect(() => { loadAppts() }, [loadAppts])

  function prevWeek() { setWeekStart(w => addDays(w, -7)) }
  function nextWeek() { setWeekStart(w => addDays(w,  7)) }
  function goToday()  { setWeekStart(getWeekStart(new Date())) }

  function getApptForSlot(dayIndex, hour, half) {
    const slotDate = addDays(weekStart, dayIndex)
    return appts.filter(a => {
      const d = new Date(a.scheduled_at)
      return sameDay(d, slotDate) && d.getHours() === hour && (half ? d.getMinutes() >= 30 : d.getMinutes() < 30)
    })
  }

  function isSlotPast(dayIndex, hour, half) {
    const slotDate = addDays(weekStart, dayIndex)
    slotDate.setHours(hour, half ? 30 : 0, 0, 0)
    return slotDate < new Date()
  }

  async function openModal(dayIndex, hour, half) {
    if (readOnly) return
    if (isSlotPast(dayIndex, hour, half)) return
    if (patients.length === 0) await loadPatients()
    const slotDate = addDays(weekStart, dayIndex)
    slotDate.setHours(hour, half ? 30 : 0, 0, 0)
    setModal({ date: slotDate, dayIndex, hour, half })
    setForm({ patient_id:'', duration_min:30, type:'presentiel', reason:'' })
  }

  async function createAppt(e) {
    e.preventDefault()
    if (!form.patient_id || !modal) return
    setSaving(true)
    try {
      await supabase.from('med_appointments').insert({
        tenant_id:   tenantId,
        patient_id:  form.patient_id,
        scheduled_at:modal.date.toISOString(),
        duration_min:Number(form.duration_min),
        type:        form.type,
        status:      'pending',
        reason:      form.reason.trim().slice(0, 500),
        created_by:  userId,
      })
      setModal(null)
      loadAppts()
    } catch { /* silencieux */ }
    setSaving(false)
  }

  const weekLabel = (() => {
    const end = addDays(weekStart, 6)
    const opts = { day: '2-digit', month: 'short' }
    return `${weekStart.toLocaleDateString('fr-TN', opts)} — ${end.toLocaleDateString('fr-TN', opts)}`
  })()

  const cols = `64px repeat(7, 1fr)`

  return (
    <>
      <style>{CSS}</style>
      <div className="cal-root">
        {/* Header */}
        <div className="cal-header">
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <button className="cal-nav-btn" onClick={prevWeek}><ChevronLeft size={15}/></button>
            <button className="cal-nav-btn" onClick={nextWeek}><ChevronRight size={15}/></button>
          </div>
          <span className="cal-week-label">{weekLabel}</span>
          <button className="cal-today-btn" onClick={goToday}>Aujourd'hui</button>
        </div>

        {/* Days header */}
        <div className="cal-days-header" style={{ gridTemplateColumns: cols }}>
          <div style={{ borderRight:'1px solid var(--border)', padding:'10px 0' }} />
          {DAYS.map((day, i) => {
            const d = addDays(weekStart, i)
            const isToday = sameDay(d, today)
            return (
              <div key={day} className={`cal-day-label ${isToday ? 'today' : ''}`}>
                {day}
                <span className="cal-day-num">
                  {d.getDate()}
                </span>
              </div>
            )
          })}
        </div>

        {/* Grid */}
        <div className="cal-grid" style={{ gridTemplateColumns:'64px 1fr' }}>
          <div>
            {HOURS.map(h => (
              <div key={h}>
                {[false, true].map(half => (
                  <div key={half} className="cal-time-label">
                    {half ? '' : formatHour(h)}
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)' }}>
            {DAYS.map((_, dayIndex) => (
              <div key={dayIndex} style={{ borderRight:'1px solid var(--border)' }}>
                {HOURS.map(h => (
                  <div key={h}>
                    {[false, true].map(half => {
                      const slotAppts = getApptForSlot(dayIndex, h, half)
                      const isPast    = isSlotPast(dayIndex, h, half)
                      const hasFree   = slotAppts.length === 0

                      return (
                        <div
                          key={half}
                          className={`cal-slot ${hasFree ? 'free' : ''} ${isPast ? 'past' : ''}`}
                          style={{ borderBottom:'1px solid rgba(255,255,255,.03)' }}
                          onClick={() => hasFree && !isPast && openModal(dayIndex, h, half)}
                        >
                          {slotAppts.map(a => (
                            <div key={a.id} className={`cal-appt ${a.status} ${a.type === 'telemedicine' ? 'telemedicine' : ''}`}>
                              <div className="cal-appt-name">
                                {a.patient?.first_name} {a.patient?.last_name}
                              </div>
                              <div className="cal-appt-time">
                                {new Date(a.scheduled_at).toLocaleTimeString('fr-TN', { hour:'2-digit', minute:'2-digit' })}
                                {' · '}{a.duration_min}min
                              </div>
                            </div>
                          ))}
                          {hasFree && !isPast && !readOnly && (
                            <div className="cal-free-hint">
                              <div className="cal-free-hint-inner">
                                <Plus size={10}/> {formatHalfHour(h, half)}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="cal-legend">
          <div className="cal-legend-item">
            <div className="cal-legend-dot" style={{ background:'rgba(14,165,233,.6)' }}/>Confirmé
          </div>
          <div className="cal-legend-item">
            <div className="cal-legend-dot" style={{ background:'rgba(251,191,36,.6)' }}/>En attente
          </div>
          <div className="cal-legend-item">
            <div className="cal-legend-dot" style={{ background:'rgba(16,185,129,.6)' }}/>Terminé
          </div>
          <div className="cal-legend-item">
            <div className="cal-legend-dot" style={{ background:'rgba(248,113,113,.5)' }}/>Annulé
          </div>
          {!readOnly && (
            <div className="cal-legend-item" style={{ marginLeft:'auto', color:'var(--tx-2)' }}>
              Cliquez sur un créneau libre pour réserver
            </div>
          )}
        </div>
      </div>

      {/* Modal nouveau RDV */}
      {modal && (
        <div className="cal-modal-bg" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="cal-modal">
            <div className="cal-modal-title">
              <Clock size={18} color="#0EA5E9"/>
              Nouveau RDV — {modal.date.toLocaleDateString('fr-TN', { weekday:'long', day:'numeric', month:'long' })} à {formatHalfHour(modal.hour, modal.half)}
            </div>
            <form onSubmit={createAppt}>
              <div className="cal-fg">
                <label className="cal-label">Patient *</label>
                <select className="cal-select" required value={form.patient_id}
                  onChange={e => setForm(f => ({...f, patient_id: e.target.value}))}>
                  <option value="">— Sélectionner un patient —</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
                  ))}
                </select>
              </div>
              <div className="cal-modal-row">
                <div className="cal-fg">
                  <label className="cal-label">Durée</label>
                  <select className="cal-select" value={form.duration_min}
                    onChange={e => setForm(f => ({...f, duration_min: +e.target.value}))}>
                    {[15, 20, 30, 45, 60, 90].map(d => (
                      <option key={d} value={d}>{d} min</option>
                    ))}
                  </select>
                </div>
                <div className="cal-fg">
                  <label className="cal-label">Type</label>
                  <select className="cal-select" value={form.type}
                    onChange={e => setForm(f => ({...f, type: e.target.value}))}>
                    <option value="presentiel">Présentiel</option>
                    <option value="telemedicine">Télémédecine</option>
                  </select>
                </div>
              </div>
              <div className="cal-fg">
                <label className="cal-label">Motif</label>
                <input className="cal-input" placeholder="Motif de la consultation…"
                  maxLength={200} value={form.reason}
                  onChange={e => setForm(f => ({...f, reason: e.target.value}))}/>
              </div>
              <div className="cal-modal-actions">
                <button type="button" className="cal-btn ghost" onClick={() => setModal(null)}>Annuler</button>
                <button type="submit" className="cal-btn primary" disabled={saving}>
                  {saving ? 'Enregistrement…' : 'Créer le RDV'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
