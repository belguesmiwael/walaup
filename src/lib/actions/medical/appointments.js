'use server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

function getSupabase() {
  const cookieStore = cookies()
  const token = cookieStore.get('sb-access-token')?.value
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    token ? { global: { headers: { Authorization: `Bearer ${token}` } } } : {}
  )
}

export async function getAppointments({ date, status, limit = 50 } = {}) {
  const sb = getSupabase()
  let query = sb
    .schema('medical')
    .from('appointments')
    .select(`
      id, scheduled_at, duration_min, type, status, reason, reminder_sent, notes,
      patient:medical.patients(id, first_name, last_name, phone, allergies)
    `)
    .order('scheduled_at', { ascending: true })
    .limit(limit)

  if (date) {
    const dayStart = `${date}T00:00:00`
    const dayEnd   = `${date}T23:59:59`
    query = query.gte('scheduled_at', dayStart).lte('scheduled_at', dayEnd)
  }
  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data || []
}

export async function getTodayQueue() {
  const today = new Date().toISOString().slice(0, 10)
  return getAppointments({ date: today })
}

export async function createAppointment(formData) {
  const sb = getSupabase()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  if (!formData.patient_id || !formData.scheduled_at) {
    throw new Error('Patient et date/heure requis')
  }

  const { data, error } = await sb
    .schema('medical')
    .from('appointments')
    .insert({
      patient_id:   formData.patient_id,
      scheduled_at: formData.scheduled_at,
      duration_min: Number(formData.duration_min) || 30,
      type:         formData.type || 'presentiel',
      status:       formData.status || 'pending',
      reason:       String(formData.reason || '').trim().slice(0, 500),
      notes:        String(formData.notes  || '').trim().slice(0, 1000),
      created_by:   user.id,
    })
    .select('id')
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function updateAppointmentStatus(id, status) {
  const VALID = ['pending','confirmed','done','cancelled']
  if (!VALID.includes(status)) throw new Error('Statut invalide')

  const sb = getSupabase()
  const { data, error } = await sb
    .schema('medical')
    .from('appointments')
    .update({ status })
    .eq('id', id)
    .select('id, status')
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function getWeekAppointments() {
  const sb = getSupabase()
  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay() + 1)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)

  const { data, error } = await sb
    .schema('medical')
    .from('appointments')
    .select(`
      id, scheduled_at, duration_min, type, status, reason,
      patient:medical.patients(id, first_name, last_name, phone)
    `)
    .gte('scheduled_at', weekStart.toISOString())
    .lte('scheduled_at', weekEnd.toISOString())
    .order('scheduled_at', { ascending: true })

  if (error) throw new Error(error.message)
  return data || []
}
