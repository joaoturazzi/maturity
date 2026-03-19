import { auth, currentUser, clerkClient } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { companies, users } from '@/lib/db/schema'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const schema = z.object({
  companyName: z.string().min(2),
  industry: z.string().optional(),
  size: z.string().optional(),
})

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const clerkUser = await currentUser()
    if (!clerkUser) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const body = schema.parse(await req.json())

    // 1. Create company in Neon
    const [company] = await db.insert(companies).values({
      name: body.companyName,
      industry: body.industry,
      size: body.size,
    }).returning()

    // 2. Create user in Neon linked to Clerk
    await db.insert(users).values({
      id: userId,
      email: clerkUser.emailAddresses[0]?.emailAddress ?? '',
      name: clerkUser.fullName ?? '',
      role: 'User',
      companyId: company.id,
    }).onConflictDoUpdate({
      target: users.id,
      set: { companyId: company.id },
    })

    // 3. Save companyId and role in Clerk publicMetadata
    const client = await clerkClient()
    await client.users.updateUser(userId, {
      publicMetadata: {
        companyId: company.id,
        role: 'User',
      },
    })

    return Response.json({ ok: true, companyId: company.id })
  } catch (error) {
    console.error('[onboarding]', error)
    return Response.json({ error: 'Erro ao criar empresa' }, { status: 500 })
  }
}
