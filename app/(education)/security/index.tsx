// @ts-nocheck
import { makeEduList } from '@/lib/hubs/EduListScreen';
export default makeEduList({'table': 'education_security_incidents', 'title': 'Security', 'subtitle': 'Incidents & logs', 'columns': ['title', 'severity'], 'icon': 'shield', 'accent': '#ef4444', 'canCreate': True, 'createRoute': '/education/security/create'});
