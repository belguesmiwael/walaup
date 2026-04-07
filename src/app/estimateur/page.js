'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { WalaupSound } from '@/lib/sound'
import {
  Coffee, Stethoscope, ShoppingBag, Wrench, GraduationCap, MoreHorizontal,
  Users, Globe, Smartphone, Monitor, Check, ChevronRight, ChevronLeft,
  Zap, Shield, Rocket, ArrowRight, Send, CheckCircle2, Clock, Calculator,
  Sparkles, Star, Crown, TrendingUp, Phone, Mail, MessageSquare, User,
  Package, Tag, Repeat, BarChart3, Wifi, Layers
} from 'lucide-react'

// ─── Constants ──────────────────────────────────────────────────────────────

const SECTORS = [
  { id: 'restaurant',  label: 'Café & Restaurant', icon: Coffee,       color: '#FB923C' },
  { id: 'medical',     label: 'Médical',            icon: Stethoscope,  color: '#22D3EE' },
  { id: 'retail',      label: 'Commerce & Retail',  icon: ShoppingBag,  color: '#A78BFA' },
  { id: 'services',    label: 'Services & Artisan',  icon: Wrench,       color: '#34D399' },
  { id: 'education',   label: 'Éducation',           icon: GraduationCap,color: '#FBBF24' },
  { id: 'other',       label: 'Autre secteur',        icon: MoreHorizontal,color: '#8B90B8'},
]

const LANGUAGES = [
  { id: 'fr',  label: 'Français',  flag: '🇫🇷' },
  { id: 'ar',  label: 'عربي',      flag: '🇹🇳' },
  { id: 'bi',  label: 'Bilingue',  flag: '🌐' },
]

const PLATFORMS = [
  { id: 'web',    label: 'Web',              icon: Monitor,    desc: 'Navigateur' },
  { id: 'mobile', label: 'Mobile',           icon: Smartphone, desc: 'iOS & Android' },
  { id: 'both',   label: 'Web + Mobile',     icon: Layers,     desc: 'Les deux' },
]

const USER_RANGES = ['1–5', '5–20', '20–100', '100+']

const DEFAULT_FEATURES = [
  { id: 'f1',  group: 'Gestion',        name: 'Tableau de bord',   icon: '📊', price: 0,   days: 0,  desc: 'Vue d\'ensemble des données' },
  { id: 'f2',  group: 'Gestion',        name: 'Gestion du stock',  icon: '📦', price: 80,  days: 2,  desc: 'Entrées, sorties, alertes' },
  { id: 'f3',  group: 'Gestion',        name: 'Caisse & Paiement', icon: '💰', price: 60,  days: 2,  desc: 'Encaissement, reçus' },
  { id: 'f4',  group: 'Gestion',        name: 'Gestion employés',  icon: '👥', price: 70,  days: 2,  desc: 'Présences, fiches, paiements' },
  { id: 'f5',  group: 'Clients',        name: 'Suivi clients',     icon: '🤝', price: 50,  days: 1,  desc: 'Fiche client, historique' },
  { id: 'f6',  group: 'Clients',        name: 'Suivi des dettes',  icon: '💸', price: 60,  days: 2,  desc: 'Créances, relances auto' },
  { id: 'f7',  group: 'Clients',        name: 'Réservations',      icon: '📅', price: 80,  days: 3,  desc: 'Agenda et RDV en ligne' },
  { id: 'f8',  group: 'Communication',  name: 'Notifications push', icon: '🔔', price: 40,  days: 1,  desc: 'Alertes et rappels' },
  { id: 'f9',  group: 'Communication',  name: 'Chat interne',      icon: '💬', price: 80,  days: 3,  desc: 'Messagerie équipe' },
  { id: 'f10', group: 'Rapports',       name: 'Rapports & Stats',  icon: '📈', price: 60,  days: 2,  desc: 'Graphes, exports, analyses' },
  { id: 'f11', group: 'Rapports',       name: 'Export PDF',        icon: '📄', price: 30,  days: 1,  desc: 'Factures, reçus en PDF' },
  { id: 'f12', group: 'Avancé',         name: 'API & Intégrations', icon: '🔗', price: 120, days: 4,  desc: 'Connecter d\'autres outils' },
]

const PACKS = [
  {
    id: 'essentiel',
    name: 'Essentiel',
    tagline: 'Pour démarrer',
    icon: Zap,
    color: '#34D399',
    colorAlpha: 'rgba(52,211,153,0.12)',
    price: { from: 200, to: 400 },
    monthly: 20,
    features: ['App sur mesure pour votre secteur', 'Fonctionnalités choisies', 'Démo gratuite avant paiement', 'Support email', 'Renouvellement annuel'],
    missing: ['Mises à jour illimitées', 'Support prioritaire', 'Revente sur marketplace'],
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'Le plus populaire',
    icon: Rocket,
    color: '#6366F1',
    colorAlpha: 'rgba(99,102,241,0.12)',
    price: { from: 400, to: 800 },
    monthly: 40,
    badge: 'RECOMMANDÉ',
    features: ['App 100% personnalisée', 'Toutes les fonctionnalités', 'Mises à jour illimitées', 'Support prioritaire', 'Option monétisation marketplace'],
    missing: ['Propriété à vie', 'Accompagnement business'],
  },
  {
    id: 'partenaire',
    name: 'Partenaire',
    tagline: 'Revenus passifs',
    icon: Crown,
    color: '#F59E0B',
    colorAlpha: 'rgba(245,158,11,0.12)',
    price: { from: 800, to: 2000 },
    monthly: 80,
    features: ['App sur mesure complète', 'Propriétaire à 100%', 'Publication marketplace', '60–70% des revenus de revente', 'Accompagnement business'],
    missing: [],
  },
]

// ─── Step Indicator ──────────────────────────────────────────────────────────

function StepIndicator({ current, total }) {
  const steps = ['Secteur', 'Base', 'Fonctionnalités', 'Pack', 'Contact']
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 40 }}>
      {steps.map((label, i) => {
        const n = i + 1
        const done = n < current
        const active = n === current
        return (
          <div key={n} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 'none' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: done ? 'var(--ac)' : active ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
                border: `2px solid ${done ? 'var(--ac)' : active ? 'var(--ac)' : 'rgba(255,255,255,0.1)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.3s var(--ease-out-expo)',
                boxShadow: active ? '0 0 20px rgba(99,102,241,0.4)' : done ? '0 0 16px rgba(99,102,241,0.3)' : 'none',
              }}>
                {done
                  ? <Check size={16} color="white" strokeWidth={2.5} />
                  : <span style={{ fontSize: 13, fontWeight: 700, color: active ? 'var(--ac)' : 'var(--tx-3)', fontFamily: 'var(--font-mono)' }}>{n}</span>
                }
              </div>
              <span style={{
                fontSize: 11, fontWeight: 600, letterSpacing: '0.04em',
                color: active ? 'var(--tx)' : done ? 'var(--tx-2)' : 'var(--tx-3)',
                whiteSpace: 'nowrap', textTransform: 'uppercase',
                transition: 'color 0.3s ease',
              }}>{label}</span>
            </div>
            {i < steps.length - 1 && (
              <div style={{
                flex: 1, height: 2, marginBottom: 22, marginLeft: 6, marginRight: 6,
                background: done ? 'var(--ac)' : 'rgba(255,255,255,0.07)',
                transition: 'background 0.5s ease',
                borderRadius: 1,
                boxShadow: done ? '0 0 8px rgba(99,102,241,0.4)' : 'none',
              }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Price Sidebar ───────────────────────────────────────────────────────────

function PriceSidebar({ sector, pack, features, selectedFeatures, step }) {
  const basePrice = pack ? PACKS.find(p => p.id === pack)?.price.from || 0 : 150
  const featureExtra = [...selectedFeatures].reduce((acc, id) => {
    const f = features.find(f => f.id === id)
    return acc + (f?.price || 0)
  }, 0)
  const total = basePrice + featureExtra
  const days = 2 + [...selectedFeatures].reduce((acc, id) => {
    const f = features.find(f => f.id === id)
    return acc + (f?.days || 0)
  }, 0)

  const selectedPackObj = pack ? PACKS.find(p => p.id === pack) : null

  return (
    <div style={{
      background: 'rgba(13,17,32,0.8)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 20,
      padding: '28px 24px',
      backdropFilter: 'blur(20px)',
      position: 'sticky',
      top: 100,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Calculator size={18} color="var(--ac)" />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--tx)', letterSpacing: '-0.01em' }}>Estimation</div>
          <div style={{ fontSize: 11, color: 'var(--tx-3)' }}>Mise à jour en temps réel</div>
        </div>
      </div>

      {/* Price display */}
      <div style={{
        background: 'rgba(99,102,241,0.07)', borderRadius: 16, padding: '20px',
        marginBottom: 20, border: '1px solid rgba(99,102,241,0.15)',
      }}>
        <div style={{ fontSize: 11, color: 'var(--tx-3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Prix estimé</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{
            fontSize: 42, fontWeight: 800, color: 'var(--tx)',
            fontFamily: 'var(--font-mono)', letterSpacing: '-0.03em',
            transition: 'all 0.3s ease',
          }}>{total}</span>
          <span style={{ fontSize: 18, fontWeight: 600, color: 'var(--tx-2)' }}>DT</span>
        </div>
        {selectedPackObj && (
          <div style={{ fontSize: 12, color: 'var(--tx-3)', marginTop: 4 }}>
            + {selectedPackObj.monthly} DT/mois
          </div>
        )}
      </div>

      {/* Delivery */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px',
        background: 'rgba(52,211,153,0.06)', borderRadius: 12,
        border: '1px solid rgba(52,211,153,0.15)', marginBottom: 20,
      }}>
        <Clock size={16} color="#34D399" />
        <div>
          <div style={{ fontSize: 12, color: '#34D399', fontWeight: 600 }}>Délai estimé</div>
          <div style={{ fontSize: 13, color: 'var(--tx)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
            {days <= 14 ? `${days} jours` : `${Math.ceil(days / 7)} semaines`}
          </div>
        </div>
      </div>

      {/* Summary list */}
      <div style={{ marginBottom: 20 }}>
        {sector && (
          <SummaryRow icon="🏢" label="Secteur" value={SECTORS.find(s => s.id === sector)?.label || sector} />
        )}
        {selectedPackObj && (
          <SummaryRow icon="📦" label="Pack" value={selectedPackObj.name} color={selectedPackObj.color} />
        )}
        <SummaryRow icon="⚡" label="Fonctionnalités" value={`${selectedFeatures.size} sélectionnées`} />
        {featureExtra > 0 && (
          <SummaryRow icon="➕" label="Options" value={`+${featureExtra} DT`} color="var(--ac)" />
        )}
      </div>

      {/* Guarantee */}
      <div style={{
        padding: '14px', background: 'rgba(255,255,255,0.03)', borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <Shield size={14} color="#34D399" style={{ flexShrink: 0, marginTop: 2 }} />
          <p style={{ fontSize: 12, color: 'var(--tx-3)', lineHeight: 1.5, margin: 0 }}>
            <strong style={{ color: 'var(--tx-2)' }}>0 DT avant validation</strong> — vous voyez votre démo avant de payer.
          </p>
        </div>
      </div>
    </div>
  )
}

function SummaryRow({ icon, label, value, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 14 }}>{icon}</span>
        <span style={{ fontSize: 12, color: 'var(--tx-3)' }}>{label}</span>
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color: color || 'var(--tx-2)' }}>{value}</span>
    </div>
  )
}

// ─── Step 1 — Sector ─────────────────────────────────────────────────────────

function StepSector({ value, onChange }) {
  return (
    <div>
      <h2 style={styles.stepTitle}>Votre secteur d'activité</h2>
      <p style={styles.stepSub}>Nous adaptons chaque app à votre métier.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14 }}>
        {SECTORS.map((s, i) => {
          const Icon = s.icon
          const active = value === s.id
          return (
            <button
              key={s.id}
              onClick={() => { onChange(s.id); WalaupSound?.click() }}
              style={{
                background: active ? `${s.color}14` : 'rgba(255,255,255,0.03)',
                border: `2px solid ${active ? s.color : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 16, padding: '22px 16px',
                cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
                transition: 'all 0.25s var(--ease-out-expo)',
                transform: active ? 'translateY(-3px) scale(1.02)' : 'none',
                boxShadow: active ? `0 8px 32px ${s.color}30, 0 0 0 1px ${s.color}40` : 'none',
                animationDelay: `${i * 60}ms`,
              }}
              className="sector-btn"
            >
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: active ? `${s.color}20` : 'rgba(255,255,255,0.05)',
                border: `1px solid ${active ? s.color + '50' : 'rgba(255,255,255,0.1)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.25s ease',
              }}>
                <Icon size={24} color={active ? s.color : 'var(--tx-2)'} strokeWidth={1.8} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: active ? s.color : 'var(--tx-2)', textAlign: 'center', lineHeight: 1.3 }}>
                {s.label}
              </span>
              {active && (
                <div style={{
                  position: 'absolute', top: 10, right: 10,
                  width: 20, height: 20, borderRadius: '50%',
                  background: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Check size={12} color="white" strokeWidth={3} />
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Step 2 — Base Info ──────────────────────────────────────────────────────

function StepBase({ data, onChange }) {
  const [nameError, setNameError] = useState(false)

  return (
    <div>
      <h2 style={styles.stepTitle}>Informations de base</h2>
      <p style={styles.stepSub}>Dites-nous en plus sur votre projet.</p>

      {/* App name */}
      <div style={styles.fieldGroup}>
        <label style={styles.label}>
          Nom de votre application
          <span style={styles.required}>obligatoire</span>
        </label>
        <input
          type="text"
          value={data.appName}
          onChange={e => { onChange('appName', e.target.value); setNameError(false) }}
          onBlur={() => { if (!data.appName.trim()) setNameError(true) }}
          placeholder="Ex : CaféPro, StockMaster, MonBusiness..."
          maxLength={60}
          style={{ ...styles.input, borderColor: nameError ? 'var(--red)' : data.appName ? 'var(--border-accent)' : undefined }}
        />
        {nameError && <span style={styles.errorMsg}>Le nom de l'application est obligatoire</span>}
        <span style={styles.hint}>Ce nom apparaîtra dans votre application.</span>
      </div>

      {/* Users */}
      <div style={styles.fieldGroup}>
        <label style={styles.label}>Nombre d'utilisateurs estimés</label>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {USER_RANGES.map(r => (
            <button key={r} onClick={() => { onChange('users', r); WalaupSound?.tab() }}
              style={{ ...styles.chipBtn, ...(data.users === r ? styles.chipBtnActive : {}) }}>
              <Users size={14} />
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Language */}
      <div style={styles.fieldGroup}>
        <label style={styles.label}>Langue de l'interface</label>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {LANGUAGES.map(l => (
            <button key={l.id} onClick={() => { onChange('language', l.id); WalaupSound?.tab() }}
              style={{ ...styles.chipBtn, ...(data.language === l.id ? styles.chipBtnActive : {}) }}>
              <span>{l.flag}</span> {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* Platform */}
      <div style={styles.fieldGroup}>
        <label style={styles.label}>Plateformes cibles</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {PLATFORMS.map(p => {
            const Icon = p.icon
            const active = data.platform === p.id
            return (
              <button key={p.id} onClick={() => { onChange('platform', p.id); WalaupSound?.click() }}
                style={{
                  background: active ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.03)',
                  border: `2px solid ${active ? 'var(--ac)' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 14, padding: '18px 12px',
                  cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                  transition: 'all 0.2s ease',
                  boxShadow: active ? '0 4px 20px rgba(99,102,241,0.2)' : 'none',
                }}>
                <Icon size={22} color={active ? 'var(--ac)' : 'var(--tx-3)'} strokeWidth={1.8} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: active ? 'var(--ac)' : 'var(--tx-2)' }}>{p.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--tx-3)' }}>{p.desc}</div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Step 3 — Features ───────────────────────────────────────────────────────

function StepFeatures({ features, selected, onToggle }) {
  const groups = [...new Set(features.map(f => f.group))]

  return (
    <div>
      <h2 style={styles.stepTitle}>Fonctionnalités souhaitées</h2>
      <p style={styles.stepSub}>Sélectionnez ce dont votre app a besoin. Les prix s'ajustent automatiquement.</p>

      {groups.map(group => (
        <div key={group} style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--tx-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
            {group}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
            {features.filter(f => f.group === group).map(feat => {
              const active = selected.has(feat.id)
              return (
                <button
                  key={feat.id}
                  onClick={() => { onToggle(feat.id); WalaupSound?.click() }}
                  style={{
                    background: active ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.02)',
                    border: `1.5px solid ${active ? 'rgba(99,102,241,0.45)' : 'rgba(255,255,255,0.07)'}`,
                    borderRadius: 14, padding: '16px', cursor: 'pointer', textAlign: 'left',
                    transition: 'all 0.2s var(--ease-out-expo)',
                    transform: active ? 'scale(1.02)' : 'scale(1)',
                    boxShadow: active ? '0 4px 20px rgba(99,102,241,0.15)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 22 }}>{feat.icon}</span>
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%',
                      background: active ? 'var(--ac)' : 'rgba(255,255,255,0.06)',
                      border: `2px solid ${active ? 'var(--ac)' : 'rgba(255,255,255,0.12)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.2s ease',
                      flexShrink: 0,
                    }}>
                      {active && <Check size={11} color="white" strokeWidth={3} />}
                    </div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: active ? 'var(--tx)' : 'var(--tx-2)', marginBottom: 3 }}>{feat.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--tx-3)', lineHeight: 1.4, marginBottom: 10 }}>{feat.desc}</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, color: feat.price > 0 ? 'var(--gold)' : 'var(--green)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                      {feat.price > 0 ? `+${feat.price} DT` : 'Inclus'}
                    </span>
                    {feat.days > 0 && (
                      <span style={{ fontSize: 10, color: 'var(--tx-3)', display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Clock size={10} /> +{feat.days}j
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

// ─── Step 4 — Pack ───────────────────────────────────────────────────────────

function StepPack({ value, onChange }) {
  return (
    <div>
      <h2 style={styles.stepTitle}>Choisissez votre pack</h2>
      <p style={styles.stepSub}>Du premier lancement jusqu'aux revenus passifs.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
        {PACKS.map((pack, i) => {
          const Icon = pack.icon
          const active = value === pack.id
          return (
            <button
              key={pack.id}
              onClick={() => { onChange(pack.id); WalaupSound?.success() }}
              style={{
                background: active ? pack.colorAlpha : 'rgba(255,255,255,0.02)',
                border: `2px solid ${active ? pack.color : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 20, padding: '24px', cursor: 'pointer', textAlign: 'left',
                transition: 'all 0.25s var(--ease-out-expo)',
                transform: active ? 'translateY(-4px)' : 'none',
                boxShadow: active ? `0 12px 40px ${pack.color}25, 0 0 0 1px ${pack.color}30` : 'none',
                position: 'relative', overflow: 'hidden',
              }}
            >
              {pack.badge && (
                <div style={{
                  position: 'absolute', top: 14, right: 14,
                  background: pack.color, color: 'white', fontSize: 10, fontWeight: 800,
                  padding: '3px 10px', borderRadius: 20, letterSpacing: '0.06em',
                }}>
                  {pack.badge}
                </div>
              )}

              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: `${pack.color}20`, border: `1px solid ${pack.color}40`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
              }}>
                <Icon size={22} color={pack.color} strokeWidth={1.8} />
              </div>

              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--tx)', marginBottom: 2 }}>{pack.name}</div>
              <div style={{ fontSize: 13, color: 'var(--tx-3)', marginBottom: 16 }}>{pack.tagline}</div>

              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span style={{ fontSize: 14, color: 'var(--tx-3)' }}>À partir de</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontSize: 32, fontWeight: 800, color: pack.color, fontFamily: 'var(--font-mono)', letterSpacing: '-0.03em' }}>
                    {pack.price.from}
                  </span>
                  <span style={{ fontSize: 16, color: 'var(--tx-2)', fontWeight: 600 }}>DT</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--tx-3)' }}>+ {pack.monthly} DT/mois</div>
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {pack.features.map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <CheckCircle2 size={14} color={pack.color} strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }} />
                    <span style={{ fontSize: 12, color: 'var(--tx-2)', lineHeight: 1.4 }}>{f}</span>
                  </div>
                ))}
                {pack.missing.map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, opacity: 0.35 }}>
                    <div style={{ width: 14, height: 14, flexShrink: 0, marginTop: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: 8, height: 1, background: 'var(--tx-3)', borderRadius: 1 }} />
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--tx-3)', lineHeight: 1.4 }}>{f}</span>
                  </div>
                ))}
              </div>

              {active && (
                <div style={{
                  position: 'absolute', inset: 0, borderRadius: 18, pointerEvents: 'none',
                  background: `radial-gradient(600px circle at 50% 0%, ${pack.color}08, transparent 70%)`,
                }} />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Step 5 — Contact ────────────────────────────────────────────────────────

function StepContact({ data, onChange, onSubmit, submitting }) {
  return (
    <div>
      <h2 style={styles.stepTitle}>Vos coordonnées</h2>
      <p style={styles.stepSub}>Nous vous contactons sous 24h pour préparer votre démo gratuite.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ ...styles.fieldGroup, margin: 0 }}>
          <label style={styles.label}>Nom complet <span style={styles.required}>obligatoire</span></label>
          <div style={styles.inputWrap}>
            <User size={16} color="var(--tx-3)" style={styles.inputIcon} />
            <input type="text" value={data.name} onChange={e => onChange('name', e.target.value)}
              placeholder="Votre nom" style={{ ...styles.input, paddingLeft: 40 }} />
          </div>
        </div>
        <div style={{ ...styles.fieldGroup, margin: 0 }}>
          <label style={styles.label}>Téléphone <span style={styles.required}>obligatoire</span></label>
          <div style={styles.inputWrap}>
            <Phone size={16} color="var(--tx-3)" style={styles.inputIcon} />
            <input type="tel" value={data.phone} onChange={e => onChange('phone', e.target.value)}
              placeholder="+216 XX XXX XXX" style={{ ...styles.input, paddingLeft: 40 }} />
          </div>
        </div>
      </div>

      <div style={styles.fieldGroup}>
        <label style={styles.label}>Email</label>
        <div style={styles.inputWrap}>
          <Mail size={16} color="var(--tx-3)" style={styles.inputIcon} />
          <input type="email" value={data.email} onChange={e => onChange('email', e.target.value)}
            placeholder="votre@email.com" style={{ ...styles.input, paddingLeft: 40 }} />
        </div>
      </div>

      <div style={styles.fieldGroup}>
        <label style={styles.label}>Message (optionnel)</label>
        <div style={styles.inputWrap}>
          <MessageSquare size={16} color="var(--tx-3)" style={{ ...styles.inputIcon, top: 14 }} />
          <textarea value={data.message} onChange={e => onChange('message', e.target.value)}
            placeholder="Décrivez votre projet, vos besoins spécifiques..."
            rows={4}
            style={{ ...styles.input, paddingLeft: 40, resize: 'vertical', minHeight: 110, lineHeight: 1.6 }} />
        </div>
      </div>

      {/* Trust badges */}
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 28, marginTop: 8 }}>
        {[
          { icon: '🎯', text: 'Démo 100% gratuite' },
          { icon: '⚡', text: 'Réponse en 24h' },
          { icon: '🔒', text: 'Sans engagement' },
        ].map(b => (
          <div key={b.text} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>{b.icon}</span>
            <span style={{ fontSize: 13, color: 'var(--tx-3)' }}>{b.text}</span>
          </div>
        ))}
      </div>

      <button
        onClick={onSubmit}
        disabled={submitting || !data.name.trim() || !data.phone.trim()}
        style={{
          width: '100%', padding: '16px 24px',
          background: submitting ? 'rgba(99,102,241,0.4)' : 'var(--ac)',
          border: 'none', borderRadius: 14, cursor: submitting ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          fontSize: 15, fontWeight: 700, color: 'white',
          transition: 'all 0.2s ease',
          boxShadow: '0 8px 32px rgba(99,102,241,0.35)',
          opacity: (!data.name.trim() || !data.phone.trim()) ? 0.5 : 1,
        }}
      >
        {submitting ? (
          <>
            <div style={{
              width: 18, height: 18, borderRadius: '50%',
              border: '2px solid rgba(255,255,255,0.3)',
              borderTopColor: 'white', animation: 'spin 0.8s linear infinite',
            }} />
            Envoi en cours...
          </>
        ) : (
          <>
            <Send size={18} />
            Recevoir ma démo gratuite
          </>
        )}
      </button>
    </div>
  )
}

// ─── Success Screen ──────────────────────────────────────────────────────────

function SuccessScreen({ contactName, sector, pack }) {
  const packObj = PACKS.find(p => p.id === pack)
  const sectorObj = SECTORS.find(s => s.id === sector)

  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', maxWidth: 540, margin: '0 auto' }}>
      <div style={{
        width: 80, height: 80, borderRadius: '50%',
        background: 'rgba(52,211,153,0.15)', border: '2px solid rgba(52,211,153,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px',
        boxShadow: '0 0 40px rgba(52,211,153,0.25)',
      }}>
        <CheckCircle2 size={36} color="#34D399" />
      </div>
      <h2 style={{ fontSize: 28, fontWeight: 800, color: 'var(--tx)', marginBottom: 12, letterSpacing: '-0.03em' }}>
        Demande envoyée !
      </h2>
      <p style={{ fontSize: 16, color: 'var(--tx-2)', lineHeight: 1.6, marginBottom: 36 }}>
        Merci <strong style={{ color: 'var(--tx)' }}>{contactName}</strong>. Notre équipe vous contacte dans les <strong style={{ color: 'var(--ac)' }}>24 heures</strong> pour préparer votre démo.
      </p>

      <div style={{
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 20, padding: '24px', marginBottom: 32, textAlign: 'left',
      }}>
        <div style={{ fontSize: 12, color: 'var(--tx-3)', marginBottom: 16, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Résumé de votre demande</div>
        {sectorObj && <SummaryRow icon="🏢" label="Secteur" value={sectorObj.label} />}
        {packObj && <SummaryRow icon="📦" label="Pack" value={packObj.name} color={packObj.color} />}
        <SummaryRow icon="✅" label="Statut" value="Démo gratuite programmée" color="#34D399" />
      </div>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <a href="/" style={{
          padding: '12px 24px', background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12,
          color: 'var(--tx-2)', textDecoration: 'none', fontSize: 14, fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s ease',
        }}>
          <ChevronLeft size={16} /> Retour à l'accueil
        </a>
        <a href="/marketplace" style={{
          padding: '12px 24px', background: 'var(--ac)',
          borderRadius: 12, color: 'white', textDecoration: 'none', fontSize: 14, fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s ease',
          boxShadow: '0 4px 16px rgba(99,102,241,0.35)',
        }}>
          Explorer le marketplace <ChevronRight size={16} />
        </a>
      </div>
    </div>
  )
}

// ─── Shared Styles ───────────────────────────────────────────────────────────

const styles = {
  stepTitle: { fontSize: 26, fontWeight: 800, color: 'var(--tx)', marginBottom: 8, letterSpacing: '-0.03em' },
  stepSub: { fontSize: 15, color: 'var(--tx-2)', marginBottom: 32, lineHeight: 1.5 },
  fieldGroup: { marginBottom: 24 },
  label: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: 'var(--tx-2)', marginBottom: 10, letterSpacing: '-0.01em' },
  required: { fontSize: 11, color: 'var(--ac)', fontWeight: 600, background: 'rgba(99,102,241,0.1)', padding: '2px 8px', borderRadius: 20, letterSpacing: '0.02em' },
  hint: { display: 'block', fontSize: 12, color: 'var(--tx-3)', marginTop: 6 },
  errorMsg: { display: 'block', fontSize: 12, color: 'var(--red)', marginTop: 6 },
  input: {
    width: '100%', padding: '13px 16px', background: 'rgba(255,255,255,0.04)',
    border: '1.5px solid rgba(255,255,255,0.09)', borderRadius: 12, color: 'var(--tx)',
    fontSize: 14, outline: 'none', transition: 'all 0.2s ease',
    fontFamily: 'var(--font-body)', boxSizing: 'border-box',
  },
  inputWrap: { position: 'relative' },
  inputIcon: { position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', zIndex: 1 },
  chipBtn: {
    display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px',
    background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.09)',
    borderRadius: 10, cursor: 'pointer', color: 'var(--tx-2)', fontSize: 13, fontWeight: 600,
    transition: 'all 0.2s ease',
  },
  chipBtnActive: {
    background: 'rgba(99,102,241,0.12)', borderColor: 'var(--ac)', color: 'var(--ac)',
    boxShadow: '0 2px 12px rgba(99,102,241,0.2)',
  },
}

// ─── Main Page Component ─────────────────────────────────────────────────────

export default function EstimateurPage() {
  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState(1)   // 1=forward, -1=back
  const [animating, setAnimating] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [sector, setSector] = useState('')
  const [baseInfo, setBaseInfo] = useState({ appName: '', users: '', language: '', platform: '' })
  const [selectedFeatures, setSelectedFeatures] = useState(new Set())
  const [selectedPack, setSelectedPack] = useState('')
  const [contactInfo, setContactInfo] = useState({ name: '', phone: '', email: '', message: '' })

  // Data from Supabase
  const [features, setFeatures] = useState(DEFAULT_FEATURES)
  const [tarifs, setTarifs] = useState(null)

  // Load config from Supabase
  useEffect(() => {
    async function loadConfig() {
      try {
        const { data } = await supabase
          .from('config')
          .select('value')
          .eq('key', 'estimateur_features')
          .single()
        if (data?.value && Array.isArray(data.value) && data.value.length > 0) {
          setFeatures(data.value)
        }
      } catch {}

      try {
        const { data } = await supabase
          .from('config')
          .select('value')
          .eq('key', 'tarifs')
          .single()
        if (data?.value) setTarifs(data.value)
      } catch {}
    }
    loadConfig()
  }, [])

  // Animate step transitions
  const goTo = useCallback((nextStep) => {
    if (animating) return
    const dir = nextStep > step ? 1 : -1
    setDirection(dir)
    setAnimating(true)
    setTimeout(() => {
      setStep(nextStep)
      setAnimating(false)
    }, 220)
    WalaupSound?.tab()
  }, [step, animating])

  const goNext = () => {
    // Validation per step
    if (step === 1 && !sector) { WalaupSound?.error(); return }
    if (step === 2 && !baseInfo.appName.trim()) { WalaupSound?.error(); return }
    if (step < 5) goTo(step + 1)
  }

  const goBack = () => {
    if (step > 1) goTo(step - 1)
  }

  const toggleFeature = (id) => {
    setSelectedFeatures(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSubmit = async () => {
    if (!contactInfo.name.trim() || !contactInfo.phone.trim()) {
      WalaupSound?.error()
      return
    }
    setSubmitting(true)
    WalaupSound?.send()

    try {
      const featList = [...selectedFeatures].map(id => {
        const f = features.find(f => f.id === id)
        return f ? f.name : id
      })
      const packObj = PACKS.find(p => p.id === selectedPack)
      const basePrice = packObj?.price.from || 0
      const extraPrice = [...selectedFeatures].reduce((acc, id) => {
        const f = features.find(f => f.id === id)
        return acc + (f?.price || 0)
      }, 0)

      await supabase.from('leads').insert({
        name: contactInfo.name.trim(),
        phone: contactInfo.phone.trim(),
        email: contactInfo.email.trim() || null,
        type: SECTORS.find(s => s.id === sector)?.label || sector,
        pack: selectedPack || null,
        status: 'new',
        source: 'estimateur',
        note: [
          `App: ${baseInfo.appName}`,
          `Secteur: ${sector}`,
          `Utilisateurs: ${baseInfo.users}`,
          `Langue: ${baseInfo.language}`,
          `Plateforme: ${baseInfo.platform}`,
          `Fonctionnalités: ${featList.join(', ')}`,
          `Estimation: ${basePrice + extraPrice} DT`,
          contactInfo.message ? `Message: ${contactInfo.message}` : '',
        ].filter(Boolean).join('\n'),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      WalaupSound?.success()
      setSubmitted(true)
    } catch (err) {
      console.error('Submit error:', err)
      WalaupSound?.error()
    } finally {
      setSubmitting(false)
    }
  }

  const TOTAL_STEPS = 5

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideInRight { from { opacity: 0; transform: translateX(40px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes slideInLeft  { from { opacity: 0; transform: translateX(-40px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes slideOutRight { from { opacity: 1; transform: translateX(0); } to { opacity: 0; transform: translateX(40px); } }
        @keyframes slideOutLeft  { from { opacity: 1; transform: translateX(0); } to { opacity: 0; transform: translateX(-40px); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .sector-btn { position: relative; }
        .step-content { animation: fadeIn 0.28s var(--ease-out-expo, cubic-bezier(0.16,1,0.3,1)) both; }
        .step-exiting-fwd  { animation: slideOutLeft  0.18s ease-in both; }
        .step-exiting-back { animation: slideOutRight 0.18s ease-in both; }
        .step-content input:focus, .step-content textarea:focus {
          border-color: rgba(99,102,241,0.5) !important;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
          outline: none;
        }
        input::placeholder, textarea::placeholder { color: var(--tx-3); }
        @media (max-width: 768px) {
          .estimateur-layout { flex-direction: column !important; }
          .estimateur-sidebar { position: static !important; }
          .estimateur-main { padding: 24px 16px !important; }
          .step-grids { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 480px) {
          .step-grids { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Page wrapper */}
      <main style={{ minHeight: '100vh', background: 'var(--bg-base)', paddingTop: 80, paddingBottom: 80 }}>

        {/* Hero header */}
        <div style={{ textAlign: 'center', padding: '48px 24px 40px', position: 'relative', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'radial-gradient(ellipse 70% 60% at 50% 0%, rgba(99,102,241,0.08), transparent 70%)',
          }} />
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 20, marginBottom: 20 }}>
            <Calculator size={14} color="var(--ac)" />
            <span style={{ fontSize: 12, color: 'var(--ac)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Estimateur gratuit</span>
          </div>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 900, color: 'var(--tx)', letterSpacing: '-0.04em', marginBottom: 14, lineHeight: 1.1 }}>
            Estimez votre app en{' '}
            <span style={{ background: 'linear-gradient(135deg, var(--ac), var(--ac-2))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>2 minutes</span>
          </h1>
          <p style={{ fontSize: 17, color: 'var(--tx-2)', maxWidth: 540, margin: '0 auto', lineHeight: 1.6 }}>
            Configurez votre application, obtenez une estimation de prix et recevez votre démo gratuite sous 24h.
          </p>
        </div>

        {submitted ? (
          <SuccessScreen contactName={contactInfo.name} sector={sector} pack={selectedPack} />
        ) : (
          <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 24px' }}>

            {/* Step indicator */}
            <StepIndicator current={step} total={TOTAL_STEPS} />

            {/* Split layout */}
            <div className="estimateur-layout" style={{ display: 'flex', gap: 28, alignItems: 'flex-start' }}>

              {/* Main content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  className={`estimateur-main step-content ${animating ? (direction === 1 ? 'step-exiting-fwd' : 'step-exiting-back') : ''}`}
                  style={{
                    background: 'rgba(13,17,32,0.6)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 24, padding: '36px',
                    backdropFilter: 'blur(20px)',
                  }}
                >
                  {step === 1 && <StepSector value={sector} onChange={setSector} />}
                  {step === 2 && (
                    <StepBase
                      data={baseInfo}
                      onChange={(k, v) => setBaseInfo(prev => ({ ...prev, [k]: v }))}
                    />
                  )}
                  {step === 3 && (
                    <StepFeatures
                      features={features}
                      selected={selectedFeatures}
                      onToggle={toggleFeature}
                    />
                  )}
                  {step === 4 && <StepPack value={selectedPack} onChange={setSelectedPack} />}
                  {step === 5 && (
                    <StepContact
                      data={contactInfo}
                      onChange={(k, v) => setContactInfo(prev => ({ ...prev, [k]: v }))}
                      onSubmit={handleSubmit}
                      submitting={submitting}
                    />
                  )}
                </div>

                {/* Nav buttons */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 }}>
                  <button
                    onClick={goBack}
                    disabled={step === 1}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '12px 20px', background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.09)', borderRadius: 12,
                      color: step === 1 ? 'var(--tx-3)' : 'var(--tx-2)',
                      fontSize: 14, fontWeight: 600, cursor: step === 1 ? 'not-allowed' : 'pointer',
                      opacity: step === 1 ? 0.4 : 1, transition: 'all 0.2s ease',
                    }}
                  >
                    <ChevronLeft size={18} /> Précédent
                  </button>

                  <span style={{ fontSize: 13, color: 'var(--tx-3)', fontFamily: 'var(--font-mono)' }}>
                    {step} / {TOTAL_STEPS}
                  </span>

                  {step < TOTAL_STEPS ? (
                    <button
                      onClick={goNext}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '12px 24px', background: 'var(--ac)',
                        border: 'none', borderRadius: 12, color: 'white',
                        fontSize: 14, fontWeight: 700, cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 4px 20px rgba(99,102,241,0.35)',
                      }}
                    >
                      Suivant <ChevronRight size={18} />
                    </button>
                  ) : null}
                </div>
              </div>

              {/* Price sidebar */}
              <div className="estimateur-sidebar" style={{ width: 280, flexShrink: 0 }}>
                <PriceSidebar
                  sector={sector}
                  pack={selectedPack}
                  features={features}
                  selectedFeatures={selectedFeatures}
                  step={step}
                />
              </div>

            </div>
          </div>
        )}
      </main>

    </>
  )
}
