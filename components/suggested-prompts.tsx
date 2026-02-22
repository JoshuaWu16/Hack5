'use client'

import { Activity, TrendingDown, Receipt, AlertTriangle } from 'lucide-react'

const SUGGESTIONS = [
  {
    icon: Activity,
    label: "How's my portfolio doing?",
    description: 'Full portfolio health scan',
  },
  {
    icon: TrendingDown,
    label: 'Which projects have the worst margin erosion?',
    description: 'Margin risk analysis',
  },
  {
    icon: Receipt,
    label: 'Are there any billing lag issues?',
    description: 'Cash flow and underbilling',
  },
  {
    icon: AlertTriangle,
    label: 'What RFIs pose the biggest cost risk?',
    description: 'RFI cost exposure review',
  },
]

interface SuggestedPromptsProps {
  onSelect: (text: string) => void
}

export function SuggestedPrompts({ onSelect }: SuggestedPromptsProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-8 px-4">
      <div className="text-center space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <Activity className="w-7 h-7 text-primary" />
        </div>
        <h1 className="text-2xl font-semibold text-foreground text-balance">HVAC Margin Agent</h1>
        <p className="text-sm text-muted-foreground max-w-md text-pretty">
          I autonomously analyze your HVAC construction portfolio to find margin erosion, billing issues, and cost risks. Ask me anything.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
        {SUGGESTIONS.map((s) => {
          const Icon = s.icon
          return (
            <button
              key={s.label}
              type="button"
              onClick={() => onSelect(s.label)}
              className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card hover:bg-muted/80 hover:border-primary/30 transition-all text-left group"
            >
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10 transition-colors">
                <Icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{s.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
