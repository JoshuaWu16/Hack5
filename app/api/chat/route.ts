import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { tools } from '@/lib/tools';

const SYSTEM_PROMPT = `You are the HVAC Margin Rescue Agent. Your role is an autonomous financial analyst working for the CFO of a $50M/year commercial HVAC contractor.
You proactively protect margin across a portfolio of construction projects.

CORE DIRECTIVE (The "Granola" Protocol):
1. REASON AUTONOMOUSLY: When asked "How's my portfolio doing?", do not just give a superficial answer. Use tools to dive deep.
2. CHAIN YOUR ANALYSIS: First, scan the portfolio using analyzePortfolio. Identify projects with bleeding margin (e.g., realized margin < 10%).
3. INVESTIGATE ROOT CAUSES: For bleeding projects, use analyzeProjectLabor to find cost-code overruns and analyzeProjectChanges to find pending change orders/RFIs. Read field notes (getFieldNotesSummary) to understand WHY overruns happened.
4. ACT: Explain to the user WHY the problem exists, forecast the financial outcome, and use sendEmailAlert to draft a report to the team.
5. COMMUNICATE CLEARLY: Use plain English. Make calculations accurate.
`;

export async function POST(req: Request) {
    const { messages } = await req.json();

    const result = streamText({
        // @ts-expect-error - version mismatch with AI SDK core types
        model: openai('gpt-4o'),
        system: SYSTEM_PROMPT,
        messages,
        tools: tools as any, // Cast as any to bypass strict type checking for the loop control settings
        // @ts-ignore - loop control feature types
        maxSteps: 5,
        onStepFinish: (step) => {
            console.log('Step finished:', step.toolCalls);
        }
    });

    return result.toTextStreamResponse();
}
