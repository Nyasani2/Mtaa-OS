// @ts-nocheck
import { makeEduForm } from '@/lib/hubs/EduFormScreen';
export default makeEduForm({"table": "education_budgets", "title": "Create Budget", "accent": "#f59e0b", "fields": [{"key": "title", "label": "Title", "required": true}, {"key": "description", "label": "Description", "type": "textarea"}, {"key": "amount", "label": "Amount", "type": "number", "required": true}, {"key": "fiscal_year", "label": "Fiscal Year"}]});
