'use client'

import { useChat } from '@ai-sdk/react'
import { TextStreamChatTransport } from 'ai'
import { useEffect, useRef, useState, useMemo, type FormEvent } from 'react'
import type { AgentType } from '@/lib/agents/config'
import styles from './ChatInterface.module.css'

type Props = {
  agentType: AgentType
  agentColor: string
  agentColorBg: string
  initialMessages: Array<{ id: string; role: 'user' | 'assistant'; content: string }>
  hasHistory: boolean
}

export function ChatInterface({
  agentType, agentColor, agentColorBg: _agentColorBg, initialMessages, hasHistory,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const [proactiveMsg, setProactiveMsg] = useState<string | null>(null)
  const [loadingProactive, setLoadingProactive] = useState(false)
  const [input, setInput] = useState('')

  const transport = useMemo(
    () => new TextStreamChatTransport({
      api: `/api/agents/${encodeURIComponent(agentType)}`,
    }),
    [agentType]
  )

  const { messages, sendMessage, status } = useChat({
    transport,
    messages: initialMessages.map(m => ({
      id: m.id,
      role: m.role as 'user' | 'assistant',
      parts: [{ type: 'text' as const, text: m.content }],
    })),
  })

  const isLoading = status === 'streaming' || status === 'submitted'

  // Fetch proactive message for new conversations
  useEffect(() => {
    if (!hasHistory && initialMessages.length === 0) {
      setLoadingProactive(true)
      fetch(`/api/agents/${encodeURIComponent(agentType)}/init`)
        .then(r => r.json())
        .then(d => setProactiveMsg(d.message))
        .catch(() => {})
        .finally(() => setLoadingProactive(false))
    }
  }, [agentType, hasHistory, initialMessages.length])

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, proactiveMsg])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    sendMessage({ text: input })
    setInput('')
  }

  function getMessageText(msg: typeof messages[number]): string {
    return msg.parts
      ?.filter((p): p is { type: 'text'; text: string } => p.type === 'text')
      .map(p => p.text)
      .join('') ?? ''
  }

  return (
    <div className={styles.container}>
      <div className={styles.messages}>
        {/* Proactive message */}
        {!hasHistory && proactiveMsg && (
          <div className={styles.bubbleRow}>
            <div className={styles.bubbleAssistant} style={{ borderLeftColor: agentColor }}>
              {proactiveMsg}
            </div>
          </div>
        )}

        {loadingProactive && !proactiveMsg && (
          <div className={styles.bubbleRow}>
            <div className={styles.bubbleAssistant} style={{ borderLeftColor: agentColor }}>
              <span className={styles.typing}>
                <span className={styles.dot} />
                <span className={styles.dot} />
                <span className={styles.dot} />
              </span>
            </div>
          </div>
        )}

        {/* Message history */}
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`${styles.bubbleRow} ${msg.role === 'user' ? styles.bubbleRowUser : ''}`}
          >
            <div
              className={msg.role === 'user' ? styles.bubbleUser : styles.bubbleAssistant}
              style={msg.role !== 'user' ? { borderLeftColor: agentColor } : undefined}
            >
              {getMessageText(msg)}
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className={styles.bubbleRow}>
            <div className={styles.bubbleAssistant} style={{ borderLeftColor: agentColor }}>
              <span className={styles.typing}>
                <span className={styles.dot} />
                <span className={styles.dot} />
                <span className={styles.dot} />
              </span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form className={styles.inputArea} onSubmit={handleSubmit}>
        <input
          className={styles.input}
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Escreva sua mensagem..."
          disabled={isLoading}
        />
        <button
          className={styles.sendBtn}
          type="submit"
          disabled={isLoading || !input.trim()}
          style={{ background: agentColor }}
        >
          Enviar
        </button>
      </form>
    </div>
  )
}
