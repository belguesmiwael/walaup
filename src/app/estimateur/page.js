function StepIndicator({ current }) {

  const waveCss = `
    @keyframes est-wave {
      0%   { background-position: 0% center; }
      100% { background-position: 200% center; }
    }
    .est-seg-done {
      background: linear-gradient(90deg, #6366F1, #8B5CF6);
      box-shadow: 0 0 6px rgba(99,102,241,0.45);
    }
    .est-seg-wave {
      background: repeating-linear-gradient(
        90deg,
        rgba(99,102,241,0.25) 0px,
        #8B5CF6              10px,
        #a78bfa              18px,
        rgba(99,102,241,0.25) 28px
      );
      background-size: 56px 100%;
      animation: est-wave 1.1s linear infinite;
      box-shadow: 0 0 10px rgba(139,92,246,0.55);
    }
    .est-seg-empty { background: rgba(255,255,255,0.07); }
  `

  const items = []

  STEP_LABELS.forEach(function(label, i) {
    const n    = i + 1
    const done = n < current
    const act  = n === current

    const circleStyle = {
      width: 30, height: 30, borderRadius: '50%',
      background: done ? 'var(--ac)' : act ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
      border: '2px solid ' + (done ? 'var(--ac)' : act ? 'var(--ac)' : 'rgba(255,255,255,0.1)'),
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
      boxShadow: act  ? '0 0 16px rgba(99,102,241,0.55)'
               : done ? '0 0 10px rgba(99,102,241,0.28)'
               : 'none',
    }
    const numStyle = {
      fontSize: 11, fontWeight: 700,
      fontFamily: 'var(--font-mono)',
      color: act ? 'var(--ac)' : 'var(--tx-3)',
    }
    const labelStyle = {
      fontSize: 9, fontWeight: 600,
      letterSpacing: '0.04em', textTransform: 'uppercase',
      color: act ? 'var(--tx)' : done ? 'var(--tx-2)' : 'var(--tx-3)',
      whiteSpace: 'nowrap', textAlign: 'center',
      transition: 'color 0.3s ease',
    }
    const itemStyle = {
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', gap: 4, flexShrink: 0,
    }

    items.push(
      <div key={'s' + n} style={itemStyle}>
        <div style={circleStyle}>
          {done
            ? <Check size={14} color="white" strokeWidth={2.5} />
            : <span style={numStyle}>{n}</span>
          }
        </div>
        <span style={labelStyle}>{label}</span>
      </div>
    )

    if (i < STEP_LABELS.length - 1) {
      const segClass = done ? 'est-seg-done' : act ? 'est-seg-wave' : 'est-seg-empty'
      const segStyle = {
        flex: 1, height: 2, borderRadius: 2,
        marginTop: 14, flexShrink: 1,
        transition: 'background 0.3s ease',
      }
      items.push(
        <div key={'l' + n} style={segStyle} className={segClass} />
      )
    }
  })

  const sWrap = { display: 'flex', alignItems: 'flex-start', width: '100%' }

  return (
    <>
      <style>{waveCss}</style>
      <div style={sWrap}>
        {items}
      </div>
    </>
  )
}
