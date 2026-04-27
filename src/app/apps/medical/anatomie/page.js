'use client'
import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowLeft, RotateCcw, ZoomIn, ZoomOut, Layers,
  Heart, Brain, Activity, Eye, Wind, Bone,
  ChevronDown, ChevronRight, Info, AlertTriangle,
  Search, User, Microscope
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

/* ── Design System ──────────────────────────────────────────────────────── */
const CSS = `
  .an3d-root { position:fixed; inset:0; background:#050A12; display:flex; flex-direction:column; overflow:hidden; }
  .an3d-bar { height:54px; display:flex; align-items:center; padding:0 16px; gap:10px; flex-shrink:0;
    background:rgba(5,10,18,.95); border-bottom:1px solid rgba(255,255,255,.07); z-index:100; }
  .an3d-back { display:flex; align-items:center; gap:5px; color:rgba(255,255,255,.5); font-size:.82rem;
    font-weight:600; cursor:pointer; background:none; border:none; padding:0; transition:color .15s; }
  .an3d-back:hover { color:#38BDF8; }
  .an3d-title { font-family:var(--font-display); font-weight:800; font-size:.92rem;
    background:linear-gradient(135deg,#38BDF8,#818CF8); -webkit-background-clip:text;
    -webkit-text-fill-color:transparent; background-clip:text; flex:1; }
  .an3d-badge { padding:2px 9px; border-radius:20px; font-size:.65rem; font-weight:700;
    background:rgba(99,102,241,.15); color:#818CF8; border:1px solid rgba(99,102,241,.25); }
  .an3d-body { flex:1; display:flex; overflow:hidden; }

  /* ── Left panel ── */
  .an3d-left { width:220px; flex-shrink:0; border-right:1px solid rgba(255,255,255,.06);
    display:flex; flex-direction:column; overflow:hidden; background:rgba(5,10,18,.9); }
  .an3d-search { padding:10px; border-bottom:1px solid rgba(255,255,255,.06); flex-shrink:0; }
  .an3d-sr { display:flex; align-items:center; gap:7px; background:rgba(255,255,255,.05);
    border:1px solid rgba(255,255,255,.08); border-radius:9px; padding:0 10px; height:32px; }
  .an3d-sr input { flex:1; background:none; border:none; outline:none;
    color:rgba(255,255,255,.8); font-size:.78rem; }
  .an3d-sr input::placeholder { color:rgba(255,255,255,.25); }
  .an3d-cats { flex:1; overflow-y:auto; padding:6px; scrollbar-width:thin; scrollbar-color:rgba(255,255,255,.1) transparent; }
  .an3d-cat-header { display:flex; align-items:center; gap:7px; padding:8px 8px 6px;
    font-size:.68rem; font-weight:700; letter-spacing:.07em; text-transform:uppercase;
    color:rgba(255,255,255,.3); cursor:pointer; transition:color .15s; user-select:none; }
  .an3d-cat-header:hover { color:rgba(255,255,255,.6); }
  .an3d-cat-icon { width:22px; height:22px; border-radius:6px; display:flex; align-items:center;
    justify-content:center; flex-shrink:0; }
  .an3d-item { display:flex; align-items:center; gap:8px; padding:6px 8px 6px 16px;
    border-radius:8px; cursor:pointer; transition:all .15s; margin-bottom:1px; }
  .an3d-item:hover { background:rgba(255,255,255,.05); }
  .an3d-item.active { background:rgba(56,189,248,.1); }
  .an3d-item-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
  .an3d-item-name { font-size:.78rem; color:rgba(255,255,255,.65); font-weight:500; flex:1; }
  .an3d-item.active .an3d-item-name { color:#38BDF8; }
  .an3d-item-count { font-size:.65rem; color:rgba(255,255,255,.3); }

  /* ── Canvas area ── */
  .an3d-canvas-wrap { flex:1; position:relative; overflow:hidden; }
  canvas.an3d-canvas { width:100%; height:100%; display:block; }

  /* ── Controls overlay ── */
  .an3d-controls { position:absolute; bottom:20px; left:50%; transform:translateX(-50%);
    display:flex; align-items:center; gap:8px; z-index:10; }
  .an3d-ctrl { width:38px; height:38px; border-radius:10px; border:1px solid rgba(255,255,255,.12);
    background:rgba(5,10,18,.8); color:rgba(255,255,255,.7); cursor:pointer;
    display:flex; align-items:center; justify-content:center; transition:all .18s;
    backdrop-filter:blur(10px); }
  .an3d-ctrl:hover { border-color:rgba(56,189,248,.4); color:#38BDF8; background:rgba(56,189,248,.08); }
  .an3d-layer-btn { padding:0 14px; height:38px; border-radius:10px; border:1px solid rgba(255,255,255,.12);
    background:rgba(5,10,18,.8); color:rgba(255,255,255,.6); cursor:pointer; font-size:.75rem;
    font-weight:600; display:flex; align-items:center; gap:6px; transition:all .18s;
    backdrop-filter:blur(10px); }
  .an3d-layer-btn:hover { border-color:rgba(56,189,248,.4); color:#38BDF8; }
  .an3d-layer-btn.active { background:rgba(56,189,248,.12); color:#38BDF8; border-color:rgba(56,189,248,.35); }

  /* ── View mode tabs ── */
  .an3d-modes { position:absolute; top:12px; left:50%; transform:translateX(-50%);
    display:flex; gap:4px; background:rgba(5,10,18,.85); padding:3px;
    border-radius:12px; border:1px solid rgba(255,255,255,.08); z-index:10; }
  .an3d-mode { padding:5px 14px; border-radius:9px; border:none; background:transparent;
    color:rgba(255,255,255,.45); font-size:.72rem; font-weight:700; cursor:pointer; transition:all .18s; }
  .an3d-mode.active { background:rgba(56,189,248,.15); color:#38BDF8; }

  /* ── Info panel ── */
  .an3d-info { position:absolute; top:12px; right:12px; width:260px; z-index:10; }
  .an3d-info-card { background:rgba(5,10,18,.9); border:1px solid rgba(255,255,255,.09);
    border-radius:14px; padding:14px; backdrop-filter:blur(20px);
    animation:an3dFade .2s; margin-bottom:8px; }
  @keyframes an3dFade { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
  .an3d-info-title { font-weight:700; font-size:.88rem; color:white; margin-bottom:4px; }
  .an3d-info-sub { font-size:.72rem; color:rgba(255,255,255,.4); margin-bottom:10px; }
  .an3d-info-body { font-size:.75rem; color:rgba(255,255,255,.65); line-height:1.55; }
  .an3d-disease-tag { display:inline-flex; align-items:center; gap:4px; padding:2px 8px;
    border-radius:20px; font-size:.65rem; font-weight:700; margin:2px 2px; }
  .an3d-disease-tag.high   { background:rgba(239,68,68,.15); color:#F87171; border:1px solid rgba(239,68,68,.25); }
  .an3d-disease-tag.medium { background:rgba(245,158,11,.12); color:#FCD34D; border:1px solid rgba(245,158,11,.2); }
  .an3d-disease-tag.low    { background:rgba(56,189,248,.1);  color:#38BDF8; border:1px solid rgba(56,189,248,.2); }

  /* ── Patient selector ── */
  .an3d-pt-bar { position:absolute; bottom:70px; left:50%; transform:translateX(-50%);
    display:flex; align-items:center; gap:8px; z-index:10;
    background:rgba(5,10,18,.9); border:1px solid rgba(255,255,255,.08);
    border-radius:12px; padding:6px 12px; backdrop-filter:blur(20px); }
  .an3d-pt-label { font-size:.72rem; color:rgba(255,255,255,.35); font-weight:600; }
  .an3d-pt-select { background:transparent; border:none; color:rgba(255,255,255,.8);
    font-size:.78rem; font-weight:600; cursor:pointer; outline:none; }
  .an3d-pt-select option { background:#050A12; color:white; }

  /* ── Right panel ── */
  .an3d-right { width:240px; flex-shrink:0; border-left:1px solid rgba(255,255,255,.06);
    background:rgba(5,10,18,.9); overflow-y:auto; padding:12px;
    scrollbar-width:thin; scrollbar-color:rgba(255,255,255,.08) transparent; }
  .an3d-right-title { font-size:.68rem; font-weight:700; letter-spacing:.07em;
    text-transform:uppercase; color:rgba(255,255,255,.3); margin-bottom:10px; }
  .an3d-sys-card { padding:10px 12px; border-radius:10px; border:1px solid rgba(255,255,255,.07);
    background:rgba(255,255,255,.03); margin-bottom:6px; cursor:pointer; transition:all .18s; }
  .an3d-sys-card:hover { border-color:rgba(56,189,248,.3); background:rgba(56,189,248,.05); }
  .an3d-sys-card.affected { border-color:rgba(239,68,68,.3); background:rgba(239,68,68,.05); }
  .an3d-sys-name { font-size:.78rem; font-weight:700; color:rgba(255,255,255,.8); margin-bottom:3px; }
  .an3d-sys-status { font-size:.68rem; color:rgba(255,255,255,.35); }
  .an3d-sys-status.alert { color:#F87171; }
  .an3d-sys-bar { height:3px; border-radius:2px; background:rgba(255,255,255,.08); margin-top:6px; overflow:hidden; }
  .an3d-sys-fill { height:100%; border-radius:2px; transition:width .5s ease; }

  /* ── Floating labels ── */
  .an3d-floating-label {
    position:absolute; pointer-events:none; z-index:5;
    background:rgba(5,10,18,.9); border:1px solid rgba(255,255,255,.1);
    border-radius:8px; padding:4px 10px; font-size:.68rem; font-weight:700;
    color:white; backdrop-filter:blur(10px); white-space:nowrap;
    animation:an3dPulse 2s infinite;
  }
  .an3d-floating-label::after { content:''; position:absolute; bottom:-5px; left:50%;
    transform:translateX(-50%); width:1px; height:5px; background:rgba(255,255,255,.3); }
  @keyframes an3dPulse { 0%,100%{opacity:.8} 50%{opacity:1} }
  .an3d-floating-label.red   { border-color:rgba(239,68,68,.4); color:#F87171; }
  .an3d-floating-label.gold  { border-color:rgba(245,158,11,.4); color:#FCD34D; }
  .an3d-floating-label.blue  { border-color:rgba(56,189,248,.4); color:#38BDF8; }

  @media (max-width:900px) {
    .an3d-left  { width:180px; }
    .an3d-right { width:180px; }
  }
  @media (max-width:700px) {
    .an3d-left  { display:none; }
    .an3d-right { display:none; }
  }
`

/* ── Anatomical Data ─────────────────────────────────────────────────────── */
const ANATOMY = {
  'Cardiovasculaire': {
    color: '#F87171', icon: Heart,
    organs: [
      { id:'coeur',           name:'Cœur',                desc:'Pompe 5L/min, 100k battements/jour', x:.5,  y:.35, z:0, diseases:['Infarctus','Arythmie','Insuffisance cardiaque','Valvulopathie'] },
      { id:'aorte',           name:'Aorte',               desc:'Principale artère du corps', x:.5,  y:.4,  z:0, diseases:['Anévrisme','Dissection'] },
      { id:'arteres_coro',    name:'Artères coronaires',  desc:'Vascularisation du cœur', x:.52, y:.34, z:0, diseases:['Athérosclérose','Sténose'] },
      { id:'veines_pulm',     name:'Veines pulmonaires',  desc:'Retour veineux oxygéné', x:.48, y:.33, z:0, diseases:['Embolie pulmonaire'] },
    ]
  },
  'Respiratoire': {
    color: '#38BDF8', icon: Wind,
    organs: [
      { id:'poumon_d',   name:'Poumon droit',    desc:'3 lobes — 60% capacité', x:.55, y:.32, z:0, diseases:['Pneumonie','BPCO','Cancer','Asthme','Pneumothorax'] },
      { id:'poumon_g',   name:'Poumon gauche',   desc:'2 lobes — 40% capacité', x:.45, y:.32, z:0, diseases:['Pneumonie','Atélectasie'] },
      { id:'trachee',    name:'Trachée',         desc:'Conduit aérien principal', x:.5,  y:.25, z:0, diseases:['Sténose trachéale'] },
      { id:'diaphragme', name:'Diaphragme',      desc:'Muscle respiratoire principal', x:.5,  y:.42, z:0, diseases:['Hernie hiatale','Paralysie'] },
    ]
  },
  'Digestif': {
    color: '#34D399', icon: Activity,
    organs: [
      { id:'estomac',     name:'Estomac',         desc:'Digestion — pH 1.5-3.5', x:.5,  y:.48, z:0, diseases:['Ulcère','Gastrite','Cancer gastrique','RGO'] },
      { id:'foie',        name:'Foie',            desc:'500 fonctions métaboliques', x:.55, y:.45, z:0, diseases:['Cirrhose','Hépatite','Stéatose','Cancer'] },
      { id:'pancreas',    name:'Pancréas',        desc:'Insuline + enzymes digestives', x:.48, y:.47, z:0, diseases:['Diabète','Pancréatite','Cancer'] },
      { id:'intestin_g',  name:'Intestin grêle',  desc:'7m — absorption nutriments', x:.5,  y:.55, z:0, diseases:['Maladie de Crohn','Malabsorption'] },
      { id:'colon',       name:'Côlon',           desc:'1.5m — absorption eau', x:.5,  y:.6,  z:0, diseases:['Cancer colorectal','RCH','Diverticulose'] },
      { id:'vesicule',    name:'Vésicule biliaire',desc:'Stockage bile', x:.56, y:.47, z:0, diseases:['Lithiase biliaire','Cholécystite'] },
      { id:'rate',        name:'Rate',            desc:'Filtre sanguin — immunité', x:.44, y:.46, z:0, diseases:['Splénomégalie','Rupture'] },
    ]
  },
  'Neurologique': {
    color: '#A78BFA', icon: Brain,
    organs: [
      { id:'cerveau',       name:'Cerveau',          desc:'100 milliards neurones', x:.5,  y:.1,  z:0, diseases:['AVC','Épilepsie','Tumeur','Alzheimer','Méningite'] },
      { id:'cervelet',      name:'Cervelet',         desc:'Coordination motrice', x:.5,  y:.15, z:0, diseases:['Ataxie','Tumeur cérébelleux'] },
      { id:'tronc_cereb',   name:'Tronc cérébral',   desc:'Fonctions vitales', x:.5,  y:.18, z:0, diseases:['AVC tronculaire','Compression'] },
      { id:'moelle',        name:'Moelle épinière',  desc:'Transmission nerveuse', x:.5,  y:.4,  z:0, diseases:['Traumatisme','SEP','Myélopathie'] },
    ]
  },
  'Urinaire': {
    color: '#FCD34D', icon: Activity,
    organs: [
      { id:'rein_d',  name:'Rein droit', desc:'Filtration 180L/jour', x:.56, y:.5, z:0, diseases:['IRA','IRC','Lithiase','Cancer','Pyélonéphrite'] },
      { id:'rein_g',  name:'Rein gauche',desc:'Régulation TA + EPO', x:.44, y:.5, z:0, diseases:['Glomérulonéphrite','Polykystose'] },
      { id:'vessie',  name:'Vessie',     desc:'Réservoir urinaire', x:.5,  y:.65, z:0, diseases:['Cancer','Cystite','Incontinence'] },
    ]
  },
  'Endocrinien': {
    color: '#FB923C', icon: Activity,
    organs: [
      { id:'thyroide',      name:'Thyroïde',       desc:'Métabolisme — T3, T4, TSH', x:.5,  y:.22, z:0, diseases:['Hypothyroïdie','Hyperthyroïdie','Goitre','Cancer thyroïde'] },
      { id:'surrenales',    name:'Surrénales',     desc:'Cortisol, adrénaline', x:.5,  y:.48, z:0, diseases:['Cushing','Addison','Phéochromocytome'] },
      { id:'hypophyse',     name:'Hypophyse',      desc:'Chef d\'orchestre hormonal', x:.5,  y:.12, z:0, diseases:['Adénome hypophysaire','Déficit GH'] },
      { id:'pancreas_endo', name:'Pancréas endocrine', desc:'Insuline / Glucagon', x:.48, y:.47, z:0, diseases:['Diabète type 1','Diabète type 2'] },
    ]
  },
  'Squelette': {
    color: '#CBD5E1', icon: Bone,
    organs: [
      { id:'crane',     name:'Crâne',      desc:'Protection cérébrale', x:.5,  y:.08, z:0, diseases:['Fracture','Ostéoporose crânienne'] },
      { id:'colonne',   name:'Colonne vertébrale', desc:'33 vertèbres', x:.5,  y:.35, z:0, diseases:['Hernie discale','Scoliose','Spondylose','Fracture'] },
      { id:'sternum',   name:'Sternum',    desc:'Cage thoracique', x:.5,  y:.3,  z:0, diseases:['Fracture sternale'] },
      { id:'bassin',    name:'Bassin',     desc:'Ceinture pelvienne', x:.5,  y:.6,  z:0, diseases:['Fracture','Arthrose'] },
      { id:'femur_d',   name:'Fémur droit', desc:'Os le plus long', x:.54, y:.72, z:0, diseases:['Fracture col fémoral','Nécrose aseptique'] },
      { id:'femur_g',   name:'Fémur gauche',desc:'Os le plus solide', x:.46, y:.72, z:0, diseases:['Ostéoporose','Fracture'] },
    ]
  },
  'Oculaire': {
    color: '#67E8F9', icon: Eye,
    organs: [
      { id:'oeil_d', name:'Œil droit',  desc:'20 millions de récepteurs', x:.53, y:.13, z:0, diseases:['Cataracte','Glaucome','DMLA','Rétinopathie diabétique'] },
      { id:'oeil_g', name:'Œil gauche', desc:'Convergence binoculaire', x:.47, y:.13, z:0, diseases:['Myopie','Astigmatisme'] },
    ]
  },
}

/* ── Disease color mapping ──────────────────────────────────────────────── */
function getDiseaseColor(disease) {
  const high = ['Infarctus','AVC','Cancer','Rupture','Insuffisance cardiaque','IRA','Méningite','Embolie pulmonaire']
  const med  = ['Diabète','Cirrhose','Épilepsie','Hypertension','Pneumonie','Asthme']
  if (high.some(d => disease.includes(d))) return 'high'
  if (med.some(d => disease.includes(d)))  return 'medium'
  return 'low'
}

/* ── Body Drawing Engine ──────────────────────────────────────────────────
   Rendu SVG procédural du corps humain avec organes animés
─────────────────────────────────────────────────────────────────────────── */

function BodyCanvas({ activeSystem, activeOrgan, setActiveOrgan, viewMode, patientConditions, showLabels }) {
  const canvasRef = useRef(null)
  const animRef   = useRef(null)
  const timeRef   = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    function resize() {
      canvas.width  = canvas.offsetWidth  * window.devicePixelRatio
      canvas.height = canvas.offsetHeight * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }
    resize()
    window.addEventListener('resize', resize)

    function drawBody(t) {
      const W = canvas.offsetWidth
      const H = canvas.offsetHeight
      ctx.clearRect(0, 0, W, H)

      const cx = W / 2
      const bodyH = Math.min(H * 0.88, 520)
      const scale = bodyH / 600
      const top   = (H - bodyH) / 2

      // Fonction helper de position
      function pos(rx, ry) {
        return { x: cx + (rx - 0.5) * 280 * scale, y: top + ry * bodyH }
      }

      // ── Fond grille sci-fi ──
      ctx.strokeStyle = 'rgba(56,189,248,.04)'
      ctx.lineWidth = 1
      for (let x = 0; x < W; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke()
      }
      for (let y = 0; y < H; y += 40) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke()
      }

      // ── Silhouette du corps ──
      ctx.save()
      ctx.globalAlpha = 0.25

      if (viewMode === 'skeleton') {
        drawSkeleton(ctx, cx, top, bodyH, scale, t)
      } else {
        drawSilhouette(ctx, cx, top, bodyH, scale)
      }
      ctx.restore()

      // ── Organes ──
      const sysData = activeSystem ? ANATOMY[activeSystem] : null
      const organs  = sysData ? sysData.organs : Object.values(ANATOMY).flatMap(s => s.organs)

      organs.forEach(organ => {
        const p = pos(organ.x, organ.y)
        const isActive    = activeOrgan?.id === organ.id
        const hasCondition = patientConditions.some(c =>
          organ.diseases.some(d => d.toLowerCase().includes(c.toLowerCase()) || c.toLowerCase().includes(d.toLowerCase()))
        )

        const sysColor = activeSystem
          ? ANATOMY[activeSystem].color
          : Object.values(ANATOMY).find(s => s.organs.includes(organ))?.color || '#38BDF8'

        const pulse = Math.sin(t * 0.003 + organ.x * 10) * 0.15 + 0.85
        const r     = (isActive ? 14 : hasCondition ? 12 : 9) * scale * pulse

        // Glow effect
        const glowColor = hasCondition ? '#F87171' : sysColor
        ctx.shadowColor = glowColor
        ctx.shadowBlur  = isActive ? 20 : hasCondition ? 16 : 8

        // Cercle organe
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r)
        grad.addColorStop(0, glowColor + 'FF')
        grad.addColorStop(0.6, glowColor + 'AA')
        grad.addColorStop(1, glowColor + '22')
        ctx.beginPath()
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
        ctx.fillStyle = grad
        ctx.fill()
        ctx.shadowBlur = 0

        // Anneau externe si actif
        if (isActive || hasCondition) {
          ctx.beginPath()
          ctx.arc(p.x, p.y, r + 4 * scale, 0, Math.PI * 2)
          ctx.strokeStyle = hasCondition ? '#F87171' : sysColor
          ctx.lineWidth   = 1.5
          ctx.globalAlpha = 0.4 + Math.sin(t * 0.004) * 0.3
          ctx.stroke()
          ctx.globalAlpha = 1
        }

        // Label
        if (showLabels || isActive) {
          ctx.font        = `${isActive ? 600 : 500} ${10 * scale}px Inter, sans-serif`
          ctx.fillStyle   = isActive ? 'white' : hasCondition ? '#F87171' : 'rgba(255,255,255,.5)'
          ctx.textAlign   = 'center'
          ctx.shadowColor = 'rgba(0,0,0,.8)'
          ctx.shadowBlur  = 6
          ctx.fillText(organ.name, p.x, p.y + r + 12 * scale)
          ctx.shadowBlur  = 0
        }

        // Ligne de connexion si condition
        if (hasCondition) {
          ctx.beginPath()
          ctx.setLineDash([3, 4])
          ctx.strokeStyle = 'rgba(248,113,113,.3)'
          ctx.lineWidth   = 1
          ctx.moveTo(p.x, p.y)
          ctx.lineTo(cx + 80 * scale, p.y + (Math.sin(t*0.002)*5))
          ctx.stroke()
          ctx.setLineDash([])
        }
      })

      // ── Battement de cœur simulé ──
      if (!activeSystem || activeSystem === 'Cardiovasculaire') {
        const heartPos = pos(0.5, 0.35)
        const beat = Math.abs(Math.sin(t * 0.008)) * 3 * scale
        ctx.beginPath()
        ctx.arc(heartPos.x, heartPos.y, 6 * scale + beat, 0, Math.PI * 2)
        ctx.fillStyle = '#F8717180'
        ctx.fill()
      }
    }

    function drawSilhouette(ctx, cx, top, bodyH, scale) {
      // Corps simplifié — corps humain stylisé
      ctx.fillStyle = 'rgba(56,189,248,.08)'
      ctx.strokeStyle = 'rgba(56,189,248,.25)'
      ctx.lineWidth = 1.5

      // Tête
      ctx.beginPath()
      ctx.ellipse(cx, top + bodyH * 0.1, 45 * scale, 55 * scale, 0, 0, Math.PI * 2)
      ctx.fill(); ctx.stroke()

      // Cou
      ctx.beginPath()
      ctx.fillRect(cx - 15 * scale, top + bodyH * 0.175, 30 * scale, 30 * scale)
      ctx.fill()

      // Torse
      ctx.beginPath()
      ctx.roundRect(cx - 65 * scale, top + bodyH * 0.22, 130 * scale, bodyH * 0.28, 12 * scale)
      ctx.fill(); ctx.stroke()

      // Bassin
      ctx.beginPath()
      ctx.ellipse(cx, top + bodyH * 0.57, 55 * scale, 35 * scale, 0, 0, Math.PI * 2)
      ctx.fill(); ctx.stroke()

      // Bras gauche
      ctx.beginPath()
      ctx.roundRect(cx - 95 * scale, top + bodyH * 0.22, 28 * scale, bodyH * 0.35, 10 * scale)
      ctx.fill(); ctx.stroke()

      // Bras droit
      ctx.beginPath()
      ctx.roundRect(cx + 67 * scale, top + bodyH * 0.22, 28 * scale, bodyH * 0.35, 10 * scale)
      ctx.fill(); ctx.stroke()

      // Jambe gauche
      ctx.beginPath()
      ctx.roundRect(cx - 55 * scale, top + bodyH * 0.6, 42 * scale, bodyH * 0.38, 10 * scale)
      ctx.fill(); ctx.stroke()

      // Jambe droite
      ctx.beginPath()
      ctx.roundRect(cx + 13 * scale, top + bodyH * 0.6, 42 * scale, bodyH * 0.38, 10 * scale)
      ctx.fill(); ctx.stroke()
    }

    function drawSkeleton(ctx, cx, top, bodyH, scale) {
      ctx.strokeStyle = 'rgba(203,213,225,.3)'
      ctx.lineWidth = 2 * scale
      ctx.lineCap = 'round'

      function line(x1, y1, x2, y2) {
        ctx.beginPath()
        ctx.moveTo(cx + x1 * scale, top + y1 * scale * (bodyH/600))
        ctx.lineTo(cx + x2 * scale, top + y2 * scale * (bodyH/600))
        ctx.stroke()
      }
      function circle(x, y, r) {
        ctx.beginPath()
        ctx.arc(cx + x * scale, top + y * scale * (bodyH/600), r * scale, 0, Math.PI*2)
        ctx.stroke()
      }

      // Crâne
      circle(0, 55, 42)
      // Colonne vertébrale
      line(0, 100, 0, 380)
      // Épaules
      line(-110, 140, 110, 140)
      // Clavicules
      line(-30, 115, -110, 140)
      line(30, 115, 110, 140)
      // Bras gauche
      line(-110, 140, -110, 260); line(-110, 260, -100, 370)
      // Bras droit
      line(110, 140, 110, 260); line(110, 260, 100, 370)
      // Mains
      circle(-100, 380, 14); circle(100, 380, 14)
      // Côtes
      for (let i = 0; i < 6; i++) {
        const y = 145 + i * 28
        ctx.beginPath()
        ctx.bezierCurveTo(cx - 3*scale, top + y*scale*(bodyH/600), cx - 80*scale, top + (y+15)*scale*(bodyH/600), cx - 90*scale, top + (y+10)*scale*(bodyH/600))
        ctx.stroke()
        ctx.beginPath()
        ctx.bezierCurveTo(cx + 3*scale, top + y*scale*(bodyH/600), cx + 80*scale, top + (y+15)*scale*(bodyH/600), cx + 90*scale, top + (y+10)*scale*(bodyH/600))
        ctx.stroke()
      }
      // Bassin
      ctx.beginPath()
      ctx.ellipse(cx, top + 385*scale*(bodyH/600), 70*scale, 35*scale, 0, 0, Math.PI*2)
      ctx.stroke()
      // Fémurs
      line(-35, 385, -50, 510); line(35, 385, 50, 510)
      // Tibias
      line(-50, 510, -44, 600); line(50, 510, 44, 600)
    }

    function loop(ts) {
      timeRef.current = ts
      drawBody(ts)
      animRef.current = requestAnimationFrame(loop)
    }
    animRef.current = requestAnimationFrame(loop)

    // Click detection
    function handleClick(e) {
      const rect   = canvas.getBoundingClientRect()
      const mx     = (e.clientX - rect.left)
      const my     = (e.clientY - rect.top)
      const W      = canvas.offsetWidth
      const H      = canvas.offsetHeight
      const bodyH  = Math.min(H * 0.88, 520)
      const scale  = bodyH / 600
      const top    = (H - bodyH) / 2
      const cx     = W / 2

      const organs = activeSystem
        ? ANATOMY[activeSystem].organs
        : Object.values(ANATOMY).flatMap(s => s.organs)

      for (const organ of organs) {
        const px = cx + (organ.x - 0.5) * 280 * scale
        const py = top + organ.y * bodyH
        const r  = 18 * scale
        if (Math.hypot(mx - px, my - py) < r) {
          setActiveOrgan(organ)
          return
        }
      }
      setActiveOrgan(null)
    }
    canvas.addEventListener('click', handleClick)

    return () => {
      window.removeEventListener('resize', resize)
      canvas.removeEventListener('click', handleClick)
      cancelAnimationFrame(animRef.current)
    }
  }, [activeSystem, activeOrgan, viewMode, patientConditions, showLabels, setActiveOrgan])

  return <canvas ref={canvasRef} className="an3d-canvas" style={{ cursor:'crosshair' }}/>
}

/* ── Main Component ──────────────────────────────────────────────────────── */
function AnatomieInner() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const ptParam      = searchParams.get('patient')

  const [user,           setUser]           = useState(null)
  const [patients,       setPatients]       = useState([])
  const [selectedPt,     setSelectedPt]     = useState(ptParam || '')
  const [patientData,    setPatientData]    = useState(null)
  const [activeSystem,   setActiveSystem]   = useState(null)
  const [activeOrgan,    setActiveOrgan]    = useState(null)
  const [viewMode,       setViewMode]       = useState('anatomy') // anatomy | skeleton | muscles
  const [showLabels,     setShowLabels]     = useState(true)
  const [searchQ,        setSearchQ]        = useState('')
  const [expandedCats,   setExpandedCats]   = useState({})
  const [loading,        setLoading]        = useState(true)
  const [patientConditions, setPatientConditions] = useState([])

  useEffect(() => {
    async function init() {
      const { data: { user: u } } = await supabase.auth.getUser()
      if (!u) { router.push('/apps/medical/login'); return }
      const { data: ud } = await supabase.from('users')
        .select('role, tenant_id, app_type')
        .eq('id', u.id).maybeSingle()
      if (!ud || ud.app_type !== 'medical') { router.push('/apps/medical/login'); return }
      setUser({ ...u, ...ud })
      const { data: pts } = await supabase.from('med_patients')
        .select('id, first_name, last_name, chronic_cond, allergies')
        .order('last_name', { ascending: true }).limit(100)
      setPatients(pts || [])
      setLoading(false)
    }
    init()
  }, [router])

  useEffect(() => {
    if (!selectedPt || !patients.length) { setPatientData(null); setPatientConditions([]); return }
    const pt = patients.find(p => p.id === selectedPt)
    if (!pt) return
    setPatientData(pt)
    const conditions = [
      ...(pt.chronic_cond || []),
      ...(pt.allergies || []).map(a => a.name),
    ]
    setPatientConditions(conditions)
  }, [selectedPt, patients])

  // Chercher le bon système quand on clique un organe
  function getSystemForOrgan(organ) {
    return Object.keys(ANATOMY).find(sys =>
      ANATOMY[sys].organs.some(o => o.id === organ.id)
    ) || null
  }

  function handleSetOrgan(organ) {
    setActiveOrgan(organ)
    if (organ) {
      const sys = getSystemForOrgan(organ)
      if (sys) setActiveSystem(sys)
    }
  }

  // Systèmes affectés chez le patient
  function getSystemHealth(sysName) {
    const sys    = ANATOMY[sysName]
    const total  = sys.organs.length
    const affected = sys.organs.filter(o =>
      o.diseases.some(d => patientConditions.some(c =>
        d.toLowerCase().includes(c.toLowerCase()) || c.toLowerCase().includes(d.toLowerCase())
      ))
    ).length
    return { affected, total, pct: Math.max(0, 100 - (affected / total) * 100) }
  }

  const filteredOrgans = searchQ
    ? Object.entries(ANATOMY).flatMap(([sys, data]) =>
        data.organs
          .filter(o => o.name.toLowerCase().includes(searchQ.toLowerCase()) || o.diseases.some(d => d.toLowerCase().includes(searchQ.toLowerCase())))
          .map(o => ({ ...o, system: sys, sysColor: data.color }))
      )
    : []

  if (loading) return (
    <div style={{ background:'#050A12', height:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center', color:'rgba(56,189,248,.6)', fontFamily:'monospace' }}>
        <div style={{ fontSize:'1.2rem', marginBottom:8 }}>⬡ MediLink Anatomy</div>
        <div style={{ fontSize:'.75rem', opacity:.6 }}>Chargement de la bibliothèque anatomique…</div>
      </div>
    </div>
  )

  return (
    <>
      <style>{CSS}</style>
      <div className="an3d-root">

        {/* ── Topbar ── */}
        <div className="an3d-bar">
          <button className="an3d-back" onClick={() => router.push('/apps/medical/doctor')}>
            <ArrowLeft size={14}/> Retour
          </button>
          <span className="an3d-title">Bibliothèque Anatomique 3D</span>
          <span className="an3d-badge">MediLink Anatomy v1</span>
        </div>

        <div className="an3d-body">
          {/* ── LEFT — Catégories ── */}
          <div className="an3d-left">
            <div className="an3d-search">
              <div className="an3d-sr">
                <Search size={12} color="rgba(255,255,255,.3)"/>
                <input placeholder="Organe, maladie…"
                  value={searchQ} onChange={e => setSearchQ(e.target.value)}/>
              </div>
            </div>
            <div className="an3d-cats">
              {searchQ ? (
                filteredOrgans.map(o => (
                  <div key={o.id} className={`an3d-item ${activeOrgan?.id===o.id?'active':''}`}
                    onClick={() => { handleSetOrgan(o); setSearchQ('') }}>
                    <div className="an3d-item-dot" style={{ background: o.sysColor }}/>
                    <span className="an3d-item-name">{o.name}</span>
                  </div>
                ))
              ) : Object.entries(ANATOMY).map(([sysName, sysData]) => {
                const isOpen  = expandedCats[sysName] !== false // défaut ouvert
                const health  = patientData ? getSystemHealth(sysName) : null
                const Icon    = sysData.icon

                return (
                  <div key={sysName}>
                    <div className="an3d-cat-header"
                      onClick={() => {
                        setActiveSystem(activeSystem===sysName ? null : sysName)
                        setExpandedCats(prev => ({ ...prev, [sysName]: !isOpen }))
                        setActiveOrgan(null)
                      }}>
                      <div className="an3d-cat-icon" style={{ background: sysData.color + '22' }}>
                        <Icon size={11} color={sysData.color}/>
                      </div>
                      <span style={{ flex:1, color: activeSystem===sysName ? sysData.color : undefined }}>
                        {sysName}
                      </span>
                      {health?.affected > 0 && (
                        <span style={{ fontSize:'.6rem', color:'#F87171', fontWeight:700 }}>
                          ⚠ {health.affected}
                        </span>
                      )}
                      {isOpen ? <ChevronDown size={10}/> : <ChevronRight size={10}/>}
                    </div>
                    {isOpen && sysData.organs.map(organ => {
                      const isAffected = patientConditions.some(c =>
                        organ.diseases.some(d => d.toLowerCase().includes(c.toLowerCase()) || c.toLowerCase().includes(d.toLowerCase()))
                      )
                      return (
                        <div key={organ.id} className={`an3d-item ${activeOrgan?.id===organ.id?'active':''}`}
                          onClick={() => handleSetOrgan(organ)}>
                          <div className="an3d-item-dot"
                            style={{ background: isAffected ? '#F87171' : sysData.color + '80' }}/>
                          <span className="an3d-item-name">{organ.name}</span>
                          {isAffected && <AlertTriangle size={9} color="#F87171"/>}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── CENTER — Canvas ── */}
          <div className="an3d-canvas-wrap">
            {/* View mode */}
            <div className="an3d-modes">
              {['anatomy','skeleton','muscles'].map(m => (
                <button key={m} className={`an3d-mode ${viewMode===m?'active':''}`}
                  onClick={() => setViewMode(m)}>
                  {m === 'anatomy' ? 'Anatomie' : m === 'skeleton' ? 'Squelette' : 'Muscles'}
                </button>
              ))}
            </div>

            {/* Canvas */}
            <BodyCanvas
              activeSystem={activeSystem}
              activeOrgan={activeOrgan}
              setActiveOrgan={handleSetOrgan}
              viewMode={viewMode}
              patientConditions={patientConditions}
              showLabels={showLabels}
            />

            {/* Info card organe actif */}
            {activeOrgan && (
              <div className="an3d-info">
                <div className="an3d-info-card">
                  <div className="an3d-info-title">{activeOrgan.name}</div>
                  <div className="an3d-info-sub">{activeOrgan.desc}</div>
                  <div className="an3d-info-body">
                    <div style={{ fontWeight:700, fontSize:'.68rem', letterSpacing:'.05em', textTransform:'uppercase', color:'rgba(255,255,255,.3)', marginBottom:6 }}>
                      Pathologies associées
                    </div>
                    <div>
                      {activeOrgan.diseases.map(d => {
                        const isPatient = patientConditions.some(c =>
                          d.toLowerCase().includes(c.toLowerCase()) || c.toLowerCase().includes(d.toLowerCase())
                        )
                        const lvl = getDiseaseColor(d)
                        return (
                          <span key={d} className={`an3d-disease-tag ${isPatient ? lvl : ''}`}
                            style={!isPatient ? { background:'rgba(255,255,255,.05)', color:'rgba(255,255,255,.35)', border:'1px solid rgba(255,255,255,.08)' } : {}}>
                            {isPatient && '● '}
                            {d}
                          </span>
                        )
                      })}
                    </div>
                    {patientData && patientConditions.some(c =>
                      activeOrgan.diseases.some(d => d.toLowerCase().includes(c.toLowerCase()) || c.toLowerCase().includes(d.toLowerCase()))
                    ) && (
                      <div style={{ marginTop:10, padding:'8px 10px', background:'rgba(239,68,68,.08)',
                        borderRadius:8, border:'1px solid rgba(239,68,68,.2)', fontSize:'.72rem', color:'#F87171' }}>
                        <AlertTriangle size={11} style={{ display:'inline', marginRight:4, verticalAlign:'middle' }}/>
                        Cet organe est affecté chez <strong>{patientData.first_name} {patientData.last_name}</strong>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Patient selector */}
            <div className="an3d-pt-bar">
              <User size={13} color="rgba(56,189,248,.6)"/>
              <span className="an3d-pt-label">Simuler sur :</span>
              <select className="an3d-pt-select" value={selectedPt}
                onChange={e => setSelectedPt(e.target.value)}>
                <option value="">— Corps générique —</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.first_name} {p.last_name}
                    {(p.chronic_cond||[]).length > 0 ? ` (${(p.chronic_cond||[]).length} pathologies)` : ''}
                  </option>
                ))}
              </select>
              {patientData && (
                <div style={{ padding:'2px 8px', borderRadius:20, background:'rgba(239,68,68,.15)',
                  color:'#F87171', fontSize:'.65rem', fontWeight:700, flexShrink:0 }}>
                  {patientConditions.length} conditions actives
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="an3d-controls">
              <button className="an3d-ctrl" onClick={() => setActiveSystem(null)} title="Vue globale">
                <RotateCcw size={15}/>
              </button>
              <button className={`an3d-layer-btn ${showLabels?'active':''}`}
                onClick={() => setShowLabels(l => !l)}>
                <Layers size={13}/> Labels
              </button>
              {Object.keys(ANATOMY).slice(0,4).map(sys => (
                <button key={sys}
                  className={`an3d-layer-btn ${activeSystem===sys?'active':''}`}
                  onClick={() => setActiveSystem(activeSystem===sys?null:sys)}
                  style={{ '--hover-color': ANATOMY[sys].color }}>
                  {sys.slice(0,5)}.
                </button>
              ))}
            </div>
          </div>

          {/* ── RIGHT — Systèmes ── */}
          <div className="an3d-right">
            <div className="an3d-right-title">
              {patientData ? `${patientData.first_name} ${patientData.last_name}` : 'Systèmes'}
            </div>

            {patientData && patientConditions.length > 0 && (
              <div style={{ padding:'8px 10px', background:'rgba(239,68,68,.06)',
                borderRadius:10, border:'1px solid rgba(239,68,68,.15)', marginBottom:10 }}>
                <div style={{ fontSize:'.68rem', fontWeight:700, color:'#F87171', marginBottom:4 }}>
                  Conditions actives
                </div>
                {patientConditions.map(c => (
                  <div key={c} style={{ fontSize:'.7rem', color:'rgba(255,255,255,.5)', padding:'1px 0' }}>
                    · {c}
                  </div>
                ))}
              </div>
            )}

            {Object.entries(ANATOMY).map(([sysName, sysData]) => {
              const health  = patientData ? getSystemHealth(sysName) : { pct: 100, affected: 0 }
              const isAffected = health.affected > 0

              return (
                <div key={sysName}
                  className={`an3d-sys-card ${isAffected?'affected':''}`}
                  onClick={() => setActiveSystem(activeSystem===sysName?null:sysName)}>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background: sysData.color, flexShrink:0 }}/>
                    <div className="an3d-sys-name" style={{ flex:1 }}>{sysName}</div>
                    {isAffected && <AlertTriangle size={10} color="#F87171"/>}
                  </div>
                  <div className={`an3d-sys-status ${isAffected?'alert':''}`}>
                    {isAffected
                      ? `${health.affected} organe(s) affecté(s)`
                      : `${sysData.organs.length} structures`}
                  </div>
                  {patientData && (
                    <div className="an3d-sys-bar">
                      <div className="an3d-sys-fill"
                        style={{
                          width: health.pct + '%',
                          background: isAffected
                            ? `linear-gradient(90deg, #F87171, #FB923C)`
                            : `linear-gradient(90deg, ${sysData.color}80, ${sysData.color})`,
                        }}/>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}

export default function Anatomie() {
  return (
    <Suspense fallback={
      <div style={{ background:'#050A12', height:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ color:'rgba(56,189,248,.6)', fontFamily:'monospace', fontSize:'.85rem' }}>
          Chargement…
        </div>
      </div>
    }>
      <AnatomieInner/>
    </Suspense>
  )
}
