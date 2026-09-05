// @ts-nocheck
import { makeEduForm } from '@/lib/hubs/EduFormScreen';
export default makeEduForm({'table': 'education_payroll', 'title': 'New Payroll Entry', 'accent': '#22c55e', 'icon': 'people', 'fields': [{'key': 'staff_name', 'label': 'Staff Name', 'required': True}, {'key': 'role', 'label': 'Role', 'placeholder': 'Teacher / Admin'}, {'key': 'amount', 'label': 'Net Pay (KES)', 'type': 'number', 'required': True}, {'key': 'period', 'label': 'Period', 'placeholder': 'e.g. September 2026'}]});
