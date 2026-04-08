'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  FileText, Package, TrendingDown, Users, BarChart2,
  Coffee, ShoppingBag, CreditCard, Baby, Truck, Store,
  Smartphone, Target, Globe, Hand,
  CheckCircle2, ArrowRight, Sparkles, Zap, Shield,
  ChevronRight, Star, Calculator, LogIn,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

// ─── Static Data ──────────────────────────────────────────────────────────────

const PAIN_POINTS = [
  { Icon: FileText,     title: 'Trop de papier',        desc: 'Factures à la main, registres d\'erreurs. Chaque erreur vous coûte du temps et de l\'argent.' },
  { Icon: Package,      title: 'Stock incontrôlable',   desc: 'Vous ne savez jamais ce qu\'il reste. Ruptures, pertes et commandes ratées sans cesse.' },
  { Icon: TrendingDown, title: 'Pertes invisibles',     desc: 'Erreurs de caisse, vols non détectés — l\'argent disparaît sans laisser de trace.' },
  { Icon: CreditCard,   title: 'Clients impayés',       desc: 'Dettes non suivies, trésorerie souffrante. Impossible de relancer sans système clair.' },
  { Icon: Users,        title: 'Employés non suivis',   desc: 'Présences, paiements, performance — tout dans votre tête ou sur un cahier.' },
  { Icon: BarChart2,    title: 'Aucune visibilité',     desc: 'Vous ne savez pas si votre business est rentable. Les chiffres restent flous.' },
]

const SOLUTIONS = [
  { Icon: Coffee,      name: 'App Café & Restaurant',  features: ['Caisse anti-vol', 'Commandes par table', 'Gestion employés', 'Rapports quotidiens'],       color: '#F59E0B' },
  { Icon: Package,     name: 'App Stock & Inventaire', features: ['Entrées/sorties temps réel', 'Alertes de rupture auto', 'Historique mouvements', 'Multi-entrepôts'], color: '#10B981' },
  { Icon: CreditCard,  name: 'App Suivi Dettes',       features: ['Clients débiteurs listés', 'Relances automatiques', 'Historique complet', 'Rapports mensuels'],    color: '#6366F1' },
  { Icon: Baby,        name: 'App Crèche & École',     features: ['Inscriptions en ligne', 'Présences & absences', 'Communication parents', 'Paiements intégrés'],    color: '#EC4899' },
  { Icon: Truck,       name: 'App Livraison',          features: ['Commandes temps réel', 'Suivi livreurs GPS', 'Zones de livraison', 'Rapports détaillés'],         color: '#22D3EE' },
  { Icon: Store,       name: 'E-commerce Tunisien',    features: ['Boutique en ligne', 'Paiement Flouci/Konnect', 'Gestion commandes', 'Analytics intégrés'],        color: '#8B5CF6' },
]

const HOW_STEPS = [
  { n: '01', title: 'Décrivez votre business',   desc: 'En quelques mots, expliquez ce que fait votre entreprise et ce dont vous avez besoin.' },
  { n: '02', title: 'On crée votre démo',        desc: 'En 48h, notre équipe construit un prototype fonctionnel de votre application.' },
  { n: '03', title: 'Vous testez et validez',    desc: 'Vous voyez votre app en vrai. Modifications illimitées jusqu\'à satisfaction totale.' },
  { n: '04', title: 'Paiement après validation', desc: '0 DT avant d\'avoir vu votre app fonctionner. Notre engagement unique en Tunisie.' },
  { n: '05', title: 'Livraison & support',       desc: 'App déployée, formation incluse, support en arabe et français à votre disposition.' },
]

const WHY_US = [
  { Icon: Smartphone,   title: 'Disponible partout',     desc: 'Mobile, tablette et PC. Accessible 24h/24, 7j/7 — même hors connexion via PWA.' },
  { Icon: Target,       title: '100% sur mesure',        desc: 'Aucun template générique. Chaque écran est conçu uniquement pour votre business.' },
  { Icon: Globe,        title: 'Support local en arabe', desc: 'On est en Tunisie, on comprend votre réalité. Support en arabe et français.' },
  { Icon: Hand,         title: 'Simple à utiliser',      desc: 'Si vous savez utiliser WhatsApp, vous savez déjà utiliser nos applications.' },
]

const TESTIMONIALS_FALLBACK = [
  { author: 'Karim B.',  role: 'Propriétaire café',  company: 'Tunis',  text: 'Avant j\'avais 3 cahiers pour mon café. Maintenant tout est dans mon téléphone. Les vols à la caisse ont complètement disparu.', initials: 'KB', color: '#6366F1' },
  { author: 'Sonia M.',  role: 'Grossiste',          company: 'Sfax',   text: 'J\'ai récupéré plus de 4000 DT en un mois grâce au suivi automatique des dettes clients. L\'app s\'est payée en une semaine.',  initials: 'SM', color: '#10B981' },
  { author: 'Ahmed T.',  role: 'Service livraison',  company: 'Sousse', text: 'La démo gratuite m\'a convaincu en 5 minutes. Maintenant je suis tout mon business depuis mon salon le soir.',                    initials: 'AT', color: '#F59E0B' },
]

const PACKS = [
  {
    name: 'Essentiel', price: '200–400', monthly: '20', color: '#6366F1',
    target: 'Petits business qui démarrent', badge: null,
    features: ['App sur mesure de base', 'Fonctionnalités choisies', 'Support email', 'Mises à jour incluses'],
    excluded: ['Dashboard avancé', 'Multi-utilisateurs', 'Monétisation marketplace'],
  },
  {
    name: 'Pro', price: '400–800', monthly: '30–50', color: '#8B5CF6',
    target: 'Business en croissance', badge: 'RECOMMANDÉ', badgeBg: '#8B5CF6', badgeTx: '#fff',
    features: ['App complète sur mesure', 'Toutes les fonctionnalités', 'Multi-utilisateurs', 'Dashboard analytique', 'Support prioritaire', 'Mises à jour illimitées', 'Option monétisation'],
    excluded: [],
  },
  {
    name: 'Partenaire', price: '800–2000', monthly: '50–100', color: '#F59E0B',
    target: 'Entrepreneurs ambitieux', badge: 'REVENUS PASSIFS', badgeBg: '#F59E0B', badgeTx: '#000',
    features: ['App complète + propriété 100%', 'Publication marketplace Walaup', 'Revenus passifs (60–70%)', 'Accompagnement business', 'Support dédié', 'Achat unique — accès à vie'],
    excluded: [],
  },
]

const CHIPS = ['App Café', 'App Stock', 'App Livraison', 'App Dettes', 'App Crèche', 'App Médecin']

// ─── Sub-components ───────────────────────────────────────────────────────────

function HeroLivePreview() {
  const [phase, setPhase] = useState(0)
  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 900),
      setTimeout(() => setPhase(2), 1700),
      setTimeout(() => setPhase(3), 2500),
      setTimeout(() => setPhase(4), 3300),
    ]
    return () => timers.forEach(clearTimeout)
  }, [])

  const steps = ['Interface', 'Base de données', 'Authentification', 'Dashboard']

  if (phase === 4) return (
    <div key="dashboard" className="card" style={{ animation: 'wFadeUp 400ms ease forwards', padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
        {['#F87171','#FBBF24','#10B981'].map(c => <div key={c} style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />)}
        <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--tx-3)', fontFamily: 'var(--font-mono)' }}>app.monbusiness.tn</span>
      </div>
      <div style={{ padding: 20 }}>
        <div style={{ fontSize: 11, color: 'var(--tx-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Aujourd'hui</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 700, color: 'var(--tx)', lineHeight: 1 }}>
          2 847 <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--tx-3)' }}>DT</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, marginBottom: 20 }}>
          <span style={{ fontSize: 12, color: '#10B981', background: 'rgba(16,185,129,0.1)', padding: '2px 10px', borderRadius: 20, fontWeight: 600 }}>+18% ↑</span>
          <span style={{ fontSize: 12, color: 'var(--tx-3)' }}>142 transactions</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
          {[['Caisse','1 420 DT','#6366F1'],['Stock','847 DT','#10B981'],['Dettes','320 DT','#F59E0B'],['Employés','260 DT','#8B5CF6']].map(([l,v,c]) => (
            <div key={l} style={{ background: 'var(--bg-base)', borderRadius: 10, padding: '10px 12px', borderLeft: `2px solid ${c}` }}>
              <div style={{ fontSize: 10, color: 'var(--tx-3)', marginBottom: 2 }}>{l}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--tx)', fontFamily: 'var(--font-display)' }}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 10, padding: '10px 14px', display: 'flex', gap: 10, alignItems: 'center' }}>
          <CheckCircle2 size={18} color="#10B981" />
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#10B981' }}>App générée !</div>
            <div style={{ fontSize: 11, color: 'var(--tx-3)' }}>Mon App — En ligne</div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--ac)', animation: 'wPulse 1.2s ease-in-out infinite' }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--tx)' }}>Walaup IA Studio</span>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--ac)', background: 'var(--ac-glow)', padding: '2px 10px', borderRadius: 20, fontWeight: 600 }}>En cours...</span>
      </div>
      <div style={{ padding: 20 }}>
        {steps.map((step, i) => {
          const done = i < phase, active = i === phase
          return (
            <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: done ? 'rgba(16,185,129,0.12)' : active ? 'var(--ac-glow)' : 'var(--bg-base)', border: `1.5px solid ${done ? 'rgba(16,185,129,0.4)' : active ? 'var(--ac)' : 'var(--border)'}`, transition: 'all 350ms ease' }}>
                {done ? <CheckCircle2 size={12} color="#10B981" /> : active ? <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--ac)', animation: 'wPulse 0.8s ease-in-out infinite' }} /> : null}
              </div>
              <span style={{ fontSize: 13, color: done || active ? 'var(--tx)' : 'var(--tx-3)', transition: 'color 350ms ease', flex: 1 }}>{step}</span>
              {active && (
                <div style={{ height: 3, width: 64, background: 'var(--bg-base)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: 'linear-gradient(90deg,var(--ac),var(--ac-2))', borderRadius: 2, animation: 'wProgressFill 800ms ease forwards' }} />
                </div>
              )}
              {done && <CheckCircle2 size={12} color="#10B981" />}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function RevenueSimulator() {
  const [clients, setClients] = useState(10)
  const revenue = Math.round(clients * 30 * 0.65)
  return (
    <div style={{ marginTop: 20, padding: 18, background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 12 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold)', marginBottom: 10, letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 6 }}>
        <Sparkles size={13} color="var(--gold)" /> SIMULATEUR REVENUS PASSIFS
      </div>
      <div style={{ fontSize: 12, color: 'var(--tx-3)', marginBottom: 8 }}>Entreprises qui utilisent votre app</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <input type="range" min="1" max="50" value={clients} onChange={e => setClients(Number(e.target.value))} style={{ flex: 1, accentColor: '#F59E0B', cursor: 'pointer' }} />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--gold)', width: 28, textAlign: 'right' }}>{clients}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--tx-3)', marginBottom: 2 }}>{clients} × 30 DT × 65%</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: 'var(--gold)', lineHeight: 1 }}>
            {revenue} <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--tx-3)' }}>DT/mois</span>
          </div>
        </div>
        <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--tx-3)', lineHeight: 1.6 }}><div>sans effort</div><div>scalable</div></div>
      </div>
    </div>
  )
}

function AuthSection() {
  const [method, setMethod]     = useState('google')
  const [authTab, setAuthTab]   = useState('login')
  const [phone, setPhone]       = useState('')
  const [otp, setOtp]           = useState('')
  const [otpSent, setOtpSent]   = useState(false)
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [name, setName]         = useState('')
  const [loading, setLoading]   = useState(false)
  const [msg, setMsg]           = useState(null)

  const inp = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--tx)', fontSize: 14, outline: 'none', fontFamily: 'var(--font-body)', boxSizing: 'border-box', transition: 'border-color 200ms ease' }

  const handleGoogle = async () => {
    setLoading(true); setMsg(null)
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: (typeof window !== 'undefined' ? window.location.origin : '') + '/client' } })
    if (error) setMsg({ type: 'error', text: error.message })
    setLoading(false)
  }
  const handleSendOtp = async () => {
    const c = phone.replace(/\s/g, '')
    if (!c || c.length < 8) return setMsg({ type: 'error', text: 'Numéro invalide (8 chiffres minimum)' })
    setLoading(true); setMsg(null)
    const { error } = await supabase.auth.signInWithOtp({ phone: `+216${c}` })
    if (error) setMsg({ type: 'error', text: error.message })
    else { setOtpSent(true); setMsg({ type: 'success', text: 'Code SMS envoyé sur +216 ' + c }) }
    setLoading(false)
  }
  const handleVerifyOtp = async () => {
    setLoading(true); setMsg(null)
    const { error } = await supabase.auth.verifyOtp({ phone: `+216${phone.replace(/\s/g,'')}`, token: otp, type: 'sms' })
    if (error) setMsg({ type: 'error', text: error.message })
    else if (typeof window !== 'undefined') window.location.href = '/client'
    setLoading(false)
  }
  const handleEmail = async () => {
    if (!email || !password) return setMsg({ type: 'error', text: 'Email et mot de passe requis' })
    setLoading(true); setMsg(null)
    if (authTab === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setMsg({ type: 'error', text: error.message })
      else if (typeof window !== 'undefined') window.location.href = '/client'
    } else {
      if (!name) return setMsg({ type: 'error', text: 'Nom requis' })
      const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } })
      if (error) setMsg({ type: 'error', text: error.message })
      else setMsg({ type: 'success', text: 'Compte créé ! Vérifiez votre email pour valider.' })
    }
    setLoading(false)
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 4, padding: 4, background: 'var(--bg-elevated)', borderRadius: 12, marginBottom: 24 }}>
        {[['google','Google'],['phone','Téléphone'],['email','Email']].map(([t, label]) => (
          <button key={t} onClick={() => { setMethod(t); setMsg(null) }} style={{ flex: 1, padding: '9px 6px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-body)', background: method === t ? 'var(--bg-surface)' : 'transparent', color: method === t ? 'var(--tx)' : 'var(--tx-3)', boxShadow: method === t ? '0 1px 4px rgba(0,0,0,0.35)' : 'none', transition: 'all 200ms ease' }}>{label}</button>
        ))}
      </div>

      {msg && (
        <div style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13, background: msg.type === 'error' ? 'rgba(248,113,113,0.1)' : 'rgba(16,185,129,0.1)', border: `1px solid ${msg.type === 'error' ? 'rgba(248,113,113,0.3)' : 'rgba(16,185,129,0.3)'}`, color: msg.type === 'error' ? 'var(--red)' : 'var(--green)' }}>{msg.text}</div>
      )}

      {method === 'google' && (
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--tx-2)', fontSize: 14, marginBottom: 24, lineHeight: 1.5 }}>Connexion en 1 clic avec votre compte Google.<br /><span style={{ color: 'var(--tx-3)', fontSize: 13 }}>Recommandé — rapide et sécurisé.</span></p>
          <button onClick={handleGoogle} disabled={loading} style={{ width: '100%', padding: '13px 20px', borderRadius: 12, border: '1px solid var(--border-strong)', background: 'var(--bg-surface)', color: 'var(--tx)', fontSize: 15, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontFamily: 'var(--font-body)', transition: 'all 200ms ease', opacity: loading ? 0.7 : 1 }}>
            <svg width="20" height="20" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            {loading ? 'Connexion...' : 'Continuer avec Google'}
          </button>
        </div>
      )}

      {method === 'phone' && (
        <div>
          {!otpSent ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ ...inp, width: 'auto', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, paddingRight: 12, fontSize: 13, color: 'var(--tx-2)' }}>🇹🇳 +216</div>
                <input type="tel" placeholder="XX XXX XXX" value={phone} onChange={e => setPhone(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendOtp()} style={{ ...inp, flex: 1 }} />
              </div>
              <button onClick={handleSendOtp} disabled={loading} className="btn btn-primary" style={{ width: '100%' }}>{loading ? 'Envoi...' : 'Envoyer le code SMS'}</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input type="text" placeholder="Code à 6 chiffres" value={otp} maxLength={6} onChange={e => setOtp(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleVerifyOtp()} style={{ ...inp, textAlign: 'center', letterSpacing: '0.4em', fontSize: 20, fontFamily: 'var(--font-mono)' }} />
              <button onClick={handleVerifyOtp} disabled={loading} className="btn btn-primary" style={{ width: '100%' }}>{loading ? 'Vérification...' : 'Vérifier le code'}</button>
              <button onClick={() => { setOtpSent(false); setMsg(null) }} style={{ width: '100%', padding: 9, background: 'transparent', border: 'none', color: 'var(--tx-3)', cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-body)' }}>← Changer de numéro</button>
            </div>
          )}
        </div>
      )}

      {method === 'email' && (
        <div>
          <div style={{ display: 'flex', marginBottom: 20, borderBottom: '1px solid var(--border)' }}>
            {[['login','Se connecter'],['register','Créer un compte']].map(([t, label]) => (
              <button key={t} onClick={() => { setAuthTab(t); setMsg(null) }} style={{ flex: 1, padding: 10, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-body)', color: authTab === t ? 'var(--ac)' : 'var(--tx-3)', borderBottom: authTab === t ? '2px solid var(--ac)' : '2px solid transparent', fontWeight: authTab === t ? 700 : 400, transition: 'all 200ms ease' }}>{label}</button>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {authTab === 'register' && <input type="text" placeholder="Nom complet" value={name} onChange={e => setName(e.target.value)} style={inp} />}
            <input type="email" placeholder="Adresse email" value={email} onChange={e => setEmail(e.target.value)} style={inp} />
            <input type="password" placeholder="Mot de passe" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleEmail()} style={inp} />
            <button onClick={handleEmail} disabled={loading} className="btn btn-primary" style={{ width: '100%', marginTop: 4 }}>{loading ? '...' : authTab === 'login' ? 'Se connecter' : 'Créer mon compte'}</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const [heroInput, setHeroInput]             = useState('')
  const [testimonials, setTestimonials]       = useState(TESTIMONIALS_FALLBACK)
  const [testimonialIdx, setTestimonialIdx]   = useState(0)
  const [marketplaceApps, setMarketplaceApps] = useState([])

  useEffect(() => {
    supabase.from('testimonials').select('*').eq('active', true).limit(6)
      .then(({ data }) => { if (data?.length) setTestimonials(data) })
    supabase.from('marketplace_apps').select('*').eq('active', true).limit(3)
      .then(({ data }) => { if (data?.length) setMarketplaceApps(data.sort((a,b) => (a.sort_order||0)-(b.sort_order||0))) })
  }, [])

  useEffect(() => {
    const t = setInterval(() => setTestimonialIdx(i => (i+1) % testimonials.length), 5000)
    return () => clearInterval(t)
  }, [testimonials.length])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  const scrollToContact = () => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })
  const handleHeroSubmit = () => {
    if (!heroInput.trim()) return
    if (typeof window !== 'undefined') sessionStorage.setItem('walaup_hero_message', heroInput)
    scrollToContact()
  }

  const t        = testimonials[testimonialIdx]
  const tName    = t?.author || t?.author_name
  const tRole    = t?.role   || t?.author_role
  const tCompany = t?.company|| t?.author_company
  const tText    = t?.text   || t?.content
  const tInit    = t?.initials || tName?.slice(0,2).toUpperCase()
  const tColor   = t?.color  || 'var(--ac)'

  const tag = (Icon, text) => (
    <div style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'5px 14px', background:'var(--ac-glow)', border:'1px solid rgba(99,102,241,0.3)', borderRadius:20, fontSize:11, fontWeight:700, color:'var(--ac)', letterSpacing:'0.07em', textTransform:'uppercase', marginBottom:14 }}>
      <Icon size={12} />{text}
    </div>
  )
  const H2 = { fontFamily:'var(--font-display)', fontSize:'clamp(1.75rem,3vw,2.75rem)', fontWeight:700, color:'var(--tx)', lineHeight:1.15, marginBottom:12 }

  return (
    <>
      <style>{`
        @keyframes wFadeUp       { from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)} }
        @keyframes wPulse        { 0%,100%{opacity:1}50%{opacity:.35} }
        @keyframes wFloat        { 0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)} }
        @keyframes wProgressFill { from{width:0}to{width:100%} }
        @keyframes wGlowPulse    { 0%,100%{box-shadow:0 0 20px rgba(99,102,241,.3)}50%{box-shadow:0 0 40px rgba(99,102,241,.55)} }
        .chip-btn{padding:6px 14px;border-radius:20px;border:1px solid var(--border);background:var(--bg-elevated);color:var(--tx-2);font-size:13px;cursor:pointer;transition:all 200ms ease;font-family:var(--font-body)}
        .chip-btn:hover{border-color:var(--ac);color:var(--tx);background:var(--ac-glow)}
        @media(max-width:768px){
          .hero-grid,.auth-grid{grid-template-columns:1fr!important}
          .hero-right{display:none!important}
          .sol-grid,.pain-grid{grid-template-columns:1fr 1fr!important}
          .why-grid{grid-template-columns:1fr 1fr!important}
          .packs-grid{grid-template-columns:1fr!important}
          .stats-grid{grid-template-columns:1fr 1fr!important}
          .steps-row{flex-direction:column!important;gap:24px!important}
          .step-line{display:none!important}
          .auth-grid{gap:40px!important}
          .mk-grid{grid-template-columns:1fr 1fr!important}
        }
        @media(max-width:480px){.sol-grid,.why-grid,.mk-grid,.pain-grid{grid-template-columns:1fr!important}}
      `}</style>

      {/* ══ 1. HERO ══════════════════════════════════════════════════ */}
      <section style={{ paddingTop:'calc(var(--nav-h,68px) + 64px)', paddingBottom:80, position:'relative', overflow:'hidden' }}>
        <div className="aurora-bg"><div className="aurora-orb--1"/><div className="aurora-orb--2"/></div>
        <div className="container">
          <div className="hero-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:64, alignItems:'center' }}>
            <div style={{ animation:'wFadeUp 600ms ease forwards' }}>
              {tag(Zap, 'Agence Apps N°1 Tunisie')}
              <h1 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(2rem,4.5vw,3.6rem)', fontWeight:700, lineHeight:1.08, color:'var(--tx)', marginBottom:20 }}>
                Décrivez votre business,<br /><span className="text-gradient-ac">on crée votre application</span>
              </h1>
              <p style={{ fontSize:'clamp(1rem,1.4vw,1.15rem)', color:'var(--tx-2)', lineHeight:1.65, marginBottom:32 }}>
                Quelques mots suffisent. Notre équipe transforme votre idée en app sur mesure —{' '}
                <strong style={{ color:'var(--tx)', fontWeight:600 }}>démo gratuite, sans paiement avant validation.</strong>
              </p>
              <div style={{ display:'flex', gap:8, marginBottom:16 }}>
                <input type="text" placeholder="Ex : J'ai un café et je veux gérer ma caisse..."
                  value={heroInput} onChange={e => setHeroInput(e.target.value)}
                  onKeyDown={e => e.key==='Enter' && handleHeroSubmit()}
                  style={{ flex:1, padding:'13px 16px', borderRadius:12, border:'1px solid var(--border-strong)', background:'var(--bg-elevated)', color:'var(--tx)', fontSize:14, outline:'none', fontFamily:'var(--font-body)', transition:'border-color 200ms ease' }}
                  onFocus={e => e.target.style.borderColor='var(--ac)'}
                  onBlur={e  => e.target.style.borderColor='var(--border-strong)'}
                />
                <button onClick={handleHeroSubmit} className="btn btn-primary btn-magnetic" style={{ flexShrink:0, display:'flex', alignItems:'center', gap:6 }}>
                  Générer <ArrowRight size={15} />
                </button>
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:36 }}>
                {CHIPS.map(chip => <button key={chip} className="chip-btn" onClick={() => setHeroInput(chip)}>{chip}</button>)}
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                <div style={{ display:'flex' }}>
                  {['#6366F1','#10B981','#F59E0B','#EC4899'].map((c,i) => (
                    <div key={i} style={{ width:34, height:34, borderRadius:'50%', background:c, marginLeft:i?-10:0, border:'2.5px solid var(--bg-base)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#fff', fontFamily:'var(--font-display)', zIndex:4-i }}>
                      {['K','S','A','M'][i]}
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:'var(--tx)' }}>+20 clients font confiance</div>
                  <div style={{ fontSize:12, color:'var(--tx-3)' }}>à Walaup en Tunisie</div>
                </div>
              </div>
            </div>
            <div className="hero-right" style={{ animation:'wFloat 6s ease-in-out infinite', animationDelay:'0.3s' }}>
              <HeroLivePreview />
            </div>
          </div>
        </div>
      </section>

      {/* ══ 2. STATS ═════════════════════════════════════════════════ */}
      <section style={{ padding:'36px 0', borderTop:'1px solid var(--border)', borderBottom:'1px solid var(--border)', background:'var(--bg-elevated)' }}>
        <div className="container">
          <div className="stats-grid" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:20, textAlign:'center' }}>
            {[{val:'50+',label:'Clients satisfaits',color:'var(--ac)'},{val:'48h',label:'Délai démo',color:'var(--green)'},{val:'100%',label:'Made in Tunisia 🇹🇳',color:'var(--gold)'},{val:'0 DT',label:'Avant validation',color:'var(--ac-2)'}].map(s=>(
              <div key={s.label} data-animate="fade">
                <div style={{ fontFamily:'var(--font-display)', fontSize:'clamp(1.6rem,2.5vw,2.4rem)', fontWeight:700, color:s.color, lineHeight:1 }}>{s.val}</div>
                <div style={{ fontSize:13, color:'var(--tx-2)', marginTop:6 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 3. PAIN POINTS ═══════════════════════════════════════════ */}
      <section id="problems" style={{ padding:'80px 0' }}>
        <div className="container">
          <div style={{ textAlign:'center', marginBottom:52 }}>
            {tag(FileText, 'Problèmes courants')}
            <h2 style={H2}>Ces problèmes vous coûtent du temps<br />et de l'argent</h2>
            <p style={{ fontSize:16, color:'var(--tx-2)', maxWidth:520, margin:'0 auto' }}>Si vous avez répondu oui à l'un de ces problèmes, on a la solution.</p>
          </div>
          <div className="pain-grid" data-stagger style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:18 }}>
            {PAIN_POINTS.map(({ Icon, title, desc }) => (
              <div key={title} data-animate className="card card--interactive" style={{ padding:22, display:'flex', gap:14 }}>
                <div style={{ width:40, height:40, borderRadius:10, background:'var(--ac-glow)', border:'1px solid var(--border-accent)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Icon size={18} color="var(--ac)" strokeWidth={1.8} />
                </div>
                <div>
                  <h3 style={{ fontFamily:'var(--font-display)', fontSize:15, fontWeight:700, color:'var(--tx)', marginBottom:6 }}>{title}</h3>
                  <p style={{ fontSize:13, color:'var(--tx-2)', lineHeight:1.55 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 4. SOLUTIONS ═════════════════════════════════════════════ */}
      <section id="solutions" style={{ padding:'80px 0', background:'var(--bg-elevated)' }}>
        <div className="container">
          <div style={{ textAlign:'center', marginBottom:52 }}>
            {tag(Sparkles, 'Nos solutions')}
            <h2 style={H2}>Une application 100% adaptée<br />à votre business</h2>
            <p style={{ fontSize:16, color:'var(--tx-2)' }}>Pas un template générique. Construite uniquement pour vous.</p>
          </div>
          <div className="sol-grid" data-stagger style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:18, marginBottom:40 }}>
            {SOLUTIONS.map(({ Icon, name, features, color }) => (
              <div key={name} data-animate className="card card--interactive card--tilt" style={{ padding:24 }}>
                <div style={{ width:48, height:48, borderRadius:14, background:`${color}18`, border:`1px solid ${color}40`, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:14 }}>
                  <Icon size={22} color={color} strokeWidth={1.8} />
                </div>
                <h3 style={{ fontFamily:'var(--font-display)', fontSize:15, fontWeight:700, color:'var(--tx)', marginBottom:12 }}>{name}</h3>
                <ul style={{ listStyle:'none', padding:0, margin:0 }}>
                  {features.map(f => (
                    <li key={f} style={{ fontSize:13, color:'var(--tx-2)', marginBottom:6, display:'flex', alignItems:'center', gap:7 }}>
                      <CheckCircle2 size={12} color={color} strokeWidth={2.5} style={{ flexShrink:0 }} />{f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div style={{ textAlign:'center' }}>
            <button onClick={scrollToContact} className="btn btn-primary btn-magnetic" style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
              Je veux mon app <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </section>

      {/* ══ 5. HOW IT WORKS ══════════════════════════════════════════ */}
      <section id="how" style={{ padding:'80px 0' }}>
        <div className="container">
          <div style={{ textAlign:'center', marginBottom:52 }}>
            {tag(Zap, 'Simple & Rapide')}
            <h2 style={H2}>Comment ça marche</h2>
            <p style={{ fontSize:16, color:'var(--tx-2)' }}>5 étapes claires, sans surprise, sans paiement avant validation.</p>
          </div>
          <div className="steps-row" style={{ display:'flex', alignItems:'flex-start' }}>
            {HOW_STEPS.map((step, i) => (
              <div key={step.n} style={{ display:'flex', alignItems:'flex-start', flex:1 }}>
                <div data-animate style={{ flex:1, textAlign:'center', padding:'0 10px' }}>
                  <div style={{ width:52, height:52, borderRadius:'50%', border:'2px solid var(--ac)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px', background:'var(--ac-glow)', fontFamily:'var(--font-mono)', fontSize:13, fontWeight:700, color:'var(--ac)' }}>{step.n}</div>
                  <h3 style={{ fontFamily:'var(--font-display)', fontSize:14, fontWeight:700, color:'var(--tx)', marginBottom:8 }}>{step.title}</h3>
                  <p style={{ fontSize:13, color:'var(--tx-2)', lineHeight:1.5 }}>{step.desc}</p>
                </div>
                {i < HOW_STEPS.length-1 && <div className="step-line" style={{ flex:0.4, height:1.5, background:'linear-gradient(90deg,var(--border-strong),transparent)', marginTop:25 }} />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 6. WHY US ════════════════════════════════════════════════ */}
      <section style={{ padding:'80px 0', background:'var(--bg-elevated)' }}>
        <div className="container">
          <div style={{ textAlign:'center', marginBottom:52 }}>
            {tag(Shield, 'Notre différence')}
            <h2 style={H2}>Ce qui nous rend différents</h2>
          </div>
          <div className="why-grid" data-stagger style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:18, marginBottom:44 }}>
            {WHY_US.map(({ Icon, title, desc }) => (
              <div key={title} data-animate className="card" style={{ padding:'26px 18px', textAlign:'center' }}>
                <div style={{ width:52, height:52, borderRadius:16, background:'var(--ac-glow)', border:'1px solid var(--border-accent)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
                  <Icon size={22} color="var(--ac)" strokeWidth={1.8} />
                </div>
                <h3 style={{ fontFamily:'var(--font-display)', fontSize:14, fontWeight:700, color:'var(--tx)', marginBottom:8 }}>{title}</h3>
                <p style={{ fontSize:13, color:'var(--tx-2)', lineHeight:1.55 }}>{desc}</p>
              </div>
            ))}
          </div>
          <div data-animate style={{ maxWidth:680, margin:'0 auto', padding:'36px 40px', background:'linear-gradient(135deg,rgba(99,102,241,.07),rgba(139,92,246,.07))', border:'1px solid var(--border-accent)', borderRadius:20, textAlign:'center', animation:'wGlowPulse 4s ease-in-out infinite' }}>
            <div style={{ width:56, height:56, borderRadius:18, background:'var(--ac-glow)', border:'1px solid var(--border-accent)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
              <Shield size={26} color="var(--ac)" strokeWidth={1.6} />
            </div>
            <h3 style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:700, color:'var(--tx)', marginBottom:14 }}>Démo 100% Gratuite</h3>
            <p style={{ fontSize:15, color:'var(--tx-2)', lineHeight:1.65, marginBottom:26 }}>
              Avant de payer un seul dinar, vous voyez votre application fonctionner en vrai.{' '}
              <strong style={{ color:'var(--tx)' }}>Notre engagement unique.</strong> Personne d'autre ne propose ça en Tunisie.
            </p>
            <button onClick={scrollToContact} className="btn btn-primary btn-magnetic" style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
              Je veux ma démo gratuite <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </section>

      {/* ══ 7. TESTIMONIALS ══════════════════════════════════════════ */}
      <section id="testimonials" style={{ padding:'80px 0' }}>
        <div className="container">
          <div style={{ textAlign:'center', marginBottom:52 }}>
            {tag(Star, 'Témoignages')}
            <h2 style={H2}>Ils ont transformé leur business</h2>
            <p style={{ fontSize:16, color:'var(--tx-2)' }}>De vraies entreprises tunisiennes, de vrais résultats.</p>
          </div>
          <div style={{ maxWidth:640, margin:'0 auto 28px' }}>
            <div key={testimonialIdx} className="card" style={{ padding:36, animation:'wFadeUp 300ms ease forwards' }}>
              <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:18 }}>
                <div style={{ width:46, height:46, borderRadius:'50%', background:tColor, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, fontWeight:700, color:'#fff', fontFamily:'var(--font-display)', flexShrink:0 }}>{tInit}</div>
                <div>
                  <div style={{ fontWeight:700, color:'var(--tx)', fontSize:15 }}>{tName}</div>
                  <div style={{ fontSize:13, color:'var(--tx-2)' }}>{tRole} · {tCompany}</div>
                </div>
                <div style={{ marginLeft:'auto', display:'flex', gap:2 }}>
                  {[...Array(5)].map((_,i) => <Star key={i} size={14} color="#FBBF24" fill="#FBBF24" />)}
                </div>
              </div>
              <p style={{ fontSize:15, color:'var(--tx)', lineHeight:1.7, fontStyle:'italic' }}>"{tText}"</p>
            </div>
          </div>
          <div style={{ display:'flex', justifyContent:'center', gap:8 }}>
            {testimonials.map((_,i) => (
              <button key={i} onClick={() => setTestimonialIdx(i)} style={{ width:i===testimonialIdx?28:8, height:8, borderRadius:4, border:'none', cursor:'pointer', transition:'all 300ms ease', background:i===testimonialIdx?'var(--ac)':'var(--border-strong)', padding:0 }} />
            ))}
          </div>
        </div>
      </section>

      {/* ══ 8. MARKETPLACE PREVIEW ═══════════════════════════════════ */}
      <section id="marketplace" style={{ padding:'80px 0', background:'var(--bg-elevated)' }}>
        <div className="container">
          <div style={{ textAlign:'center', marginBottom:52 }}>
            {tag(Store, 'Marketplace')}
            <h2 style={H2}>Apps créées, prêtes à déployer</h2>
            <p style={{ fontSize:16, color:'var(--tx-2)' }}>Achetez-en une et on l'adapte à votre business en 48h.</p>
          </div>
          <div className="mk-grid" data-stagger style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:18, marginBottom:40 }}>
            {(marketplaceApps.length>0 ? marketplaceApps : SOLUTIONS.slice(0,3)).map((app,i) => {
              const Sol = SOLUTIONS[i]
              return (
                <div key={app.id||app.name} data-animate className="card card--interactive card--tilt" style={{ padding:24 }}>
                  <div style={{ width:48, height:48, borderRadius:14, background:`${Sol?.color||'var(--ac)'}18`, border:`1px solid ${Sol?.color||'var(--ac)'}40`, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:14 }}>
                    {Sol ? <Sol.Icon size={22} color={Sol.color} strokeWidth={1.8}/> : <Store size={22} color="var(--ac)"/>}
                  </div>
                  <h3 style={{ fontFamily:'var(--font-display)', fontSize:15, fontWeight:700, color:'var(--tx)', marginBottom:8 }}>{app.name}</h3>
                  {(app.tagline||app.description) && <p style={{ fontSize:13, color:'var(--tx-2)', marginBottom:16, lineHeight:1.5 }}>{(app.tagline||app.description||'').slice(0,90)}{(app.description||'').length>90?'...':''}</p>}
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:8 }}>
                    {app.price_from ? <span style={{ fontFamily:'var(--font-mono)', fontSize:14, fontWeight:700, color:'var(--gold)' }}>dès {app.price_from} DT</span> : <span style={{ fontSize:13, color:'var(--tx-3)' }}>Prix sur demande</span>}
                    <Link href="/marketplace" style={{ fontSize:13, color:'var(--ac)', textDecoration:'none', fontWeight:600, display:'flex', alignItems:'center', gap:4 }}>Voir <ChevronRight size={13}/></Link>
                  </div>
                </div>
              )
            })}
          </div>
          <div style={{ textAlign:'center' }}>
            <Link href="/marketplace" className="btn btn-ghost" style={{ display:'inline-flex', alignItems:'center', gap:6 }}>Voir toutes nos applications <ArrowRight size={15}/></Link>
          </div>
        </div>
      </section>

      {/* ══ 9. PACKS ═════════════════════════════════════════════════ */}
      <section id="packs" style={{ padding:'80px 0' }}>
        <div className="container">
          <div style={{ textAlign:'center', marginBottom:52 }}>
            {tag(Sparkles, 'Nos packs')}
            <h2 style={H2}>Choisissez votre pack</h2>
            <p style={{ fontSize:16, color:'var(--tx-2)' }}>Du simple usage privé jusqu'à transformer votre app en source de revenus.</p>
          </div>
          <div className="packs-grid" data-stagger style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20, marginBottom:20 }}>
            {PACKS.map(pack => (
              <div key={pack.name} data-animate style={{ position:'relative', display:'flex', flexDirection:'column' }}>
                {pack.badge && <div style={{ position:'absolute', top:-13, left:'50%', transform:'translateX(-50%)', background:pack.badgeBg, color:pack.badgeTx, fontSize:11, fontWeight:700, padding:'4px 16px', borderRadius:20, whiteSpace:'nowrap', zIndex:2 }}>{pack.badge}</div>}
                <div className="card" style={{ padding:'32px 24px', flex:1, display:'flex', flexDirection:'column', border:pack.name==='Pro'?'1px solid rgba(139,92,246,0.45)':pack.name==='Partenaire'?'1px solid rgba(245,158,11,0.35)':'1px solid var(--border)', background:pack.name==='Pro'?'linear-gradient(160deg,rgba(99,102,241,.06),rgba(139,92,246,.04))':pack.name==='Partenaire'?'linear-gradient(160deg,rgba(245,158,11,.05),rgba(251,191,36,.03))':undefined }}>
                  <h3 style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:700, color:'var(--tx)', marginBottom:4 }}>{pack.name}</h3>
                  <div style={{ fontSize:13, color:'var(--tx-2)', marginBottom:18 }}>{pack.target}</div>
                  <div style={{ marginBottom:6 }}>
                    <span style={{ fontFamily:'var(--font-display)', fontSize:28, fontWeight:700, color:pack.color }}>{pack.price}</span>
                    <span style={{ fontSize:14, color:'var(--tx-3)', marginLeft:4 }}>DT</span>
                  </div>
                  <div style={{ fontSize:13, color:'var(--tx-3)', marginBottom:22 }}>+{pack.monthly} DT/mois</div>
                  <div style={{ marginBottom:20, flex:1 }}>
                    {pack.features.map(f => (
                      <div key={f} style={{ display:'flex', gap:8, alignItems:'flex-start', marginBottom:8, fontSize:13, color:'var(--tx-2)' }}>
                        <CheckCircle2 size={14} color={pack.color} strokeWidth={2.5} style={{ flexShrink:0, marginTop:1 }}/>{f}
                      </div>
                    ))}
                    {pack.excluded.map(f => (
                      <div key={f} style={{ display:'flex', gap:8, alignItems:'flex-start', marginBottom:8, fontSize:13, color:'var(--tx-3)', opacity:0.5 }}>
                        <div style={{ width:14, flexShrink:0, marginTop:1 }}>✗</div>{f}
                      </div>
                    ))}
                  </div>
                  {pack.name==='Partenaire' && <RevenueSimulator />}
                  <button onClick={scrollToContact} className={`btn ${pack.name==='Pro'?'btn-primary':'btn-ghost'}`} style={{ width:'100%', marginTop:'auto', paddingTop:16 }}>Choisir {pack.name}</button>
                </div>
              </div>
            ))}
          </div>
          <p style={{ textAlign:'center', fontSize:13, color:'var(--tx-3)' }}>Paiement uniquement après validation de votre démo. Aucun risque.</p>
        </div>
      </section>

      {/* ══ 10. ESTIMATEUR CTA ═══════════════════════════════════════ */}
      <section style={{ padding:'56px 0', background:'var(--bg-elevated)', borderTop:'1px solid var(--border)' }}>
        <div className="container" style={{ textAlign:'center', maxWidth:640 }}>
          <div data-animate>
            {tag(Calculator, 'Estimateur')}
            <h2 style={{ ...H2, fontSize:'clamp(1.5rem,2.2vw,2.2rem)' }}>Estimez le prix de votre app en 2 minutes</h2>
            <p style={{ fontSize:15, color:'var(--tx-2)', marginBottom:28, lineHeight:1.65 }}>Notre estimateur analyse vos besoins et vous donne une fourchette de prix précise + la formule recommandée. Gratuit, sans engagement.</p>
            <Link href="/estimateur" className="btn btn-primary btn-magnetic" style={{ display:'inline-flex', gap:8, alignItems:'center' }}>
              <Calculator size={16}/> Calculer le prix de mon app
            </Link>
          </div>
        </div>
      </section>

      {/* ══ 11. AUTH ═════════════════════════════════════════════════ */}
      <section id="contact" style={{ padding:'80px 0' }}>
        <div className="container">
          <div className="auth-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:72, alignItems:'center', maxWidth:940, margin:'0 auto' }}>
            <div data-animate>
              {tag(LogIn, 'Commencer maintenant')}
              <h2 style={{ ...H2, fontSize:'clamp(1.8rem,2.5vw,2.6rem)' }}>Accédez à votre espace client</h2>
              <p style={{ fontSize:15, color:'var(--tx-2)', lineHeight:1.65, marginBottom:36 }}>Connectez-vous en 1 clic — puis créez ou suivez votre application sur mesure.</p>
              <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
                {[{Icon:Shield,title:'Démo 100% gratuite',sub:'0 DT avant validation de votre application'},{Icon:Zap,title:'Réponse en 24 heures',sub:'Notre équipe vous contacte rapidement'},{Icon:CheckCircle2,title:'Sans engagement',sub:'Vous restez libre de décider à tout moment'}].map(({Icon,title,sub})=>(
                  <div key={title} style={{ display:'flex', gap:14, alignItems:'flex-start' }}>
                    <div style={{ width:36, height:36, borderRadius:10, background:'var(--ac-glow)', border:'1px solid var(--border-accent)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <Icon size={16} color="var(--ac)" strokeWidth={2}/>
                    </div>
                    <div>
                      <div style={{ fontSize:14, fontWeight:700, color:'var(--tx)', marginBottom:2 }}>{title}</div>
                      <div style={{ fontSize:13, color:'var(--tx-2)' }}>{sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div data-animate className="card" style={{ padding:32, alignSelf:'center' }}><AuthSection /></div>
          </div>
        </div>
      </section>

      {/* ══ 12. FINAL CTA ════════════════════════════════════════════ */}
      <section style={{ padding:'80px 0', background:'var(--bg-elevated)', textAlign:'center', position:'relative', overflow:'hidden' }}>
        <div className="aurora-bg" style={{ opacity:0.45 }}><div className="aurora-orb--3"/><div className="aurora-orb--4"/></div>
        <div className="container" style={{ position:'relative', zIndex:1, maxWidth:640 }}>
          <div data-animate>
            <h2 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(2rem,3.5vw,3rem)', fontWeight:700, color:'var(--tx)', lineHeight:1.15, marginBottom:18 }}>
              Votre business mérite mieux<br /><span className="text-gradient-ac">qu'Excel et WhatsApp</span>
            </h2>
            <p style={{ fontSize:16, color:'var(--tx-2)', marginBottom:36, lineHeight:1.6 }}>Rejoignez les entrepreneurs tunisiens qui ont automatisé leur business avec Walaup.</p>
            <button onClick={scrollToContact} className="btn btn-primary btn-magnetic btn-lg" style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
              Recevoir ma démo gratuite <ArrowRight size={16}/>
            </button>
          </div>
        </div>
      </section>
    </>
  )
}
