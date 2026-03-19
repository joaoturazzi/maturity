export function DiagnosticSkeleton() {
  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ height: 24, width: 200, background: '#f0efec', borderRadius: 6, animation: 'pulse 1.5s infinite' }} />
      <div style={{ height: 16, width: 300, background: '#f0efec', borderRadius: 6, animation: 'pulse 1.5s infinite' }} />

      {[1, 2, 3, 4, 5].map(i => (
        <div
          key={i}
          style={{
            height: 72,
            background: '#f0efec',
            borderRadius: 8,
            animation: 'pulse 1.5s infinite',
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}
