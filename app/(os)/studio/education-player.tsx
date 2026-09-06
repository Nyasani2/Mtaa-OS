// @ts-nocheck
import { makeEduList } from '@/lib/hubs/EduListScreen';
export default makeEduList({
  table: 'studio_tracks', title: 'Education Player', subtitle: 'Learning content',
  icon: 'school', accent: '#3b82f6', columns: ['title', 'duration_seconds'],
  filters: { track_type: 'education' },
  emptyText: 'No educational content available.'
});
