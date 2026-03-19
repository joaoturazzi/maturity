import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { dimensionScores } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const cycleId = searchParams.get('cycleId')

    if (!cycleId) {
      return Response.json({ error: 'cycleId is required' }, { status: 400 })
    }

    const scores = await db.query.dimensionScores.findMany({
      where: eq(dimensionScores.cycleId, cycleId),
      with: { dimension: true },
    })

    return Response.json({ scores })
  } catch (error) {
    console.error('[diagnostic/scores]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
