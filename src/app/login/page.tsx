'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
export default function Page() {
  const [email, setEmail] = useState('proprietaire@agronova.com')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')
  const router = useRouter()
  const login = async () => {
    setMsg('Connexion...')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setMsg('Erreur: ' + error.message); return }
    const { data: profil } = await supabase.from('profiles').select('*').eq('id', data.user.id).single()
    setMsg('Bienvenue ' + (profil?.nom || email) + ' - Role: ' + (profil?.role || '...'))
    setTimeout(() => router.push('/'), 800)
  }
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F6F7F9', fontFamily: 'sans-serif', color: '#111' }}>
      <div style={{ background: 'white', padding: 24, borderRadius: 16, border: '1px solid #E5E5E5', width: 360 }}>
        <div style={{ fontWeight: 900, fontSize: 26, textAlign: 'center' }}>AGRONOVA <span style={{ fontSize: 12, background: '#DCFCE7', padding: '2px 8px', borderRadius: 20 }}>Guinee</span></div>
        <p style={{ textAlign: 'center', color: '#111' }}>Conakry - Elevage porcin - Connexion</p>
        <p style={{ fontSize: 12, background: '#FEF3C7', padding: 10, borderRadius: 10 }}>Comptes test :<br/>proprietaire@agronova.com<br/>ferme@agronova.com<br/>compta@agronova.com</p>
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" style={{ width: '100%', padding: 12, borderRadius: 12, border: '1px solid #E5E5E5', marginTop: 10, color: '#111' }} />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mot de passe" style={{ width: '100%', padding: 12, borderRadius: 12, border: '1px solid #E5E5E5', marginTop: 8, color: '#111' }} />
        <button onClick={login} style={{ width: '100%', padding: 14, borderRadius: 12, background: '#111', color: 'white', fontWeight: 800, border: 'none', marginTop: 12 }}>Se connecter</button>
        <p>{msg}</p>
      </div>
    </div>
  )
}
