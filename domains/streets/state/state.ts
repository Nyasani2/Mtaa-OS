// lib/streets/state.ts
// MTAA Streets — Zustand State Store

import { create } from 'zustand';
import {
  StreetPost, StreetComment, StreetProfile, StreetLive,
  StreetMessage, StreetConversation, StreetNotification,
  StreetAd, StreetShopItem, StreetJob, StreetMarketplaceItem,
  StreetCreatorStudioMetrics, StreetReport, StreetFeedFilters, StreetDiscoverFilters
} from './types';

interface StreetsState {
  // Feed
  feedPosts: StreetPost[];
  feedLoading: boolean;
  feedHasMore: boolean;
  feedPage: number;
  feedFilters: StreetFeedFilters;
  setFeedPosts: (posts: StreetPost[]) => void;
  appendFeedPosts: (posts: StreetPost[]) => void;
  setFeedLoading: (loading: boolean) => void;
  setFeedHasMore: (hasMore: boolean) => void;
  setFeedPage: (page: number) => void;
  setFeedFilters: (filters: StreetFeedFilters) => void;

  // Discover
  discoverPosts: StreetPost[];
  discoverLoading: boolean;
  discoverHasMore: boolean;
  discoverPage: number;
  discoverFilters: StreetDiscoverFilters;
  trendingTags: string[];
  setDiscoverPosts: (posts: StreetPost[]) => void;
  appendDiscoverPosts: (posts: StreetPost[]) => void;
  setDiscoverLoading: (loading: boolean) => void;
  setDiscoverHasMore: (hasMore: boolean) => void;
  setDiscoverPage: (page: number) => void;
  setDiscoverFilters: (filters: StreetDiscoverFilters) => void;
  setTrendingTags: (tags: string[]) => void;

  // Create
  createMedia: string[];
  createContent: string;
  createLocation: { lat: number; lng: number; name?: string } | null;
  createVisibility: 'public' | 'friends' | 'private' | 'tribe';
  createTribeId: string | null;
  createTags: string[];
  createMentions: string[];
  setCreateMedia: (media: string[]) => void;
  setCreateContent: (content: string) => void;
  setCreateLocation: (location: { lat: number; lng: number; name?: string } | null) => void;
  setCreateVisibility: (visibility: 'public' | 'friends' | 'private' | 'tribe') => void;
  setCreateTribeId: (tribeId: string | null) => void;
  setCreateTags: (tags: string[]) => void;
  setCreateMentions: (mentions: string[]) => void;
  resetCreate: () => void;

  // Comments
  comments: Record<string, StreetComment[]>;
  commentsLoading: Record<string, boolean>;
  setComments: (postId: string, comments: StreetComment[]) => void;
  appendComments: (postId: string, comments: StreetComment[]) => void;
  setCommentsLoading: (postId: string, loading: boolean) => void;

  // Share
  sharePostId: string | null;
  shareMessage: string;
  shareRecipients: string[];
  setSharePostId: (postId: string | null) => void;
  setShareMessage: (message: string) => void;
  setShareRecipients: (recipients: string[]) => void;
  resetShare: () => void;

  // Live
  lives: StreetLive[];
  liveLoading: boolean;
  currentLive: StreetLive | null;
  setLives: (lives: StreetLive[]) => void;
  appendLives: (lives: StreetLive[]) => void;
  setLiveLoading: (loading: boolean) => void;
  setCurrentLive: (live: StreetLive | null) => void;

  // Inbox
  conversations: StreetConversation[];
  conversationsLoading: boolean;
  messages: Record<string, StreetMessage[]>;
  messagesLoading: Record<string, boolean>;
  currentConversationId: string | null;
  setConversations: (conversations: StreetConversation[]) => void;
  setConversationsLoading: (loading: boolean) => void;
  setMessages: (conversationId: string, messages: StreetMessage[]) => void;
  appendMessages: (conversationId: string, messages: StreetMessage[]) => void;
  setMessagesLoading: (conversationId: string, loading: boolean) => void;
  setCurrentConversationId: (id: string | null) => void;

  // Profile
  profile: StreetProfile | null;
  profileLoading: boolean;
  profilePosts: StreetPost[];
  profilePostsLoading: boolean;
  setProfile: (profile: StreetProfile | null) => void;
  setProfileLoading: (loading: boolean) => void;
  setProfilePosts: (posts: StreetPost[]) => void;
  appendProfilePosts: (posts: StreetPost[]) => void;
  setProfilePostsLoading: (loading: boolean) => void;

  // Settings
  settings: Record<string, any>;
  settingsLoading: boolean;
  setSettings: (settings: Record<string, any>) => void;
  setSettingsLoading: (loading: boolean) => void;

  // Wallet
  walletBalance: number;
  walletCurrency: string;
  walletTransactions: any[];
  walletLoading: boolean;
  setWalletBalance: (balance: number) => void;
  setWalletCurrency: (currency: string) => void;
  setWalletTransactions: (transactions: any[]) => void;
  setWalletLoading: (loading: boolean) => void;

  // Shop
  shopItems: StreetShopItem[];
  shopLoading: boolean;
  shopHasMore: boolean;
  shopPage: number;
  setShopItems: (items: StreetShopItem[]) => void;
  appendShopItems: (items: StreetShopItem[]) => void;
  setShopLoading: (loading: boolean) => void;
  setShopHasMore: (hasMore: boolean) => void;
  setShopPage: (page: number) => void;

  // Jobs
  jobs: StreetJob[];
  jobsLoading: boolean;
  jobsHasMore: boolean;
  jobsPage: number;
  setJobs: (jobs: StreetJob[]) => void;
  appendJobs: (jobs: StreetJob[]) => void;
  setJobsLoading: (loading: boolean) => void;
  setJobsHasMore: (hasMore: boolean) => void;
  setJobsPage: (page: number) => void;

  // Marketplace
  marketplaceItems: StreetMarketplaceItem[];
  marketplaceLoading: boolean;
  marketplaceHasMore: boolean;
  marketplacePage: number;
  setMarketplaceItems: (items: StreetMarketplaceItem[]) => void;
  appendMarketplaceItems: (items: StreetMarketplaceItem[]) => void;
  setMarketplaceLoading: (loading: boolean) => void;
  setMarketplaceHasMore: (hasMore: boolean) => void;
  setMarketplacePage: (page: number) => void;

  // Ads
  ads: StreetAd[];
  adsLoading: boolean;
  setAds: (ads: StreetAd[]) => void;
  setAdsLoading: (loading: boolean) => void;

  // Creator Studio
  creatorMetrics: StreetCreatorStudioMetrics | null;
  creatorLoading: boolean;
  setCreatorMetrics: (metrics: StreetCreatorStudioMetrics | null) => void;
  setCreatorLoading: (loading: boolean) => void;

  // Notifications
  notifications: StreetNotification[];
  notificationsLoading: boolean;
  unreadNotificationsCount: number;
  setNotifications: (notifications: StreetNotification[]) => void;
  setNotificationsLoading: (loading: boolean) => void;
  setUnreadNotificationsCount: (count: number) => void;

  // Report
  reportTargetId: string | null;
  reportTargetType: StreetReport['target_type'] | null;
  reportReason: string;
  reportDetails: string;
  setReportTargetId: (id: string | null) => void;
  setReportTargetType: (type: StreetReport['target_type'] | null) => void;
  setReportReason: (reason: string) => void;
  setReportDetails: (details: string) => void;
  resetReport: () => void;
}

export const useStreetsStore = create<StreetsState>((set) => ({
  // Feed
  feedPosts: [],
  feedLoading: false,
  feedHasMore: true,
  feedPage: 0,
  feedFilters: { type: 'all', media_type: 'all', time_range: 'all' },
  setFeedPosts: (posts) => set({ feedPosts: posts }),
  appendFeedPosts: (posts) => set((s) => ({ feedPosts: [...s.feedPosts, ...posts] })),
  setFeedLoading: (loading) => set({ feedLoading: loading }),
  setFeedHasMore: (hasMore) => set({ feedHasMore: hasMore }),
  setFeedPage: (page) => set({ feedPage: page }),
  setFeedFilters: (filters) => set({ feedFilters: filters }),

  // Discover
  discoverPosts: [],
  discoverLoading: false,
  discoverHasMore: true,
  discoverPage: 0,
  discoverFilters: {},
  trendingTags: [],
  setDiscoverPosts: (posts) => set({ discoverPosts: posts }),
  appendDiscoverPosts: (posts) => set((s) => ({ discoverPosts: [...s.discoverPosts, ...posts] })),
  setDiscoverLoading: (loading) => set({ discoverLoading: loading }),
  setDiscoverHasMore: (hasMore) => set({ discoverHasMore: hasMore }),
  setDiscoverPage: (page) => set({ discoverPage: page }),
  setDiscoverFilters: (filters) => set({ discoverFilters: filters }),
  setTrendingTags: (tags) => set({ trendingTags: tags }),

  // Create
  createMedia: [],
  createContent: '',
  createLocation: null,
  createVisibility: 'public',
  createTribeId: null,
  createTags: [],
  createMentions: [],
  setCreateMedia: (media) => set({ createMedia: media }),
  setCreateContent: (content) => set({ createContent: content }),
  setCreateLocation: (location) => set({ createLocation: location }),
  setCreateVisibility: (visibility) => set({ createVisibility: visibility }),
  setCreateTribeId: (tribeId) => set({ createTribeId: tribeId }),
  setCreateTags: (tags) => set({ createTags: tags }),
  setCreateMentions: (mentions) => set({ createMentions: mentions }),
  resetCreate: () => set({
    createMedia: [], createContent: '', createLocation: null,
    createVisibility: 'public', createTribeId: null, createTags: [], createMentions: []
  }),

  // Comments
  comments: {},
  commentsLoading: {},
  setComments: (postId, comments) => set((s) => ({ comments: { ...s.comments, [postId]: comments } })),
  appendComments: (postId, comments) => set((s) => ({
    comments: { ...s.comments, [postId]: [...(s.comments[postId] || []), ...comments] }
  })),
  setCommentsLoading: (postId, loading) => set((s) => ({
    commentsLoading: { ...s.commentsLoading, [postId]: loading }
  })),

  // Share
  sharePostId: null,
  shareMessage: '',
  shareRecipients: [],
  setSharePostId: (postId) => set({ sharePostId: postId }),
  setShareMessage: (message) => set({ shareMessage: message }),
  setShareRecipients: (recipients) => set({ shareRecipients: recipients }),
  resetShare: () => set({ sharePostId: null, shareMessage: '', shareRecipients: [] }),

  // Live
  lives: [],
  liveLoading: false,
  currentLive: null,
  setLives: (lives) => set({ lives }),
  appendLives: (lives) => set((s) => ({ lives: [...s.lives, ...lives] })),
  setLiveLoading: (loading) => set({ liveLoading: loading }),
  setCurrentLive: (live) => set({ currentLive: live }),

  // Inbox
  conversations: [],
  conversationsLoading: false,
  messages: {},
  messagesLoading: {},
  currentConversationId: null,
  setConversations: (conversations) => set({ conversations }),
  setConversationsLoading: (loading) => set({ conversationsLoading: loading }),
  setMessages: (conversationId, messages) => set((s) => ({
    messages: { ...s.messages, [conversationId]: messages }
  })),
  appendMessages: (conversationId, messages) => set((s) => ({
    messages: { ...s.messages, [conversationId]: [...(s.messages[conversationId] || []), ...messages] }
  })),
  setMessagesLoading: (conversationId, loading) => set((s) => ({
    messagesLoading: { ...s.messagesLoading, [conversationId]: loading }
  })),
  setCurrentConversationId: (id) => set({ currentConversationId: id }),

  // Profile
  profile: null,
  profileLoading: false,
  profilePosts: [],
  profilePostsLoading: false,
  setProfile: (profile) => set({ profile }),
  setProfileLoading: (loading) => set({ profileLoading: loading }),
  setProfilePosts: (posts) => set({ profilePosts: posts }),
  appendProfilePosts: (posts) => set((s) => ({ profilePosts: [...s.profilePosts, ...posts] })),
  setProfilePostsLoading: (loading) => set({ profilePostsLoading: loading }),

  // Settings
  settings: {},
  settingsLoading: false,
  setSettings: (settings) => set({ settings }),
  setSettingsLoading: (loading) => set({ settingsLoading: loading }),

  // Wallet
  walletBalance: 0,
  walletCurrency: 'USD',
  walletTransactions: [],
  walletLoading: false,
  setWalletBalance: (balance) => set({ walletBalance: balance }),
  setWalletCurrency: (currency) => set({ walletCurrency: currency }),
  setWalletTransactions: (transactions) => set({ walletTransactions: transactions }),
  setWalletLoading: (loading) => set({ walletLoading: loading }),

  // Shop
  shopItems: [],
  shopLoading: false,
  shopHasMore: true,
  shopPage: 0,
  setShopItems: (items) => set({ shopItems: items }),
  appendShopItems: (items) => set((s) => ({ shopItems: [...s.shopItems, ...items] })),
  setShopLoading: (loading) => set({ shopLoading: loading }),
  setShopHasMore: (hasMore) => set({ shopHasMore: hasMore }),
  setShopPage: (page) => set({ shopPage: page }),

  // Jobs
  jobs: [],
  jobsLoading: false,
  jobsHasMore: true,
  jobsPage: 0,
  setJobs: (jobs) => set({ jobs }),
  appendJobs: (jobs) => set((s) => ({ jobs: [...s.jobs, ...jobs] })),
  setJobsLoading: (loading) => set({ jobsLoading: loading }),
  setJobsHasMore: (hasMore) => set({ jobsHasMore: hasMore }),
  setJobsPage: (page) => set({ jobsPage: page }),

  // Marketplace
  marketplaceItems: [],
  marketplaceLoading: false,
  marketplaceHasMore: true,
  marketplacePage: 0,
  setMarketplaceItems: (items) => set({ marketplaceItems: items }),
  appendMarketplaceItems: (items) => set((s) => ({ marketplaceItems: [...s.marketplaceItems, ...items] })),
  setMarketplaceLoading: (loading) => set({ marketplaceLoading: loading }),
  setMarketplaceHasMore: (hasMore) => set({ marketplaceHasMore: hasMore }),
  setMarketplacePage: (page) => set({ marketplacePage: page }),

  // Ads
  ads: [],
  adsLoading: false,
  setAds: (ads) => set({ ads }),
  setAdsLoading: (loading) => set({ adsLoading: loading }),

  // Creator Studio
  creatorMetrics: null,
  creatorLoading: false,
  setCreatorMetrics: (metrics) => set({ creatorMetrics: metrics }),
  setCreatorLoading: (loading) => set({ creatorLoading: loading }),

  // Notifications
  notifications: [],
  notificationsLoading: false,
  unreadNotificationsCount: 0,
  setNotifications: (notifications) => set({ notifications }),
  setNotificationsLoading: (loading) => set({ notificationsLoading: loading }),
  setUnreadNotificationsCount: (count) => set({ unreadNotificationsCount: count }),

  // Report
  reportTargetId: null,
  reportTargetType: null,
  reportReason: '',
  reportDetails: '',
  setReportTargetId: (id) => set({ reportTargetId: id }),
  setReportTargetType: (type) => set({ reportTargetType: type }),
  setReportReason: (reason) => set({ reportReason: reason }),
  setReportDetails: (details) => set({ reportDetails: details }),
  resetReport: () => set({ reportTargetId: null, reportTargetType: null, reportReason: '', reportDetails: '' }),
}));
