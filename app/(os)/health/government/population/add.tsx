// @ts-nocheck
import { makeEduForm } from '@/lib/hubs/EduFormScreen';
export default makeEduForm({"table": "health_population_records", "title": "Add Population Record", "icon": "people", "accent": "#334155", "userIdField": "recorded_by", "successMessage": "Record saved.", "fields": [{"key": "region", "label": "Region", "required": true}, {"key": "population_count", "label": "Population", "type": "number", "required": true}, {"key": "notes", "label": "Notes", "type": "textarea"}]});
