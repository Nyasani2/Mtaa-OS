// @ts-nocheck
import { makeEduForm } from '@/lib/hubs/EduFormScreen';
export default makeEduForm({"table": "jobs_disputes", "title": "Raise Dispute", "icon": "warning", "accent": "#ef4444", "userIdField": "raised_by", "successMessage": "Dispute filed.", "fields": [{"key": "job_title", "label": "Job", "required": true}, {"key": "reason", "label": "Reason", "required": true}, {"key": "description", "label": "Details", "type": "textarea"}]});
