// @ts-nocheck
import { makeEduForm } from '@/lib/hubs/EduFormScreen';
export default makeEduForm({'table': 'education_teachers', 'title': 'Register Teacher', 'accent': '#10b981', 'icon': 'person-add', 'successMessage': 'Teacher registered.', 'fields': [{'key': 'full_name', 'label': 'Full Name', 'required': True}, {'key': 'subject', 'label': 'Subject', 'required': True}, {'key': 'phone', 'label': 'Phone'}]});
