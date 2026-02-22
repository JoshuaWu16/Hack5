import { streamText, tool, convertToModelMessages, stepCountIs } from 'ai'
import { z } from 'zod'
import {
  getPortfolioOverview,
  getProjectMarginAnalysis,
  getBillingAnalysis,
  getRFIAnalysis,
  getSOVBudgetVariance,
  getChangeOrderAnalysis,
} from '@/lib/analysis'

const SYSTEM_PROMPT = `You are an expert HVAC construction financial analyst AI agent. You serve as a virtual CFO advisor for a $50M/year commercial HVAC contractor managing a portfolio of 5 construction projects worth ~$100M total.

## Your Role
- Autonomously protect margin across the portfolio
- Investigate root causes of cost overruns, billing lags, and margin erosion
- Provide specific, actionable recommendations (not just observations)
- Communicate in clear business language

## How You Work
1. **Scan**: When asked about the portfolio, start by getting the portfolio overview
2. **Investigate**: When you find concerning signals (margin variance > 5%, billing lags, open RFIs with cost impact), dig deeper using project-specific tools
3. **Analyze**: Chain multiple tool calls to build a complete picture - check billing, SOV budget variance, RFIs, and change orders
4. **Act**: Provide specific dollar amounts, percentages, and actionable next steps

## Key Metrics You Track
- **Bid Margin vs Actual Margin**: The gap between what was estimated and reality
- **Estimate at Completion (EAC)**: Projected final cost based on current burn rate
- **Billing Lag**: Gap between work completed and amounts billed (cash flow risk)
- **Labor Cost Variance**: Actual vs budgeted labor (biggest margin killer)
- **RFI Cost Exposure**: Open RFIs with potential cost/schedule impact
- **Change Order Recovery**: Pending COs that could recover margin

## Construction Domain Knowledge
- Labor cost = (straight_time_hrs + overtime_hrs * 1.5) * hourly_rate * burden_multiplier
- Burden rate includes taxes, insurance, benefits (typically 1.35-1.55x)
- Margin erosion typically comes from: labor overruns, scope creep, billing lag, unrecovered change orders
- A healthy HVAC project targets 12-18% margin; below 8% is critical

## Response Format
- Use clear headings and structure
- Include specific numbers and percentages
- Flag critical issues prominently
- Always suggest concrete next actions
- When showing project data, include the project name not just the ID

## Project IDs
- PRJ-2024-001: Mercy General Hospital - HVAC Modernization ($35.2M)
- PRJ-2024-002: Riverside Office Tower - Core & Shell MEP ($30.3M)
- PRJ-2024-003: Greenfield Elementary School - New Construction ($5.5M)
- PRJ-2024-004: Summit Data Center - Phase 2 Expansion ($16.3M)
- PRJ-2024-005: Harbor View Condominiums - 3 Buildings ($13.7M)`

export async function POST(req: Request) {
  try {
  const { messages } = await req.json()
  console.log("[v0] Received messages:", messages.length)

  const result = streamText({
    model: 'anthropic/claude-sonnet-4',
    system: SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
    tools: {
      getPortfolioOverview: tool({
        description:
          'Get a high-level overview of all 5 HVAC projects in the portfolio including contract values, billing status, change orders, and open RFIs. Use this first to scan the portfolio.',
        inputSchema: z.object({}),
        execute: async () => {
          return getPortfolioOverview()
        },
      }),

      getProjectMarginAnalysis: tool({
        description:
          'Deep margin analysis for a specific project. Shows bid margin vs actual margin, cost variances by SOV line, estimate at completion, and worst-performing line items. Use this to investigate margin erosion.',
        inputSchema: z.object({
          projectId: z.string().describe('Project ID, e.g. PRJ-2024-001'),
        }),
        execute: async ({ projectId }) => {
          return getProjectMarginAnalysis(projectId)
        },
      }),

      getBillingAnalysis: tool({
        description:
          'Analyze billing patterns for a project including billing trends, payment lag, underbilled lines, and pending payments. Use this to find cash flow risks and billing lag issues.',
        inputSchema: z.object({
          projectId: z.string().describe('Project ID, e.g. PRJ-2024-001'),
        }),
        execute: async ({ projectId }) => {
          return getBillingAnalysis(projectId)
        },
      }),

      getRFIAnalysis: tool({
        description:
          'Analyze RFIs for a project including open/overdue RFIs, cost and schedule impact, response times, and high-risk items. Use this to assess hidden cost exposure from design issues.',
        inputSchema: z.object({
          projectId: z.string().describe('Project ID, e.g. PRJ-2024-001'),
        }),
        execute: async ({ projectId }) => {
          return getRFIAnalysis(projectId)
        },
      }),

      getSOVBudgetVariance: tool({
        description:
          'Compare actual costs against SOV budget estimates for each line item. Shows labor hours and cost variances, material cost variances, and productivity issues. Use this to find where costs are running over budget.',
        inputSchema: z.object({
          projectId: z.string().describe('Project ID, e.g. PRJ-2024-001'),
        }),
        execute: async ({ projectId }) => {
          return getSOVBudgetVariance(projectId)
        },
      }),

      getChangeOrderAnalysis: tool({
        description:
          'Analyze change orders for a project including approved/pending/rejected status, amounts by reason category, and schedule impacts. Use this to find unrecovered costs and pending recovery opportunities.',
        inputSchema: z.object({
          projectId: z.string().describe('Project ID, e.g. PRJ-2024-001'),
        }),
        execute: async ({ projectId }) => {
          return getChangeOrderAnalysis(projectId)
        },
      }),
    },
    stopWhen: stepCountIs(15),
    maxOutputTokens: 4000,
    temperature: 0.3,
  })

  return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error("[v0] API route error:", error)
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
