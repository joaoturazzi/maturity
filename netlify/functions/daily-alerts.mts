import type { Config } from '@netlify/functions'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from '../../lib/db/schema'
import * as relations from '../../lib/db/relations'
import { eq } from 'drizzle-orm'
import { generateAlertsForCompany } from '../../lib/alerts/generateAlerts'

export default async function handler() {
  console.log('[daily-alerts] Iniciando geração de alertas...')

  const sql = neon(process.env.DATABASE_URL!)
  const db = drizzle(sql, { schema: { ...schema, ...relations } })

  const allCompanies = await db.query.companies.findMany()

  for (const company of allCompanies) {
    try {
      await generateAlertsForCompany(company.id)
      console.log(`[daily-alerts] Alertas gerados para: ${company.name}`)
    } catch (err) {
      console.error(`[daily-alerts] Erro para ${company.id}:`, err)
    }
  }

  return new Response('ok')
}

export const config: Config = {
  schedule: '0 11 * * *', // 8h BRT = 11h UTC
}
