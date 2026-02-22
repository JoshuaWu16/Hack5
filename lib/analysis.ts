import {
  getContracts,
  getSOV,
  getSOVBudget,
  getBillingHistory,
  getBillingLineItems,
  getChangeOrders,
  getRFIs,
  getLaborLogs,
  getMaterialDeliveries,
} from './data'

// ── Portfolio Overview ──────────────────────────────────────────────
export function getPortfolioOverview() {
  const contracts = getContracts()
  const billing = getBillingHistory()
  const changeOrders = getChangeOrders()
  const rfis = getRFIs()

  return contracts.map((c) => {
    const projBilling = billing.filter((b) => b.project_id === c.project_id)
    const latestBilling = projBilling.sort((a, b) => a.application_number - b.application_number).at(-1)
    const projCOs = changeOrders.filter((co) => co.project_id === c.project_id)
    const approvedCOs = projCOs.filter((co) => co.status === 'Approved')
    const pendingCOs = projCOs.filter((co) => co.status === 'Pending' || co.status === 'Under Review')
    const projRFIs = rfis.filter((r) => r.project_id === c.project_id)
    const openRFIs = projRFIs.filter((r) => r.status !== 'Closed')

    const approvedCOValue = approvedCOs.reduce((s, co) => s + co.amount, 0)
    const pendingCOValue = pendingCOs.reduce((s, co) => s + co.amount, 0)
    const adjustedContractValue = c.original_contract_value + approvedCOValue

    return {
      project_id: c.project_id,
      project_name: c.project_name,
      original_contract_value: c.original_contract_value,
      approved_change_orders: approvedCOValue,
      pending_change_orders: pendingCOValue,
      adjusted_contract_value: adjustedContractValue,
      cumulative_billed: latestBilling?.cumulative_billed ?? 0,
      retention_held: latestBilling?.retention_held ?? 0,
      pct_billed: latestBilling ? ((latestBilling.cumulative_billed / adjustedContractValue) * 100).toFixed(1) : '0',
      open_rfis: openRFIs.length,
      total_rfis: projRFIs.length,
      total_change_orders: projCOs.length,
      approved_cos: approvedCOs.length,
      pending_cos: pendingCOs.length,
      gc_name: c.gc_name,
      completion_date: c.substantial_completion_date,
    }
  })
}

// ── Margin Analysis per Project ─────────────────────────────────────
export function getProjectMarginAnalysis(projectId: string) {
  const contracts = getContracts()
  const contract = contracts.find((c) => c.project_id === projectId)
  if (!contract) return { error: `Project ${projectId} not found` }

  const sovLines = getSOV().filter((s) => s.project_id === projectId)
  const sovBudget = getSOVBudget().filter((s) => s.project_id === projectId)
  const laborLogs = getLaborLogs().filter((l) => l.project_id === projectId)
  const materials = getMaterialDeliveries().filter((m) => m.project_id === projectId)
  const billingItems = getBillingLineItems().filter((b) => b.project_id === projectId)
  const changeOrders = getChangeOrders().filter((co) => co.project_id === projectId)
  const approvedCOs = changeOrders.filter((co) => co.status === 'Approved')

  // Get unique SOV line IDs
  const sovLineIds = [...new Set(sovLines.map((s) => s.sov_line_id))]

  const lineAnalysis = sovLineIds.map((lineId) => {
    const sovLine = sovLines.find((s) => s.sov_line_id === lineId)!
    const budget = sovBudget.find((s) => s.sov_line_id === lineId)

    // Actual labor cost
    const lineLaborLogs = laborLogs.filter((l) => l.sov_line_id === lineId)
    const actualLaborCost = lineLaborLogs.reduce((sum, l) => {
      return sum + (l.hours_st + l.hours_ot * 1.5) * l.hourly_rate * l.burden_multiplier
    }, 0)
    const actualLaborHours = lineLaborLogs.reduce((sum, l) => sum + l.hours_st + l.hours_ot, 0)

    // Actual material cost
    const lineMaterials = materials.filter((m) => m.sov_line_id === lineId)
    const actualMaterialCost = lineMaterials.reduce((sum, m) => sum + m.total_cost, 0)

    // Latest billing for this line
    const lineBilling = billingItems
      .filter((b) => b.sov_line_id === lineId)
      .sort((a, b) => a.application_number - b.application_number)
    const latestBilling = lineBilling.at(-1)

    const totalActualCost = actualLaborCost + actualMaterialCost + (budget?.estimated_sub_cost ?? 0)
    const budgetedTotalCost = (budget?.estimated_labor_cost ?? 0) + (budget?.estimated_material_cost ?? 0) + (budget?.estimated_sub_cost ?? 0)
    const earnedRevenue = latestBilling?.total_billed ?? 0

    const currentMargin = earnedRevenue > 0 ? ((earnedRevenue - totalActualCost) / earnedRevenue * 100) : 0
    const budgetedMargin = sovLine.scheduled_value > 0 ? ((sovLine.scheduled_value - budgetedTotalCost) / sovLine.scheduled_value * 100) : 0
    const marginVariance = currentMargin - budgetedMargin

    return {
      sov_line_id: lineId,
      description: sovLine.description,
      scheduled_value: sovLine.scheduled_value,
      budgeted_labor_cost: budget?.estimated_labor_cost ?? 0,
      budgeted_material_cost: budget?.estimated_material_cost ?? 0,
      budgeted_labor_hours: budget?.estimated_labor_hours ?? 0,
      actual_labor_cost: Math.round(actualLaborCost),
      actual_material_cost: Math.round(actualMaterialCost),
      actual_labor_hours: Math.round(actualLaborHours),
      labor_cost_variance: Math.round(actualLaborCost - (budget?.estimated_labor_cost ?? 0)),
      material_cost_variance: Math.round(actualMaterialCost - (budget?.estimated_material_cost ?? 0)),
      labor_hours_variance: Math.round(actualLaborHours - (budget?.estimated_labor_hours ?? 0)),
      pct_complete: latestBilling?.pct_complete ?? 0,
      earned_revenue: earnedRevenue,
      total_actual_cost: Math.round(totalActualCost),
      budgeted_margin_pct: Math.round(budgetedMargin * 10) / 10,
      current_margin_pct: Math.round(currentMargin * 10) / 10,
      margin_variance_pct: Math.round(marginVariance * 10) / 10,
    }
  })

  const totalScheduledValue = lineAnalysis.reduce((s, l) => s + l.scheduled_value, 0)
  const totalActualCost = lineAnalysis.reduce((s, l) => s + l.total_actual_cost, 0)
  const totalEarnedRevenue = lineAnalysis.reduce((s, l) => s + l.earned_revenue, 0)
  const approvedCOValue = approvedCOs.reduce((s, co) => s + co.amount, 0)
  const adjustedContract = contract.original_contract_value + approvedCOValue
  const overallCurrentMargin = totalEarnedRevenue > 0 ? ((totalEarnedRevenue - totalActualCost) / totalEarnedRevenue * 100) : 0

  // Estimate at Completion (EAC): project total cost if trends continue
  const pctComplete = totalEarnedRevenue / adjustedContract
  const estimateAtCompletion = pctComplete > 0.05 ? totalActualCost / pctComplete : totalActualCost
  const projectedFinalMargin = ((adjustedContract - estimateAtCompletion) / adjustedContract) * 100

  return {
    project_id: projectId,
    project_name: contract.project_name,
    original_contract_value: contract.original_contract_value,
    approved_change_order_value: approvedCOValue,
    adjusted_contract_value: adjustedContract,
    total_earned_revenue: totalEarnedRevenue,
    total_actual_cost: totalActualCost,
    overall_current_margin_pct: Math.round(overallCurrentMargin * 10) / 10,
    estimate_at_completion: Math.round(estimateAtCompletion),
    projected_final_margin_pct: Math.round(projectedFinalMargin * 10) / 10,
    pct_complete: Math.round(pctComplete * 1000) / 10,
    line_analysis: lineAnalysis,
    worst_performing_lines: lineAnalysis
      .filter((l) => l.margin_variance_pct < -5)
      .sort((a, b) => a.margin_variance_pct - b.margin_variance_pct)
      .slice(0, 5),
  }
}

// ── Billing Analysis ────────────────────────────────────────────────
export function getBillingAnalysis(projectId: string) {
  const billing = getBillingHistory().filter((b) => b.project_id === projectId)
  const billingItems = getBillingLineItems().filter((b) => b.project_id === projectId)
  const contracts = getContracts()
  const contract = contracts.find((c) => c.project_id === projectId)
  if (!contract) return { error: `Project ${projectId} not found` }

  const sortedBilling = billing.sort((a, b) => a.application_number - b.application_number)
  const latestBilling = sortedBilling.at(-1)
  const pendingBilling = sortedBilling.filter((b) => b.status === 'Pending')
  const unpaidTotal = pendingBilling.reduce((s, b) => s + b.net_payment_due, 0)

  // Billing lag analysis
  const paidBilling = sortedBilling.filter((b) => b.payment_date && b.status === 'Paid')
  const avgPaymentDays = paidBilling.length > 0
    ? paidBilling.reduce((sum, b) => {
        const submitted = new Date(b.period_end)
        const paid = new Date(b.payment_date)
        return sum + (paid.getTime() - submitted.getTime()) / (1000 * 60 * 60 * 24)
      }, 0) / paidBilling.length
    : 0

  // Get latest billing line items for each SOV line (progress snapshot)
  const latestApp = latestBilling?.application_number
  const latestLineItems = latestApp
    ? billingItems.filter((b) => b.application_number === latestApp)
    : []

  // Underbilling detection: lines where pct_complete is behind labor/material progress
  const sovBudget = getSOVBudget().filter((s) => s.project_id === projectId)
  const laborLogs = getLaborLogs().filter((l) => l.project_id === projectId)

  const underbilledLines = latestLineItems
    .map((item) => {
      const budget = sovBudget.find((s) => s.sov_line_id === item.sov_line_id)
      const lineLaborLogs = laborLogs.filter((l) => l.sov_line_id === item.sov_line_id)
      const actualHours = lineLaborLogs.reduce((s, l) => s + l.hours_st + l.hours_ot, 0)
      const budgetHours = budget?.estimated_labor_hours ?? 0
      const laborProgress = budgetHours > 0 ? (actualHours / budgetHours * 100) : 0
      const billingProgress = item.pct_complete

      return {
        sov_line_id: item.sov_line_id,
        description: item.description,
        billing_pct: billingProgress,
        labor_progress_pct: Math.round(laborProgress * 10) / 10,
        gap_pct: Math.round((laborProgress - billingProgress) * 10) / 10,
        potential_underbilling: Math.round(item.scheduled_value * (laborProgress - billingProgress) / 100),
      }
    })
    .filter((l) => l.gap_pct > 5)
    .sort((a, b) => b.potential_underbilling - a.potential_underbilling)

  return {
    project_id: projectId,
    project_name: contract.project_name,
    total_contract_value: contract.original_contract_value,
    cumulative_billed: latestBilling?.cumulative_billed ?? 0,
    retention_held: latestBilling?.retention_held ?? 0,
    pct_billed: latestBilling ? Math.round((latestBilling.cumulative_billed / contract.original_contract_value) * 1000) / 10 : 0,
    pending_payment_count: pendingBilling.length,
    unpaid_total: unpaidTotal,
    avg_payment_days: Math.round(avgPaymentDays),
    billing_periods: sortedBilling.length,
    billing_trend: sortedBilling.map((b) => ({
      period: b.period_end,
      amount: b.period_total,
      cumulative: b.cumulative_billed,
      status: b.status,
    })),
    underbilled_lines: underbilledLines,
    total_potential_underbilling: underbilledLines.reduce((s, l) => s + l.potential_underbilling, 0),
  }
}

// ── RFI Risk Analysis ───────────────────────────────────────────────
export function getRFIAnalysis(projectId: string) {
  const rfis = getRFIs().filter((r) => r.project_id === projectId)
  const changeOrders = getChangeOrders().filter((co) => co.project_id === projectId)

  const openRFIs = rfis.filter((r) => r.status !== 'Closed')
  const costImpactRFIs = rfis.filter((r) => r.cost_impact === true || r.cost_impact === 'True')
  const scheduleImpactRFIs = rfis.filter((r) => r.schedule_impact === true || r.schedule_impact === 'True')

  // RFIs linked to change orders
  const rfisWithCOs = rfis.filter((r) =>
    changeOrders.some((co) => co.related_rfi === r.rfi_number)
  )

  // Response time analysis
  const closedRFIs = rfis.filter((r) => r.date_responded)
  const responseTimeDays = closedRFIs.map((r) => {
    const submitted = new Date(r.date_submitted)
    const responded = new Date(r.date_responded)
    return (responded.getTime() - submitted.getTime()) / (1000 * 60 * 60 * 24)
  })
  const avgResponseDays = responseTimeDays.length > 0
    ? responseTimeDays.reduce((a, b) => a + b, 0) / responseTimeDays.length
    : 0

  // Overdue RFIs
  const overdueRFIs = openRFIs.filter((r) => {
    if (!r.date_required) return false
    return new Date(r.date_required) < new Date()
  })

  // Priority breakdown
  const byPriority = {
    Critical: rfis.filter((r) => r.priority === 'Critical').length,
    High: rfis.filter((r) => r.priority === 'High').length,
    Medium: rfis.filter((r) => r.priority === 'Medium').length,
    Low: rfis.filter((r) => r.priority === 'Low').length,
  }

  return {
    project_id: projectId,
    total_rfis: rfis.length,
    open_rfis: openRFIs.length,
    overdue_rfis: overdueRFIs.length,
    cost_impact_rfis: costImpactRFIs.length,
    schedule_impact_rfis: scheduleImpactRFIs.length,
    rfis_linked_to_change_orders: rfisWithCOs.length,
    avg_response_days: Math.round(avgResponseDays * 10) / 10,
    priority_breakdown: byPriority,
    open_rfi_details: openRFIs.map((r) => ({
      rfi_number: r.rfi_number,
      subject: r.subject,
      priority: r.priority,
      assigned_to: r.assigned_to,
      date_submitted: r.date_submitted,
      date_required: r.date_required,
      cost_impact: r.cost_impact,
      schedule_impact: r.schedule_impact,
    })),
    high_risk_rfis: rfis
      .filter((r) => (r.cost_impact === true || r.cost_impact === 'True') && r.status !== 'Closed')
      .map((r) => ({
        rfi_number: r.rfi_number,
        subject: r.subject,
        priority: r.priority,
        status: r.status,
      })),
  }
}

// ── SOV vs Budget Variance ──────────────────────────────────────────
export function getSOVBudgetVariance(projectId: string) {
  const sovLines = getSOV().filter((s) => s.project_id === projectId)
  const sovBudget = getSOVBudget().filter((s) => s.project_id === projectId)
  const laborLogs = getLaborLogs().filter((l) => l.project_id === projectId)
  const materials = getMaterialDeliveries().filter((m) => m.project_id === projectId)

  const lineVariances = sovBudget.map((budget) => {
    const sovLine = sovLines.find((s) => s.sov_line_id === budget.sov_line_id)
    const lineLaborLogs = laborLogs.filter((l) => l.sov_line_id === budget.sov_line_id)
    const lineMaterials = materials.filter((m) => m.sov_line_id === budget.sov_line_id)

    const actualLaborCost = lineLaborLogs.reduce(
      (sum, l) => sum + (l.hours_st + l.hours_ot * 1.5) * l.hourly_rate * l.burden_multiplier,
      0
    )
    const actualLaborHours = lineLaborLogs.reduce(
      (sum, l) => sum + l.hours_st + l.hours_ot,
      0
    )
    const actualMaterialCost = lineMaterials.reduce((sum, m) => sum + m.total_cost, 0)

    return {
      sov_line_id: budget.sov_line_id,
      description: sovLine?.description ?? '',
      scheduled_value: sovLine?.scheduled_value ?? 0,
      budgeted_labor_hours: budget.estimated_labor_hours,
      actual_labor_hours: Math.round(actualLaborHours),
      labor_hours_variance: Math.round(actualLaborHours - budget.estimated_labor_hours),
      labor_hours_variance_pct: budget.estimated_labor_hours > 0
        ? Math.round(((actualLaborHours - budget.estimated_labor_hours) / budget.estimated_labor_hours) * 1000) / 10
        : 0,
      budgeted_labor_cost: budget.estimated_labor_cost,
      actual_labor_cost: Math.round(actualLaborCost),
      labor_cost_variance: Math.round(actualLaborCost - budget.estimated_labor_cost),
      budgeted_material_cost: budget.estimated_material_cost,
      actual_material_cost: Math.round(actualMaterialCost),
      material_cost_variance: Math.round(actualMaterialCost - budget.estimated_material_cost),
      productivity_factor: budget.productivity_factor,
      key_assumptions: budget.key_assumptions,
    }
  })

  const totalBudgetedLabor = lineVariances.reduce((s, l) => s + l.budgeted_labor_cost, 0)
  const totalActualLabor = lineVariances.reduce((s, l) => s + l.actual_labor_cost, 0)
  const totalBudgetedMaterial = lineVariances.reduce((s, l) => s + l.budgeted_material_cost, 0)
  const totalActualMaterial = lineVariances.reduce((s, l) => s + l.actual_material_cost, 0)

  return {
    project_id: projectId,
    total_budgeted_labor_cost: totalBudgetedLabor,
    total_actual_labor_cost: Math.round(totalActualLabor),
    total_labor_variance: Math.round(totalActualLabor - totalBudgetedLabor),
    total_budgeted_material_cost: totalBudgetedMaterial,
    total_actual_material_cost: Math.round(totalActualMaterial),
    total_material_variance: Math.round(totalActualMaterial - totalBudgetedMaterial),
    line_variances: lineVariances,
    worst_labor_overruns: lineVariances
      .filter((l) => l.labor_cost_variance > 0)
      .sort((a, b) => b.labor_cost_variance - a.labor_cost_variance)
      .slice(0, 5),
    worst_material_overruns: lineVariances
      .filter((l) => l.material_cost_variance > 0)
      .sort((a, b) => b.material_cost_variance - a.material_cost_variance)
      .slice(0, 5),
  }
}

// ── Change Order Analysis ───────────────────────────────────────────
export function getChangeOrderAnalysis(projectId: string) {
  const changeOrders = getChangeOrders().filter((co) => co.project_id === projectId)
  const contract = getContracts().find((c) => c.project_id === projectId)

  const approved = changeOrders.filter((co) => co.status === 'Approved')
  const pending = changeOrders.filter((co) => co.status === 'Pending' || co.status === 'Under Review')
  const rejected = changeOrders.filter((co) => co.status === 'Rejected')

  const approvedValue = approved.reduce((s, co) => s + co.amount, 0)
  const pendingValue = pending.reduce((s, co) => s + co.amount, 0)
  const rejectedValue = rejected.reduce((s, co) => s + co.amount, 0)

  // By reason category
  const byReason = changeOrders.reduce((acc, co) => {
    if (!acc[co.reason_category]) acc[co.reason_category] = { count: 0, total_amount: 0 }
    acc[co.reason_category].count++
    acc[co.reason_category].total_amount += co.amount
    return acc
  }, {} as Record<string, { count: number; total_amount: number }>)

  return {
    project_id: projectId,
    original_contract_value: contract?.original_contract_value ?? 0,
    total_change_orders: changeOrders.length,
    approved_count: approved.length,
    approved_value: approvedValue,
    pending_count: pending.length,
    pending_value: pendingValue,
    rejected_count: rejected.length,
    rejected_value: rejectedValue,
    net_contract_adjustment: approvedValue,
    adjusted_contract_value: (contract?.original_contract_value ?? 0) + approvedValue,
    co_as_pct_of_contract: contract ? Math.round((approvedValue / contract.original_contract_value) * 1000) / 10 : 0,
    by_reason_category: byReason,
    total_schedule_impact_days: changeOrders.reduce((s, co) => s + co.schedule_impact_days, 0),
    change_orders: changeOrders.map((co) => ({
      co_number: co.co_number,
      date: co.date_submitted,
      reason: co.reason_category,
      description: co.description,
      amount: co.amount,
      status: co.status,
      labor_hours_impact: co.labor_hours_impact,
      schedule_impact_days: co.schedule_impact_days,
    })),
  }
}
