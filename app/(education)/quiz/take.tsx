// @ts-nocheck
import { makeEduForm } from '@/lib/hubs/EduFormScreen';
export default makeEduForm({'table': 'education_quiz_submissions', 'title': 'Take Quiz', 'accent': '#8b5cf6', 'icon': 'help-circle', 'successMessage': 'Quiz submitted.', 'fields': [{'key': 'quiz_title', 'label': 'Quiz', 'placeholder': 'Title'}, {'key': 'student_name', 'label': 'Your Name', 'required': True}, {'key': 'answers', 'label': 'Answers', 'type': 'textarea', 'required': True}]});
