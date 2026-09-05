// @ts-nocheck
import { makeEduForm } from '@/lib/hubs/EduFormScreen';
export default makeEduForm({'table': 'education_participants', 'title': 'Register Parent', 'accent': '#ec4899', 'icon': 'person-add', 'successMessage': 'Parent registered.', 'fields': [{'key': 'name', 'label': 'Full Name', 'required': True}, {'key': 'phone', 'label': 'Phone', 'required': True}, {'key': 'email', 'label': 'Email'}]});
