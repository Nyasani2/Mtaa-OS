// @ts-nocheck
import { makeEduForm } from '@/lib/hubs/EduFormScreen';
export default makeEduForm({"table": "education_submissions", "title": "Submit Assignment", "accent": "#3b82f6", "successMessage": "Assignment submitted for grading.", "fields": [{"key": "assignment_title", "label": "Assignment"}, {"key": "student_name", "label": "Your Name", "required": true}, {"key": "content", "label": "Submission / Answers", "type": "textarea", "required": true}]});
