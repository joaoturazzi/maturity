import { ClerkProvider } from '@clerk/nextjs'
import type { Metadata } from 'next'
import '@/styles/globals.css'
import '@/styles/tokens.css'
import '@/styles/brand.css'

export const metadata: Metadata = {
  title: {
    default: 'MaturityIQ — Diagnóstico de Maturidade Empresarial',
    template: '%s | MaturityIQ',
  },
  description: 'Plataforma de diagnóstico estratégico empresarial. Identifique gaps, crie planos de ação e evolua com agentes de IA.',
  icons: {
    icon: '/favicon.svg',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="pt-BR">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}
