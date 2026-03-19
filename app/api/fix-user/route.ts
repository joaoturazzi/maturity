import { auth, clerkClient } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { companies, users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    // Check if user exists in DB
    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    })

    let companyId = existingUser?.companyId

    if (!companyId) {
      // Create company
      const [company] = await db.insert(companies).values({
        name: 'Grow Platform',
        industry: 'Tecnologia',
        size: '1-10',
      }).returning()
      companyId = company.id

      // Create or update user
      await db.insert(users).values({
        id: userId,
        email: 'fix@maturityiq.com',
        companyId,
        role: 'User',
      }).onConflictDoUpdate({
        target: users.id,
        set: { companyId },
      })
    }

    // Save to Clerk metadata
    const client = await clerkClient()
    await client.users.updateUser(userId, {
      publicMetadata: { companyId, role: 'User' },
    })

    return Response.json({ ok: true, companyId })
  } catch (error) {
    console.error('[fix-user]', error)
    return Response.json({ error: String(error) }, { status: 500 })
  }
}
