import { readFileSync } from 'fs'
import { join } from 'path'
import { parse } from 'csv-parse/sync'

const DATA_DIR = join(process.cwd(), 'hvac_construction_dataset')

function loadCSV<T>(filename: string): T[] {
  const content = readFileSync(join(DATA_DIR, filename), 'utf-8')
  return parse(content, {
    columns: true,
    skip_empty_lines: true,
    cast: true,
    cast_date: false,
  }) as T[]
}

export interface Contract {
  project_id: string
  project_name: string
  original_contract_value: number
  contract_date: string
  substantial_completion_date: string
  retention_pct: number
  payment_terms: string
  gc_name: string
  architect: string
  engineer_of_record: string
}

export interface SOVLine {
  project_id: string
  sov_line_id: string
  line_number: number
  description: string
  scheduled_value: number
  labor_pct: number
  material_pct: number
}

export interface SOVBudget {
  project_id: string
  sov_line_id: string
  estimated_labor_hours: number
  estimated_labor_cost: number
  estimated_material_cost: number
  estimated_equipment_cost: number
  estimated_sub_cost: number
  productivity_factor: number
  key_assumptions: string
}

export interface BillingHistory {
  project_id: string
  application_number: number
  period_end: string
  period_total: number
  cumulative_billed: number
  retention_held: number
  net_payment_due: number
  status: string
  payment_date: string
  line_item_count: number
}

export interface BillingLineItem {
  sov_line_id: string
  description: string
  scheduled_value: number
  previous_billed: number
  this_period: number
  total_billed: number
  pct_complete: number
  balance_to_finish: number
  project_id: string
  application_number: number
}

export interface ChangeOrder {
  project_id: string
  co_number: string
  date_submitted: string
  reason_category: string
  description: string
  amount: number
  status: string
  related_rfi: string
  affected_sov_lines: string
  labor_hours_impact: number
  schedule_impact_days: number
  submitted_by: string
  approved_by: string
}

export interface RFI {
  project_id: string
  rfi_number: string
  date_submitted: string
  subject: string
  submitted_by: string
  assigned_to: string
  priority: string
  status: string
  date_required: string
  date_responded: string
  response_summary: string
  cost_impact: boolean | string
  schedule_impact: boolean | string
}

export interface LaborLog {
  project_id: string
  log_id: string
  date: string
  employee_id: string
  role: string
  sov_line_id: string
  hours_st: number
  hours_ot: number
  hourly_rate: number
  burden_multiplier: number
  work_area: string
  cost_code: number
}

export interface MaterialDelivery {
  project_id: string
  delivery_id: string
  date: string
  sov_line_id: string
  material_category: string
  item_description: string
  quantity: number
  unit: string
  unit_cost: number
  total_cost: number
  po_number: string
  vendor: string
  received_by: string
  condition_notes: string
}

// Cache loaded data in memory
let _cache: Record<string, unknown[]> = {}

function cached<T>(key: string, loader: () => T[]): T[] {
  if (!_cache[key]) {
    _cache[key] = loader()
  }
  return _cache[key] as T[]
}

export function getContracts(): Contract[] {
  return cached('contracts', () => loadCSV<Contract>('contracts.csv'))
}

export function getSOV(): SOVLine[] {
  return cached('sov', () => loadCSV<SOVLine>('sov.csv'))
}

export function getSOVBudget(): SOVBudget[] {
  return cached('sov_budget', () => loadCSV<SOVBudget>('sov_budget.csv'))
}

export function getBillingHistory(): BillingHistory[] {
  return cached('billing_history', () => loadCSV<BillingHistory>('billing_history.csv'))
}

export function getBillingLineItems(): BillingLineItem[] {
  return cached('billing_line_items', () => loadCSV<BillingLineItem>('billing_line_items.csv'))
}

export function getChangeOrders(): ChangeOrder[] {
  return cached('change_orders', () => loadCSV<ChangeOrder>('change_orders.csv'))
}

export function getRFIs(): RFI[] {
  return cached('rfis', () => loadCSV<RFI>('rfis.csv'))
}

export function getLaborLogs(): LaborLog[] {
  return cached('labor_logs', () => loadCSV<LaborLog>('labor_logs.csv'))
}

export function getMaterialDeliveries(): MaterialDelivery[] {
  return cached('material_deliveries', () => loadCSV<MaterialDelivery>('material_deliveries.csv'))
}
