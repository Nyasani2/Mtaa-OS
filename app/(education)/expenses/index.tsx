// @ts-nocheck
import { makeEduList } from '@/lib/hubs/EduListScreen';
export default makeEduList({'table': 'education_expenses', 'title': 'Expenses', 'subtitle': 'Spending log', 'columns': ['title', 'amount'], 'icon': 'cash', 'accent': '#10b981', 'canCreate': True, 'createRoute': '/education/expenses/create'});
