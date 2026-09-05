// @ts-nocheck
// Domain hub definitions. Tiles link ONLY to existing routes.
export const DOMAIN_HUBS: any = {
  admin: {
    title: 'Command Centre', subtitle: 'National administration', icon: 'shield-checkmark', color: '#0f172a',
    tiles: [
      { label: 'Revenue', icon: 'stats-chart', route: '/(admin)/command-centre/revenue' },
      { label: 'Treasury', icon: 'bank', route: '/(admin)/command-centre/treasury' },
      { label: 'Central Bank', icon: 'business', route: '/(admin)/command-centre/treasury/central-bank' },
      { label: 'Credit Regulatory', icon: 'shield', route: '/(admin)/command-centre/treasury/credit-regulatory' },
      { label: 'Tax Wallets', icon: 'wallet', route: '/(admin)/tax-wallets' },
    ],
  },
  mtruck: {
    title: 'MTruck Freight', subtitle: 'Haulage & fleet', icon: 'car', color: '#f59e0b',
    tiles: [
      { label: 'Fleet Home', icon: 'grid', route: '/(mtruck)' },
      { label: 'Request Haul', icon: 'cube', route: '/(mtruck)/request-haul' },
      { label: 'Settlements', icon: 'cash', route: '/(mtruck)/settlement' },
      { label: 'Onboarding', icon: 'person-add', route: '/(mtruck)/onboarding' },
    ],
  },
  social: {
    title: 'Social', subtitle: 'Community & connection', icon: 'people', color: '#ec4899',
    tiles: [
      { label: 'Streets', icon: 'map', route: '/(os)/streets' },
      { label: 'Tribes', icon: 'people', route: '/(os)/tribes' },
      { label: 'Messages', icon: 'chatbubbles', route: '/(os)/messages' },
      { label: 'Hookup', icon: 'heart', route: '/(os)/hookup/discovery' },
    ],
  },
  media: {
    title: 'Media', subtitle: 'Create & consume', icon: 'videocam', color: '#ef4444',
    tiles: [
      { label: 'Studio', icon: 'film', route: '/(os)/studio' },
      { label: 'Gallery', icon: 'images', route: '/(media)/gallery' },
      { label: 'Camera', icon: 'camera', route: '/(media)/camera' },
      { label: 'Music', icon: 'musical-notes', route: '/(os)/studio/music-player' },
    ],
  },
  communication: {
    title: 'Communication', subtitle: 'Talk & message', icon: 'call', color: '#10b981',
    tiles: [
      { label: 'Messages', icon: 'chatbubbles', route: '/(os)/messages' },
      { label: 'Phone', icon: 'phone-portrait', route: '/(os)/phone' },
      { label: 'Call', icon: 'call', route: '/(communication)/call' },
    ],
  },
  business: {
    title: 'Business', subtitle: 'Run your enterprise', icon: 'briefcase', color: '#0ea5e9',
    tiles: [
      { label: 'Restaurant', icon: 'restaurant', route: '/(restaurant)' },
      { label: 'Shop', icon: 'storefront', route: '/(commerce)/shop' },
      { label: 'Register Business', icon: 'document-text', route: '/(os)/wallet/business-register' },
      { label: 'Stay (Listings)', icon: 'bed', route: '/(os)/stay' },
    ],
  },
  productivity: {
    title: 'Productivity', subtitle: 'Everyday tools', icon: 'file-tray-full', color: '#6366f1',
    tiles: [
      { label: 'Calendar', icon: 'calendar', route: '/(os)/calendar' },
      { label: 'Clock', icon: 'time', route: '/(os)/clock' },
      { label: 'Calculator', icon: 'calculator', route: '/(os)/calculator' },
      { label: 'Weather', icon: 'partly-sunny', route: '/(utility)/weather' },
    ],
  },
  tribes: {
    title: 'Tribes', subtitle: 'Your communities', icon: 'people', color: '#8b5cf6',
    tiles: [
      { label: 'My Tribes', icon: 'heart', route: '/(tribes)/my-tribes' },
      { label: 'Discovery', icon: 'compass', route: '/(tribes)/discovery' },
      { label: 'Create Tribe', icon: 'add-circle', route: '/(tribes)/create' },
      { label: 'Tribes Home', icon: 'home', route: '/(os)/tribes' },
    ],
  },
  commerce: {
    title: 'Commerce', subtitle: 'Buy & sell on MTAA', icon: 'cart', color: '#f97316',
    tiles: [
      { label: 'Shop', icon: 'storefront', route: '/(commerce)/shop' },
      { label: 'Marketplace', icon: 'bag', route: '/(commerce)/marketplace' },
      { label: 'Search', icon: 'search', route: '/(commerce)/marketplace/search' },
      { label: 'Cart', icon: 'cart', route: '/(commerce)/marketplace/cart' },
    ],
  },
  regulatory: {
    title: 'Regulatory', subtitle: 'Compliance & oversight', icon: 'scale', color: '#334155',
    tiles: [
      { label: 'Regulatory Hub', icon: 'shield', route: '/(os)/regulatory' },
      { label: 'Tax Hub', icon: 'cash', route: '/(os)/wallet/tax-hub' },
      { label: 'Wallet Regulatory', icon: 'document-text', route: '/(os)/wallet/regulatory' },
    ],
  },
  work: {
    title: 'Work', subtitle: 'Jobs & gigs', icon: 'briefcase', color: '#059669',
    tiles: [
      { label: 'Jobs', icon: 'briefcase', route: '/(work)/jobs' },
      { label: 'Freelance', icon: 'laptop', route: '/(work)/jobs/freelance' },
      { label: 'Tasks', icon: 'checkbox', route: '/(work)/tasks' },
    ],
  },
  finance: {
    title: 'Finance', subtitle: 'Money & markets', icon: 'trending-up', color: '#f59e0b',
    tiles: [
      { label: 'Wallet', icon: 'wallet', route: '/(os)/wallet' },
      { label: 'Crypto', icon: 'logo-usd', route: '/(finance)/binance' },
      { label: 'Credit', icon: 'card', route: '/(finance)/credit' },
    ],
  },
  local: {
    title: 'Local', subtitle: 'Around your mtaa', icon: 'locate', color: '#22c55e',
    tiles: [
      { label: 'Streets', icon: 'map', route: '/(os)/streets' },
      { label: 'Market', icon: 'basket', route: '/(commerce)/marketplace' },
      { label: 'Stay', icon: 'bed', route: '/(os)/stay' },
      { label: 'Restaurant', icon: 'restaurant', route: '/(restaurant)' },
    ],
  },
  transport: {
    title: 'Transport', subtitle: 'Move people & goods', icon: 'car', color: '#0ea5e9',
    tiles: [
      { label: 'MTaxi', icon: 'car', route: '/(mtaxi)' },
      { label: 'Boda', icon: 'bicycle', route: '/(mboda)' },
      { label: 'MTruck', icon: 'bus', route: '/(mtruck)' },
      { label: 'Garage', icon: 'construct', route: '/(garage)' },
    ],
  },
  system: {
    title: 'System', subtitle: 'Device & platform', icon: 'settings', color: '#64748b',
    tiles: [
      { label: 'Settings', icon: 'settings', route: '/(os)/settings' },
      { label: 'Developer', icon: 'code-slash', route: '/(os)/developer' },
      { label: 'Network', icon: 'wifi', route: '/(os)/network' },
      { label: 'App Store', icon: 'grid', route: '/(os)/appstore' },
    ],
  },
};
