// @ts-nocheck
import { makeEduForm } from '@/lib/hubs/EduFormScreen';
export default makeEduForm({"table": "education_expenses", "title": "Log Expense", "accent": "#10b981", "fields": [{"key": "title", "label": "Title", "required": true}, {"key": "amount", "label": "Amount (KES)", "type": "number", "required": true}, {"key": "category", "label": "Category"}, {"key": "notes", "label": "Notes", "type": "textarea"}]});
