"use client"
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
// RATIONS - VRAIES, 20 nov 2026, + B4 engraissement
// Porcelet 1 kg, Truie gestante 2.5 kg, Verrat / Reproducteur 3 kg, Engraissement 3 kg, Truie vide 2.5 kg
const RATION: Record<string, number> = { porcelet: 1, truie_gestante: 2.5, truie_vide: 2.5, reproducteur: 3, engraissement: 3 }
const rationPour = (cat: string) => RATION[cat] ?? 2.5
export default function AlimentationPage() {
  const [mouvements, setMouvements] = useState<any[]>([])
  const [animaux, setAnimaux] = useState<any[]>([])
  const [alimentsRef, setAlimentsRef] = useState<any[]>([])
  const [showAchat, setShowAchat] = useState(false)
  const [showConso, setShowConso] = useState(false)
  const [alimentId, setAlimentId] = useState('')
  const [qte, setQte] = useState('')
  const [prixKg, setPrixKg] = useState('')
  const [dateMvt, setDateMvt] = useState('2026-11-20')
  const [msg, setMsg] = useState('')
  const [msgType, setMsgType] = useState('ok')
  const [lotConso, setLotConso] = useState('B3-Croissance')
  const charger = async () => {
    const { data: m } = await supabase.from('mouvements_stock_aliment').select('*').order('created_at', { ascending: false }); setMouvements(m || [])
    const { data: a } = await supabase.from('animaux').select('*'); setAnimaux(a || [])
    const { data: al } = await supabase.from('aliments').select('*')
    if (al) {
      setAlimentsRef(al)
      // CORRIGÉ : on ne prend plus le 1er aliment (Tourteau). On cherche Aliments composés en priorité.
      const pref = al.find((x: any) => String(x.nom || '').toLowerCase().includes('compos'))
      const choisi = pref ? pref.id : al[0]?.id
      if (choisi && !alimentId) setAlimentId(choisi)
    }
  }
  useEffect(() => { charger(); const d = new Date(); setDateMvt(d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0')) }, [])
  const actifs = animaux.filter((a: any) => a.statut === 'actif')
  // LOTS DYNAMIQUES : lus depuis Cheptel, pas écrits en dur. Si tu ajoutes B4, B2, E01, ils apparaissent tout seuls ici.
  const lotsMap: Record<string, any[]> = {}
  actifs.forEach((a: any) => { const lot = a.enclos || a.batiment || 'Sans enclos'; if (!lotsMap[lot]) lotsMap[lot] = []; lotsMap[lot].push(a) })
  const lots = Object.keys(lotsMap).sort().map((lot: string) => {
    const liste = lotsMap[lot]
    const kg = liste.reduce((s: number, x: any) => s + rationPour(x.categorie), 0)
    const desc = liste.map((x: any) => x.categorie).filter((v: string, i: number, arr: string[]) => arr.indexOf(v) === i).map((cat: string) => { const n = liste.filter((x: any) => x.categorie === cat).length; return n + ' x ' + cat + ' x ' + rationPour(cat) + ' kg' }).join(' + ')
    return { lot, liste, kg, desc, nb: liste.length }
  })
  const consoJour = lots.reduce((s: number, l: any) => s + l.kg, 0)
  const totalAchats = mouvements.filter((m: any) => m.type === 'achat').reduce((s: number, m: any) => s + Number(m.quantite || 0), 0)
  const totalConso = mouvements.filter((m: any) => m.type === 'consommation' || m.type === 'sortie' || m.type === 'distribution').reduce((s: number, m: any) => s + Number(m.quantite || 0), 0)
  const stockTotal = totalAchats - totalConso
  const stockJours = consoJour > 0 ? Math.round(stockTotal / consoJour) : 0
  const nomAliment = (m: any) => { if (m.aliment_id) { const f = alimentsRef.find((x: any) => x.id === m.aliment_id); if (f) return f.nom || f.libelle || 'Aliment' } return 'Aliments composés (ancien achat sans aliment_id)' }
  const donnerAManger = async (lot: string, kg: number) => {
    setMsg('Envoi : ' + lot + ' - ' + kg + ' kg...'); setMsgType('ok')
    const payload: any = { type: 'consommation', quantite: kg, lot_code: lot, date_mouvement: dateMvt, motif: 'Distribution ' + lot + ' - ' + kg + ' kg', cout_gnf: 0 }
    if (alimentId) payload.aliment_id = alimentId
    const { error } = await supabase.from('mouvements_stock_aliment').insert(payload)
    if (error) { setMsg('ERREUR - Pas enregistré : ' + error.message); setMsgType('err'); return }
    setMsg('OK - Distribué : ' + lot + ' - ' + kg + ' kg. Regarde Mouvements, la ligne doit dire LOT = ' + lot + ', pas B6.'); setMsgType('ok')
    await charger()
  }
  const donnerTout = async () => {
    for (const l of lots) { await donnerAManger(l.lot, l.kg) }
    setMsg('Repas du jour : ' + consoJour.toFixed(1) + ' kg au total pour ' + lots.length + ' lots. Chaque lot a sa propre ligne, avec son vrai LOT.'); setMsgType('ok')
    await charger()
  }
  const ajouterAchat = async () => {
    if (!qte) { setMsg('Mets la quantité kg'); setMsgType('err'); return }
    const payload: any = { type: 'achat', quantite: Number(qte), date_mouvement: dateMvt, cout_gnf: prixKg && qte ? Math.round(Number(qte) * Number(prixKg)) : 0, motif: 'Achat - ' + qte + ' kg', lot_code: 'Stock général' }
    if (alimentId) payload.aliment_id = alimentId
    const { error } = await supabase.from('mouvements_stock_aliment').insert(payload)
    if (error) { setMsg('ERREUR Achat : ' + error.message); setMsgType('err'); return }
    const total = Number(qte) * (prixKg ? Number(prixKg) : 0)
    if (total > 0) { await supabase.from('transactions').insert({ numero: 'TRX-' + Date.now().toString().slice(-6), date_tx: dateMvt, type: 'depense', categorie: 'Aliment', montant_gnf: total, mode_paiement: 'Espèces', statut: total > 500000 ? 'en_attente' : 'approuve', origine_module: 'alimentation', note: 'Achat aliment - ' + qte + ' kg' }) }
    setMsg('Achat enregistré : ' + qte + ' kg'); setMsgType('ok'); setQte(''); await charger(); setTimeout(() => setShowAchat(false), 900)
  }
  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F6F7F9', color: '#111', fontFamily: 'sans-serif' }}>
      <div style={{ width: 250, background: 'white', padding: 16, borderRight: '1px solid #E5E5E5', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><div style={{ width: 36, height: 36, background: '#16A34A', color: 'white', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>A</div><div><div style={{ fontWeight: 900 }}>AGRONOVA</div><div style={{ fontSize: 11, color: '#666' }}>Guinée - Conakry • Élevage porcin</div></div></div>
        <div style={{ marginTop: 18, fontSize: 11, fontWeight: 800, color: '#999' }}>NAVIGATION</div>
        {[
          { nom: 'Tableau de bord', href: '/' }, { nom: 'Cheptel', href: '/cheptel' }, { nom: 'Reproduction', href: '/reproduction' },
          { nom: 'Alimentation', href: '/alimentation' }, { nom: 'Sante', href: '/sante' }, { nom: 'Finances', href: '/finances' },
          { nom: 'Approbations', href: '/approbations' }, { nom: 'Rapports', href: '/rapports' }, { nom: 'Audit & Utilisateurs', href: '/audit' },
        ].map((m: any) => (<a key={m.nom} href={m.href} style={{ display: 'block', padding: '10px 12px', borderRadius: 10, background: m.nom === 'Alimentation' ? '#16A34A' : 'white', color: m.nom === 'Alimentation' ? 'white' : '#111', fontWeight: 700, marginTop: 4, textDecoration: 'none', fontSize: 13 }}>{m.nom}</a>))}
        <div style={{ background: '#F0FDF4', padding: 12, borderRadius: 12, marginTop: 18, fontSize: 12 }}><b>RATIONS — Lues depuis Cheptel</b><div style={{ marginTop: 6 }}>Porcelet : 1 kg/j</div><div>Truie gestante / vide : 2.5 kg/j</div><div>Reproducteur / Engraissement : 3 kg/j</div><div style={{ fontWeight: 800, marginTop: 6 }}>Total : {consoJour.toFixed(1)} kg/jour • {lots.length} lots actifs</div><div style={{ marginTop: 4, color: '#666' }}>Si tu ajoutes un animal dans Cheptel, son lot apparaît ici tout seul.</div></div>
      </div>
      <div style={{ flex: 1, padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><h1 style={{ fontSize: 24, fontWeight: 900, margin: 0 }}>Alimentation & Stocks</h1><div style={{ display: 'flex', gap: 8 }}><button onClick={() => setShowAchat(true)} style={{ background: '#16A34A', color: 'white', border: 'none', padding: '10px 14px', borderRadius: 8, fontWeight: 800, cursor: 'pointer' }}>+ Achat</button><button onClick={() => setShowConso(true)} style={{ background: '#111', color: 'white', border: 'none', padding: '10px 14px', borderRadius: 8, fontWeight: 800, cursor: 'pointer' }}>+ Consommation</button></div></div>
        <div style={{ background: '#F0FDF4', padding: 14, borderRadius: 12, marginTop: 14, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}><div><b>Stock total : {stockTotal.toLocaleString()} kg</b><div style={{ fontSize: 12, color: '#666' }}>Achats {totalAchats.toLocaleString()} kg - Consommations {totalConso.toLocaleString()} kg • Conso réelle : {consoJour.toFixed(1)} kg/jour • {stockJours}j avant rupture • {lots.length} lots</div></div><button onClick={donnerTout} style={{ background: '#16A34A', color: 'white', border: 'none', padding: '10px 16px', borderRadius: 8, fontWeight: 800, cursor: 'pointer' }}>🍽️ Donner à manger — Tout le monde ({consoJour.toFixed(1)} kg)</button></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 14 }}>
          {lots.map((c: any) => (<div key={c.lot} style={{ background: 'white', padding: 14, borderRadius: 14, border: '1px solid #E5E5E5' }}><b>{c.lot}</b><div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{c.nb} porcs • {c.desc} = <b>{c.kg.toFixed(1)} kg / jour</b></div><div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>Codes : {c.liste.map((x: any) => x.code).join(', ')}</div><button onClick={() => donnerAManger(c.lot, c.kg)} style={{ width: '100%', marginTop: 10, background: '#16A34A', color: 'white', border: 'none', padding: 10, borderRadius: 8, fontWeight: 800, cursor: 'pointer' }}>Donner {c.kg.toFixed(1)} kg — {c.lot}</button></div>))}
        </div>
        {msg && <div style={{ marginTop: 12, background: msgType === 'err' ? '#FEE2E2' : '#DCFCE7', padding: 12, borderRadius: 8, fontSize: 13 }}>{msg}</div>}
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid #E5E5E5', marginTop: 14, overflow: 'hidden' }}>
          <div style={{ padding: 14, display: 'flex', justifyContent: 'space-between' }}><b>Mouvements aliments — Vrais noms</b><span style={{ fontSize: 12, color: '#666' }}>Vérifie la colonne LOT : elle doit dire le lot que tu as nourri, pas B6.</span></div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}><thead><tr style={{ background: '#F9FAFB', textAlign: 'left', fontSize: 10, color: '#666' }}><th style={{ padding: 12 }}>DATE</th><th>ALIMENT</th><th>LOT</th><th>TYPE</th><th>QTE</th><th>MOTIF</th></tr></thead><tbody>
            {mouvements.length === 0 ? <tr><td colSpan={6} style={{ padding: 16, color: '#666' }}>Aucun mouvement.</td></tr> : mouvements.map((m: any, i: number) => (<tr key={i} style={{ borderTop: '1px solid #F0F0F0' }}><td style={{ padding: 12 }}>{fmtDate(m.date_mouvement || m.created_at)}</td><td>{nomAliment(m)}</td><td style={{ fontWeight: 700 }}>{m.lot_code || '-'}</td><td><span style={{ background: m.type === 'achat' ? '#DCFCE7' : '#FEE2E2', color: m.type === 'achat' ? '#166534' : '#991B1B', padding: '3px 8px', borderRadius: 20, fontSize: 11 }}>{m.type}</span></td><td>{Number(m.quantite || 0).toLocaleString()} kg</td><td style={{ fontSize: 12 }}>{m.motif || ''}</td></tr>))}
          </tbody></table>
        </div>
        <div style={{ background: '#FEF3C7', padding: 12, borderRadius: 12, marginTop: 12, fontSize: 12 }}><b>💡 Pourquoi B4 devenait B6 avant :</b> Alimentation n'avait que 3 boutons en dur (B3, B1, B6). Il n'y avait pas de B4, donc tu ne pouvais pas nourrir B4. Maintenant, les lots sont lus depuis Cheptel : B1, B3, <b>B4 (AG-0022, 3 kg)</b>, B6. Et l'aliment par défaut est <b>Aliments composés</b>, pas Tourteau. Les anciennes lignes en « Tourteau » restent dans l'historique, on ne les efface pas, mais les nouvelles seront en Aliments composés.</div>
        <div style={{ background: '#F0FDF4', padding: 12, borderRadius: 12, marginTop: 8, fontSize: 12 }}><b>✅ Nouveau total avec B4 :</b> B1 7.5 kg + B3 10 kg + B4 3 kg + B6 3 kg = <b>23.5 kg / jour</b> (au lieu de 20.5 kg avant B4). Si AG-0022 mange plus ou moins que 3 kg, dis-le moi, je change sa ration.</div>
      </div>
      {showAchat && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}><div style={{ background: 'white', padding: 20, borderRadius: 16, width: 400 }}><div style={{ display: 'flex', justifyContent: 'space-between' }}><b>Nouvel achat aliment</b><button onClick={() => setShowAchat(false)} style={{ border: 'none', background: 'none', fontSize: 18, cursor: 'pointer' }}>✕</button></div><div style={{ display: 'grid', gap: 10, marginTop: 12 }}><select value={alimentId} onChange={(e: any) => setAlimentId(e.target.value)} style={{ padding: 10, border: '1px solid #DDD', borderRadius: 8 }}>{alimentsRef.map((a: any) => (<option key={a.id} value={a.id}>{a.nom || a.libelle || a.id}</option>))}</select><input type='number' value={qte} onChange={(e: any) => setQte(e.target.value)} placeholder='Quantité kg' style={{ padding: 10, border: '1px solid #DDD', borderRadius: 8 }} /><input type='number' value={prixKg} onChange={(e: any) => setPrixKg(e.target.value)} placeholder='Prix du jour GNF / kg' style={{ padding: 10, border: '1px solid #DDD', borderRadius: 8 }} /><input type='date' value={dateMvt} onChange={(e: any) => setDateMvt(e.target.value)} style={{ padding: 10, border: '1px solid #DDD', borderRadius: 8 }} /></div><button onClick={ajouterAchat} style={{ width: '100%', marginTop: 12, background: '#16A34A', color: 'white', border: 'none', padding: 12, borderRadius: 8, fontWeight: 800, cursor: 'pointer' }}>Enregistrer achat</button>{msg && <div style={{ marginTop: 10, background: msgType === 'err' ? '#FEE2E2' : '#DCFCE7', padding: 10, borderRadius: 8, fontSize: 13 }}>{msg}</div>}</div></div>
      )}
      {showConso && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}><div style={{ background: 'white', padding: 20, borderRadius: 16, width: 400 }}><div style={{ display: 'flex', justifyContent: 'space-between' }}><b>Consommation manuelle — Tous les lots</b><button onClick={() => setShowConso(false)} style={{ border: 'none', background: 'none', fontSize: 18, cursor: 'pointer' }}>✕</button></div><div style={{ display: 'grid', gap: 10, marginTop: 12 }}><select value={lotConso} onChange={(e: any) => setLotConso(e.target.value)} style={{ padding: 10, border: '1px solid #DDD', borderRadius: 8 }}>{lots.map((l: any) => (<option key={l.lot} value={l.lot}>{l.lot} - {l.kg.toFixed(1)} kg/j</option>))}</select><input type='number' value={qte} onChange={(e: any) => setQte(e.target.value)} placeholder='Quantité kg (ex: 3)' style={{ padding: 10, border: '1px solid #DDD', borderRadius: 8 }} /><input type='date' value={dateMvt} onChange={(e: any) => setDateMvt(e.target.value)} style={{ padding: 10, border: '1px solid #DDD', borderRadius: 8 }} /></div><button onClick={() => donnerAManger(lotConso, Number(qte))} style={{ width: '100%', marginTop: 12, background: '#111', color: 'white', border: 'none', padding: 12, borderRadius: 8, fontWeight: 800, cursor: 'pointer' }}>Enregistrer consommation</button>{msg && <div style={{ marginTop: 10, background: msgType === 'err' ? '#FEE2E2' : '#DCFCE7', padding: 10, borderRadius: 8, fontSize: 13 }}>{msg}</div>}</div></div>
      )}
    </div>
  )
}
