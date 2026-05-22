// lib/civic/courts/types/courts.ts
export interface CourtCase {
  id: string;
  caseNumber: string;
  title: string;
  description?: string;
  status: "pending" | "active" | "resolved" | "appealed" | "closed";
  courtHouse: string;
  judgeId?: string;
  plaintiff: string;
  defendant: string;
  filingDate: string;
  scheduledAt?: string;
  priority: "low" | "medium" | "high" | "urgent";
  caseType: "civil" | "criminal" | "family" | "commercial" | "constitutional";
  createdAt: string;
  updatedAt: string;
}

export interface CourtHearing {
  id: string;
  caseId: string;
  scheduledAt: string;
  courtRoom: string;
  judgeId: string;
  hearingType: "mention" | "hearing" | "trial" | "ruling" | "sentencing";
  status: "scheduled" | "in_progress" | "completed" | "postponed" | "cancelled";
  notes?: string;
  attendees?: string[];
  transcriptUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CourtJudge {
  id: string;
  userId: string;
  courtHouse: string;
  specialization?: string;
  yearsOfService?: number;
  active: boolean;
  createdAt: string;
}

export interface CourtDocument {
  id: string;
  caseId: string;
  documentType: string;
  fileUrl: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface CourtAppeal {
  id: string;
  caseId: string;
  appealNumber: string;
  appellant: string;
  grounds: string;
  status: "filed" | "hearing_scheduled" | "under_review" | "decided" | "dismissed";
  higherCourt: string;
  filingDate: string;
  decisionDate?: string;
  createdAt: string;
}
