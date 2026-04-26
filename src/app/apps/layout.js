/**
 * Layout dédié pour toutes les apps (/apps/*)
 * Zéro Navbar, Footer, aurora, cursor-glow, WalaupLoader
 * Chaque app a son propre design system standalone
 */
export default function AppsLayout({ children }) {
  return (
    <div style={{
      isolation: 'isolate',
      position: 'relative',
      zIndex: 1,
      minHeight: '100vh',
    }}>
      {children}
    </div>
  )
}
