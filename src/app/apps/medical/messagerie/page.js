'use client'
import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Send, Search, MessageSquare, ChevronRight, RefreshCw, User, Paperclip, Mic, MicOff, Video, FileText, Image, X, Play, Pause, StopCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import ProfileModal from '@/components/features/apps/medical/ProfileModal'

const ROLE_LABELS = { tenant_admin:'Médecin', tenant_user:'Secrétaire', app_end_user:'Patient' }
const ROLE_COLORS = { tenant_admin:'linear-gradient(135deg,#0EA5E9,#38BDF8)', tenant_user:'linear-gradient(135deg,#F59E0B,#FCD34D)', app_end_user:'linear-gradient(135deg,#10B981,#34D399)' }
const BACK_ROUTES = { tenant_admin:'/apps/medical/doctor', tenant_user:'/apps/medical/secretary', app_end_user:'/apps/medical/patient' }

function initials(name) { return (name||'?').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase() }
function fmt(iso) {
  if(!iso) return ''
  const d=new Date(iso),now=new Date(),diff=now-d
  if(diff<60000) return "À l'instant"
  if(diff<3600000) return Math.floor(diff/60000)+'min'
  if(diff<86400000) return d.toLocaleTimeString('fr-TN',{hour:'2-digit',minute:'2-digit'})
  return d.toLocaleDateString('fr-TN',{day:'2-digit',month:'short'})+' '+d.toLocaleTimeString('fr-TN',{hour:'2-digit',minute:'2-digit'})
}
function fmtSize(b){ if(!b) return ''; if(b<1024) return b+'B'; if(b<1048576) return (b/1024).toFixed(1)+'KB'; return (b/1048576).toFixed(1)+'MB' }

function AudioPlayer({url,mine}){
  const [playing,setPlaying]=useState(false),[prog,setProg]=useState(0)
  const ref=useRef(null)
  return(
    <div style={{display:'flex',alignItems:'center',gap:8,padding:'8px 12px',borderRadius:12,minWidth:180,background:mine?'rgba(255,255,255,.15)':'var(--bg-base)',border:mine?'none':'1px solid var(--border)'}}>
      <audio ref={ref} src={url} onTimeUpdate={()=>{if(ref.current)setProg((ref.current.currentTime/ref.current.duration)*100)}} onEnded={()=>{setPlaying(false);setProg(0)}}/>
      <button onClick={()=>{if(playing){ref.current.pause()}else{ref.current.play()};setPlaying(!playing)}}
        style={{width:28,height:28,borderRadius:'50%',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',background:mine?'rgba(255,255,255,.25)':'rgba(14,165,233,.15)',color:mine?'white':'#0EA5E9'}}>
        {playing?<Pause size={12}/>:<Play size={12}/>}
      </button>
      <div style={{flex:1,height:3,borderRadius:2,background:mine?'rgba(255,255,255,.25)':'var(--border)',overflow:'hidden'}}>
        <div style={{height:'100%',background:mine?'rgba(255,255,255,.8)':'#0EA5E9',width:prog+'%',transition:'width .1s'}}/>
      </div>
      <span style={{fontSize:'.65rem',opacity:.6}}>🎤</span>
    </div>
  )
}

function Inner(){
  const router=useRouter(),sp=useSearchParams()
  const cp=sp.get('contact')
  const [user,setUser]=useState(null),[contacts,setContacts]=useState([]),[selected,setSelected]=useState(null)
  const [messages,setMessages]=useState([]),[body,setBody]=useState(''),[loading,setLoading]=useState(true)
  const [sending,setSending]=useState(false),[search,setSearch]=useState(''),[showSide,setShowSide]=useState(true)
  const [showProf,setShowProf]=useState(false),[unread,setUnread]=useState({})
  const [filePrev,setFilePrev]=useState(null),[isRec,setIsRec]=useState(false),[recSec,setRecSec]=useState(0)
  const endRef=useRef(null),subRef=useRef(null),fileRef=useRef(null),recRef=useRef(null),timerRef=useRef(null),chunks=useRef([])

  useEffect(()=>{
    async function init(){
      try{
        const {data:{user:u}}=await supabase.auth.getUser()
        if(!u){router.push('/apps/medical/login');return}
        const {data:ud}=await supabase.from('users').select('role,tenant_id,app_type,full_name,phone').eq('id',u.id).maybeSingle()
        if(!ud||ud.app_type!=='medical'){router.push('/apps/medical/login');return}
        setUser({...u,...ud})
        // Charger contacts du même tenant — sans filtre app_type strict
        // Récupérer les contacts — si tenant_id absent, chercher via med_patients
        let tenantId = ud.tenant_id
        if (!tenantId && ud.role === 'app_end_user') {
          const {data:ptData} = await supabase.from('med_patients')
            .select('tenant_id').eq('user_id', u.id).maybeSingle()
          tenantId = ptData?.tenant_id
          // Mettre à jour public.users avec le bon tenant_id
          if (tenantId) {
            await supabase.from('users').update({ tenant_id: tenantId }).eq('id', u.id)
            ud.tenant_id = tenantId
          }
        }
        const {data:all} = await supabase.from('users')
          .select('id,full_name,role,app_type')
          .eq('tenant_id', tenantId || ud.tenant_id)
          .neq('id', u.id)
          .limit(50)
        setContacts(all||[])
        // Mettre à jour l'état user avec le bon tenant_id
        if (tenantId && !ud.tenant_id) {
          setUser(prev => prev ? {...prev, tenant_id: tenantId} : prev)
        }
        if(cp&&all){const pre=all.find(c=>c.id===cp);if(pre){setSelected(pre);setShowSide(false)}}
        const {data:ur}=await supabase.from('med_messages').select('from_uid').eq('to_uid',u.id).eq('read',false)
        const counts={};(ur||[]).forEach(m=>{counts[m.from_uid]=(counts[m.from_uid]||0)+1});setUnread(counts)
      }catch{router.push('/apps/medical/login')}
      finally{setLoading(false)}
    }
    init()
  },[router,cp])

  const loadMsgs=useCallback(async()=>{
    if(!user||!selected)return
    try{
      const {data,error:loadErr}=await supabase.from('med_messages')
        .select('id,from_uid,to_uid,body,read,sent_at,file_url,file_name,file_type,msg_type')
        .or(`and(from_uid.eq.${user.id},to_uid.eq.${selected.id}),and(from_uid.eq.${selected.id},to_uid.eq.${user.id})`)
        .order('sent_at',{ascending:true}).limit(100)
      if(loadErr) console.error('[MSG LOAD ERROR]',loadErr)
      setMessages(data||[])
      await supabase.from('med_messages').update({read:true}).eq('to_uid',user.id).eq('from_uid',selected.id).eq('read',false)
      setUnread(p=>{const n={...p};delete n[selected.id];return n})
    }catch{}
  },[user,selected])

  useEffect(()=>{
    loadMsgs()
    if(subRef.current)subRef.current.unsubscribe()
    if(!user||!selected)return
    subRef.current=supabase.channel(`m_${user.id}_${selected.id}`)
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'med_messages',
        filter:`to_uid=eq.${user.id}`
      },p=>{
        const m=p.new
        // Ne traiter que les messages de l'autre personne (les miens = déjà optimistic)
        if(m.from_uid===selected.id&&m.to_uid===user.id){
          setMessages(prev=>{
            const exists=prev.some(x=>x.id===m.id)
            return exists?prev:[...prev,m]
          })
          supabase.from('med_messages').update({read:true}).eq('id',m.id)
        }
      }).subscribe()
    return()=>{if(subRef.current)subRef.current.unsubscribe()}
  },[selected,loadMsgs,user])

  useEffect(()=>{endRef.current?.scrollIntoView({behavior:'smooth'})},[messages])

  async function sendMsg(b2=null,fd=null){
    if(!selected||!user||sending)return
    const b=b2||body.trim()
    if(!b&&!fd)return
    setSending(true)
    setBody('')
    setFilePrev(null)
    // Optimistic update — affichage immédiat avant confirmation Supabase
    const optimistic={
      id:'opt_'+Date.now(),
      from_uid:user.id,
      to_uid:selected.id,
      body:b||'',
      read:false,
      sent_at:new Date().toISOString(),
      msg_type:fd?.type||'text',
      file_url:fd?.url||null,
      file_name:fd?.name||null,
      file_type:fd?.mime||null,
    }
    setMessages(prev=>[...prev,optimistic])
    try{
      const insertPayload={
        from_uid:user.id,
        to_uid:selected.id,
        body:b||'',
        read:false,
        msg_type:fd?.type||'text',
        file_url:fd?.url||null,
        file_name:fd?.name||null,
        file_type:fd?.mime||null,
      }
      // Ajouter tenant_id seulement s'il existe
      if(user.tenant_id) insertPayload.tenant_id=user.tenant_id
      const {data:inserted,error:insertErr}=await supabase.from('med_messages')
        .insert(insertPayload)
        .select('id,from_uid,to_uid,body,read,sent_at,file_url,file_name,file_type,msg_type')
        .single()
      if(insertErr) console.error('[MSG INSERT ERROR]',insertErr)
      // Remplacer le message optimiste par le vrai
      if(inserted){
        setMessages(prev=>prev.map(m=>m.id===optimistic.id?inserted:m))
      }
    }catch{
      // Retirer le message optimiste si erreur
      setMessages(prev=>prev.filter(m=>m.id!==optimistic.id))
    }
    setSending(false)
  }

  async function uploadAndSend(file){
    if(!file||!user)return
    setSending(true)
    try{
      const ext=file.name.split('.').pop()
      const path=`${user.tenant_id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
      const {error:ue}=await supabase.storage.from('medical-files').upload(path,file,{contentType:file.type})
      if(ue)throw ue
      const {data:ud}=supabase.storage.from('medical-files').getPublicUrl(path)
      const url=ud.publicUrl
      const isImg=file.type.startsWith('image/'),isAud=file.type.startsWith('audio/')
      await supabase.from('med_files').insert({
        tenant_id:user.tenant_id,uploader_id:user.id,
        file_name:file.name,file_type:file.type,file_size:file.size,
        storage_path:path,public_url:url,
        category:isImg?'image':isAud?'audio':'document'
      })
      await sendMsg('',{url,name:file.name,mime:file.type,type:isAud?'audio':'file'})
    }catch(e){console.error(e)}
    setSending(false)
  }

  function onFileChange(e){
    const f=e.target.files?.[0];if(!f)return
    if(f.size>20*1024*1024){alert('Max 20MB');return}
    setFilePrev({file:f,name:f.name,size:f.size,mime:f.type})
    e.target.value=''
  }

  async function startRec(){
    try{
      const stream=await navigator.mediaDevices.getUserMedia({audio:true})
      // Détecter le format supporté par le navigateur
      const mimeType=['audio/webm;codecs=opus','audio/webm','audio/ogg','audio/mp4','']
        .find(t=>!t||MediaRecorder.isTypeSupported(t))||''
      const rec=new MediaRecorder(stream,mimeType?{mimeType}:{})
      chunks.current=[]
      rec.ondataavailable=e=>chunks.current.push(e.data)
      rec.onstop=async()=>{
        stream.getTracks().forEach(t=>t.stop())
        const mime=rec.mimeType||'audio/webm'
        const ext=mime.includes('ogg')?'ogg':mime.includes('mp4')?'m4a':'webm'
        const blob=new Blob(chunks.current,{type:mime})
        await uploadAndSend(new File([blob],`voice_${Date.now()}.${ext}`,{type:mime}))
        setIsRec(false);setRecSec(0);clearInterval(timerRef.current)
      }
      rec.start();recRef.current=rec;setIsRec(true)
      timerRef.current=setInterval(()=>setRecSec(s=>s+1),1000)
    }catch{alert('Microphone non disponible')}
  }

  function stopRec(){if(recRef.current?.state==='recording')recRef.current.stop()}

  async function startVideo(){
    const roomId=`${user.tenant_id}_${Date.now()}`
    const url=`${window.location.origin}/apps/medical/telemedicine?room=${roomId}`
    await sendMsg('📹 Appel vidéo — Cliquez pour rejoindre',{url,name:'Appel vidéo',mime:'video/call',type:'video_call'})
  }

  // Séparer contacts par rôle
  const searchFn = c => !search||(c.full_name||'').toLowerCase().includes(search.toLowerCase())
  const staffContacts   = contacts.filter(c=>['tenant_admin','tenant_user'].includes(c.role)&&searchFn(c))
  const patientContacts = contacts.filter(c=>c.role==='app_end_user'&&searchFn(c))
  const filtered = [...staffContacts,...patientContacts]
  const backRoute=BACK_ROUTES[user?.role]||'/apps/medical/login'
  const myColor=ROLE_COLORS[user?.role]||ROLE_COLORS.app_end_user

  if(loading)return<div style={{background:'var(--bg-base)',height:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}><div style={{width:140,height:8,borderRadius:4,background:'var(--bg-surface)'}}/></div>

  const CSS2=`
    .mr{position:fixed;inset:0;background:var(--bg-base);display:flex;flex-direction:column;overflow:hidden}
    .mb{height:56px;display:flex;align-items:center;padding:0 16px;gap:10px;flex-shrink:0;background:rgba(8,11,20,.96);border-bottom:1px solid var(--border);backdrop-filter:blur(20px);z-index:100}
    .mbk{display:flex;align-items:center;gap:5px;color:var(--tx-2);font-size:.83rem;font-weight:600;cursor:pointer;background:none;border:none;padding:0;transition:color .15s}
    .mbk:hover{color:#0EA5E9}
    .mbt{font-family:var(--font-display);font-weight:700;font-size:.9rem;color:var(--tx);flex:1}
    .mav{width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.7rem;font-weight:800;color:white;cursor:pointer;flex-shrink:0}
    .mbod{flex:1;display:flex;overflow:hidden}
    .msd{width:270px;flex-shrink:0;border-right:1px solid var(--border);display:flex;flex-direction:column;overflow:hidden}
    .msdh{padding:10px 12px;border-bottom:1px solid var(--border);flex-shrink:0}
    .msr{display:flex;align-items:center;gap:7px;background:var(--bg-surface);border:1px solid var(--border);border-radius:9px;padding:0 10px;height:34px}
    .msr input{flex:1;background:none;border:none;outline:none;color:var(--tx);font-size:.8rem}
    .msr input::placeholder{color:var(--tx-3)}
    .mls{flex:1;overflow-y:auto}
    .mci{display:flex;align-items:center;gap:9px;padding:11px 13px;cursor:pointer;transition:background .15s;border-bottom:1px solid rgba(255,255,255,.03)}
    .mci:hover{background:var(--bg-hover)}
    .mci.active{background:rgba(14,165,233,.08);border-left:3px solid #0EA5E9}
    .mca{width:36px;height:36px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:.75rem;font-weight:800;color:white}
    .mcn{font-weight:700;font-size:.83rem;color:var(--tx)}
    .mcr{font-size:.68rem;color:var(--tx-3);margin-top:1px}
    .mub{min-width:17px;height:17px;padding:0 4px;border-radius:9px;background:#0EA5E9;color:white;font-size:.62rem;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0}
    .mth{flex:1;display:flex;flex-direction:column;overflow:hidden}
    .mthh{padding:12px 16px;border-bottom:1px solid var(--border);flex-shrink:0;display:flex;align-items:center;gap:10px;background:var(--bg-surface)}
    .mthn{font-weight:700;font-size:.88rem;color:var(--tx);flex:1}
    .mthr{font-size:.68rem;color:var(--tx-3);margin-top:1px}
    .mtha{display:flex;gap:5px}
    .mthb{width:30px;height:30px;border-radius:8px;border:1px solid var(--border);background:transparent;color:var(--tx-2);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s}
    .mthb:hover{background:var(--bg-hover);color:var(--tx)}
    .mthbv{border-color:rgba(99,102,241,.35);color:var(--ac);background:rgba(99,102,241,.08)}
    .mthbv:hover{background:rgba(99,102,241,.18)!important;color:var(--ac)!important}
    .mms{flex:1;overflow-y:auto;padding:14px 16px;display:flex;flex-direction:column;gap:6px;scrollbar-width:thin;scrollbar-color:var(--border) transparent}
    .msep{text-align:center;margin:5px 0}
    .msep span{font-size:.63rem;color:var(--tx-3);background:var(--bg-base);padding:2px 10px;border-radius:10px}
    .mbr{display:flex}
    .mbr.mine{justify-content:flex-end}
    .mbb{max-width:70%;padding:9px 13px;border-radius:14px;font-size:.875rem;line-height:1.45;word-break:break-word}
    .mbb.mine{background:#0EA5E9;color:white;border-bottom-right-radius:3px}
    .mbb.theirs{background:var(--bg-surface);color:var(--tx);border:1px solid var(--border);border-bottom-left-radius:3px}
    .mbt2{font-size:.6rem;margin-top:3px;opacity:.65}
    .mbb.mine .mbt2{text-align:right}
    .mc{padding:10px 14px;border-top:1px solid var(--border);flex-shrink:0;background:var(--bg-surface)}
    .mcr2{display:flex;gap:8px;align-items:flex-end}
    .mci2{flex:1;display:flex;align-items:flex-end;background:var(--bg-base);border:1px solid var(--border);border-radius:14px;overflow:hidden;transition:border-color .15s}
    .mci2:focus-within{border-color:#0EA5E9}
    .mci2 textarea{flex:1;padding:10px 12px;background:none;border:none;outline:none;color:var(--tx);font-size:.875rem;resize:none;font-family:var(--font-body);max-height:80px;min-height:38px}
    .mci2 textarea::placeholder{color:var(--tx-3)}
    .mcbs{display:flex;align-items:center;padding:6px 8px;gap:3px;flex-shrink:0}
    .mib{width:30px;height:30px;border-radius:8px;border:none;background:transparent;color:var(--tx-3);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s}
    .mib:hover{background:var(--bg-hover);color:var(--tx)}
    .mib.rec{color:var(--red);background:rgba(220,38,38,.1);animation:mpulse 1s infinite}
    @keyframes mpulse{0%,100%{opacity:1}50%{opacity:.45}}
    .msnd{width:38px;height:38px;border-radius:12px;flex-shrink:0;background:#0EA5E9;border:none;color:white;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .18s}
    .msnd:hover{background:#0284C7;transform:scale(1.05)}
    .msnd:disabled{opacity:.35;cursor:not-allowed;transform:none}
    .mnone{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;color:var(--tx-3);gap:10px;padding:20px;text-align:center}
    .mprev{display:flex;align-items:center;gap:8px;padding:7px 10px;background:var(--bg-base);border-radius:9px;margin-bottom:7px;border:1px solid rgba(14,165,233,.2)}
    .mprn{flex:1;font-size:.76rem;color:var(--tx);font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    @media(max-width:767px){.msd{width:100%}.msd.hidden{display:none}.mth.hidden{display:none}}
  `

  return(
    <>
      <style>{CSS2}</style>
      <input ref={fileRef} type="file" style={{display:'none'}}
        accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt,audio/*"
        onChange={onFileChange}/>
      <div className="mr">
        <div className="mb">
          <button className="mbk" onClick={()=>router.push(backRoute)}><ArrowLeft size={14}/> Retour</button>
          <span className="mbt">Messagerie</span>
          {!showSide&&<button className="mbk" onClick={()=>setShowSide(true)}>Contacts</button>}
          <div className="mav" style={{background:myColor}} onClick={()=>setShowProf(true)}>
            {initials(user?.full_name||user?.email||'')}
          </div>
        </div>
        <div className="mbod">
          {/* Sidebar */}
          <div className={`msd ${!showSide?'hidden':''}`}>
            <div className="msdh"><div className="msr"><Search size={12} color="var(--tx-3)"/><input placeholder="Rechercher…" value={search} onChange={e=>setSearch(e.target.value)}/></div></div>
            <div className="mls">
              {filtered.length===0?(
                <div style={{padding:'30px 14px',textAlign:'center',color:'var(--tx-3)',fontSize:'.78rem'}}>
                  <User size={24} style={{margin:'0 auto 8px',display:'block',opacity:.3}}/>Aucun contact
                </div>
              ):(
                <>
                  {/* Section Équipe (médecin/secrétaire) */}
                  {staffContacts.length>0&&(
                    <>
                      <div style={{padding:'7px 13px 3px',fontSize:'.63rem',fontWeight:800,letterSpacing:'.07em',textTransform:'uppercase',color:'var(--tx-3)',borderBottom:'1px solid var(--border)'}}>Équipe</div>
                      {staffContacts.map(c=>(
                        <div key={c.id} className={`mci ${selected?.id===c.id?'active':''}`} onClick={()=>{setSelected(c);setShowSide(false)}}>
                          <div className="mca" style={{background:ROLE_COLORS[c.role]||ROLE_COLORS.app_end_user}}>{initials(c.full_name)}</div>
                          <div style={{flex:1,minWidth:0}}>
                            <div className="mcn">{c.full_name||'Utilisateur'}</div>
                            <div className="mcr">{ROLE_LABELS[c.role]||c.role}</div>
                          </div>
                          {unread[c.id]>0&&<div className="mub">{unread[c.id]}</div>}
                          <ChevronRight size={12} color="var(--tx-3)"/>
                        </div>
                      ))}
                    </>
                  )}
                  {/* Section Patients */}
                  {patientContacts.length>0&&(
                    <>
                      <div style={{padding:'7px 13px 3px',fontSize:'.63rem',fontWeight:800,letterSpacing:'.07em',textTransform:'uppercase',color:'var(--tx-3)',borderBottom:'1px solid var(--border)'}}>Patients</div>
                      {patientContacts.map(c=>(
                        <div key={c.id} className={`mci ${selected?.id===c.id?'active':''}`} onClick={()=>{setSelected(c);setShowSide(false)}}>
                          <div className="mca" style={{background:ROLE_COLORS[c.role]||ROLE_COLORS.app_end_user}}>{initials(c.full_name)}</div>
                          <div style={{flex:1,minWidth:0}}>
                            <div className="mcn">{c.full_name||'Utilisateur'}</div>
                            <div className="mcr">{ROLE_LABELS[c.role]||c.role}</div>
                          </div>
                          {unread[c.id]>0&&<div className="mub">{unread[c.id]}</div>}
                          <ChevronRight size={12} color="var(--tx-3)"/>
                        </div>
                      ))}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
          {/* Thread */}
          <div className={`mth ${showSide&&contacts.length>0?'hidden':''}`}>
            {!selected?(
              <div className="mnone">
                <MessageSquare size={38} style={{opacity:.2}}/>
                <div style={{fontWeight:600,color:'var(--tx-2)'}}>Sélectionnez un contact</div>
              </div>
            ):(
              <>
                <div className="mthh">
                  <div className="mca" style={{width:34,height:34,background:ROLE_COLORS[selected.role]||ROLE_COLORS.app_end_user,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.72rem',fontWeight:800,color:'white',flexShrink:0}}>{initials(selected.full_name)}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div className="mthn">{selected.full_name||'Utilisateur'}</div>
                    <div className="mthr">{ROLE_LABELS[selected.role]}</div>
                  </div>
                  <div className="mtha">
                    <button className="mthb mthbv" onClick={startVideo} title="Appel vidéo"><Video size={14}/></button>
                    <button className="mthb" onClick={loadMsgs} title="Rafraîchir"><RefreshCw size={13}/></button>
                  </div>
                </div>
                <div className="mms">
                  {messages.length===0?(
                    <div style={{textAlign:'center',color:'var(--tx-3)',fontSize:'.8rem',margin:'auto'}}>
                      <MessageSquare size={24} style={{margin:'0 auto 8px',display:'block',opacity:.3}}/>Commencez la conversation
                    </div>
                  ):messages.map((m,idx)=>{
                    const mine=m.from_uid===user.id
                    const prev=messages[idx-1]
                    const showDate=!prev||new Date(m.sent_at).toDateString()!==new Date(prev?.sent_at).toDateString()
                    const isImg=m.file_type?.startsWith('image/')
                    const isAud=m.msg_type==='audio'
                    const isVid=m.msg_type==='video_call'
                    const isFile=m.msg_type==='file'&&!isImg
                    return(
                      <div key={m.id}>
                        {showDate&&<div className="msep"><span>{new Date(m.sent_at).toLocaleDateString('fr-TN',{weekday:'long',day:'numeric',month:'long'})}</span></div>}
                        <div className={`mbr ${mine?'mine':''}`}>
                          {isAud&&m.file_url?(
                            <div style={{maxWidth:'70%'}}>
                              <AudioPlayer url={m.file_url} mine={mine}/>
                              <div style={{fontSize:'.6rem',opacity:.6,textAlign:mine?'right':'left',padding:'2px 4px'}}>{fmt(m.sent_at)}</div>
                            </div>
                          ):isImg&&m.file_url?(
                            <div style={{maxWidth:'60%'}}>
                              <img src={m.file_url} alt={m.file_name} style={{width:'100%',borderRadius:11,cursor:'pointer',border:'1px solid var(--border)'}} onClick={()=>window.open(m.file_url,'_blank')}/>
                              <div style={{fontSize:'.6rem',opacity:.6,textAlign:mine?'right':'left',padding:'2px 4px'}}>{fmt(m.sent_at)}</div>
                            </div>
                          ):isVid?(
                            <div style={{padding:'10px 13px',borderRadius:12,background:mine?'rgba(99,102,241,.2)':'rgba(99,102,241,.08)',border:mine?'none':'1px solid rgba(99,102,241,.2)',display:'flex',alignItems:'center',gap:10}}>
                              <div style={{width:32,height:32,borderRadius:'50%',background:'var(--ac)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><Video size={14} color="white"/></div>
                              <div>
                                <div style={{fontWeight:700,fontSize:'.8rem',color:mine?'white':'var(--tx)'}}>Appel vidéo</div>
                                <div style={{fontSize:'.68rem',opacity:.7}}>
                                  {m.file_url&&<a href={m.file_url} target="_blank" rel="noreferrer" style={{color:'#818CF8'}}>Rejoindre</a>}
                                  {' · '}{fmt(m.sent_at)}
                                </div>
                              </div>
                            </div>
                          ):isFile&&m.file_url?(
                            <a href={m.file_url} target="_blank" rel="noreferrer" style={{textDecoration:'none',display:'flex',alignItems:'center',gap:10,padding:'9px 13px',borderRadius:12,background:mine?'rgba(255,255,255,.15)':'var(--bg-surface)',border:mine?'none':'1px solid var(--border)',maxWidth:240}}>
                              <div style={{width:32,height:32,borderRadius:9,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(245,158,11,.15)',color:'var(--gold)',flexShrink:0}}><FileText size={15}/></div>
                              <div style={{flex:1,minWidth:0}}>
                                <div style={{fontWeight:600,fontSize:'.78rem',color:mine?'white':'var(--tx)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{m.file_name}</div>
                                <div style={{fontSize:'.63rem',opacity:.65}}>{fmt(m.sent_at)}</div>
                              </div>
                            </a>
                          ):(
                            <div className={`mbb ${mine?'mine':'theirs'}`}>
                              {m.body}
                              <div className="mbt2">{fmt(m.sent_at)}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                  <div ref={endRef}/>
                </div>
                {/* Composer */}
                <div className="mc">
                  {filePrev&&(
                    <div className="mprev">
                      {filePrev.mime?.startsWith('image/')?<Image size={13} color="#0EA5E9"/>:<FileText size={13} color="var(--gold)"/>}
                      <span className="mprn">{filePrev.name}</span>
                      <span style={{fontSize:'.65rem',color:'var(--tx-3)',flexShrink:0}}>{fmtSize(filePrev.size)}</span>
                      <button onClick={()=>setFilePrev(null)} style={{background:'none',border:'none',color:'var(--tx-3)',cursor:'pointer',display:'flex',padding:2}}><X size={12}/></button>
                      <button onClick={()=>uploadAndSend(filePrev.file)} disabled={sending} style={{padding:'3px 10px',borderRadius:7,border:'none',background:'#0EA5E9',color:'white',fontSize:'.72rem',fontWeight:700,cursor:'pointer',flexShrink:0}}>
                        {sending?'…':'Envoyer'}
                      </button>
                    </div>
                  )}
                  {isRec&&(
                    <div style={{display:'flex',alignItems:'center',gap:8,padding:'5px 10px',background:'rgba(220,38,38,.08)',borderRadius:9,marginBottom:7,border:'1px solid rgba(220,38,38,.25)'}}>
                      <div style={{width:7,height:7,borderRadius:'50%',background:'var(--red)',animation:'mpulse 1s infinite'}}/>
                      <span style={{fontSize:'.76rem',color:'var(--red)',fontWeight:600,flex:1}}>🎙 Enregistrement {recSec}s</span>
                      <button onClick={stopRec} style={{padding:'3px 10px',borderRadius:7,border:'none',background:'var(--red)',color:'white',fontSize:'.72rem',fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',gap:4}}>
                        <StopCircle size={12}/> Terminer
                      </button>
                    </div>
                  )}
                  <div className="mcr2">
                    <div className="mci2">
                      <textarea placeholder={`Message à ${selected.full_name||'ce contact'}… (Entrée pour envoyer)`}
                        value={body} onChange={e=>setBody(e.target.value)}
                        onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMsg()}}}
                        rows={1} maxLength={2000} disabled={isRec}/>
                      <div className="mcbs">
                        <button className="mib" onClick={()=>fileRef.current?.click()} title="Joindre fichier"><Paperclip size={14}/></button>
                        <button className={`mib ${isRec?'rec':''}`} onClick={isRec?stopRec:startRec} title={isRec?'Arrêter':'Message vocal'}>
                          {isRec?<MicOff size={14}/>:<Mic size={14}/>}
                        </button>
                      </div>
                    </div>
                    <button className="msnd" onClick={()=>sendMsg()} disabled={sending||!body.trim()||isRec}>
                      <Send size={14}/>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      {showProf&&user&&<ProfileModal user={{...user,full_name:user.full_name||user.email}} onClose={()=>setShowProf(false)}/>}
    </>
  )
}

export default function Messagerie(){
  return(
    <Suspense fallback={<div style={{background:'var(--bg-base)',height:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}><div style={{width:140,height:8,borderRadius:4,background:'var(--bg-surface)'}}/></div>}>
      <Inner/>
    </Suspense>
  )
}
