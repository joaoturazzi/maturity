import { auth } from '@clerk/nextjs/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

/**
 * Get companyId from 3 sources in order:
 * 1. JWT metadata (requires Clerk JWT template config)
 * 2. httpOnly cookie (set instantly during onboarding)
 * 3. Database lookup (last resort for old sessions)
 */
export async function getCompanyId(): Promise<string> {
  const { userId, sessionClaims } = await auth()
  if (!userId) return ''

  // 1. JWT metadata (fast when Clerk JWT template is configured)
  const meta = sessionClaims?.metadata as Record<string, string> | undefined
  const jwtId = meta?.companyId ?? ''
  if (jwtId) return jwtId

  // 2. httpOnly cookie (instant, set during onboarding)
  const store = await cookies()
  const cookieId = store.get('maturityiq_company')?.value ?? ''
  if (cookieId) return cookieId

  // 3. Database lookup (last resort — covers old sessions without cookie)
  const userInDb = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { companyId: true },
  })
  const dbId = userInDb?.companyId ?? ''

  // If found in DB, set the cookie for future requests
  if (dbId) {
    try {
      store.set('maturityiq_company', dbId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
      })
    } catch {
      // cookies().set() may fail in some contexts — ignore
    }
  }

  return dbId
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
