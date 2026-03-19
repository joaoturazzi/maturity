import { auth } from '@clerk/nextjs/server'
import { getCompanyId } from '@/lib/getCompanyId'
import { db } from '@/lib/db'
import { diagnosticCycles, companies } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const { userId, sessionClaims } = await auth()
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const companyId = await getCompanyId()
    const role = (sessionClaims?.metadata as Record<string, string> | undefined)?.role ?? 'User'

    if (!companyId) {
      return Response.json(
        { error: 'Onboarding não concluído. Complete o cadastro da empresa.' },
        { status: 403 }
      )
    }

    // SuperUser/Admin can start diagnostic for another company
    const body = await req.json().catch(() => ({}))
    let effectiveCompanyId = companyId

    if (body.companyId && (role === 'SuperUser' || role === 'Admin')) {
      const targetCompany = await db.query.companies.findFirst({
        where: eq(companies.id, body.companyId),
      })
      if (!targetCompany) return Response.json({ error: 'Company not found' }, { status: 404 })
      effectiveCompanyId = body.companyId
    }

    // Prevent duplicates: return existing draft if one exists
    const existingDraft = await db.query.diagnosticCycles.findFirst({
      where: and(
        eq(diagnosticCycles.companyId, effectiveCompanyId),
        eq(diagnosticCycles.status, 'Draft'),
      ),
    })
    if (existingDraft) {
      return Response.json({ cycleId: existingDraft.id })
    }

    const [cycle] = await db.insert(diagnosticCycles).values({
      companyId: effectiveCompanyId,
      createdBy: userId,
      status: 'Draft',
    }).returning()

    return Response.json({ cycleId: cycle.id })
  } catch (error) {
    console.error('[diagnostic/start]', error)
    return Response.json({ error: 'Erro interno ao iniciar diagnóstico' }, { status: 500 })
  }
}
