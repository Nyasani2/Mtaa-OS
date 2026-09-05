// @ts-nocheck
import { makeEduList } from '@/lib/hubs/EduListScreen';
export default makeEduList({'table': 'studio_broadcasts', 'title': 'Broadcast Console', 'subtitle': 'Active & scheduled', 'columns': ['title', 'status'], 'icon': 'tv', 'accent': '#ef4444', 'canCreate': True, 'createRoute': '/os/studio/live-stream'});
