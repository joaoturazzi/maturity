'use client'

import { useState, useEffect, useRef, useCallback, type FormEvent } from 'react'
import type { AgentType } from '@/lib/agents/config'
import styles from './ChatInterface.module.css'

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
}

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
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [proactiveMsg, setProactiveMsg] = useState<string | null>(null)
  const [loadingProactive, setLoadingProactive] = useState(false)

  // Fetch proactive message for new conversations
  useEffect(() => {
    if (!hasHistory && initialMessages.length === 0) {
      setLoadingProactive(true)
      fetch(`/api/agents/${encodeURIComponent(agentType)}/init`)
        .then(r => r.json())
        .then(d => setProactiveMsg(d.message ?? null))
        .catch(() => {})
        .finally(() => setLoadingProactive(false))
    }
  }, [agentType, hasHistory, initialMessages.length])

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, proactiveMsg])

  const handleSend = useCallback(async () => {
    const text = input.trim()
    if (!text || isLoading) return
    setInput('')
    setIsLoading(true)

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
    }

    const assistantMsg: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
    }

    const updatedMessages = [...messages, userMsg]
    setMessages([...updatedMessages, assistantMsg])

    try {
      const res = await fetch(`/api/agents/${encodeURIComponent(agentType)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      })

      if (!res.ok) {
        const err = await res.text().catch(() => 'Erro desconhecido')
        throw new Error(err)
      }

      if (!res.body) throw new Error('Sem body na resposta')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        accumulated += chunk

        const currentText = accumulated
        setMessages(prev => prev.map(m =>
          m.id === assistantMsg.id ? { ...m, content: currentText } : m
        ))
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro de conexão'
      setMessages(prev => prev.map(m =>
        m.id === assistantMsg.id ? { ...m, content: `Erro: ${errorMsg}` } : m
      ))
    } finally {
      setIsLoading(false)
    }
  }, [input, isLoading, messages, agentType])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    handleSend()
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
              {msg.content || (
                <span className={styles.typing}>
                  <span className={styles.dot} />
                  <span className={styles.dot} />
                  <span className={styles.dot} />
                </span>
              )}
            </div>
          </div>
        ))}

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
