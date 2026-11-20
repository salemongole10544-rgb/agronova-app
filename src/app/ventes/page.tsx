"use client"
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Page() {
  const [ventes, setVentes] = useState<any[]>([])
  const [animaux, setAnimaux] = useState<any[]>([])
  const [showVente, setShowVente] = useState(false)
  const [animalCode, setAnimalCode] = useState('')
  const [poids, setPoids] = useState('40')
  const [prixKg, setPrixKg] = useState('60000')
  const [acheteur, setAcheteur] = useState('Marché de Conakry')
  const [dateVente, setDateVente] = useState('2026-11-19')
  const [modePaiement, setModePaiement] = useState('especes')
  const [msg, setMsg] = useState('')

  const charger = async () => {
    const { data: v } = await supabase.from('ventes').select('*').order('date_vente', { ascending: false })
    setVentes(v || [])
    const { data: a } = await supabase.from('animaux').select('*').order('code')
    setAnimaux(a || [])
    const actifs = (a || []).filter((x: any) => x.statut === 'actif')
    if (actifs.length && !animalCode) { setAnimalCode(actifs[0].code); setPoids(String(actifs[0].poids_kg || 40)) }
  }
  useEffect(() => { charger() }, [])

  const total = Number(poids || 0) * Number(prixKg || 0)
  const totalVentes = ventes.reduce((s: number, x: any) => s + Number(x.total_gnf || 0), 0)
  const nbVendus = ventes.length
  const poidsVendu = ventes.reduce((s: number, x: any) => s + Number(x.poids_kg || 0), 0)
  const prixMoyen = poidsVendu ? Math.round(totalVentes / poidsVendu) : 0

  const vendre = async () => {
    const animal = animaux.find((x: any) => x.code === animalCode)
    if (!animal) { setMsg('Choisis un animal'); return }
    if (!Number(poids || 0) || Number(poids || 0) <= 0) { setMsg('Mets un poids > 0'); return }
    setMsg('Enregistrement vente...')
    // 1. Créer la vente
    const { data: vente, error: e1 } = await supabase.from('ventes').insert({ animal_code: animalCode, poids_kg: Number(poids || 0), prix_kg_gnf: Number(prixKg || 0), total_gnf: total, acheteur, date_vente: dateVente, mode_paiement: modePaiement }).select().single()
    if (e1) { setMsg('Erreur vente: ' + e1.message + ' - As-tu fait le SQL ventes ?'); return }
    // 2. Cheptel -> Vendu (automatique)
    const { error: e2 } = await supabase.from('animaux').update({ statut: 'vendu', date_vente: dateVente, prix_vente_gnf: total }).eq('code', animalCode)
    if (e2) { setMsg('Vente OK mais erreur Cheptel: ' + e2.message); return }
    // 3. Finances -> Recette automatique (pas de double compta, origine_module = vente)
    const numero = 'TX-VENTE-' + new Date().getTime()
    const { error: e3 } = await supabase.from('transactions').insert({ numero, date_tx: dateVente, type: 'vente', categorie: 'Vente porc', montant_gnf: total, mode_paiement: modePaiement, statut: total >= 500000 ? 'en_attente' : 'approuve', origine_module: 'vente', origine_id: vente.id, note: 'Vente ' + animalCode + ' - ' + poids + ' kg x ' + prixKg + ' GNF/kg - ' + acheteur })
    if (e3) { setMsg('Vente OK, Cheptel OK, mais erreur Finances: ' + e3.message); return }
    setMsg('Vente enregistrée ! ' + animalCode + ' : ' + total.toLocaleString() + ' GNF - Cheptel -> Vendu - Finances -> Recette auto' + (total >= 500000 ? ' (en attente approbation > 500 000 GNF)' : ''))
    setShowVente(false)
    charger()
  }

  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F6F7F9', color: '#111', fontFamily: 'sans-serif' }}>
      <div style={{ width: 240, background: 'white', padding: 16, borderRight: '1px solid #E5E5E5' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ width: 36, height: 36, background: '#16A34A', color: 'white', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>A</div>
          <div><div style={{ fontWeight: 900 }}>AGRONOVA</div><div style={{ fontSize: 11, color: '#666' }}>Guinee - Conakry - Elevage porcin</div></div>
        </div>
        <div style={{ fontSize: 11, marginTop: 10, color: '#16A34A' }}>Donnees synchronisees - Supabase</div>
        <div style={{ fontSize: 10, marginTop: 4, background: '#DCFCE7', display: 'inline-block', padding: '2px 6px', borderRadius: 20 }}>RLS actif</div>
        <div style={{ marginTop: 18, fontSize: 11, fontWeight: 800, color: '#999' }}>NAVIGATION</div>
        {[
          { nom: 'Tableau de bord', href: '/', actif: false },
          { nom: 'Cheptel', href: '/cheptel', actif: false },
          { nom: 'Reproduction', href: '/reproduction', actif: false },
          { nom: 'Répertoire Truies', href: '/repertoire-truies', actif: false },
          { nom: 'Alimentation', href: '/alimentation', actif: false },
          { nom: 'Ventes', href: '/ventes', actif: true },
          { nom: 'Sante', href: '/sante', actif: false },
          { nom: 'Finances', href: '/finances', actif: false },
          { nom: 'Approbations', href: '/approbations', actif: false },
          { nom: 'Rapports', href: '/rapports', actif: false },
          { nom: 'Audit & Utilisateurs', href: '/audit', actif: false },
        ].map((m: any) => (
          <a key={m.nom} href={m.href} style={{ display: 'block', padding: '10px 12px', borderRadius: 10, background: m.actif ? '#16A34A' : 'white', color: m.actif ? 'white' : '#111', fontWeight: m.actif ? 800 : 600, marginTop: 4, textDecoration: 'none', fontSize: 13 }}>{m.nom}</a>
        ))}
      </div>
      <div style={{ flex: 1, padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 900, margin: 0 }}>Ventes de porcs</h1>
            <p style={{ color: '#666', fontSize: 13, margin: '4px 0' }}>1 déclaration = Vente + Cheptel → Vendu + Finances → Recette auto. Pas de double comptabilité.</p>
          </div>
          <button onClick={() => setShowVente(true)} style={{ padding: '9px 14px', borderRadius: 20, background: '#16A34A', color: 'white', fontWeight: 800, border: 'none', cursor: 'pointer' }}>+ Vendre un porc</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 16 }}>
          {[
            { label: 'PORCS VENDUS', val: String(nbVendus), sub: 'Total' },
            { label: 'POIDS VENDU', val: poidsVendu + ' kg', sub: 'Total' },
            { label: 'TOTAL VENTES', val: totalVentes.toLocaleString() + ' GNF', sub: 'Recettes' },
            { label: 'PRIX MOYEN', val: prixMoyen.toLocaleString() + ' GNF/kg', sub: 'Moyen' },
          ].map((k: any) => (
            <div key={k.label} style={{ background: 'white', padding: 14, borderRadius: 14, border: '1px solid #E5E5E5' }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#666' }}>{k.label}</div>
              <div style={{ fontSize: 20, fontWeight: 900, marginTop: 6 }}>{k.val}</div>
              <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>{k.sub}</div>
            </div>
          ))}
        </div>
        {msg && <div style={{ marginTop: 12, padding: 10, background: '#DCFCE7', borderRadius: 10, fontSize: 13, fontWeight: 700 }}>{msg}</div>}
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid #E5E5E5', marginTop: 14, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '0.9fr 0.8fr 0.9fr 1fr 1.2fr 1fr 0.9fr', padding: '12px 16px', fontSize: 11, fontWeight: 800, color: '#666', borderBottom: '1px solid #EEE' }}>
            <span>DATE</span><span>PORC</span><span>POIDS</span><span>PRIX / KG</span><span>ACHETEUR</span><span>TOTAL</span><span>PAIEMENT</span>
          </div>
          {ventes.length === 0 ? <p style={{ padding: 16, color: '#666' }}>Aucune vente. Clique + Vendre un porc. Choisis un porc actif, mets poids + prix/kg + acheteur.</p> : ventes.map((v: any) => (
            <div key={v.id} style={{ display: 'grid', gridTemplateColumns: '0.9fr 0.8fr 0.9fr 1fr 1.2fr 1fr 0.9fr', padding: '12px 16px', borderBottom: '1px solid #F5F5F5', fontSize: 13, alignItems: 'center' }}>
              <span>{fmtDate(v.date_vente)}</span><b>{v.animal_code}</b><span>{v.poids_kg} kg</span><span>{Number(v.prix_kg_gnf || 0).toLocaleString()} GNF</span><span>{v.acheteur}</span><b>{Number(v.total_gnf || 0).toLocaleString()} GNF</b><span>{v.mode_paiement}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 12, background: '#FFFBEB', padding: 12, borderRadius: 12, fontSize: 12 }}>⚠️ Si tu vois <b>Erreur vente</b>, c'est que tu n'as pas encore créé la table ventes. Fais le SQL en bas, puis réessaie.</div>
        {showVente && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
            <div style={{ background: 'white', padding: 20, borderRadius: 16, width: 440, color: '#111' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><h2 style={{ margin: 0, fontSize: 18 }}>Vendre un porc</h2><button onClick={() => setShowVente(false)} style={{ border: 'none', background: 'none', fontSize: 20, cursor: 'pointer' }}>X</button></div>
              <p style={{ fontSize: 12, color: '#666' }}>Le porc passera en Vendu dans Cheptel, et la recette ira auto dans Finances.</p>
              <select value={animalCode} onChange={e => { setAnimalCode(e.target.value); const a = animaux.find((x: any) => x.code === e.target.value); if (a) setPoids(String(a.poids_kg || 0)) }} style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #DDD', background: 'white', color: '#111', marginTop: 10, boxSizing: 'border-box' }}>
                {animaux.filter((a: any) => a.statut === 'actif').map((a: any) => (<option key={a.id} value={a.code}>{a.code + ' - ' + a.race + ' - ' + a.poids_kg + ' kg - ' + (a.enclos || '')}</option>))}
              </select>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
                <input value={poids} onChange={e => setPoids(e.target.value)} type='number' placeholder='Poids kg' style={{ padding: 12, borderRadius: 10, border: '1px solid #DDD', background: 'white', color: '#111' }} />
                <input value={prixKg} onChange={e => setPrixKg(e.target.value)} type='number' placeholder='Prix GNF/kg' style={{ padding: 12, borderRadius: 10, border: '1px solid #DDD', background: 'white', color: '#111' }} />
              </div>
              <input value={acheteur} onChange={e => setAcheteur(e.target.value)} placeholder='Acheteur' style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #DDD', background: 'white', color: '#111', marginTop: 10, boxSizing: 'border-box' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
                <input type='date' value={dateVente} onChange={e => setDateVente(e.target.value)} style={{ padding: 12, borderRadius: 10, border: '1px solid #DDD', background: 'white', color: '#111' }} />
                <select value={modePaiement} onChange={e => setModePaiement(e.target.value)} style={{ padding: 12, borderRadius: 10, border: '1px solid #DDD', background: 'white', color: '#111' }}><option value='especes'>Espèces</option><option value='mobile_money'>Mobile Money</option><option value='virement'>Virement</option><option value='credit'>Crédit</option></select>
              </div>
              <div style={{ background: '#F0FDF4', padding: 10, borderRadius: 10, fontSize: 13, fontWeight: 800, marginTop: 10 }}>Total : {total.toLocaleString()} GNF {total >= 500000 ? ' - En attente approbation (> 500 000 GNF)' : ''}</div>
              <button onClick={vendre} style={{ width: '100%', padding: 14, borderRadius: 12, background: '#16A34A', color: 'white', fontWeight: 900, border: 'none', marginTop: 12, cursor: 'pointer' }}>Confirmer la vente</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
