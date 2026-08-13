import { healthCrypto } from '../security/health-crypto';

export interface ASISHealthContext {
  patientId: string;
  profile: any;
  recentRecords: any[];
  activeMedications: any[];
  upcomingAppointments: any[];
  emergencyData: any;
}

export interface ASISHealthResponse {
  summary: string;
  recommendations: string[];
  warnings: string[];
  shouldSeeDoctor: boolean;
  urgency: 'none' | 'low' | 'medium' | 'high' | 'critical';
}

class HealthASIS {
  private context: ASISHealthContext | null = null;
  private hasPermission = false;

  async requestPermission(): Promise<boolean> {
    this.hasPermission = true;
    return true;
  }

  setContext(ctx: ASISHealthContext): void {
    this.context = ctx;
  }

  async summarizeHistory(): Promise<string> {
    if (!this.hasPermission || !this.context) {
      return 'Health data access not granted. Please authenticate to view your health summary.';
    }
    const records = this.context.recentRecords;
    if (!records.length) return 'No recent health records found.';
    const visits = records.filter((r: any) => r.type === 'visit').length;
    const labs = records.filter((r: any) => r.type === 'lab').length;
    const prescriptions = records.filter((r: any) => r.type === 'prescription').length;
    return `Recent activity: ${visits} visit${visits !== 1 ? 's' : ''}, ${labs} lab test${labs !== 1 ? 's' : ''}, ${prescriptions} prescription${prescriptions !== 1 ? 's' : ''}.`;
  }

  async explainLabResult(record: any): Promise<ASISHealthResponse> {
    if (!this.hasPermission) {
      return {
        summary: 'Permission required to analyze lab results.',
        recommendations: [],
        warnings: [],
        shouldSeeDoctor: false,
        urgency: 'none',
      };
    }
    const results = record.data?.results || [];
    const warnings: string[] = [];
    let shouldSeeDoctor = false;
    let urgency: ASISHealthResponse['urgency'] = 'none';

    for (const r of results) {
      if (r.status === 'critical') {
        warnings.push(`${r.parameter} is critically abnormal (${r.value} ${r.unit}).`);
        urgency = 'critical';
        shouldSeeDoctor = true;
      } else if (r.status === 'abnormal') {
        warnings.push(`${r.parameter} is outside normal range (${r.value} ${r.unit}).`);
        if (urgency !== 'critical') urgency = 'medium';
      }
    }

    return {
      summary: warnings.length
        ? `Found ${warnings.length} abnormal value${warnings.length !== 1 ? 's' : ''}.`
        : 'All values within normal range.',
      recommendations: warnings.length
        ? ['Schedule follow-up with your doctor', 'Monitor symptoms', 'Repeat test if advised']
        : ['Continue current health regimen', 'Maintain regular check-ups'],
      warnings,
      shouldSeeDoctor,
      urgency,
    };
  }

  async analyzeEmergency(symptoms: string[]): Promise<ASISHealthResponse> {
    const criticalSymptoms = ['chest pain', 'difficulty breathing', 'unconscious', 'severe bleeding', 'seizure', 'stroke'];
    const foundCritical = symptoms.some((s: any) => criticalSymptoms.some((c: any) => s.toLowerCase().includes(c)));

    if (foundCritical) {
      return {
        summary: 'CRITICAL: Potential life-threatening symptoms detected.',
        recommendations: ['Call emergency services immediately', 'Do not drive yourself', 'Stay calm and seated'],
        warnings: symptoms,
        shouldSeeDoctor: true,
        urgency: 'critical',
      };
    }

    return {
      summary: `Symptoms analyzed: ${symptoms.join(', ')}. No immediate critical signs detected.`,
      recommendations: ['Monitor symptoms', 'Rest and hydrate', 'Consult a doctor if symptoms worsen'],
      warnings: [],
      shouldSeeDoctor: false,
      urgency: 'low',
    };
  }

  async checkDrugInteractions(medications: any[]): Promise<string[]> {
    const interactions: string[] = [];
    const knownPairs: Record<string, string[]> = {
      'warfarin': ['aspirin', 'ibuprofen'],
      'lisinopril': ['potassium supplements'],
      'metformin': ['contrast dye'],
    };

    for (let i = 0; i < medications.length; i++) {
      for (let j = i + 1; j < medications.length; j++) {
        const a = medications[i].name.toLowerCase();
        const b = medications[j].name.toLowerCase();
        for (const [drug, conflicts] of Object.entries(knownPairs)) {
          if ((a.includes(drug) && conflicts.some((c: any) => b.includes(c))) ||
              (b.includes(drug) && conflicts.some((c: any) => a.includes(c)))) {
            interactions.push(`Potential interaction: ${medications[i].name} + ${medications[j].name}`);
          }
        }
      }
    }
    return interactions;
  }

  async remindMedication(medication: any): Promise<string> {
    return `Time to take ${medication.name} ${medication.dosage}. ${medication.instructions}`;
  }

  async remindAppointment(appointment: any): Promise<string> {
    return `Upcoming appointment with ${appointment.doctorName} at ${appointment.hospitalName} on ${appointment.appointmentDate} at ${appointment.appointmentTime}.`;
  }
}

export const healthASIS = new HealthASIS();
