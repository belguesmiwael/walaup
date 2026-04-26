/**
 * Layout standalone pour toutes les apps (/apps/*)
 * Override le page-wrapper de Walaup — zéro espace navbar/footer
 */
export default function AppsLayout({ children }) {
  return (
    <>
      <style>{`
        main.page-wrapper {
          padding-top: 0 !important;
          min-height: 100dvh;
        }
        .aurora-bg,
        .noise-overlay,
        #scroll-progress,
        #cursor-glow,
        #install-banner {
          display: none !important;
        }
      `}</style>
      {children}
    </>
  )
}
