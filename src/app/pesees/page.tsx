"use client"
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function PeseesPage() {
  const [animaux, setAnimaux] = useState<any[]>([])
  const [pesees, setPesees] = useState<any[]>([])
  const [poids, setPoids] = useState<Record<string, string>>({})
  const [datePesee, setDatePesee] = useState('2026-11-19')
  const [msg, setMsg] = useState('')

  const charger = async () => {
    const { data: a } = await supabase.from('animaux').select('*').eq('statut', 'actif').order('enclos')
    setAnimaux(a || [])
    const { data: p } = await supabase.from('pesees').select('*').order('date_pesee', { ascending: false }).limit(50)
    setPesees(p || [])
  }
  useEffect(() => { charger(); const d = new Date(); const iso = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0'); setDatePesee(iso); }, [])

  const enregistrerTout = async () => {
    const lignes = animaux.filter((a: any) => poids[a.code] && Number(poids[a.code]) > 0).map((a: any) => ({ animal_id: a.id, animal_code: a.code, enclos: a.enclos, poids_kg: Number(poids[a.code]), date_pesee: datePesee, note: 'Pesée lot ' + a.enclos }))
    if (lignes.length === 0) { setMsg('Mets au moins un poids.'); return }
    const { error } = await supabase.from('pesees').insert(lignes)
    if (error) { setMsg('Erreur : ' + error.message); return }
    // Met à jour aussi le poids actuel dans Cheptel
    for (const l of lignes) { await supabase.from('animaux').update({ poids_kg: l.poids_kg }).eq('code', l.animal_code) }
    setMsg(lignes.length + ' pesée(s) enregistrée(s) le ' + datePesee + '. Retourne sur Tableau de bord, choisis le lot, tu verras la courbe.')
    setPoids({}); charger()
  }

  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'
  const groupes: Record<string, any[]> = {}
  animaux.forEach((a: any) => { const k = a.enclos || 'Sans enclos'; if (!groupes[k]) groupes[k] = []; groupes[k].push(a) })

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F6F7F9', color: '#111', fontFamily: 'sans-serif' }}>
      <div style={{ width: 250, background: 'white', padding: 16, borderRight: '1px solid #E5E5E5', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><div style={{ width: 36, height: 36, background: '#16A34A', color: 'white', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>A</div><div><div style={{ fontWeight: 900 }}>AGRONOVA</div><div style={{ fontSize: 11, color: '#666' }}>Guinee - Conakry</div></div></div>
        <div style={{ marginTop: 18, fontSize: 11, fontWeight: 800, color: '#999' }}>NAVIGATION</div>
        {[
          { nom: 'Tableau de bord', href: '/' },
          { nom: 'Cheptel', href: '/cheptel' },
          { nom: 'Reproduction', href: '/reproduction' },
          { nom: 'Répertoire Truies', href: '/repertoire-truies' },
          { nom: 'Alimentation', href: '/alimentation' },
          { nom: 'Ventes', href: '/ventes' },
          { nom: 'Pesées', href: '/pesees' },
          { nom: 'Sante', href: '/sante' },
          { nom: 'Finances', href: '/finances' },
          { nom: 'Approbations', href: '/approbations' },
          { nom: 'Rapports', href: '/rapports' },
        ].map((m: any) => (<a key={m.nom} href={m.href} style={{ display: 'block', padding: '10px 12px', borderRadius: 10, background: m.nom === 'Pesées' ? '#16A34A' : 'white', color: m.nom === 'Pesées' ? 'white' : '#111', fontWeight: 700, marginTop: 4, textDecoration: 'none', fontSize: 13 }}>{m.nom}</a>))}
      </div>
      <div style={{ flex: 1, padding: 20, maxWidth: 900 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, margin: 0 }}>Pesées de mes lots</h1>
        <p style={{ color: '#666', fontSize: 13 }}>Pèse chaque porc, mets son poids, clique une fois. Le graphique de chaque lot devient vrai.</p>

        <div style={{ background: 'white', padding: 16, borderRadius: 14, border: '1px solid #E5E5E5', marginTop: 16 }}>
          <b>Date de pesée</b>
          <input type='date' value={datePesee} onChange={(e: any) => setDatePesee(e.target.value)} style={{ display: 'block', marginTop: 8, padding: 10, border: '1px solid #DDD', borderRadius: 8, fontSize: 14 }} />
          <p style={{ fontSize: 12, color: '#666', marginTop: 6 }}>Conseil : pèse tous les 15 ou 30 jours, toujours le même jour, pour que le GMQ soit juste.</p>
        </div>

        {Object.entries(groupes).map(([enclos, liste]: any) => (
          <div key={enclos} style={{ background: 'white', padding: 16, borderRadius: 14, border: '1px solid #E5E5E5', marginTop: 14 }}>
            <b>Lot {enclos} — {liste.length} porc(s)</b>
            {liste.map((a: any) => (
              <div key={a.code} style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 10, padding: '10px 0', borderBottom: '1px solid #F5F5F5' }}>
                <span style={{ flex: 1, fontSize: 14 }}><b>{a.code}</b> — {a.categorie} — {a.sexe === 'M' ? 'Mâle' : 'Femelle'}<br /><span style={{ fontSize: 12, color: '#666' }}>Dernier poids : {a.poids_kg} kg</span></span>
                <input type='number' placeholder='Nouveau poids kg' value={poids[a.code] || ''} onChange={(e: any) => setPoids({ ...poids, [a.code]: e.target.value })} style={{ width: 160, padding: 10, border: '1px solid #DDD', borderRadius: 8 }} />
                <span style={{ fontSize: 13, color: '#666' }}>kg</span>
              </div>
            ))}
          </div>
        ))}

        <button onClick={enregistrerTout} style={{ width: '100%', marginTop: 16, background: '#16A34A', color: 'white', border: 'none', padding: 14, borderRadius: 10, fontWeight: 800, fontSize: 15, cursor: 'pointer' }}>Enregistrer toutes les pesées</button>
        {msg && <div style={{ marginTop: 12, background: '#DCFCE7', padding: 12, borderRadius: 10, fontSize: 13 }}>{msg}</div>}

        <div style={{ background: 'white', padding: 16, borderRadius: 14, border: '1px solid #E5E5E5', marginTop: 16 }}>
          <b>Historique des pesées</b>
          {pesees.length === 0 ? <p style={{ fontSize: 13, color: '#666' }}>Aucune pesée pour l'instant.</p> : pesees.slice(0, 20).map((p: any) => (<div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F5F5F5', fontSize: 13 }}><span>{p.animal_code} — Lot {p.enclos}</span><span>{fmtDate(p.date_pesee)} — <b>{p.poids_kg} kg</b></span></div>))}
        </div>
        <div style={{ marginTop: 12, background: '#F0FDF4', padding: 12, borderRadius: 12, fontSize: 12 }}>Après l'enregistrement, va sur <b>Tableau de bord</b>, choisis le lot dans le menu déroulant Gain, tu verras la vraie courbe et le vrai GMQ en g/j.</div>
      </div>
    </div>
  )
}
