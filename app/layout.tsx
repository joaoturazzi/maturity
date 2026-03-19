import { ClerkProvider } from '@clerk/nextjs'
import type { Metadata } from 'next'
import '@/styles/globals.css'
import '@/styles/tokens.css'
import '@/styles/brand.css'

export const metadata: Metadata = {
  title: 'MaturityIQ — Grow Platform',
  description: 'Plataforma de maturidade estratégica para empresas',
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
