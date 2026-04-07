'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

// Handles the OAuth redirect from Google after signInWithOAuth()
// Supabase exchanges the code for a session automatically via the URL hash
export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    async function handle() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error || !session) {
          router.push('/login')
          return
        }
        // Check role to redirect correctly
        const { data } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .maybeSingle()
        const role = data?.role || 'client'
        router.push(role === 'super_admin' ? '/admin' : '/client')
      } catch {
        router.push('/login')
      }
    }
    handle()
  }, [router])

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: 'calc(100vh - 64px)',
      gap: 16,
    }}>
      <div style={{
        width: 36,
        height: 36,
        border: '2px solid rgba(99,102,241,.2)',
        borderTopColor: '#6366F1',
        borderRadius: '50%',
        animation: 'spin .8s linear infinite',
      }} />
      <p style={{ color: 'var(--tx-3)', fontSize: 14 }}>Connexion en cours...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
