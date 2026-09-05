// @ts-nocheck
import { makeEduForm } from '@/lib/hubs/EduFormScreen';
export default makeEduForm({"table": "studio_tracks", "title": "Upload Education", "icon": "school", "accent": "#0ea5e9", "userIdField": "creator_id", "successMessage": "Lesson uploaded.", "fields": [{"key": "title", "label": "Lesson Title", "required": true}, {"key": "artist", "label": "Instructor"}, {"key": "genre", "label": "Subject"}, {"key": "audio_url", "label": "Audio URL"}]});
