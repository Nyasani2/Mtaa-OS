import { supabase } from '@/lib/supabase';

export type CountyAction = 
  | 'county_create' | 'county_staff_add' | 'county_service_config'
  | 'county_citizen_register' | 'county_license_apply' | 'county_bill_generate'
  | 'county_payment_process' | 'county_enforcement_scan' | 'county_enforcement_penalty'
  | 'county_analytics_dashboard';

export interface CountyCreateParams {
  action: 'county_create';
  name: string;
  code: string;
  country: string;
  governorId: string;
  contact: { email: string; phone: string; address: string };
  boundaries?: Array<{ lat: number; lng: number }>;
}

export interface CountyStaffAddParams {
  action: 'county_staff_add';
  countyId: string;
  userId: string;
  role: 'admin' | 'revenue' | 'enforcement' | 'clerk' | 'inspector';
  department: string;
  permissions: string[];
}

export interface CountyServiceConfigParams {
  action: 'county_service_config';
  countyId: string;
  serviceType: 'license' | 'permit' | 'health' | 'education' | 'revenue';
  config: {
    fees: Record<string, number>;
    requirements: string[];
    workflow: string[];
    autoApprove?: boolean;
  };
}

export interface CountyCitizenRegisterParams {
  action: 'county_citizen_register';
  countyId: string;
  citizenId: string;
  ward: string;
  subCounty: string;
  residenceType: 'owner' | 'tenant' | 'business';
  propertyId?: string;
}

export interface CountyLicenseApplyParams {
  action: 'county_license_apply';
  countyId: string;
  applicantId: string;
  licenseType: 'business' | 'health' | 'liquor' | 'construction' | 'transport';
  businessName: string;
  businessAddress: string;
  documents: string[];
  paymentMethod: 'wallet' | 'mpesa';
}

export interface CountyBillGenerateParams {
  action: 'county_bill_generate';
  countyId: string;
  taxpayerId: string;
  billType: 'property' | 'license' | 'parking' | 'market' | 'cess';
  amount: number;
  period: { start: string; end: string };
  dueDate: string;
  propertyId?: string;
}

export interface CountyPaymentProcessParams {
  action: 'county_payment_process';
  billId: string;
  taxpayerId: string;
  amount: number;
  paymentMethod: 'wallet' | 'mpesa' | 'bank';
  reference?: string;
}

export interface CountyEnforcementScanParams {
  action: 'county_enforcement_scan';
  countyId: string;
  officerId: string;
  targetType: 'business' | 'vehicle' | 'property' | 'license';
  targetId: string;
  location?: { lat: number; lng: number };
}

export interface CountyEnforcementPenaltyParams {
  action: 'county_enforcement_penalty';
  countyId: string;
  officerId: string;
  targetId: string;
  violation: string;
  penaltyAmount: number;
  paymentDeadline: string;
  evidence?: string[];
}

export interface CountyAnalyticsDashboardParams {
  action: 'county_analytics_dashboard';
  countyId: string;
  period: { start: string; end: string };
  metrics: Array<'revenue' | 'licenses' | 'compliance' | 'citizens' | 'staff' | 'enforcement'>;
}

export type CountyParams = 
  | CountyCreateParams | CountyStaffAddParams | CountyServiceConfigParams
  | CountyCitizenRegisterParams | CountyLicenseApplyParams | CountyBillGenerateParams
  | CountyPaymentProcessParams | CountyEnforcementScanParams | CountyEnforcementPenaltyParams
  | CountyAnalyticsDashboardParams;

export async function countyOperation(params: CountyParams) {
  const { data, error } = await supabase.functions.invoke('county-operations', {
    body: params,
  });
  if (error) throw error;
  return data;
}

export const countyCreate = (p: Omit<CountyCreateParams, 'action'>) => 
  countyOperation({ action: 'county_create', ...p } as CountyCreateParams);

export const countyStaffAdd = (p: Omit<CountyStaffAddParams, 'action'>) => 
  countyOperation({ action: 'county_staff_add', ...p } as CountyStaffAddParams);

export const countyServiceConfig = (p: Omit<CountyServiceConfigParams, 'action'>) => 
  countyOperation({ action: 'county_service_config', ...p } as CountyServiceConfigParams);

export const countyCitizenRegister = (p: Omit<CountyCitizenRegisterParams, 'action'>) => 
  countyOperation({ action: 'county_citizen_register', ...p } as CountyCitizenRegisterParams);

export const countyLicenseApply = (p: Omit<CountyLicenseApplyParams, 'action'>) => 
  countyOperation({ action: 'county_license_apply', ...p } as CountyLicenseApplyParams);

export const countyBillGenerate = (p: Omit<CountyBillGenerateParams, 'action'>) => 
  countyOperation({ action: 'county_bill_generate', ...p } as CountyBillGenerateParams);

export const countyPaymentProcess = (p: Omit<CountyPaymentProcessParams, 'action'>) => 
  countyOperation({ action: 'county_payment_process', ...p } as CountyPaymentProcessParams);

export const countyEnforcementScan = (p: Omit<CountyEnforcementScanParams, 'action'>) => 
  countyOperation({ action: 'county_enforcement_scan', ...p } as CountyEnforcementScanParams);

export const countyEnforcementPenalty = (p: Omit<CountyEnforcementPenaltyParams, 'action'>) => 
  countyOperation({ action: 'county_enforcement_penalty', ...p } as CountyEnforcementPenaltyParams);

export const countyAnalyticsDashboard = (p: Omit<CountyAnalyticsDashboardParams, 'action'>) => 
  countyOperation({ action: 'county_analytics_dashboard', ...p } as CountyAnalyticsDashboardParams);
