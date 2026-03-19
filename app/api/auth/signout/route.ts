export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'

export async function POST() {
  try {
    const cookieStore = await cookies()
    cookieStore.delete('maturityiq_company')
    return Response.json({ ok: true })
  } catch {
    return Response.json({ ok: true })
  }
}
