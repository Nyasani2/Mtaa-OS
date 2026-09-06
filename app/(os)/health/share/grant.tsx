// @ts-nocheck
import { makeEduForm } from '@/lib/hubs/EduFormScreen';
export default makeEduForm({
  table: 'health_sharing_grants',
  title: 'Grant Data Access',
  subtitle: 'Authorize a facility or provider to view your health data',
  icon: 'share-social',
  accent: '#10b981',
  fields: [
    { name: 'grantee_type', label: 'Grant To', type: 'select', options: ['facility', 'user'], required: true },
    { name: 'grantee_id', label: 'Facility/User ID', type: 'text', required: true },
    { name: 'data_scope', label: 'Data Scope (comma separated)', type: 'text', placeholder: 'vitals, prescriptions, lab_results', required: true },
    { name: 'expires_at', label: 'Expires At', type: 'datetime', required: false }
  ],
  successMessage: 'Data access granted successfully',
  redirectRoute: '/(os)/health'
});
