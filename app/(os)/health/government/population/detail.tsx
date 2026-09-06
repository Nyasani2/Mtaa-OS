// @ts-nocheck
import { makeEduList } from '@/lib/hubs/EduListScreen';
export default makeEduList({
  table: 'health_population_records',
  title: 'Population Records',
  subtitle: 'Community health demographics',
  icon: 'people',
  accent: '#0ea5e9',
  columns: ['region', 'demographic_group', 'count'],
  orderBy: 'created_at',
  orderAsc: false,
  emptyText: 'No population records found. Add one to get started.'
});
