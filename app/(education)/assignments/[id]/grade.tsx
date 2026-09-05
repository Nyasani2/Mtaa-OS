// @ts-nocheck
import { makeEduForm } from '@/lib/hubs/EduFormScreen';
export default makeEduForm({'table': 'education_grades', 'title': 'Grade Submission', 'accent': '#10b981', 'icon': 'create', 'successMessage': 'Grade submitted.', 'fields': [{'key': 'assignment_title', 'label': 'Assignment', 'placeholder': 'Title'}, {'key': 'student_name', 'label': 'Student', 'required': True}, {'key': 'score', 'label': 'Score', 'type': 'number', 'required': True}, {'key': 'feedback', 'label': 'Feedback', 'type': 'textarea'}]});
