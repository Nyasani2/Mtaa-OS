export interface CropCertificate {
  id: string;
  user_id: string;
  certificate_number: string;
  crop_type: string;
  variety: string;
  quantity: number;
  unit: string;
  origin_county: string;
  origin_farm: string;
  destination_country?: string;
  issue_date: string;
  expiry_date: string;
  status: 'active' | 'expired' | 'revoked' | 'suspended';
  inspection_date: string;
  inspector_id: string;
  phytosanitary_status: 'clean' | 'treatment_required' | 'rejected';
  treatment_details?: string;
  photos?: string[];
  created_at: string;
  updated_at: string;
}

export interface SeedLicense {
  id: string;
  user_id: string;
  license_number: string;
  license_type: 'producer' | 'merchant' | 'importer' | 'certified';
  crop_categories: string[];
  business_name: string;
  business_address: string;
  county: string;
  issue_date: string;
  expiry_date: string;
  status: 'active' | 'expired' | 'suspended' | 'revoked';
  inspection_date: string;
  inspector_id: string;
  premises_photo?: string;
  created_at: string;
  updated_at: string;
}

export interface FarmInspection {
  id: string;
  farm_id: string;
  inspector_id: string;
  inspection_date: string;
  farm_name: string;
  county: string;
  crop_types: string[];
  area_hectares: number;
  compliance_status: 'compliant' | 'minor_violations' | 'major_violations' | 'non_compliant';
  violations: string[];
  recommendations: string[];
  next_inspection_date: string;
  photos?: string[];
  created_at: string;
}

export interface PestDiseaseReport {
  id: string;
  reporter_id: string;
  pest_disease_name: string;
  type: 'pest' | 'disease' | 'weed' | 'invasive_species';
  affected_crop: string;
  county: string;
  location: string;
  severity: 'low' | 'moderate' | 'high' | 'severe';
  area_affected_hectares: number;
  symptoms: string;
  spread_status: 'contained' | 'spreading' | 'outbreak';
  control_measures?: string;
  photos?: string[];
  status: 'reported' | 'verified' | 'under_control' | 'resolved';
  created_at: string;
  updated_at: string;
}

export interface AgriApplication {
  id: string;
  user_id: string;
  type: 'crop_certificate' | 'seed_license' | 'farm_inspection' | 'pesticide_registration' | 'fertilizer_registration' | 'export_permit';
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'completed';
  data: Record<string, any>;
  fees_paid: number;
  inspection_date?: string;
  completion_date?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface MarketPrice {
  id: string;
  commodity: string;
  variety?: string;
  county: string;
  market: string;
  price_per_kg: number;
  currency: string;
  date_recorded: string;
  trend: 'up' | 'down' | 'stable';
  volume_traded?: number;
  quality_grade?: string;
  created_at: string;
}

export interface AgricultureState {
  certificates: CropCertificate[];
  seedLicenses: SeedLicense[];
  inspections: FarmInspection[];
  pestReports: PestDiseaseReport[];
  applications: AgriApplication[];
  marketPrices: MarketPrice[];
  selectedItem: any | null;
  isLoading: boolean;
  error: string | null;
  filters: {
    status?: string;
    county?: string;
    cropType?: string;
    dateFrom?: string;
    dateTo?: string;
  };
}
