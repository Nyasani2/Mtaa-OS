// @ts-nocheck
import { makeEduForm } from '@/lib/hubs/EduFormScreen';
export default makeEduForm({"table": "health_sharing_grants", "title": "Grant Record Access", "icon": "share-social", "accent": "#8b5cf6", "successMessage": "Access granted.", "fields": [{"key": "grantee_name", "label": "Grant To", "required": true}, {"key": "record_type", "label": "Record Type", "required": true}, {"key": "duration_days", "label": "Duration (days)", "type": "number"}, {"key": "reason", "label": "Reason", "type": "textarea"}]});
