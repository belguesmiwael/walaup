'use server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

function getSupabase() {
  const cookieStore = cookies()
  const token = cookieStore.get('sb-access-token')?.value
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    token ? { global: { headers: { Authorization: `Bearer ${token}` } } } : {}
  )
  return client
}

export async function getPatients({ search = '', limit = 20, offset = 0 } = {}) {
  const sb = getSupabase()
  let query = sb
    .schema('medical')
    .from('patients')
    .select('id, first_name, last_name, birth_date, gender, blood_type, phone, allergies, chronic_cond, last_visit, created_at')
    .order('last_name', { ascending: true })
    .range(offset, offset + limit - 1)

  if (search.trim()) {
    query = query.or(
      `first_name.ilike.%${search}%,last_name.ilike.%${search}%,phone.ilike.%${search}%`
    )
  }

  const { data, error, count } = await query
  if (error) throw new Error(error.message)
  return { patients: data || [], count }
}

export async function getPatientById(id) {
  const sb = getSupabase()
  const { data, error } = await sb
    .schema('medical')
    .from('patients')
    .select('*, consultations:medical.consultations(id, created_at, motif, diagnostic, status)')
    .eq('id', id)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data
}

export async function createPatient(formData) {
  const sb = getSupabase()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const payload = {
    first_name:     String(formData.first_name || '').trim().slice(0, 100),
    last_name:      String(formData.last_name  || '').trim().slice(0, 100),
    birth_date:     formData.birth_date || null,
    gender:         formData.gender || null,
    blood_type:     formData.blood_type || null,
    phone:          String(formData.phone || '').trim().slice(0, 20),
    email:          String(formData.email || '').trim().slice(0, 254),
    address:        String(formData.address || '').trim().slice(0, 200),
    city:           String(formData.city || '').trim().slice(0, 100),
    emergency_name: String(formData.emergency_name || '').trim().slice(0, 100),
    emergency_phone:String(formData.emergency_phone || '').trim().slice(0, 20),
    emergency_rel:  String(formData.emergency_rel || '').trim().slice(0, 50),
    allergies:      Array.isArray(formData.allergies) ? formData.allergies : [],
    chronic_cond:   Array.isArray(formData.chronic_cond) ? formData.chronic_cond : [],
    current_meds:   Array.isArray(formData.current_meds) ? formData.current_meds : [],
    created_by:     user.id,
  }

  if (!payload.first_name || !payload.last_name) {
    throw new Error('Prénom et nom requis')
  }

  const { data, error } = await sb
    .schema('medical')
    .from('patients')
    .insert(payload)
    .select('id')
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function updatePatient(id, formData) {
  const sb = getSupabase()
  const allowed = [
    'first_name','last_name','birth_date','gender','blood_type',
    'phone','email','address','city',
    'emergency_name','emergency_phone','emergency_rel',
    'allergies','chronic_cond','current_meds'
  ]

  const payload = {}
  for (const key of allowed) {
    if (key in formData) payload[key] = formData[key]
  }

  const { data, error } = await sb
    .schema('medical')
    .from('patients')
    .update(payload)
    .eq('id', id)
    .select('id')
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function getTodayStats() {
  const sb = getSupabase()
  const today = new Date().toISOString().slice(0, 10)
  const todayStart = `${today}T00:00:00`
  const todayEnd   = `${today}T23:59:59`

  const [appts, newPts] = await Promise.all([
    sb.schema('medical')
      .from('appointments')
      .select('id, status, type')
      .gte('scheduled_at', todayStart)
      .lte('scheduled_at', todayEnd),
    sb.schema('medical')
      .from('patients')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', todayStart)
      .lte('created_at', todayEnd),
  ])

  const apptList = appts.data || []
  return {
    total_today:    apptList.length,
    confirmed:      apptList.filter(a => a.status === 'confirmed').length,
    done:           apptList.filter(a => a.status === 'done').length,
    pending:        apptList.filter(a => a.status === 'pending').length,
    cancelled:      apptList.filter(a => a.status === 'cancelled').length,
    new_patients:   newPts.count || 0,
  }
}
