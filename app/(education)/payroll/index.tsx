// @ts-nocheck
import { makeEduList } from '@/lib/hubs/EduListScreen';
export default makeEduList({'table': 'education_payroll', 'title': 'Payroll', 'subtitle': 'Staff compensation', 'columns': ['staff_name', 'amount'], 'icon': 'people', 'accent': '#22c55e', 'canCreate': True, 'createRoute': '/education/payroll/create'});
