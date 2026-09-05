// @ts-nocheck
import { makeEduForm } from '@/lib/hubs/EduFormScreen';
export default makeEduForm({"table": "education_emergency_cases", "title": "Emergency Roll-Call", "accent": "#ef4444", "successMessage": "Roll-call logged.", "fields": [{"key": "title", "label": "Incident", "required": true}, {"key": "headcount", "label": "Headcount", "type": "number", "required": true}, {"key": "notes", "label": "Notes", "type": "textarea"}]});
