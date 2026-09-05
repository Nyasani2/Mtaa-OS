// @ts-nocheck
import { makeEduForm } from '@/lib/hubs/EduFormScreen';
export default makeEduForm({"table": "jobs_settings", "title": "Work Settings", "icon": "settings", "accent": "#64748b", "userIdField": "user_id", "successMessage": "Settings saved.", "fields": [{"key": "headline", "label": "Headline", "required": true}, {"key": "availability", "label": "Availability"}, {"key": "hourly_rate", "label": "Hourly Rate (KES)", "type": "number"}]});
