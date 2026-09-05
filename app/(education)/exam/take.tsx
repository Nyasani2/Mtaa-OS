// @ts-nocheck
import { makeEduForm } from '@/lib/hubs/EduFormScreen';
export default makeEduForm({"table": "education_exam_submissions", "title": "Take Exam", "accent": "#ef4444", "successMessage": "Exam submitted for grading.", "fields": [{"key": "exam_title", "label": "Exam"}, {"key": "student_name", "label": "Your Name", "required": true}, {"key": "answers", "label": "Answers", "type": "textarea", "required": true}]});
