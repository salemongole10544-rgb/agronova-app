// @ts-nocheck
"use client"
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Page() {
  const [truies, setTruies] = useState<any[]>([])
  const [portees, setPortes] = useState<any[]>([])
  const [saillies, setSaillies] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [msg, setMsg] = useState('')

  const charger = async () => {
    const { data: a } = await supabase.from('animaux').select('*').eq('sexe', 'F').order('code')
    setTruies(a || [])
    const { data: p } = await supabase.from('portees').select('*').order('date_mise_bas', { ascending: true })
    setPortes(p || [])
    const { data: s } = await supabase.from('saillies').select('*').order('date_saillie', { ascending: true })
    setSaillies(s || [])
    if ((a || []).length && !selected) setSelected((a || [])[0])
  }
  useEffect(() => { charger() }, [])

  const fmt = (d: string) => {
    if (!d) return '-'
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
  }
  const addJours = (d: string, n: number) => {
    if (!d) return ''
    const x = new Date(d); x.setDate(x.getDate() + n)
    return x.toISOString().slice(0, 10)
  }

  const statsTruie = (code: string) => {
    const list = portees.filter((p: any) => p.truie_code === code)
    const nb = list.length
    const vivants = list.reduce((s: number, x: any) => s + Number(x.nes_vivants || 0), 0)
    const mortNes = list.reduce((s: number, x: any) => s + Number(x.mort_nes || 0), 0)
    const mortsAvant = list.reduce((s: number, x: any) => s + Number(x.morts_avant_sevrage || 0), 0)
    const sevres = list.reduce((s: number, x: any) => s + Number(x.sevres || 0), 0)
    const moyVivants = nb ? (vivants / nb).toFixed(1) : '0'
    const moySevres = nb ? (sevres / nb).toFixed(1) : '0'
    const mortalite = vivants ? ((mortsAvant / vivants) * 100).toFixed(1) : '0'
    let decision = 'Pas assez de données'
    let couleur = '#666'
    if (nb >= 2) {
      if (Number(moySevres) >= 9) { decision = 'Excellente - À garder'; couleur = '#16A34A' }
      else if (Number(moySevres) >= 7) { decision = 'Bonne - À garder'; couleur = '#16A34A' }
      else { decision = 'Faible - À réformer ?'; couleur = '#DC2626' }
    } else if (nb === 1) {
      if (Number(moySevres) >= 7) { decision = 'Bon début - À suivre'; couleur = '#16A34A' }
      else { decision = 'À suivre - 1ère portée faible'; couleur = '#D97706' }
    }
    return { list, nb, vivants, mortNes, mortsAvant, sevres, moyVivants, moySevres, mortalite, decision, couleur }
  }

  // Cycle complet pour la truie sélectionnée
  const cycle = (() => {
    if (!selected) return null
    const st = statsTruie(selected.code || selected.identifiant)
    const derniere = st.list[st.list.length - 1]
    const derniereSaillie = saillies.filter((s: any) => s.truie_code === (selected.code || selected.identifiant)).slice(-1)[0]
    if (!derniere && !derniereSaillie) return { st, derniere: null }
    // Si on a une mise bas, on calcule tout à partir d'elle. Sinon à partir de la saillie.
    let miseBas = derniere ? derniere.date_mise_bas : (derniereSaillie ? addJours(derniereSaillie.date_saillie, 114) : '')
    let sevrage = miseBas ? addJours(miseBas, 35) : ''
    let retourChaleur = sevrage ? addJours(sevrage, 5) : ''
    let finChaleur = retourChaleur ? addJours(retourChaleur, 2) : ''
    let prochaineMiseBas = retourChaleur ? addJours(retourChaleur, 114) : ''
    let saillieActuelle = derniereSaillie ? derniereSaillie.date_saillie : ''
    let miseBasPrevue = derniereSaillie ? addJours(derniereSaillie.date_saillie, 114) : ''
    return { st, derniere, miseBas, sevrage, retourChaleur, finChaleur, prochaineMiseBas, saillieActuelle, miseBasPrevue }
  })()

  const selCode = selected ? (selected.code || selected.identifiant) : ''

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
          { nom: 'Répertoire Truies', href: '/repertoire-truies', actif: true },
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
        <h1 style={{ fontSize: 24, fontWeight: 900, margin: 0 }}>Répertoire Truies - Fiche Truie</h1>
        <p style={{ color: '#666', fontSize: 13, margin: '4px 0' }}>Clique sur une truie à gauche pour voir toute sa vie + son cycle complet. Cycle : Gestation 114j (3 mois, 3 sem, 3 j) - Allaitement 35j - Retour chaleur 5j - Chaleur 2-3j</p>
        <div style={{ display: 'flex', gap: 16, marginTop: 16, alignItems: 'flex-start' }}>
          {/* LISTE TRUIES */}
          <div style={{ width: 280, background: 'white', borderRadius: 14, border: '1px solid #E5E5E5', overflow: 'hidden', flexShrink: 0 }}>
            <div style={{ padding: '12px 14px', fontWeight: 800, fontSize: 13, borderBottom: '1px solid #EEE' }}>Mes truies ({truies.length})</div>
            {truies.length === 0 ? <p style={{ padding: 14, color: '#666', fontSize: 13 }}>Aucune truie. Ajoute des femelles dans Cheptel.</p> : truies.map((t: any) => {
              const st = statsTruie(t.code || t.identifiant)
              const actif = selCode === (t.code || t.identifiant)
              return (
                <button key={t.id} onClick={() => setSelected(t)} style={{ width: '100%', textAlign: 'left', padding: '12px 14px', border: 'none', borderBottom: '1px solid #F5F5F5', background: actif ? '#F0FDF4' : 'white', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>
                    <div style={{ fontWeight: 800, fontSize: 13 }}>{t.code || t.identifiant} <span style={{ fontWeight: 400, color: '#666', fontSize: 11 }}>— {t.race}</span></div>
                    <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>{st.nb} portée(s) - Moy {st.moySevres} sevrés/portée</div>
                  </span>
                  <span style={{ fontSize: 11, background: st.nb >= 2 && Number(st.moySevres) < 7 ? '#FEE2E2' : '#DCFCE7', color: st.nb >= 2 && Number(st.moySevres) < 7 ? '#991B1B' : '#166534', padding: '3px 7px', borderRadius: 20, fontWeight: 700 }}>{st.nb >= 2 && Number(st.moySevres) < 7 ? 'À voir' : 'OK'}</span>
                </button>
              )
            })}
          </div>

          {/* FICHE */}
          <div style={{ flex: 1 }}>
            {!selected ? <p>Choisis une truie.</p> : cycle && (
              <>
                <div style={{ background: 'white', borderRadius: 14, border: '1px solid #E5E5E5', padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h2 style={{ margin: 0, fontSize: 20 }}>{selCode} — {selected.race}</h2>
                      <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>Enclos : {selected.enclos || selected.batiment || '-'} - Catégorie : {selected.categorie} - Poids : {selected.poids_kg || '-'} kg</div>
                      <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>Tétines fonctionnelles : {selected.tetines || 'À renseigner'} - Origine : {selected.origine || 'À renseigner'}</div>
                    </div>
                    <span style={{ background: '#F0FDF4', color: cycle.st.couleur, padding: '6px 12px', borderRadius: 20, fontWeight: 800, fontSize: 12 }}>{cycle.st.decision}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 16 }}>
                    {[
                      { label: 'PORTÉES', val: String(cycle.st.nb), sub: 'Parité actuelle' },
                      { label: 'NÉS VIVANTS', val: String(cycle.st.vivants), sub: 'Moy ' + cycle.st.moyVivants + ' / portée' },
                      { label: 'SEVRÉS', val: String(cycle.st.sevres), sub: 'Moy ' + cycle.st.moySevres + ' / portée' },
                      { label: 'MORTALITÉ PRE-SEVRAGE', val: cycle.st.mortalite + '%', sub: cycle.st.mortsAvant + ' morts + ' + cycle.st.mortNes + ' mort-nés' },
                    ].map((k: any) => (
                      <div key={k.label} style={{ background: '#F6F7F9', padding: 12, borderRadius: 12 }}>
                        <div style={{ fontSize: 10, fontWeight: 800, color: '#666' }}>{k.label}</div>
                        <div style={{ fontSize: 20, fontWeight: 900, marginTop: 4 }}>{k.val}</div>
                        <div style={{ fontSize: 11, color: '#666' }}>{k.sub}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CYCLE COMPLET */}
                <div style={{ background: 'white', borderRadius: 14, border: '1px solid #E5E5E5', padding: 16, marginTop: 14 }}>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: 16 }}>Cycle complet - Prochaine saillie (ESTIMATION)</h3>
                  <p style={{ fontSize: 12, color: '#666', margin: '0 0 12px 0' }}>Gestation 114j = 3 mois, 3 semaines, 3 jours - Allaitement 35j (30-42j) - Retour chaleur 5j (4-7j) - Chaleur 2-3j</p>
                  {!cycle.derniere && !cycle.saillieActuelle ? (
                    <p style={{ color: '#666', fontSize: 13 }}>Aucune saillie / portée pour cette truie. Va dans Reproduction → + Saillie.</p>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
                      {[
                        { label: 'DERNIÈRE SAILLIE', val: fmt(cycle.saillieActuelle), sub: 'J0' },
                        { label: 'MISE BAS', val: fmt(cycle.miseBasPrevue || cycle.miseBas), sub: '+114j - ESTIMATION' },
                        { label: 'SEVRAGE', val: fmt(cycle.sevrage), sub: '+35j allaitement' },
                        { label: 'PROCHAINE CHALEUR', val: fmt(cycle.retourChaleur) + ' → ' + fmt(cycle.finChaleur), sub: '+5j - dure 2-3j' },
                        { label: 'PROCHAINE MISE BAS', val: fmt(cycle.prochaineMiseBas), sub: 'Si saillie à la chaleur' },
                      ].map((c: any) => (
                        <div key={c.label} style={{ background: c.label.includes('PROCHAINE CHALEUR') ? '#FFFBEB' : '#F6F7F9', padding: 12, borderRadius: 12, border: c.label.includes('PROCHAINE CHALEUR') ? '2px solid #F59E0B' : '1px solid #EEE' }}>
                          <div style={{ fontSize: 10, fontWeight: 800, color: '#666' }}>{c.label}</div>
                          <div style={{ fontSize: 13, fontWeight: 900, marginTop: 6 }}>{c.val}</div>
                          <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>{c.sub}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {cycle.retourChaleur && <div style={{ marginTop: 12, background: '#F0FDF4', padding: 10, borderRadius: 10, fontSize: 13, fontWeight: 700 }}>✅ Prochaine saillie conseillée pour {selCode} : <span style={{ color: '#16A34A' }}>{fmt(cycle.retourChaleur)} au {fmt(cycle.finChaleur)}</span> — Prépare le verrat !</div>}
                </div>

                {/* HISTORIQUE PORTÉES */}
                <div style={{ background: 'white', borderRadius: 14, border: '1px solid #E5E5E5', marginTop: 14, overflow: 'hidden' }}>
                  <div style={{ padding: '12px 16px', fontWeight: 800 }}>Historique des portées - Parité</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '0.6fr 1fr 0.8fr 0.8fr 0.8fr 0.8fr', padding: '10px 16px', fontSize: 11, fontWeight: 800, color: '#666', borderBottom: '1px solid #EEE' }}>
                    <span>PARITÉ</span><span>DATE MISE BAS</span><span>NÉS VIVANTS</span><span>MORT-NÉS</span><span>MORTS AVANT SEVRAGE</span><span>SEVRÉS</span>
                  </div>
                  {cycle.st.list.length === 0 ? <p style={{ padding: 14, color: '#666', fontSize: 13 }}>Aucune portée. Va dans Reproduction → + Portée / Mise bas.</p> : cycle.st.list.map((p: any, i: number) => (
                    <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '0.6fr 1fr 0.8fr 0.8fr 0.8fr 0.8fr', padding: '10px 16px', borderBottom: '1px solid #F5F5F5', fontSize: 13 }}>
                      <b>Portée {i + 1}</b>
                      <span>{fmt(p.date_mise_bas)}</span>
                      <span>{p.nes_vivants}</span>
                      <span>{p.mort_nes}</span>
                      <span>{p.morts_avant_sevrage}</span>
                      <b>{p.sevres}</b>
                    </div>
                  ))}
                </div>
                {msg && <div style={{ marginTop: 12, padding: 10, background: '#DCFCE7', borderRadius: 10, fontSize: 13, fontWeight: 700 }}>{msg}</div>}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
