// @ts-nocheck
import { makeEduForm } from '@/lib/hubs/EduFormScreen';
export default makeEduForm({"table": "studio_broadcasts", "title": "Start Live Stream", "icon": "radio", "accent": "#ef4444", "userIdField": "broadcaster_id", "successMessage": "Broadcast scheduled.", "fields": [{"key": "title", "label": "Stream Title", "required": true}, {"key": "description", "label": "Description", "type": "textarea"}, {"key": "scheduled_at", "label": "Scheduled At"}]});
