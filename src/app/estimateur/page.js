'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { WalaupSound } from '@/lib/sound'
import {
  Coffee, Stethoscope, ShoppingBag, Wrench, GraduationCap, MoreHorizontal,
  Users, Smartphone, Monitor, Check, ChevronRight, ChevronLeft,
  Zap, Shield, Rocket, Send, CheckCircle2, Clock, Calculator,
  Crown, Phone, Mail, MessageSquare, User, Layers,
  LayoutDashboard, Package, CreditCard, UserCheck, TrendingDown,
  Calendar, Bell, BarChart2, FileText, Link2,
  Building2, Plus, Target, Lock
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
  { id:'f1',  group:'Gestion',       name:'Tableau de bord',    icon:LayoutDashboard, color:'#6366F1', price:0,   days:0, desc:"Vue d'ensemble des données"  },
  { id:'f2',  group:'Gestion',       name:'Gestion du stock',   icon:Package,         color:'#F59E0B', price:80,  days:2, desc:'Entrées, sorties, alertes'   },
  { id:'f3',  group:'Gestion',       name:'Caisse & Paiement',  icon:CreditCard,      color:'#10B981', price:60,  days:2, desc:'Encaissement, reçus'         },
  { id:'f4',  group:'Gestion',       name:'Gestion employés',   icon:Users,           color:'#3B82F6', price:70,  days:2, desc:'Présences, fiches, paiements'},
  { id:'f5',  group:'Clients',       name:'Suivi clients',      icon:UserCheck,       color:'#EC4899', price:50,  days:1, desc:'Fiche client, historique'    },
  { id:'f6',  group:'Clients',       name:'Suivi des dettes',   icon:TrendingDown,    color:'#EF4444', price:60,  days:2, desc:'Créances, relances auto'     },
  { id:'f7',  group:'Clients',       name:'Réservations',       icon:Calendar,        color:'#8B5CF6', price:80,  days:3, desc:'Agenda et RDV en ligne'      },
  { id:'f8',  group:'Communication', name:'Notifications push', icon:Bell,            color:'#F97316', price:40,  days:1, desc:'Alertes et rappels'          },
  { id:'f9',  group:'Communication', name:'Chat interne',       icon:MessageSquare,   color:'#06B6D4', price:80,  days:3, desc:'Messagerie équipe'           },
  { id:'f10', group:'Rapports',      name:'Rapports & Stats',   icon:BarChart2,       color:'#84CC16', price:60,  days:2, desc:'Graphes, exports, analyses'  },
  { id:'f11', group:'Rapports',      name:'Export PDF',         icon:FileText,        color:'#A78BFA', price:30,  days:1, desc:'Factures, reçus en PDF'      },
  { id:'f12', group:'Avancé',        name:'API & Intégrations', icon:Link2,           color:'#34D399', price:120, days:4, desc:"Connecter d'autres outils"   },
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

// Map string name → Lucide component (used when features come from Supabase JSON)
const ICON_MAP = {
  LayoutDashboard, Package, CreditCard, Users, UserCheck, TrendingDown,
  Calendar, Bell, MessageSquare, BarChart2, FileText, Link2,
  Coffee, Stethoscope, ShoppingBag, Wrench, GraduationCap, MoreHorizontal,
  Zap, Shield, Rocket, Crown, Calculator, Monitor, Smartphone, Layers,
  Building2, Plus, Target, Lock, Check, ChevronRight, ChevronLeft,
  Send, CheckCircle2, Clock, User, Phone, Mail,
}

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

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current }) {
  const waveCss = [
    '@keyframes est-wave {',
    '  0%   { background-position: 0% center; }',
    '  100% { background-position: 200% center; }',
    '}',
    '.est-prog-done {',
    '  background: linear-gradient(90deg,#6366F1,#8B5CF6);',
    '  box-shadow: 0 0 6px rgba(99,102,241,0.45);',
    '}',
    '.est-prog-wave {',
    '  background: repeating-linear-gradient(',
    '    90deg,',
    '    rgba(99,102,241,0.35) 0px,',
    '    #8B5CF6 10px,',
    '    #a78bfa 18px,',
    '    rgba(99,102,241,0.35) 28px',
    '  );',
    '  background-size: 56px 100%;',
    '  animation: est-wave 1.1s linear infinite;',
    '  box-shadow: 0 0 10px rgba(139,92,246,0.55);',
    '}',
  ].join('\n')

  const total = STEP_LABELS.length
  const ratio = total > 1 ? (current - 1) / (total - 1) : 0
  const r100  = (ratio * 100).toFixed(2)
  const r30   = (ratio * 30).toFixed(2)
  const progressW = ratio === 0 ? '0px' : 'calc(' + r100 + '% - ' + r30 + 'px)'
  const progClass  = ratio >= 1 ? 'est-prog-done' : ratio > 0 ? 'est-prog-wave' : ''

  const sOuter      = { position: 'relative', width: '100%', paddingBottom: 4 }
  const sCircleRow  = { position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 30, marginBottom: 6 }
  const sBaseLine   = { position: 'absolute', top: '50%', left: 15, right: 15, height: 2, marginTop: -1, background: 'rgba(255,255,255,0.07)', borderRadius: 1, zIndex: 0 }
  const sProgressLine = { position: 'absolute', top: '50%', left: 15, width: progressW, height: 2, marginTop: -1, borderRadius: 1, zIndex: 0, transition: 'width 0.5s cubic-bezier(0.16,1,0.3,1)' }
  const sLabelRow   = { display: 'flex', justifyContent: 'space-between' }

  return (
    <>
      <style>{waveCss}</style>
      <div style={sOuter}>
        <div style={sCircleRow}>
          <div style={sBaseLine} />
          <div style={sProgressLine} className={progClass} />
          {STEP_LABELS.map(function(label, i) {
            const n    = i + 1
            const done = n < current
            const act  = n === current
            const cStyle = {
              width: 30, height: 30, borderRadius: '50%',
              flexShrink: 0, position: 'relative', zIndex: 1,
              background: done ? 'var(--ac)' : act ? '#1a1b3a' : '#0d1020',
              border: '2px solid ' + (done ? 'var(--ac)' : act ? 'var(--ac)' : 'rgba(255,255,255,0.15)'),
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
              boxShadow: act  ? '0 0 16px rgba(99,102,241,0.55)'
                       : done ? '0 0 10px rgba(99,102,241,0.28)'
                       : 'none',
            }
            const nStyle = {
              fontSize: 11, fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              color: act ? 'var(--ac)' : 'var(--tx-3)',
            }
            return (
              <div key={n} style={cStyle}>
                {done
                  ? <Check size={14} color="white" strokeWidth={2.5} />
                  : <span style={nStyle}>{n}</span>
                }
              </div>
            )
          })}
        </div>
        <div style={sLabelRow}>
          {STEP_LABELS.map(function(label, i) {
            const n    = i + 1
            const done = n < current
            const act  = n === current
            const lStyle = {
              fontSize: 9, fontWeight: 600,
              letterSpacing: '0.04em', textTransform: 'uppercase',
              color: act ? 'var(--tx)' : done ? 'var(--tx-2)' : 'var(--tx-3)',
              whiteSpace: 'nowrap', textAlign: 'center',
              transition: 'color 0.3s ease',
              flex: 1,
            }
            return <span key={n} style={lStyle}>{label}</span>
          })}
        </div>
      </div>
    </>
  )
}

// ─── Price Sidebar ────────────────────────────────────────────────────────────

function PriceSidebar({ sector, pack, features, selectedFeatures, compact }) {
  const packObj   = pack ? PACKS.find(function(p) { return p.id === pack }) : null
  const basePrice = packObj ? packObj.price.from : 150
  const extra     = Array.from(selectedFeatures).reduce(function(s, id) {
    const f = features.find(function(f) { return f.id === id })
    return s + (f ? f.price : 0)
  }, 0)
  const total     = basePrice + extra
  const days      = 2 + Array.from(selectedFeatures).reduce(function(s, id) {
    const f = features.find(function(f) { return f.id === id })
    return s + (f ? f.days : 0)
  }, 0)
  const sectorObj = sector ? SECTORS.find(function(s) { return s.id === sector }) : null

  const sRoot = {
    background: 'rgba(10,13,25,0.97)',
    border: '1px solid rgba(255,255,255,0.09)',
    borderRadius: 16,
    padding: compact ? '13px 14px' : '20px',
    backdropFilter: 'blur(20px)',
    width: '100%', boxSizing: 'border-box',
  }
  const sHead = { display:'flex', alignItems:'center', gap:9, marginBottom: compact ? 10 : 16 }
  const sHeadIcon = {
    width:30, height:30, borderRadius:8,
    background:'rgba(99,102,241,0.15)', border:'1px solid rgba(99,102,241,0.3)',
    display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
  }
  const sHeadTitle = { fontSize:12, fontWeight:700, color:'var(--tx)' }
  const sHeadSub   = { fontSize:10, color:'var(--tx-3)' }

  const sPriceBox = {
    background: 'rgba(99,102,241,0.07)',
    borderRadius: compact ? 11 : 13,
    padding: compact ? '10px 12px' : '15px',
    marginBottom: compact ? 0 : 13,
    border: '1px solid rgba(99,102,241,0.15)',
    flex: compact ? 1 : undefined,
  }
  const sPriceLbl = { fontSize:10, color:'var(--tx-3)', marginBottom: compact ? 3 : 4, textTransform:'uppercase', letterSpacing:'0.05em' }
  const sPriceRow = { display:'flex', alignItems:'baseline', gap: compact ? 4 : 5 }
  const sPriceNum = { fontSize: compact ? 26 : 36, fontWeight:800, color:'var(--tx)', fontFamily:'var(--font-mono)', letterSpacing:'-0.03em', transition:'all 0.3s ease' }
  const sPriceDt  = { fontSize: compact ? 13 : 15, fontWeight:600, color:'var(--tx-2)' }
  const sPriceSub = { fontSize: compact ? 10 : 11, color:'var(--tx-3)', marginTop: compact ? 0 : 2 }

  const sDelayBox = {
    display:'flex', flexDirection: compact ? 'column' : 'row',
    alignItems:'center',
    justifyContent: compact ? 'center' : undefined,
    gap: compact ? 2 : 8,
    padding: compact ? '10px 14px' : '11px 13px',
    background: compact ? 'rgba(52,211,153,0.07)' : 'rgba(52,211,153,0.06)',
    borderRadius: compact ? 11 : 10,
    border: '1px solid rgba(52,211,153,0.15)',
    marginBottom: compact ? 0 : 14,
    flexShrink: compact ? 0 : undefined,
  }
  const sDelayLbl  = { fontSize:10, color:'#34D399', fontWeight:600 }
  const sDelayVal  = { fontSize: compact ? 12 : 13, color:'var(--tx)', fontWeight:700, fontFamily:'var(--font-mono)', whiteSpace:'nowrap' }

  const sCompactRow = { display:'flex', gap:10, marginBottom:10 }
  const sSummary    = { marginBottom: compact ? 4 : 13 }
  const sGuarantee  = { padding:'10px 12px', background:'rgba(255,255,255,0.02)', borderRadius:9, border:'1px solid rgba(255,255,255,0.06)' }
  const sGuarRow    = { display:'flex', gap:7, alignItems:'flex-start' }
  const sGuarTxt    = { fontSize:11, color:'var(--tx-3)', lineHeight:1.5, margin:0 }
  const sShield     = { flexShrink:0, marginTop:2 }
  const sGuarStrong = { color:'var(--tx-2)' }

  return (
    <div style={sRoot}>
      <div style={sHead}>
        <div style={sHeadIcon}><Calculator size={14} color="var(--ac)" /></div>
        <div>
          <div style={sHeadTitle}>Estimation</div>
          <div style={sHeadSub}>Temps réel</div>
        </div>
      </div>

      {compact ? (
        <div style={sCompactRow}>
          <div style={sPriceBox}>
            <div style={sPriceLbl}>Prix estimé</div>
            <div style={sPriceRow}>
              <span style={sPriceNum}>{total}</span>
              <span style={sPriceDt}>DT</span>
            </div>
            {packObj && <div style={sPriceSub}>+ {packObj.monthly} DT/mois</div>}
          </div>
          <div style={sDelayBox}>
            <Clock size={13} color="#34D399" />
            <div style={sDelayLbl}>Délai</div>
            <div style={sDelayVal}>{days <= 14 ? days + 'j' : Math.ceil(days/7) + ' sem.'}</div>
          </div>
        </div>
      ) : (
        <>
          <div style={sPriceBox}>
            <div style={sPriceLbl}>Prix estimé</div>
            <div style={sPriceRow}>
              <span style={sPriceNum}>{total}</span>
              <span style={sPriceDt}>DT</span>
            </div>
            {packObj && <div style={sPriceSub}>+ {packObj.monthly} DT/mois</div>}
          </div>
          <div style={sDelayBox}>
            <Clock size={14} color="#34D399" />
            <div>
              <div style={sDelayLbl}>Délai estimé</div>
              <div style={sDelayVal}>{days <= 14 ? days + ' jours' : Math.ceil(days/7) + ' semaines'}</div>
            </div>
          </div>
        </>
      )}

      <div style={sSummary}>
        {sectorObj && <SRow Icon={Building2} label="Secteur"         value={sectorObj.label} />}
        {packObj   && <SRow Icon={Package}   label="Pack"            value={packObj.name} color={packObj.color} />}
                       <SRow Icon={Zap}       label="Fonctionnalités" value={selectedFeatures.size + ' sélectionnées'} />
        {extra > 0 && <SRow Icon={Plus}      label="Options"         value={'+' + extra + ' DT'} color="var(--ac)" />}
      </div>

      {!compact && (
        <div style={sGuarantee}>
          <div style={sGuarRow}>
            <Shield size={12} color="#34D399" style={sShield} />
            <p style={sGuarTxt}><strong style={sGuarStrong}>0 DT avant validation</strong> — démo gratuite avant paiement.</p>
          </div>
        </div>
      )}
    </div>
  )
}

function SRow({ Icon, label, value, color }) {
  const sRow  = { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }
  const sLeft = { display:'flex', alignItems:'center', gap:6 }
  const sLbl  = { fontSize:11, color:'var(--tx-3)' }
  const sVal  = { fontSize:11, fontWeight:600, color: color || 'var(--tx-2)' }
  return (
    <div style={sRow}>
      <div style={sLeft}>
        <Icon size={11} color="var(--tx-3)" strokeWidth={2} />
        <span style={sLbl}>{label}</span>
      </div>
      <span style={sVal}>{value}</span>
    </div>
  )
}

// ─── Step 1 — Secteur ─────────────────────────────────────────────────────────

function StepSector({ value, onChange }) {
  const sGrid = { display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:11 }
  return (
    <div>
      <h2 style={S.stepTitle}>Votre secteur d'activité</h2>
      <p style={S.stepSub}>Nous adaptons chaque app à votre métier.</p>
      <div style={sGrid}>
        {SECTORS.map(function(s) {
          const Icon   = s.icon
          const active = value === s.id
          const sBtnBase = {
            background: active ? s.color + '14' : 'rgba(255,255,255,0.03)',
            border: '2px solid ' + (active ? s.color : 'rgba(255,255,255,0.08)'),
            borderRadius:13, padding:'16px 12px',
            cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:9,
            transition:'all 0.22s cubic-bezier(0.16,1,0.3,1)', position:'relative',
            transform: active ? 'translateY(-2px) scale(1.02)' : 'none',
            boxShadow: active ? '0 5px 20px ' + s.color + '28, 0 0 0 1px ' + s.color + '35' : 'none',
          }
          const sIconBox = {
            width:42, height:42, borderRadius:12,
            background: active ? s.color + '22' : 'rgba(255,255,255,0.05)',
            border: '1px solid ' + (active ? s.color + '50' : 'rgba(255,255,255,0.1)'),
            display:'flex', alignItems:'center', justifyContent:'center',
            transition:'all 0.22s ease',
          }
          const sLabel = { fontSize:12, fontWeight:600, color: active ? s.color : 'var(--tx-2)', textAlign:'center', lineHeight:1.3 }
          const sBadge = { position:'absolute', top:8, right:8, width:17, height:17, borderRadius:'50%', background:s.color, display:'flex', alignItems:'center', justifyContent:'center' }
          return (
            <button key={s.id} onClick={function() { onChange(s.id); WalaupSound && WalaupSound.click && WalaupSound.click() }} style={sBtnBase}>
              <div style={sIconBox}>
                <Icon size={20} color={active ? s.color : 'var(--tx-2)'} strokeWidth={1.8} />
              </div>
              <span style={sLabel}>{s.label}</span>
              {active && <div style={sBadge}><Check size={10} color="white" strokeWidth={3} /></div>}
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
  const sUserGrid = { display:'flex', gap:8, flexWrap:'wrap' }
  const sPlatGrid = { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:9 }
  return (
    <div>
      <h2 style={S.stepTitle}>Informations de base</h2>
      <p style={S.stepSub}>Dites-nous en plus sur votre projet.</p>

      <div style={S.fieldGrp}>
        <label style={S.label}>Nom de l'application <span style={S.required}>obligatoire</span></label>
        <input type="text" value={data.appName} maxLength={60}
          onChange={function(e) { onChange('appName', e.target.value); setNameError(false) }}
          onBlur={function() { if (!data.appName.trim()) setNameError(true) }}
          placeholder="Ex : CaféPro, StockMaster..."
          style={Object.assign({}, S.input, nameError ? { borderColor:'var(--red)' } : data.appName ? { borderColor:'rgba(99,102,241,0.45)' } : {})} />
        {nameError && <span style={S.errMsg}>Le nom est obligatoire</span>}
        <span style={S.hint}>Ce nom apparaîtra dans votre application.</span>
      </div>

      <div style={S.fieldGrp}>
        <label style={S.label}>Nombre d'utilisateurs</label>
        <div style={sUserGrid}>
          {USER_RANGES.map(function(r) {
            return (
              <button key={r} onClick={function() { onChange('users', r); WalaupSound && WalaupSound.tab && WalaupSound.tab() }}
                style={Object.assign({}, S.chip, data.users === r ? S.chipOn : {})}>
                <Users size={12} />{r}
              </button>
            )
          })}
        </div>
      </div>

      <div style={S.fieldGrp}>
        <label style={S.label}>Langue de l'interface</label>
        <div style={sUserGrid}>
          {LANGUAGES.map(function(l) {
            return (
              <button key={l.id} onClick={function() { onChange('language', l.id); WalaupSound && WalaupSound.tab && WalaupSound.tab() }}
                style={Object.assign({}, S.chip, data.language === l.id ? S.chipOn : {})}>
                <span>{l.flag}</span>{l.label}
              </button>
            )
          })}
        </div>
      </div>

      <div style={S.fieldGrp}>
        <label style={S.label}>Plateforme cible</label>
        <div style={sPlatGrid}>
          {PLATFORMS.map(function(p) {
            const Icon   = p.icon
            const active = data.platform === p.id
            const sBtn = {
              background: active ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.03)',
              border: '2px solid ' + (active ? 'var(--ac)' : 'rgba(255,255,255,0.08)'),
              borderRadius:11, padding:'13px 9px',
              cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:6,
              transition:'all 0.2s ease',
              boxShadow: active ? '0 3px 14px rgba(99,102,241,0.2)' : 'none',
            }
            const sLbl    = { fontSize:11, fontWeight:600, color: active ? 'var(--ac)' : 'var(--tx-2)' }
            const sDesc   = { fontSize:10, color:'var(--tx-3)' }
            const sCenter = { textAlign:'center' }
            return (
              <button key={p.id} onClick={function() { onChange('platform', p.id); WalaupSound && WalaupSound.click && WalaupSound.click() }} style={sBtn}>
                <Icon size={18} color={active ? 'var(--ac)' : 'var(--tx-3)'} strokeWidth={1.8} />
                <div style={sCenter}>
                  <div style={sLbl}>{p.label}</div>
                  <div style={sDesc}>{p.desc}</div>
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
  const groups = Array.from(new Set(features.map(function(f) { return f.group })))
  const sGrpWrap = { marginBottom:22 }
  const sGrpLbl  = { fontSize:10, fontWeight:700, color:'var(--tx-3)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 }
  const sFeatGrid = { display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:8 }
  return (
    <div>
      <h2 style={S.stepTitle}>Fonctionnalités</h2>
      <p style={S.stepSub}>Sélectionnez ce dont votre app a besoin. Le prix s'ajuste automatiquement.</p>
      {groups.map(function(group) {
        return (
          <div key={group} style={sGrpWrap}>
            <div style={sGrpLbl}>{group}</div>
            <div style={sFeatGrid}>
              {features.filter(function(f) { return f.group === group }).map(function(feat) {
                const active = selected.has(feat.id)
                const sBtn = {
                  background: active ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.02)',
                  border: '1.5px solid ' + (active ? 'rgba(99,102,241,0.45)' : 'rgba(255,255,255,0.07)'),
                  borderRadius:12, padding:'12px', cursor:'pointer', textAlign:'left',
                  transition:'all 0.2s cubic-bezier(0.16,1,0.3,1)',
                  transform: active ? 'scale(1.01)' : 'scale(1)',
                  boxShadow: active ? '0 3px 14px rgba(99,102,241,0.15)' : 'none',
                }
                const FeatIcon  = typeof feat.icon === 'string' ? (ICON_MAP[feat.icon] || Package) : (feat.icon || Package)
                const featColor = feat.color || '#6366F1'
                const icoColor  = active ? '#ffffff' : featColor
                const icoFilter = active
                  ? 'drop-shadow(0 0 6px rgba(99,102,241,0.9))'
                  : 'drop-shadow(0 0 5px ' + featColor + 'cc)'
                const sIcoAnim  = { filter: icoFilter, animation: 'est-ico-pulse 2.2s ease-in-out infinite', flexShrink: 0 }
                const sTop    = { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }
                const sCheck  = {
                  width:17, height:17, borderRadius:'50%', flexShrink:0,
                  background: active ? 'var(--ac)' : 'rgba(255,255,255,0.06)',
                  border: '2px solid ' + (active ? 'var(--ac)' : 'rgba(255,255,255,0.12)'),
                  display:'flex', alignItems:'center', justifyContent:'center',
                  transition:'all 0.2s ease',
                }
                const sName   = { fontSize:12, fontWeight:600, color: active ? 'var(--tx)' : 'var(--tx-2)', marginBottom:2 }
                const sDesc   = { fontSize:10, color:'var(--tx-3)', lineHeight:1.4, marginBottom:8 }
                const sBottom = { display:'flex', justifyContent:'space-between', alignItems:'center' }
                const sPrice  = { fontSize:10, color: feat.price > 0 ? 'var(--gold)' : 'var(--green)', fontWeight:700, fontFamily:'var(--font-mono)' }
                const sDays   = { fontSize:10, color:'var(--tx-3)', display:'flex', alignItems:'center', gap:2 }
                return (
                  <button key={feat.id} onClick={function() { onToggle(feat.id); WalaupSound && WalaupSound.click && WalaupSound.click() }} style={sBtn}>
                    <div style={sTop}>
                      <FeatIcon size={20} color={icoColor} strokeWidth={1.8} style={sIcoAnim} />
                      <div style={sCheck}>{active && <Check size={9} color="white" strokeWidth={3} />}</div>
                    </div>
                    <div style={sName}>{feat.name}</div>
                    <div style={sDesc}>{feat.desc}</div>
                    <div style={sBottom}>
                      <span style={sPrice}>{feat.price > 0 ? '+' + feat.price + ' DT' : 'Inclus'}</span>
                      {feat.days > 0 && <span style={sDays}><Clock size={9} />{feat.days}j</span>}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Step 4 — Pack ────────────────────────────────────────────────────────────

function StepPack({ value, onChange }) {
  const activePackObj = value ? PACKS.find(function(p) { return p.id === value }) : null
  const sCol  = { display:'flex', flexDirection:'column', gap:12 }
  const sFeatGrid = { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px 12px' }
  const sFeatBox  = { background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:'13px 15px' }
  const sFeatLbl  = { fontSize:11, color:'var(--tx-3)', marginBottom:9, fontWeight:600 }
  return (
    <div>
      <h2 style={S.stepTitle}>Choisissez votre pack</h2>
      <p style={S.stepSub}>Du premier lancement jusqu'aux revenus passifs.</p>
      <div style={sCol}>
        {PACKS.map(function(pack) {
          const Icon   = pack.icon
          const active = value === pack.id
          const sBtn = {
            background: active ? pack.colorAlpha : 'rgba(255,255,255,0.02)',
            border: '2px solid ' + (active ? pack.color : 'rgba(255,255,255,0.08)'),
            borderRadius:14, padding:'16px 18px', cursor:'pointer', textAlign:'left',
            transition:'all 0.22s cubic-bezier(0.16,1,0.3,1)',
            transform: active ? 'translateX(4px)' : 'none',
            boxShadow: active ? '0 6px 28px ' + pack.color + '20' : 'none',
            position:'relative', display:'flex', alignItems:'center', gap:14,
          }
          const sBadge = { position:'absolute', top:10, right:10, background:pack.color, color:'white', fontSize:9, fontWeight:800, padding:'2px 8px', borderRadius:20, letterSpacing:'0.06em' }
          const sIcon  = { width:40, height:40, borderRadius:11, flexShrink:0, background: pack.color + '20', border:'1px solid ' + pack.color + '40', display:'flex', alignItems:'center', justifyContent:'center' }
          const sInfo  = { flex:1, minWidth:0 }
          const sRow1  = { display:'flex', alignItems:'baseline', gap:7, marginBottom:2 }
          const sName  = { fontSize:15, fontWeight:800, color:'var(--tx)' }
          const sTag   = { fontSize:11, color:'var(--tx-3)' }
          const sRow2  = { display:'flex', alignItems:'baseline', gap:4 }
          const sPrice = { fontSize:22, fontWeight:800, color:pack.color, fontFamily:'var(--font-mono)', letterSpacing:'-0.02em' }
          const sDt    = { fontSize:12, color:'var(--tx-2)' }
          const sMo    = { fontSize:11, color:'var(--tx-3)', marginLeft:4 }
          const sCircle = {
            width:20, height:20, borderRadius:'50%', flexShrink:0,
            background: active ? pack.color : 'rgba(255,255,255,0.06)',
            border: '2px solid ' + (active ? pack.color : 'rgba(255,255,255,0.12)'),
            display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s ease',
          }
          return (
            <button key={pack.id} onClick={function() { onChange(pack.id); WalaupSound && WalaupSound.success && WalaupSound.success() }} style={sBtn}>
              {pack.badge && <div style={sBadge}>{pack.badge}</div>}
              <div style={sIcon}><Icon size={19} color={pack.color} strokeWidth={1.8} /></div>
              <div style={sInfo}>
                <div style={sRow1}>
                  <span style={sName}>{pack.name}</span>
                  <span style={sTag}>{pack.tagline}</span>
                </div>
                <div style={sRow2}>
                  <span style={sPrice}>{pack.price.from}</span>
                  <span style={sDt}>DT</span>
                  <span style={sMo}>+ {pack.monthly} DT/mois</span>
                </div>
              </div>
              <div style={sCircle}>{active && <Check size={11} color="white" strokeWidth={3} />}</div>
            </button>
          )
        })}
        {activePackObj && (
          <div style={sFeatBox}>
            <div style={sFeatLbl}>Ce que vous obtenez :</div>
            <div style={sFeatGrid}>
              {activePackObj.features.map(function(f) {
                const sCheckIco = { flexShrink:0, marginTop:1 }
                const sItem = { display:'flex', gap:6, alignItems:'flex-start' }
                const sTxt  = { fontSize:11, color:'var(--tx-2)', lineHeight:1.4 }
                return (
                  <div key={f} style={sItem}>
                    <CheckCircle2 size={12} color={activePackObj.color} strokeWidth={2} style={sCheckIco} />
                    <span style={sTxt}>{f}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Step 5 — Contact ─────────────────────────────────────────────────────────

function StepContact({ data, onChange, onSubmit, submitting }) {
  const sGrid   = { display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }
  const sGuarantees = { display:'flex', gap:16, flexWrap:'wrap', marginBottom:20 }
  const sGItem  = { display:'flex', alignItems:'center', gap:6 }
  const sGTxt   = { fontSize:12, color:'var(--tx-3)' }
  const sSubmitBase = {
    width:'100%', padding:'14px 20px',
    border:'none', borderRadius:12,
    display:'flex', alignItems:'center', justifyContent:'center', gap:9,
    fontSize:14, fontWeight:700, color:'white', transition:'all 0.2s ease',
    boxShadow:'0 5px 24px rgba(99,102,241,0.30)',
  }
  const canSubmit = data.name.trim() && data.phone.trim()
  const sSubmit = Object.assign({}, sSubmitBase, {
    background: canSubmit ? 'var(--ac)' : 'rgba(99,102,241,0.3)',
    cursor: submitting ? 'wait' : canSubmit ? 'pointer' : 'not-allowed',
    opacity: canSubmit ? 1 : 0.55,
  })
  const sSpinner = { width:16, height:16, borderRadius:'50%', border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'white', animation:'spin 0.8s linear infinite' }
  const icoStyle = S.icoStyle
  return (
    <div>
      <h2 style={S.stepTitle}>Vos coordonnées</h2>
      <p style={S.stepSub}>Nous vous contactons sous 24h pour votre démo gratuite.</p>
      <div style={sGrid} className="contact-grid">
        <div>
          <label style={S.label}>Nom <span style={S.required}>obligatoire</span></label>
          <div style={S.inputWrap}>
            <User size={14} color="var(--tx-3)" style={icoStyle} />
            <input type="text" value={data.name} onChange={function(e) { onChange('name', e.target.value) }}
              placeholder="Votre nom" style={Object.assign({}, S.input, { paddingLeft:36 })} />
          </div>
        </div>
        <div>
          <label style={S.label}>Téléphone <span style={S.required}>obligatoire</span></label>
          <div style={S.inputWrap}>
            <Phone size={14} color="var(--tx-3)" style={icoStyle} />
            <input type="tel" value={data.phone} onChange={function(e) { onChange('phone', e.target.value) }}
              placeholder="+216 XX XXX XXX" style={Object.assign({}, S.input, { paddingLeft:36 })} />
          </div>
        </div>
      </div>
      <div style={S.fieldGrp}>
        <label style={S.label}>Email</label>
        <div style={S.inputWrap}>
          <Mail size={14} color="var(--tx-3)" style={icoStyle} />
          <input type="email" value={data.email} onChange={function(e) { onChange('email', e.target.value) }}
            placeholder="votre@email.com" style={Object.assign({}, S.input, { paddingLeft:36 })} />
        </div>
      </div>
      <div style={Object.assign({}, S.fieldGrp, { marginBottom:20 })}>
        <label style={S.label}>Message (optionnel)</label>
        <div style={S.inputWrap}>
          <MessageSquare size={14} color="var(--tx-3)" style={Object.assign({}, icoStyle, { top:13 })} />
          <textarea value={data.message} onChange={function(e) { onChange('message', e.target.value) }}
            placeholder="Décrivez votre projet..." rows={3}
            style={Object.assign({}, S.input, { paddingLeft:36, resize:'vertical', minHeight:85, lineHeight:1.6 })} />
        </div>
      </div>
      <div style={sGuarantees}>
        {[[Target,'Démo 100% gratuite'],[Zap,'Réponse en 24h'],[Lock,'Sans engagement']].map(function(item) {
          const ItemIcon = item[0]
          return (
            <div key={item[1]} style={sGItem}>
              <ItemIcon size={14} color="var(--ac)" strokeWidth={2} />
              <span style={sGTxt}>{item[1]}</span>
            </div>
          )
        })}
      </div>
      <button onClick={onSubmit} disabled={submitting || !canSubmit} style={sSubmit}>
        {submitting
          ? <><div style={sSpinner} />Envoi...</>
          : <><Send size={16} />Recevoir ma démo gratuite</>
        }
      </button>
    </div>
  )
}

// ─── Success ──────────────────────────────────────────────────────────────────

function SuccessScreen({ name, sector, pack }) {
  const packObj   = PACKS.find(function(p) { return p.id === pack })
  const sectorObj = SECTORS.find(function(s) { return s.id === sector })
  const sWrap  = { textAlign:'center', padding:'48px 24px', maxWidth:480, margin:'0 auto' }
  const sIcon  = { width:68, height:68, borderRadius:'50%', background:'rgba(52,211,153,0.13)', border:'2px solid rgba(52,211,153,0.38)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 22px', boxShadow:'0 0 32px rgba(52,211,153,0.2)' }
  const sTitle = { fontSize:24, fontWeight:800, color:'var(--tx)', marginBottom:10, letterSpacing:'-0.03em' }
  const sText  = { fontSize:15, color:'var(--tx-2)', lineHeight:1.6, marginBottom:28 }
  const sBox   = { background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, padding:'18px', marginBottom:24, textAlign:'left' }
  const sBtns  = { display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap' }
  const sBtnBack = { padding:'10px 20px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, color:'var(--tx-2)', textDecoration:'none', fontSize:13, fontWeight:600, display:'flex', alignItems:'center', gap:6 }
  const sBtnMk   = { padding:'10px 20px', background:'var(--ac)', borderRadius:10, color:'white', textDecoration:'none', fontSize:13, fontWeight:600, display:'flex', alignItems:'center', gap:6, boxShadow:'0 3px 12px rgba(99,102,241,0.3)' }
  const sStrong1 = { color:'var(--tx)' }
  const sStrong2 = { color:'var(--ac)' }
  return (
    <div style={sWrap}>
      <div style={sIcon}><CheckCircle2 size={32} color="#34D399" /></div>
      <h2 style={sTitle}>Demande envoyée !</h2>
      <p style={sText}>
        Merci <strong style={sStrong1}>{name}</strong>. Notre équipe vous contacte dans les <strong style={sStrong2}>24 heures</strong>.
      </p>
      <div style={sBox}>
        {sectorObj && <SRow Icon={Building2}    label="Secteur" value={sectorObj.label} />}
        {packObj   && <SRow Icon={Package}      label="Pack"    value={packObj.name} color={packObj.color} />}
                       <SRow Icon={CheckCircle2} label="Statut"  value="Démo programmée" color="#34D399" />
      </div>
      <div style={sBtns}>
        <a href="/" style={sBtnBack}><ChevronLeft size={14} />Retour</a>
        <a href="/marketplace" style={sBtnMk}>Explorer le marketplace<ChevronRight size={14} /></a>
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

  // Charge les fonctionnalités depuis Supabase (config)
  useEffect(function() {
    supabase.from('config').select('value').eq('key','estimateur_features').single()
      .then(function(res) {
        if (res.data && res.data.value && Array.isArray(res.data.value) && res.data.value.length > 0) {
          var merged = res.data.value.map(function(f) {
            var def = DEFAULT_FEATURES.find(function(d) { return d.id === f.id })
            return Object.assign({}, f, {
              icon:  def ? def.icon  : (ICON_MAP[f.icon] || Package),
              color: def ? def.color : (f.color || '#6366F1'),
            })
          })
          setFeatures(merged)
        }
      }).catch(function() {})
  }, [])

  // Cache navbar + footer (plein écran)
  useEffect(function() {
    var toHide = [
      ...document.querySelectorAll('nav'),
      ...document.querySelectorAll('header'),
      ...document.querySelectorAll('footer'),
    ]
    toHide.forEach(function(el) { el.style.setProperty('display','none','important') })
    return function() { toHide.forEach(function(el) { el.style.removeProperty('display') }) }
  }, [])

  const goTo = useCallback(function(n) {
    if (animating) return
    setAnimating(true)
    setTimeout(function() { setStep(n); setAnimating(false) }, 200)
    WalaupSound && WalaupSound.tab && WalaupSound.tab()
  }, [animating])

  function goNext() {
    if (step === 1 && !sector)                  { WalaupSound && WalaupSound.error && WalaupSound.error(); return }
    if (step === 2 && !baseInfo.appName.trim()) { WalaupSound && WalaupSound.error && WalaupSound.error(); return }
    if (step < 5) goTo(step + 1)
  }

  function toggleFeature(id) {
    setSelectedFeatures(function(prev) {
      var n = new Set(prev)
      if (n.has(id)) { n.delete(id) } else { n.add(id) }
      return n
    })
  }

  // ✅ handleSubmit — sauvegarde pay_amount dans la BDD
  async function handleSubmit() {
    if (!contactInfo.name.trim() || !contactInfo.phone.trim()) {
      WalaupSound && WalaupSound.error && WalaupSound.error()
      return
    }
    setSubmitting(true)
    WalaupSound && WalaupSound.send && WalaupSound.send()
    try {
      const featList = Array.from(selectedFeatures).map(function(id) {
        const f = features.find(function(f) { return f.id === id })
        return f ? f.name : null
      }).filter(Boolean)

      const packObj   = PACKS.find(function(p) { return p.id === selectedPack })
      const basePrice = packObj ? packObj.price.from : 0
      const extraPrice = Array.from(selectedFeatures).reduce(function(s, id) {
        const f = features.find(function(f) { return f.id === id })
        return s + (f ? f.price : 0)
      }, 0)
      // ✅ Montant total calculé
      const totalPrice = basePrice + extraPrice

      const sectorLabel = SECTORS.find(function(s) { return s.id === sector })

      await supabase.from('leads').insert({
        name:       contactInfo.name.trim(),
        phone:      contactInfo.phone.trim(),
        email:      contactInfo.email.trim() || null,
        type:       sectorLabel ? sectorLabel.label : sector,
        pack:       selectedPack || null,
        status:     'new',
        source:     'estimateur',
        pay_amount: totalPrice,  // ✅ Montant enregistré en BDD → affiché dans le modal paiement client
        note: [
          'App: '           + baseInfo.appName,
          'Utilisateurs: '  + baseInfo.users,
          'Langue: '        + baseInfo.language,
          'Plateforme: '    + baseInfo.platform,
          'Fonctionnalités: ' + featList.join(', '),
          'Estimation: '    + totalPrice + ' DT',
          contactInfo.message ? 'Message: ' + contactInfo.message : '',
        ].filter(Boolean).join('\n'),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      WalaupSound && WalaupSound.success && WalaupSound.success()
      setSubmitted(true)
    } catch(e) {
      console.error(e)
      WalaupSound && WalaupSound.error && WalaupSound.error()
    } finally {
      setSubmitting(false)
    }
  }

  // ── CSS
  const pageCss = [
    '@keyframes spin   { to { transform: rotate(360deg); } }',
    '@keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }',
    '.est-step { animation: fadeUp 0.24s cubic-bezier(0.16,1,0.3,1) both; }',
    '.est-root { position:fixed; inset:0; display:flex; flex-direction:column; background:var(--bg-base); z-index:1000; overflow-y:auto; }',
    '.est-root::-webkit-scrollbar { width:4px; }',
    '.est-root::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:4px; }',
    '.est-scroll::-webkit-scrollbar { width:4px; }',
    '.est-scroll::-webkit-scrollbar-track { background:transparent; }',
    '.est-scroll::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:4px; }',
    '@keyframes est-ico-pulse { 0%,100% { opacity:0.8; transform:scale(1); } 50% { opacity:1; transform:scale(1.12); } }',
    '.est-step input:focus, .est-step textarea:focus { border-color:rgba(99,102,241,0.5) !important; box-shadow:0 0 0 3px rgba(99,102,241,0.1); }',
    'input::placeholder, textarea::placeholder { color:var(--tx-3); }',
    '@media (max-width:768px) { .est-layout { flex-direction:column !important; } .est-sidebar-d { display:none !important; } .est-sidebar-m { display:block !important; } .contact-grid { grid-template-columns:1fr !important; } }',
    '@media (min-width:769px) { .est-sidebar-m { display:none !important; } .est-sidebar-d { display:block !important; } }',
  ].join('\n')

  const sSuccess = { minHeight:'100vh', background:'var(--bg-base)', display:'flex', alignItems:'center', justifyContent:'center' }
  const sHeader  = { padding:'20px 24px 16px', flexShrink:0 }
  const sTagWrap = { display:'inline-flex', alignItems:'center', gap:7, padding:'4px 13px', background:'rgba(99,102,241,0.1)', border:'1px solid rgba(99,102,241,0.22)', borderRadius:20, marginBottom:8 }
  const sTagTxt  = { fontSize:10, color:'var(--ac)', fontWeight:700, letterSpacing:'0.05em', textTransform:'uppercase' }
  const sH1      = { fontSize:'clamp(18px,3.5vw,28px)', fontWeight:900, color:'var(--tx)', letterSpacing:'-0.04em', margin:0, lineHeight:1.15 }
  const sGrad    = { background:'linear-gradient(135deg,var(--ac),var(--ac-2,#8B5CF6))', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }
  const sTitleCenter = { textAlign:'center', marginBottom:16 }
  const sStepWrap    = { maxWidth:680, margin:'0 auto' }
  const sBody    = { flex:1, minHeight:0, padding:'0 20px 16px', display:'flex', justifyContent:'center' }
  const sInner   = { width:'100%', maxWidth:1040, display:'flex', gap:18, minHeight:0 }
  const sSidebarD = { width:252, flexShrink:0, alignSelf:'flex-start' }
  const sRight   = { flex:1, minWidth:0, display:'flex', flexDirection:'column', minHeight:0, gap:12 }
  const sCard    = { flex:1, minHeight:0, background:'rgba(13,17,32,0.75)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:18, backdropFilter:'blur(20px)', display:'flex', flexDirection:'column', overflow:'hidden' }
  const sScroll  = { flex:1, overflowY:'auto', overflowX:'hidden', padding:'24px 24px 8px' }
  const sNavBar  = { padding:'12px 24px', borderTop:'1px solid rgba(255,255,255,0.06)', background:'rgba(8,11,20,0.85)', backdropFilter:'blur(12px)', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }
  const sBtnPrev = { display:'flex', alignItems:'center', gap:6, padding:'9px 16px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:10, color: step === 1 ? 'var(--tx-3)' : 'var(--tx-2)', fontSize:13, fontWeight:600, cursor: step === 1 ? 'not-allowed' : 'pointer', opacity: step === 1 ? 0.4 : 1, transition:'all 0.2s ease' }
  const sCounter = { fontSize:11, color:'var(--tx-3)', fontFamily:'var(--font-mono)' }
  const sBtnNext  = { display:'flex', alignItems:'center', gap:6, padding:'9px 20px', background:'var(--ac)', border:'none', borderRadius:10, color:'white', fontSize:13, fontWeight:700, cursor:'pointer', transition:'all 0.2s ease', boxShadow:'0 3px 16px rgba(99,102,241,0.30)' }
  const sMain     = { height:'100%', display:'flex', flexDirection:'column', overflow:'hidden' }
  const sSpacer   = { height:12 }
  const sBackBtn  = { display:'inline-flex', alignItems:'center', gap:4, fontSize:12, color:'var(--tx-3)', textDecoration:'none', padding:'5px 12px', borderRadius:8, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', transition:'all 0.15s ease', marginBottom:10 }

  return (
    <div className="est-root">
      <style>{pageCss}</style>

      {submitted ? (
        <main style={sSuccess}>
          <SuccessScreen name={contactInfo.name} sector={sector} pack={selectedPack} />
        </main>
      ) : (
        <main style={sMain}>
          <div style={sHeader}>
            <a href="/" style={sBackBtn}><ChevronLeft size={14} />Accueil</a>
            <div style={sTitleCenter}>
              <div style={sTagWrap}>
                <Calculator size={12} color="var(--ac)" />
                <span style={sTagTxt}>Estimateur gratuit</span>
              </div>
              <h1 style={sH1}>
                Estimez votre app en <span style={sGrad}>2 minutes</span>
              </h1>
            </div>
            <div style={sStepWrap}>
              <StepIndicator current={step} />
            </div>
          </div>

          <div style={sBody}>
            <div className="est-layout" style={sInner}>
              <div className="est-sidebar-d" style={sSidebarD}>
                <PriceSidebar sector={sector} pack={selectedPack} features={features} selectedFeatures={selectedFeatures} compact={false} />
              </div>
              <div style={sRight}>
                <div className="est-sidebar-m">
                  <PriceSidebar sector={sector} pack={selectedPack} features={features} selectedFeatures={selectedFeatures} compact={true} />
                </div>
                <div style={sCard}>
                  <div className="est-scroll" key={step} style={sScroll}>
                    <div className="est-step">
                      {step === 1 && <StepSector   value={sector}       onChange={setSector} />}
                      {step === 2 && <StepBase      data={baseInfo}      onChange={function(k,v) { setBaseInfo(function(p) { return Object.assign({}, p, { [k]:v }) }) }} />}
                      {step === 3 && <StepFeatures  features={features}  selected={selectedFeatures} onToggle={toggleFeature} />}
                      {step === 4 && <StepPack      value={selectedPack} onChange={setSelectedPack} />}
                      {step === 5 && <StepContact   data={contactInfo}   onChange={function(k,v) { setContactInfo(function(p) { return Object.assign({}, p, { [k]:v }) }) }} onSubmit={handleSubmit} submitting={submitting} />}
                    </div>
                    <div style={sSpacer} />
                  </div>
                  <div style={sNavBar}>
                    <button onClick={function() { goTo(step - 1) }} disabled={step === 1} style={sBtnPrev}>
                      <ChevronLeft size={15} />Précédent
                    </button>
                    <span style={sCounter}>{step} / 5</span>
                    {step < 5 && (
                      <button onClick={goNext} style={sBtnNext}>
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
    </div>
  )
}
