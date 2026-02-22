'use client'

import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

interface AgentStatusProps {
  status: 'ready' | 'submitted' | 'streaming' | 'error'
}

export function AgentStatus({ status }: AgentStatusProps) {
  if (status === 'ready') return null

  return (
    <div className="flex items-center gap-2 px-4 py-2">
      {(status === 'submitted' || status === 'streaming') && (
        <>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-dot" />
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-dot" style={{ animationDelay: '0.3s' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-dot" style={{ animationDelay: '0.6s' }} />
          </div>
          <span className="text-xs text-muted-foreground">
            {status === 'submitted' ? 'Agent is thinking...' : 'Agent is responding...'}
          </span>
        </>
      )}
      {status === 'error' && (
        <>
          <AlertCircle className="w-3.5 h-3.5 text-destructive" />
          <span className="text-xs text-destructive">An error occurred. Please try again.</span>
        </>
      )}
    </div>
  )
}
