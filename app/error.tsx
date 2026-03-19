'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif',
      background: '#f7f6f3',
    }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: '#c0392b',
        textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 8 }}>
        Algo deu errado
      </p>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
        Erro inesperado
      </h2>
      <p style={{ fontSize: 13, color: '#888', marginBottom: 24 }}>
        {error.message || 'Tente novamente ou entre em contato.'}
      </p>
      <button onClick={reset} style={{
        background: '#1a1a1a', color: '#fff', border: 'none',
        borderRadius: 6, padding: '8px 20px', fontSize: 13,
        fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
      }}>
        Tentar novamente
      </button>
    </div>
  )
}
