"use client"
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
export default function CheptelPage() {
  const [animaux, setAnimaux] = useState<any[]>([])
  const [vueLot, setVueLot] = useState(true)
  const [recherche, setRecherche] = useState('')
  const [showAjout, setShowAjout] = useState(false)
  const [msg, setMsg] = useState('')
  const [msgType, setMsgType] = useState('ok')
  // Formulaire Ajouter animal - VRAIS champs
  const [code, setCode] = useState('')
  const [race, setRace] = useState('Large White')
  const [sexe, setSexe] = useState('F')
  const [categorie, setCategorie] = useState('porcelet')
  const [poids, setPoids] = useState('')
  const [enclos, setEnclos] = useState('B3-Croissance')
  const [dateNaiss, setDateNaiss] = useState('2026-11-20')
  const [tetines, setTetines] = useState('')
  const [origine, setOrigine] = useState('')
  const charger = async () => { const { data } = await supabase.from('animaux').select('*').order('code', { ascending: true }); setAnimaux(data || []) }
  useEffect(() => { charger() }, [])
  const actifs = animaux.filter((a: any) => a.statut === 'actif')
  const vendus = animaux.filter((a: any) => a.statut === 'vendu')
  const compteBat = (prefix: string) => actifs.filter((a: any) => String(a.enclos || a.batiment || '').startsWith(prefix)).length
  const b1 = compteBat('B1'); const b2 = compteBat('B2'); const b3 = compteBat('B3'); const b4 = compteBat('B4'); const b5 = compteBat('B5'); const b6 = compteBat('B6')
  const filtre = (a: any) => { if (!recherche) return true; const r = recherche.toLowerCase(); return String(a.code || '').toLowerCase().includes(r) || String(a.race || '').toLowerCase().includes(r) || String(a.enclos || '').toLowerCase().includes(r) }
  const affiches = animaux.filter(filtre)
  const lots: Record<string, any[]> = {}
  actifs.filter(filtre).forEach((a: any) => { const lot = a.enclos || a.batiment || 'Sans enclos'; if (!lots[lot]) lots[lot] = []; lots[lot].push(a) })
  const ordreLots = Object.keys(lots).sort()
  const poidsMoyen = (liste: any[]) => liste.length ? (liste.reduce((s: number, x: any) => s + Number(x.poids_kg || x.poids || 0), 0) / liste.length).toFixed(1) : '0'
  const ajouterAnimal = async () => {
    if (!code) { setMsg('Mets le Code, ex: AG-0004'); setMsgType('err'); return }
    if (!poids) { setMsg('Mets le Poids en kg'); setMsgType('err'); return }
    // VRAIS NOMS animaux : code, race, sexe, categorie, poids_kg, enclos, statut, date_naissance, tetines, origine
    // On essaie avec tous les champs. Si tetines / origine n'existent pas dans ta table, on réessaie sans eux.
    const base: any = { code: code.trim(), race, sexe, categorie, poids_kg: Number(poids), enclos, statut: 'actif', date_naissance: dateNaiss }
    if (tetines) base.tetines = Number(tetines)
    if (origine) base.origine = origine
    let { error } = await supabase.from('animaux').insert(base)
    if (error && (error.message.includes('tetines') || error.message.includes('origine') || error.message.includes('date_naissance'))) {
      const retry: any = { code: code.trim(), race, sexe, categorie, poids_kg: Number(poids), enclos, statut: 'actif' }
      const r2 = await supabase.from('animaux').insert(retry); error = r2.error
    }
    if (error) { setMsg('ERREUR - Pas ajouté : ' + error.message + ' | Envoie-moi cette phrase, je corrige avec le vrai nom de colonne.'); setMsgType('err'); return }
    setMsg('OK - Animal ajouté : ' + code + ' - ' + race + ' - ' + enclos + ' - ' + poids + ' kg. Regarde la liste, il doit être là.'); setMsgType('ok')
    setCode(''); setPoids(''); setTetines(''); setOrigine('')
    await charger(); setTimeout(() => setShowAjout(false), 900)
  }
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F6F7F9', color: '#111', fontFamily: 'sans-serif' }}>
      <div style={{ width: 250, background: 'white', padding: 16, borderRight: '1px solid #E5E5E5', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><div style={{ width: 36, height: 36, background: '#16A34A', color: 'white', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>A</div><div><div style={{ fontWeight: 900 }}>AGRONOVA</div><div style={{ fontSize: 11, color: '#666' }}>Guinée - Conakry • Élevage porcin</div></div></div>
        <div style={{ fontSize: 11, color: '#16A34A', marginTop: 8 }}>● Données synchronisées • Supabase<br /><span style={{ color: '#666' }}>RLS actif</span></div>
        <div style={{ marginTop: 18, fontSize: 11, fontWeight: 800, color: '#999' }}>NAVIGATION</div>
        {[
          { nom: 'Tableau de bord', href: '/' }, { nom: 'Cheptel', href: '/cheptel' }, { nom: 'Reproduction', href: '/reproduction' },
          { nom: 'Répertoire Truies', href: '/repertoire-truies' }, { nom: 'Alimentation', href: '/alimentation' }, { nom: 'Sante', href: '/sante' },
          { nom: 'Finances', href: '/finances' }, { nom: 'Approbations', href: '/approbations' }, { nom: 'Rapports', href: '/rapports' }, { nom: 'Audit & Utilisateurs', href: '/audit' },
        ].map((m: any) => (<a key={m.nom} href={m.href} style={{ display: 'block', padding: '10px 12px', borderRadius: 10, background: m.nom === 'Cheptel' ? '#16A34A' : 'white', color: m.nom === 'Cheptel' ? 'white' : '#111', fontWeight: 700, marginTop: 4, textDecoration: 'none', fontSize: 13 }}>{m.nom}</a>))}
        <div style={{ background: '#F0FDF4', padding: 12, borderRadius: 12, marginTop: 18 }}>
          <b style={{ fontSize: 12 }}>BATIMENTS - COMPTAGE CORRIGÉ</b>
          <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>Seulement les actifs, pas les vendus</div>
          {[
            ['B1-Maternité', b1], ['B2-Gestation', b2], ['B3-Croissance', b3], ['B4-Engraissement', b4], ['B5-Quarantaine', b5], ['B6-Verraterie', b6],
          ].map((x: any) => (<div key={x[0]} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginTop: 6 }}><span>{x[0]}</span><span>{x[1]} porcs</span></div>))}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginTop: 8, fontWeight: 800, borderTop: '1px solid #D1FAE5', paddingTop: 6 }}><span>Total Actifs</span><span>{actifs.length} / {animaux.length}</span></div>
          <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>Vendus : {vendus.length} (AG-012 B4 + AG-1003 E01)</div>
        </div>
      </div>
      <div style={{ flex: 1, padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div><h1 style={{ fontSize: 24, fontWeight: 900, margin: 0 }}>Cheptel</h1><p style={{ color: '#666', fontSize: 12 }}>{animaux.length} animaux - gestion individuelle et par lot - RLS : propriétaire</p></div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => { setVueLot(!vueLot); setMsg(vueLot ? 'Vue : par animal — tu vois chaque porc un par un' : 'Vue : par lot — tu vois B1, B3, B6 groupés'); setMsgType('ok') }} style={{ background: vueLot ? '#16A34A' : 'white', color: vueLot ? 'white' : '#111', border: vueLot ? 'none' : '1px solid #DDD', padding: '10px 14px', borderRadius: 8, fontWeight: 800, cursor: 'pointer' }}>{vueLot ? '✓ Vue par lot (active)' : 'Vue par lot'}</button>
            <button onClick={() => { setShowAjout(true); setMsg('') }} style={{ background: '#16A34A', color: 'white', border: 'none', padding: '10px 14px', borderRadius: 8, fontWeight: 800, cursor: 'pointer' }}>+ Ajouter animal</button>
          </div>
        </div>
        {msg && <div style={{ marginTop: 12, background: msgType === 'err' ? '#FEE2E2' : '#DCFCE7', padding: 10, borderRadius: 8, fontSize: 13 }}>{msg}</div>}
        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}><input value={recherche} onChange={(e: any) => setRecherche(e.target.value)} placeholder='Recherche ID, race, enclos...' style={{ padding: 10, border: '1px solid #DDD', borderRadius: 8, flex: 1 }} /><span style={{ background: 'white', border: '1px solid #DDD', padding: '10px 12px', borderRadius: 8, fontSize: 13 }}>{vueLot ? ordreLots.length + ' lots' : affiches.length + ' résultats'}</span></div>
        {!vueLot ? (
          <div style={{ background: 'white', borderRadius: 14, border: '1px solid #E5E5E5', marginTop: 14, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}><thead><tr style={{ background: '#F9FAFB', textAlign: 'left', fontSize: 10, color: '#666' }}><th style={{ padding: 12 }}>ID</th><th>RACE</th><th>SEXE</th><th>CATEGORIE</th><th>POIDS</th><th>ENCLOS</th><th>STATUT</th><th style={{ textAlign: 'right', paddingRight: 12 }}>ACTIONS</th></tr></thead><tbody>
              {affiches.map((a: any) => (<tr key={a.id} style={{ borderTop: '1px solid #F0F0F0' }}><td style={{ padding: 12, fontWeight: 700 }}>{a.code}</td><td>{a.race}</td><td><span style={{ background: a.sexe === 'M' ? '#DBEAFE' : '#FCE7F3', color: a.sexe === 'M' ? '#1E40AF' : '#9D174D', padding: '3px 8px', borderRadius: 20, fontSize: 11 }}>{a.sexe}</span></td><td>{a.categorie}</td><td>{Number(a.poids_kg || a.poids || 0)} kg</td><td>{a.enclos}</td><td><span style={{ background: a.statut === 'actif' ? '#DCFCE7' : '#FEE2E2', color: a.statut === 'actif' ? '#166534' : '#991B1B', padding: '3px 8px', borderRadius: 20, fontSize: 11 }}>{a.statut}</span></td><td style={{ textAlign: 'right', paddingRight: 12 }}><button style={{ border: '1px solid #DDD', background: 'white', padding: '6px 12px', borderRadius: 8, cursor: 'pointer' }}>Voir</button></td></tr>))}
            </tbody></table>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 14 }}>
            {ordreLots.map((lot: string) => { const liste = lots[lot]; const vendusLot = animaux.filter((a: any) => String(a.enclos || '').startsWith(lot) && a.statut === 'vendu').length; return (
              <div key={lot} style={{ background: 'white', padding: 16, borderRadius: 14, border: '2px solid #16A34A' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><b style={{ fontSize: 16 }}>{lot}</b><span style={{ background: '#DCFCE7', padding: '3px 8px', borderRadius: 20, fontSize: 11 }}>{liste.length} actifs</span></div>
                <div style={{ fontSize: 12, color: '#666', marginTop: 6 }}>Poids moyen : {poidsMoyen(liste)} kg • Poids total : {liste.reduce((s: number, x: any) => s + Number(x.poids_kg || 0), 0).toFixed(1)} kg</div>
                <div style={{ fontSize: 12, marginTop: 8 }}>Catégories : {Array.from(new Set(liste.map((x: any) => x.categorie))).join(', ')}</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>Codes : {liste.map((x: any) => x.code).join(', ')}</div>
                {vendusLot > 0 && <div style={{ fontSize: 11, color: '#DC2626', marginTop: 6 }}>{vendusLot} vendu(s) dans ce lot — non compté</div>}
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <a href='/pesees' style={{ flex: 1, background: '#16A34A', color: 'white', textAlign: 'center', padding: 8, borderRadius: 8, fontWeight: 800, textDecoration: 'none', fontSize: 12 }}>Peser ce lot</a>
                  <a href='/alimentation' style={{ flex: 1, background: '#111', color: 'white', textAlign: 'center', padding: 8, borderRadius: 8, fontWeight: 800, textDecoration: 'none', fontSize: 12 }}>Nourrir ce lot</a>
                </div>
              </div>
            ) })}
          </div>
        )}
      </div>
      {showAjout && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', padding: 20, borderRadius: 16, width: 460, maxWidth: '92vw', maxHeight: '92vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><b style={{ fontSize: 18 }}>Ajouter animal</b><button onClick={() => setShowAjout(false)} style={{ border: 'none', background: 'none', fontSize: 20, cursor: 'pointer' }}>✕</button></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
              <div><label style={{ fontSize: 12, fontWeight: 700 }}>Code * ex: AG-0004</label><input value={code} onChange={(e: any) => setCode(e.target.value)} placeholder='AG-0004' style={{ width: '100%', padding: 10, border: '1px solid #DDD', borderRadius: 8, marginTop: 4 }} /></div>
              <div><label style={{ fontSize: 12, fontWeight: 700 }}>Race</label><select value={race} onChange={(e: any) => setRace(e.target.value)} style={{ width: '100%', padding: 10, border: '1px solid #DDD', borderRadius: 8, marginTop: 4 }}>{['Large White', 'Landrace', 'Duroc', 'Locale', 'Croisée'].map((r: string) => (<option key={r}>{r}</option>))}</select></div>
              <div><label style={{ fontSize: 12, fontWeight: 700 }}>Sexe</label><select value={sexe} onChange={(e: any) => setSexe(e.target.value)} style={{ width: '100%', padding: 10, border: '1px solid #DDD', borderRadius: 8, marginTop: 4 }}><option value='F'>F - Femelle</option><option value='M'>M - Mâle</option></select></div>
              <div><label style={{ fontSize: 12, fontWeight: 700 }}>Catégorie</label><select value={categorie} onChange={(e: any) => setCategorie(e.target.value)} style={{ width: '100%', padding: 10, border: '1px solid #DDD', borderRadius: 8, marginTop: 4 }}>{['porcelet', 'truie_gestante', 'truie_vide', 'reproducteur', 'engraissement'].map((c: string) => (<option key={c}>{c}</option>))}</select></div>
              <div><label style={{ fontSize: 12, fontWeight: 700 }}>Poids kg *</label><input type='number' value={poids} onChange={(e: any) => setPoids(e.target.value)} placeholder='ex: 30' style={{ width: '100%', padding: 10, border: '1px solid #DDD', borderRadius: 8, marginTop: 4 }} /></div>
              <div><label style={{ fontSize: 12, fontWeight: 700 }}>Enclos</label><select value={enclos} onChange={(e: any) => setEnclos(e.target.value)} style={{ width: '100%', padding: 10, border: '1px solid #DDD', borderRadius: 8, marginTop: 4 }}>{['B1-Maternité', 'B2-Gestation', 'B3-Croissance', 'B4-Engraissement', 'B5-Quarantaine', 'B6-Verraterie', 'E01'].map((b: string) => (<option key={b}>{b}</option>))}</select></div>
              <div><label style={{ fontSize: 12, fontWeight: 700 }}>Date naissance</label><input type='date' value={dateNaiss} onChange={(e: any) => setDateNaiss(e.target.value)} style={{ width: '100%', padding: 10, border: '1px solid #DDD', borderRadius: 8, marginTop: 4 }} /></div>
              <div><label style={{ fontSize: 12, fontWeight: 700 }}>Tétines (si truie)</label><input type='number' value={tetines} onChange={(e: any) => setTetines(e.target.value)} placeholder='ex: 14' style={{ width: '100%', padding: 10, border: '1px solid #DDD', borderRadius: 8, marginTop: 4 }} /></div>
              <div style={{ gridColumn: 'span 2' }}><label style={{ fontSize: 12, fontWeight: 700 }}>Origine</label><input value={origine} onChange={(e: any) => setOrigine(e.target.value)} placeholder='ex: Seredou' style={{ width: '100%', padding: 10, border: '1px solid #DDD', borderRadius: 8, marginTop: 4 }} /></div>
            </div>
            <button onClick={ajouterAnimal} style={{ width: '100%', marginTop: 14, background: '#16A34A', color: 'white', border: 'none', padding: 12, borderRadius: 8, fontWeight: 800, cursor: 'pointer' }}>Enregistrer l'animal</button>
            {msg && <div style={{ marginTop: 10, background: msgType === 'err' ? '#FEE2E2' : '#DCFCE7', padding: 10, borderRadius: 8, fontSize: 13 }}>{msg}</div>}
            <div style={{ fontSize: 11, color: '#666', marginTop: 8 }}>Statut mis à actif automatiquement. Si tu vends cet animal plus tard, il passera en vendu et ne sera plus compté dans Bâtiments.</div>
          </div>
        </div>
      )}
    </div>
  )
}
