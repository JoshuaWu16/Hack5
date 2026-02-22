'use client'

import { useState, useRef, useEffect } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { ChatMessage } from '@/components/chat-message'
import { ChatInput } from '@/components/chat-input'
import { SuggestedPrompts } from '@/components/suggested-prompts'
import { AgentStatus } from '@/components/agent-status'
import { Activity, RotateCcw } from 'lucide-react'

const transport = new DefaultChatTransport({ api: '/api/chat' })

export default function Home() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const { messages, sendMessage, status, setMessages } = useChat({ transport })

  const isLoading = status === 'streaming' || status === 'submitted'

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, status])

  const handleSend = (text: string) => {
    sendMessage({ text })
  }

  const handleReset = () => {
    setMessages([])
  }

  return (
    <div className="flex flex-col h-dvh bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-4 md:px-6 h-14 border-b border-border bg-card/50 backdrop-blur-sm flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Activity className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-foreground">HVAC Margin Agent</h1>
            <p className="text-xs text-muted-foreground">Portfolio Intelligence</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-muted transition-colors"
              aria-label="New conversation"
            >
              <RotateCcw className="w-3 h-3" />
              New Chat
            </button>
          )}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-success/10 border border-success/20">
            <span className="w-1.5 h-1.5 rounded-full bg-success" />
            <span className="text-xs text-success font-medium">5 Projects</span>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <SuggestedPrompts onSelect={handleSend} />
          </div>
        ) : (
          <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 space-y-6">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            <AgentStatus status={status} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t border-border bg-card/30 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-4">
          <ChatInput onSend={handleSend} isLoading={isLoading} />
        </div>
      </div>
    </div>
  )
}
