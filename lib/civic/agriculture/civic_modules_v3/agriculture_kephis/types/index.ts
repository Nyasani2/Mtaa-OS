export interface CropCertificate {
  id: string;
  certificate_number: string;
  crop_name: string;
  variety: string;
  status: "pending" | "approved" | "rejected";
  issued_at?: string;
  expires_at?: string;
  [key: string]: any;
}

export interface SeedLicense {
  id: string;
  license_number: string;
  seed_name: string;
  status: "active" | "expired" | "suspended";
  [key: string]: any;
}

export interface FarmInspection {
  id: string;
  farm_id: string;
  inspection_date: string;
  status: "scheduled" | "completed" | "failed";
  [key: string]: any;
}

export interface PestDiseaseReport {
  id: string;
  report_number: string;
  pest_name: string;
  severity: "low" | "medium" | "high";
  reported_at: string;
  [key: string]: any;
}

export interface AgriApplication {
  id: string;
  application_type: string;
  status: "pending" | "approved" | "rejected";
  submitted_at: string;
  [key: string]: any;
}

export interface MarketPrice {
  id: string;
  commodity: string;
  price: number;
  unit: string;
  date: string;
  [key: string]: any;
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
  filters: Record<string, any>;

  // Setters
  setCertificates: (certs: CropCertificate[]) => void;
  setSeedLicenses: (licenses: SeedLicense[]) => void;
  setInspections: (inspections: FarmInspection[]) => void;
  setPestReports: (reports: PestDiseaseReport[]) => void;
  setApplications: (apps: AgriApplication[]) => void;
  setMarketPrices: (prices: MarketPrice[]) => void;
  setSelectedItem: (item: any | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}
