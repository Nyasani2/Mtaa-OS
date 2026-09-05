// @ts-nocheck
import { makeEduForm } from '@/lib/hubs/EduFormScreen';
export default makeEduForm({'table': 'studio_drafts', 'title': 'New Draft', 'icon': 'add-circle', 'accent': '#f59e0b', 'userIdField': 'creator_id', 'successMessage': 'Draft saved.', 'fields': [{'key': 'title', 'label': 'Title', 'required': True}, {'key': 'body', 'label': 'Body', 'type': 'textarea'}, {'key': 'content_type', 'label': 'Type', 'placeholder': 'video / audio / article'}]});
