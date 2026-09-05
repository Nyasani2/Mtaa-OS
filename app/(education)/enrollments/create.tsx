// @ts-nocheck
import { makeEduForm } from '@/lib/hubs/EduFormScreen';
export default makeEduForm({'table': 'education_enrollments', 'title': 'New Enrollment', 'accent': '#8b5cf6', 'icon': 'person-add', 'fields': [{'key': 'student_name', 'label': 'Student Name', 'placeholder': 'Full name', 'required': True}, {'key': 'grade', 'label': 'Grade / Class', 'placeholder': 'e.g. Form 2', 'required': True}, {'key': 'parent_name', 'label': 'Parent / Guardian', 'placeholder': 'Name'}, {'key': 'parent_phone', 'label': 'Parent Phone', 'placeholder': '+254 700 000 000'}]});
