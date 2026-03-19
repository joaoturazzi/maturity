import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif',
      background: '#f7f6f3',
    }}>
      <p style={{ fontSize: 64, fontWeight: 700, color: '#eceae5',
        letterSpacing: '-2px', marginBottom: 0 }}>404</p>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
        Página não encontrada
      </h2>
      <p style={{ fontSize: 13, color: '#888', marginBottom: 24 }}>
        O endereço que você acessou não existe.
      </p>
      <Link href="/dashboard" style={{
        background: '#1a1a1a', color: '#fff', textDecoration: 'none',
        borderRadius: 6, padding: '8px 20px', fontSize: 13,
        fontWeight: 600, fontFamily: 'inherit',
      }}>
        Voltar ao início
      </Link>
    </div>
  )
}
