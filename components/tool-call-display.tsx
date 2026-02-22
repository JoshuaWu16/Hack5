'use client'

import { useState } from 'react'
import {
  Database,
  FileBarChart,
  Receipt,
  AlertTriangle,
  GitCompare,
  FileText,
  ChevronDown,
  ChevronRight,
  Loader2,
  CheckCircle2,
} from 'lucide-react'

const TOOL_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  getPortfolioOverview: {
    label: 'Scanning Portfolio',
    icon: Database,
    color: 'text-primary',
  },
  getProjectMarginAnalysis: {
    label: 'Analyzing Margin',
    icon: FileBarChart,
    color: 'text-warning',
  },
  getBillingAnalysis: {
    label: 'Checking Billing',
    icon: Receipt,
    color: 'text-success',
  },
  getRFIAnalysis: {
    label: 'Reviewing RFIs',
    icon: AlertTriangle,
    color: 'text-destructive',
  },
  getSOVBudgetVariance: {
    label: 'SOV vs Budget',
    icon: GitCompare,
    color: 'text-primary',
  },
  getChangeOrderAnalysis: {
    label: 'Change Orders',
    icon: FileText,
    color: 'text-warning',
  },
}

interface ToolCallDisplayProps {
  toolName: string
  state: string
  args: Record<string, unknown>
  result?: Record<string, unknown> | string | number | boolean | null
}

export function ToolCallDisplay({ toolName, state, args, result }: ToolCallDisplayProps) {
  const [expanded, setExpanded] = useState(false)
  const meta = TOOL_META[toolName] || {
    label: toolName,
    icon: Database,
    color: 'text-muted-foreground',
  }
  const Icon = meta.icon
  const isLoading = state === 'input-streaming' || state === 'input-available'
  const isDone = state === 'output-available'
  const projectId = args?.projectId as string | undefined

  return (
    <div className="border border-border rounded-lg bg-muted/50 my-2 overflow-hidden">
      <button
        type="button"
        onClick={() => isDone && setExpanded(!expanded)}
        className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-muted/80 transition-colors"
      >
        <div className={`flex items-center justify-center w-8 h-8 rounded-md bg-muted ${meta.color}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">{meta.label}</span>
            {projectId && (
              <span className="text-xs font-mono text-muted-foreground bg-background px-2 py-0.5 rounded">
                {projectId}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isLoading && <Loader2 className="w-4 h-4 text-primary animate-spin" />}
          {isDone && <CheckCircle2 className="w-4 h-4 text-success" />}
          {isDone && (expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />)}
        </div>
      </button>
      {expanded && isDone && result != null ? (
        <div className="border-t border-border px-4 py-3 max-h-64 overflow-y-auto">
          <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap break-words">
            {JSON.stringify(result, null, 2).slice(0, 3000)}
            {JSON.stringify(result, null, 2).length > 3000 ? '\n... (truncated)' : ''}
          </pre>
        </div>
      ) : null}
    </div>
  )
}
