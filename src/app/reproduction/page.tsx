"use client"
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Page() {
  const [saillies, setSaillies] = useState<any[]>([])
  const [portees, setPortes] = useState<any[]>([])
  const [animaux, setAnimaux] = useState<any[]>([])
  const [showSaillie, setShowSaillie] = useState(false)
  const [showPortee, setShowPortee] = useState(false)
  const [truie, setTruie] = useState('AG-1001')
  const [verrat, setVerrat] = useState('AG-0001')
  const [dateSaillie, setDateSaillie] = useState('2026-11-18')
  const [saillieId, setSaillieId] = useState('')
  const [dateMiseBas, setDateMiseBas] = useState('2027-03-12')
  const [nesVivants, setNesVivants] = useState('10')
  const [mortNes, setMortNes] = useState('1')
  const [mortsAvant, setMortsAvant] = useState('0')
  const [sevres, setSevres] = useState('8')
  const [msg, setMsg] = useState('')

  const charger = async () => {
    const { data: s } = await supabase.from('saillies').select('*').order('created_at', { ascending: false })
    setSaillies(s || [])
    if ((s || []).length && !saillieId) setSaillieId((s || [])[0].id)
    const { data: p } = await supabase.from('portees').select('*')
    setPortes(p || [])
    const { data: a } = await supabase.from('animaux').select('*').order('code')
    setAnimaux(a || [])
    if ((a || []).length) {
      const truies = (a || []).filter((x: any) => x.categorie === 'truie_gestante' || x.categorie === 'truie_allaitante')
      if (truies.length) setTruie(truies[0].code || truies[0].identifiant)
      const verrats = (a || []).filter((x: any) => x.categorie === 'reproducteur')
      if (verrats.length) setVerrat(verrats[0].code || verrats[0].identifiant)
    }
  }
  useEffect(() => { charger() }, [])

  const datePrevue = (() => {
    const d = new Date(dateSaillie)
    d.setDate(d.getDate() + 114)
    return d.toISOString().slice(0, 10)
  })()

  const ajouterSaillie = async () => {
    setMsg('Enregistrement...')
    const { error } = await supabase.from('saillies').insert({ truie_code: truie, verrat_code: verrat, date_saillie: dateSaillie, date_mise_bas_prevue: datePrevue, statut: 'en_cours' })
    if (error) { setMsg('Erreur: ' + error.message); return }
    setMsg('Saillie enregistree ! Mise bas prevue le ' + datePrevue)
    setShowSaillie(false)
    charger()
  }

  const ajouterPortee = async () => {
    const saillie = saillies.find((x: any) => x.id === saillieId)
    if (!saillie) { setMsg('Choisis d abord une saillie'); return }
    setMsg('Enregistrement portee...')
    const { error } = await supabase.from('portees').insert({ truie_code: saillie.truie_code, saillie_id: saillie.id, date_mise_bas: dateMiseBas, nes_vivants: Number(nesVivants || 0), mort_nes: Number(mortNes || 0), morts_avant_sevrage: Number(mortsAvant || 0), sevres: Number(sevres || 0) })
    if (error) { setMsg('Erreur portee: ' + error.message); return }
    await supabase.from('saillies').update({ statut: 'mise_bas' }).eq('id', saillie.id)
    setMsg('Portee enregistree ! Truie ' + saillie.truie_code + ' : ' + nesVivants + ' vivants, ' + mortNes + ' mort-nes, ' + sevres + ' sevres')
    setShowPortee(false)
    charger()
  }

  const porteesCount = portees.length
  const totalNes = portees.reduce((s: number, x: any) => s + Number(x.nes_vivants || 0), 0)
  const totalMortNes = portees.reduce((s: number, x: any) => s + Number(x.mort_nes || 0), 0)
  const totalMortsAvant = portees.reduce((s: number, x: any) => s + Number(x.morts_avant_sevrage || 0), 0)
  const totalSevres = portees.reduce((s: number, x: any) => s + Number(x.sevres || 0), 0)
  const moyPortee = porteesCount ? (totalNes / porteesCount).toFixed(1) : '0'
  const moySevres = porteesCount ? (totalSevres / porteesCount).toFixed(1) : '0'
  const pctMortNes = totalNes + totalMortNes ? ((totalMortNes / (totalNes + totalMortNes)) * 100).toFixed(1) + '%' : '0%'
  const pctMortalite = totalNes ? ((totalMortsAvant / totalNes) * 100).toFixed(1) + '%' : '0%'

  const fmtDate = (d: string) => {
    if (!d) return '-'
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
  }

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
          { nom: 'Reproduction', href: '/reproduction', actif: true },
          { nom: 'Alimentation', href: '/alimentation', actif: false },
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
            <h1 style={{ fontSize: 24, fontWeight: 900, margin: 0 }}>Reproduction</h1>
            <p style={{ color: '#666', fontSize: 13, margin: '4px 0' }}>Cycle 114 jours - ESTIMATION affichee - Performances truies</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setShowPortee(true)} style={{ padding: '9px 14px', borderRadius: 20, background: '#111', color: 'white', fontWeight: 800, border: 'none', cursor: 'pointer' }}>+ Portee / Mise bas</button>
            <button onClick={() => setShowSaillie(true)} style={{ padding: '9px 14px', borderRadius: 20, background: '#16A34A', color: 'white', fontWeight: 800, border: 'none', cursor: 'pointer' }}>+ Saillie</button>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginTop: 16 }}>
          {[
            { label: 'PORTEES', val: String(porteesCount), sub: '12 mois' },
            { label: 'NES VIVANTS', val: String(totalNes), sub: 'moy ' + moyPortee + '/portee' },
            { label: 'MORT-NES', val: String(totalMortNes), sub: pctMortNes },
            { label: 'MORTALITE PRE-SEVRAGE', val: String(totalMortsAvant), sub: pctMortalite },
            { label: 'SEVRES', val: String(totalSevres), sub: 'moy ' + moySevres + '/portee' },
          ].map((k: any) => (
            <div key={k.label} style={{ background: 'white', padding: 14, borderRadius: 14, border: '1px solid #E5E5E5' }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#666' }}>{k.label}</div>
              <div style={{ fontSize: 22, fontWeight: 900, marginTop: 6 }}>{k.val}</div>
              <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>{k.sub}</div>
            </div>
          ))}
        </div>
        {msg && <div style={{ marginTop: 12, padding: 10, background: '#DCFCE7', borderRadius: 10, fontSize: 13, fontWeight: 700 }}>{msg}</div>}
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid #E5E5E5', marginTop: 14, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '0.6fr 1fr 1fr 1fr 1.4fr 1fr 1.2fr', padding: '12px 16px', fontSize: 11, fontWeight: 800, color: '#666', borderBottom: '1px solid #EEE' }}>
            <span>ID</span><span>TRUIE</span><span>VERRAT</span><span>SAILLIE</span><span>MISE BAS PREVUE</span><span>STATUT</span><span>DETAILS</span>
          </div>
          {saillies.length === 0 ? <p style={{ padding: 16, color: '#666' }}>Aucune saillie. Clique + Saillie.</p> : saillies.map((s: any, idx: number) => {
            const portee = portees.find((p: any) => p.saillie_id === s.id)
            return (
              <div key={s.id} style={{ display: 'grid', gridTemplateColumns: '0.6fr 1fr 1fr 1fr 1.4fr 1fr 1.2fr', padding: '12px 16px', borderBottom: '1px solid #F5F5F5', fontSize: 13, alignItems: 'center' }}>
                <b>S{String(idx + 1).padStart(2, '0')}</b>
                <span>{s.truie_code}</span>
                <span>{s.verrat_code}</span>
                <span>{fmtDate(s.date_saillie)}</span>
                <span>{fmtDate(s.date_mise_bas_prevue)} <span style={{ background: '#FEF3C7', padding: '2px 6px', borderRadius: 6, fontSize: 10, fontWeight: 800 }}>ESTIMATION</span></span>
                <span><span style={{ background: s.statut === 'en_cours' ? '#EFF6FF' : '#DCFCE7', color: s.statut === 'en_cours' ? '#1D4ED8' : '#166534', padding: '3px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{s.statut === 'en_cours' ? 'gestante' : s.statut}</span></span>
                <span style={{ color: '#666', fontSize: 12 }}>{portee ? portee.nes_vivants + ' vivants, ' + portee.mort_nes + ' mort-nes, ' + portee.sevres + ' sevres' : 'Clique + Portee pour declarer'}</span>
              </div>
            )
          })}
        </div>
        {showSaillie && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
            <div style={{ background: 'white', padding: 20, borderRadius: 16, width: 440, color: '#111' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><h2 style={{ margin: 0, fontSize: 18 }}>Nouvelle saillie</h2><button onClick={() => setShowSaillie(false)} style={{ border: 'none', background: 'none', fontSize: 20, cursor: 'pointer' }}>X</button></div>
              <select value={truie} onChange={e => setTruie(e.target.value)} style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #DDD', background: 'white', color: '#111', marginTop: 14, boxSizing: 'border-box' }}>
                {animaux.filter((a: any) => a.sexe === 'F').map((a: any) => (<option key={a.id} value={a.code || a.identifiant}>{(a.code || a.identifiant) + ' - ' + a.race}</option>))}
              </select>
              <select value={verrat} onChange={e => setVerrat(e.target.value)} style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #DDD', background: 'white', color: '#111', marginTop: 10, boxSizing: 'border-box' }}>
                {animaux.filter((a: any) => a.sexe === 'M').map((a: any) => (<option key={a.id} value={a.code || a.identifiant}>{(a.code || a.identifiant) + ' - ' + a.race}</option>))}
              </select>
              <input type='date' value={dateSaillie} onChange={e => setDateSaillie(e.target.value)} style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #DDD', background: 'white', color: '#111', marginTop: 10, boxSizing: 'border-box' }} />
              <div style={{ background: '#FFFBEB', padding: 10, borderRadius: 10, fontSize: 12, color: '#666', marginTop: 10 }}>Date mise bas = date saillie +114 jours (ESTIMATION)<br />Prevue : <b>{datePrevue}</b></div>
              <button onClick={ajouterSaillie} style={{ width: '100%', padding: 14, borderRadius: 12, background: '#16A34A', color: 'white', fontWeight: 900, border: 'none', marginTop: 12, cursor: 'pointer' }}>Enregistrer saillie</button>
            </div>
          </div>
        )}
        {showPortee && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
            <div style={{ background: 'white', padding: 20, borderRadius: 16, width: 440, color: '#111' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><h2 style={{ margin: 0, fontSize: 18 }}>Portee / Mise bas</h2><button onClick={() => setShowPortee(false)} style={{ border: 'none', background: 'none', fontSize: 20, cursor: 'pointer' }}>X</button></div>
              <p style={{ fontSize: 12, color: '#666' }}>De quelle truie ? On choisit la saillie S01, S02... La truie est dedans.</p>
              <select value={saillieId} onChange={e => setSaillieId(e.target.value)} style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #DDD', background: 'white', color: '#111', boxSizing: 'border-box' }}>
                {saillies.map((s: any, idx: number) => (<option key={s.id} value={s.id}>{'S' + String(idx + 1).padStart(2, '0') + ' - Truie ' + s.truie_code + ' x ' + s.verrat_code}</option>))}
              </select>
              <input type='date' value={dateMiseBas} onChange={e => setDateMiseBas(e.target.value)} style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #DDD', background: 'white', color: '#111', marginTop: 10, boxSizing: 'border-box' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
                <input value={nesVivants} onChange={e => setNesVivants(e.target.value)} placeholder='Nes vivants' type='number' style={{ padding: 12, borderRadius: 10, border: '1px solid #DDD', background: 'white', color: '#111' }} />
                <input value={mortNes} onChange={e => setMortNes(e.target.value)} placeholder='Mort-nes' type='number' style={{ padding: 12, borderRadius: 10, border: '1px solid #DDD', background: 'white', color: '#111' }} />
                <input value={mortsAvant} onChange={e => setMortsAvant(e.target.value)} placeholder='Morts avant sevrage' type='number' style={{ padding: 12, borderRadius: 10, border: '1px solid #DDD', background: 'white', color: '#111' }} />
                <input value={sevres} onChange={e => setSevres(e.target.value)} placeholder='Sevres' type='number' style={{ padding: 12, borderRadius: 10, border: '1px solid #DDD', background: 'white', color: '#111' }} />
              </div>
              <button onClick={ajouterPortee} style={{ width: '100%', padding: 14, borderRadius: 12, background: '#111', color: 'white', fontWeight: 900, border: 'none', marginTop: 12, cursor: 'pointer' }}>Enregistrer portee</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
