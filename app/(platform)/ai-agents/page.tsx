import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { aiConversations } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { AGENT_CONFIG, type AgentType } from '@/lib/agents/config'
import Link from 'next/link'
import styles from './page.module.css'

export default async function AIAgentsPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const conversations = await db.query.aiConversations.findMany({
    where: and(
      eq(aiConversations.companyId, session.user.companyId),
      eq(aiConversations.userId, session.user.id!),
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
        agentType="Orquestrador"
        msgCount={msgCountByAgent['Orquestrador'] ?? 0}
        featured
      />

      {/* Specialist grid */}
      <div className={styles.grid}>
        {(['Estratégia', 'Produto', 'Mercado', 'Finanças', 'Branding'] as AgentType[]).map(type => (
          <AgentCard
            key={type}
            agentType={type}
            msgCount={msgCountByAgent[type] ?? 0}
          />
        ))}
      </div>
    </div>
  )
}

function AgentCard({
  agentType,
  msgCount,
  featured = false,
}: {
  agentType: AgentType
  msgCount: number
  featured?: boolean
}) {
  const config = AGENT_CONFIG[agentType]
  const hasHistory = msgCount > 0

  return (
    <Link
      href={`/ai-agents/${encodeURIComponent(agentType)}`}
      className={`${styles.card} ${featured ? styles.cardFeatured : ''}`}
    >
      <div className={styles.cardContent}>
        <div
          className={styles.avatar}
          style={{ background: config.color, color: '#fff' }}
        >
          {agentType.charAt(0)}
        </div>
        <div className={styles.cardInfo}>
          <div>
            <span className={styles.agentTitle}>{config.title}</span>
            <span className={styles.agentRole}>{config.role}</span>
          </div>
          <p className={styles.agentDesc}>{config.description}</p>
          <div className={styles.cardFooter}>
            <span
              className={styles.msgBadge}
              style={{ background: config.colorBg, color: config.color }}
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
