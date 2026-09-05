// @ts-nocheck
import { makeEduForm } from '@/lib/hubs/EduFormScreen';
export default makeEduForm({"table": "education_grades", "title": "Grade Submission", "accent": "#10b981", "successMessage": "Grade submitted.", "fields": [{"key": "assignment_title", "label": "Assignment"}, {"key": "student_name", "label": "Student", "required": true}, {"key": "score", "label": "Score", "type": "number", "required": true}, {"key": "feedback", "label": "Feedback", "type": "textarea"}]});
