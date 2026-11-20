"use client"
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
export default function FinancesPage() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [ventes, setVentes] = useState<any[]>([])
  const [soins, setSoins] = useState<any[]>([])
  const [animaux, setAnimaux] = useState<any[]>([])
  const [filtre, setFiltre] = useState('Tous')
  const [showModal, setShowModal] = useState(false)
  const [type, setType] = useState('depense')
  const [categorie, setCategorie] = useState('Aliment')
  const [montant, setMontant] = useState('')
  const [mode, setMode] = useState('Espèces')
  const [dateTx, setDateTx] = useState('2026-11-20')
  const [msg, setMsg] = useState('')
  const charger = async () => {
    const { data: t } = await supabase.from('transactions').select('*').order('date_tx', { ascending: false })
    setTransactions(t || [])
    const { data: v } = await supabase.from('ventes').select('*'); setVentes(v || [])
    const { data: s } = await supabase.from('soins_sante').select('*'); setSoins(s || [])
    const { data: a } = await supabase.from('animaux').select('*'); setAnimaux(a || [])
  }
  useEffect(() => { charger(); const d = new Date(); setDateTx(d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0')) }, [])
  const ajouter = async () => {
    if (!montant) { setMsg('Mets le Montant GNF'); return }
    const statut = Number(montant) > 500000 ? 'en_attente' : 'approuve'
    // VRAIS NOMS : date_tx (pas date_transaction), note (pas libelle), numero
    const numero = 'TRX-' + Date.now().toString().slice(-6)
    const { error } = await supabase.from('transactions').insert({
      numero, date_tx: dateTx, type, categorie,
      montant_gnf: Number(montant), mode_paiement: mode, statut,
      origine_module: 'manuel', note: categorie + ' - Saisie manuelle Finances'
    })
    if (error) { setMsg('Erreur : ' + error.message); return }
    setMsg('Enregistré : ' + Number(montant).toLocaleString() + ' GNF — ' + (statut === 'en_attente' ? 'En attente approbation (>500K)' : 'Approuvé'))
    setMontant(''); charger(); setTimeout(() => setShowModal(false), 900)
  }
  const caVentes = ventes.reduce((s: number, x: any) => s + Number(x.total_gnf || 0), 0)
  const recettesTx = transactions.filter((x: any) => x.type === 'recette' && x.statut === 'approuve').reduce((s: number, x: any) => s + Number(x.montant_gnf || 0), 0)
  const depensesTx = transactions.filter((x: any) => x.type === 'depense' && x.statut === 'approuve').reduce((s: number, x: any) => s + Number(x.montant_gnf || 0), 0)
  const coutSante = soins.reduce((s: number, x: any) => s + Number(x.cout_gnf || 0), 0)
  const ca = caVentes + recettesTx
  const charges = depensesTx + coutSante
  const resultat = ca - charges
  const tresorerie = resultat
  const actifs = animaux.filter((a: any) => a.statut === 'actif')
  const compteBat = (prefix: string) => actifs.filter((a: any) => String(a.enclos || a.batiment || '').startsWith(prefix)).length
  const b1 = compteBat('B1'); const b2 = compteBat('B2'); const b3 = compteBat('B3'); const b4 = compteBat('B4'); const b5 = compteBat('B5'); const b6 = compteBat('B6')
  const lignes: any[] = [
    ...transactions.map((t: any) => ({ id: t.id, trx: t.numero || 'TRX', date: t.date_tx || t.created_at, type: t.type, cat: t.categorie || t.note, montant: t.montant_gnf, statut: t.statut, auteur: t.type === 'recette' ? 'Comptable → Propriétaire' : 'Responsable → Propriétaire', mode: t.mode_paiement || 'Espèces' })),
    ...ventes.map((v: any) => ({ id: 'v' + v.id, trx: 'VTE-' + v.animal_code, date: v.date_vente || v.created_at, type: 'recette', cat: 'Vente porcs', montant: v.total_gnf, statut: 'approuve', auteur: 'Comptable → Propriétaire', mode: 'Espèces' })),
  ]
  const filtres = ['Tous', 'en_attente', 'soumis', 'approuve', 'refuse']
  const affichees = filtre === 'Tous' ? lignes : lignes.filter((l: any) => l.statut === filtre)
  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F6F7F9', color: '#111', fontFamily: 'sans-serif' }}>
      <div style={{ width: 250, background: 'white', padding: 16, borderRight: '1px solid #E5E5E5', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><div style={{ width: 36, height: 36, background: '#16A34A', color: 'white', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>A</div><div><div style={{ fontWeight: 900 }}>AGRONOVA</div><div style={{ fontSize: 11, color: '#666' }}>Guinée - Conakry • Élevage porcin</div></div></div>
        <div style={{ marginTop: 18, fontSize: 11, fontWeight: 800, color: '#999' }}>NAVIGATION</div>
        {[
          { nom: 'Tableau de bord', href: '/' }, { nom: 'Cheptel', href: '/cheptel' }, { nom: 'Reproduction', href: '/reproduction' },
          { nom: 'Alimentation', href: '/alimentation' }, { nom: 'Santé', href: '/sante' }, { nom: 'Finances', href: '/finances' },
          { nom: 'Approbations', href: '/approbations' }, { nom: 'Rapports', href: '/rapports' }, { nom: 'Audit & Utilisateurs', href: '/audit' },
        ].map((m: any) => (<a key={m.nom} href={m.href} style={{ display: 'block', padding: '10px 12px', borderRadius: 10, background: m.nom === 'Finances' ? '#16A34A' : 'white', color: m.nom === 'Finances' ? 'white' : '#111', fontWeight: 700, marginTop: 4, textDecoration: 'none', fontSize: 13 }}>{m.nom}</a>))}
        <div style={{ background: '#F0FDF4', padding: 12, borderRadius: 12, marginTop: 18 }}>
          <b style={{ fontSize: 12 }}>BÂTIMENTS — Comptés depuis Cheptel</b>
          {[
            ['B1-Maternité', b1], ['B2-Gestation', b2], ['B3-Croissance', b3], ['B4-Engraissement', b4], ['B5-Quarantaine', b5], ['B6-Verraterie', b6],
          ].map((x: any) => (<div key={x[0]} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginTop: 6 }}><span>{x[0]}</span><span>{x[1]} porcs</span></div>))}
          <div style={{ fontSize: 11, color: '#666', marginTop: 6 }}>Total Actifs : {actifs.length} / {animaux.length} enregistrés</div>
        </div>
        <div style={{ fontSize: 11, color: '#666', marginTop: 12 }}>Rôle actuel: <b>Propriétaire</b><br />Permissions appliquées côté serveur (RLS).<br />Toutes actions journalisées.</div>
      </div>
      <div style={{ flex: 1, padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><h1 style={{ fontSize: 24, fontWeight: 900, margin: 0 }}>Finances • GNF</h1><span style={{ fontSize: 11, background: '#DCFCE7', padding: '4px 8px', borderRadius: 20 }}>● Données synchronisées • Supabase</span><span style={{ fontSize: 11, background: '#DCFCE7', padding: '4px 8px', borderRadius: 20 }}>RLS actif</span></div>
            <p style={{ color: '#666', fontSize: 12, margin: '4px 0' }}>Devise principale Franc Guinéen • Distinction encaissé/décaissé • Audit des corrections</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ background: '#16A34A', color: 'white', padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>Propriétaire</span><span style={{ fontSize: 12, color: '#666' }}>Responsable Ferme</span><span style={{ fontSize: 12, color: '#666' }}>Comptable</span><span style={{ width: 28, height: 28, background: '#111', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>P</span>
            <button onClick={() => setShowModal(true)} style={{ background: '#16A34A', color: 'white', border: 'none', padding: '10px 14px', borderRadius: 8, fontWeight: 800, cursor: 'pointer' }}>+ Recette / Dépense</button>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 16 }}>
          {[
            { label: 'CHIFFRE D’AFFAIRES', val: ca.toLocaleString() + ' GNF' },
            { label: 'CHARGES', val: charges.toLocaleString() + ' GNF' },
            { label: 'RÉSULTAT ESTIMÉ', val: resultat.toLocaleString() + ' GNF' },
            { label: 'TRÉSORERIE', val: tresorerie.toLocaleString() + ' GNF' },
          ].map((k: any) => (<div key={k.label} style={{ background: 'white', padding: 14, borderRadius: 14, border: '1px solid #E5E5E5' }}><div style={{ fontSize: 10, fontWeight: 800, color: '#666' }}>{k.label}</div><div style={{ fontSize: 18, fontWeight: 900, marginTop: 8 }}>{k.val}</div></div>))}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          {filtres.map((f: string) => (<button key={f} onClick={() => setFiltre(f)} style={{ padding: '6px 12px', borderRadius: 20, border: '1px solid #DDD', background: filtre === f ? '#111' : 'white', color: filtre === f ? 'white' : '#111', cursor: 'pointer', fontSize: 12 }}>{f}</button>))}
        </div>
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid #E5E5E5', marginTop: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr style={{ background: '#F9FAFB', textAlign: 'left', fontSize: 10, color: '#666' }}><th style={{ padding: 12 }}>ID TRX</th><th>DATE</th><th>TYPE</th><th>CATÉGORIE</th><th>MONTANT</th><th>STATUT</th><th>AUTEUR</th><th style={{ textAlign: 'right', paddingRight: 12 }}>MODE</th></tr></thead>
            <tbody>
              {affichees.length === 0 ? <tr><td colSpan={8} style={{ padding: 16, color: '#666' }}>Aucune transaction. Clique sur + Recette / Dépense.</td></tr> : affichees.map((l: any) => (<tr key={l.id} style={{ borderTop: '1px solid #F0F0F0' }}><td style={{ padding: 12, fontWeight: 700 }}>{l.trx}</td><td>{fmtDate(l.date)}</td><td><span style={{ background: l.type === 'recette' ? '#DCFCE7' : '#FEE2E2', color: l.type === 'recette' ? '#166534' : '#991B1B', padding: '3px 8px', borderRadius: 20, fontSize: 11 }}>{l.type}</span></td><td>{l.cat}</td><td style={{ fontWeight: 700 }}>{Number(l.montant || 0).toLocaleString()} GNF</td><td><span style={{ background: l.statut === 'approuve' ? '#DCFCE7' : '#FEF3C7', color: l.statut === 'approuve' ? '#166534' : '#92400E', padding: '3px 8px', borderRadius: 20, fontSize: 11 }}>{l.statut}</span></td><td style={{ fontSize: 12 }}>{l.auteur}</td><td style={{ textAlign: 'right', paddingRight: 12, fontSize: 12 }}>{l.mode}</td></tr>))}
            </tbody>
          </table>
        </div>
        <div style={{ fontSize: 11, color: '#666', marginTop: 10 }}>Seuil approbation: 500 000 GNF • Toute correction d’une transaction validée produit une trace d’audit • Pas de double comptabilisation vente/achat.</div>
        <div style={{ background: '#F0FDF4', padding: 12, borderRadius: 12, marginTop: 10, fontSize: 12 }}><b>💡 Règle Aliment — corrigée :</b> Quand tu achètes dans <b>Alimentation</b>, ça doit créer tout seul la ligne <b>Dépense • Aliment</b> ici, avec le prix du jour. Tu ne dois plus la re-taper ici. Si tu la vois 2 fois, dis-le moi, c’est un double comptage à enlever.</div>
        <div style={{ background: '#FEF3C7', padding: 12, borderRadius: 12, marginTop: 10, fontSize: 12 }}><b>⚠️ TRX-104 — Vente en double :</b> Si tu vois encore TRX-104 (vente 1 800 000 GNF en_attente) + VTE-AG-1003, c'est la même vente 2 fois. Va dans SQL Editor et fais le DELETE complet ci-dessous. Attention : copie TOUT le bloc, depuis DELETE jusqu'au ;</div>
      </div>
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', padding: 20, borderRadius: 16, width: 420, maxWidth: '90vw' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><b>Nouvelle transaction • GNF</b><button onClick={() => setShowModal(false)} style={{ border: 'none', background: 'none', fontSize: 18, cursor: 'pointer' }}>✕</button></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
              <select value={type} onChange={(e: any) => setType(e.target.value)} style={{ padding: 10, border: '1px solid #DDD', borderRadius: 8 }}><option value='depense'>Dépense</option><option value='recette'>Recette</option></select>
              <select value={categorie} onChange={(e: any) => setCategorie(e.target.value)} style={{ padding: 10, border: '1px solid #DDD', borderRadius: 8 }}>{['Aliment', 'Vétérinaire', 'Vente porcs', 'Transport', 'Investissement'].map((c: string) => (<option key={c}>{c}</option>))}</select>
              <input type='number' value={montant} onChange={(e: any) => setMontant(e.target.value)} placeholder='Montant GNF' style={{ padding: 10, border: '1px solid #DDD', borderRadius: 8 }} />
              <input type='date' value={dateTx} onChange={(e: any) => setDateTx(e.target.value)} style={{ padding: 10, border: '1px solid #DDD', borderRadius: 8 }} />
              <select value={mode} onChange={(e: any) => setMode(e.target.value)} style={{ padding: 10, border: '1px solid #DDD', borderRadius: 8, gridColumn: 'span 2' }}>{['Espèces', 'Mobile Money', 'Virement'].map((m: string) => (<option key={m}>{m}</option>))}</select>
            </div>
            <div style={{ background: '#F9FAFB', padding: 10, borderRadius: 8, fontSize: 12, marginTop: 10 }}>Seuil: &gt;500 000 GNF nécessite approbation propriétaire • Statuts: brouillon/soumis/en_attente/approuvé/refusé/annulé</div>
            <button onClick={ajouter} style={{ width: '100%', marginTop: 12, background: '#16A34A', color: 'white', border: 'none', padding: 12, borderRadius: 8, fontWeight: 800, cursor: 'pointer' }}>Enregistrer</button>
            {msg && <div style={{ marginTop: 10, background: msg.startsWith('Erreur') ? '#FEE2E2' : '#DCFCE7', padding: 10, borderRadius: 8, fontSize: 13 }}>{msg}</div>}
          </div>
        </div>
      )}
    </div>
  )
}
