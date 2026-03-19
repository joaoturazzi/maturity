import { auth, clerkClient } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { companies, users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { companyName } = await req.json().catch(() => ({ companyName: 'Minha Empresa' }))

    // Check if user already exists in our DB
    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    })

    let companyId = existingUser?.companyId

    if (!companyId) {
      // Create company
      const [company] = await db.insert(companies).values({
        name: companyName ?? 'Minha Empresa',
        industry: 'Tecnologia',
        size: '1-10',
      }).returning()
      companyId = company.id

      // Create or update user
      await db.insert(users).values({
        id: userId,
        email: 'pending@fix.com',
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
    console.error('[debug/fix-user]', error)
    return Response.json({ error: String(error) }, { status: 500 })
  }
}
