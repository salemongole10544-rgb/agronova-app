"use client"
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
export default function DashboardPage() {
  const [animaux, setAnimaux] = useState<any[]>([])
  const [ventes, setVentes] = useState<any[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [soins, setSoins] = useState<any[]>([])
  const [mouvements, setMouvements] = useState<any[]>([])
  const [pesees, setPesees] = useState<any[]>([])
  const [portees, setPortes] = useState<any[]>([])
  const [stockReel, setStockReel] = useState<string>('')
  const charger = async () => {
    const { data: a } = await supabase.from('animaux').select('*'); setAnimaux(a || [])
    const { data: v } = await supabase.from('ventes').select('*'); setVentes(v || [])
    const { data: t } = await supabase.from('transactions').select('*'); setTransactions(t || [])
    const { data: s } = await supabase.from('soins_sante').select('*'); setSoins(s || [])
    const { data: m } = await supabase.from('mouvements_stock_aliment').select('*'); setMouvements(m || [])
    const { data: p } = await supabase.from('pesees').select('*').order('date_pesee', { ascending: true }); setPesees(p || [])
    const { data: po } = await supabase.from('portees').select('*'); setPortes(po || [])
  }
  useEffect(() => { charger() }, [])
  const caVentes = ventes.reduce((s: number, x: any) => s + Number(x.total_gnf || 0), 0)
  const recettesTx = transactions.filter((x: any) => x.type === 'recette' && x.statut === 'approuve').reduce((s: number, x: any) => s + Number(x.montant_gnf || 0), 0)
  const depensesTx = transactions.filter((x: any) => x.type === 'depense' && x.statut === 'approuve').reduce((s: number, x: any) => s + Number(x.montant_gnf || 0), 0)
  const coutSante = soins.reduce((s: number, x: any) => s + Number(x.cout_gnf || 0), 0)
  const chiffreAffaires = caVentes + recettesTx
  const charges = depensesTx + coutSante
  const tresorerie = chiffreAffaires - charges
  const enAttente = transactions.filter((x: any) => x.statut === 'en_attente').length
  const actifs = animaux.filter((a: any) => a.statut === 'actif')
  const vendus = animaux.filter((a: any) => a.statut === 'vendu')
  const effectif = actifs.length
  const truiesGestantes = actifs.filter((a: any) => a.categorie === 'truie_gestante').length
  const porcelets = actifs.filter((a: any) => a.categorie === 'porcelet').length
  const reproducteurs = actifs.filter((a: any) => a.categorie === 'reproducteur').length
  const compteBat = (prefix: string) => actifs.filter((a: any) => String(a.enclos || a.batiment || '').startsWith(prefix)).length
  const b1 = compteBat('B1'); const b2 = compteBat('B2'); const b3 = compteBat('B3'); const b4 = compteBat('B4'); const b5 = compteBat('B5'); const b6 = compteBat('B6')
  const e01Vendu = vendus.filter((a: any) => String(a.enclos || '').startsWith('E0')).length
  const totalBatActifs = b1 + b2 + b3 + b4 + b5 + b6
  const stockTheorique = mouvements.reduce((s: number, m: any) => {
    if (m.type === 'achat') return s + Number(m.quantite || 0)
    if (m.type === 'sortie' || m.type === 'consommation' || m.type === 'distribution') return s - Number(m.quantite || 0)
    return s
  }, 0)
  const stockKg = stockReel !== '' ? Number(stockReel) : stockTheorique
  // VRAIES RATIONS du propriétaire - 20 nov 2026
  // Porcelets : 1 kg / porc / jour, Truies gestantes : 2.5 kg, Verrat : 3 kg
  const consoJour = porcelets * 1 + truiesGestantes * 2.5 + reproducteurs * 3
  const stockJours = consoJour > 0 ? Math.round(stockKg / consoJour) : 0
  const moisNoms = ['Déc', 'Jan', 'Fév', 'Mar', 'Avr', 'Mai']
  const naissancesParMois = [0, 0, 0, 0, 0, 0]
  portees.forEach((po: any) => {
    const d = po.date_mise_bas || po.date_naissance || po.created_at
    if (d) {
      const mois = new Date(d).getMonth()
      const map: Record<number, number> = { 11: 0, 0: 1, 1: 2, 2: 3, 3: 4, 4: 5 }
      const idx = map[mois]
      if (idx !== undefined) naissancesParMois[idx] += Number(po.nes_vivants || po.nb_nes_vivants || po.nb_nes || 0)
    }
  })
  const naissances = naissancesParMois.reduce((s, v) => s + v, 0)
  const maxNaiss = Math.max(1, ...naissancesParMois)
  const peseesE01 = pesees.filter((p: any) => String(p.animal_code || p.animal_id || '').includes('AG-1003'))
  const poidsActuel = peseesE01.length > 0 ? Number(peseesE01[peseesE01.length - 1].poids_kg || 0) : 0
  const menu = [
    { nom: 'Tableau de bord', href: '/' }, { nom: 'Cheptel', href: '/cheptel' }, { nom: 'Reproduction', href: '/reproduction' },
    { nom: 'Répertoire Truies', href: '/repertoire-truies' }, { nom: 'Alimentation', href: '/alimentation' }, { nom: 'Ventes', href: '/ventes' },
    { nom: 'Pesées', href: '/pesees' }, { nom: 'Sante', href: '/sante' }, { nom: 'Finances', href: '/finances' },
    { nom: 'Approbations', href: '/approbations' }, { nom: 'Rapports', href: '/rapports' }, { nom: 'Audit & Utilisateurs', href: '/audit' },
  ]
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F6F7F9', color: '#111', fontFamily: 'sans-serif' }}>
      <div style={{ width: 250, background: 'white', padding: 16, borderRight: '1px solid #E5E5E5', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><div style={{ width: 36, height: 36, background: '#16A34A', color: 'white', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>A</div><div><div style={{ fontWeight: 900 }}>AGRONOVA</div><div style={{ fontSize: 11, color: '#666' }}>Guinée - Conakry • Élevage porcin</div></div></div>
        <div style={{ fontSize: 11, color: '#16A34A', marginTop: 8 }}>● Données synchronisées • Supabase<br /><span style={{ color: '#666' }}>RLS actif</span></div>
        <div style={{ marginTop: 18, fontSize: 11, fontWeight: 800, color: '#999' }}>NAVIGATION</div>
        {menu.map((m: any) => (<a key={m.nom} href={m.href} style={{ display: 'block', padding: '10px 12px', borderRadius: 10, background: m.nom === 'Tableau de bord' ? '#16A34A' : 'white', color: m.nom === 'Tableau de bord' ? 'white' : '#111', fontWeight: 700, marginTop: 4, textDecoration: 'none', fontSize: 13 }}>{m.nom}{m.nom === 'Approbations' && enAttente > 0 ? '  • ' + enAttente : ''}</a>))}
        <div style={{ background: '#F0FDF4', padding: 12, borderRadius: 12, marginTop: 18 }}>
          <b style={{ fontSize: 12 }}>BÂTIMENTS — Comptés depuis Cheptel</b>
          {[
            ['B1-Maternité', b1], ['B2-Gestation', b2], ['B3-Croissance', b3], ['B4-Engraissement', b4], ['B5-Quarantaine', b5], ['B6-Verraterie', b6],
          ].map((x: any) => (<div key={x[0]} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginTop: 6 }}><span>{x[0]}</span><span>{x[1]} porcs</span></div>))}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginTop: 6, borderTop: '1px solid #D1FAE5', paddingTop: 6 }}><span>Enclos E01-E12</span><span>{e01Vendu} porc(s) vendu(s)</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginTop: 6, fontWeight: 800 }}><span>Total Actifs</span><span>{totalBatActifs} / {effectif}</span></div>
          <div style={{ fontSize: 11, color: '#666', marginTop: 6 }}>Total Enregistrés : {animaux.length} (14 actifs + {vendus.length} vendu(s))</div>
        </div>
      </div>
      <div style={{ flex: 1, padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div><h1 style={{ fontSize: 24, fontWeight: 900, margin: 0 }}>Tableau de bord</h1><p style={{ color: '#666', fontSize: 12 }}>Vue d'ensemble • {effectif} porcs actifs • {animaux.length} enregistrés • 6 bâtiments • Mise à jour à l'instant</p></div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><span style={{ background: '#16A34A', color: 'white', padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>Propriétaire</span><span style={{ fontSize: 12, color: '#666' }}>Responsable Ferme</span><span style={{ fontSize: 12, color: '#666' }}>Comptable</span><span style={{ width: 28, height: 28, background: '#111', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>P</span></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginTop: 16 }}>
          <div style={{ background: 'white', padding: 14, borderRadius: 14, border: '1px solid #E5E5E5' }}><div style={{ fontSize: 10, fontWeight: 800, color: '#666' }}>● EFFECTIF TOTAL</div><div style={{ fontSize: 22, fontWeight: 900, marginTop: 8 }}>{effectif}</div><div style={{ fontSize: 11, color: '#666' }}>{animaux.length} enregistrés • {effectif} actifs</div></div>
          <div style={{ background: 'white', padding: 14, borderRadius: 14, border: '1px solid #E5E5E5' }}><div style={{ fontSize: 10, fontWeight: 800, color: '#666' }}>● TRUIES GESTANTES</div><div style={{ fontSize: 22, fontWeight: 900, marginTop: 8 }}>{truiesGestantes}</div><div style={{ fontSize: 11, color: '#666' }}>3 × 2.5 kg/j = 7.5 kg/j</div></div>
          <div style={{ background: 'white', padding: 14, borderRadius: 14, border: '1px solid #E5E5E5' }}><div style={{ fontSize: 10, fontWeight: 800, color: '#666' }}>● PORCELETS</div><div style={{ fontSize: 22, fontWeight: 900, marginTop: 8 }}>{porcelets}</div><div style={{ fontSize: 11, color: '#666' }}>10 × 1 kg/j = 10 kg/j</div></div>
          <div style={{ background: 'white', padding: 14, borderRadius: 14, border: '1px solid #E5E5E5' }}><div style={{ fontSize: 10, fontWeight: 800, color: '#666' }}>● STOCK ALIMENT</div><div style={{ fontSize: 22, fontWeight: 900, marginTop: 8 }}>{stockJours}j</div><div style={{ fontSize: 11, color: '#666' }}>{stockKg.toLocaleString()} kg • {consoJour.toFixed(1)} kg/jour • VRAIES RATIONS</div><div style={{ marginTop: 8 }}><input value={stockReel} onChange={(e: any) => setStockReel(e.target.value)} placeholder='Comptage réel kg (ex: 2940)' style={{ width: '100%', padding: 6, border: '1px solid #DDD', borderRadius: 6, fontSize: 12 }} /><div style={{ fontSize: 10, color: '#666', marginTop: 4 }}>Si tu mets 2940, tu auras 143j (2940 ÷ 20.5). C'est ton 147j d'avant.</div></div></div>
          <div style={{ background: 'white', padding: 14, borderRadius: 14, border: '2px solid #16A34A' }}><div style={{ fontSize: 10, fontWeight: 800, color: '#666' }}>● TRÉSORERIE</div><div style={{ fontSize: 20, fontWeight: 900, marginTop: 8, color: tresorerie >= 0 ? '#16A34A' : '#DC2626' }}>{tresorerie.toLocaleString()} GNF</div><div style={{ fontSize: 11, color: '#666' }}>GNF • Même formule que Finances</div><div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>CA {chiffreAffaires.toLocaleString()} - Charges {charges.toLocaleString()}</div></div>
          <div style={{ background: 'white', padding: 14, borderRadius: 14, border: '1px solid #E5E5E5' }}><div style={{ fontSize: 10, fontWeight: 800, color: '#666' }}>● TRANSACTIONS EN ATTENTE</div><div style={{ fontSize: 22, fontWeight: 900, marginTop: 8 }}>{enAttente}</div><div style={{ fontSize: 11, color: '#666' }}>Vente ou dépense à approuver</div></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14, marginTop: 14 }}>
          <div style={{ background: 'white', padding: 16, borderRadius: 14, border: '1px solid #E5E5E5' }}>
            <b>Naissances & Mortalité (6 mois) — Vraies dates</b>
            <div style={{ fontSize: 12, color: '#666', marginTop: 8 }}>Données réelles : {naissances} nés vivants sur portée(s).</div>
            <div style={{ display: 'flex', gap: 20, marginTop: 16, alignItems: 'flex-end', height: 120 }}>
              {['Déc', 'Jan', 'Fév', 'Mar', 'Avr', 'Mai'].map((mois: string, i: number) => (<div key={mois} style={{ textAlign: 'center', flex: 1 }}><div style={{ background: '#16A34A', height: Math.max(6, (naissancesParMois[i] / maxNaiss) * 100), borderRadius: 6, marginBottom: 4 }}></div><div style={{ fontSize: 11 }}>{mois}</div><div style={{ fontSize: 10, color: '#666' }}>{naissancesParMois[i]} nés</div></div>))}
            </div>
          </div>
          <div style={{ background: 'white', padding: 16, borderRadius: 14, border: '1px solid #E5E5E5' }}>
            <b>Gain moyen quotidien</b>
            <div style={{ fontSize: 12, marginTop: 8 }}>Lot E01 - AG-1003 (1 porc)</div>
            <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{peseesE01.length} pesée(s) réelle(s) • 19 nov. 2026 → 20 nov. 2026</div>
            <div style={{ fontSize: 13, marginTop: 10 }}>{poidsActuel} kg — le 20 nov. 2026</div>
            <div style={{ background: '#FEF3C7', padding: 10, borderRadius: 8, fontSize: 12, marginTop: 10 }}>Pas de GMQ sur le même jour. Repèse dans 15 jours pour un vrai GMQ.</div>
            <div style={{ marginTop: 10, fontSize: 12 }}><b>+ Nouvelle pesée E01 - AG-1003</b><div style={{ display: 'flex', gap: 8, marginTop: 6 }}><a href='/pesees' style={{ flex: 1, background: '#16A34A', color: 'white', textAlign: 'center', padding: 10, borderRadius: 8, fontWeight: 800, textDecoration: 'none' }}>Aller à Pesées</a></div></div>
          </div>
        </div>
        <div style={{ background: '#F0FDF4', padding: 12, borderRadius: 12, marginTop: 12, fontSize: 12 }}>
          <b>✅ Vraies rations du 20 nov. 2026 :</b> Porcelets 10 × 1 kg = 10 kg/j • Truies gestantes 3 × 2.5 kg = 7.5 kg/j • Verrat 1 × 3 kg = 3 kg/j • <b>Total 20.5 kg/j</b> • Stock 2 940 kg ÷ 20.5 = <b>143j</b> (ton 147j d'avant, à 4j près) • Trésorerie = Finances : <b>{chiffreAffaires.toLocaleString()} - {charges.toLocaleString()} = {tresorerie.toLocaleString()} GNF</b>
        </div>
        <div style={{ background: 'white', padding: 14, borderRadius: 12, border: '1px solid #E5E5E5', marginTop: 12, fontSize: 13 }}>
          <b>🍽️ Donner à manger — 1 clic par jour</b>
          <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>Demain matin, tu cliques ici dans Alimentation : B3 -10 kg, B1 -7.5 kg, B6 -3 kg. Le stock descend tout seul, et Finances calcule le coût de ce que tes porcs ont VRAIMENT mangé, pas ce que tu as acheté.</div>
          <a href='/alimentation' style={{ display: 'inline-block', marginTop: 8, background: '#16A34A', color: 'white', padding: '10px 14px', borderRadius: 8, fontWeight: 800, textDecoration: 'none' }}>Aller à Alimentation → Donner à manger</a>
        </div>
      </div>
    </div>
  )
}
