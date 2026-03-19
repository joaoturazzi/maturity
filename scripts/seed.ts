import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from '../lib/db/schema'
import * as relations from '../lib/db/relations'
import * as fs from 'fs'
import * as path from 'path'

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error('Missing DATABASE_URL environment variable')
  process.exit(1)
}

const sql = neon(DATABASE_URL)
const db = drizzle(sql, { schema: { ...schema, ...relations } })

const DIMENSION_COLORS: Record<string, { color: string; bg: string }> = {
  'Estratégia': { color: '#1a5276', bg: '#eaf2fb' },
  'Produto':    { color: '#8e44ad', bg: '#f5eef8' },
  'Mercado':    { color: '#1e8449', bg: '#eafaf1' },
  'Finanças':   { color: '#d68910', bg: '#fef9e7' },
  'Branding':   { color: '#c0392b', bg: '#fdedec' },
  'Pessoas':    { color: '#c0392b', bg: '#fdedec' },
}

const DIMENSIONS = [
  { name: 'Estratégia', description: 'Planejamento, OKRs, modelos de negócio, expansão', orderIndex: 1 },
  { name: 'Produto',    description: 'UX, roadmap, entrega, conformidade, propriedade intelectual', orderIndex: 2 },
  { name: 'Mercado',    description: 'GTM, personas, posicionamento, canais, fidelização', orderIndex: 3 },
  { name: 'Finanças',   description: 'Fluxo de caixa, valuation, LTV/CAC, precificação', orderIndex: 4 },
  { name: 'Branding',   description: 'Identidade de marca, posicionamento, comunicação', orderIndex: 5 },
  { name: 'Pessoas', description: 'Equipe, cultura, liderança e desenvolvimento de pessoas', orderIndex: 6 },
]

async function seed() {
  console.log('Seeding dimensions...')

  const questionsRaw = fs.readFileSync(
    path.join(__dirname, '../data/seed/questions.json'),
    'utf-8'
  )
  const questionsData = JSON.parse(questionsRaw)

  if (questionsData.indicators.length <= 1) {
    console.warn('⚠ questions.json contains only the example indicator.')
    console.warn('  Populate with ~150 indicators from Paulo\'s Excel before production seed.')
  }

  for (const dim of DIMENSIONS) {
    const colors = DIMENSION_COLORS[dim.name]
    const [inserted] = await db.insert(schema.dimensions).values({
      name: dim.name,
      description: dim.description,
      color: colors.color,
      colorBg: colors.bg,
      orderIndex: dim.orderIndex,
    }).returning()

    console.log(`Dimensão criada: ${dim.name} (${inserted.id})`)

    // Inserir indicadores desta dimensão
    const dimRawIndicators = (questionsData.indicators as any[])
      .filter((i: any) => i.dimension === dim.name)
    const dimIndicators = dimRawIndicators.map((ind: any, idx: number) => ({
        dimensionId: inserted.id,
        title: ind.title,
        description: ind.description ?? null,
        weight: String(1 / dimRawIndicators.length),
        orderIndex: idx + 1,
        responseOptions: ind.response_options,
        feedbackPerLevel: ind.feedback_per_level,
        hasNaOption: ind.has_na_option ?? false,
      }))

    if (dimIndicators.length > 0) {
      await db.insert(schema.indicators).values(dimIndicators)
      console.log(`  ${dimIndicators.length} indicadores inseridos`)
    }
  }

  console.log('Seed concluído!')
  process.exit(0)
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
