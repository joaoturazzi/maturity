export default function Loading() {
  return (
    <div style={{
      padding: 24, display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{
          height: 80, background: '#f0efec',
          borderRadius: 8, animation: 'pulse 1.5s infinite',
        }} />
      ))}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}
