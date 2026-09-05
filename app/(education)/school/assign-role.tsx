// @ts-nocheck
import { makeEduForm } from '@/lib/hubs/EduFormScreen';
export default makeEduForm({'table': 'education_school_staff', 'title': 'Assign Role', 'accent': '#6366f1', 'icon': 'people', 'fields': [{'key': 'name', 'label': 'Name', 'required': True}, {'key': 'role', 'label': 'Role', 'placeholder': 'teacher / admin / staff', 'required': True}, {'key': 'email', 'label': 'Email'}]});
