// @ts-nocheck
import { makeEduForm } from '@/lib/hubs/EduFormScreen';
export default makeEduForm({'table': 'education_budgets', 'title': 'Create Budget', 'accent': '#f59e0b', 'icon': 'calculator', 'fields': [{'key': 'title', 'label': 'Title', 'placeholder': 'e.g. 2026 Operating Budget', 'required': True}, {'key': 'description', 'label': 'Description', 'placeholder': 'Purpose of this budget', 'type': 'textarea'}, {'key': 'amount', 'label': 'Amount', 'placeholder': '0', 'type': 'number', 'required': True}, {'key': 'fiscal_year', 'label': 'Fiscal Year', 'placeholder': '2026'}]});
