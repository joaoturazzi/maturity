import { auth } from '@clerk/nextjs/server'
import { getAvailablePeriods } from '@/lib/db/queries/reports'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { userId, sessionClaims } = await auth()
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const companyId = (sessionClaims?.metadata as Record<string, string>)?.companyId as string
    const periods = await getAvailablePeriods(companyId)
    return Response.json(periods)
  } catch (error) {
    console.error('[reports/periods/GET]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
