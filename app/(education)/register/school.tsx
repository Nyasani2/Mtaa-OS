// @ts-nocheck
import { makeEduForm } from '@/lib/hubs/EduFormScreen';
export default makeEduForm({'table': 'education_schools', 'title': 'Register School', 'accent': '#10b981', 'icon': 'school', 'successMessage': 'School registered.', 'fields': [{'key': 'name', 'label': 'School Name', 'required': True}, {'key': 'type', 'label': 'Type', 'placeholder': 'primary / secondary / university'}, {'key': 'address', 'label': 'Address'}, {'key': 'phone', 'label': 'Phone'}]});
