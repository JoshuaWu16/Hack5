'use client'

import type { UIMessage } from 'ai'
import { User, Bot } from 'lucide-react'
import { ToolCallDisplay } from './tool-call-display'

interface ChatMessageProps {
  message: UIMessage
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex gap-4 animate-fade-in ${isUser ? 'justify-end' : ''}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center mt-1">
          <Bot className="w-4 h-4 text-primary" />
        </div>
      )}
      <div className={`flex-1 max-w-3xl space-y-2 ${isUser ? 'flex flex-col items-end' : ''}`}>
        {message.parts.map((part, index) => {
          if (part.type === 'text' && part.text) {
            return (
              <div
                key={index}
                className={
                  isUser
                    ? 'bg-primary text-primary-foreground px-4 py-3 rounded-2xl rounded-br-md inline-block max-w-lg'
                    : 'text-foreground leading-relaxed prose-invert'
                }
              >
                {isUser ? (
                  <p className="text-sm">{part.text}</p>
                ) : (
                  <div className="text-sm whitespace-pre-wrap">
                    <FormattedMarkdown text={part.text} />
                  </div>
                )}
              </div>
            )
          }
          if (part.type === 'tool-invocation') {
            return (
              <ToolCallDisplay
                key={index}
                toolName={part.toolInvocation.toolName}
                state={part.state}
                args={part.toolInvocation.input as Record<string, unknown>}
                result={part.state === 'output-available' ? part.toolInvocation.output : undefined}
              />
            )
          }
          return null
        })}
      </div>
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-md bg-muted flex items-center justify-center mt-1">
          <User className="w-4 h-4 text-muted-foreground" />
        </div>
      )}
    </div>
  )
}

function FormattedMarkdown({ text }: { text: string }) {
  const lines = text.split('\n')
  return (
    <>
      {lines.map((line, i) => {
        if (line.startsWith('### ')) {
          return <h3 key={i} className="text-base font-semibold text-foreground mt-4 mb-2">{line.slice(4)}</h3>
        }
        if (line.startsWith('## ')) {
          return <h2 key={i} className="text-lg font-semibold text-foreground mt-5 mb-2">{line.slice(3)}</h2>
        }
        if (line.startsWith('# ')) {
          return <h1 key={i} className="text-xl font-bold text-foreground mt-5 mb-3">{line.slice(2)}</h1>
        }
        if (line.startsWith('- **') || line.startsWith('* **')) {
          const content = line.slice(2)
          return <li key={i} className="ml-4 text-sm text-foreground/90 my-1">{renderBold(content)}</li>
        }
        if (line.startsWith('- ') || line.startsWith('* ')) {
          return <li key={i} className="ml-4 text-sm text-foreground/90 my-1">{renderBold(line.slice(2))}</li>
        }
        if (/^\d+\.\s/.test(line)) {
          return <li key={i} className="ml-4 text-sm text-foreground/90 my-1 list-decimal">{renderBold(line.replace(/^\d+\.\s/, ''))}</li>
        }
        if (line.startsWith('---')) {
          return <hr key={i} className="border-border my-4" />
        }
        if (line.trim() === '') {
          return <div key={i} className="h-2" />
        }
        return <p key={i} className="text-sm text-foreground/90 my-1">{renderBold(line)}</p>
      })}
    </>
  )
}

function renderBold(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>
    }
    // Handle inline code
    const codeParts = part.split(/(`[^`]+`)/)
    if (codeParts.length > 1) {
      return codeParts.map((cp, j) => {
        if (cp.startsWith('`') && cp.endsWith('`')) {
          return <code key={`${i}-${j}`} className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded text-primary">{cp.slice(1, -1)}</code>
        }
        return <span key={`${i}-${j}`}>{cp}</span>
      })
    }
    return <span key={i}>{part}</span>
  })
}
