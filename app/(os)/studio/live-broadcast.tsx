// @ts-nocheck
import { makeEduForm } from '@/lib/hubs/EduFormScreen';
export default makeEduForm({'table': 'studio_broadcasts', 'title': 'Go Live', 'icon': 'radio', 'accent': '#ef4444', 'userIdField': 'broadcaster_id', 'successMessage': 'Broadcast started.', 'fields': [{'key': 'title', 'label': 'Broadcast Title', 'required': True}, {'key': 'description', 'label': 'Description', 'type': 'textarea'}]});
