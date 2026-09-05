// @ts-nocheck
import { makeEduForm } from '@/lib/hubs/EduFormScreen';
export default makeEduForm({'table': 'education_enrollments', 'title': 'Register Student', 'accent': '#8b5cf6', 'icon': 'person-add', 'successMessage': 'Student registered.', 'fields': [{'key': 'student_name', 'label': 'Student Name', 'required': True}, {'key': 'grade', 'label': 'Grade', 'required': True}, {'key': 'parent_phone', 'label': 'Parent Phone'}]});
