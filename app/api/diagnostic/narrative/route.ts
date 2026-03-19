export const dynamic = 'force-dynamic'

import { auth } from '@clerk/nextjs/server'
import { getCompanyId } from '@/lib/getCompanyId'
import { generateNarrativeForDimension } from '@/lib/services/generateNarrative'

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const companyId = await getCompanyId()
    if (!companyId) return Response.json({ error: 'Forbidden' }, { status: 403 })

    const { cycleId, dimensionId } = await req.json()
    if (!cycleId || !dimensionId) {
      return Response.json({ error: 'cycleId and dimensionId required' }, { status: 400 })
    }

    const narrative = await generateNarrativeForDimension(cycleId, dimensionId)
    return Response.json({ narrative })
  } catch (error) {
    console.error('[narrative]', error)
    return Response.json({ error: 'Internal error' }, { status: 500 })
  }
}
