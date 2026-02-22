import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

const datasetPath = path.join(process.cwd(), 'hvac_construction_dataset');

export function readCSV<T>(filename: string): T[] {
    const filePath = path.join(datasetPath, filename);
    if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        return [];
    }
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const result = Papa.parse<T>(fileContent, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
    });
    return result.data;
}

export function readJSON<T>(filename: string): T | null {
    const filePath = path.join(datasetPath, filename);
    if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        return null;
    }
    const fileContent = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileContent);
}

// Data Models based on the schema
export interface Contract {
    project_id: string;
    project_name: string;
    original_contract_value: number;
    contract_date: string;
    substantial_completion_date: string;
    retention_pct: number;
    payment_terms: string;
    gc_name: string;
    architect: string;
    engineer_of_record: string;
}

export interface SOV {
    project_id: string;
    sov_line_id: string;
    line_number: number;
    description: string;
    scheduled_value: number;
    labor_pct: number;
    material_pct: number;
}

export interface LaborLog {
    project_id: string;
    log_id: string;
    date: string;
    employee_id: string;
    role: string;
    sov_line_id: string;
    hours_st: number;
    hours_ot: number;
    hourly_rate: number;
    burden_multiplier: number;
    work_area: string;
    cost_code: string;
}

export interface MaterialDelivery {
    project_id: string;
    delivery_id: string;
    date: string;
    sov_line_id: string;
    material_category: string;
    item_description: string;
    quantity: number;
    unit: string;
    unit_cost: number;
    total_cost: number;
    po_number: string;
    vendor: string;
    received_by: string;
    condition_notes: string;
}

export interface ChangeOrder {
    project_id: string;
    co_number: string;
    date_submitted: string;
    reason_category: string;
    description: string;
    amount: number;
    status: string;
    related_rfi: string | null;
    affected_sov_lines: string;
    labor_hours_impact: number;
    schedule_impact_days: number;
    submitted_by: string;
    approved_by: string | null;
}

export interface RFI {
    project_id: string;
    rfi_number: string;
    date_submitted: string;
    subject: string;
    submitted_by: string;
    assigned_to: string;
    priority: string;
    status: string;
    date_required: string;
    date_responded: string | null;
    response_summary: string | null;
    cost_impact: string; // usually boolean converted to string or 1/0
    schedule_impact: string; // same
}

export interface FieldNote {
    project_id: string;
    note_id: string;
    date: string;
    author: string;
    note_type: string;
    content: string;
    photos_attached: number;
    weather: string;
    temp_high: number;
    temp_low: number;
}

export interface BillingHistory {
    project_id: string;
    application_number: number;
    period_end: string;
    period_total: number;
    cumulative_billed: number;
    retention_held: number;
    net_payment_due: number;
    status: string;
    payment_date: string | null;
    line_item_count: number;
}

export interface BillingLineItem {
    sov_line_id: string;
    description: string;
    scheduled_value: number;
    previous_billed: number;
    this_period: number;
    total_billed: number;
    pct_complete: number;
    balance_to_finish: number;
}

// Memoized Cache to prevent re-reading files on every request in the same node process
let _dataCache: any = {};

export function getContracts(): Contract[] {
    if (!_dataCache.contracts) _dataCache.contracts = readCSV<Contract>('contracts.csv');
    return _dataCache.contracts;
}

export function getSOVs(): SOV[] {
    if (!_dataCache.sovs) _dataCache.sovs = readCSV<SOV>('sov.csv');
    return _dataCache.sovs;
}

export function getLaborLogs(): LaborLog[] {
    if (!_dataCache.labor) _dataCache.labor = readCSV<LaborLog>('labor_logs.csv');
    return _dataCache.labor;
}

export function getMaterialDeliveries(): MaterialDelivery[] {
    if (!_dataCache.materials) _dataCache.materials = readCSV<MaterialDelivery>('material_deliveries.csv');
    return _dataCache.materials;
}

export function getChangeOrders(): ChangeOrder[] {
    if (!_dataCache.changeOrders) _dataCache.changeOrders = readCSV<ChangeOrder>('change_orders.csv');
    return _dataCache.changeOrders;
}

export function getRFIs(): RFI[] {
    if (!_dataCache.rfis) _dataCache.rfis = readCSV<RFI>('rfis.csv');
    return _dataCache.rfis;
}

export function getFieldNotes(): FieldNote[] {
    if (!_dataCache.fieldNotes) _dataCache.fieldNotes = readCSV<FieldNote>('field_notes.csv');
    return _dataCache.fieldNotes;
}

export function getBillingHistory(): BillingHistory[] {
    if (!_dataCache.billing) _dataCache.billing = readCSV<BillingHistory>('billing_history.csv');
    return _dataCache.billing;
}

export function getBillingLineItems(): BillingLineItem[] {
    if (!_dataCache.billingLines) _dataCache.billingLines = readCSV<BillingLineItem>('billing_line_items.csv');
    return _dataCache.billingLines;
}

export function getFullDatasetJSON(): any {
    if (!_dataCache.json) _dataCache.json = readJSON('hvac_construction_dataset.json');
    return _dataCache.json;
}

export function getProjectById(projectId: string) {
    const contract = getContracts().find(c => c.project_id === projectId);
    if (!contract) return null;

    return {
        contract,
        sovs: getSOVs().filter(s => s.project_id === projectId),
        labor: getLaborLogs().filter(l => l.project_id === projectId),
        materials: getMaterialDeliveries().filter(m => m.project_id === projectId),
        changeOrders: getChangeOrders().filter(c => c.project_id === projectId),
        rfis: getRFIs().filter(r => r.project_id === projectId),
        fieldNotes: getFieldNotes().filter(f => f.project_id === projectId),
        billing: getBillingHistory().filter(b => b.project_id === projectId)
    };
}
