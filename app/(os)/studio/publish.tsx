// @ts-nocheck
import { makeEduForm } from '@/lib/hubs/EduFormScreen';
export default makeEduForm({"table": "studio_tracks", "title": "Publish Track", "icon": "paper-plane", "accent": "#10b981", "userIdField": "creator_id", "successMessage": "Track published.", "fields": [{"key": "title", "label": "Title", "required": true}, {"key": "artist", "label": "Artist", "required": true}, {"key": "audio_url", "label": "Audio URL"}]});
