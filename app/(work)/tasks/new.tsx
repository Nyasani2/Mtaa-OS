// @ts-nocheck
import { makeEduForm } from '@/lib/hubs/EduFormScreen';
export default makeEduForm({"table": "work_tasks", "title": "New Task", "icon": "add-circle", "accent": "#0ea5e9", "userIdField": "user_id", "successMessage": "Task added.", "fields": [{"key": "title", "label": "Title", "required": true}, {"key": "description", "label": "Description", "type": "textarea"}, {"key": "due_date", "label": "Due Date"}, {"key": "priority", "label": "Priority"}]});
