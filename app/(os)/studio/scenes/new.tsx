// @ts-nocheck
import { makeEduForm } from '@/lib/hubs/EduFormScreen';
export default makeEduForm({'table': 'studio_scenes', 'title': 'New Scene', 'icon': 'add-circle', 'accent': '#8b5cf6', 'userIdField': 'creator_id', 'successMessage': 'Scene saved.', 'fields': [{'key': 'name', 'label': 'Scene Name', 'required': True}, {'key': 'layout', 'label': 'Layout', 'placeholder': 'single / split / grid'}]});
