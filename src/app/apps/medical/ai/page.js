'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Brain, Stethoscope, Image, TrendingUp,
  Send, Loader, Copy, ChevronDown, ChevronUp,
  AlertCircle, CheckCircle2, Upload, X, RefreshCw
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

const GROQ_KEY  = process.env.NEXT_PUBLIC_GROQ_API_KEY || ''
const GROQ_URL  = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'llama-3.3-70b-versatile'

const CSS = `
  .ai-root { min-height:100vh; background:var(--bg-base); padding-bottom:40px; }
  .ai-topbar { position:sticky; top:0; z-index:100; height:56px; display:flex; align-items:center;
    padding:0 20px; gap:12px; background:rgba(8,11,20,.96);
    border-bottom:1px solid var(--border); backdrop-filter:blur(20px); }
  .ai-back { display:flex; align-items:center; gap:6px; color:var(--tx-2); font-size:.85rem;
    font-weight:600; cursor:pointer; background:none; border:none; transition:color .15s; padding:0; }
  .ai-back:hover { color:#0EA5E9; }
  .ai-title { font-family:var(--font-display); font-weight:700; font-size:.95rem; color:var(--tx); flex:1; }
  .ai-badge { padding:3px 10px; border-radius:20px; font-size:.68rem; font-weight:700;
    background:linear-gradient(135deg,rgba(99,102,241,.2),rgba(139,92,246,.2));
    color:#A78BFA; border:1px solid rgba(99,102,241,.3); }

  .ai-content { max-width:900px; margin:0 auto; padding:24px 20px; }

  /* ── Tool cards ── */
  .ai-tools { display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:12px; margin-bottom:28px; }
  .ai-tool-btn {
    display:flex; flex-direction:column; align-items:flex-start; gap:10px;
    padding:18px; border-radius:16px; cursor:pointer; transition:all .22s;
    border:1px solid var(--border); background:var(--bg-surface); text-align:left;
  }
  .ai-tool-btn:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(0,0,0,.2); }
  .ai-tool-btn.active { border-color:rgba(99,102,241,.5); background:rgba(99,102,241,.08); }
  .ai-tool-icon { width:42px; height:42px; border-radius:12px; display:flex; align-items:center;
    justify-content:center; }
  .ai-tool-icon.violet { background:rgba(99,102,241,.15); color:#A78BFA; }
  .ai-tool-icon.blue   { background:rgba(14,165,233,.12);  color:#38BDF8; }
  .ai-tool-icon.green  { background:rgba(16,185,129,.12);  color:#34D399; }
  .ai-tool-icon.gold   { background:rgba(245,158,11,.12);  color:#FCD34D; }
  .ai-tool-name { font-weight:700; font-size:.88rem; color:var(--tx); }
  .ai-tool-desc { font-size:.73rem; color:var(--tx-3); line-height:1.4; }

  /* ── Panel ── */
  .ai-panel { background:var(--bg-surface); border:1px solid var(--border);
    border-radius:16px; overflow:hidden; margin-bottom:20px; }
  .ai-panel-header { padding:16px 20px; border-bottom:1px solid var(--border);
    display:flex; align-items:center; gap:10px; }
  .ai-panel-title { font-weight:700; font-size:.9rem; color:var(--tx); flex:1; }
  .ai-panel-body { padding:20px; }

  /* ── Patient selector ── */
  .ai-select { width:100%; padding:10px 14px; border-radius:10px;
    border:1px solid var(--border); background:var(--bg-base);
    color:var(--tx); font-size:.875rem; outline:none; cursor:pointer;
    transition:border-color .15s; margin-bottom:14px; }
  .ai-select:focus { border-color:#6366F1; }

  /* ── Input zone ── */
  .ai-textarea { width:100%; padding:12px 14px; border-radius:10px;
    border:1px solid var(--border); background:var(--bg-base);
    color:var(--tx); font-size:.875rem; outline:none; resize:vertical;
    min-height:80px; font-family:var(--font-body); box-sizing:border-box;
    transition:border-color .15s; }
  .ai-textarea:focus { border-color:#6366F1; }

  /* ── Generate button ── */
  .ai-gen-btn {
    display:flex; align-items:center; gap:8px; padding:11px 22px;
    border-radius:12px; border:none; cursor:pointer; font-size:.88rem;
    font-weight:700; transition:all .2s;
    background:linear-gradient(135deg,#6366F1,#8B5CF6); color:white;
    box-shadow:0 4px 16px rgba(99,102,241,.3);
    margin-top:14px;
  }
  .ai-gen-btn:hover { opacity:.9; transform:translateY(-1px); box-shadow:0 6px 20px rgba(99,102,241,.4); }
  .ai-gen-btn:disabled { opacity:.5; cursor:not-allowed; transform:none; }

  /* ── Result ── */
  .ai-result { margin-top:20px; }
  .ai-result-header { display:flex; align-items:center; justify-content:space-between;
    margin-bottom:12px; }
  .ai-result-label { font-size:.75rem; font-weight:700; letter-spacing:.05em;
    text-transform:uppercase; color:#A78BFA; display:flex; align-items:center; gap:6px; }
  .ai-copy-btn { display:flex; align-items:center; gap:5px; padding:5px 12px;
    border-radius:8px; border:1px solid var(--border); background:transparent;
    color:var(--tx-2); font-size:.73rem; font-weight:600; cursor:pointer; transition:all .15s; }
  .ai-copy-btn:hover { background:var(--bg-hover); color:var(--tx); }
  .ai-result-box { background:var(--bg-base); border:1px solid rgba(99,102,241,.2);
    border-radius:12px; padding:18px; font-size:.875rem; line-height:1.7;
    color:var(--tx); white-space:pre-wrap; font-family:var(--font-body);
    max-height:480px; overflow-y:auto; scrollbar-width:thin; }

  /* ── Risk score ── */
  .ai-risk-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr));
    gap:10px; margin-top:16px; }
  .ai-risk-card { padding:14px; border-radius:12px; text-align:center;
    border:1px solid var(--border); }
  .ai-risk-card.low    { background:rgba(16,185,129,.08); border-color:rgba(16,185,129,.2); }
  .ai-risk-card.medium { background:rgba(245,158,11,.08); border-color:rgba(245,158,11,.2); }
  .ai-risk-card.high   { background:rgba(220,38,38,.08);  border-color:rgba(220,38,38,.2); }
  .ai-risk-label { font-size:.68rem; font-weight:700; letter-spacing:.05em;
    text-transform:uppercase; color:var(--tx-3); margin-bottom:6px; }
  .ai-risk-value { font-family:var(--font-display); font-size:1.6rem; font-weight:800; }
  .ai-risk-card.low    .ai-risk-value { color:var(--green); }
  .ai-risk-card.medium .ai-risk-value { color:var(--gold); }
  .ai-risk-card.high   .ai-risk-value { color:var(--red); }
  .ai-risk-sub { font-size:.68rem; color:var(--tx-3); margin-top:4px; }

  /* ── Upload image ── */
  .ai-upload-zone { border:2px dashed rgba(99,102,241,.3); border-radius:12px;
    padding:32px 20px; text-align:center; cursor:pointer; transition:all .2s;
    background:rgba(99,102,241,.04); margin-bottom:14px; }
  .ai-upload-zone:hover { border-color:rgba(99,102,241,.6); background:rgba(99,102,241,.08); }
  .ai-upload-zone.has-file { border-style:solid; border-color:rgba(99,102,241,.4); }
  .ai-upload-icon { width:48px; height:48px; border-radius:14px; margin:0 auto 12px;
    background:rgba(99,102,241,.12); display:flex; align-items:center;
    justify-content:center; color:#A78BFA; }
  .ai-upload-text { font-size:.85rem; color:var(--tx-2); font-weight:600; }
  .ai-upload-sub  { font-size:.73rem; color:var(--tx-3); margin-top:4px; }
  .ai-img-preview { max-width:100%; border-radius:10px; margin-bottom:14px;
    border:1px solid var(--border); max-height:200px; object-fit:contain; }

  /* ── Chat IA ── */
  .ai-chat { display:flex; flex-direction:column; gap:10px; max-height:400px;
    overflow-y:auto; margin-bottom:14px; padding:4px;
    scrollbar-width:thin; scrollbar-color:var(--border) transparent; }
  .ai-msg { padding:12px 14px; border-radius:12px; font-size:.875rem;
    line-height:1.55; max-width:85%; }
  .ai-msg.user { background:rgba(99,102,241,.12); color:var(--tx);
    border:1px solid rgba(99,102,241,.2); align-self:flex-end; }
  .ai-msg.assistant { background:var(--bg-base); color:var(--tx);
    border:1px solid var(--border); align-self:flex-start; white-space:pre-wrap; }
  .ai-msg.loading { background:var(--bg-base); border:1px solid var(--border); align-self:flex-start;
    display:flex; align-items:center; gap:8px; color:var(--tx-3); }
  .ai-chat-input { display:flex; gap:8px; }
  .ai-chat-textarea { flex:1; padding:10px 14px; border-radius:10px;
    border:1px solid var(--border); background:var(--bg-base);
    color:var(--tx); font-size:.875rem; outline:none; resize:none;
    font-family:var(--font-body); transition:border-color .15s; }
  .ai-chat-textarea:focus { border-color:#6366F1; }
  .ai-chat-send { width:40px; height:40px; border-radius:10px; flex-shrink:0;
    background:linear-gradient(135deg,#6366F1,#8B5CF6); border:none; color:white;
    display:flex; align-items:center; justify-content:center;
    cursor:pointer; transition:all .18s; }
  .ai-chat-send:hover { opacity:.9; transform:scale(1.05); }
  .ai-chat-send:disabled { opacity:.4; cursor:not-allowed; transform:none; }

  .ai-skeleton { background:linear-gradient(90deg,var(--bg-surface) 25%,var(--bg-hover) 50%,var(--bg-surface) 75%);
    background-size:200% 100%; animation:aiShimmer 1.5s infinite; border-radius:8px; }
  @keyframes aiShimmer { 0%{background-position:200%} 100%{background-position:-200%} }
  @keyframes aiSpin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
`

async function callGroq(messages, onChunk) {
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_KEY}`,
    },
    body: JSON.stringify({
      model:       GROQ_MODEL,
      messages,
      max_tokens:  2048,
      temperature: 0.3,
      stream:      true,
    }),
  })

  if (!res.ok) throw new Error(`Groq API error: ${res.status}`)

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let full = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const chunk = decoder.decode(value)
    const lines = chunk.split('\n').filter(l => l.startsWith('data: '))
    for (const line of lines) {
      const data = line.slice(6)
      if (data === '[DONE]') continue
      try {
        const json = JSON.parse(data)
        const token = json.choices?.[0]?.delta?.content || ''
        if (token) { full += token; onChunk?.(full) }
      } catch {}
    }
  }
  return full
}

const SYSTEM_MEDICAL = `Tu es un assistant médical IA expert francophone intégré dans MediLink OS, 
un logiciel médical tunisien. Tu aides les médecins avec des analyses cliniques, 
des résumés de dossiers, des diagnostics différentiels et des scores de risque.
Toujours répondre en français. Être précis, structuré et professionnel.
Ne jamais faire de diagnostic définitif — toujours préciser que c'est une aide à la décision.
Format: utilise des titres clairs, des listes à puces pour la lisibilité.`

export default function AIEngine() {
  const router  = useRouter()
  const [user,     setUser]     = useState(null)
  const [tool,     setTool]     = useState('summary') // summary | diagnostic | image | chat
  const [patients, setPatients] = useState([])
  const [selectedPt, setSelectedPt] = useState('')
  const [patientData, setPatientData] = useState(null)
  const [result,   setResult]   = useState('')
  const [loading,  setLoading]  = useState(false)
  const [copied,   setCopied]   = useState(false)
  const [symptoms, setSymptoms] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [imageType, setImageType] = useState('radiologie')
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const fileRef = useRef(null)
  const chatEndRef = useRef(null)

  useEffect(() => {
    async function init() {
      const { data: { user: u } } = await supabase.auth.getUser()
      if (!u) { router.push('/apps/medical/login'); return }
      const { data: ud } = await supabase.from('users')
        .select('role, tenant_id, app_type, full_name')
        .eq('id', u.id).maybeSingle()
      if (!ud || ud.role !== 'tenant_admin') { router.push('/apps/medical/login'); return }
      setUser({ ...u, ...ud })

      const { data: pts } = await supabase.from('med_patients')
        .select('id, first_name, last_name, birth_date, gender, blood_type, allergies, chronic_cond, current_meds')
        .order('last_name', { ascending: true }).limit(100)
      setPatients(pts || [])
    }
    init()
  }, [router])

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chatMessages])

  async function loadPatientFull(patientId) {
    if (!patientId) return null
    const [ptRes, consultRes] = await Promise.all([
      supabase.from('med_patients').select('*').eq('id', patientId).maybeSingle(),
      supabase.from('med_consultations').select('motif, diagnostic, traitement, created_at')
        .eq('patient_id', patientId).order('created_at', { ascending: false }).limit(5)
    ])
    return { patient: ptRes.data, consultations: consultRes.data || [] }
  }

  /* ── RÉSUMÉ PATIENT ── */
  async function generateSummary() {
    if (!selectedPt) return
    setLoading(true); setResult('')
    try {
      const data = await loadPatientFull(selectedPt)
      const pt   = data.patient
      const age  = pt.birth_date
        ? Math.floor((Date.now() - new Date(pt.birth_date)) / (1000*60*60*24*365.25))
        : null

      const prompt = `Analyse le dossier médical suivant et génère un résumé clinique structuré:

PATIENT: ${pt.first_name} ${pt.last_name}, ${age ? age + ' ans' : 'âge inconnu'}, ${pt.gender || ''}, Groupe sanguin: ${pt.blood_type || 'inconnu'}
ALLERGIES: ${(pt.allergies||[]).map(a => `${a.name} (${a.severity})`).join(', ') || 'Aucune connue'}
CONDITIONS CHRONIQUES: ${(pt.chronic_cond||[]).join(', ') || 'Aucune'}
MÉDICAMENTS EN COURS: ${(pt.current_meds||[]).join(', ') || 'Aucun'}

HISTORIQUE CONSULTATIONS RÉCENTES:
${data.consultations.map((c, i) => `${i+1}. [${new Date(c.created_at).toLocaleDateString('fr-TN')}] Motif: ${c.motif || '?'} | Diagnostic: ${c.diagnostic || '?'} | Traitement: ${c.traitement || '?'}`).join('\n') || 'Aucune consultation enregistrée'}

Génère:
1. **Résumé clinique** (synthèse du profil médical)
2. **Points d'attention** (alertes, interactions médicamenteuses potentielles)
3. **Score de risque global** (Faible/Modéré/Élevé avec justification)
4. **Recommandations** pour le prochain suivi`

      await callGroq(
        [{ role: 'system', content: SYSTEM_MEDICAL }, { role: 'user', content: prompt }],
        txt => setResult(txt)
      )
    } catch (e) {
      setResult('Erreur: ' + e.message)
    }
    setLoading(false)
  }

  /* ── DIAGNOSTIC DIFFÉRENTIEL ── */
  async function generateDiagnostic() {
    if (!symptoms.trim()) return
    setLoading(true); setResult('')
    try {
      let context = ''
      if (selectedPt) {
        const data = await loadPatientFull(selectedPt)
        const pt   = data.patient
        context = `Patient: ${pt.first_name} ${pt.last_name}, ${pt.gender}, Allergies: ${(pt.allergies||[]).map(a=>a.name).join(', ')||'aucune'}. `
      }

      const prompt = `${context}

Symptômes présentés: ${symptoms}

Génère un diagnostic différentiel structuré:
1. **Diagnostics principaux à considérer** (par ordre de probabilité)
   - Pour chaque diagnostic: arguments pour, arguments contre, examens à demander
2. **Examens complémentaires recommandés** (biologie, imagerie)
3. **Drapeaux rouges** à surveiller
4. **Prise en charge initiale suggérée**

Rappel: ceci est une aide à la décision, non un diagnostic définitif.`

      await callGroq(
        [{ role: 'system', content: SYSTEM_MEDICAL }, { role: 'user', content: prompt }],
        txt => setResult(txt)
      )
    } catch (e) {
      setResult('Erreur: ' + e.message)
    }
    setLoading(false)
  }

  /* ── ANALYSE IMAGE ── */
  async function analyzeImage() {
    if (!imageFile) return
    setLoading(true); setResult('')
    try {
      const prompt = `Je suis médecin et je viens de charger une image médicale de type: ${imageType}.
${selectedPt ? `Patient sélectionné avec ses antécédents.` : ''}

Décris ce que tu pourrais observer sur une telle image de type ${imageType} et les points clés d'interprétation clinique.
Génère une grille d'analyse structurée pour ce type d'image:
1. **Points d'analyse systématique** pour ce type d'imagerie
2. **Anomalies fréquentes à rechercher**
3. **Critères de normalité**
4. **Quand référer en urgence**

Note: je ne peux pas voir l'image directement, fournis les éléments d'analyse généraux.`

      await callGroq(
        [{ role: 'system', content: SYSTEM_MEDICAL }, { role: 'user', content: prompt }],
        txt => setResult(txt)
      )
    } catch (e) {
      setResult('Erreur: ' + e.message)
    }
    setLoading(false)
  }

  /* ── CHAT MÉDICAL ── */
  async function sendChat() {
    if (!chatInput.trim() || chatLoading) return
    const userMsg = chatInput.trim()
    setChatInput('')
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setChatLoading(true)

    try {
      const history = chatMessages.map(m => ({ role: m.role, content: m.content }))
      let response = ''
      setChatMessages(prev => [...prev, { role: 'assistant', content: '', loading: true }])

      response = await callGroq(
        [{ role: 'system', content: SYSTEM_MEDICAL }, ...history, { role: 'user', content: userMsg }],
        txt => {
          response = txt
          setChatMessages(prev => prev.map((m, i) =>
            i === prev.length - 1 ? { role: 'assistant', content: txt, loading: false } : m
          ))
        }
      )
    } catch (e) {
      setChatMessages(prev => prev.map((m, i) =>
        i === prev.length - 1 ? { role: 'assistant', content: 'Erreur: ' + e.message, loading: false } : m
      ))
    }
    setChatLoading(false)
  }

  function copyResult() {
    navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleImageUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = ev => setImagePreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  const TOOLS = [
    { id: 'summary',    icon: Brain,       cls:'violet', name:'Résumé patient',        desc:'Analyse complète du dossier + score de risque' },
    { id: 'diagnostic', icon: Stethoscope, cls:'blue',   name:'Diagnostic différentiel', desc:'Propositions diagnostiques basées sur les symptômes' },
    { id: 'image',      icon: Image,       cls:'green',  name:'Analyse d\'image',      desc:'Grille d\'analyse pour radio, dermato, véto' },
    { id: 'chat',       icon: Brain,       cls:'gold',   name:'Assistant IA',          desc:'Questions libres au Dr IA' },
  ]

  return (
    <>
      <style>{CSS}</style>
      <div className="ai-root">
        <div className="ai-topbar">
          <button className="ai-back" onClick={() => router.push('/apps/medical/doctor')}>
            <ArrowLeft size={15}/> Retour
          </button>
          <span className="ai-title">Intelligence Artificielle</span>
          <span className="ai-badge">⚡ Groq LLaMA 3.3</span>
        </div>

        <div className="ai-content">
          {/* Tool selector */}
          <div className="ai-tools">
            {TOOLS.map(t => (
              <button key={t.id} className={`ai-tool-btn ${tool===t.id?'active':''}`}
                onClick={() => { setTool(t.id); setResult('') }}>
                <div className={`ai-tool-icon ${t.cls}`}><t.icon size={20}/></div>
                <div className="ai-tool-name">{t.name}</div>
                <div className="ai-tool-desc">{t.desc}</div>
              </button>
            ))}
          </div>

          {/* ══ RÉSUMÉ PATIENT ══ */}
          {tool === 'summary' && (
            <div className="ai-panel">
              <div className="ai-panel-header">
                <div className={`ai-tool-icon violet`} style={{ width:32, height:32 }}><Brain size={16}/></div>
                <span className="ai-panel-title">Résumé & Score de risque patient</span>
              </div>
              <div className="ai-panel-body">
                <label style={{ fontSize:'.75rem', fontWeight:600, color:'var(--tx-2)', display:'block', marginBottom:6 }}>
                  Sélectionner un patient
                </label>
                <select className="ai-select" value={selectedPt}
                  onChange={e => setSelectedPt(e.target.value)}>
                  <option value="">— Choisir un patient —</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
                  ))}
                </select>
                <button className="ai-gen-btn" onClick={generateSummary}
                  disabled={loading || !selectedPt}>
                  {loading
                    ? <><Loader size={15} style={{ animation:'aiSpin 1s linear infinite' }}/> Analyse en cours…</>
                    : <><Brain size={15}/> Générer le résumé</>}
                </button>
                {result && (
                  <div className="ai-result">
                    <div className="ai-result-header">
                      <div className="ai-result-label"><CheckCircle2 size={13}/>Analyse IA</div>
                      <button className="ai-copy-btn" onClick={copyResult}>
                        <Copy size={12}/>{copied ? 'Copié !' : 'Copier'}
                      </button>
                    </div>
                    <div className="ai-result-box">{result}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══ DIAGNOSTIC DIFFÉRENTIEL ══ */}
          {tool === 'diagnostic' && (
            <div className="ai-panel">
              <div className="ai-panel-header">
                <div className="ai-tool-icon blue" style={{ width:32, height:32 }}><Stethoscope size={16}/></div>
                <span className="ai-panel-title">Diagnostic différentiel</span>
              </div>
              <div className="ai-panel-body">
                <label style={{ fontSize:'.75rem', fontWeight:600, color:'var(--tx-2)', display:'block', marginBottom:6 }}>
                  Patient (optionnel — pour contextualiser)
                </label>
                <select className="ai-select" value={selectedPt}
                  onChange={e => setSelectedPt(e.target.value)}>
                  <option value="">— Sans patient spécifique —</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
                  ))}
                </select>
                <label style={{ fontSize:'.75rem', fontWeight:600, color:'var(--tx-2)', display:'block', marginBottom:6 }}>
                  Symptômes et signes cliniques *
                </label>
                <textarea className="ai-textarea" rows={4}
                  placeholder="Ex: Douleur thoracique irradiant vers le bras gauche depuis 2h, dyspnée, sueurs froides, TA 150/90…"
                  value={symptoms}
                  onChange={e => setSymptoms(e.target.value)}
                  maxLength={1000}
                />
                <button className="ai-gen-btn" onClick={generateDiagnostic}
                  disabled={loading || !symptoms.trim()}>
                  {loading
                    ? <><Loader size={15} style={{ animation:'aiSpin 1s linear infinite' }}/> Analyse…</>
                    : <><Stethoscope size={15}/> Générer le différentiel</>}
                </button>
                {result && (
                  <div className="ai-result">
                    <div className="ai-result-header">
                      <div className="ai-result-label"><CheckCircle2 size={13}/>Diagnostic différentiel IA</div>
                      <button className="ai-copy-btn" onClick={copyResult}>
                        <Copy size={12}/>{copied ? 'Copié !' : 'Copier'}
                      </button>
                    </div>
                    <div className="ai-result-box">{result}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══ ANALYSE IMAGE ══ */}
          {tool === 'image' && (
            <div className="ai-panel">
              <div className="ai-panel-header">
                <div className="ai-tool-icon green" style={{ width:32, height:32 }}><Image size={16}/></div>
                <span className="ai-panel-title">Analyse d'image médicale</span>
              </div>
              <div className="ai-panel-body">
                <label style={{ fontSize:'.75rem', fontWeight:600, color:'var(--tx-2)', display:'block', marginBottom:6 }}>
                  Type d'imagerie
                </label>
                <select className="ai-select" value={imageType}
                  onChange={e => setImageType(e.target.value)}>
                  <option value="radiologie">Radiologie (Rx thorax, os)</option>
                  <option value="scanner">Scanner (TDM)</option>
                  <option value="IRM">IRM</option>
                  <option value="echographie">Échographie</option>
                  <option value="dermatologie">Dermatologie (lésion cutanée)</option>
                  <option value="fond_oeil">Fond d'œil</option>
                  <option value="veterinaire">Vétérinaire</option>
                  <option value="autre">Autre</option>
                </select>

                <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }}
                  onChange={handleImageUpload}/>

                <div className={`ai-upload-zone ${imageFile ? 'has-file' : ''}`}
                  onClick={() => fileRef.current?.click()}>
                  {imagePreview ? (
                    <>
                      <img src={imagePreview} alt="preview" className="ai-img-preview"/>
                      <div style={{ fontSize:'.75rem', color:'var(--tx-3)' }}>{imageFile?.name}</div>
                    </>
                  ) : (
                    <>
                      <div className="ai-upload-icon"><Upload size={20}/></div>
                      <div className="ai-upload-text">Cliquez pour charger une image</div>
                      <div className="ai-upload-sub">JPG, PNG, WebP — Max 10MB</div>
                    </>
                  )}
                </div>

                {imageFile && (
                  <button onClick={() => { setImageFile(null); setImagePreview('') }}
                    style={{ display:'flex', alignItems:'center', gap:5, marginBottom:12, background:'none', border:'none', color:'var(--tx-3)', cursor:'pointer', fontSize:'.75rem' }}>
                    <X size={13}/> Supprimer l'image
                  </button>
                )}

                <button className="ai-gen-btn" onClick={analyzeImage}
                  disabled={loading || !imageFile}>
                  {loading
                    ? <><Loader size={15} style={{ animation:'aiSpin 1s linear infinite' }}/> Analyse…</>
                    : <><Image size={15}/> Analyser l'image</>}
                </button>

                {result && (
                  <div className="ai-result">
                    <div className="ai-result-header">
                      <div className="ai-result-label"><CheckCircle2 size={13}/>Analyse IA</div>
                      <button className="ai-copy-btn" onClick={copyResult}>
                        <Copy size={12}/>{copied ? 'Copié !' : 'Copier'}
                      </button>
                    </div>
                    <div className="ai-result-box">{result}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══ CHAT MÉDICAL ══ */}
          {tool === 'chat' && (
            <div className="ai-panel">
              <div className="ai-panel-header">
                <div className="ai-tool-icon gold" style={{ width:32, height:32 }}><Brain size={16}/></div>
                <span className="ai-panel-title">Assistant IA Médical</span>
                {chatMessages.length > 0 && (
                  <button onClick={() => setChatMessages([])}
                    style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 10px', borderRadius:8, border:'1px solid var(--border)', background:'transparent', color:'var(--tx-3)', fontSize:'.72rem', cursor:'pointer' }}>
                    <RefreshCw size={12}/> Nouvelle conversation
                  </button>
                )}
              </div>
              <div className="ai-panel-body">
                {chatMessages.length === 0 && (
                  <div style={{ textAlign:'center', padding:'20px 0 24px', color:'var(--tx-3)' }}>
                    <Brain size={36} style={{ margin:'0 auto 12px', display:'block', opacity:.3 }}/>
                    <div style={{ fontWeight:600, color:'var(--tx-2)', marginBottom:8 }}>Dr IA est prêt</div>
                    <div style={{ fontSize:'.78rem', marginBottom:16 }}>Posez n'importe quelle question médicale</div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:6, justifyContent:'center' }}>
                      {[
                        'Interactions médicamenteuses Metformine + Ibuprofène ?',
                        'Protocole AVC en urgence',
                        'Doses pédiatriques Amoxicilline',
                        'Critères de Wells EP',
                      ].map(q => (
                        <button key={q} onClick={() => { setChatInput(q) }}
                          style={{ padding:'5px 12px', borderRadius:20, border:'1px solid var(--border)', background:'var(--bg-base)', color:'var(--tx-2)', fontSize:'.72rem', cursor:'pointer', transition:'all .15s' }}>
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="ai-chat">
                  {chatMessages.map((m, i) => (
                    <div key={i} className={`ai-msg ${m.role} ${m.loading ? 'loading' : ''}`}>
                      {m.loading
                        ? <><Loader size={14} style={{ animation:'aiSpin 1s linear infinite', flexShrink:0 }}/> Dr IA réfléchit…</>
                        : m.content}
                    </div>
                  ))}
                  <div ref={chatEndRef}/>
                </div>
                <div className="ai-chat-input">
                  <textarea className="ai-chat-textarea" rows={2}
                    placeholder="Posez votre question médicale… (Entrée pour envoyer)"
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => { if (e.key==='Enter'&&!e.shiftKey) { e.preventDefault(); sendChat() } }}
                    maxLength={2000}
                    disabled={chatLoading}
                  />
                  <button className="ai-chat-send" onClick={sendChat}
                    disabled={chatLoading || !chatInput.trim()}>
                    <Send size={16}/>
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
