import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const DATA_DIR = join(process.cwd(), 'hvac_construction_dataset')

function parseCSV(content: string): Record<string, string | number | boolean>[] {
  const lines = content.split('\n').filter((line) => line.trim() !== '')
  if (lines.length === 0) return []

  const headers = parseCSVLine(lines[0])
  const rows: Record<string, string | number | boolean>[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    const row: Record<string, string | number | boolean> = {}
    headers.forEach((header, j) => {
      const val = values[j] ?? ''
      // Try to cast numbers
      if (val !== '' && !isNaN(Number(val))) {
        row[header] = Number(val)
      } else if (val === 'true' || val === 'True') {
        row[header] = true
      } else if (val === 'false' || val === 'False') {
        row[header] = false
      } else {
        row[header] = val
      }
    })
    rows.push(row)
  }
  return rows
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim())
  return result
}

function loadCSV<T>(filename: string): T[] {
  const filePath = join(DATA_DIR, filename)
  console.log("[v0] Loading CSV:", filePath, "exists:", existsSync(filePath))
  try {
    const content = readFileSync(filePath, 'utf-8')
    const rows = parseCSV(content) as T[]
    console.log("[v0] Loaded", rows.length, "rows from", filename)
    return rows
  } catch (error) {
    console.error("[v0] Error loading CSV:", filename, error)
    return []
  }
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
