import { supabase } from '@/lib/supabase';

export type CivicAction = 
  | 'audit_log' | 'notification_route' | 'court_to_prison' | 'police_to_court'
  | 'jurisdiction_check' | 'generate_taxpayer_id' | 'generate_voucher'
  | 'process_tax_payment' | 'calculate_tax' | 'process_expenditure' | 'consolidate_revenue';

export interface CivicAuditLogParams {
  action: 'audit_log';
  entityType: 'case' | 'prisoner' | 'payment' | 'permit' | 'license';
  entityId: string;
  actionType: string;
  performedBy: string;
  details: Record<string, any>;
  jurisdiction?: string;
}

export interface CivicNotificationRouteParams {
  action: 'notification_route';
  recipientId: string;
  recipientType: 'citizen' | 'officer' | 'department' | 'court' | 'prison';
  channel: 'push' | 'sms' | 'email' | 'in_app';
  title: string;
  body: string;
  data?: Record<string, any>;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

export interface CivicCourtToPrisonParams {
  action: 'court_to_prison';
  caseId: string;
  prisonerId: string;
  sentenceDetails: {
    prisonId: string; startDate: string; endDate?: string; sentenceType: string;
    offenseCategory: string; notes?: string;
  };
  transferredBy: string;
}

export interface CivicPoliceToCourtParams {
  action: 'police_to_court';
  caseId: string;
  arrestId: string;
  courtId: string;
  charges: Array<{ charge: string; section: string; severity: string }>;
  evidenceFiles?: string[];
  officerId: string;
  scheduledDate?: string;
}

export interface CivicJurisdictionCheckParams {
  action: 'jurisdiction_check';
  entityType: 'citizen' | 'business' | 'vehicle' | 'property';
  entityId: string;
  location?: { lat: number; lng: number; county?: string; subCounty?: string; ward?: string };
}

export interface CivicGenerateTaxpayerIDParams {
  action: 'generate_taxpayer_id';
  citizenId: string;
  idType: 'individual' | 'business' | 'corporate';
  businessName?: string;
  kraPin?: string;
}

export interface CivicGenerateVoucherParams {
  action: 'generate_voucher';
  taxpayerId: string;
  taxType: 'income' | 'vat' | 'property' | 'license' | 'penalty';
  amount: number;
  period: { start: string; end: string };
  dueDate: string;
}

export interface CivicProcessTaxPaymentParams {
  action: 'process_tax_payment';
  voucherId: string;
  taxpayerId: string;
  amount: number;
  paymentMethod: 'wallet' | 'mpesa' | 'bank';
  reference?: string;
}

export interface CivicCalculateTaxParams {
  action: 'calculate_tax';
  taxpayerId: string;
  taxType: 'income' | 'vat' | 'property' | 'business';
  period: { start: string; end: string };
  income?: number;
  deductions?: number;
}

export interface CivicProcessExpenditureParams {
  action: 'process_expenditure';
  departmentId: string;
  budgetLineId: string;
  amount: number;
  description: string;
  approvedBy: string;
  vendorId?: string;
  attachments?: string[];
}

export interface CivicConsolidateRevenueParams {
  action: 'consolidate_revenue';
  countyId: string;
  period: { start: string; end: string };
  categories?: string[];
}

export type CivicParams = 
  | CivicAuditLogParams | CivicNotificationRouteParams | CivicCourtToPrisonParams 
  | CivicPoliceToCourtParams | CivicJurisdictionCheckParams | CivicGenerateTaxpayerIDParams
  | CivicGenerateVoucherParams | CivicProcessTaxPaymentParams | CivicCalculateTaxParams
  | CivicProcessExpenditureParams | CivicConsolidateRevenueParams;

export async function civicOperation(params: CivicParams) {
  const { data, error } = await supabase.functions.invoke('civic-operations', {
    body: params,
  });
  if (error) throw error;
  return data;
}

export const auditLog = (p: Omit<CivicAuditLogParams, 'action'>) => 
  civicOperation({ action: 'audit_log', ...p } as CivicAuditLogParams);

export const notificationRoute = (p: Omit<CivicNotificationRouteParams, 'action'>) => 
  civicOperation({ action: 'notification_route', ...p } as CivicNotificationRouteParams);

export const courtToPrison = (p: Omit<CivicCourtToPrisonParams, 'action'>) => 
  civicOperation({ action: 'court_to_prison', ...p } as CivicCourtToPrisonParams);

export const policeToCourt = (p: Omit<CivicPoliceToCourtParams, 'action'>) => 
  civicOperation({ action: 'police_to_court', ...p } as CivicPoliceToCourtParams);

export const jurisdictionCheck = (p: Omit<CivicJurisdictionCheckParams, 'action'>) => 
  civicOperation({ action: 'jurisdiction_check', ...p } as CivicJurisdictionCheckParams);

export const generateTaxpayerID = (p: Omit<CivicGenerateTaxpayerIDParams, 'action'>) => 
  civicOperation({ action: 'generate_taxpayer_id', ...p } as CivicGenerateTaxpayerIDParams);

export const generateVoucher = (p: Omit<CivicGenerateVoucherParams, 'action'>) => 
  civicOperation({ action: 'generate_voucher', ...p } as CivicGenerateVoucherParams);

export const processTaxPayment = (p: Omit<CivicProcessTaxPaymentParams, 'action'>) => 
  civicOperation({ action: 'process_tax_payment', ...p } as CivicProcessTaxPaymentParams);

export const calculateTax = (p: Omit<CivicCalculateTaxParams, 'action'>) => 
  civicOperation({ action: 'calculate_tax', ...p } as CivicCalculateTaxParams);

export const processExpenditure = (p: Omit<CivicProcessExpenditureParams, 'action'>) => 
  civicOperation({ action: 'process_expenditure', ...p } as CivicProcessExpenditureParams);

export const consolidateRevenue = (p: Omit<CivicConsolidateRevenueParams, 'action'>) => 
  civicOperation({ action: 'consolidate_revenue', ...p } as CivicConsolidateRevenueParams);
