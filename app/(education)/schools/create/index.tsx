// @ts-nocheck
import { makeEduForm } from '@/lib/hubs/EduFormScreen';
export default makeEduForm({'table': 'education_schools', 'title': 'Create School', 'accent': '#10b981', 'icon': 'add-circle', 'successMessage': 'School created.', 'fields': [{'key': 'name', 'label': 'School Name', 'required': True}, {'key': 'type', 'label': 'Type', 'placeholder': 'primary / secondary'}, {'key': 'address', 'label': 'Address'}]});
