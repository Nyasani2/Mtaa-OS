// @ts-nocheck
import { makeEduList } from '@/lib/hubs/EduListScreen';
export default makeEduList({
  table: 'studio_tracks', title: 'Content Library', subtitle: 'Your uploaded media',
  icon: 'videocam', accent: '#8b5cf6', columns: ['title', 'track_type', 'status'],
  emptyText: 'No content yet. Head to Studio to upload.'
});
