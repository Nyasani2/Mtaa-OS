// @ts-nocheck
import { makeEduForm } from '@/lib/hubs/EduFormScreen';
export default makeEduForm({"table": "education_quiz_submissions", "title": "Take Quiz", "accent": "#8b5cf6", "successMessage": "Quiz submitted.", "fields": [{"key": "quiz_title", "label": "Quiz"}, {"key": "student_name", "label": "Your Name", "required": true}, {"key": "answers", "label": "Answers", "type": "textarea", "required": true}]});
