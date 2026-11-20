"use client"
import { useState } from 'react'
import Link from 'next/link'
export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const nav = [
    { nom: 'Tableau de bord', href: '/', emoji: '🏠' },
    { nom: 'Cheptel', href: '/cheptel', emoji: '🐷' },
    { nom: 'Reproduction', href: '/reproduction', emoji: '🐖' },
    { nom: 'Répertoire Truies', href: '/repertoire-truies', emoji: '🐽' },
    { nom: 'Alimentation', href: '/alimentation', emoji: '🍽️' },
    { nom: 'Ventes', href: '/ventes', emoji: '💰' },
    { nom: 'Pesées', href: '/pesees', emoji: '⚖️' },
    { nom: 'Santé', href: '/sante', emoji: '💊' },
    { nom: 'Finances', href: '/finances', emoji: '💵' },
    { nom: 'Approbations', href: '/approbations', emoji: '✅' },
    { nom: 'Rapports', href: '/rapports', emoji: '📊' },
    { nom: 'Audit & Utilisateurs', href: '/audit', emoji: '👥' },
  ]
  const bottom = [
    { nom: 'Accueil', href: '/', emoji: '🏠' },
    { nom: 'Cheptel', href: '/cheptel', emoji: '🐷' },
    { nom: 'Manger', href: '/alimentation', emoji: '🍽️' },
    { nom: 'Finances', href: '/finances', emoji: '💰' },
  ]
  return (
    <html lang="fr">
      <head><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" /></head>
      <body style={{ margin: 0, fontFamily: 'sans-serif', background: '#F6F7F9', paddingBottom: 70 }}>
        <style>{`
          /* VERSION TELEPHONE - pour TOUT Agronova */
          @media (max-width: 767px) {
            /* La barre latérale PC de 250px disparaît sur téléphone */
            aside, nav[class*="sidebar"], div[style*="width: 250"] { display: none !important; }
            /* Les pages qui étaient en flex avec sidebar passent en 1 colonne */
            div[style*="display: flex"] { flex-direction: column !important; }
            /* Les grilles 6, 5, 4, 3 colonnes passent en 1 ou 2 colonnes sur téléphone */
            div[style*="gridTemplateColumns: 'repeat(6"] { grid-template-columns: 1fr 1fr !important; }
            div[style*="gridTemplateColumns: 'repeat(5"] { grid-template-columns: 1fr 1fr !important; }
            div[style*="gridTemplateColumns: 'repeat(4"] { grid-template-columns: 1fr 1fr !important; }
            div[style*="gridTemplateColumns: 'repeat(3"] { grid-template-columns: 1fr !important; }
            div[style*="gridTemplateColumns: '2fr 1fr'"] { grid-template-columns: 1fr !important; }
            /* Les tableaux : on les fait scroller horizontalement, ils ne sont plus écrasés */
            table { display: block; overflow-x: auto; white-space: nowrap; min-width: 100%; }
            /* Les boutons deviennent plus gros pour 1 doigt */
            button, a { min-height: 44px; }
            h1 { font-size: 22px !important; }
            /* Le contenu ne touche plus les bords */
            div[style*="padding: 20"] { padding: 12px !important; }
          }
          @media (min-width: 768px) {
            .mobile-topbar, .mobile-bottombar, .mobile-menu { display: none !important; }
          }
        `}</style>
        {/* BARRE HAUT TELEPHONE - visible seulement sur téléphone */}
        <div className="mobile-topbar" style={{ background: '#16A34A', color: 'white', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 40 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ width: 32, height: 32, background: 'white', color: '#16A34A', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>A</div>
            <div><div style={{ fontWeight: 900, fontSize: 16, lineHeight: 1 }}>AGRONOVA</div><div style={{ fontSize: 10, opacity: 0.9 }}>Guinée - Conakry • Élevage porcin</div></div>
          </div>
          <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: 'white', color: '#16A34A', border: 'none', padding: '8px 12px', borderRadius: 8, fontWeight: 800, fontSize: 18, cursor: 'pointer' }}>{menuOpen ? '✕' : '☰'}</button>
        </div>
        {menuOpen && (
          <div className="mobile-menu" style={{ background: 'white', padding: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, borderBottom: '1px solid #E5E5E5', position: 'sticky', top: 56, zIndex: 30 }}>
            {nav.map((m: any) => (<Link key={m.nom} href={m.href} onClick={() => setMenuOpen(false)} style={{ background: '#F6F7F9', padding: 12, borderRadius: 10, fontWeight: 700, textDecoration: 'none', color: '#111', fontSize: 13, textAlign: 'center' }}>{m.emoji} {m.nom}</Link>))}
            <div style={{ gridColumn: 'span 2', background: '#F0FDF4', padding: 10, borderRadius: 10, fontSize: 12, textAlign: 'center' }}>Rôle : <b>Propriétaire</b> • Données synchronisées • Supabase • RLS actif</div>
          </div>
        )}
        {/* TOUTES TES PAGES ACTUELLES S'AFFICHENT ICI - Tableau de bord, Cheptel, Alimentation, Ventes, Pesées, Santé, Finances, etc. */}
        <div>{children}</div>
        {/* BARRE BAS TELEPHONE - navigation 1 doigt, pour TOUT Agronova */}
        <div className="mobile-bottombar" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', borderTop: '1px solid #E5E5E5', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', padding: '8px 0 14px 0', zIndex: 40 }}>
          {bottom.map((m: any) => (<Link key={m.nom} href={m.href} style={{ textAlign: 'center', textDecoration: 'none', color: '#111', fontSize: 12, fontWeight: 700 }}>{m.emoji}<br />{m.nom}</Link>))}
        </div>
      </body>
    </html>
  )
}
