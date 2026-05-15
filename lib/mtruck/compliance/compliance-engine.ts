import { supabase } from "../../supabase";

export interface ComplianceResult {
  truck_id: string;

  insurance_valid: boolean;

  inspection_valid: boolean;

  license_valid: boolean;

  overall_status:
    | "COMPLIANT"
    | "NON_COMPLIANT";
}

export async function runComplianceAudit() {

  const { data: trucks, error } = await supabase
    .from("mtruck_fleet")
    .select("*");

  if (error) throw error;

  const results: ComplianceResult[] = [];

  for (const truck of trucks || []) {

    const insuranceValid =
      !!truck.insurance_expiry &&
      new Date(truck.insurance_expiry) >
        new Date();

    const inspectionValid =
      !!truck.inspection_expiry &&
      new Date(truck.inspection_expiry) >
        new Date();

    const licenseValid =
      !!truck.license_expiry &&
      new Date(truck.license_expiry) >
        new Date();

    results.push({
      truck_id: truck.id,

      insurance_valid:
        insuranceValid,

      inspection_valid:
        inspectionValid,

      license_valid:
        licenseValid,

      overall_status:
        insuranceValid &&
        inspectionValid &&
        licenseValid
          ? "COMPLIANT"
          : "NON_COMPLIANT",
    });
  }

  return results;
}
