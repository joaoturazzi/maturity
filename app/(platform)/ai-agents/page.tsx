import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { aiConversations } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { AGENT_CONFIGS, AGENT_ORDER } from '@/lib/agents/config'
import { getCompanyId } from '@/lib/getCompanyId'
import Link from 'next/link'
import styles from './page.module.css'

export default async function AIAgentsPage() {
  const { userId } = await auth()
  if (!userId) redirect('/login')

  const companyId = await getCompanyId()
  if (!companyId) redirect('/onboarding')

  // Count messages per agent
  const conversations = await db.query.aiConversations.findMany({
    where: and(
      eq(aiConversations.companyId, companyId),
      eq(aiConversations.userId, userId),
    ),
    with: {
      messages: { columns: { id: true } },
    },
  })

  const msgCountByAgent: Record<string, number> = {}
  for (const c of conversations) {
    if (c.agentType) msgCountByAgent[c.agentType] = c.messages.length
  }

  return (
    <div className={styles.page}>
      <div>
        <span className={styles.sectionLabel}>Conselheiros estratégicos</span>
        <h1 className={styles.title}>AI Agents</h1>
        <p className={styles.subtitle}>
          Cada agente conhece seu diagnóstico e está pronto para guiar a execução.
        </p>
      </div>

      {/* Orchestrator - featured card */}
      <AgentCard
        agentKey="orquestrador"
        msgCount={msgCountByAgent['orquestrador'] ?? 0}
        featured
      />

      {/* Specialist grid */}
      <div className={styles.grid}>
        {AGENT_ORDER.filter(k => k !== 'orquestrador').map(key => (
          <AgentCard
            key={key}
            agentKey={key}
            msgCount={msgCountByAgent[key] ?? 0}
          />
        ))}
      </div>
    </div>
  )
}

function AgentCard({
  agentKey,
  msgCount,
  featured = false,
}: {
  agentKey: string
  msgCount: number
  featured?: boolean
}) {
  const config = AGENT_CONFIGS[agentKey]
  if (!config) return null
  const hasHistory = msgCount > 0

  return (
    <Link
      href={`/ai-agents/${agentKey}`}
      className={`${styles.card} ${featured ? styles.cardFeatured : ''}`}
    >
      <div className={styles.cardContent}>
        <div
          className={styles.avatar}
          style={{ background: config.color, color: '#fff' }}
        >
          {config.name.charAt(0)}
        </div>
        <div className={styles.cardInfo}>
          <div>
            <span className={styles.agentTitle}>{config.name}</span>
            <span className={styles.agentRole}>{config.role}</span>
          </div>
          <p className={styles.agentDesc}>{config.description}</p>
          <div className={styles.cardFooter}>
            <span
              className={styles.msgBadge}
              style={{ background: config.bg, color: config.color }}
            >
              {hasHistory ? `${msgCount} mensagens` : 'Nova conversa'}
            </span>
            <span className={styles.cta} style={{ color: config.color }}>
              {hasHistory ? 'Continuar →' : 'Iniciar →'}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
