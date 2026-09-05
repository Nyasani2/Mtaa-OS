// @ts-nocheck
import { makeEduForm } from '@/lib/hubs/EduFormScreen';
export default makeEduForm({'table': 'education_submissions', 'title': 'Submit Assignment', 'accent': '#3b82f6', 'icon': 'cloud-upload', 'successMessage': 'Assignment submitted for grading.', 'fields': [{'key': 'assignment_title', 'label': 'Assignment', 'placeholder': 'Title'}, {'key': 'student_name', 'label': 'Your Name', 'required': True}, {'key': 'content', 'label': 'Submission / Answers', 'type': 'textarea', 'required': True}, {'key': 'attachments_note', 'label': 'Attachments Note'}]});
