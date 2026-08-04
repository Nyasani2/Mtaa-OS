import { AppManifest } from '../types';

export const UNIFIED_REGISTRY: Record<string, AppManifest> = {
  wallet: {
    id: 'wallet', name: 'Wallet', version: '3.2.1',
    description: 'Manage your MTAA balance, top up via M-Pesa, withdraw to bank, transfer funds to other users, and view transaction history.',
    shortDescription: 'Manage your MTAA balance, top up, withdraw, and transfer funds.',
    category: 'os', icon: 'cash-outline', route: '/(os)/wallet',
    developer: 'MTAA OS', isOSApp: true, requiresAuth: true,
    color: '#10B981', rating: 4.8, reviewCount: 1240, downloadCount: 50000,
    sizeMB: 12, permissions: ['wallet_read', 'wallet_write', 'contacts'],
    featured: true, trending: true, tags: ['finance', 'payments'],
  },
  health: {
    id: 'health', name: 'Health', version: '2.5.0',
    description: 'Access your health records, book appointments with providers, find nearby hospitals, manage prescriptions, and track vitals.',
    shortDescription: 'Access health records, book appointments, and find providers.',
    category: 'os', icon: 'medical-outline', route: '/(os)/health',
    developer: 'MTAA OS', isOSApp: true, requiresAuth: true,
    color: '#EF4444', rating: 4.6, reviewCount: 890, downloadCount: 35000,
    sizeMB: 18, permissions: ['health_read', 'health_write', 'location'],
    featured: true, tags: ['medical', 'wellness'],
  },
  education: {
    id: 'education', name: 'Education', version: '1.8.2',
    description: 'School management, classes, assignments, grades, attendance tracking, and parent-teacher communication.',
    shortDescription: 'School management, classes, assignments, and grades.',
    category: 'os', icon: 'school-outline', route: '/(education)',
    developer: 'MTAA OS', isOSApp: true, requiresAuth: true,
    color: '#8B5CF6', rating: 4.5, reviewCount: 650, downloadCount: 28000,
    sizeMB: 22, permissions: ['education_read', 'education_write'],
    tags: ['school', 'learning'],
  },
  settings: {
    id: 'settings', name: 'Settings', version: '1.0.0',
    description: 'App preferences, security settings, account management, notifications, and system configuration.',
    shortDescription: 'App preferences, security, and account settings.',
    category: 'os', icon: 'settings-outline', route: '/(os)/settings',
    developer: 'MTAA OS', isOSApp: true, requiresAuth: true,
    color: '#6B7280', rating: 4.9, reviewCount: 2100, downloadCount: 60000,
    sizeMB: 5, permissions: [], tags: ['system'],
  },
  phone: {
    id: 'phone', name: 'Phone', version: '1.2.0',
    description: 'Make calls, manage contacts, send SMS, and integrate with MTAA Messenger for VoIP calls.',
    shortDescription: 'Calls, contacts, and messaging.',
    category: 'os', icon: 'call-outline', route: '/(os)/phone',
    developer: 'MTAA OS', isOSApp: true, requiresAuth: true,
    color: '#3B82F6', rating: 4.3, reviewCount: 420, downloadCount: 22000,
    sizeMB: 8, permissions: ['contacts', 'microphone', 'phone'],
    tags: ['communication'],
  },
  profile: {
    id: 'profile', name: 'Profile', version: '2.1.0',
    description: 'Your public profile, achievements, analytics, earnings, social connections, and resume builder.',
    shortDescription: 'Your profile, achievements, and analytics.',
    category: 'os', icon: 'person-outline', route: '/(os)/profile',
    developer: 'MTAA OS', isOSApp: true, requiresAuth: true,
    color: '#F59E0B', rating: 4.7, reviewCount: 1500, downloadCount: 45000,
    sizeMB: 10, permissions: ['profile_read', 'profile_write'],
    tags: ['social', 'identity'],
  },
  streets: {
    id: 'streets', name: 'Streets', version: '2.3.0',
    description: 'Share posts, photos, videos, and articles with your community. Follow creators, comment, like, and discover trending content.',
    shortDescription: 'Share posts, photos, videos, and articles with your community.',
    category: 'social', icon: 'newspaper-outline', route: '/(os)/streets',
    developer: 'MTAA OS', isOSApp: true, requiresAuth: true,
    color: '#3B82F6', rating: 4.4, reviewCount: 780, downloadCount: 32000,
    sizeMB: 15, permissions: ['camera', 'photos', 'location', 'microphone'],
    trending: true, tags: ['social', 'content'],
  },
  tribes: {
    id: 'tribes', name: 'Tribes', version: '1.5.0',
    description: 'Join and manage community groups. Create tribes, invite members, share resources, and organize events.',
    shortDescription: 'Join and manage community groups.',
    category: 'social', icon: 'people-outline', route: '/(os)/tribes',
    developer: 'MTAA OS', isOSApp: true, requiresAuth: true,
    color: '#14B8A6', rating: 4.2, reviewCount: 340, downloadCount: 18000,
    sizeMB: 11, permissions: ['contacts', 'notifications'],
    tags: ['community', 'groups'],
  },
  messages: {
    id: 'messages', name: 'Messages', version: '3.0.0',
    description: 'Chat with friends and groups. End-to-end encrypted messaging, voice notes, file sharing, and video calls.',
    shortDescription: 'Chat with friends and groups.',
    category: 'social', icon: 'chatbubble-outline', route: '/(communication)/messages',
    developer: 'MTAA OS', isOSApp: true, requiresAuth: true,
    color: '#06B6D4', rating: 4.8, reviewCount: 2100, downloadCount: 55000,
    sizeMB: 14, permissions: ['contacts', 'camera', 'microphone', 'photos'],
    featured: true, trending: true, tags: ['chat', 'messaging'],
  },
  gallery: {
    id: 'gallery', name: 'Gallery', version: '1.1.0',
    description: 'Browse, organize, and edit your photos and videos. Create albums, share with friends, and backup to cloud.',
    shortDescription: 'Photos and videos.',
    category: 'social', icon: 'images-outline', route: '/(media)/gallery',
    developer: 'MTAA OS', isOSApp: true, requiresAuth: true,
    color: '#EC4899', rating: 4.5, reviewCount: 560, downloadCount: 25000,
    sizeMB: 9, permissions: ['photos', 'camera'],
    tags: ['media', 'photos'],
  },
  camera: {
    id: 'camera', name: 'Camera', version: '1.0.0',
    description: 'Take photos and videos with built-in filters, AR effects, and instant sharing to Streets and Tribes.',
    shortDescription: 'Take photos and videos.',
    category: 'social', icon: 'camera-outline', route: '/(media)/camera',
    developer: 'MTAA OS', isOSApp: true, requiresAuth: true,
    color: '#6366F1', rating: 4.3, reviewCount: 290, downloadCount: 19000,
    sizeMB: 7, permissions: ['camera', 'microphone', 'photos'],
    tags: ['media', 'camera'],
  },
  marketplace: {
    id: 'marketplace', name: 'Marketplace', version: '2.1.0',
    description: 'Buy and sell products in your local community. Browse listings, chat with sellers, and pay with MTAA Wallet.',
    shortDescription: 'Buy and sell products in your local community.',
    category: 'commerce', icon: 'cart-outline', route: '/(commerce)/marketplace',
    developer: 'MTAA OS', isOSApp: true, requiresAuth: true,
    color: '#F59E0B', rating: 4.6, reviewCount: 920, downloadCount: 38000,
    sizeMB: 16, permissions: ['wallet_read', 'location', 'camera', 'photos'],
    featured: true, trending: true, tags: ['shopping', 'buy', 'sell'],
  },
  shop: {
    id: 'shop', name: 'Shop', version: '1.4.0',
    description: 'Manage your store, inventory, sales, and analytics. Accept payments via MTAA Wallet and track orders.',
    shortDescription: 'Manage your store, inventory, and sales.',
    category: 'commerce', icon: 'storefront-outline', route: '/(commerce)/shop',
    developer: 'MTAA OS', isOSApp: true, requiresAuth: true,
    color: '#EC4899', rating: 4.4, reviewCount: 410, downloadCount: 15000,
    sizeMB: 13, permissions: ['wallet_read', 'wallet_write', 'camera', 'photos'],
    tags: ['business', 'store'],
  },
  restaurant: {
    id: 'restaurant', name: 'Restaurant', version: '1.0.0',
    description: 'POS, inventory, staff management, and analytics for restaurants. Take orders, manage tables, and track revenue.',
    shortDescription: 'POS, inventory, staff, and analytics for restaurants.',
    category: 'commerce', icon: 'restaurant-outline', route: '/(os)/restaurant',
    developer: 'MTAA OS', isOSApp: true, requiresAuth: true,
    color: '#F97316', rating: 4.1, reviewCount: 120, downloadCount: 5000,
    sizeMB: 20, permissions: ['wallet_read', 'wallet_write', 'camera'],
    tags: ['food', 'pos', 'business'],
  },
  stay: {
    id: 'stay', name: 'Stay', version: '1.3.0',
    description: 'Find accommodations, book stays, manage reservations, and discover local lodging options.',
    shortDescription: 'Find and book accommodations.',
    category: 'commerce', icon: 'bed-outline', route: '/(os)/stay',
    developer: 'MTAA OS', isOSApp: true, requiresAuth: true,
    color: '#84CC16', rating: 4.2, reviewCount: 350, downloadCount: 14000,
    sizeMB: 12, permissions: ['location', 'wallet_read', 'wallet_write', 'camera', 'photos'],
    tags: ['accommodation', 'hotels', 'lodging'],
  },
  mtaxi: {
    id: 'mtaxi', name: 'MTaxi', version: '3.5.0',
    description: 'Book car rides and motorcycle taxis. Request MTaxi cabs or Boda boda rides, track drivers in real-time, and pay with MTAA Wallet.',
    shortDescription: 'Book rides and manage transportation.',
    category: 'transport', icon: 'car-outline', route: '/(mtaxi)',
    developer: 'MTAA OS', isOSApp: true, requiresAuth: true,
    color: '#06B6D4', rating: 4.7, reviewCount: 2470, downloadCount: 74000,
    sizeMB: 17, permissions: ['location', 'wallet_read', 'wallet_write', 'camera'],
    featured: true, trending: true, tags: ['taxi', 'boda', 'rides', 'transport'],
  },
  mtruck: {
    id: 'mtruck', name: 'MTruck', version: '2.0.0',
    description: 'Logistics and freight management. Request hauls, track shipments, and manage your trucking fleet.',
    shortDescription: 'Logistics and freight management.',
    category: 'transport', icon: 'bus-outline', route: '/(mtruck)',
    developer: 'MTAA OS', isOSApp: true, requiresAuth: true,
    color: '#84CC16', rating: 4.3, reviewCount: 340, downloadCount: 14000,
    sizeMB: 14, permissions: ['location', 'wallet_read', 'wallet_write', 'camera'],
    tags: ['logistics', 'freight', 'trucking'],
  },
  jobs: {
    id: 'jobs', name: 'Jobs', version: '2.2.0',
    description: 'Find and post job opportunities. Create your professional profile, apply to jobs, and get hired.',
    shortDescription: 'Find and post job opportunities.',
    category: 'work', icon: 'briefcase-outline', route: '/(work)/jobs',
    developer: 'MTAA OS', isOSApp: true, requiresAuth: true,
    color: '#6366F1', rating: 4.4, reviewCount: 520, downloadCount: 21000,
    sizeMB: 13, permissions: ['profile_read', 'wallet_read'],
    tags: ['employment', 'career', 'hiring'],
  },
  studio: {
    id: 'studio', name: 'Studio', version: '1.3.0',
    description: 'Creator tools, live streaming, and monetization. Go live, earn from tips, and build your audience.',
    shortDescription: 'Creator tools, live streaming, and monetization.',
    category: 'work', icon: 'videocam-outline', route: '/(os)/studio',
    developer: 'MTAA OS', isOSApp: true, requiresAuth: true,
    color: '#EF4444', rating: 4.6, reviewCount: 890, downloadCount: 31000,
    sizeMB: 19, permissions: ['camera', 'microphone', 'wallet_read', 'wallet_write'],
    trending: true, tags: ['live', 'streaming', 'creator'],
  },
  civic: {
    id: 'civic', name: 'Civic', version: '1.0.0',
    description: 'Government services: police reports, court cases, revenue payments, treasury, and public records.',
    shortDescription: 'Government services: police, courts, revenue, and more.',
    category: 'civic', icon: 'shield-outline', route: '/(civic)',
    developer: 'MTAA OS', isOSApp: true, requiresAuth: true,
    color: '#1E3A5F', rating: 4.2, reviewCount: 180, downloadCount: 8000,
    sizeMB: 15, permissions: ['identity', 'wallet_read', 'wallet_write'],
    tags: ['government', 'public services'],
  },
  binance: {
    id: 'binance', name: 'Binance', version: '1.1.0',
    description: 'Crypto trading and wallet. Buy, sell, and trade Bitcoin, Ethereum, and other cryptocurrencies.',
    shortDescription: 'Crypto trading and wallet.',
    category: 'finance', icon: 'trending-up-outline', route: '/(finance)/binance',
    developer: 'Binance', isOSApp: false, requiresAuth: true,
    color: '#F0B90B', rating: 4.5, reviewCount: 1200, downloadCount: 35000,
    sizeMB: 25, permissions: ['wallet_read', 'wallet_write'],
    tags: ['crypto', 'bitcoin', 'trading'],
  },
  credit: {
    id: 'credit', name: 'Credit', version: '1.0.0',
    description: 'Loans and credit services. Apply for personal loans, business credit, and microfinance.',
    shortDescription: 'Loans and credit services.',
    category: 'finance', icon: 'card-outline', route: '/(finance)/credit',
    developer: 'MTAA OS', isOSApp: true, requiresAuth: true,
    color: '#10B981', rating: 4.0, reviewCount: 210, downloadCount: 9000,
    sizeMB: 10, permissions: ['wallet_read', 'identity', 'credit_check'],
    tags: ['loans', 'credit', 'microfinance'],
  },
  calculator: {
    id: 'calculator', name: 'Calculator', version: '1.0.0',
    description: 'Basic and scientific calculator with history, unit conversion, and currency exchange rates.',
    shortDescription: 'Basic calculator.',
    category: 'tools', icon: 'calculator-outline', route: '/(os)/calculator',
    developer: 'MTAA OS', isOSApp: true, requiresAuth: false,
    color: '#6B7280', rating: 4.8, reviewCount: 3100, downloadCount: 65000,
    sizeMB: 3, permissions: [], tags: ['math', 'utility'],
  },
  calendar: {
    id: 'calendar', name: 'Calendar', version: '1.0.0',
    description: 'Events and scheduling. Sync with MTAA apps, set reminders, and share events with friends.',
    shortDescription: 'Events and scheduling.',
    category: 'tools', icon: 'calendar-outline', route: '/(os)/calendar',
    developer: 'MTAA OS', isOSApp: true, requiresAuth: true,
    color: '#3B82F6', rating: 4.4, reviewCount: 450, downloadCount: 20000,
    sizeMB: 6, permissions: ['contacts', 'notifications'],
    tags: ['schedule', 'events'],
  },
  clock: {
    id: 'clock', name: 'Clock', version: '1.0.0',
    description: 'Alarm, timer, stopwatch, and world clock. Wake up with MTAA sounds and sync across devices.',
    shortDescription: 'Alarm, timer, and stopwatch.',
    category: 'tools', icon: 'time-outline', route: '/(os)/clock',
    developer: 'MTAA OS', isOSApp: true, requiresAuth: false,
    color: '#F59E0B', rating: 4.7, reviewCount: 1800, downloadCount: 42000,
    sizeMB: 4, permissions: ['notifications'], tags: ['alarm', 'time'],
  },
  reader: {
    id: 'reader', name: 'Reader', version: '1.0.0',
    description: 'Read documents, PDFs, and books. Annotate, highlight, and sync your reading progress.',
    shortDescription: 'Read documents and books.',
    category: 'tools', icon: 'book-outline', route: '/(os)/reader',
    developer: 'MTAA OS', isOSApp: true, requiresAuth: true,
    color: '#8B5CF6', rating: 4.3, reviewCount: 320, downloadCount: 16000,
    sizeMB: 8, permissions: ['photos', 'files'], tags: ['reading', 'pdf'],
  },
  developer: {
    id: 'developer', name: 'Developer', version: '1.0.0',
    description: 'Submit apps, view earnings, manage ASIS submissions, and track your app performance on the MTAA AppStore.',
    shortDescription: 'Submit apps, view earnings, manage ASIS submissions.',
    category: 'tools', icon: 'code-outline', route: '/(os)/developer',
    developer: 'MTAA OS', isOSApp: true, requiresAuth: true, devOnly: true,
    color: '#6366F1', rating: 4.9, reviewCount: 45, downloadCount: 500,
    sizeMB: 7, permissions: ['developer'], tags: ['dev', 'asis'],
  },
};

export function getAppById(id: string): AppManifest | undefined {
  return UNIFIED_REGISTRY[id];
}

export function getAllApps(): AppManifest[] {
  return Object.values(UNIFIED_REGISTRY);
}

export function getAppsByCategory(category: string): AppManifest[] {
  return getAllApps().filter(a => a.category === category);
}

export function getFeaturedApps(): AppManifest[] {
  return getAllApps().filter(a => a.featured);
}

export function getTrendingApps(): AppManifest[] {
  return getAllApps().filter(a => a.trending);
}

export function searchApps(query: string): AppManifest[] {
  const q = query.toLowerCase();
  return getAllApps().filter(a =>
    a.name.toLowerCase().includes(q) ||
    a.description.toLowerCase().includes(q) ||
    a.tags?.some(t => t.toLowerCase().includes(q)) ||
    a.developer.toLowerCase().includes(q)
  );
}

export function getInstalledAppIds(): string[] {
  return Object.keys(UNIFIED_REGISTRY);
}

export function isAppInstalled(id: string): boolean {
  return id in UNIFIED_REGISTRY;
}
