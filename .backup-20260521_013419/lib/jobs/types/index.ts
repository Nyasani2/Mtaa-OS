export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: "full_time" | "part_time" | "contract" | "gig";
  salary: { min: number; max: number; currency: string; period: "hour" | "day" | "month" | "year" };
  description: string;
  requirements: string[];
  skills: string[];
  postedAt: string;
  expiresAt: string;
  status: "open" | "closed" | "paused";
  applications: number;
  employerId: string;
}

export interface JobApplication {
  id: string;
  jobId: string;
  userId: string;
  status: "pending" | "reviewing" | "interview" | "offer" | "rejected" | "hired";
  coverLetter?: string;
  resumeUrl?: string;
  appliedAt: string;
  updatedAt: string;
}

export interface WorkProfile {
  id: string;
  userId: string;
  headline: string;
  summary: string;
  experience: WorkExperience[];
  education: Education[];
  skills: string[];
  availability: "immediate" | "two_weeks" | "one_month" | "negotiable";
  preferredLocation: string;
  expectedSalary: { min: number; max: number; currency: string };
  verified: boolean;
}

export interface WorkExperience {
  id: string;
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description: string;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate?: string;
}
