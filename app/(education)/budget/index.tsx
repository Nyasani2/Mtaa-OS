// @ts-nocheck
import { makeEduList } from '@/lib/hubs/EduListScreen';
export default makeEduList({'table': 'education_budgets', 'title': 'Budgets', 'subtitle': 'Fiscal plans', 'columns': ['title', 'amount'], 'icon': 'calculator', 'accent': '#f59e0b', 'canCreate': True, 'createRoute': '/education/budget/create'});
