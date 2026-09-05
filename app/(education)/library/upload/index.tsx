// @ts-nocheck
import { makeEduForm } from '@/lib/hubs/EduFormScreen';
export default makeEduForm({'table': 'education_library_items', 'title': 'Upload Resource', 'accent': '#6366f1', 'icon': 'cloud-upload', 'successMessage': 'Resource uploaded.', 'fields': [{'key': 'title', 'label': 'Title', 'required': True}, {'key': 'description', 'label': 'Description', 'type': 'textarea'}, {'key': 'resource_type', 'label': 'Type', 'placeholder': 'book / video / audio'}, {'key': 'url', 'label': 'Resource URL'}]});
