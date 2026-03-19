import { auth } from '@clerk/nextjs/server'
import { cookies } from 'next/headers'

/**
 * Get companyId from JWT metadata or httpOnly cookie fallback.
 * The cookie is set immediately during onboarding, while the JWT
 * may take several seconds to propagate through Clerk.
 */
export async function getCompanyId(): Promise<string> {
  const { sessionClaims } = await auth()
  const meta = sessionClaims?.metadata as Record<string, string> | undefined

  // Primary: JWT (fast when available)
  const jwtCompanyId = meta?.companyId ?? ''
  if (jwtCompanyId) return jwtCompanyId

  // Fallback: httpOnly cookie (instant, set during onboarding)
  const cookieStore = await cookies()
  const cookieCompanyId = cookieStore.get('maturityiq_company')?.value ?? ''
  return cookieCompanyId
}

export async function getUserId(): Promise<string> {
  const { userId } = await auth()
  return userId ?? ''
}

export async function getRole(): Promise<string> {
  const { sessionClaims } = await auth()
  const meta = sessionClaims?.metadata as Record<string, string> | undefined
  return meta?.role ?? 'User'
}
