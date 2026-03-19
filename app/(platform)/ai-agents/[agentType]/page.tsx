import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { aiConversations, aiMessages } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { AGENT_CONFIG, type AgentType } from '@/lib/agents/config'
import { getLatestCycle } from '@/lib/db/queries'
import { ChatInterface } from '@/components/ai-agents/ChatInterface/ChatInterface'
import { AgentContextPanel } from '@/components/ai-agents/AgentContextPanel/AgentContextPanel'
import Link from 'next/link'
import styles from './page.module.css'

export default async function AgentChatPage({
  params,
}: {
  params: { agentType: string }
}) {
  const session = await auth()
  if (!session) redirect('/login')

  const agentType = decodeURIComponent(params.agentType) as AgentType
  const config = AGENT_CONFIG[agentType]
  if (!config) redirect('/ai-agents')

  const conversation = await db.query.aiConversations.findFirst({
    where: and(
      eq(aiConversations.companyId, session.user.companyId),
      eq(aiConversations.userId, session.user.id!),
      eq(aiConversations.agentType, agentType),
    ),
    with: {
      messages: { orderBy: aiMessages.createdAt },
    },
  })

  const initialMessages = (conversation?.messages ?? []).map(m => ({
    id: m.id,
    role: m.role as 'user' | 'assistant',
    content: m.content ?? '',
  }))

  const latestCycle = await getLatestCycle(session.user.companyId)

  return (
    <div className={styles.layout}>
      <div className={styles.chatColumn}>
        <div className={styles.chatHeader}>
          <Link href="/ai-agents" className={styles.backLink}>← Agentes</Link>
          <span className={styles.sep}>|</span>
          <div className={styles.agentAvatar} style={{ background: config.color }}>
            {agentType.charAt(0)}
          </div>
          <div>
            <span className={styles.agentTitle}>{config.title}</span>
            <span className={styles.agentRole}>{config.role}</span>
          </div>
        </div>

        <ChatInterface
          agentType={agentType}
          agentColor={config.color}
          agentColorBg={config.colorBg}
          initialMessages={initialMessages}
          hasHistory={initialMessages.length > 0}
        />
      </div>

      <AgentContextPanel
        agentType={agentType}
        agentConfig={config}
        latestCycle={latestCycle}
      />
    </div>
  )
}
