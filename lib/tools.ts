// @ts-nocheck
import { z } from 'zod';
import { tool } from 'ai';
import {
    getContracts,
    getSOVs,
    getLaborLogs,
    getChangeOrders,
    getMaterialDeliveries,
    getBillingHistory,
    getRFIs,
    getFieldNotes
} from '@/lib/db';

export const analyzePortfolio = tool({
    description: 'Scans the full portfolio of HVAC projects to assess margin health, comparing billed amounts and contract values against actual costs (labor + materials) to identify struggling projects.',
    parameters: z.object({}),
    execute: async (_args: Record<string, never>) => {
        const contracts = getContracts();
        const billing = getBillingHistory();
        const labor = getLaborLogs();
        const materials = getMaterialDeliveries();

        const projectHealth = contracts.map(contract => {
            const pid = contract.project_id;

            // Revenue / Billed
            const projBilling = billing.filter(b => b.project_id === pid);
            const totalBilled = projBilling.reduce((sum, b) => Math.max(sum, b.cumulative_billed), 0);

            // Costs
            const projLabor = labor.filter(l => l.project_id === pid);
            const laborCost = projLabor.reduce((sum, l) => {
                return sum + ((l.hours_st + l.hours_ot * 1.5) * l.hourly_rate * l.burden_multiplier);
            }, 0);

            const projMaterials = materials.filter(m => m.project_id === pid);
            const materialCost = projMaterials.reduce((sum, m) => sum + m.total_cost, 0);

            const totalCost = laborCost + materialCost;

            // Margins
            const realizedMarginPct = totalBilled > 0 ? ((totalBilled - totalCost) / totalBilled) * 100 : 0;
            const expectedMarginPct = ((contract.original_contract_value - totalCost) / contract.original_contract_value) * 100; // Simplified

            return {
                project_id: pid,
                project_name: contract.project_name,
                contract_value: contract.original_contract_value,
                total_billed: totalBilled,
                labor_cost: laborCost,
                material_cost: materialCost,
                total_cost: totalCost,
                realized_margin_pct: realizedMarginPct,
                status: realizedMarginPct < 10 ? 'AT RISK' : 'HEALTHY'
            };
        });

        return projectHealth;
    }
});

export const analyzeProjectLabor = tool({
    description: 'Investigates labor costs for a specific project to identify overruns by SOV line (cost code) or role.',
    parameters: z.object({
        project_id: z.string().describe('The project ID, e.g., PRJ-2025-002')
    }),
    execute: async ({ project_id }: { project_id: string }) => {
        const labor = getLaborLogs().filter(l => l.project_id === project_id);
        const sovs = getSOVs().filter(s => s.project_id === project_id);

        // Group labor by SOV line
        const costBySOV: Record<string, { total_cost: number, total_hours: number }> = {};
        labor.forEach(l => {
            const cost = (l.hours_st + l.hours_ot * 1.5) * l.hourly_rate * l.burden_multiplier;
            if (!costBySOV[l.sov_line_id]) costBySOV[l.sov_line_id] = { total_cost: 0, total_hours: 0 };
            costBySOV[l.sov_line_id].total_cost += cost;
            costBySOV[l.sov_line_id].total_hours += l.hours_st + l.hours_ot;
        });

        // Compare to SOV budgets
        const analysis = sovs.map(sov => {
            const actuals = costBySOV[sov.sov_line_id] || { total_cost: 0, total_hours: 0 };
            const budgetLabor = sov.scheduled_value * sov.labor_pct;
            return {
                line_number: sov.line_number,
                description: sov.description,
                budget_labor_cost: budgetLabor,
                actual_labor_cost: actuals.total_cost,
                variance: budgetLabor - actuals.total_cost,
                is_overrun: actuals.total_cost > budgetLabor
            };
        });

        return analysis.filter(a => a.is_overrun).sort((a, b) => a.variance - b.variance); // Show worst overruns first
    }
});

export const analyzeProjectChanges = tool({
    description: 'Investigates change orders and RFIs for a specific project to find scope creep, pending approvals, or unbilled work.',
    parameters: z.object({
        project_id: z.string().describe('The project ID, e.g., PRJ-2025-002')
    }),
    execute: async ({ project_id }: { project_id: string }) => {
        const co = getChangeOrders().filter(c => c.project_id === project_id);
        const rfis = getRFIs().filter(r => r.project_id === project_id);

        const pendingCOs = co.filter(c => c.status !== 'Approved');
        const criticalRFIs = rfis.filter(r => r.cost_impact === 'True' || r.schedule_impact === 'True');

        return {
            total_change_orders: co.length,
            pending_change_orders: pendingCOs,
            total_pending_amount: pendingCOs.reduce((sum, c) => sum + c.amount, 0),
            critical_rfis: criticalRFIs.map(r => ({ subject: r.subject, status: r.status }))
        };
    }
});

export const getFieldNotesSummary = tool({
    description: 'Retrieves recent field notes for a project to identify contextual issues on site (e.g., delays, weather, disputes).',
    parameters: z.object({
        project_id: z.string().describe('The project ID, e.g., PRJ-2025-002')
    }),
    execute: async ({ project_id }: { project_id: string }) => {
        const notes = getFieldNotes().filter(f => f.project_id === project_id);
        // Sort by date descending and get the last 10
        return notes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);
    }
});

export const sendEmailAlert = tool({
    description: 'Sends an email alert or report to the CFO or Project Manager with actionable findings.',
    parameters: z.object({
        subject: z.string().describe('The email subject.'),
        body: z.string().describe('The email body/content. Should be actionable and clear in plain English.'),
        recipient: z.string().describe('The recipient email address (e.g., cfo@hvac.com)')
    }),
    execute: async ({ subject, body, recipient }: { subject: string, body: string, recipient: string }) => {
        // In a real app we'd use Resend/Nodemailer. Here we just mock a success response.
        console.log(`[EMAIL SENT TO ${recipient}]\nSubject: ${subject}\n\n${body}`);
        return {
            success: true,
            message: `Email successfully sent to ${recipient} with subject "${subject}"`,
            sentAt: new Date().toISOString()
        };
    }
});

export const tools = {
    analyzePortfolio,
    analyzeProjectLabor,
    analyzeProjectChanges,
    getFieldNotesSummary,
    sendEmailAlert
};
