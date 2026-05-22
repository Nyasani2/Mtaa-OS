// lib/civic/prisons/types/prisons.ts
export interface PrisonCell {
  id: string;
  prisonId: string;
  block: string;
  cellNumber: string;
  capacity: number;
  currentOccupancy: number;
  cellType: "solitary" | "shared" | "maximum_security" | "minimum_security" | "medical";
  status: "available" | "occupied" | "maintenance" | "quarantine";
  floor?: number;
  wing?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PrisonInmate {
  id: string;
  prisonId: string;
  cellId?: string;
  inmateNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: string;
  nationality?: string;
  sentenceStart?: string;
  sentenceEnd?: string;
  sentenceType?: string;
  crimeDescription?: string;
  status: "admitted" | "serving" | "transferred" | "released" | "escaped" | "deceased";
  medicalNotes?: string;
  visitorList?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PrisonVisitor {
  id: string;
  prisonId: string;
  inmateId: string;
  visitorName: string;
  visitorIdNumber?: string;
  relationship?: string;
  visitDate: string;
  visitDuration?: number;
  status: "scheduled" | "checked_in" | "in_progress" | "completed" | "cancelled" | "denied";
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PrisonFacility {
  id: string;
  name: string;
  location: string;
  capacity: number;
  currentPopulation: number;
  securityLevel: "minimum" | "medium" | "maximum" | "supermax";
  wardenId?: string;
  status: "operational" | "overcrowded" | "under_construction" | "closed";
  createdAt: string;
  updatedAt: string;
}

export interface PrisonIncident {
  id: string;
  prisonId: string;
  inmateId?: string;
  incidentType: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  reportedBy: string;
  reportedAt: string;
  resolvedAt?: string;
  status: "open" | "under_investigation" | "resolved" | "escalated";
  createdAt: string;
}
