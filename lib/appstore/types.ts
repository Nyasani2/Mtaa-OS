export type AppCategory =
  | 'os' | 'commerce' | 'transport' | 'work' | 'social'
  | 'civic' | 'finance' | 'tools' | 'health' | 'education'
  | 'entertainment' | 'productivity' | 'lifestyle' | 'news';

export type AppStatus = 'draft' | 'pending_review' | 'approved' | 'rejected' | 'published' | 'suspended';
export type InstallStatus = 'not_installed' | 'installing' | 'installed' | 'updating';

export interface AppManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  shortDescription?: string;
  category: AppCategory;
  subcategories?: string[];
  icon: string;
  screenshots?: string[];
  route: string;
  developer: string;
  developerId?: string;
  developerEmail?: string;
  developerWebsite?: string;
  permissions: string[];
  status: AppStatus;
  isOSApp?: boolean;
  requiresAuth?: boolean;
  devOnly?: boolean;
  featured?: boolean;
  trending?: boolean;
  rating?: number;
  reviewCount?: number;
  downloadCount?: number;
  sizeMB?: number;
  price?: number;
  currency?: string;
  releaseDate?: string;
  lastUpdated?: string;
  minOSVersion?: string;
  changelog?: string[];
  tags?: string[];
  color?: string;
}

export interface AppReview {
  id: string;
  appId: string;
  userId: string;
  userName: string;
  rating: number;
  title: string;
  body: string;
  helpfulCount: number;
  createdAt: string;
}

export interface DeveloperProfile {
  id: string;
  userId: string;
  name: string;
  email: string;
  website?: string;
  bio?: string;
  verified: boolean;
  totalApps: number;
  totalDownloads: number;
  totalEarnings: number;
  joinedAt: string;
}

export interface AppSubmission {
  id: string;
  developerId: string;
  manifest: AppManifest;
  status: AppStatus;
  reviewNotes?: string;
  submittedAt: string;
  reviewedAt?: string;
  publishedAt?: string;
}
