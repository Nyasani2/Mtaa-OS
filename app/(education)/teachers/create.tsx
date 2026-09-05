// @ts-nocheck
import { makeEduForm } from '@/lib/hubs/EduFormScreen';
export default makeEduForm({'table': 'education_teachers', 'title': 'Add Teacher', 'accent': '#10b981', 'icon': 'person-add', 'fields': [{'key': 'full_name', 'label': 'Full Name', 'required': True}, {'key': 'subject', 'label': 'Primary Subject', 'required': True}, {'key': 'email', 'label': 'Email'}, {'key': 'phone', 'label': 'Phone'}]});
