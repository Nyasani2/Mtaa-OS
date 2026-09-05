// @ts-nocheck
import { makeEduForm } from '@/lib/hubs/EduFormScreen';
export default makeEduForm({'table': 'education_reports', 'title': 'New Report', 'accent': '#6366f1', 'icon': 'document-text', 'fields': [{'key': 'title', 'label': 'Report Title', 'required': True}, {'key': 'body', 'label': 'Body', 'type': 'textarea'}, {'key': 'period', 'label': 'Reporting Period', 'placeholder': 'e.g. Q3 2026'}]});
