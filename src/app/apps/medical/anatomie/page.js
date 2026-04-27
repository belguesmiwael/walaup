'use client'
import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowLeft, RotateCcw, Layers, Heart, Brain,
  Wind, Activity, Bone, Eye, Search, AlertTriangle,
  ChevronDown, ChevronRight, User, ZoomIn, ZoomOut
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

const CSS = `
  .a3-root{position:fixed;inset:0;background:#030810;display:flex;flex-direction:column;overflow:hidden}
  .a3-bar{height:54px;display:flex;align-items:center;padding:0 16px;gap:10px;flex-shrink:0;
    background:rgba(3,8,16,.97);border-bottom:1px solid rgba(56,189,248,.1);z-index:100}
  .a3-back{display:flex;align-items:center;gap:5px;color:rgba(255,255,255,.4);font-size:.82rem;
    font-weight:600;cursor:pointer;background:none;border:none;padding:0;transition:color .15s}
  .a3-back:hover{color:#38BDF8}
  .a3-h1{font-family:var(--font-display);font-weight:800;font-size:.9rem;
    background:linear-gradient(135deg,#38BDF8,#818CF8);-webkit-background-clip:text;
    -webkit-text-fill-color:transparent;background-clip:text;flex:1}
  .a3-body{flex:1;display:flex;overflow:hidden}
  /* Left sidebar */
  .a3-left{width:210px;flex-shrink:0;border-right:1px solid rgba(255,255,255,.05);
    display:flex;flex-direction:column;overflow:hidden;background:rgba(3,8,16,.95)}
  .a3-sr{padding:9px;border-bottom:1px solid rgba(255,255,255,.05);flex-shrink:0}
  .a3-sr-inner{display:flex;align-items:center;gap:6px;background:rgba(255,255,255,.04);
    border:1px solid rgba(255,255,255,.07);border-radius:8px;padding:0 9px;height:30px}
  .a3-sr-inner input{flex:1;background:none;border:none;outline:none;color:rgba(255,255,255,.7);font-size:.75rem}
  .a3-sr-inner input::placeholder{color:rgba(255,255,255,.2)}
  .a3-cats{flex:1;overflow-y:auto;padding:5px;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.06) transparent}
  .a3-cat-hdr{display:flex;align-items:center;gap:6px;padding:7px 7px 5px;
    font-size:.62rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;
    color:rgba(255,255,255,.25);cursor:pointer;transition:color .15s}
  .a3-cat-hdr:hover{color:rgba(255,255,255,.5)}
  .a3-cat-ic{width:20px;height:20px;border-radius:5px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
  .a3-item{display:flex;align-items:center;gap:7px;padding:5px 7px 5px 14px;
    border-radius:7px;cursor:pointer;transition:all .14s;margin-bottom:1px}
  .a3-item:hover{background:rgba(255,255,255,.04)}
  .a3-item.sel{background:rgba(56,189,248,.1);border-left:2px solid #38BDF8;padding-left:12px}
  .a3-item-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0}
  .a3-item-name{font-size:.74rem;color:rgba(255,255,255,.55);flex:1}
  .a3-item.sel .a3-item-name{color:#38BDF8}
  /* Canvas */
  .a3-center{flex:1;position:relative;overflow:hidden}
  canvas.a3-canvas{width:100%;height:100%;display:block}
  /* Controls */
  .a3-ctrl-bar{position:absolute;bottom:16px;left:50%;transform:translateX(-50%);
    display:flex;gap:8px;z-index:10}
  .a3-ctrl{width:36px;height:36px;border-radius:9px;border:1px solid rgba(255,255,255,.1);
    background:rgba(3,8,16,.85);color:rgba(255,255,255,.6);cursor:pointer;
    display:flex;align-items:center;justify-content:center;transition:all .16s;backdrop-filter:blur(10px)}
  .a3-ctrl:hover{border-color:rgba(56,189,248,.4);color:#38BDF8}
  .a3-ctrl.active{background:rgba(56,189,248,.1);color:#38BDF8;border-color:rgba(56,189,248,.3)}
  /* Mode tabs */
  .a3-modes{position:absolute;top:12px;left:50%;transform:translateX(-50%);
    display:flex;gap:3px;background:rgba(3,8,16,.85);padding:3px;
    border-radius:10px;border:1px solid rgba(255,255,255,.07);z-index:10;backdrop-filter:blur(10px)}
  .a3-mode{padding:5px 12px;border-radius:8px;border:none;background:transparent;
    color:rgba(255,255,255,.35);font-size:.7rem;font-weight:700;cursor:pointer;transition:all .16s}
  .a3-mode.active{background:rgba(56,189,248,.15);color:#38BDF8}
  /* Info card */
  .a3-info{position:absolute;top:12px;right:12px;width:240px;z-index:10}
  .a3-info-card{background:rgba(3,8,16,.92);border:1px solid rgba(255,255,255,.08);
    border-radius:13px;padding:13px;backdrop-filter:blur(20px);animation:a3fade .18s}
  @keyframes a3fade{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
  .a3-info-title{font-weight:700;font-size:.87rem;color:white;margin-bottom:3px}
  .a3-info-desc{font-size:.7rem;color:rgba(255,255,255,.35);margin-bottom:9px}
  .a3-info-body{font-size:.72rem;color:rgba(255,255,255,.55);line-height:1.5}
  .a3-dtag{display:inline-block;padding:2px 7px;border-radius:20px;font-size:.62rem;font-weight:700;margin:2px}
  .a3-dtag.h{background:rgba(239,68,68,.15);color:#F87171;border:1px solid rgba(239,68,68,.25)}
  .a3-dtag.m{background:rgba(245,158,11,.12);color:#FCD34D;border:1px solid rgba(245,158,11,.2)}
  .a3-dtag.l{background:rgba(56,189,248,.1);color:#38BDF8;border:1px solid rgba(56,189,248,.2)}
  .a3-affected-banner{margin-top:8px;padding:7px 9px;background:rgba(239,68,68,.08);
    border:1px solid rgba(239,68,68,.2);border-radius:8px;font-size:.7rem;color:#F87171;font-weight:600}
  /* Right panel */
  .a3-right{width:220px;flex-shrink:0;border-left:1px solid rgba(255,255,255,.05);
    background:rgba(3,8,16,.95);overflow-y:auto;padding:10px;
    scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.06) transparent}
  .a3-right-title{font-size:.62rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;
    color:rgba(255,255,255,.25);margin-bottom:8px}
  .a3-sys-card{padding:9px 11px;border-radius:9px;border:1px solid rgba(255,255,255,.06);
    background:rgba(255,255,255,.02);margin-bottom:5px;cursor:pointer;transition:all .16s}
  .a3-sys-card:hover{border-color:rgba(56,189,248,.25);background:rgba(56,189,248,.04)}
  .a3-sys-card.aff{border-color:rgba(239,68,68,.25);background:rgba(239,68,68,.04)}
  .a3-sys-name{font-size:.74rem;font-weight:700;color:rgba(255,255,255,.75);margin-bottom:2px;
    display:flex;align-items:center;gap:5px}
  .a3-sys-sub{font-size:.65rem;color:rgba(255,255,255,.3)}
  .a3-sys-sub.alert{color:#F87171}
  .a3-bar2{height:3px;border-radius:2px;background:rgba(255,255,255,.07);margin-top:5px;overflow:hidden}
  .a3-bar2-fill{height:100%;border-radius:2px;transition:width .6s ease}
  /* Pt selector */
  .a3-pt-bar{position:absolute;bottom:60px;left:50%;transform:translateX(-50%);
    display:flex;align-items:center;gap:8px;background:rgba(3,8,16,.9);
    border:1px solid rgba(255,255,255,.07);border-radius:10px;padding:5px 12px;
    z-index:10;backdrop-filter:blur(12px);white-space:nowrap}
  .a3-pt-label{font-size:.68rem;color:rgba(255,255,255,.3);font-weight:600}
  .a3-pt-sel{background:transparent;border:none;color:rgba(255,255,255,.75);
    font-size:.75rem;font-weight:600;cursor:pointer;outline:none}
  .a3-pt-sel option{background:#030810;color:white}
  .a3-affected-pill{padding:2px 8px;border-radius:20px;background:rgba(239,68,68,.15);
    color:#F87171;font-size:.62rem;font-weight:700;flex-shrink:0}
  @media(max-width:800px){.a3-left{display:none}.a3-right{display:none}}
`

const ANATOMY = {
  'Cardiovasculaire': {
    color:'#F87171', hue: 0,
    organs:[
      {id:'coeur',       name:'Cœur',                pos:[0,.08,.05],   r:.055, desc:'Pompe 5L/min',           diseases:['Infarctus','Arythmie','Insuffisance cardiaque','Endocardite']},
      {id:'aorte',       name:'Aorte',               pos:[0,.04,.04],   r:.025, desc:'Artère principale',       diseases:['Anévrisme','Dissection aortique']},
      {id:'a_pulm',      name:'Artère pulmonaire',   pos:[-.02,.1,.04], r:.02,  desc:'Vers les poumons',        diseases:['HTAP','Embolie pulmonaire']},
    ]
  },
  'Respiratoire': {
    color:'#38BDF8', hue:200,
    organs:[
      {id:'poumon_d',   name:'Poumon droit',   pos:[.1,.07,.02],  r:.065, desc:'3 lobes — 60% capacité', diseases:['Pneumonie','Cancer','BPCO','Asthme','Pneumothorax']},
      {id:'poumon_g',   name:'Poumon gauche',  pos:[-.1,.07,.02], r:.055, desc:'2 lobes — 40% capacité', diseases:['Pneumonie','Atélectasie','Emphysème']},
      {id:'trachee',    name:'Trachée',        pos:[0,.17,.04],   r:.018, desc:'Conduit aérien',          diseases:['Sténose','Cancer trachéal']},
    ]
  },
  'Digestif': {
    color:'#34D399', hue:155,
    organs:[
      {id:'foie',       name:'Foie',           pos:[.1,-.03,.03], r:.07,  desc:'500+ fonctions',           diseases:['Cirrhose','Hépatite','Stéatose','Cancer hépatique']},
      {id:'estomac',    name:'Estomac',         pos:[-.02,-.05,.04],r:.055,desc:'pH 1.5-3.5',              diseases:['Ulcère','Gastrite','Cancer gastrique','RGO']},
      {id:'pancreas',   name:'Pancréas',        pos:[-.04,-.08,.02],r:.04, desc:'Insuline + enzymes',       diseases:['Diabète','Pancréatite','Cancer pancréas']},
      {id:'colon',      name:'Côlon',           pos:[0,-.16,.02],  r:.045, desc:'1.5m — absorption eau',   diseases:['Cancer colorectal','RCH','Diverticulose']},
      {id:'rate',       name:'Rate',            pos:[-.12,-.04,.03],r:.038,desc:'Filtre sanguin',           diseases:['Splénomégalie','Rupture splénique']},
      {id:'vesicule',   name:'Vésicule biliaire',pos:[.09,-.07,.04],r:.025,desc:'Stockage bile',           diseases:['Lithiase','Cholécystite']},
    ]
  },
  'Neurologique': {
    color:'#A78BFA', hue:260,
    organs:[
      {id:'cerveau',    name:'Cerveau',         pos:[0,.38,.04],   r:.09,  desc:'100 milliards neurones',   diseases:['AVC','Épilepsie','Tumeur','Alzheimer','Méningite']},
      {id:'cervelet',   name:'Cervelet',        pos:[0,.3,-.04],  r:.055, desc:'Coordination motrice',     diseases:['Ataxie','Tumeur cérébelleux']},
      {id:'moelle',     name:'Moelle épinière', pos:[0,.1,-.06],   r:.022, desc:'Transmission nerveuse',    diseases:['Traumatisme','SEP','Myélopathie']},
    ]
  },
  'Urinaire': {
    color:'#FCD34D', hue:45,
    organs:[
      {id:'rein_d',    name:'Rein droit',       pos:[.1,-.1,.-.02],r:.045, desc:'Filtration 180L/jour',    diseases:['IRA','IRC','Lithiase rénale','Cancer rein','Pyélonéphrite']},
      {id:'rein_g',    name:'Rein gauche',      pos:[-.1,-.1,.-.02],r:.045,desc:'Régulation TA + EPO',     diseases:['Glomérulonéphrite','Polykystose rénale']},
      {id:'vessie',    name:'Vessie',           pos:[0,-.27,.0],   r:.04,  desc:'Réservoir urinaire',       diseases:['Cancer vessie','Cystite','Incontinence']},
    ]
  },
  'Endocrinien': {
    color:'#FB923C', hue:25,
    organs:[
      {id:'thyroide',   name:'Thyroïde',        pos:[0,.24,.07],   r:.03,  desc:'T3, T4, TSH',              diseases:['Hypothyroïdie','Hyperthyroïdie','Goitre','Cancer thyroïde']},
      {id:'surrenales', name:'Surrénales',       pos:[.1,-.07,.-.01],r:.02, desc:'Cortisol, adrénaline',     diseases:['Cushing','Addison','Phéochromocytome']},
    ]
  },
  'Squelette': {
    color:'#CBD5E1', hue:210,
    organs:[
      {id:'crane',      name:'Crâne',            pos:[0,.44,.0],    r:.075, desc:'Protection cérébrale',    diseases:['Fracture crânienne','Ostéoporose']},
      {id:'colonne',    name:'Colonne vertébrale',pos:[0,.05,-.07], r:.03,  desc:'33 vertèbres',             diseases:['Hernie discale','Scoliose','Fracture vertèbre']},
      {id:'sternum',    name:'Sternum',           pos:[0,.09,.08],   r:.03,  desc:'Cage thoracique',         diseases:['Fracture sternale']},
      {id:'bassin',     name:'Bassin',            pos:[0,-.2,.0],    r:.06,  desc:'Ceinture pelvienne',      diseases:['Fracture bassin','Arthrose hanche']},
    ]
  },
}

function getDiseaseSeverity(d) {
  const high = ['Infarctus','AVC','Cancer','Rupture','Méningite','Embolie','Insuffisance']
  const med  = ['Diabète','Cirrhose','Épilepsie','Pneumonie','Asthme','Hépatite']
  return high.some(h=>d.includes(h)) ? 'h' : med.some(m=>d.includes(m)) ? 'm' : 'l'
}

// ── Three.js body renderer ───────────────────────────────────────────────────
function init3DScene(canvas, { activeSystem, selectedOrgan, patientConditions, viewMode, onOrganClick }) {
  // Charger Three.js dynamiquement
  return new Promise(async (resolve) => {
    if (!window.THREE) {
      await new Promise(r => {
        const s = document.createElement('script')
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'
        s.onload = r
        document.head.appendChild(s)
      })
    }
    const THREE = window.THREE
    const W = canvas.clientWidth, H = canvas.clientHeight

    // Renderer
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    renderer.setSize(W, H)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2

    // Scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#030810')
    scene.fog = new THREE.Fog('#030810', 3, 10)

    // Camera
    const camera = new THREE.PerspectiveCamera(45, W/H, 0.01, 20)
    camera.position.set(0, 0, 1.8)

    // Éclairage
    const ambientLight = new THREE.AmbientLight(0x334466, 0.8)
    scene.add(ambientLight)

    const mainLight = new THREE.DirectionalLight(0x6699FF, 2.5)
    mainLight.position.set(2, 3, 2)
    mainLight.castShadow = true
    scene.add(mainLight)

    const rimLight = new THREE.DirectionalLight(0x0EA5E9, 1.2)
    rimLight.position.set(-2, 1, -2)
    scene.add(rimLight)

    const fillLight = new THREE.PointLight(0x818CF8, 0.8, 5)
    fillLight.position.set(0, 2, 1)
    scene.add(fillLight)

    // Groupe principal — toute l'anatomie
    const bodyGroup = new THREE.Group()
    scene.add(bodyGroup)

    // ── Corps humain procédural 3D ──────────────────────────────────────
    function createBodyPart(geom, mat, pos, rot = [0,0,0]) {
      const mesh = new THREE.Mesh(geom, mat)
      mesh.position.set(...pos)
      mesh.rotation.set(...rot)
      mesh.castShadow = true
      mesh.receiveShadow = true
      return mesh
    }

    const skinMat = new THREE.MeshPhongMaterial({
      color: 0x1a2744,
      emissive: 0x0a1228,
      specular: 0x334488,
      shininess: 30,
      transparent: true,
      opacity: viewMode === 'skeleton' ? 0.08 : viewMode === 'wireframe' ? 0.0 : 0.18,
      wireframe: viewMode === 'wireframe',
    })

    // Tête
    const head = createBodyPart(new THREE.SphereGeometry(.1, 32, 32), skinMat, [0, .4, 0])
    bodyGroup.add(head)

    // Cou
    const neck = createBodyPart(new THREE.CylinderGeometry(.03,.035,.07,16), skinMat, [0,.32,0])
    bodyGroup.add(neck)

    // Torse (simplifié avec des sphères empilées pour l'aspect organique)
    const torsoMat = skinMat.clone()
    torsoMat.opacity = viewMode === 'skeleton' ? 0.06 : viewMode === 'wireframe' ? 0.0 : 0.12

    for (let i = 0; i < 6; i++) {
      const r = .11 - i * .005
      const torsoSeg = createBodyPart(new THREE.SphereGeometry(r, 24, 24), torsoMat, [0, .25 - i*.06, 0])
      torsoSeg.scale.set(1, .5, .7)
      bodyGroup.add(torsoSeg)
    }

    // Bassin
    const pelvis = createBodyPart(new THREE.SphereGeometry(.1, 24, 24), torsoMat, [0, -.22, 0])
    pelvis.scale.set(1.1, .6, .8)
    bodyGroup.add(pelvis)

    // Épaules
    const shoulderL = createBodyPart(new THREE.SphereGeometry(.05, 16, 16), skinMat, [-.16, .28, 0])
    const shoulderR = createBodyPart(new THREE.SphereGeometry(.05, 16, 16), skinMat, [.16, .28, 0])
    bodyGroup.add(shoulderL, shoulderR)

    // Bras
    ;[[-1,1],[1,1]].forEach(([side]) => {
      const upperArm = createBodyPart(new THREE.CylinderGeometry(.03,.025,.15,12), skinMat, [side*.19, .18, 0])
      const forearm  = createBodyPart(new THREE.CylinderGeometry(.025,.022,.14,12), skinMat, [side*.2, .05, 0])
      const hand     = createBodyPart(new THREE.SphereGeometry(.032, 12, 12), skinMat, [side*.2, -.02, 0])
      bodyGroup.add(upperArm, forearm, hand)
    })

    // Jambes
    ;[[-1],[1]].forEach(([side]) => {
      const thigh  = createBodyPart(new THREE.CylinderGeometry(.045,.04,.2,12), skinMat, [side*.06, -.34, 0])
      const shin   = createBodyPart(new THREE.CylinderGeometry(.032,.028,.2,12), skinMat, [side*.06, -.54, 0])
      const foot   = createBodyPart(new THREE.SphereGeometry(.038, 12, 12), skinMat, [side*.06, -.65, .03])
      foot.scale.set(.8, .5, 1.4)
      bodyGroup.add(thigh, shin, foot)
    })

    // Colonne vertébrale visible en skeleton mode
    if (viewMode === 'skeleton') {
      for (let i = 0; i < 12; i++) {
        const v = new THREE.Mesh(
          new THREE.TorusGeometry(.025, .007, 8, 16),
          new THREE.MeshPhongMaterial({ color: 0xCBD5E1, emissive: 0x334455, shininess: 60 })
        )
        v.position.set(0, .28 - i*.05, -.06)
        v.rotation.x = Math.PI / 2
        bodyGroup.add(v)
      }
      // Côtes
      for (let i = 0; i < 6; i++) {
        ;[-1, 1].forEach(side => {
          const rib = new THREE.Mesh(
            new THREE.TorusGeometry(.09, .005, 6, 20, Math.PI * .65),
            new THREE.MeshPhongMaterial({ color: 0xCBD5E1, emissive: 0x223344 })
          )
          rib.position.set(side * .03, .24 - i * .04, 0)
          rib.rotation.z = side * .2
          rib.rotation.y = side * .3
          bodyGroup.add(rib)
        })
      }
    }

    // ── Organes 3D ──────────────────────────────────────────────────────
    const organMeshes = []
    const raycaster   = new THREE.Raycaster()
    const mouse       = new THREE.Vector2()

    // Déterminer quels organes afficher
    const organsToShow = activeSystem
      ? ANATOMY[activeSystem].organs
      : Object.values(ANATOMY).flatMap(s => s.organs)

    organsToShow.forEach(organ => {
      const sys = Object.values(ANATOMY).find(s => s.organs.includes(organ))
      const sysColor = sys ? sys.color : '#38BDF8'

      const isAffected = patientConditions.some(c =>
        organ.diseases.some(d =>
          d.toLowerCase().includes(c.toLowerCase()) ||
          c.toLowerCase().includes(d.toLowerCase())
        )
      )
      const isSelected = selectedOrgan?.id === organ.id

      // Couleur selon état
      let color = sysColor
      if (isAffected) color = '#F87171'
      const threeColor = new THREE.Color(color)

      // Matériau organe — glossy, translucide
      const mat = new THREE.MeshPhongMaterial({
        color: threeColor,
        emissive: threeColor.clone().multiplyScalar(isSelected ? .5 : isAffected ? .4 : .2),
        specular: new THREE.Color(0xffffff),
        shininess: isSelected ? 120 : 80,
        transparent: true,
        opacity: isSelected ? 1.0 : isAffected ? .95 : .82,
      })

      // Géométrie
      const geom = organ.id === 'coeur'
        ? new THREE.SphereGeometry(organ.r, 32, 32)    // cœur = sphère
        : organ.id === 'colonne' || organ.id === 'moelle'
        ? new THREE.CylinderGeometry(organ.r, organ.r, organ.r*4, 12)
        : new THREE.SphereGeometry(organ.r, 24, 24)

      const mesh = new THREE.Mesh(geom, mat)
      mesh.position.set(...organ.pos)
      mesh.castShadow = true
      mesh.userData = { organ, isAffected }

      // Halo si affecté ou sélectionné
      if (isAffected || isSelected) {
        const haloMat = new THREE.MeshBasicMaterial({
          color: isSelected ? 0x38BDF8 : 0xFF4444,
          transparent: true,
          opacity: .15,
          side: THREE.BackSide,
        })
        const halo = new THREE.Mesh(
          new THREE.SphereGeometry(organ.r * (isSelected ? 1.5 : 1.35), 16, 16),
          haloMat
        )
        halo.position.set(...organ.pos)
        bodyGroup.add(halo)
      }

      bodyGroup.add(mesh)
      organMeshes.push(mesh)
    })

    // ── Labels sprites ───────────────────────────────────────────────────
    function makeLabel(text, color) {
      const c = document.createElement('canvas')
      c.width = 256; c.height = 64
      const ctx = c.getContext('2d')
      ctx.fillStyle = 'rgba(3,8,16,.85)'
      ctx.roundRect(4, 4, 248, 56, 10)
      ctx.fill()
      ctx.strokeStyle = color
      ctx.lineWidth = 1.5
      ctx.strokeRect(4, 4, 248, 56)
      ctx.fillStyle = color
      ctx.font = 'bold 22px Inter, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(text, 128, 32)
      const tex = new THREE.CanvasTexture(c)
      const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false })
      const sprite = new THREE.Sprite(mat)
      sprite.scale.set(.18, .045, 1)
      return sprite
    }

    if (activeSystem) {
      ANATOMY[activeSystem]?.organs.forEach(organ => {
        const sys = ANATOMY[activeSystem]
        const label = makeLabel(organ.name, organ.id === selectedOrgan?.id ? '#38BDF8' : sys.color)
        label.position.set(organ.pos[0], organ.pos[1] + organ.r + .04, organ.pos[2])
        bodyGroup.add(label)
      })
    }

    // ── Grid de fond ─────────────────────────────────────────────────────
    const gridHelper = new THREE.GridHelper(4, 20, 0x0a1428, 0x0a1428)
    gridHelper.position.y = -.7
    scene.add(gridHelper)

    // ── Orbite manuelle ──────────────────────────────────────────────────
    let isDragging = false, prevX = 0, prevY = 0
    let rotX = 0, rotY = 0, zoom = 1.8

    canvas.addEventListener('mousedown', e => { isDragging = true; prevX = e.clientX; prevY = e.clientY })
    canvas.addEventListener('touchstart', e => { isDragging = true; prevX = e.touches[0].clientX; prevY = e.touches[0].clientY }, { passive: true })
    window.addEventListener('mouseup', () => { isDragging = false })
    window.addEventListener('touchend', () => { isDragging = false })

    canvas.addEventListener('mousemove', e => {
      if (!isDragging) return
      rotY += (e.clientX - prevX) * .005
      rotX += (e.clientY - prevY) * .005
      rotX = Math.max(-Math.PI/3, Math.min(Math.PI/3, rotX))
      prevX = e.clientX; prevY = e.clientY
    })
    canvas.addEventListener('touchmove', e => {
      if (!isDragging) return
      rotY += (e.touches[0].clientX - prevX) * .005
      rotX += (e.touches[0].clientY - prevY) * .005
      prevX = e.touches[0].clientX; prevY = e.touches[0].clientY
    }, { passive: true })
    canvas.addEventListener('wheel', e => {
      zoom = Math.max(.8, Math.min(4, zoom + e.deltaY * .002))
    }, { passive: true })

    // Click organe
    canvas.addEventListener('click', e => {
      const rect = canvas.getBoundingClientRect()
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(mouse, camera)
      const hits = raycaster.intersectObjects(organMeshes)
      if (hits.length > 0) {
        onOrganClick(hits[0].object.userData.organ)
      } else {
        onOrganClick(null)
      }
    })

    // ── Animation loop ────────────────────────────────────────────────────
    let frameId, t = 0
    function animate() {
      frameId = requestAnimationFrame(animate)
      t++

      // Auto-rotate lent quand pas de drag
      if (!isDragging) rotY += .003

      bodyGroup.rotation.y = rotY
      bodyGroup.rotation.x = rotX * .5

      // Pulsation cœur
      const heartMesh = organMeshes.find(m => m.userData.organ?.id === 'coeur')
      if (heartMesh) {
        const beat = 1 + Math.abs(Math.sin(t * .08)) * .08
        heartMesh.scale.setScalar(beat)
        heartMesh.material.emissiveIntensity = .3 + Math.abs(Math.sin(t * .08)) * .4
      }

      // Organes affectés — pulsation rouge
      organMeshes.filter(m => m.userData.isAffected).forEach(m => {
        m.material.emissiveIntensity = .3 + Math.sin(t * .04) * .25
      })

      camera.position.z = zoom
      camera.position.y = rotX * -.3
      camera.lookAt(0, .05, 0)

      renderer.render(scene, camera)
    }
    animate()

    // Resize
    function onResize() {
      const W = canvas.clientWidth, H = canvas.clientHeight
      camera.aspect = W/H
      camera.updateProjectionMatrix()
      renderer.setSize(W, H)
    }
    window.addEventListener('resize', onResize)

    resolve(() => {
      cancelAnimationFrame(frameId)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
    })
  })
}

function AnatomieInner() {
  const router       = useRouter()
  const sp           = useSearchParams()
  const ptParam      = sp.get('patient') || ''

  const [user,        setUser]        = useState(null)
  const [patients,    setPatients]    = useState([])
  const [selPt,       setSelPt]       = useState(ptParam)
  const [ptData,      setPtData]      = useState(null)
  const [activeSystem,setActiveSystem]= useState(null)
  const [selOrgan,    setSelOrgan]    = useState(null)
  const [viewMode,    setViewMode]    = useState('anatomy')
  const [searchQ,     setSearchQ]     = useState('')
  const [expanded,    setExpanded]    = useState({})
  const [conditions,  setConditions]  = useState([])
  const [loading,     setLoading]     = useState(true)

  const canvasRef   = useRef(null)
  const cleanupRef  = useRef(null)
  const sceneParams = useRef({})

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user: u } }) => {
      if (!u) { router.push('/apps/medical/login'); return }
      const { data: ud } = await supabase.from('users').select('role,tenant_id,app_type').eq('id',u.id).maybeSingle()
      if (!ud||ud.app_type!=='medical') { router.push('/apps/medical/login'); return }
      setUser({ ...u, ...ud })
      const { data: pts } = await supabase.from('med_patients')
        .select('id,first_name,last_name,chronic_cond,allergies').order('last_name',{ ascending:true }).limit(100)
      setPatients(pts||[])
      setLoading(false)
    })
  }, [router])

  useEffect(() => {
    if (!selPt||!patients.length) { setPtData(null); setConditions([]); return }
    const pt = patients.find(p=>p.id===selPt)
    setPtData(pt)
    setConditions([...(pt?.chronic_cond||[]), ...(pt?.allergies||[]).map(a=>a.name)])
  }, [selPt, patients])

  // Re-render 3D quand les paramètres changent
  useEffect(() => {
    if (!canvasRef.current || loading) return

    // Nettoyer la scène précédente
    if (cleanupRef.current) { cleanupRef.current(); cleanupRef.current = null }

    init3DScene(canvasRef.current, {
      activeSystem,
      selectedOrgan: selOrgan,
      patientConditions: conditions,
      viewMode,
      onOrganClick: setSelOrgan,
    }).then(cleanup => { cleanupRef.current = cleanup })

    return () => { if (cleanupRef.current) { cleanupRef.current(); cleanupRef.current = null } }
  }, [activeSystem, selOrgan, conditions, viewMode, loading])

  function sysHealth(sysName) {
    const sys = ANATOMY[sysName]
    const aff = sys.organs.filter(o => o.diseases.some(d => conditions.some(c => d.toLowerCase().includes(c.toLowerCase())||c.toLowerCase().includes(d.toLowerCase())))).length
    return { aff, total: sys.organs.length, pct: Math.max(0, 100 - (aff/sys.organs.length)*100) }
  }

  const filteredOrgans = searchQ
    ? Object.entries(ANATOMY).flatMap(([sys,data]) =>
        data.organs.filter(o => o.name.toLowerCase().includes(searchQ.toLowerCase())||o.diseases.some(d=>d.toLowerCase().includes(searchQ.toLowerCase())))
          .map(o=>({...o,system:sys,sysColor:data.color}))
      )
    : []

  if (loading) return (
    <div style={{background:'#030810',height:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{color:'rgba(56,189,248,.5)',fontFamily:'monospace',fontSize:'.85rem'}}>Chargement Three.js…</div>
    </div>
  )

  return (
    <>
      <style>{CSS}</style>
      <div className="a3-root">
        <div className="a3-bar">
          <button className="a3-back" onClick={()=>router.push('/apps/medical/doctor')}><ArrowLeft size={14}/> Retour</button>
          <span className="a3-h1">Bibliothèque Anatomique 3D</span>
          <span style={{fontSize:'.68rem',color:'rgba(56,189,248,.5)',fontWeight:700}}>Three.js · Drag pour tourner · Scroll pour zoomer</span>
        </div>

        <div className="a3-body">
          {/* LEFT */}
          <div className="a3-left">
            <div className="a3-sr">
              <div className="a3-sr-inner">
                <Search size={11} color="rgba(255,255,255,.25)"/>
                <input placeholder="Organe, maladie…" value={searchQ} onChange={e=>setSearchQ(e.target.value)}/>
              </div>
            </div>
            <div className="a3-cats">
              {searchQ ? filteredOrgans.map(o=>(
                <div key={o.id} className={`a3-item ${selOrgan?.id===o.id?'sel':''}`}
                  onClick={()=>{setSelOrgan(o);setActiveSystem(o.system);setSearchQ('')}}>
                  <div className="a3-item-dot" style={{background:o.sysColor}}/>
                  <span className="a3-item-name">{o.name}</span>
                </div>
              )) : Object.entries(ANATOMY).map(([sysName,sysData])=>{
                const isOpen = expanded[sysName]!==false
                const Icon   = [Brain,Heart,Activity,Brain,Activity,Activity,Bone][Object.keys(ANATOMY).indexOf(sysName)%7]
                const health = ptData ? sysHealth(sysName) : null
                return (
                  <div key={sysName}>
                    <div className="a3-cat-hdr"
                      onClick={()=>{
                        setActiveSystem(activeSystem===sysName?null:sysName)
                        setExpanded(e=>({...e,[sysName]:!isOpen}))
                        setSelOrgan(null)
                      }}>
                      <div className="a3-cat-ic" style={{background:sysData.color+'22'}}>
                        <Icon size={10} color={sysData.color}/>
                      </div>
                      <span style={{flex:1,color:activeSystem===sysName?sysData.color:undefined}}>{sysName}</span>
                      {health?.aff>0 && <span style={{fontSize:'.58rem',color:'#F87171',fontWeight:700}}>⚠{health.aff}</span>}
                      {isOpen?<ChevronDown size={9}/>:<ChevronRight size={9}/>}
                    </div>
                    {isOpen && sysData.organs.map(org=>{
                      const isAff = conditions.some(c=>org.diseases.some(d=>d.toLowerCase().includes(c.toLowerCase())||c.toLowerCase().includes(d.toLowerCase())))
                      return (
                        <div key={org.id} className={`a3-item ${selOrgan?.id===org.id?'sel':''}`}
                          onClick={()=>{setSelOrgan(org);setActiveSystem(sysName)}}>
                          <div className="a3-item-dot" style={{background:isAff?'#F87171':sysData.color+'70'}}/>
                          <span className="a3-item-name">{org.name}</span>
                          {isAff&&<AlertTriangle size={8} color="#F87171"/>}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>

          {/* CENTER — Three.js canvas */}
          <div className="a3-center">
            <canvas ref={canvasRef} style={{width:'100%',height:'100%',cursor:'grab'}}/>

            {/* Modes */}
            <div className="a3-modes">
              {[['anatomy','Anatomie'],['skeleton','Squelette'],['wireframe','Filaire']].map(([m,l])=>(
                <button key={m} className={`a3-mode ${viewMode===m?'active':''}`} onClick={()=>{setViewMode(m);setSelOrgan(null)}}>
                  {l}
                </button>
              ))}
            </div>

            {/* Info card organe */}
            {selOrgan && (
              <div className="a3-info">
                <div className="a3-info-card">
                  <div className="a3-info-title">{selOrgan.name}</div>
                  <div className="a3-info-desc">{selOrgan.desc}</div>
                  <div className="a3-info-body">
                    <div style={{fontSize:'.62rem',color:'rgba(255,255,255,.25)',fontWeight:700,letterSpacing:'.06em',textTransform:'uppercase',marginBottom:5}}>Pathologies</div>
                    {selOrgan.diseases.map(d=>{
                      const isP = conditions.some(c=>d.toLowerCase().includes(c.toLowerCase())||c.toLowerCase().includes(d.toLowerCase()))
                      return (
                        <span key={d} className={`a3-dtag ${isP?getDiseaseSeverity(d):''}`}
                          style={!isP?{background:'rgba(255,255,255,.04)',color:'rgba(255,255,255,.3)',border:'1px solid rgba(255,255,255,.07)'}:{}}>
                          {isP&&'● '}{d}
                        </span>
                      )
                    })}
                    {ptData && conditions.some(c=>selOrgan.diseases.some(d=>d.toLowerCase().includes(c.toLowerCase())||c.toLowerCase().includes(d.toLowerCase()))) && (
                      <div className="a3-affected-banner">
                        ⚠ Affecté chez {ptData.first_name} {ptData.last_name}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Patient selector */}
            <div className="a3-pt-bar">
              <User size={12} color="rgba(56,189,248,.5)"/>
              <span className="a3-pt-label">Simuler :</span>
              <select className="a3-pt-sel" value={selPt} onChange={e=>setSelPt(e.target.value)}>
                <option value="">— Corps générique —</option>
                {patients.map(p=>(
                  <option key={p.id} value={p.id}>
                    {p.first_name} {p.last_name}
                    {(p.chronic_cond||[]).length>0?` (${(p.chronic_cond||[]).length})`:''}
                  </option>
                ))}
              </select>
              {conditions.length>0&&<span className="a3-affected-pill">{conditions.length} conditions</span>}
            </div>

            {/* Controls */}
            <div className="a3-ctrl-bar">
              <button className="a3-ctrl" onClick={()=>{setActiveSystem(null);setSelOrgan(null)}} title="Vue globale">
                <RotateCcw size={14}/>
              </button>
              {Object.entries(ANATOMY).slice(0,5).map(([sys,data])=>(
                <button key={sys} className={`a3-ctrl ${activeSystem===sys?'active':''}`}
                  onClick={()=>setActiveSystem(activeSystem===sys?null:sys)}
                  style={{fontSize:'.6rem',fontWeight:700,color:activeSystem===sys?data.color:undefined}}>
                  {sys.slice(0,3)}
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT */}
          <div className="a3-right">
            <div className="a3-right-title">{ptData?`${ptData.first_name} ${ptData.last_name}`:'Systèmes'}</div>
            {ptData&&conditions.length>0&&(
              <div style={{padding:'7px 9px',background:'rgba(239,68,68,.06)',borderRadius:9,border:'1px solid rgba(239,68,68,.12)',marginBottom:8}}>
                <div style={{fontSize:'.62rem',fontWeight:700,color:'#F87171',marginBottom:3}}>Conditions actives</div>
                {conditions.map(c=><div key={c} style={{fontSize:'.67rem',color:'rgba(255,255,255,.4)',padding:'1px 0'}}>· {c}</div>)}
              </div>
            )}
            {Object.entries(ANATOMY).map(([sysName,sysData])=>{
              const health = ptData ? sysHealth(sysName) : {aff:0,pct:100}
              return (
                <div key={sysName} className={`a3-sys-card ${health.aff>0?'aff':''}`}
                  onClick={()=>setActiveSystem(activeSystem===sysName?null:sysName)}>
                  <div className="a3-sys-name">
                    <div style={{width:7,height:7,borderRadius:'50%',background:sysData.color,flexShrink:0}}/>
                    {sysName}
                    {health.aff>0&&<AlertTriangle size={9} color="#F87171"/>}
                  </div>
                  <div className={`a3-sys-sub ${health.aff>0?'alert':''}`}>
                    {health.aff>0?`${health.aff} organe(s) affecté(s)`:`${sysData.organs.length} structures`}
                  </div>
                  {ptData&&(
                    <div className="a3-bar2">
                      <div className="a3-bar2-fill"
                        style={{
                          width:health.pct+'%',
                          background:health.aff>0
                            ?'linear-gradient(90deg,#F87171,#FB923C)'
                            :`linear-gradient(90deg,${sysData.color}60,${sysData.color})`,
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
      <div style={{background:'#030810',height:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}>
        <div style={{color:'rgba(56,189,248,.5)',fontFamily:'monospace',fontSize:'.85rem'}}>Three.js loading…</div>
      </div>
    }>
      <AnatomieInner/>
    </Suspense>
  )
}
