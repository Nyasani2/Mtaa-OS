// @ts-nocheck
import { makeEduForm } from '@/lib/hubs/EduFormScreen';
export default makeEduForm({'table': 'education_emergency_cases', 'title': 'Emergency Roll-Call', 'accent': '#ef4444', 'icon': 'warning', 'successMessage': 'Roll-call logged.', 'fields': [{'key': 'title', 'label': 'Incident', 'required': True}, {'key': 'headcount', 'label': 'Headcount', 'type': 'number', 'required': True}, {'key': 'notes', 'label': 'Notes', 'type': 'textarea'}]});
