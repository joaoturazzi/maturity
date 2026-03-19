import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { diagnosticCycles, companies } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(req: Request) {
  const { userId, sessionClaims } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })

  const meta = sessionClaims?.metadata as Record<string, string> | undefined
  const companyId = meta?.companyId ?? ''
  const role = meta?.role ?? 'User'

  if (!companyId) return new Response('Onboarding incomplete', { status: 403 })

  // SuperUser/Admin can start diagnostic for another company
  const body = await req.json().catch(() => ({}))
  let effectiveCompanyId = companyId

  if (body.companyId && (role === 'SuperUser' || role === 'Admin')) {
    // Validate that the target company exists
    const targetCompany = await db.query.companies.findFirst({
      where: eq(companies.id, body.companyId),
    })
    if (!targetCompany) return new Response('Company not found', { status: 404 })
    effectiveCompanyId = body.companyId
  }

  const [cycle] = await db.insert(diagnosticCycles).values({
    companyId: effectiveCompanyId,
    createdBy: userId,
    status: 'Draft',
  }).returning()

  return Response.json({ cycleId: cycle.id })
}
