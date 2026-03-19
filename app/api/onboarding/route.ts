export const dynamic = 'force-dynamic'

import { auth, clerkClient } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { companies, users } from '@/lib/db/schema'

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { companyName, industry, size } = await req.json()

    if (!companyName?.trim()) {
      return Response.json({ error: 'Nome da empresa é obrigatório.' }, { status: 400 })
    }

    // 1. Create company in Neon
    const [company] = await db.insert(companies).values({
      name: companyName.trim(),
      industry,
      size,
    }).returning()

    // 2. Create user in Neon (email placeholder — Clerk manages the real email)
    await db.insert(users).values({
      id: userId,
      email: `${userId}@clerk.maturityiq`,
      companyId: company.id,
      role: 'User',
    }).onConflictDoUpdate({
      target: users.id,
      set: { companyId: company.id, role: 'User' },
    })

    // 3. Save companyId in Clerk publicMetadata — THIS IS CRITICAL
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
