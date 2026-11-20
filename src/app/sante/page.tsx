"use client"
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function SantePage() {
  const [animaux, setAnimaux] = useState<any[]>([])
  const [soins, setSoins] = useState<any[]>([])
  const [animalCode, setAnimalCode] = useState('AG-PC-1')
  const [typeSoin, setTypeSoin] = useState('Vermifuge')
  const [produit, setProduit] = useState('')
  const [dateSoin, setDateSoin] = useState('2026-11-19')
  const [cout, setCout] = useState('')
  const [dose, setDose] = useState('')
  const [duree, setDuree] = useState('1')
  const [symptomes, setSymptomes] = useState('')
  const [veterinaire, setVeterinaire] = useState('')
  const [delaiAttente, setDelaiAttente] = useState('15')
  const [isolement, setIsolement] = useState('Non')
  const [msg, setMsg] = useState('')

  const charger = async () => {
    const { data: a } = await supabase.from('animaux').select('*').eq('statut', 'actif').order('enclos')
    setAnimaux(a || [])
    if (a && a.length > 0) setAnimalCode(a[0].code)
    const { data: s } = await supabase.from('soins_sante').select('*').order('date_soin', { ascending: false }).limit(50)
    setSoins(s || [])
  }
  useEffect(() => { charger(); const d = new Date(); const iso = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0'); setDateSoin(iso); }, [])

  const ajouterSoin = async () => {
    const ag = animaux.find((x: any) => x.code === animalCode)
    // Prochaine date : vermifuge +90j, vaccin +180j, fer +21j
    let jours = 90
    if (typeSoin === 'Vaccin') jours = 180
    if (typeSoin === 'Fer') jours = 21
    if (typeSoin === 'Traitement') jours = 7
    const prochaine = new Date(new Date(dateSoin).getTime() + jours * 86400000).toISOString().slice(0,10)
    const { error } = await supabase.from('soins_sante').insert({ animal_code: animalCode, enclos: ag?.enclos || '', type_soin: typeSoin, produit: produit || typeSoin, date_soin: dateSoin, prochaine_date: prochaine, note: 'Symptômes: ' + symptomes + ' | Dose: ' + dose + ' | Durée: ' + duree + 'j | Délai attente: ' + delaiAttente + 'j | Véto: ' + veterinaire + ' | Isolement: ' + isolement, cout_gnf: Number(cout || 0) })
    if (error) { setMsg('Erreur : ' + error.message); return }
    setMsg(typeSoin + ' enregistré pour ' + animalCode + ' le ' + dateSoin + '. Prochain : ' + prochaine + '. Délai attente : ne pas vendre avant le ' + new Date(new Date(dateSoin).getTime() + Number(delaiAttente || 15) * 86400000).toLocaleDateString('fr-FR') + (isolement === 'Oui' ? ' | Mettre à part en B5-Quarantaine.' : ''))
    setProduit(''); setCout(''); charger()
  }

  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'
  const totalCout = soins.reduce((s: number, x: any) => s + Number(x.cout_gnf || 0), 0)

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
        ].map((m: any) => (<a key={m.nom} href={m.href} style={{ display: 'block', padding: '10px 12px', borderRadius: 10, background: m.nom === 'Sante' ? '#16A34A' : 'white', color: m.nom === 'Sante' ? 'white' : '#111', fontWeight: 700, marginTop: 4, textDecoration: 'none', fontSize: 13 }}>{m.nom}</a>))}
      </div>
      <div style={{ flex: 1, padding: 20, maxWidth: 900 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, margin: 0 }}>Santé</h1>
        <p style={{ color: '#666', fontSize: 13 }}>Vaccins, vermifuges, traitements. Chaque soin est noté, avec la prochaine date. Total dépensé : {totalCout.toLocaleString()} GNF</p>

        <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', padding: 12, borderRadius: 12, fontSize: 13, marginTop: 12 }}>
          <b>Conseil pour tes porcelets B3 (30 kg) :</b> Vermifuge maintenant, puis vaccin. Vermifuge tous les 3 mois. Pour tes truies gestantes B1, vermifuge avant la mise bas du 12 mars 2027, pas après. Demande à ton vétérinaire le nom du vaccin disponible à Conakry. Note toujours la dose, la durée et le délai d’attente — sinon on ne sait pas si le traitement est fini ni quand on peut vendre.
        </div>

        <div style={{ background: 'white', padding: 16, borderRadius: 14, border: '1px solid #E5E5E5', marginTop: 14 }}>
          <b>+ Nouveau soin</b>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
            <div><label style={{ fontSize: 12 }}>Animal</label><select value={animalCode} onChange={(e: any) => setAnimalCode(e.target.value)} style={{ width: '100%', padding: 10, border: '1px solid #DDD', borderRadius: 8, marginTop: 4 }}>{animaux.map((a: any) => (<option key={a.code} value={a.code}>{a.code} — Lot {a.enclos} — {a.categorie}</option>))}<option value='TOUT LOT B3'>TOUT LOT B3 - 10 Porcelets</option><option value='TOUT LOT B1'>TOUT LOT B1 - Truies</option></select></div>
            <div><label style={{ fontSize: 12 }}>Type de soin</label><select value={typeSoin} onChange={(e: any) => setTypeSoin(e.target.value)} style={{ width: '100%', padding: 10, border: '1px solid #DDD', borderRadius: 8, marginTop: 4 }}><option>Vermifuge</option><option>Vaccin</option><option>Fer</option><option>Traitement</option><option>Autre</option></select></div>
            <div><label style={{ fontSize: 12 }}>Produit (nom)</label><input value={produit} onChange={(e: any) => setProduit(e.target.value)} placeholder='Ex: Ivermectine, Vaccin peste...' style={{ width: '100%', padding: 10, border: '1px solid #DDD', borderRadius: 8, marginTop: 4 }} /></div>
            <div><label style={{ fontSize: 12 }}>Date du soin</label><input type='date' value={dateSoin} onChange={(e: any) => setDateSoin(e.target.value)} style={{ width: '100%', padding: 10, border: '1px solid #DDD', borderRadius: 8, marginTop: 4 }} /></div>
            <div><label style={{ fontSize: 12 }}>Symptômes (pourquoi tu soignes ?)</label><input value={symptomes} onChange={(e: any) => setSymptomes(e.target.value)} placeholder='Ex: Fièvre, toux, diarrhée, pas d’appétit, boiterie...' style={{ width: '100%', padding: 10, border: '1px solid #DDD', borderRadius: 8, marginTop: 4 }} /></div>
            <div><label style={{ fontSize: 12 }}>Dose</label><input value={dose} onChange={(e: any) => setDose(e.target.value)} placeholder='Ex: 2 ml, 1 comprimé, 5 mg/kg...' style={{ width: '100%', padding: 10, border: '1px solid #DDD', borderRadius: 8, marginTop: 4 }} /></div>
            <div><label style={{ fontSize: 12 }}>Durée du traitement (jours)</label><input type='number' value={duree} onChange={(e: any) => setDuree(e.target.value)} placeholder='1' style={{ width: '100%', padding: 10, border: '1px solid #DDD', borderRadius: 8, marginTop: 4 }} /></div>
            <div><label style={{ fontSize: 12 }}>Délai d’attente avant vente (jours) — très important</label><input type='number' value={delaiAttente} onChange={(e: any) => setDelaiAttente(e.target.value)} placeholder='15' style={{ width: '100%', padding: 10, border: '1px solid #DDD', borderRadius: 8, marginTop: 4 }} /></div>
            <div><label style={{ fontSize: 12 }}>Vétérinaire</label><input value={veterinaire} onChange={(e: any) => setVeterinaire(e.target.value)} placeholder='Nom du vétérinaire à Conakry' style={{ width: '100%', padding: 10, border: '1px solid #DDD', borderRadius: 8, marginTop: 4 }} /></div>
            <div><label style={{ fontSize: 12 }}>Mettre à part en Quarantaine B5 ?</label><select value={isolement} onChange={(e: any) => setIsolement(e.target.value)} style={{ width: '100%', padding: 10, border: '1px solid #DDD', borderRadius: 8, marginTop: 4 }}><option>Non</option><option>Oui</option></select></div>
            <div><label style={{ fontSize: 12 }}>Coût GNF (optionnel)</label><input type='number' value={cout} onChange={(e: any) => setCout(e.target.value)} placeholder='0' style={{ width: '100%', padding: 10, border: '1px solid #DDD', borderRadius: 8, marginTop: 4 }} /></div>
          </div>
          <button onClick={ajouterSoin} style={{ width: '100%', marginTop: 12, background: '#16A34A', color: 'white', border: 'none', padding: 12, borderRadius: 8, fontWeight: 800, cursor: 'pointer' }}>Enregistrer le soin</button>
          {msg && <div style={{ marginTop: 10, background: '#DCFCE7', padding: 10, borderRadius: 8, fontSize: 13 }}>{msg}</div>}
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', padding: 10, borderRadius: 8, fontSize: 12, marginTop: 10 }}><b>⚠ Délai d’attente :</b> Après un traitement, ne vends pas le porc avant la fin du délai, sinon la viande a encore du médicament. Si tu choisis Isolement Oui, mets le porc à part en B5-Quarantaine pour ne pas contaminer le lot.</div>
          <div style={{ fontSize: 11, color: '#666', marginTop: 8 }}>Prochaine date calculée automatiquement : Vermifuge +90j, Vaccin +180j, Fer +21j, Traitement +7j. Si tu choisis TOUT LOT B3, ça enregistre pour les 10 porcelets ? Non, pour l'instant enregistre 1 ligne pour le lot, note-le dans Produit.</div>
        </div>


        <div style={{ background: 'white', padding: 16, borderRadius: 14, border: '1px solid #E5E5E5', marginTop: 14 }}>
          <b>📋 Protocole Expert AGRONOVA — Calendrier automatique (à adapter avec ton vétérinaire)</b>
          <div style={{ fontSize: 13, marginTop: 10, lineHeight: 1.7 }}>
            <b>Porcelets (B3) :</b><br />
            • J3 : Fer (anémie) + Coupe queue / Castration si besoin<br />
            • J14-21 : 1er Vermifuge<br />
            • J30 : Sevrage + 2e Vermifuge<br />
            • J45 : Vaccin Peste Porcine + Vaccin Rouget<br />
            • J75 : Rappel Vaccin + 3e Vermifuge<br />
            • Puis Vermifuge tous les 90 jours<br /><br />
            <b>Truies gestantes (B1) :</b><br />
            • Avant saillie : Vaccin + Vermifuge<br />
            • J90 gestation : Vaccin rappel (pour protéger les porcelets par le lait)<br />
            • 7 jours avant mise bas : Vermifuge + Nettoyage enclos maternité<br />
            • Après mise bas : Surveiller fièvre, appétit, lait<br /><br />
            <b>Verrat (B6) :</b><br />
            • Vermifuge tous les 90 jours<br />
            • Vaccin tous les 180 jours<br />
            • Contrôle poids + pattes avant chaque saillie<br /><br />
            <b>Nouvel arrivant :</b><br />
            • 21 jours en B5-Quarantaine, seul. Ne jamais le mettre direct avec les autres.<br />
            • J1 : Examen + Vermifuge + Vaccin si pas à jour<br />
            • J21 : Si en bonne santé, il peut rejoindre le lot.<br />
          </div>
        </div>

        <div style={{ background: '#F0FDF4', padding: 16, borderRadius: 14, border: '1px solid #BBF7D0', marginTop: 14 }}>
          <b>🛡 Biosécurité — 80% des maladies évitées ici</b>
          <div style={{ fontSize: 13, marginTop: 8, lineHeight: 1.7 }}>
            • Change de bottes / lave tes bottes entre B1, B3 et B6. Ne passe pas de B3 à B1 avec les mêmes bottes.<br />
            • Lave-toi les mains avant de toucher les porcelets.<br />
            • Désinfecte l'enclos après chaque départ de lot, laisse sécher 2 jours avant de remettre des porcs.<br />
            • Pas de visiteur dans les bâtiments sans bottes propres.<br />
            • Eau propre tous les jours, mangeoire nettoyée. Un porc qui boit de l'eau sale tombe malade.<br />
            • Si un porc est malade, soigne-le en dernier, après les porcs en bonne santé, pour ne pas porter la maladie.
          </div>
        </div>

        <div style={{ background: 'white', padding: 16, borderRadius: 14, border: '1px solid #E5E5E5', marginTop: 14 }}>
          <b>⚠ Alertes Expert</b>
          <div style={{ fontSize: 13, marginTop: 8, lineHeight: 1.7 }}>
            {soins.length === 0 ? <span>Aucun soin pour l'instant. Pense au vermifuge B3 cette semaine.</span> : soins.filter((s: any) => s.prochaine_date && new Date(s.prochaine_date) < new Date()).length > 0 ? <span style={{ color: '#DC2626', fontWeight: 800 }}>EN RETARD : {soins.filter((s: any) => s.prochaine_date && new Date(s.prochaine_date) < new Date()).length} soin(s) en retard. Va voir l'historique ci-dessous, la date Prochain est passée.</span> : <span style={{ color: '#166534' }}>✅ Aucun soin en retard. Prochain soin : {soins[0] ? fmtDate(soins[0].prochaine_date) : '-'}</span>}
            <br /><span style={{ fontSize: 12, color: '#666' }}>Règle d'expert : 2 morts avec les mêmes symptômes la même semaine = alerte. Appelle ton vétérinaire, ne traite pas seul. Note toujours la cause de mortalité dans Cheptel.</span>
          </div>
        </div>
        <div style={{ background: 'white', padding: 16, borderRadius: 14, border: '1px solid #E5E5E5', marginTop: 14 }}>
          <b>Historique des soins</b>
          {soins.length === 0 ? <p style={{ fontSize: 13, color: '#666', marginTop: 8 }}>Aucun soin enregistré. Ajoute ton premier soin ci-dessus, tranquillement.</p> : soins.map((s: any) => (<div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #F5F5F5', fontSize: 13 }}><span><b>{s.animal_code}</b> — {s.type_soin} — {s.produit}<br /><span style={{ fontSize: 12, color: '#666' }}>Fait le {fmtDate(s.date_soin)} • Prochain : {fmtDate(s.prochaine_date)}</span></span><span>{Number(s.cout_gnf || 0).toLocaleString()} GNF</span></div>))}
        </div>
      </div>
    </div>
  )
}
