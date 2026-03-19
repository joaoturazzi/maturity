import { SignIn } from '@clerk/nextjs'

export default function LoginPage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f7f6f3',
    }}>
      <SignIn
        appearance={{
          variables: {
            colorPrimary: '#1a1a1a',
            fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif',
            borderRadius: '6px',
          },
        }}
      />
    </div>
  )
}
