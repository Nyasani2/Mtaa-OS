export const tribesManifest = {
  id: 'tribes',
  name: 'Tribes',
  version: '1.0.0',
  description: 'Community engine for ethnic groups, interests, and heritage',
  icon: 'users',
  category: 'social',
  route: '/tribes',
  color: '#e94560',
  permissions: ['tribes.read', 'tribes.write', 'tribes.admin'],
  features: [
    'tribe_directory',
    'tribe_feed',
    'tribe_chat',
    'tribe_events',
    'heritage_archive',
    'ai_populated_content'
  ],
  tables: [
    'tribes',
    'tribe_members',
    'tribe_posts',
    'tribe_post_likes',
    'tribe_comments',
    'tribe_events',
    'tribe_event_attendees',
    'tribe_messages',
    'tribe_ai_content'
  ],
  edgeFunctions: [
    'tribe-search',
    'tribe-ai-populate',
    'tribe-moderation'
  ],
  asisIntegration: {
    contentValidation: 'asis.validateContent',
    aiGeneration: 'asis.generateTribeContent',
    moderation: 'asis.scanMessage',
    recommendations: 'asis.recommendTribes',
    searchEnrichment: 'asis.enrichSearch'
  }
};
