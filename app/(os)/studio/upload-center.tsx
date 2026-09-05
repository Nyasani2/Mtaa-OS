// @ts-nocheck
import { makeEduForm } from '@/lib/hubs/EduFormScreen';
export default makeEduForm({"table": "studio_tracks", "title": "Upload Center", "icon": "cloud-upload", "accent": "#0ea5e9", "userIdField": "creator_id", "successMessage": "Content uploaded.", "fields": [{"key": "title", "label": "Title", "required": true}, {"key": "artist", "label": "Creator", "required": true}, {"key": "genre", "label": "Genre"}, {"key": "audio_url", "label": "Media URL"}, {"key": "duration_seconds", "label": "Duration (sec)", "type": "number"}]});
