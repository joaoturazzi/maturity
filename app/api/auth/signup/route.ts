import { db } from '@/lib/db'
import { users, companies } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { hash } from 'bcryptjs'
import { z } from 'zod'

const signupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  companyName: z.string().min(2),
  industry: z.string().optional(),
  size: z.string().optional(),
})

export async function POST(req: Request) {
  try {
    const body = signupSchema.parse(await req.json())

    // Check email uniqueness
    const existing = await db.query.users.findFirst({
      where: eq(users.email, body.email),
    })
    if (existing) {
      return Response.json({ error: 'Email já cadastrado' }, { status: 409 })
    }

    // Create company
    const [company] = await db.insert(companies).values({
      name: body.companyName,
      industry: body.industry,
      size: body.size,
    }).returning()

    // Create user with hashed password
    const passwordHash = await hash(body.password, 12)
    await db.insert(users).values({
      name: body.name,
      email: body.email,
      password: passwordHash,
      role: 'User',
      companyId: company.id,
    })

    return Response.json({ ok: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: error.issues[0].message }, { status: 400 })
    }
    return Response.json({ error: 'Erro interno' }, { status: 500 })
  }
}
