'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { WalaupSound } from '@/lib/sound'
import {
  Coffee, Stethoscope, ShoppingBag, Wrench, GraduationCap, MoreHorizontal,
  Users, Smartphone, Monitor, Check, ChevronRight, ChevronLeft,
  Zap, Shield, Rocket, Send, CheckCircle2, Clock, Calculator,
  Crown, Phone, Mail, MessageSquare, User, Layers
} from 'lucide-react'

// ─── Constants ────────────────────────────────────────────────────────────────

const SECTORS = [
  { id:'restaurant', label:'Café & Restaurant', icon:Coffee,         color:'#FB923C' },
  { id:'medical',    label:'Médical',            icon:Stethoscope,    color:'#22D3EE' },
  { id:'retail',     label:'Commerce & Retail',  icon:ShoppingBag,    color:'#A78BFA' },
  { id:'services',   label:'Services & Artisan', icon:Wrench,         color:'#34D399' },
  { id:'education',  label:'Éducation',           icon:GraduationCap,  color:'#FBBF24' },
  { id:'other',      label:'Autre secteur',       icon:MoreHorizontal, color:'#8B90B8' },
]

const LANGUAGES = [
  { id:'fr', label:'Français', flag:'🇫🇷' },
  { id:'ar', label:'عربي',     flag:'🇹🇳' },
  { id:'bi', label:'Bilingue', flag:'🌐'  },
]

const PLATFORMS = [
  { id:'web',    label:'Web',          icon:Monitor,    desc:'Navigateur'    },
  { id:'mobile', label:'Mobile',       icon:Smartphone, desc:'iOS & Android' },
  { id:'both',   label:'Web + Mobile', icon:Layers,     desc:'Les deux'      },
]

const USER_RANGES = ['1–5', '5–20', '20–100', '100+']

const DEFAULT_FEATURES = [
  { id:'f1',  group:'Gestion',       name:'Tableau de bord',    icon:'📊', price:0,   days:0, desc:"Vue d'ensemble des données"  },
  { id:'f2',  group:'Gestion',       name:'Gestion du stock',   icon:'📦', price:80,  days:2, desc:'Entrées, sorties, alertes'   },
  { id:'f3',  group:'Gestion',       name:'Caisse & Paiement',  icon:'💰', price:60,  days:2, desc:'Encaissement, reçus'         },
  { id:'f4',  group:'Gestion',       name:'Gestion employés',   icon:'👥', price:70,  days:2, desc:'Présences, fiches, paiements'},
  { id:'f5',  group:'Clients',       name:'Suivi clients',      icon:'🤝', price:50,  days:1, desc:'Fiche client, historique'    },
  { id:'f6',  group:'Clients',       name:'Suivi des dettes',   icon:'💸', price:60,  days:2, desc:'Créances, relances auto'     },
  { id:'f7',  group:'Clients',       name:'Réservations',       icon:'📅', price:80,  days:3, desc:'Agenda et RDV en ligne'      },
  { id:'f8',  group:'Communication', name:'Notifications push', icon:'🔔', price:40,  days:1, desc:'Alertes et rappels'          },
  { id:'f9',  group:'Communication', name:'Chat interne',       icon:'💬', price:80,  days:3, desc:'Messagerie équipe'           },
  { id:'f10', group:'Rapports',      name:'Rapports & Stats',   icon:'📈', price:60,  days:2, desc:'Graphes, exports, analyses'  },
  { id:'f11', group:'Rapports',      name:'Export PDF',         icon:'📄', price:30,  days:1, desc:'Factures, reçus en PDF'      },
  { id:'f12', group:'Avancé',        name:'API & Intégrations', icon:'🔗', price:120, days:4, desc:"Connecter d'autres outils"   },
]

const PACKS = [
  {
    id:'essentiel', name:'Essentiel', tagline:'Pour démarrer',
    icon:Zap, color:'#34D399', colorAlpha:'rgba(52,211,153,0.10)',
    price:{ from:200 }, monthly:20,
    features:['App sur mesure pour votre secteur','Fonctionnalités choisies','Démo gratuite avant paiement','Support email','Renouvellement annuel'],
    missing:['Mises à jour illimitées','Support prioritaire','Revente marketplace'],
  },
  {
    id:'pro', name:'Pro', tagline:'Le plus populaire',
    icon:Rocket, color:'#6366F1', colorAlpha:'rgba(99,102,241,0.10)',
    price:{ from:400 }, monthly:40, badge:'RECOMMANDÉ',
    features:['App 100% personnalisée','Toutes les fonctionnalités','Mises à jour illimitées','Support prioritaire','Option monétisation marketplace'],
    missing:['Propriété à vie','Accompagnement business'],
  },
  {
    id:'partenaire', name:'Partenaire', tagline:'Revenus passifs',
    icon:Crown, color:'#F59E0B', colorAlpha:'rgba(245,158,11,0.10)',
    price:{ from:800 }, monthly:80,
    features:['App complète sur mesure','Propriétaire à 100%','Publication marketplace','60–70% des revenus','Accompagnement business'],
    missing:[],
  },
]

const STEP_LABELS = ['Secteur','Base','Fonctionnalités','Pack','Contact']

// ─── Shared Styles ────────────────────────────────────────────────────────────

const S = {
  stepTitle: { fontSize:22, fontWeight:800, color:'var(--tx)', marginBottom:6,  letterSpacing:'-0.03em', marginTop:0 },
  stepSub:   { fontSize:14, color:'var(--tx-2)', marginBottom:22, lineHeight:1.5, marginTop:0 },
  fieldGrp:  { marginBottom:18 },
  label:     { display:'flex', alignItems:'center', gap:8, fontSize:13, fontWeight:600, color:'var(--tx-2)', marginBottom:8 },
  required:  { fontSize:10, color:'var(--ac)', fontWeight:700, background:'rgba(99,102,241,0.12)', padding:'2px 8px', borderRadius:20 },
  input:     { width:'100%', padding:'11px 13px', background:'rgba(255,255,255,0.04)', border:'1.5px solid rgba(255,255,255,0.09)', borderRadius:11, color:'var(--tx)', fontSize:14, outline:'none', transition:'all 0.2s ease', fontFamily:'var(--font-body)', boxSizing:'border-box' },
  inputWrap: { position:'relative' },
  icoStyle:  { position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', pointerEvents:'none', zIndex:1 },
  chip:      { display:'flex', alignItems:'center', gap:7, padding:'8px 14px', background:'rgba(255,255,255,0.04)', border:'1.5px solid rgba(255,255,255,0.09)', borderRadius:9, cursor:'pointer', color:'var(--tx-2)', fontSize:13, fontWeight:600, transition:'all 0.2s ease' },
  chipOn:    { background:'rgba(99,102,241,0.12)', borderColor:'var(--ac)', color:'var(--ac)', boxShadow:'0 2px 10px rgba(99,102,241,0.18)' },
  hint:      { fontSize:11, color:'var(--tx-3)', marginTop:5 },
  errMsg:    { fontSize:11, color:'var(--red)',   marginTop:5 },
}

// ─── Step Indicator — toujours visible ───────────────────────────────────────

function StepIndicator({ current }) {
  return (
    <div style={{ display:'flex', alignItems:'center', width:'100%' }}>
      {STEP_LABELS.map((label, i) => {
        const n    = i + 1
        const done = n < current
        const act  = n === current
        return (
          <div key={n} style={{ display:'flex', alignItems:'center', flex: i < STEP_LABELS.length - 1 ? 1 : 'none' }}>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, flexShrink:0 }}>
              <div style={{
                width:30, height:30, borderRadius:'50%',
                background: done ? 'var(--ac)' : act ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
                border:`2px solid ${done ? 'var(--ac)' : act ? 'var(--ac)' : 'rgba(255,255,255,0.1)'}`,
                display:'flex', alignItems:'center', justifyContent:'center',
                transition:'all 0.3s cubic-bezier(0.16,1,0.3,1)',
                boxShadow: act ? '0 0 16px rgba(99,102,241,0.45)' : done ? '0 0 10px rgba(99,102,241,0.25)' : 'none',
                flexShrink:0,
              }}>
                {done
                  ? <Check size={14} color="white" strokeWidth={2.5} />
                  : <span style={{ fontSize:11, fontWeight:700, color: act ? 'var(--ac)' : 'var(--tx-3)', fontFamily:'var(--font-mono)' }}>{n}</span>
                }
              </div>
              <span style={{
                fontSize:9, fontWeight:600, letterSpacing:'0.04em', textTransform:'uppercase',
                color: act ? 'var(--tx)' : done ? 'var(--tx-2)' : 'var(--tx-3)',
                whiteSpace:'nowrap', transition:'color 0.3s ease',
              }}>{label}</span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div style={{
                flex:1, height:2, margin:'0 5px', marginBottom:16,
                background: done ? 'var(--ac)' : 'rgba(255,255,255,0.07)',
                borderRadius:1, transition:'background 0.4s ease',
                boxShadow: done ? '0 0 6px rgba(99,102,241,0.35)' : 'none',
              }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Price Sidebar ────────────────────────────────────────────────────────────

function PriceSidebar({ sector, pack, features, selectedFeatures, compact }) {
  const packObj   = pack ? PACKS.find(p => p.id === pack) : null
  const basePrice = packObj ? packObj.price.from : 150
  const extra     = [...selectedFeatures].reduce((s, id) => s + (features.find(f => f.id === id)?.price || 0), 0)
  const total     = basePrice + extra
  const days      = 2 + [...selectedFeatures].reduce((s, id) => s + (features.find(f => f.id === id)?.days || 0), 0)
  const sectorObj = sector ? SECTORS.find(s => s.id === sector) : null

  return (
    <div style={{
      background:'rgba(10,13,25,0.97)',
      border:'1px solid rgba(255,255,255,0.09)',
      borderRadius:16,
      padding: compact ? '13px 14px' : '20px',
      backdropFilter:'blur(20px)',
      width:'100%', boxSizing:'border-box',
    }}>
      {/* En-tête */}
      <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom: compact ? 10 : 16 }}>
        <div style={{ width:30, height:30, borderRadius:8, background:'rgba(99,102,241,0.15)', border:'1px solid rgba(99,102,241,0.3)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <Calculator size={14} color="var(--ac)" />
        </div>
        <div>
          <div style={{ fontSize:12, fontWeight:700, color:'var(--tx)' }}>Estimation</div>
          <div style={{ fontSize:10, color:'var(--tx-3)' }}>Temps réel</div>
        </div>
      </div>

      {compact ? (
        /* ── MODE COMPACT (mobile) ─────────────────── */
        <div style={{ display:'flex', gap:10, marginBottom:10 }}>
          <div style={{ flex:1, background:'rgba(99,102,241,0.07)', borderRadius:11, padding:'10px 12px', border:'1px solid rgba(99,102,241,0.15)' }}>
            <div style={{ fontSize:10, color:'var(--tx-3)', marginBottom:3, textTransform:'uppercase', letterSpacing:'0.05em' }}>Prix estimé</div>
            <div style={{ display:'flex', alignItems:'baseline', gap:4 }}>
              <span style={{ fontSize:26, fontWeight:800, color:'var(--tx)', fontFamily:'var(--font-mono)', letterSpacing:'-0.03em', transition:'all 0.3s ease' }}>{total}</span>
              <span style={{ fontSize:13, fontWeight:600, color:'var(--tx-2)' }}>DT</span>
            </div>
            {packObj && <div style={{ fontSize:10, color:'var(--tx-3)' }}>+ {packObj.monthly} DT/mois</div>}
          </div>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:2, background:'rgba(52,211,153,0.07)', borderRadius:11, padding:'10px 14px', border:'1px solid rgba(52,211,153,0.15)', flexShrink:0 }}>
            <Clock size={13} color="#34D399" />
            <div style={{ fontSize:10, color:'#34D399', fontWeight:600 }}>Délai</div>
            <div style={{ fontSize:12, color:'var(--tx)', fontWeight:700, fontFamily:'var(--font-mono)', whiteSpace:'nowrap' }}>
              {days <= 14 ? `${days}j` : `${Math.ceil(days/7)} sem.`}
            </div>
          </div>
        </div>
      ) : (
        /* ── MODE NORMAL (desktop) ─────────────────── */
        <>
          <div style={{ background:'rgba(99,102,241,0.07)', borderRadius:13, padding:'15px', marginBottom:13, border:'1px solid rgba(99,102,241,0.15)' }}>
            <div style={{ fontSize:10, color:'var(--tx-3)', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.06em' }}>Prix estimé</div>
            <div style={{ display:'flex', alignItems:'baseline', gap:5 }}>
              <span style={{ fontSize:36, fontWeight:800, color:'var(--tx)', fontFamily:'var(--font-mono)', letterSpacing:'-0.03em', transition:'all 0.3s ease' }}>{total}</span>
              <span style={{ fontSize:15, fontWeight:600, color:'var(--tx-2)' }}>DT</span>
            </div>
            {packObj && <div style={{ fontSize:11, color:'var(--tx-3)', marginTop:2 }}>+ {packObj.monthly} DT/mois</div>}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'11px 13px', background:'rgba(52,211,153,0.06)', borderRadius:10, border:'1px solid rgba(52,211,153,0.15)', marginBottom:14 }}>
            <Clock size={14} color="#34D399" />
            <div>
              <div style={{ fontSize:10, color:'#34D399', fontWeight:600 }}>Délai estimé</div>
              <div style={{ fontSize:13, color:'var(--tx)', fontWeight:700, fontFamily:'var(--font-mono)' }}>
                {days <= 14 ? `${days} jours` : `${Math.ceil(days/7)} semaines`}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Résumé */}
      <div style={{ marginBottom: compact ? 4 : 13 }}>
        {sectorObj && <SRow icon="🏢" label="Secteur"         value={sectorObj.label} />}
        {packObj   && <SRow icon="📦" label="Pack"            value={packObj.name} color={packObj.color} />}
                      <SRow icon="⚡" label="Fonctionnalités" value={`${selectedFeatures.size} sélectionnées`} />
        {extra > 0 && <SRow icon="➕" label="Options"         value={`+${extra} DT`} color="var(--ac)" />}
      </div>

      {/* Garantie — desktop seulement */}
      {!compact && (
        <div style={{ padding:'10px 12px', background:'rgba(255,255,255,0.02)', borderRadius:9, border:'1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display:'flex', gap:7, alignItems:'flex-start' }}>
            <Shield size={12} color="#34D399" style={{ flexShrink:0, marginTop:2 }} />
            <p style={{ fontSize:11, color:'var(--tx-3)', lineHeight:1.5, margin:0 }}>
              <strong style={{ color:'var(--tx-2)' }}>0 DT avant validation</strong> — démo gratuite avant paiement.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function SRow({ icon, label, value, color }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
        <span style={{ fontSize:11 }}>{icon}</span>
        <span style={{ fontSize:11, color:'var(--tx-3)' }}>{label}</span>
      </div>
      <span style={{ fontSize:11, fontWeight:600, color: color || 'var(--tx-2)' }}>{value}</span>
    </div>
  )
}

// ─── Step 1 — Secteur ─────────────────────────────────────────────────────────

function StepSector({ value, onChange }) {
  return (
    <div>
      <h2 style={S.stepTitle}>Votre secteur d'activité</h2>
      <p style={S.stepSub}>Nous adaptons chaque app à votre métier.</p>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:11 }}>
        {SECTORS.map(s => {
          const Icon   = s.icon
          const active = value === s.id
          return (
            <button key={s.id} onClick={() => { onChange(s.id); WalaupSound?.click() }}
              style={{
                background: active ? `${s.color}14` : 'rgba(255,255,255,0.03)',
                border:`2px solid ${active ? s.color : 'rgba(255,255,255,0.08)'}`,
                borderRadius:13, padding:'16px 12px',
                cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:9,
                transition:'all 0.22s cubic-bezier(0.16,1,0.3,1)', position:'relative',
                transform: active ? 'translateY(-2px) scale(1.02)' : 'none',
                boxShadow: active ? `0 5px 20px ${s.color}28, 0 0 0 1px ${s.color}35` : 'none',
              }}>
              <div style={{
                width:42, height:42, borderRadius:12,
                background: active ? `${s.color}22` : 'rgba(255,255,255,0.05)',
                border:`1px solid ${active ? s.color+'50' : 'rgba(255,255,255,0.1)'}`,
                display:'flex', alignItems:'center', justifyContent:'center',
                transition:'all 0.22s ease',
              }}>
                <Icon size={20} color={active ? s.color : 'var(--tx-2)'} strokeWidth={1.8} />
              </div>
              <span style={{ fontSize:12, fontWeight:600, color: active ? s.color : 'var(--tx-2)', textAlign:'center', lineHeight:1.3 }}>
                {s.label}
              </span>
              {active && (
                <div style={{ position:'absolute', top:8, right:8, width:17, height:17, borderRadius:'50%', background:s.color, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Check size={10} color="white" strokeWidth={3} />
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Step 2 — Infos de base ───────────────────────────────────────────────────

function StepBase({ data, onChange }) {
  const [nameError, setNameError] = useState(false)
  return (
    <div>
      <h2 style={S.stepTitle}>Informations de base</h2>
      <p style={S.stepSub}>Dites-nous en plus sur votre projet.</p>

      <div style={S.fieldGrp}>
        <label style={S.label}>Nom de l'application <span style={S.required}>obligatoire</span></label>
        <input type="text" value={data.appName} maxLength={60}
          onChange={e => { onChange('appName', e.target.value); setNameError(false) }}
          onBlur={() => { if (!data.appName.trim()) setNameError(true) }}
          placeholder="Ex : CaféPro, StockMaster..."
          style={{ ...S.input, borderColor: nameError ? 'var(--red)' : data.appName ? 'rgba(99,102,241,0.45)' : undefined }} />
        {nameError && <span style={S.errMsg}>Le nom est obligatoire</span>}
        <span style={S.hint}>Ce nom apparaîtra dans votre application.</span>
      </div>

      <div style={S.fieldGrp}>
        <label style={S.label}>Nombre d'utilisateurs</label>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {USER_RANGES.map(r => (
            <button key={r} onClick={() => { onChange('users', r); WalaupSound?.tab() }}
              style={{ ...S.chip, ...(data.users === r ? S.chipOn : {}) }}>
              <Users size={12} />{r}
            </button>
          ))}
        </div>
      </div>

      <div style={S.fieldGrp}>
        <label style={S.label}>Langue de l'interface</label>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {LANGUAGES.map(l => (
            <button key={l.id} onClick={() => { onChange('language', l.id); WalaupSound?.tab() }}
              style={{ ...S.chip, ...(data.language === l.id ? S.chipOn : {}) }}>
              <span>{l.flag}</span>{l.label}
            </button>
          ))}
        </div>
      </div>

      <div style={S.fieldGrp}>
        <label style={S.label}>Plateforme cible</label>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:9 }}>
          {PLATFORMS.map(p => {
            const Icon   = p.icon
            const active = data.platform === p.id
            return (
              <button key={p.id} onClick={() => { onChange('platform', p.id); WalaupSound?.click() }}
                style={{
                  background: active ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.03)',
                  border:`2px solid ${active ? 'var(--ac)' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius:11, padding:'13px 9px',
                  cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:6,
                  transition:'all 0.2s ease',
                  boxShadow: active ? '0 3px 14px rgba(99,102,241,0.2)' : 'none',
                }}>
                <Icon size={18} color={active ? 'var(--ac)' : 'var(--tx-3)'} strokeWidth={1.8} />
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:11, fontWeight:600, color: active ? 'var(--ac)' : 'var(--tx-2)' }}>{p.label}</div>
                  <div style={{ fontSize:10, color:'var(--tx-3)' }}>{p.desc}</div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Step 3 — Fonctionnalités ─────────────────────────────────────────────────

function StepFeatures({ features, selected, onToggle }) {
  const groups = [...new Set(features.map(f => f.group))]
  return (
    <div>
      <h2 style={S.stepTitle}>Fonctionnalités</h2>
      <p style={S.stepSub}>Sélectionnez ce dont votre app a besoin. Le prix s'ajuste automatiquement.</p>
      {groups.map(group => (
        <div key={group} style={{ marginBottom:22 }}>
          <div style={{ fontSize:10, fontWeight:700, color:'var(--tx-3)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 }}>
            {group}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:8 }}>
            {features.filter(f => f.group === group).map(feat => {
              const active = selected.has(feat.id)
              return (
                <button key={feat.id} onClick={() => { onToggle(feat.id); WalaupSound?.click() }}
                  style={{
                    background: active ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.02)',
                    border:`1.5px solid ${active ? 'rgba(99,102,241,0.45)' : 'rgba(255,255,255,0.07)'}`,
                    borderRadius:12, padding:'12px', cursor:'pointer', textAlign:'left',
                    transition:'all 0.2s cubic-bezier(0.16,1,0.3,1)',
                    transform: active ? 'scale(1.01)' : 'scale(1)',
                    boxShadow: active ? '0 3px 14px rgba(99,102,241,0.15)' : 'none',
                  }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
                    <span style={{ fontSize:19 }}>{feat.icon}</span>
                    <div style={{
                      width:17, height:17, borderRadius:'50%', flexShrink:0,
                      background: active ? 'var(--ac)' : 'rgba(255,255,255,0.06)',
                      border:`2px solid ${active ? 'var(--ac)' : 'rgba(255,255,255,0.12)'}`,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      transition:'all 0.2s ease',
                    }}>
                      {active && <Check size={9} color="white" strokeWidth={3} />}
                    </div>
                  </div>
                  <div style={{ fontSize:12, fontWeight:600, color: active ? 'var(--tx)' : 'var(--tx-2)', marginBottom:2 }}>{feat.name}</div>
                  <div style={{ fontSize:10, color:'var(--tx-3)', lineHeight:1.4, marginBottom:8 }}>{feat.desc}</div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontSize:10, color: feat.price > 0 ? 'var(--gold)' : 'var(--green)', fontWeight:700, fontFamily:'var(--font-mono)' }}>
                      {feat.price > 0 ? `+${feat.price} DT` : 'Inclus'}
                    </span>
                    {feat.days > 0 && (
                      <span style={{ fontSize:10, color:'var(--tx-3)', display:'flex', alignItems:'center', gap:2 }}>
                        <Clock size={9} />{feat.days}j
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Step 4 — Pack ────────────────────────────────────────────────────────────

function StepPack({ value, onChange }) {
  const activePackObj = value ? PACKS.find(p => p.id === value) : null
  return (
    <div>
      <h2 style={S.stepTitle}>Choisissez votre pack</h2>
      <p style={S.stepSub}>Du premier lancement jusqu'aux revenus passifs.</p>
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {PACKS.map(pack => {
          const Icon   = pack.icon
          const active = value === pack.id
          return (
            <button key={pack.id} onClick={() => { onChange(pack.id); WalaupSound?.success() }}
              style={{
                background: active ? pack.colorAlpha : 'rgba(255,255,255,0.02)',
                border:`2px solid ${active ? pack.color : 'rgba(255,255,255,0.08)'}`,
                borderRadius:14, padding:'16px 18px', cursor:'pointer', textAlign:'left',
                transition:'all 0.22s cubic-bezier(0.16,1,0.3,1)',
                transform: active ? 'translateX(4px)' : 'none',
                boxShadow: active ? `0 6px 28px ${pack.color}20` : 'none',
                position:'relative', display:'flex', alignItems:'center', gap:14,
              }}>
              {pack.badge && (
                <div style={{ position:'absolute', top:10, right:10, background:pack.color, color:'white', fontSize:9, fontWeight:800, padding:'2px 8px', borderRadius:20, letterSpacing:'0.06em' }}>
                  {pack.badge}
                </div>
              )}
              <div style={{ width:40, height:40, borderRadius:11, flexShrink:0, background:`${pack.color}20`, border:`1px solid ${pack.color}40`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Icon size={19} color={pack.color} strokeWidth={1.8} />
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'baseline', gap:7, marginBottom:2 }}>
                  <span style={{ fontSize:15, fontWeight:800, color:'var(--tx)' }}>{pack.name}</span>
                  <span style={{ fontSize:11, color:'var(--tx-3)' }}>{pack.tagline}</span>
                </div>
                <div style={{ display:'flex', alignItems:'baseline', gap:4 }}>
                  <span style={{ fontSize:22, fontWeight:800, color:pack.color, fontFamily:'var(--font-mono)', letterSpacing:'-0.02em' }}>{pack.price.from}</span>
                  <span style={{ fontSize:12, color:'var(--tx-2)' }}>DT</span>
                  <span style={{ fontSize:11, color:'var(--tx-3)', marginLeft:4 }}>+ {pack.monthly} DT/mois</span>
                </div>
              </div>
              <div style={{
                width:20, height:20, borderRadius:'50%', flexShrink:0,
                background: active ? pack.color : 'rgba(255,255,255,0.06)',
                border:`2px solid ${active ? pack.color : 'rgba(255,255,255,0.12)'}`,
                display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s ease',
              }}>
                {active && <Check size={11} color="white" strokeWidth={3} />}
              </div>
            </button>
          )
        })}

        {/* Features du pack actif */}
        {activePackObj && (
          <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:'13px 15px' }}>
            <div style={{ fontSize:11, color:'var(--tx-3)', marginBottom:9, fontWeight:600 }}>Ce que vous obtenez :</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px 12px' }}>
              {activePackObj.features.map(f => (
                <div key={f} style={{ display:'flex', gap:6, alignItems:'flex-start' }}>
                  <CheckCircle2 size={12} color={activePackObj.color} strokeWidth={2} style={{ flexShrink:0, marginTop:1 }} />
                  <span style={{ fontSize:11, color:'var(--tx-2)', lineHeight:1.4 }}>{f}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Step 5 — Contact ─────────────────────────────────────────────────────────

function StepContact({ data, onChange, onSubmit, submitting }) {
  return (
    <div>
      <h2 style={S.stepTitle}>Vos coordonnées</h2>
      <p style={S.stepSub}>Nous vous contactons sous 24h pour votre démo gratuite.</p>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }} className="contact-grid">
        <div>
          <label style={S.label}>Nom <span style={S.required}>obligatoire</span></label>
          <div style={S.inputWrap}>
            <User size={14} color="var(--tx-3)" style={S.icoStyle} />
            <input type="text" value={data.name} onChange={e => onChange('name', e.target.value)}
              placeholder="Votre nom" style={{ ...S.input, paddingLeft:36 }} />
          </div>
        </div>
        <div>
          <label style={S.label}>Téléphone <span style={S.required}>obligatoire</span></label>
          <div style={S.inputWrap}>
            <Phone size={14} color="var(--tx-3)" style={S.icoStyle} />
            <input type="tel" value={data.phone} onChange={e => onChange('phone', e.target.value)}
              placeholder="+216 XX XXX XXX" style={{ ...S.input, paddingLeft:36 }} />
          </div>
        </div>
      </div>

      <div style={{ ...S.fieldGrp }}>
        <label style={S.label}>Email</label>
        <div style={S.inputWrap}>
          <Mail size={14} color="var(--tx-3)" style={S.icoStyle} />
          <input type="email" value={data.email} onChange={e => onChange('email', e.target.value)}
            placeholder="votre@email.com" style={{ ...S.input, paddingLeft:36 }} />
        </div>
      </div>

      <div style={{ ...S.fieldGrp, marginBottom:20 }}>
        <label style={S.label}>Message (optionnel)</label>
        <div style={S.inputWrap}>
          <MessageSquare size={14} color="var(--tx-3)" style={{ ...S.icoStyle, top:13 }} />
          <textarea value={data.message} onChange={e => onChange('message', e.target.value)}
            placeholder="Décrivez votre projet..." rows={3}
            style={{ ...S.input, paddingLeft:36, resize:'vertical', minHeight:85, lineHeight:1.6 }} />
        </div>
      </div>

      <div style={{ display:'flex', gap:16, flexWrap:'wrap', marginBottom:20 }}>
        {[['🎯','Démo 100% gratuite'],['⚡','Réponse en 24h'],['🔒','Sans engagement']].map(([ic,tx]) => (
          <div key={tx} style={{ display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ fontSize:14 }}>{ic}</span>
            <span style={{ fontSize:12, color:'var(--tx-3)' }}>{tx}</span>
          </div>
        ))}
      </div>

      <button onClick={onSubmit}
        disabled={submitting || !data.name.trim() || !data.phone.trim()}
        style={{
          width:'100%', padding:'14px 20px',
          background: (!data.name.trim() || !data.phone.trim()) ? 'rgba(99,102,241,0.3)' : 'var(--ac)',
          border:'none', borderRadius:12, cursor: submitting ? 'wait' : 'pointer',
          display:'flex', alignItems:'center', justifyContent:'center', gap:9,
          fontSize:14, fontWeight:700, color:'white', transition:'all 0.2s ease',
          boxShadow:'0 5px 24px rgba(99,102,241,0.30)',
          opacity: (!data.name.trim() || !data.phone.trim()) ? 0.55 : 1,
        }}>
        {submitting
          ? <><div style={{ width:16, height:16, borderRadius:'50%', border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'white', animation:'spin 0.8s linear infinite' }} />Envoi...</>
          : <><Send size={16} />Recevoir ma démo gratuite</>
        }
      </button>
    </div>
  )
}

// ─── Success ──────────────────────────────────────────────────────────────────

function SuccessScreen({ name, sector, pack }) {
  const packObj   = PACKS.find(p => p.id === pack)
  const sectorObj = SECTORS.find(s => s.id === sector)
  return (
    <div style={{ textAlign:'center', padding:'48px 24px', maxWidth:480, margin:'0 auto' }}>
      <div style={{ width:68, height:68, borderRadius:'50%', background:'rgba(52,211,153,0.13)', border:'2px solid rgba(52,211,153,0.38)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 22px', boxShadow:'0 0 32px rgba(52,211,153,0.2)' }}>
        <CheckCircle2 size={32} color="#34D399" />
      </div>
      <h2 style={{ fontSize:24, fontWeight:800, color:'var(--tx)', marginBottom:10, letterSpacing:'-0.03em' }}>Demande envoyée !</h2>
      <p style={{ fontSize:15, color:'var(--tx-2)', lineHeight:1.6, marginBottom:28 }}>
        Merci <strong style={{ color:'var(--tx)' }}>{name}</strong>. Notre équipe vous contacte dans les <strong style={{ color:'var(--ac)' }}>24 heures</strong>.
      </p>
      <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, padding:'18px', marginBottom:24, textAlign:'left' }}>
        {sectorObj && <SRow icon="🏢" label="Secteur" value={sectorObj.label} />}
        {packObj   && <SRow icon="📦" label="Pack"    value={packObj.name} color={packObj.color} />}
                      <SRow icon="✅" label="Statut"  value="Démo programmée" color="#34D399" />
      </div>
      <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap' }}>
        <a href="/" style={{ padding:'10px 20px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, color:'var(--tx-2)', textDecoration:'none', fontSize:13, fontWeight:600, display:'flex', alignItems:'center', gap:6 }}>
          <ChevronLeft size={14} />Retour
        </a>
        <a href="/marketplace" style={{ padding:'10px 20px', background:'var(--ac)', borderRadius:10, color:'white', textDecoration:'none', fontSize:13, fontWeight:600, display:'flex', alignItems:'center', gap:6, boxShadow:'0 3px 12px rgba(99,102,241,0.3)' }}>
          Explorer le marketplace<ChevronRight size={14} />
        </a>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function EstimateurPage() {
  const [step,       setStep]       = useState(1)
  const [animating,  setAnimating]  = useState(false)
  const [submitted,  setSubmitted]  = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [sector,           setSector]           = useState('')
  const [baseInfo,         setBaseInfo]         = useState({ appName:'', users:'', language:'', platform:'' })
  const [selectedFeatures, setSelectedFeatures] = useState(new Set())
  const [selectedPack,     setSelectedPack]     = useState('')
  const [contactInfo,      setContactInfo]      = useState({ name:'', phone:'', email:'', message:'' })
  const [features,         setFeatures]         = useState(DEFAULT_FEATURES)

  useEffect(() => {
    supabase.from('config').select('value').eq('key','estimateur_features').single()
      .then(({ data }) => {
        if (data?.value && Array.isArray(data.value) && data.value.length > 0)
          setFeatures(data.value)
      }).catch(() => {})
  }, [])

  const goTo = useCallback((n) => {
    if (animating) return
    setAnimating(true)
    setTimeout(() => { setStep(n); setAnimating(false) }, 200)
    WalaupSound?.tab()
  }, [animating])

  const goNext = () => {
    if (step === 1 && !sector)                  { WalaupSound?.error(); return }
    if (step === 2 && !baseInfo.appName.trim()) { WalaupSound?.error(); return }
    if (step < 5) goTo(step + 1)
  }

  const toggleFeature = (id) => setSelectedFeatures(prev => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n
  })

  const handleSubmit = async () => {
    if (!contactInfo.name.trim() || !contactInfo.phone.trim()) { WalaupSound?.error(); return }
    setSubmitting(true); WalaupSound?.send()
    try {
      const featList   = [...selectedFeatures].map(id => features.find(f => f.id === id)?.name).filter(Boolean)
      const packObj    = PACKS.find(p => p.id === selectedPack)
      const basePrice  = packObj?.price.from || 0
      const extraPrice = [...selectedFeatures].reduce((s, id) => s + (features.find(f => f.id === id)?.price || 0), 0)
      await supabase.from('leads').insert({
        name: contactInfo.name.trim(), phone: contactInfo.phone.trim(),
        email: contactInfo.email.trim() || null,
        type: SECTORS.find(s => s.id === sector)?.label || sector,
        pack: selectedPack || null, status:'new', source:'estimateur',
        note: [
          `App: ${baseInfo.appName}`, `Utilisateurs: ${baseInfo.users}`,
          `Langue: ${baseInfo.language}`, `Plateforme: ${baseInfo.platform}`,
          `Fonctionnalités: ${featList.join(', ')}`,
          `Estimation: ${basePrice + extraPrice} DT`,
          contactInfo.message ? `Message: ${contactInfo.message}` : '',
        ].filter(Boolean).join('\n'),
        created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      })
      WalaupSound?.success(); setSubmitted(true)
    } catch(e) { console.error(e); WalaupSound?.error() }
    finally    { setSubmitting(false) }
  }

  return (
    <>
      <style>{`
        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .est-step { animation: fadeUp 0.24s cubic-bezier(0.16,1,0.3,1) both; }

        /* Scrollbar discret */
        .est-scroll::-webkit-scrollbar       { width:4px; }
        .est-scroll::-webkit-scrollbar-track { background:transparent; }
        .est-scroll::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:4px; }

        /* Focus inputs */
        .est-step input:focus, .est-step textarea:focus {
          border-color: rgba(99,102,241,0.5) !important;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
        }
        input::placeholder, textarea::placeholder { color: var(--tx-3); }

        /* Mobile adaptations */
        @media (max-width: 768px) {
          .est-layout    { flex-direction: column !important; }
          .est-sidebar-d { display: none !important; }
          .est-sidebar-m { display: block !important; }
          .contact-grid  { grid-template-columns: 1fr !important; }
        }
        @media (min-width: 769px) {
          .est-sidebar-m { display: none  !important; }
          .est-sidebar-d { display: block !important; }
        }
      `}</style>

      {submitted ? (
        <main style={{ minHeight:'100vh', background:'var(--bg-base)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <SuccessScreen name={contactInfo.name} sector={sector} pack={selectedPack} />
        </main>
      ) : (
        /* ── LAYOUT PRINCIPAL : prend toute la hauteur dispo (sous la navbar du layout) ── */
        <main style={{
          height:'calc(100vh - 64px)',   /* 64px = hauteur navbar globale */
          background:'var(--bg-base)',
          display:'flex', flexDirection:'column',
          overflow:'hidden',
        }}>

          {/* ── EN-TÊTE : titre + indicateur d'étapes ── */}
          <div style={{ padding:'20px 24px 16px', flexShrink:0 }}>
            {/* Titre */}
            <div style={{ textAlign:'center', marginBottom:16 }}>
              <div style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'4px 13px', background:'rgba(99,102,241,0.1)', border:'1px solid rgba(99,102,241,0.22)', borderRadius:20, marginBottom:8 }}>
                <Calculator size={12} color="var(--ac)" />
                <span style={{ fontSize:10, color:'var(--ac)', fontWeight:700, letterSpacing:'0.05em', textTransform:'uppercase' }}>Estimateur gratuit</span>
              </div>
              <h1 style={{ fontSize:'clamp(18px,3.5vw,28px)', fontWeight:900, color:'var(--tx)', letterSpacing:'-0.04em', margin:0, lineHeight:1.15 }}>
                Estimez votre app en{' '}
                <span style={{ background:'linear-gradient(135deg,var(--ac),var(--ac-2))', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
                  2 minutes
                </span>
              </h1>
            </div>

            {/* ── INDICATEUR D'ÉTAPES — TOUJOURS VISIBLE (mobile + desktop) ── */}
            <div style={{ maxWidth:680, margin:'0 auto' }}>
              <StepIndicator current={step} />
            </div>
          </div>

          {/* ── CORPS : sidebar gauche + carte droite défilable ── */}
          <div style={{ flex:1, minHeight:0, padding:'0 20px 16px', display:'flex', justifyContent:'center' }}>
            <div className="est-layout" style={{ width:'100%', maxWidth:1040, display:'flex', gap:18, minHeight:0 }}>

              {/* ── SIDEBAR ESTIMATION — gauche fixe (desktop) ── */}
              <div className="est-sidebar-d" style={{ width:252, flexShrink:0, alignSelf:'flex-start' }}>
                <PriceSidebar sector={sector} pack={selectedPack} features={features} selectedFeatures={selectedFeatures} compact={false} />
              </div>

              {/* ── COLONNE DROITE ── */}
              <div style={{ flex:1, minWidth:0, display:'flex', flexDirection:'column', minHeight:0, gap:12 }}>

                {/* Estimation compacte — mobile en haut */}
                <div className="est-sidebar-m">
                  <PriceSidebar sector={sector} pack={selectedPack} features={features} selectedFeatures={selectedFeatures} compact={true} />
                </div>

                {/* ── CARTE CONTENU : défilement interne uniquement ── */}
                <div style={{
                  flex:1, minHeight:0,
                  background:'rgba(13,17,32,0.75)',
                  border:'1px solid rgba(255,255,255,0.08)',
                  borderRadius:18, backdropFilter:'blur(20px)',
                  display:'flex', flexDirection:'column', overflow:'hidden',
                }}>
                  {/* Zone défilable */}
                  <div className="est-scroll" key={step}
                    style={{ flex:1, overflowY:'auto', overflowX:'hidden', padding:'24px 24px 8px' }}>
                    <div className="est-step">
                      {step === 1 && <StepSector   value={sector}       onChange={setSector} />}
                      {step === 2 && <StepBase      data={baseInfo}      onChange={(k,v) => setBaseInfo(p=>({...p,[k]:v}))} />}
                      {step === 3 && <StepFeatures  features={features}  selected={selectedFeatures} onToggle={toggleFeature} />}
                      {step === 4 && <StepPack      value={selectedPack} onChange={setSelectedPack} />}
                      {step === 5 && <StepContact   data={contactInfo}   onChange={(k,v) => setContactInfo(p=>({...p,[k]:v}))} onSubmit={handleSubmit} submitting={submitting} />}
                    </div>
                    <div style={{ height:12 }} />
                  </div>

                  {/* ── NAVIGATION — collée en bas de la carte ── */}
                  <div style={{
                    padding:'12px 24px',
                    borderTop:'1px solid rgba(255,255,255,0.06)',
                    background:'rgba(8,11,20,0.85)',
                    backdropFilter:'blur(12px)',
                    display:'flex', justifyContent:'space-between', alignItems:'center',
                    flexShrink:0,
                  }}>
                    <button onClick={() => goTo(step - 1)} disabled={step === 1}
                      style={{
                        display:'flex', alignItems:'center', gap:6,
                        padding:'9px 16px', background:'rgba(255,255,255,0.04)',
                        border:'1px solid rgba(255,255,255,0.09)', borderRadius:10,
                        color: step === 1 ? 'var(--tx-3)' : 'var(--tx-2)',
                        fontSize:13, fontWeight:600,
                        cursor: step === 1 ? 'not-allowed' : 'pointer',
                        opacity: step === 1 ? 0.4 : 1, transition:'all 0.2s ease',
                      }}>
                      <ChevronLeft size={15} />Précédent
                    </button>

                    <span style={{ fontSize:11, color:'var(--tx-3)', fontFamily:'var(--font-mono)' }}>
                      {step} / 5
                    </span>

                    {step < 5 && (
                      <button onClick={goNext}
                        style={{
                          display:'flex', alignItems:'center', gap:6,
                          padding:'9px 20px', background:'var(--ac)',
                          border:'none', borderRadius:10, color:'white',
                          fontSize:13, fontWeight:700, cursor:'pointer',
                          transition:'all 0.2s ease',
                          boxShadow:'0 3px 16px rgba(99,102,241,0.30)',
                        }}>
                        Suivant<ChevronRight size={15} />
                      </button>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>

        </main>
      )}
    </>
  )
}
