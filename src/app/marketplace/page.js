'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { WalaupSound } from '@/lib/sound'
import {
  Search, X, Play, Monitor, Smartphone, ArrowLeft,
  ShoppingCart, MessageSquare, ChevronRight, Sparkles,
  XCircle, Store
} from 'lucide-react'

// ─── Static fallback ──────────────────────────────────────────────────────────
const STATIC_APPS = [
  {
    id: 'cafe-1', name: 'App Café & Restaurant',
    tagline: 'Gérez votre café comme un pro, éliminez les vols à la caisse.',
    icon: '☕', category: 'Restaurant', price_from: 299, active: true,
    thumbnail_url: null, sort_order: 1,
    for_who: 'Cafés, restaurants, snacks de Tunisie',
    problems: ['Gestion manuelle chronophage et source d\'erreurs', 'Vols à la caisse impossibles à détecter', 'Suivi des commandes inexistant en temps réel'],
    features: [{ title: '🛒 Commandes', desc: 'Prise de commande en 3 clics par table' }, { title: '💰 Caisse', desc: 'Encaissement sécurisé, zéro erreur' }, { title: '📦 Stock', desc: 'Alertes de rupture automatiques' }, { title: '👥 Employés', desc: 'Pointage et planning intégrés' }],
    demo_url: 'https://walaup.vercel.app',
  },
  {
    id: 'stock-1', name: 'App Grossiste & Stock',
    tagline: 'Contrôlez chaque produit, éliminez les pertes invisibles.',
    icon: '📦', category: 'Retail', price_from: 349, active: true,
    thumbnail_url: null, sort_order: 2,
    for_who: 'Grossistes, revendeurs, magasins de détail',
    problems: ['Stock incontrôlable et inventaires manuels épuisants', 'Ruptures de stock non détectées à temps', 'Pertes invisibles sur les marges'],
    features: [{ title: '📊 Inventaire', desc: 'Gestion en temps réel' }, { title: '🔔 Alertes', desc: 'Seuil minimum configurable' }, { title: '📈 Rapports', desc: 'Analyses de ventes et marges' }, { title: '🤝 Fournisseurs', desc: 'Suivi commandes et livraisons' }],
    demo_url: 'https://walaup.vercel.app',
  },
  {
    id: 'dettes-1', name: 'App Suivi Dettes',
    tagline: 'Récupérez vos impayés automatiquement, sans stress.',
    icon: '💸', category: 'Services', price_from: 249, active: true,
    thumbnail_url: null, sort_order: 3,
    for_who: 'Toute entreprise avec des clients débiteurs',
    problems: ['Clients impayés non suivis, trésorerie souffre', 'Relances manuelles inefficaces et gênantes', 'Aucune visibilité globale sur les créances'],
    features: [{ title: '📋 Registre', desc: 'Suivi de toutes les créances' }, { title: '📱 Relances', desc: 'Notifications automatiques aux débiteurs' }, { title: '📊 Dashboard', desc: 'Vue globale trésorerie' }, { title: '🕒 Historique', desc: 'Transactions datées et tracées' }],
    demo_url: 'https://walaup.vercel.app',
  },
  {
    id: 'medical-1', name: 'App Cabinet Médical',
    tagline: 'Modernisez votre cabinet, offrez une expérience patient exceptionnelle.',
    icon: '🏥', category: 'Médical', price_from: 399, active: true,
    thumbnail_url: null, sort_order: 4,
    for_who: 'Médecins, dentistes, cliniques privées',
    problems: ['Agenda papier surchargé et source de conflits', 'Dossiers patients éparpillés, non sécurisés', 'Patients sans accès digital à leur suivi'],
    features: [{ title: '📅 Agenda', desc: 'Réservations en ligne 24h/24' }, { title: '🗂 Dossiers', desc: 'Patients numérisés et sécurisés' }, { title: '💊 Ordonnances', desc: 'Générées en 1 clic' }, { title: '📞 Téléconsult', desc: 'Vidéo intégrée' }],
    demo_url: 'https://walaup.vercel.app',
  },
  {
    id: 'livraison-1', name: 'App Livraison',
    tagline: 'Tracez chaque commande, satisfaite chaque client en temps réel.',
    icon: '🛵', category: 'Services', price_from: 319, active: true,
    thumbnail_url: null, sort_order: 5,
    for_who: 'Services de livraison, dark kitchens, restaurants',
    problems: ['Commandes désorganisées, erreurs fréquentes', 'Livreurs difficiles à suivre et gérer', 'Clients sans information sur leur livraison'],
    features: [{ title: '🗺️ Tracking GPS', desc: 'Suivi en temps réel' }, { title: '📱 App livreur', desc: 'Interface mobile dédiée' }, { title: '🔔 Notifications', desc: 'Client informé à chaque étape' }, { title: '📊 Stats', desc: 'Performance par livreur' }],
    demo_url: 'https://walaup.vercel.app',
  },
  {
    id: 'creche-1', name: 'App Crèche & École',
    tagline: 'Simplifiez la gestion, rassurez les parents.',
    icon: '🏫', category: 'Education', price_from: 279, active: true,
    thumbnail_url: null, sort_order: 6,
    for_who: 'Crèches, jardins d\'enfants, écoles privées',
    problems: ['Inscriptions manuelles chronophages', 'Présences non digitalisées, absences non détectées', 'Aucune communication fluide avec les parents'],
    features: [{ title: '📝 Inscriptions', desc: 'En ligne et automatisées' }, { title: '✅ Présences', desc: 'Pointage digital quotidien' }, { title: '💬 Parents', desc: 'Messagerie et annonces' }, { title: '💳 Paiements', desc: 'Frais de scolarité en ligne' }],
    demo_url: 'https://walaup.vercel.app',
  },
]

const CATEGORIES = ['Tous', 'Restaurant', 'Retail', 'Services', 'Médical', 'Education']

const CAT = {
  Restaurant: { bg: 'rgba(251,146,60,.13)',  bd: 'rgba(251,146,60,.38)', tx: '#fb923c' },
  Retail:     { bg: 'rgba(99,102,241,.13)',  bd: 'rgba(99,102,241,.38)',  tx: '#818cf8' },
  Services:   { bg: 'rgba(34,211,238,.13)',  bd: 'rgba(34,211,238,.38)', tx: '#22d3ee' },
  Médical:    { bg: 'rgba(16,185,129,.13)',  bd: 'rgba(16,185,129,.38)', tx: '#10b981' },
  Education:  { bg: 'rgba(245,158,11,.13)',  bd: 'rgba(245,158,11,.38)', tx: '#f59e0b' },
}
const DEF_CAT = { bg: 'rgba(99,102,241,.13)', bd: 'rgba(99,102,241,.38)', tx: '#818cf8' }

// ─── All scoped styles — zero impact on globals.css ──────────────────────────
const CSS = `
  /* ── Keyframes ── */
  @keyframes mp-up      { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:none} }
  @keyframes mp-slide-r { from{opacity:0;transform:translateX(100%)} to{opacity:1;transform:none} }
  @keyframes mp-slide-u { from{opacity:0;transform:translateY(100%)} to{opacity:1;transform:none} }
  @keyframes mp-fadein  { from{opacity:0} to{opacity:1} }
  @keyframes mp-scalein { from{opacity:0;transform:scale(.9)} to{opacity:1;transform:none} }
  @keyframes mp-shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }

  /* ── Aurora background — self-contained ── */
  @keyframes mp-aurora-1 {
    0%   { transform:translate(-50%,-50%) scale(1) rotate(0deg);   opacity:.7; }
    33%  { transform:translate(-48%,-52%) scale(1.08) rotate(2deg); opacity:1;  }
    66%  { transform:translate(-52%,-48%) scale(.94) rotate(-2deg); opacity:.8; }
    100% { transform:translate(-50%,-50%) scale(1.03) rotate(1deg); opacity:.9; }
  }
  @keyframes mp-aurora-2 {
    0%   { transform:translate(0,-30%) scale(1);    opacity:.6; }
    50%  { transform:translate(5%,-25%) scale(1.1); opacity:.9; }
    100% { transform:translate(0,-30%) scale(1);    opacity:.6; }
  }
  @keyframes mp-aurora-3 {
    0%   { transform:translate(0,0) scale(1);     opacity:.5; }
    50%  { transform:translate(-5%,5%) scale(1.1); opacity:.8; }
    100% { transform:translate(0,0) scale(1);     opacity:.5; }
  }
  @keyframes mp-grain {
    0%,100% { transform:translate(0,0) }
    10%  { transform:translate(-2%,-3%) }
    20%  { transform:translate(3%,2%) }
    30%  { transform:translate(-1%,3%) }
    40%  { transform:translate(2%,-1%) }
    50%  { transform:translate(-3%,1%) }
    60%  { transform:translate(1%,-2%) }
    70%  { transform:translate(-2%,3%) }
    80%  { transform:translate(3%,-3%) }
    90%  { transform:translate(-1%,2%) }
  }
  @keyframes mp-float {
    0%,100% { transform:translateY(0) }
    50%     { transform:translateY(-10px) }
  }
  @keyframes mp-glow-pulse {
    0%,100% { box-shadow:0 0 20px rgba(99,102,241,.2),0 0 60px rgba(99,102,241,.05); }
    50%     { box-shadow:0 0 40px rgba(99,102,241,.45),0 0 80px rgba(99,102,241,.15); }
  }
  @keyframes mp-dot-live {
    0%,100% { opacity:.4; transform:scale(.8); }
    50%     { opacity:1;  transform:scale(1); }
  }

  /* ── Page wrapper — transparent, body gère le fond ── */
  .mp-page {
    position:relative;
    min-height:100vh;
    background:transparent;
    overflow-x:hidden;
  }

  /* ── Aurora orbs — fixed behind everything ── */
  .mp-aurora-1, .mp-aurora-2, .mp-aurora-3 {
    position:fixed; border-radius:50%; pointer-events:none; z-index:0;
    filter:blur(55px);
  }
  .mp-aurora-1 {
    width:75vw; height:65vh;
    top:-5%; left:50%;
    background:radial-gradient(ellipse, rgba(99,102,241,.28) 0%, rgba(139,92,246,.14) 40%, transparent 70%);
    animation:mp-aurora-1 20s ease-in-out infinite alternate;
  }
  .mp-aurora-2 {
    width:55vw; height:55vh;
    top:15vh; right:-5%;
    background:radial-gradient(ellipse, rgba(139,92,246,.22) 0%, transparent 70%);
    animation:mp-aurora-2 15s ease-in-out infinite alternate;
  }
  .mp-aurora-3 {
    width:45vw; height:45vh;
    bottom:5vh; left:-5%;
    background:radial-gradient(ellipse, rgba(34,211,238,.16) 0%, transparent 70%);
    animation:mp-aurora-3 18s ease-in-out infinite alternate;
  }

  /* ── Grain texture overlay ── */
  .mp-grain {
    position:fixed; inset:0; pointer-events:none; z-index:1;
    opacity:.028;
    background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    background-size:200px 200px;
    animation:mp-grain 8s steps(1) infinite;
  }

  /* ── All content sits above aurora (z-index:2+) ── */
  .mp-content { position:relative; z-index:2; }

  /* ── Cards ── */
  .mp-card {
    position:relative; background:rgba(13,17,32,.45);
    border:1px solid rgba(255,255,255,.09); border-radius:20px;
    overflow:hidden; cursor:pointer;
    backdrop-filter:blur(16px);
    transition:border-color .26s ease, transform .26s cubic-bezier(.16,1,.3,1), box-shadow .26s ease;
    animation:mp-up .45s cubic-bezier(.16,1,.3,1) both;
  }
  .mp-card:hover {
    border-color:rgba(99,102,241,.42);
    transform:translateY(-5px) scale(1.012);
    box-shadow:0 24px 64px rgba(0,0,0,.55), 0 0 0 1px rgba(99,102,241,.18), 0 0 40px rgba(99,102,241,.08);
  }
  .mp-card:active { transform:translateY(-2px) scale(.99); transition-duration:.1s; }

  /* Spotlight mouse glow on card */
  .mp-card::after {
    content:''; position:absolute; inset:0; border-radius:20px; pointer-events:none;
    background:radial-gradient(500px circle at var(--gx,50%) var(--gy,50%), rgba(99,102,241,.09), transparent 60%);
    opacity:0; transition:opacity .4s; z-index:0;
  }
  .mp-card:hover::after { opacity:1; }
  .mp-card>*:not(.mp-thumb) { position:relative; z-index:1; }

  /* Thumb */
  .mp-thumb { position:relative; height:176px; overflow:hidden; background:linear-gradient(135deg,rgba(17,24,39,.9),rgba(30,27,75,.8)); }
  .mp-thumb img { width:100%; height:100%; object-fit:cover; display:block; transition:transform .5s ease; }
  .mp-card:hover .mp-thumb img { transform:scale(1.06); }
  .mp-thumb-emoji { width:100%; height:100%; display:flex; align-items:center; justify-content:center; font-size:3.5rem; user-select:none; }
  .mp-thumb-veil  { position:absolute; inset:0; background:linear-gradient(to top,rgba(8,11,20,.95) 0%,rgba(8,11,20,.3) 45%,transparent 70%); }

  /* Card body */
  .mp-body { padding:1.15rem; }
  .mp-card-name  { font-family:'Space Grotesk',sans-serif; font-size:1.04rem; font-weight:700; color:#eef0ff; line-height:1.3; margin-bottom:.32rem; }
  .mp-card-tag   { font-size:.8rem; color:#8b90b8; line-height:1.55; margin-bottom:.9rem; min-height:2.4em; }
  .mp-card-price { font-family:'JetBrains Mono',monospace; font-size:1.05rem; font-weight:700; color:#f59e0b; margin-bottom:.85rem; }
  .mp-card-price span { font-size:.72rem; font-weight:400; color:#8b90b8; font-family:Inter,sans-serif; margin-left:4px; }
  .mp-btn-try {
    width:100%; padding:.54rem 1rem; border:1px solid rgba(99,102,241,.35); border-radius:10px;
    background:rgba(99,102,241,.1); color:#818cf8; font-size:.81rem; font-weight:600;
    cursor:pointer; display:flex; align-items:center; justify-content:center; gap:5px;
    transition:all .2s ease;
  }
  .mp-btn-try:hover { background:rgba(99,102,241,.22); border-color:rgba(99,102,241,.65); color:#a5b4fc; }

  /* Search */
  .mp-search-wrap { position:relative; }
  .mp-search-inp {
    width:100%; padding:.82rem 2.8rem; background:rgba(13,17,32,.4);
    border:1px solid rgba(255,255,255,.12); border-radius:14px;
    color:#eef0ff; font-size:.9rem; font-family:Inter,sans-serif;
    outline:none; transition:border-color .2s,box-shadow .2s;
    backdrop-filter:blur(16px);
  }
  .mp-search-inp::placeholder { color:#525878; }
  .mp-search-inp:focus { border-color:rgba(99,102,241,.55); box-shadow:0 0 0 3px rgba(99,102,241,.12); }
  .mp-search-ic  { position:absolute; left:1rem; top:50%; transform:translateY(-50%); color:#525878; pointer-events:none; }
  .mp-search-clr { position:absolute; right:1rem; top:50%; transform:translateY(-50%); background:none; border:none; color:#525878; cursor:pointer; padding:4px; display:flex; align-items:center; transition:color .2s; }
  .mp-search-clr:hover { color:#8b90b8; }

  /* Category chips */
  .mp-chip { padding:.4rem 1rem; border-radius:100px; flex-shrink:0; font-size:.79rem; font-weight:600; border:1px solid rgba(255,255,255,.1); background:rgba(13,17,32,.3); color:#8b90b8; cursor:pointer; white-space:nowrap; transition:all .2s ease; backdrop-filter:blur(8px); }
  .mp-chip:hover { border-color:rgba(255,255,255,.2); color:#eef0ff; }
  .mp-chip.on    { background:rgba(99,102,241,.18); border-color:rgba(99,102,241,.55); color:#818cf8; box-shadow:0 0 14px rgba(99,102,241,.2); }

  /* Skeleton */
  .mp-skel { background:linear-gradient(90deg,rgba(255,255,255,.04) 25%,rgba(255,255,255,.09) 50%,rgba(255,255,255,.04) 75%); background-size:200% auto; animation:mp-shimmer 1.6s infinite linear; border-radius:8px; }

  /* Stagger delays */
  .mp-card:nth-child(1){animation-delay:0ms}
  .mp-card:nth-child(2){animation-delay:55ms}
  .mp-card:nth-child(3){animation-delay:110ms}
  .mp-card:nth-child(4){animation-delay:165ms}
  .mp-card:nth-child(5){animation-delay:220ms}
  .mp-card:nth-child(6){animation-delay:275ms}

  /* Info panel */
  .mp-backdrop { position:fixed; inset:0; z-index:70; background:rgba(8,11,20,.78); backdrop-filter:blur(8px); animation:mp-fadein .24s ease; }
  .mp-panel {
    position:fixed; top:0; right:0; bottom:0; width:min(450px,100vw);
    background:rgba(10,14,28,.96); border-left:1px solid rgba(255,255,255,.08);
    z-index:71; display:flex; flex-direction:column; overflow:hidden;
    backdrop-filter:blur(20px);
    animation:mp-slide-r .35s cubic-bezier(.16,1,.3,1);
  }
  @media(max-width:640px){
    .mp-panel { top:auto;left:0;right:0;width:100%;height:88svh;border-left:none;border-top:1px solid rgba(255,255,255,.08);border-radius:24px 24px 0 0;animation:mp-slide-u .35s cubic-bezier(.16,1,.3,1); }
  }
  .mp-panel-hd {
    position:sticky; top:0; z-index:2;
    background:rgba(10,14,28,.96); backdrop-filter:blur(16px);
    border-bottom:1px solid rgba(255,255,255,.06);
    padding:1.1rem 1.4rem; display:flex; align-items:center; justify-content:space-between;
  }
  .mp-panel-close { width:34px; height:34px; border-radius:50%; border:1px solid rgba(255,255,255,.1); background:rgba(255,255,255,.05); color:#8b90b8; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all .2s; }
  .mp-panel-close:hover { background:rgba(255,255,255,.1); color:#eef0ff; }
  .mp-panel-body { flex:1; overflow-y:auto; padding:1.5rem; overscroll-behavior:contain; }
  .mp-panel-body::-webkit-scrollbar { width:4px; }
  .mp-panel-body::-webkit-scrollbar-thumb { background:rgba(255,255,255,.1); border-radius:2px; }
  .mp-panel-ft {
    position:sticky; bottom:0;
    background:rgba(10,14,28,.96); backdrop-filter:blur(16px);
    border-top:1px solid rgba(255,255,255,.06);
    padding:1rem 1.4rem; display:flex; flex-direction:column; gap:.48rem;
  }
  .mp-drag { width:40px; height:4px; background:rgba(255,255,255,.18); border-radius:2px; margin:0 auto .75rem; flex-shrink:0; }
  @media(min-width:641px){ .mp-drag { display:none; } }

  /* Panel inner */
  .mp-panel-thumb { width:100%; height:192px; border-radius:16px; overflow:hidden; background:linear-gradient(135deg,rgba(17,24,39,.9),rgba(30,27,75,.8)); display:flex; align-items:center; justify-content:center; font-size:5rem; margin-bottom:1.4rem; border:1px solid rgba(255,255,255,.06); }
  .mp-panel-thumb img { width:100%; height:100%; object-fit:cover; }
  .mp-sec-lbl { font-size:.68rem; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:#525878; margin:1.4rem 0 .65rem; display:flex; align-items:center; gap:8px; }
  .mp-sec-lbl::after { content:''; flex:1; height:1px; background:rgba(255,255,255,.05); }
  .mp-problem { display:flex; align-items:flex-start; gap:10px; padding:.55rem 0; border-bottom:1px solid rgba(255,255,255,.04); font-size:.84rem; color:#8b90b8; line-height:1.5; }
  .mp-feat { background:rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.06); border-radius:12px; padding:.78rem 1rem; margin-bottom:.42rem; transition:border-color .2s; }
  .mp-feat:hover { border-color:rgba(255,255,255,.12); }
  .mp-feat-t { font-weight:600; font-size:.85rem; color:#eef0ff; margin-bottom:2px; }
  .mp-feat-d { font-size:.78rem; color:#8b90b8; }

  /* Shared buttons */
  .mp-btn-primary { width:100%; padding:.82rem; background:linear-gradient(135deg,#6366f1,#8b5cf6); border:none; border-radius:12px; color:#fff; font-weight:700; font-size:.9rem; cursor:pointer; text-align:center; text-decoration:none; display:flex; align-items:center; justify-content:center; gap:7px; box-shadow:0 4px 20px rgba(99,102,241,.32); transition:all .2s; }
  .mp-btn-primary:hover { transform:translateY(-1px); box-shadow:0 8px 32px rgba(99,102,241,.5); }
  .mp-btn-ghost { width:100%; padding:.72rem; background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.1); border-radius:12px; color:#8b90b8; font-weight:600; font-size:.86rem; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px; text-decoration:none; transition:all .2s; }
  .mp-btn-ghost:hover { border-color:rgba(255,255,255,.2); color:#eef0ff; }

  /* Demo overlay */
  .mp-demo { position:fixed; inset:0; z-index:90; background:rgba(8,11,20,.97); backdrop-filter:blur(24px); display:flex; flex-direction:column; animation:mp-fadein .24s ease; }
  .mp-demo-top { height:58px; flex-shrink:0; border-bottom:1px solid rgba(255,255,255,.06); padding:0 1.25rem; display:flex; align-items:center; justify-content:space-between; background:rgba(13,17,32,.8); gap:1rem; }
  .mp-demo-back { display:flex; align-items:center; gap:6px; background:none; border:none; color:#8b90b8; cursor:pointer; font-size:.85rem; font-weight:600; padding:6px 10px; border-radius:8px; transition:all .2s; white-space:nowrap; }
  .mp-demo-back:hover { color:#eef0ff; background:rgba(255,255,255,.05); }
  .mp-demo-title { display:flex; align-items:center; gap:8px; min-width:0; }
  .mp-toggle-wrap { display:flex; align-items:center; background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.08); border-radius:10px; padding:3px; gap:2px; flex-shrink:0; }
  .mp-toggle-btn { padding:5px 12px; border-radius:7px; border:none; font-size:.78rem; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:5px; background:transparent; color:#8b90b8; transition:all .2s; white-space:nowrap; }
  .mp-toggle-btn.on { background:rgba(99,102,241,.25); color:#818cf8; }

  /* Phone frame */
  .mp-phone-area { flex:1; display:flex; align-items:center; justify-content:center; padding:2rem; overflow:hidden; }
  .mp-phone-shell { background:rgba(13,17,32,.92); border:2px solid rgba(255,255,255,.12); border-radius:44px; padding:16px; box-shadow:0 48px 120px rgba(0,0,0,.85),0 0 0 1px rgba(255,255,255,.04),inset 0 0 0 1px rgba(255,255,255,.06); animation:mp-scalein .3s cubic-bezier(.16,1,.3,1); }
  .mp-phone-notch { width:76px; height:6px; background:rgba(255,255,255,.1); border-radius:3px; margin:0 auto 12px; }
  .mp-phone-screen { width:260px; height:522px; border-radius:30px; overflow:hidden; background:#000; position:relative; }

  /* Browser frame */
  .mp-browser-area { flex:1; display:flex; align-items:center; justify-content:center; padding:2rem; overflow:hidden; }
  .mp-browser-shell { width:min(920px,100%); background:rgba(13,17,32,.92); border:1px solid rgba(255,255,255,.1); border-radius:16px; overflow:hidden; box-shadow:0 48px 120px rgba(0,0,0,.85); animation:mp-scalein .3s cubic-bezier(.16,1,.3,1); }
  .mp-browser-bar { background:rgba(17,24,39,.9); border-bottom:1px solid rgba(255,255,255,.06); padding:10px 16px; display:flex; align-items:center; gap:12px; }
  .mp-browser-dots { display:flex; gap:6px; }
  .mp-browser-dot  { width:10px; height:10px; border-radius:50%; }
  .mp-browser-url  { flex:1; background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.08); border-radius:6px; padding:4px 12px; font-size:.74rem; color:#8b90b8; font-family:'JetBrains Mono',monospace; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .mp-browser-content { height:500px; overflow:hidden; }
  .mp-browser-content iframe { width:100%; height:100%; border:none; display:block; }

  /* Demo footer */
  .mp-demo-ft { border-top:1px solid rgba(255,255,255,.06); padding:.9rem 1.25rem; display:flex; align-items:center; justify-content:space-between; gap:1rem; background:rgba(13,17,32,.8); flex-wrap:wrap; }
  .mp-demo-ft-name { font-weight:700; font-size:.9rem; color:#eef0ff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .mp-demo-ft-price { font-family:'JetBrains Mono',monospace; font-size:.78rem; color:#f59e0b; }
  .mp-demo-ft-acts { display:flex; gap:.5rem; flex-shrink:0; }
  .mp-ft-buy { padding:.6rem 1.1rem; background:linear-gradient(135deg,#6366f1,#8b5cf6); border-radius:10px; color:#fff; font-weight:700; font-size:.82rem; text-decoration:none; display:flex; align-items:center; gap:5px; box-shadow:0 4px 16px rgba(99,102,241,.4); transition:all .2s; white-space:nowrap; }
  .mp-ft-buy:hover { transform:translateY(-1px); box-shadow:0 8px 28px rgba(99,102,241,.55); }
  .mp-ft-custom { padding:.6rem 1.1rem; background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.1); border-radius:10px; color:#8b90b8; font-weight:600; font-size:.82rem; text-decoration:none; display:flex; align-items:center; gap:5px; transition:all .2s; white-space:nowrap; }
  .mp-ft-custom:hover { border-color:rgba(255,255,255,.2); color:#eef0ff; }

  /* Bottom CTA */
  .mp-cta-box { background:rgba(13,17,32,.7); border:1px solid rgba(99,102,241,.2); border-radius:24px; padding:2.25rem; text-align:center; position:relative; overflow:hidden; backdrop-filter:blur(12px); }
  .mp-cta-glow { position:absolute; top:-60px; left:50%; transform:translateX(-50%); width:300px; height:200px; pointer-events:none; background:radial-gradient(ellipse,rgba(99,102,241,.2) 0%,transparent 70%); animation:mp-float 5s ease-in-out infinite; }

  /* Empty state */
  .mp-empty { grid-column:1/-1; text-align:center; padding:5rem 2rem; color:#525878; }

  /* Live dot */
  .mp-live-dot { display:inline-block; width:6px; height:6px; border-radius:50%; background:#818cf8; animation:mp-dot-live 2s ease-in-out infinite; }
`

export default function MarketplacePage() {
  const [apps, setApps]           = useState(STATIC_APPS)
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [activecat, setActivecat] = useState('Tous')
  const [selected, setSelected]   = useState(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [demoOpen, setDemoOpen]   = useState(false)
  const [demoApp, setDemoApp]     = useState(null)
  const [device, setDevice]       = useState('mobile')

  const iframeRef = useRef(null)
  const screenRef = useRef(null)

  // Load from Supabase
  useEffect(() => {
    supabase.from('marketplace_apps').select('*').eq('active', true)
      .then(({ data }) => {
        if (data?.length) setApps(data.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Mouse spotlight on cards
  useEffect(() => {
    const cards = document.querySelectorAll('.mp-card')
    const handlers = []
    cards.forEach(card => {
      const fn = e => {
        const r = card.getBoundingClientRect()
        card.style.setProperty('--gx', (e.clientX - r.left) + 'px')
        card.style.setProperty('--gy', (e.clientY - r.top) + 'px')
      }
      card.addEventListener('mousemove', fn)
      handlers.push({ card, fn })
    })
    return () => handlers.forEach(({ card, fn }) => card.removeEventListener('mousemove', fn))
  }, [apps, activecat, search])

  // Filtered apps
  const filtered = apps.filter(a => {
    const matchCat    = activecat === 'Tous' || a.category === activecat
    const q           = search.toLowerCase()
    const matchSearch = !q ||
      (a.name || '').toLowerCase().includes(q) ||
      (a.tagline || '').toLowerCase().includes(q) ||
      (a.for_who || '').toLowerCase().includes(q)
    return matchCat && matchSearch
  })

  // Scale mobile iframe
  const scaleMobileIframe = useCallback(() => {
    if (!screenRef.current || !iframeRef.current) return
    const mw     = 390
    const availW = screenRef.current.clientWidth
    const availH = screenRef.current.clientHeight
    const scale  = availW / mw
    iframeRef.current.style.width           = mw + 'px'
    iframeRef.current.style.height          = Math.ceil(availH / scale) + 'px'
    iframeRef.current.style.transform       = `scale(${scale})`
    iframeRef.current.style.transformOrigin = 'top left'
  }, [])

  useEffect(() => {
    if (!demoOpen || device !== 'mobile') return
    const fn = () => scaleMobileIframe()
    window.addEventListener('resize', fn, { passive: true })
    return () => window.removeEventListener('resize', fn)
  }, [demoOpen, device, scaleMobileIframe])

  useEffect(() => {
    if (demoOpen && device === 'mobile') setTimeout(scaleMobileIframe, 140)
  }, [device, demoOpen, scaleMobileIframe])

  // Handlers
  function openPanel(app) { setSelected(app); setPanelOpen(true); WalaupSound?.click?.() }
  function closePanel()   { setPanelOpen(false); setTimeout(() => setSelected(null), 380) }
  function openDemo(app, e) {
    e?.stopPropagation()
    setDemoApp(app); setDevice('mobile'); setDemoOpen(true)
    WalaupSound?.click?.()
    setTimeout(scaleMobileIframe, 220)
  }
  function closeDemo()       { setDemoOpen(false); setTimeout(() => setDemoApp(null), 320); WalaupSound?.tab?.() }
  function switchDevice(m)   { setDevice(m); WalaupSound?.tab?.(); if (m === 'mobile') setTimeout(scaleMobileIframe, 120) }
  function pickCat(cat)      { setActivecat(cat); WalaupSound?.tab?.() }

  const selColor = selected ? (CAT[selected.category] || DEF_CAT) : DEF_CAT

  return (
    <>
      <style>{CSS}</style>

      <div className="mp-page">
        {/* Aurora orbs — always visible */}
        <div className="mp-aurora-1" aria-hidden="true" />
        <div className="mp-aurora-2" aria-hidden="true" />
        <div className="mp-aurora-3" aria-hidden="true" />
        {/* Film grain */}
        <div className="mp-grain" aria-hidden="true" />

        {/* ── All page content ── */}
        <div className="mp-content" style={{ paddingTop: 'var(--nav-h, 68px)', paddingBottom: '5rem' }}>

          {/* Hero */}
          <div style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto', padding: '3.5rem 1.5rem 2.5rem' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '4px 14px', borderRadius: '100px',
              background: 'rgba(99,102,241,.12)', border: '1px solid rgba(99,102,241,.3)',
              fontSize: '.73rem', fontWeight: 600, color: '#818cf8',
              marginBottom: '1.2rem', letterSpacing: '.04em'
            }}>
              <span className="mp-live-dot" />
              <Store size={11} style={{ marginRight: 1 }} />
              {filtered.length} applications disponibles
            </div>

            <h1 style={{
              fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, lineHeight: 1.15,
              fontSize: 'clamp(2rem,5vw,3rem)', color: '#eef0ff', marginBottom: '.7rem',
              letterSpacing: '-0.02em'
            }}>
              Marketplace{' '}
              <span style={{ background: 'linear-gradient(135deg,#6366f1,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                d'applications
              </span>
            </h1>
            <p style={{ color: '#8b90b8', fontSize: '.96rem', lineHeight: 1.7 }}>
              Des applications prêtes à déployer, adaptées à votre business en&nbsp;48h.
              Testez gratuitement avant d'acheter.
            </p>
          </div>

          {/* Search + Filters */}
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 1.5rem 2rem' }}>
            <div className="mp-search-wrap" style={{ marginBottom: '1rem' }}>
              <input
                className="mp-search-inp"
                type="text"
                placeholder="Rechercher une application..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <Search size={15} className="mp-search-ic" />
              {search && (
                <button className="mp-search-clr" onClick={() => setSearch('')} aria-label="Effacer">
                  <X size={13} />
                </button>
              )}
            </div>
            <div style={{ display: 'flex', gap: '.45rem', overflowX: 'auto', paddingBottom: 4 }}>
              {CATEGORIES.map(cat => (
                <button key={cat} className={`mp-chip${activecat === cat ? ' on' : ''}`} onClick={() => pickCat(cat)}>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Grid */}
          <div style={{
            maxWidth: 1100, margin: '0 auto', padding: '0 1.5rem',
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '1.2rem'
          }}>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{ borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(255,255,255,.06)' }}>
                  <div className="mp-skel" style={{ height: 176 }} />
                  <div style={{ padding: '1.15rem', background: 'rgba(13,17,32,.82)' }}>
                    <div className="mp-skel" style={{ height: 19, width: '78%', marginBottom: 8 }} />
                    <div className="mp-skel" style={{ height: 13, width: '60%', marginBottom: 16 }} />
                    <div className="mp-skel" style={{ height: 38, borderRadius: 10 }} />
                  </div>
                </div>
              ))
            ) : filtered.length === 0 ? (
              <div className="mp-empty">
                <Search size={36} style={{ margin: '0 auto 12px', opacity: .4 }} />
                <p style={{ fontSize: '1rem', marginBottom: 6 }}>Aucune application trouvée</p>
                <p style={{ fontSize: '.84rem' }}>Essayez un autre terme ou catégorie</p>
              </div>
            ) : (
              filtered.map((app, idx) => {
                const c = CAT[app.category] || DEF_CAT
                return (
                  <div key={app.id} className="mp-card" style={{ animationDelay: `${Math.min(idx, 5) * 55}ms` }}
                    onClick={() => openPanel(app)}>
                    <div className="mp-thumb">
                      <div className="mp-thumb-emoji">{app.icon || '📱'}</div>
                      <div className="mp-thumb-veil" />
                      {/* Category pill */}
                      <div style={{
                        position: 'absolute', top: 12, left: 12,
                        background: c.bg, border: `1px solid ${c.bd}`, color: c.tx,
                        padding: '2px 10px', borderRadius: '100px',
                        fontSize: '.67rem', fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase'
                      }}>
                        {app.category}
                      </div>
                    </div>
                    <div className="mp-body">
                      <div className="mp-card-name">{app.name}</div>
                      <div className="mp-card-tag">{app.tagline || 'Application sur mesure'}</div>
                      <div className="mp-card-price">
                        {app.price_from ? `À partir de ${app.price_from} DT` : 'Sur devis'}
                        {app.price_from && <span>· adapté en 48h</span>}
                      </div>
                      <button className="mp-btn-try" onClick={e => openDemo(app, e)}>
                        <Play size={12} fill="currentColor" /> Essayer la démo
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Bottom CTA */}
          <div style={{ maxWidth: 440, margin: '4rem auto 0', padding: '0 1.5rem' }}>
            <div className="mp-cta-box">
              <div className="mp-cta-glow" aria-hidden="true" />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <Sparkles size={32} color="#818cf8" style={{ margin: '0 auto .75rem', display: 'block', animation: 'mp-float 4s ease-in-out infinite' }} />
                <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, color: '#eef0ff', marginBottom: '.5rem', fontSize: '1.1rem' }}>
                  Votre idée n'est pas là ?
                </h3>
                <p style={{ color: '#8b90b8', fontSize: '.86rem', marginBottom: '1.25rem', lineHeight: 1.65 }}>
                  On crée n'importe quelle app sur mesure. Décrivez votre besoin,
                  démo gratuite en 48h.
                </p>
                <Link href="/estimateur" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '.72rem 1.5rem', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                  borderRadius: 12, color: '#fff', fontWeight: 700, fontSize: '.88rem',
                  textDecoration: 'none', boxShadow: '0 4px 20px rgba(99,102,241,.35)'
                }}>
                  Estimer mon app <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Info Panel ─────────────────────────────────────────────────────────── */}
      {panelOpen && selected && (
        <>
          <div className="mp-backdrop" onClick={closePanel} />
          <div className="mp-panel" role="dialog" aria-modal="true">
            <div className="mp-drag" />
            <div className="mp-panel-hd">
              <div style={{ display: 'flex', alignItems: 'center', gap: '.7rem', minWidth: 0 }}>
                <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{selected.icon || '📱'}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, color: '#eef0ff', fontSize: '.94rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selected.name}
                  </div>
                  <div style={{ fontSize: '.68rem', fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: selColor.tx }}>
                    {selected.category}
                  </div>
                </div>
              </div>
              <button className="mp-panel-close" onClick={closePanel} aria-label="Fermer"><X size={14} /></button>
            </div>

            <div className="mp-panel-body">
              <div className="mp-panel-thumb">
                {selected.thumbnail_url
                  ? <img src={selected.thumbnail_url} alt={selected.name} />
                  : <span>{selected.icon || '📱'}</span>}
              </div>

              <p style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '1.18rem', fontWeight: 700, color: '#eef0ff', lineHeight: 1.35, marginBottom: '.75rem' }}>
                {selected.tagline || selected.name}
              </p>

              {(selected.for_who || selected.forWho) && (
                <>
                  <div className="mp-sec-lbl">Pour qui ?</div>
                  <div style={{ background: selColor.bg, border: `1px solid ${selColor.bd}`, borderRadius: 12, padding: '.72rem 1rem', fontSize: '.86rem', color: selColor.tx, fontWeight: 500 }}>
                    {selected.for_who || selected.forWho}
                  </div>
                </>
              )}

              {selected.problems?.length > 0 && (
                <>
                  <div className="mp-sec-lbl">Problèmes résolus</div>
                  {selected.problems.map((p, i) => (
                    <div key={i} className="mp-problem">
                      <XCircle size={13} color="#f87171" style={{ flexShrink: 0, marginTop: 2 }} />
                      <span>{p}</span>
                    </div>
                  ))}
                </>
              )}

              {selected.features?.length > 0 && (
                <>
                  <div className="mp-sec-lbl">Fonctionnalités incluses</div>
                  {selected.features.map((f, i) => (
                    <div key={i} className="mp-feat">
                      <div className="mp-feat-t">{f.title}</div>
                      <div className="mp-feat-d">{f.desc}</div>
                    </div>
                  ))}
                </>
              )}

              <div style={{ marginTop: '1.4rem', background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.22)', borderRadius: 14, padding: '1rem 1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '.7rem', color: '#8b90b8', marginBottom: 2 }}>Prix adapté</div>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '1.35rem', fontWeight: 700, color: '#f59e0b' }}>
                    {selected.price_from ? `${selected.price_from} DT` : 'Sur devis'}
                  </div>
                </div>
                <div style={{ fontSize: '.76rem', color: '#8b90b8', textAlign: 'right', lineHeight: 1.6 }}>
                  Démo gratuite<br />Livraison en 48h
                </div>
              </div>
            </div>

            <div className="mp-panel-ft">
              <Link href="/estimateur" className="mp-btn-primary">
                <ShoppingCart size={14} /> Commander cette app
              </Link>
              <button className="mp-btn-ghost" onClick={() => { closePanel(); openDemo(selected) }}>
                <Play size={13} fill="currentColor" /> Essayer la démo gratuitement
              </button>
              <Link href="/estimateur" className="mp-btn-ghost" style={{ textDecoration: 'none' }}>
                <MessageSquare size={13} /> Demander une version sur mesure
              </Link>
            </div>
          </div>
        </>
      )}

      {/* ── Demo Overlay ──────────────────────────────────────────────────────── */}
      {demoOpen && demoApp && (
        <div className="mp-demo" role="dialog" aria-modal="true">
          <div className="mp-demo-top">
            <button className="mp-demo-back" onClick={closeDemo}>
              <ArrowLeft size={14} /> Retour
            </button>
            <div className="mp-demo-title">
              <span style={{ fontSize: '1.1rem' }}>{demoApp.icon || '📱'}</span>
              <strong style={{ fontWeight: 700, color: '#eef0ff', fontSize: '.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{demoApp.name}</strong>
              <span style={{ fontSize: '.7rem', color: '#8b90b8', whiteSpace: 'nowrap' }}>— Démo</span>
            </div>
            <div className="mp-toggle-wrap">
              <button className={`mp-toggle-btn${device === 'mobile' ? ' on' : ''}`} onClick={() => switchDevice('mobile')}>
                <Smartphone size={12} /> Mobile
              </button>
              <button className={`mp-toggle-btn${device === 'browser' ? ' on' : ''}`} onClick={() => switchDevice('browser')}>
                <Monitor size={12} /> Desktop
              </button>
            </div>
          </div>

          {device === 'mobile' ? (
            <div className="mp-phone-area">
              <div className="mp-phone-shell">
                <div className="mp-phone-notch" />
                <div className="mp-phone-screen" ref={screenRef}>
                  <iframe ref={iframeRef} src={demoApp.demo_url || 'https://walaup.vercel.app'} sandbox="allow-scripts allow-forms allow-popups" onLoad={scaleMobileIframe} title={`Démo ${demoApp.name}`} style={{ border: 'none', display: 'block' }} />
                </div>
              </div>
            </div>
          ) : (
            <div className="mp-browser-area">
              <div className="mp-browser-shell">
                <div className="mp-browser-bar">
                  <div className="mp-browser-dots">
                    <div className="mp-browser-dot" style={{ background: '#f87171' }} />
                    <div className="mp-browser-dot" style={{ background: '#fbbf24' }} />
                    <div className="mp-browser-dot" style={{ background: '#34d399' }} />
                  </div>
                  <div className="mp-browser-url">{demoApp.demo_url || 'https://walaup.vercel.app'}</div>
                </div>
                <div className="mp-browser-content">
                  <iframe src={demoApp.demo_url || 'https://walaup.vercel.app'} sandbox="allow-scripts allow-forms allow-popups" title={`Démo desktop ${demoApp.name}`} style={{ width: '100%', height: '100%', border: 'none', display: 'block' }} />
                </div>
              </div>
            </div>
          )}

          <div className="mp-demo-ft">
            <div style={{ display: 'flex', alignItems: 'center', gap: '.7rem', minWidth: 0 }}>
              <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>{demoApp.icon || '📱'}</span>
              <div style={{ minWidth: 0 }}>
                <div className="mp-demo-ft-name">{demoApp.name}</div>
                <div className="mp-demo-ft-price">{demoApp.price_from ? `À partir de ${demoApp.price_from} DT` : 'Sur devis'}</div>
              </div>
            </div>
            <div className="mp-demo-ft-acts">
              <Link href="/estimateur" className="mp-ft-buy"><ShoppingCart size={13} /> Acheter</Link>
              <Link href="/estimateur" className="mp-ft-custom"><MessageSquare size={13} /> Sur mesure</Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
