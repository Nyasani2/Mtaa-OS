// @ts-nocheck
import { makeEduForm } from '@/lib/hubs/EduFormScreen';
export default makeEduForm({'table': 'education_security_incidents', 'title': 'Log Incident', 'accent': '#ef4444', 'icon': 'warning', 'fields': [{'key': 'title', 'label': 'Incident Title', 'required': True}, {'key': 'description', 'label': 'Description', 'type': 'textarea', 'required': True}, {'key': 'severity', 'label': 'Severity', 'placeholder': 'low / medium / high / critical'}, {'key': 'location', 'label': 'Location'}]});
