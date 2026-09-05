// @ts-nocheck
import { makeEduForm } from '@/lib/hubs/EduFormScreen';
export default makeEduForm({'table': 'education_expenses', 'title': 'Log Expense', 'accent': '#10b981', 'icon': 'cash', 'fields': [{'key': 'title', 'label': 'Expense Title', 'placeholder': 'e.g. Chalk & markers', 'required': True}, {'key': 'amount', 'label': 'Amount (KES)', 'type': 'number', 'required': True}, {'key': 'category', 'label': 'Category', 'placeholder': 'e.g. Supplies'}, {'key': 'notes', 'label': 'Notes', 'type': 'textarea'}]});
