import { auth } from '@/auth'
import { db } from '@/lib/db'
import { dimensionScores } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(request: Request) {
  const session = await auth()
  if (!session) return new Response('Unauthorized', { status: 401 })

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
}
