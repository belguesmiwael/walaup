'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Brain, Stethoscope, Users, TrendingUp,
  Send, Loader, Copy, CheckCircle2, Upload, X,
  RefreshCw, AlertTriangle, Activity, BarChart2,
  FileText, Image, ChevronRight, Zap
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

const GROQ_URL   = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'llama-3.3-70b-versatile'
const GROQ_KEY   = process.env.NEXT_PUBLIC_GROQ_API_KEY || ''

const SYSTEM = `Tu es le Dr IA de MediLink OS, un assistant médical expert intégré dans un logiciel médical tunisien.
Tu as accès aux dossiers complets des patients et tu peux :
- Analyser en profondeur chaque dossier patient (antécédents, allergies, consultations, traitements)
- Poser des diagnostics différentiels précis avec arguments pour/contre
- Proposer des conclusions cliniques et des plans de traitement
- Détecter des patterns et risques à partir des données
- Analyser l'ensemble de la population de patients pour anticiper des tendances épidémiologiques
- Générer des alertes préventives basées sur les données agrégées

Règles :
- Répondre TOUJOURS en français
- Être précis, structuré, professionnel comme un médecin senior
- Utiliser les données fournies pour personnaliser chaque réponse
- Ne jamais inventer des données — baser sur ce qui est fourni
- Indiquer le niveau de confiance de tes analyses (élevé/modéré/faible)
- Format : titres en gras, listes structurées, conclusions claires`

async function callGroq(messages, onChunk) {
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      max_tokens:  3000,
      temperature: 0.2,
      stream:      true,
    }),
  })
  if (!res.ok) throw new Error(`Groq error ${res.status}`)
  const reader  = res.body.getReader()
  const decoder = new TextDecoder()
  let full = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    for (const line of decoder.decode(value).split('\n')) {
      if (!line.startsWith('data: ')) continue
      const d = line.slice(6)
      if (d === '[DONE]') continue
      try {
        const tok = JSON.parse(d).choices?.[0]?.delta?.content || ''
        if (tok) { full += tok; onChunk?.(full) }
      } catch {}
    }
  }
  return full
}

// Formater un patient complet en texte pour le prompt
function formatPatient(pt, consultations = []) {
  const age = pt.birth_date
    ? Math.floor((Date.now() - new Date(pt.birth_date)) / (1000*60*60*24*365.25))
    : null
  const allergies    = (pt.allergies    || []).map(a => `${a.name} (${a.severity})`).join(', ') || 'Aucune'
  const chronicCond  = (pt.chronic_cond || []).join(', ') || 'Aucune'
  const currentMeds  = (pt.current_meds || []).join(', ') || 'Aucun'
  const consultText  = consultations.length > 0
    ? consultations.map((c, i) =>
        `  ${i+1}. [${new Date(c.created_at).toLocaleDateString('fr-TN')}] Motif: ${c.motif||'?'} | Diagnostic: ${c.diagnostic||'?'} | Traitement: ${c.traitement||'?'}`
      ).join('\n')
    : '  Aucune consultation enregistrée'

  return `
PATIENT: ${pt.first_name} ${pt.last_name}
  - Âge: ${age ? age + ' ans' : 'inconnu'} | Sexe: ${pt.gender || 'inconnu'} | Groupe sanguin: ${pt.blood_type || 'inconnu'}
  - Téléphone: ${pt.phone || 'N/A'} | Ville: ${pt.city || 'N/A'}
  - Allergies: ${allergies}
  - Conditions chroniques: ${chronicCond}
  - Médicaments en cours: ${currentMeds}
  - Dernière visite: ${pt.last_visit ? new Date(pt.last_visit).toLocaleDateString('fr-TN') : 'Jamais'}
  - Consultations récentes:
${consultText}`
}

// Formater tous les patients pour analyse collective
function formatAllPatients(patients) {
  const total        = patients.length
  const avgAge       = patients.filter(p => p.birth_date)
    .map(p => Math.floor((Date.now() - new Date(p.birth_date)) / (1000*60*60*24*365.25)))
    .reduce((a, b) => a + b, 0) / (patients.filter(p => p.birth_date).length || 1)

  const allChronicConditions = {}
  const allAllergies = {}
  patients.forEach(p => {
    ;(p.chronic_cond || []).forEach(c => { allChronicConditions[c] = (allChronicConditions[c]||0)+1 })
    ;(p.allergies    || []).forEach(a => { allAllergies[a.name] = (allAllergies[a.name]||0)+1 })
  })

  const topConditions = Object.entries(allChronicConditions)
    .sort(([,a],[,b]) => b-a).slice(0,10)
    .map(([k,v]) => `${k}: ${v} patients (${Math.round(v/total*100)}%)`).join(', ')
  const topAllergies = Object.entries(allAllergies)
    .sort(([,a],[,b]) => b-a).slice(0,5)
    .map(([k,v]) => `${k}: ${v} patients`).join(', ')

  const genderStats = {
    homme: patients.filter(p=>p.gender==='homme').length,
    femme: patients.filter(p=>p.gender==='femme').length,
  }

  return `
POPULATION MÉDICALE DU CABINET
================================
Total patients: ${total}
Âge moyen: ${Math.round(avgAge)} ans
Répartition: ${genderStats.homme} hommes, ${genderStats.femme} femmes

CONDITIONS CHRONIQUES (prévalence):
${topConditions || 'Données insuffisantes'}

ALLERGIES (fréquence):
${topAllergies || 'Données insuffisantes'}

DÉTAIL PAR PATIENT:
${patients.slice(0, 20).map(p => {
  const age = p.birth_date ? Math.floor((Date.now()-new Date(p.birth_date))/(1000*60*60*24*365.25)) : '?'
  return `- ${p.first_name} ${p.last_name}, ${age}ans, ${(p.chronic_cond||[]).join('/')||'RAS'}, dernière visite: ${p.last_visit?new Date(p.last_visit).toLocaleDateString('fr-TN'):'jamais'}`
}).join('\n')}
${patients.length > 20 ? `... et ${patients.length-20} autres patients` : ''}`
}

const CSS = `
  .ai-root { min-height:100vh; background:var(--bg-base); padding-bottom:40px; }
  .ai-bar { position:sticky; top:0; z-index:100; height:56px; display:flex; align-items:center;
    padding:0 20px; gap:12px; background:rgba(8,11,20,.96);
    border-bottom:1px solid var(--border); backdrop-filter:blur(20px); }
  .ai-back { display:flex; align-items:center; gap:6px; color:var(--tx-2); font-size:.85rem;
    font-weight:600; cursor:pointer; background:none; border:none; padding:0; transition:color .15s; }
  .ai-back:hover { color:#A78BFA; }
  .ai-h1 { font-family:var(--font-display); font-weight:700; font-size:.95rem; color:var(--tx); flex:1; }
  .ai-badge { padding:3px 10px; border-radius:20px; font-size:.68rem; font-weight:700;
    background:linear-gradient(135deg,rgba(99,102,241,.2),rgba(139,92,246,.2));
    color:#A78BFA; border:1px solid rgba(99,102,241,.3); }

  .ai-content { max-width:960px; margin:0 auto; padding:20px; }

  /* ── Tools ── */
  .ai-tools { display:grid; grid-template-columns:repeat(auto-fit,minmax(190px,1fr));
    gap:10px; margin-bottom:24px; }
  .ai-tool { display:flex; flex-direction:column; gap:9px; padding:16px;
    border-radius:14px; cursor:pointer; transition:all .2s;
    border:1px solid var(--border); background:var(--bg-surface); text-align:left; }
  .ai-tool:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(0,0,0,.2); }
  .ai-tool.active { border-color:rgba(99,102,241,.5); background:rgba(99,102,241,.06); }
  .ai-tool-icon { width:40px; height:40px; border-radius:11px;
    display:flex; align-items:center; justify-content:center; flex-shrink:0; }
  .ai-tool-icon.v { background:rgba(99,102,241,.15); color:#A78BFA; }
  .ai-tool-icon.b { background:rgba(14,165,233,.12);  color:#38BDF8; }
  .ai-tool-icon.g { background:rgba(16,185,129,.12);  color:#34D399; }
  .ai-tool-icon.o { background:rgba(245,158,11,.12);  color:#FCD34D; }
  .ai-tool-icon.r { background:rgba(239,68,68,.12);   color:#F87171; }
  .ai-tool-name { font-weight:700; font-size:.85rem; color:var(--tx); }
  .ai-tool-desc { font-size:.7rem; color:var(--tx-3); line-height:1.35; }

  /* ── Panel ── */
  .ai-panel { background:var(--bg-surface); border:1px solid var(--border);
    border-radius:14px; overflow:hidden; margin-bottom:16px; }
  .ai-ph { padding:14px 18px; border-bottom:1px solid var(--border);
    display:flex; align-items:center; gap:10px; }
  .ai-ph-title { font-weight:700; font-size:.88rem; color:var(--tx); flex:1; }
  .ai-pb { padding:18px; }

  /* ── Form ── */
  .ai-sel { width:100%; padding:9px 12px; border-radius:10px;
    border:1px solid var(--border); background:var(--bg-base);
    color:var(--tx); font-size:.875rem; outline:none; cursor:pointer; margin-bottom:12px; }
  .ai-sel:focus { border-color:#6366F1; }
  .ai-ta { width:100%; padding:10px 13px; border-radius:10px;
    border:1px solid var(--border); background:var(--bg-base);
    color:var(--tx); font-size:.875rem; outline:none; resize:vertical;
    min-height:80px; font-family:var(--font-body); box-sizing:border-box; }
  .ai-ta:focus { border-color:#6366F1; }
  .ai-label { display:block; font-size:.72rem; font-weight:600;
    color:var(--tx-2); margin-bottom:5px; letter-spacing:.03em; }

  /* ── Generate btn ── */
  .ai-btn { display:flex; align-items:center; gap:8px; padding:10px 20px;
    border-radius:11px; border:none; cursor:pointer; font-size:.85rem; font-weight:700;
    transition:all .2s; background:linear-gradient(135deg,#6366F1,#8B5CF6);
    color:white; box-shadow:0 4px 14px rgba(99,102,241,.3); margin-top:12px; }
  .ai-btn:hover { opacity:.9; transform:translateY(-1px); }
  .ai-btn:disabled { opacity:.45; cursor:not-allowed; transform:none; }
  .ai-btn.sm { padding:7px 14px; font-size:.78rem; margin-top:0; }

  /* ── Result ── */
  .ai-res-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; margin-top:18px; }
  .ai-res-label { font-size:.72rem; font-weight:700; letter-spacing:.06em;
    text-transform:uppercase; color:#A78BFA; display:flex; align-items:center; gap:5px; }
  .ai-copy { display:flex; align-items:center; gap:4px; padding:4px 10px;
    border-radius:8px; border:1px solid var(--border); background:transparent;
    color:var(--tx-2); font-size:.7rem; font-weight:600; cursor:pointer; }
  .ai-copy:hover { color:var(--tx); background:var(--bg-hover); }
  .ai-res-box { background:var(--bg-base); border:1px solid rgba(99,102,241,.2);
    border-radius:12px; padding:18px; font-size:.875rem; line-height:1.75;
    color:var(--tx); white-space:pre-wrap; font-family:var(--font-body);
    max-height:520px; overflow-y:auto; scrollbar-width:thin; }

  /* ── Chat ── */
  .ai-chat-wrap { display:flex; flex-direction:column; gap:8px;
    max-height:440px; overflow-y:auto; margin-bottom:12px; padding:2px;
    scrollbar-width:thin; scrollbar-color:var(--border) transparent; }
  .ai-msg { padding:11px 14px; border-radius:12px; font-size:.875rem;
    line-height:1.55; max-width:88%; }
  .ai-msg.user { background:rgba(99,102,241,.12); color:var(--tx);
    border:1px solid rgba(99,102,241,.2); align-self:flex-end; }
  .ai-msg.ai   { background:var(--bg-base); color:var(--tx);
    border:1px solid var(--border); align-self:flex-start; white-space:pre-wrap; }
  .ai-msg.loading { background:var(--bg-base); border:1px solid var(--border);
    align-self:flex-start; display:flex; align-items:center; gap:8px; color:var(--tx-3); }
  .ai-chat-input { display:flex; gap:8px; }
  .ai-chat-ta { flex:1; padding:10px 13px; border-radius:10px;
    border:1px solid var(--border); background:var(--bg-base); color:var(--tx);
    font-size:.875rem; outline:none; resize:none; font-family:var(--font-body);
    transition:border-color .15s; }
  .ai-chat-ta:focus { border-color:#6366F1; }
  .ai-send { width:40px; height:40px; border-radius:10px; flex-shrink:0;
    background:linear-gradient(135deg,#6366F1,#8B5CF6); border:none; color:white;
    display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all .18s; }
  .ai-send:hover { opacity:.9; transform:scale(1.05); }
  .ai-send:disabled { opacity:.35; cursor:not-allowed; transform:none; }

  /* ── Patient quick chips ── */
  .ai-pt-chips { display:flex; flex-wrap:wrap; gap:6px; margin-bottom:12px; }
  .ai-pt-chip { padding:4px 12px; border-radius:20px; border:1px solid var(--border);
    background:var(--bg-base); color:var(--tx-2); font-size:.72rem; font-weight:600;
    cursor:pointer; transition:all .15s; }
  .ai-pt-chip:hover { border-color:rgba(99,102,241,.4); color:#A78BFA; }
  .ai-pt-chip.active { border-color:rgba(99,102,241,.5); background:rgba(99,102,241,.1); color:#A78BFA; }

  /* ── Stats cards ── */
  .ai-stats { display:grid; grid-template-columns:repeat(auto-fit,minmax(140px,1fr)); gap:10px; margin-bottom:16px; }
  .ai-stat { background:var(--bg-base); border:1px solid var(--border); border-radius:11px;
    padding:12px; text-align:center; }
  .ai-stat-val { font-family:var(--font-display); font-size:1.6rem; font-weight:800; color:var(--tx); }
  .ai-stat-label { font-size:.68rem; color:var(--tx-3); margin-top:3px; font-weight:600;
    letter-spacing:.04em; text-transform:uppercase; }

  /* ── Alert cards ── */
  .ai-alert { display:flex; align-items:flex-start; gap:10px; padding:13px 15px;
    border-radius:11px; margin-bottom:8px; }
  .ai-alert.high   { background:rgba(239,68,68,.08);   border:1px solid rgba(239,68,68,.25); }
  .ai-alert.medium { background:rgba(245,158,11,.08);  border:1px solid rgba(245,158,11,.25); }
  .ai-alert.low    { background:rgba(14,165,233,.06);  border:1px solid rgba(14,165,233,.2); }
  .ai-alert-title  { font-weight:700; font-size:.83rem; color:var(--tx); margin-bottom:2px; }
  .ai-alert-desc   { font-size:.73rem; color:var(--tx-3); line-height:1.4; }

  @keyframes aiSpin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes aiPulse { 0%,100%{opacity:1}50%{opacity:.4} }
`

const TOOLS = [
  { id:'patient',     icon:Brain,        cls:'v', name:'Analyse patient',      desc:'Dossier complet + conclusions + plan de suivi' },
  { id:'collective',  icon:Users,        cls:'b', name:'Analyse collective',   desc:'Tous les patients — tendances + épidémiologie' },
  { id:'diagnostic',  icon:Stethoscope,  cls:'g', name:'Diagnostic IA',       desc:'Symptômes → différentiel + conclusions cliniques' },
  { id:'risques',     icon:AlertTriangle,cls:'r', name:'Alertes & Risques',   desc:'Patients à risque + actions préventives' },
  { id:'image',       icon:Image,        cls:'o', name:'Analyse d\'image',     desc:'Interprétation imagerie médicale' },
  { id:'chat',        icon:Zap,          cls:'v', name:'Dr IA libre',          desc:'Questions ouvertes — accès à tous les dossiers' },
]

export default function AIEngine() {
  const router = useRouter()
  const [user,       setUser]       = useState(null)
  const [tool,       setTool]       = useState('patient')
  const [patients,   setPatients]   = useState([])
  const [allData,    setAllData]    = useState({}) // { [patientId]: { patient, consultations } }
  const [loadingAll, setLoadingAll] = useState(false)
  const [selectedPt, setSelectedPt] = useState('')
  const [result,     setResult]     = useState('')
  const [loading,    setLoading]    = useState(false)
  const [copied,     setCopied]     = useState(false)
  const [symptoms,   setSymptoms]   = useState('')
  const [question,   setQuestion]   = useState('')
  const [imgFile,    setImgFile]    = useState(null)
  const [imgPreview, setImgPreview] = useState('')
  const [imgType,    setImgType]    = useState('radiologie')
  const [chatMsgs,   setChatMsgs]   = useState([])
  const [chatInput,  setChatInput]  = useState('')
  const [chatLoading,setChatLoading]= useState(false)
  const [stats,      setStats]      = useState(null)
  const fileRef    = useRef(null)
  const chatEndRef = useRef(null)

  /* ── Auth + chargement patients ── */
  useEffect(() => {
    async function init() {
      const { data: { user: u } } = await supabase.auth.getUser()
      if (!u) { router.push('/apps/medical/login'); return }
      const { data: ud } = await supabase.from('users')
        .select('role, tenant_id, app_type, full_name')
        .eq('id', u.id).maybeSingle()
      if (!ud || ud.role !== 'tenant_admin') { router.push('/apps/medical/login'); return }
      setUser({ ...u, ...ud })
      await loadAllPatients(ud.tenant_id)
    }
    init()
  }, [router])

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior:'smooth' }) }, [chatMsgs])

  /* ── Charger TOUS les patients avec TOUTES les consultations ── */
  const loadAllPatients = useCallback(async (tenantId) => {
    setLoadingAll(true)
    try {
      const { data: pts } = await supabase.from('med_patients')
        .select('*').order('last_name', { ascending: true }).limit(200)

      const { data: consults } = await supabase.from('med_consultations')
        .select('*').order('created_at', { ascending: false })

      const { data: appts } = await supabase.from('med_appointments')
        .select('patient_id, scheduled_at, status, type')
        .order('scheduled_at', { ascending: false })

      const dataMap = {}
      ;(pts||[]).forEach(p => {
        dataMap[p.id] = {
          patient:       p,
          consultations: (consults||[]).filter(c => c.patient_id === p.id),
          appointments:  (appts||[]).filter(a => a.patient_id === p.id),
        }
      })
      setAllData(dataMap)
      setPatients(pts || [])

      // Calculer les stats
      const total = (pts||[]).length
      const withChronic = (pts||[]).filter(p => (p.chronic_cond||[]).length > 0).length
      const critAllergy = (pts||[]).filter(p => (p.allergies||[]).some(a=>a.severity==='CRITIQUE')).length
      setStats({ total, withChronic, critAllergy, totalConsults: (consults||[]).length })
    } catch (e) { console.error(e) }
    setLoadingAll(false)
  }, [])

  /* ── Helpers ── */
  function showResult(txt) { setResult(txt) }
  function copyResult() {
    navigator.clipboard.writeText(result)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  /* ── ANALYSE PATIENT ── */
  async function analyzePatient() {
    if (!selectedPt) return
    setLoading(true); setResult('')
    try {
      const d   = allData[selectedPt]
      if (!d) throw new Error('Données patient non trouvées')
      const txt = formatPatient(d.patient, d.consultations)

      const prompt = `Analyse COMPLÈTE et APPROFONDIE du dossier suivant. Fournis des conclusions médicales concrètes.
${txt}

Génère :
**1. RÉSUMÉ CLINIQUE COMPLET**
Synthèse du profil médical, évolution, points saillants

**2. ANALYSE DES RISQUES**
- Score de risque cardiovasculaire (%)
- Score de risque diabétique (%)
- Score de risque global (Faible/Modéré/Élevé/Critique)
- Justification détaillée

**3. INTERACTIONS MÉDICAMENTEUSES**
Vérifier les médicaments actuels — alertes si incompatibilités

**4. DIAGNOSTIC DIFFÉRENTIEL ACTUEL**
Basé sur l'historique des consultations — conditions probables non encore diagnostiquées

**5. CONCLUSIONS CLINIQUES**
Ton évaluation professionnelle — sois direct et précis

**6. PLAN DE SUIVI RECOMMANDÉ**
- Examens complémentaires à prescrire
- Fréquence de suivi
- Vaccinations à vérifier
- Dépistages prioritaires

**7. ALERTES PRÉVENTIVES**
Points nécessitant une attention immédiate

Niveau de confiance de l'analyse: [élevé/modéré/faible] — justification`

      await callGroq(
        [{ role:'system', content:SYSTEM }, { role:'user', content:prompt }],
        txt => showResult(txt)
      )
    } catch (e) { showResult('Erreur: ' + e.message) }
    setLoading(false)
  }

  /* ── ANALYSE COLLECTIVE ── */
  async function analyzeCollective() {
    setLoading(true); setResult('')
    try {
      const txt = formatAllPatients(patients)
      const prompt = `Analyse ÉPIDÉMIOLOGIQUE et COLLECTIVE de la patientèle suivante.
${txt}

Génère :
**1. PROFIL ÉPIDÉMIOLOGIQUE DE LA PATIENTÈLE**
- Répartition démographique et pathologique
- Comorbidités les plus fréquentes
- Profil de risque global

**2. TENDANCES ET PATTERNS DÉTECTÉS**
- Évolution des maladies chroniques
- Corrélations entre conditions
- Saisonnalité probable des consultations

**3. RISQUES ÉPIDÉMIOLOGIQUES ANTICIPÉS**
- Maladies probables à anticiper sur les 6 prochains mois
- Patients à surveillance renforcée
- Alertes collectives (ex: cluster de HTA, diabète mal contrôlé)

**4. RECOMMANDATIONS POUR LE CABINET**
- Protocoles préventifs à mettre en place
- Campagnes de dépistage prioritaires
- Vaccinations à vérifier collectivement

**5. INDICATEURS DE PERFORMANCE DU CABINET**
- Taux de suivi des maladies chroniques
- Gaps dans la prise en charge détectés
- Actions d'amélioration recommandées

**6. TOP 5 PATIENTS PRIORITAIRES**
Patients nécessitant une attention clinique urgente (basé sur les données disponibles)

Sois direct — c'est un rapport médical professionnel pour un médecin généraliste.`

      await callGroq(
        [{ role:'system', content:SYSTEM }, { role:'user', content:prompt }],
        txt => showResult(txt)
      )
    } catch (e) { showResult('Erreur: ' + e.message) }
    setLoading(false)
  }

  /* ── DIAGNOSTIC ── */
  async function generateDiagnostic() {
    if (!symptoms.trim()) return
    setLoading(true); setResult('')
    try {
      let context = ''
      if (selectedPt && allData[selectedPt]) {
        context = formatPatient(allData[selectedPt].patient, allData[selectedPt].consultations)
      }

      const prompt = `${context ? 'CONTEXTE PATIENT:\n' + context + '\n\n' : ''}SYMPTÔMES PRÉSENTÉS: ${symptoms}

Génère un DIAGNOSTIC DIFFÉRENTIEL COMPLET ET STRUCTURÉ :

**1. DIAGNOSTICS RETENUS** (par ordre de probabilité décroissante)
Pour chaque diagnostic :
  - Probabilité estimée (%)
  - Arguments cliniques POUR
  - Arguments cliniques CONTRE
  - Examens pour confirmer/infirmer

**2. DIAGNOSTIC PROBABLE PRINCIPAL**
Conclusion directe avec justification

**3. DRAPEAUX ROUGES** (signes de gravité à surveiller)

**4. EXAMENS COMPLÉMENTAIRES URGENTS**
- Biologie: [liste précise]
- Imagerie: [si nécessaire]
- Spécialistes à consulter

**5. PRISE EN CHARGE INITIALE**
- Traitement symptomatique immédiat
- Médicaments suggérés (avec posologies)
- Durée de traitement estimée
- Critères d'hospitalisation

**6. SUIVI**
- Délai de réévaluation
- Critères d'amélioration attendus
- Plan B si échec thérapeutique

Niveau de confiance: [élevé/modéré/faible]`

      await callGroq(
        [{ role:'system', content:SYSTEM }, { role:'user', content:prompt }],
        txt => showResult(txt)
      )
    } catch (e) { showResult('Erreur: ' + e.message) }
    setLoading(false)
  }

  /* ── ALERTES RISQUES ── */
  async function generateAlerts() {
    setLoading(true); setResult('')
    try {
      const highRiskPts = patients.filter(p =>
        (p.allergies||[]).some(a=>a.severity==='CRITIQUE') ||
        (p.chronic_cond||[]).length >= 2 ||
        (allData[p.id]?.consultations||[]).length === 0
      )

      const txt = highRiskPts.map(p => formatPatient(p, allData[p.id]?.consultations||[])).join('\n---\n')

      const prompt = `Analyse ces patients à profil de risque et génère un rapport d'alertes médicales:
${txt || 'Aucun patient à risque identifié dans les données disponibles.'}

Génère :
**1. PATIENTS À RISQUE CRITIQUE** (action immédiate requise)
Pour chaque patient: nom, risque identifié, action recommandée, urgence

**2. PATIENTS À RISQUE MODÉRÉ** (surveillance renforcée)

**3. INTERACTIONS MÉDICAMENTEUSES DÉTECTÉES** (dans toute la patientèle)

**4. PATIENTS SANS SUIVI RÉCENT** (> 6 mois sans consultation)
Liste et recommandation de rappel

**5. PLAN D'ACTION PRIORITAIRE**
- Cette semaine
- Ce mois
- Dans les 3 mois

**6. PROTOCOLES PRÉVENTIFS RECOMMANDÉS**
Basés sur les pathologies dominantes de la patientèle`

      await callGroq(
        [{ role:'system', content:SYSTEM }, { role:'user', content:prompt }],
        txt => showResult(txt)
      )
    } catch (e) { showResult('Erreur: ' + e.message) }
    setLoading(false)
  }

  /* ── ANALYSE IMAGE ── */
  async function analyzeImage() {
    if (!imgFile) return
    setLoading(true); setResult('')
    try {
      let ptContext = ''
      if (selectedPt && allData[selectedPt]) {
        ptContext = '\nCONTEXTE PATIENT:\n' + formatPatient(allData[selectedPt].patient, allData[selectedPt].consultations)
      }

      const prompt = `Type d'imagerie: ${imgType}${ptContext}

Fournis une GRILLE D'ANALYSE SYSTÉMATIQUE complète pour ce type d'imagerie:

**1. PROTOCOLE D'INTERPRÉTATION** pour ${imgType}
Étapes de lecture systématique

**2. ÉLÉMENTS À ANALYSER OBLIGATOIREMENT**
- Structures normales à identifier
- Anomalies à rechercher activement
- Pièges et artefacts fréquents

**3. CRITÈRES DE NORMALITÉ**
Description détaillée d'une image normale

**4. ANOMALIES FRÉQUENTES ET LEUR SIGNIFICATION**
Top 10 des pathologies détectables + signes radiologiques

**5. CORRÉLATION CLINIQUE**
Comment intégrer ce type d'imagerie avec la clinique${selectedPt ? '\nPour ce patient spécifique, que rechercher en priorité ?' : ''}

**6. QUAND RÉFÉRER EN URGENCE**
Critères de gravité nécessitant un avis spécialisé immédiat

**7. COMPTE RENDU TYPE**
Structure d'un compte rendu pour ce type d'imagerie`

      await callGroq(
        [{ role:'system', content:SYSTEM }, { role:'user', content:prompt }],
        txt => showResult(txt)
      )
    } catch (e) { showResult('Erreur: ' + e.message) }
    setLoading(false)
  }

  /* ── CHAT LIBRE AVEC ACCÈS DOSSIERS ── */
  async function sendChat() {
    if (!chatInput.trim() || chatLoading) return
    const q = chatInput.trim()
    setChatInput('')
    setChatMessages(prev => [...prev, { role:'user', content:q }])
    setChatLoading(true)

    try {
      // Contexte : si le message mentionne un patient, inclure son dossier
      let extraContext = ''
      const mentionedPt = patients.find(p =>
        q.toLowerCase().includes(p.first_name.toLowerCase()) ||
        q.toLowerCase().includes(p.last_name.toLowerCase())
      )
      if (mentionedPt && allData[mentionedPt.id]) {
        extraContext = '\n\nDOSSIER PATIENT MENTIONNÉ:\n' +
          formatPatient(mentionedPt, allData[mentionedPt.id].consultations)
      }

      // Si "tous les patients" ou "patientèle" mentionnés
      if (q.toLowerCase().match(/tous|patientèle|cabinet|ensemble|population/)) {
        extraContext = '\n\nDONNÉES COMPLÈTES CABINET:\n' + formatAllPatients(patients)
      }

      const history = chatMessages.map(m => ({ role:m.role, content:m.content }))
      setChatMessages(prev => [...prev, { role:'assistant', content:'', loading:true }])

      await callGroq(
        [
          { role:'system', content: SYSTEM + (extraContext ? '\n\nCONTEXTE DISPONIBLE:' + extraContext : '') },
          ...history,
          { role:'user', content:q }
        ],
        txt => {
          setChatMessages(prev => prev.map((m,i) =>
            i===prev.length-1 ? { role:'assistant', content:txt, loading:false } : m
          ))
        }
      )
    } catch (e) {
      setChatMessages(prev => prev.map((m,i) =>
        i===prev.length-1 ? { role:'assistant', content:'Erreur: '+e.message, loading:false } : m
      ))
    }
    setChatLoading(false)
  }

  /* ── RENDER ── */
  return (
    <>
      <style>{CSS}</style>
      <div className="ai-root">
        <div className="ai-bar">
          <button className="ai-back" onClick={() => router.push('/apps/medical/doctor')}>
            <ArrowLeft size={15}/> Retour
          </button>
          <span className="ai-h1">Intelligence Artificielle Médicale</span>
          <span className="ai-badge">
            {loadingAll ? '⏳ Chargement…' : `✅ ${patients.length} patients chargés`}
          </span>
        </div>

        <div className="ai-content">

          {/* Stats rapides */}
          {stats && (
            <div className="ai-stats" style={{ marginBottom:20 }}>
              <div className="ai-stat">
                <div className="ai-stat-val">{stats.total}</div>
                <div className="ai-stat-label">Patients</div>
              </div>
              <div className="ai-stat">
                <div className="ai-stat-val">{stats.withChronic}</div>
                <div className="ai-stat-label">Maladies chroniques</div>
              </div>
              <div className="ai-stat">
                <div className="ai-stat-val" style={{ color:'var(--red)' }}>{stats.critAllergy}</div>
                <div className="ai-stat-label">Allergies critiques</div>
              </div>
              <div className="ai-stat">
                <div className="ai-stat-val">{stats.totalConsults}</div>
                <div className="ai-stat-label">Consultations</div>
              </div>
            </div>
          )}

          {/* Tool selector */}
          <div className="ai-tools">
            {TOOLS.map(t => (
              <button key={t.id} className={`ai-tool ${tool===t.id?'active':''}`}
                onClick={() => { setTool(t.id); setResult('') }}>
                <div className={`ai-tool-icon ${t.cls}`}><t.icon size={18}/></div>
                <div className="ai-tool-name">{t.name}</div>
                <div className="ai-tool-desc">{t.desc}</div>
              </button>
            ))}
          </div>

          {/* ══ ANALYSE PATIENT ══ */}
          {tool === 'patient' && (
            <div className="ai-panel">
              <div className="ai-ph">
                <div className="ai-tool-icon v" style={{ width:30,height:30 }}><Brain size={14}/></div>
                <span className="ai-ph-title">Analyse complète d'un patient</span>
                <button className="ai-btn sm" onClick={analyzePatient} disabled={loading||!selectedPt}>
                  {loading ? <Loader size={13} style={{ animation:'aiSpin 1s linear infinite' }}/> : <Zap size={13}/>}
                  {loading ? 'Analyse…' : 'Analyser'}
                </button>
              </div>
              <div className="ai-pb">
                <label className="ai-label">Sélectionner le patient</label>
                <select className="ai-sel" value={selectedPt}
                  onChange={e => setSelectedPt(e.target.value)}>
                  <option value="">— Choisir un patient —</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.first_name} {p.last_name}
                      {(p.chronic_cond||[]).length > 0 ? ` — ${(p.chronic_cond||[]).join(', ')}` : ''}
                    </option>
                  ))}
                </select>

                {/* Chips patients rapides */}
                {patients.length > 0 && (
                  <div className="ai-pt-chips">
                    {patients.slice(0, 8).map(p => (
                      <span key={p.id} className={`ai-pt-chip ${selectedPt===p.id?'active':''}`}
                        onClick={() => setSelectedPt(p.id)}>
                        {p.first_name} {p.last_name}
                      </span>
                    ))}
                  </div>
                )}

                {selectedPt && allData[selectedPt] && (
                  <div style={{ padding:'10px 14px', background:'var(--bg-base)', borderRadius:10,
                    border:'1px solid rgba(99,102,241,.2)', fontSize:'.78rem', color:'var(--tx-2)', marginBottom:4 }}>
                    <strong style={{ color:'#A78BFA' }}>Données disponibles:</strong>{' '}
                    {allData[selectedPt].consultations.length} consultation(s),{' '}
                    {(allData[selectedPt].patient.chronic_cond||[]).length} pathologie(s) chronique(s),{' '}
                    {(allData[selectedPt].patient.allergies||[]).length} allergie(s)
                  </div>
                )}

                {result && (
                  <div className="ai-result">
                    <div className="ai-res-header">
                      <div className="ai-res-label"><CheckCircle2 size={12}/>Analyse IA complète</div>
                      <button className="ai-copy" onClick={copyResult}>
                        <Copy size={11}/>{copied?'Copié !':'Copier'}
                      </button>
                    </div>
                    <div className="ai-res-box">{result}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══ ANALYSE COLLECTIVE ══ */}
          {tool === 'collective' && (
            <div className="ai-panel">
              <div className="ai-ph">
                <div className="ai-tool-icon b" style={{ width:30,height:30 }}><Users size={14}/></div>
                <span className="ai-ph-title">Analyse épidémiologique — {patients.length} patients</span>
                <button className="ai-btn sm" onClick={analyzeCollective} disabled={loading||patients.length===0}>
                  {loading ? <Loader size={13} style={{ animation:'aiSpin 1s linear infinite' }}/> : <BarChart2 size={13}/>}
                  {loading ? 'Analyse…' : 'Analyser la patientèle'}
                </button>
              </div>
              <div className="ai-pb">
                <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:14 }}>
                  {[
                    { label:'Maladies chroniques dominantes', icon:'🫀' },
                    { label:'Risques épidémiques', icon:'⚠️' },
                    { label:'Gaps de prise en charge', icon:'📋' },
                    { label:'Prévention collective', icon:'💉' },
                  ].map(item => (
                    <div key={item.label} style={{ padding:'5px 12px', borderRadius:20,
                      border:'1px solid var(--border)', background:'var(--bg-base)',
                      fontSize:'.72rem', color:'var(--tx-2)', fontWeight:600 }}>
                      {item.icon} {item.label}
                    </div>
                  ))}
                </div>
                {result && (
                  <>
                    <div className="ai-res-header">
                      <div className="ai-res-label"><CheckCircle2 size={12}/>Rapport épidémiologique</div>
                      <button className="ai-copy" onClick={copyResult}>
                        <Copy size={11}/>{copied?'Copié !':'Copier'}
                      </button>
                    </div>
                    <div className="ai-res-box">{result}</div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ══ DIAGNOSTIC ══ */}
          {tool === 'diagnostic' && (
            <div className="ai-panel">
              <div className="ai-ph">
                <div className="ai-tool-icon g" style={{ width:30,height:30 }}><Stethoscope size={14}/></div>
                <span className="ai-ph-title">Diagnostic différentiel IA</span>
              </div>
              <div className="ai-pb">
                <label className="ai-label">Patient (optionnel)</label>
                <select className="ai-sel" value={selectedPt}
                  onChange={e => setSelectedPt(e.target.value)}>
                  <option value="">— Sans patient spécifique —</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
                  ))}
                </select>
                <label className="ai-label">Symptômes et signes cliniques *</label>
                <textarea className="ai-ta" rows={4} maxLength={1500}
                  placeholder="Décrivez en détail: symptômes, durée, intensité, signes associés, contexte…
Ex: Femme 45 ans, douleur thoracique gauche irradiant vers le bras, apparue au repos, 3h de durée, sueurs, nausées. PA 150/95, FC 98, SaO2 96%."
                  value={symptoms} onChange={e => setSymptoms(e.target.value)}/>
                <button className="ai-btn" onClick={generateDiagnostic}
                  disabled={loading||!symptoms.trim()}>
                  {loading
                    ? <><Loader size={14} style={{ animation:'aiSpin 1s linear infinite' }}/> Analyse…</>
                    : <><Stethoscope size={14}/> Générer le diagnostic différentiel</>}
                </button>
                {result && (
                  <>
                    <div className="ai-res-header">
                      <div className="ai-res-label"><CheckCircle2 size={12}/>Diagnostic IA</div>
                      <button className="ai-copy" onClick={copyResult}>
                        <Copy size={11}/>{copied?'Copié !':'Copier'}
                      </button>
                    </div>
                    <div className="ai-res-box">{result}</div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ══ ALERTES ══ */}
          {tool === 'risques' && (
            <div className="ai-panel">
              <div className="ai-ph">
                <div className="ai-tool-icon r" style={{ width:30,height:30 }}><AlertTriangle size={14}/></div>
                <span className="ai-ph-title">Alertes & Patients à risque</span>
                <button className="ai-btn sm" onClick={generateAlerts} disabled={loading||patients.length===0}>
                  {loading ? <Loader size={13} style={{ animation:'aiSpin 1s linear infinite' }}/> : <AlertTriangle size={13}/>}
                  {loading ? 'Analyse…' : 'Générer les alertes'}
                </button>
              </div>
              <div className="ai-pb">
                {/* Alertes rapides statiques */}
                {patients.filter(p=>(p.allergies||[]).some(a=>a.severity==='CRITIQUE')).slice(0,3).map(p => (
                  <div key={p.id} className="ai-alert high">
                    <AlertTriangle size={15} color="#F87171" style={{ flexShrink:0, marginTop:1 }}/>
                    <div>
                      <div className="ai-alert-title">{p.first_name} {p.last_name} — Allergie critique</div>
                      <div className="ai-alert-desc">
                        {(p.allergies||[]).filter(a=>a.severity==='CRITIQUE').map(a=>a.name).join(', ')}
                      </div>
                    </div>
                  </div>
                ))}
                {patients.filter(p=>(p.chronic_cond||[]).length>=2).slice(0,2).map(p => (
                  <div key={p.id} className="ai-alert medium">
                    <Activity size={15} color="#FCD34D" style={{ flexShrink:0, marginTop:1 }}/>
                    <div>
                      <div className="ai-alert-title">{p.first_name} {p.last_name} — Multi-comorbidités</div>
                      <div className="ai-alert-desc">{(p.chronic_cond||[]).join(', ')}</div>
                    </div>
                  </div>
                ))}
                {patients.filter(p=>!p.last_visit).slice(0,2).map(p => (
                  <div key={p.id} className="ai-alert low">
                    <RefreshCw size={15} color="#38BDF8" style={{ flexShrink:0, marginTop:1 }}/>
                    <div>
                      <div className="ai-alert-title">{p.first_name} {p.last_name} — Aucune visite</div>
                      <div className="ai-alert-desc">Patient jamais consulté — rappel recommandé</div>
                    </div>
                  </div>
                ))}
                {result && (
                  <>
                    <div className="ai-res-header">
                      <div className="ai-res-label"><CheckCircle2 size={12}/>Rapport d'alertes IA</div>
                      <button className="ai-copy" onClick={copyResult}>
                        <Copy size={11}/>{copied?'Copié !':'Copier'}
                      </button>
                    </div>
                    <div className="ai-res-box">{result}</div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ══ IMAGE ══ */}
          {tool === 'image' && (
            <div className="ai-panel">
              <div className="ai-ph">
                <div className="ai-tool-icon o" style={{ width:30,height:30 }}><Image size={14}/></div>
                <span className="ai-ph-title">Analyse d'imagerie médicale</span>
              </div>
              <div className="ai-pb">
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
                  <div>
                    <label className="ai-label">Type d'imagerie</label>
                    <select className="ai-sel" value={imgType} onChange={e=>setImgType(e.target.value)} style={{ marginBottom:0 }}>
                      {['radiologie','scanner TDM','IRM','échographie','dermatologie','fond d\'oeil','mammographie','endoscopie','électrocardiogramme','vétérinaire'].map(t=>(
                        <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="ai-label">Patient associé (optionnel)</label>
                    <select className="ai-sel" value={selectedPt} onChange={e=>setSelectedPt(e.target.value)} style={{ marginBottom:0 }}>
                      <option value="">— Sans patient —</option>
                      {patients.map(p=><option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
                    </select>
                  </div>
                </div>
                <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }}
                  onChange={e => {
                    const f = e.target.files?.[0]
                    if (!f) return
                    setImgFile(f)
                    const r = new FileReader()
                    r.onload = ev => setImgPreview(ev.target.result)
                    r.readAsDataURL(f)
                  }}/>
                <div onClick={() => fileRef.current?.click()}
                  style={{ border:'2px dashed rgba(245,158,11,.3)', borderRadius:12, padding:'24px 20px',
                    textAlign:'center', cursor:'pointer', transition:'all .2s', marginBottom:12,
                    background: imgFile ? 'rgba(245,158,11,.06)' : 'rgba(245,158,11,.03)' }}>
                  {imgPreview
                    ? <img src={imgPreview} alt="preview" style={{ maxHeight:180, borderRadius:8, margin:'0 auto', display:'block' }}/>
                    : <>
                        <Upload size={24} color="#FCD34D" style={{ margin:'0 auto 8px', display:'block' }}/>
                        <div style={{ fontSize:'.85rem', color:'var(--tx-2)', fontWeight:600 }}>Charger une image médicale</div>
                        <div style={{ fontSize:'.72rem', color:'var(--tx-3)', marginTop:4 }}>JPG, PNG, DICOM — Max 10MB</div>
                      </>}
                </div>
                {imgFile && (
                  <div style={{ display:'flex', gap:8, marginBottom:12 }}>
                    <button onClick={()=>{setImgFile(null);setImgPreview('')}}
                      style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 10px', borderRadius:8, border:'1px solid rgba(248,113,113,.3)', background:'rgba(248,113,113,.08)', color:'var(--red)', fontSize:'.72rem', cursor:'pointer' }}>
                      <X size={12}/> Supprimer
                    </button>
                    <span style={{ fontSize:'.72rem', color:'var(--tx-3)', alignSelf:'center' }}>{imgFile.name}</span>
                  </div>
                )}
                <button className="ai-btn" onClick={analyzeImage} disabled={loading||!imgFile}>
                  {loading
                    ? <><Loader size={14} style={{ animation:'aiSpin 1s linear infinite' }}/> Analyse…</>
                    : <><Image size={14}/> Analyser l'image</>}
                </button>
                {result && (
                  <>
                    <div className="ai-res-header">
                      <div className="ai-res-label"><CheckCircle2 size={12}/>Interprétation IA</div>
                      <button className="ai-copy" onClick={copyResult}><Copy size={11}/>{copied?'Copié !':'Copier'}</button>
                    </div>
                    <div className="ai-res-box">{result}</div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ══ CHAT LIBRE ══ */}
          {tool === 'chat' && (
            <div className="ai-panel">
              <div className="ai-ph">
                <div className="ai-tool-icon v" style={{ width:30,height:30 }}><Zap size={14}/></div>
                <span className="ai-ph-title">Dr IA — Accès complet aux dossiers</span>
                {chatMsgs.length > 0 && (
                  <button onClick={()=>setChatMsgs([])}
                    style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 10px', borderRadius:8,
                      border:'1px solid var(--border)', background:'transparent', color:'var(--tx-3)',
                      fontSize:'.72rem', cursor:'pointer' }}>
                    <RefreshCw size={11}/> Nouvelle conversation
                  </button>
                )}
              </div>
              <div className="ai-pb">
                {chatMsgs.length === 0 && (
                  <div style={{ textAlign:'center', padding:'16px 0 20px', color:'var(--tx-3)' }}>
                    <Brain size={32} style={{ margin:'0 auto 10px', display:'block', opacity:.3 }}/>
                    <div style={{ fontWeight:600, color:'var(--tx-2)', marginBottom:6 }}>
                      Dr IA a accès à {patients.length} dossiers patients complets
                    </div>
                    <div style={{ fontSize:'.75rem', marginBottom:14 }}>
                      Mentionnez un nom de patient pour accéder à son dossier
                    </div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:6, justifyContent:'center' }}>
                      {[
                        `Analyse le dossier de ${patients[0]?.first_name || 'Mohamed'} et donne-moi tes conclusions`,
                        'Quels patients ont le plus grand risque cardiovasculaire ?',
                        'Y a-t-il des interactions médicamenteuses dangereuses dans ma patientèle ?',
                        'Quels patients n\'ont pas consulté depuis plus de 6 mois ?',
                        'Quelle est la prévalence du diabète dans ma patientèle ?',
                        'Protocole de prise en charge HTA résistante',
                      ].map(q => (
                        <button key={q} onClick={() => setChatInput(q)}
                          style={{ padding:'5px 12px', borderRadius:20, border:'1px solid var(--border)',
                            background:'var(--bg-base)', color:'var(--tx-2)', fontSize:'.7rem',
                            cursor:'pointer', transition:'all .15s', textAlign:'left' }}>
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="ai-chat-wrap">
                  {chatMsgs.map((m, i) => (
                    <div key={i} className={`ai-msg ${m.role==='user'?'user':'ai'} ${m.loading?'loading':''}`}>
                      {m.loading
                        ? <><Loader size={13} style={{ animation:'aiSpin 1s linear infinite', flexShrink:0 }}/> Dr IA analyse…</>
                        : m.content}
                    </div>
                  ))}
                  <div ref={chatEndRef}/>
                </div>
                <div className="ai-chat-input">
                  <textarea className="ai-chat-ta" rows={2} maxLength={2000}
                    placeholder="Posez votre question… Mentionnez un patient par son prénom/nom pour accéder à son dossier"
                    value={chatInput} onChange={e=>setChatInput(e.target.value)}
                    onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendChat()}}}
                    disabled={chatLoading}/>
                  <button className="ai-send" onClick={sendChat}
                    disabled={chatLoading||!chatInput.trim()}>
                    <Send size={15}/>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
