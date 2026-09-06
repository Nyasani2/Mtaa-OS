// @ts-nocheck
import { makeEduForm } from '@/lib/hubs/EduFormScreen';
export default makeEduForm({
  table: 'health_population_records',
  title: 'Add Population Record',
  subtitle: 'Record community health demographics',
  icon: 'people',
  accent: '#0ea5e9',
  fields: [
    { name: 'region', label: 'Region/County', type: 'text', required: true },
    { name: 'demographic_group', label: 'Demographic Group', type: 'text', required: true },
    { name: 'count', label: 'Estimated Count', type: 'number', required: true },
    { name: 'notes', label: 'Notes', type: 'textarea', required: false }
  ],
  successMessage: 'Population record saved successfully',
  redirectRoute: '/(os)/health/government'
});
