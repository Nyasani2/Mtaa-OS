// domains/pulse/types.ts
// MTAA Pulse — Complete Type System

export type PulseSource = 'profile' | 'wallet' | 'messenger' | 'feed' | 'streets' | 'jobs' | 'transport' | 'marketplace' | 'education' | 'health' | 'government' | 'pulse';
export type PulseEntityType = 'user' | 'post' | 'community' | 'job' | 'ride' | 'order' | 'transfer' | 'course' | 'certification' | 'event' | 'business' | 'product';
export type PulseAlertType = 'platform' | 'security' | 'emergency' | 'community' | 'government' | 'business' | 'job' | 'transport' | 'weather' | 'health';
export type PulseSeverity = 'info' | 'warning' | 'critical' | 'emergency';
export type PulsePeriod = 'hourly' | 'daily' | 'weekly' | 'monthly';
export type PulseRecType = 'topic' | 'community' | 'business' | 'creator' | 'event' | 'job' | 'product' | 'course';
export type PulseItemType = 'post' | 'job' | 'product' | 'event' | 'business' | 'course' | 'community' | 'creator' | 'article' | 'alert';
export type PulseTopicCategory = 'business' | 'technology' | 'culture' | 'politics' | 'sports' | 'education' | 'health' | 'entertainment' | 'science' | 'general';

// ============================================================================
// CORE INTERFACES
// ============================================================================

export interface PulseEvent {
  id: string;
  source: PulseSource;
  event_type: string;
  entity_type: PulseEntityType;
  entity_id: string;
  user_id?: string;
  payload: Record<string, any>;
  severity: 'info' | 'warning' | 'critical';
  region?: string;
  county?: string;
  created_at: string;
  processed_at?: string;
  processed: boolean;
  retry_count: number;
}

export interface PulseTopic {
  id: string;
  name: string;
  slug: string;
  description?: string;
  category: PulseTopicCategory;
  icon_url?: string;
  follower_count: number;
  post_count: number;
  trending_score: number;
  trending_velocity: number;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  is_following?: boolean;
}

export interface PulseTopicFollower {
  id: string;
  topic_id: string;
  user_id: string;
  notification_enabled: boolean;
  created_at: string;
}

export interface PulseTrend {
  id: string;
  topic_id?: string;
  entity_type: 'creator' | 'business' | 'community' | 'job' | 'product' | 'event' | 'discussion' | 'topic';
  entity_id: string;
  entity_name: string;
  entity_avatar?: string;
  score: number;
  velocity: number;
  view_count: number;
  engagement_count: number;
  region?: string;
  county?: string;
  period: PulsePeriod;
  rank: number;
  is_featured: boolean;
  created_at: string;
  expires_at: string;
}

export interface PulseAlert {
  id: string;
  alert_type: PulseAlertType;
  title: string;
  description: string;
  severity: PulseSeverity;
  source: string;
  source_id?: string;
  region?: string;
  county?: string;
  lat?: number;
  lng?: number;
  radius_meters?: number;
  action_url?: string;
  action_label?: string;
  image_url?: string;
  is_broadcast: boolean;
  broadcast_audience: 'all' | 'region' | 'county' | 'verified';
  start_at?: string;
  end_at?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  created_by?: string;
  is_read?: boolean;
  is_dismissed?: boolean;
}

export interface PulseAlertDelivery {
  id: string;
  alert_id: string;
  user_id: string;
  delivered_at: string;
  read_at?: string;
  dismissed_at?: string;
  acknowledged_at?: string;
  channel: 'push' | 'sms' | 'email' | 'in_app';
}

export interface PulseSavedItem {
  id: string;
  user_id: string;
  item_type: PulseItemType;
  item_id: string;
  source_module: string;
  title: string;
  thumbnail_url?: string;
  metadata: Record<string, any>;
  notes?: string;
  created_at: string;
}

export interface PulseReport {
  id: string;
  reporter_id: string;
  entity_type: 'post' | 'comment' | 'user' | 'business' | 'product' | 'job' | 'event' | 'community';
  entity_id: string;
  reason: string;
  description?: string;
  evidence_urls?: string[];
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed' | 'escalated';
  assigned_to?: string;
  resolution?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PulseRecommendation {
  id: string;
  user_id: string;
  rec_type: PulseRecType;
  entity_type: string;
  entity_id: string;
  entity_name: string;
  entity_avatar?: string;
  reason: string;
  score: number;
  context: Record<string, any>;
  clicked_at?: string;
  dismissed_at?: string;
  created_at: string;
  expires_at: string;
}

export interface PulseAnalytics {
  id: string;
  metric_name: string;
  metric_value: number;
  metric_unit?: string;
  dimension?: string;
  dimension_value?: string;
  region?: string;
  county?: string;
  period: PulsePeriod;
  snapshot_at: string;
  created_at: string;
}

export interface PulseCreatorScore {
  id: string;
  creator_id: string;
  overall_score: number;
  content_score: number;
  engagement_score: number;
  revenue_score: number;
  community_score: number;
  verification_score: number;
  follower_count: number;
  content_count: number;
  total_views: number;
  total_engagement: number;
  total_revenue: number;
  rank_national?: number;
  rank_regional?: number;
  rank_category?: string;
  calculated_at: string;
  updated_at: string;
}

export interface PulseEntityRanking {
  id: string;
  entity_type: string;
  entity_id: string;
  entity_name: string;
  category?: string;
  score: number;
  rank: number;
  previous_rank?: number;
  rank_change?: number;
  region?: string;
  county?: string;
  period: PulsePeriod;
  calculated_at: string;
  expires_at: string;
}

export interface PulseEventInteraction {
  id: string;
  event_id: string;
  user_id: string;
  interaction_type: 'view' | 'click' | 'share' | 'save' | 'dismiss';
  metadata: Record<string, any>;
  created_at: string;
}

export interface PulseSearchResult {
  id: string;
  entity_type: string;
  entity_id: string;
  title: string;
  description?: string;
  tags?: string[];
  metadata: Record<string, any>;
  region?: string;
  county?: string;
  rank?: number;
}

export interface PulseModerationItem {
  id: string;
  entity_type: string;
  entity_id: string;
  reporter_id?: string;
  report_reason: string;
  report_description?: string;
  evidence_urls?: string[];
  ai_score?: number;
  ai_reason?: string;
  status: 'pending' | 'reviewing' | 'flagged' | 'limited' | 'removed' | 'restored' | 'appealed';
  moderator_id?: string;
  moderator_notes?: string;
  action_taken?: string;
  appealed_at?: string;
  appeal_reason?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// UI STATE TYPES
// ============================================================================

export interface PulseHomeState {
  trending: PulseTrend[];
  alerts: PulseAlert[];
  recommendations: PulseRecommendation[];
  topics: PulseTopic[];
  events: PulseEvent[];
  analytics: PulseAnalytics[];
  creators: PulseCreatorScore[];
  loading: boolean;
  error: string | null;
  activeTab: 'for_you' | 'following' | 'trending' | 'business' | 'learning' | 'jobs' | 'opportunities' | 'africa' | 'global' | 'nearby' | 'saved';
}

export interface PulseSearchState {
  query: string;
  results: PulseSearchResult[];
  filters: {
    type?: PulseItemType;
    region?: string;
    county?: string;
    dateRange?: 'today' | 'week' | 'month' | 'year';
  };
  suggestions: string[];
  loading: boolean;
  hasMore: boolean;
}

export interface PulseCreatorState {
  profile: any | null;
  content: any[];
  courses: any[];
  products: any[];
  services: any[];
  events: any[];
  stats: {
    followers: number;
    views: number;
    engagement: number;
    revenue: number;
  };
  loading: boolean;
}

export interface PulseNotificationState {
  alerts: PulseAlert[];
  unreadCount: number;
  loading: boolean;
}
