import { auth, currentUser } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { companies, users } from '@/lib/db/schema'
import { z } from 'zod'

const schema = z.object({
  companyName: z.string().min(2),
  industry: z.string().optional(),
  size: z.string().optional(),
})

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })

  const clerkUser = await currentUser()
  if (!clerkUser) return new Response('Unauthorized', { status: 401 })

  const body = schema.parse(await req.json())

  const [company] = await db.insert(companies).values({
    name: body.companyName,
    industry: body.industry,
    size: body.size,
  }).returning()

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

  // Save companyId and role in Clerk publicMetadata
  await fetch(`https://api.clerk.com/v1/users/${userId}/metadata`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      public_metadata: {
        companyId: company.id,
        role: 'User',
      },
    }),
  })

  return Response.json({ ok: true })
}
