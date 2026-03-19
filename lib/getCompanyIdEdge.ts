import { auth } from '@clerk/nextjs/server'
import { parseClerkMeta } from './clerkMeta'

/**
 * Edge-compatible version of getCompanyId.
 * Only reads from JWT metadata (no DB, no cookies()).
 * Falls back to cookie from request headers.
 */
export async function getCompanyIdEdge(req?: Request): Promise<string> {
  const { sessionClaims } = await auth()
  const jwtId = parseClerkMeta(sessionClaims).companyId ?? ''
  if (jwtId) return jwtId

  // Fallback: read httpOnly cookie from request headers
  if (req) {
    const cookieHeader = req.headers.get('cookie') ?? ''
    const match = cookieHeader.match(/maturityiq_company=([^;]+)/)
    if (match) return match[1]
  }

  return ''
}
