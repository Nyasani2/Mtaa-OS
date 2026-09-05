// @ts-nocheck
import { makeEduForm } from '@/lib/hubs/EduFormScreen';
export default makeEduForm({"table": "education_messages", "title": "New Message", "accent": "#3b82f6", "userIdField": "sender_id", "successMessage": "Message sent.", "fields": [{"key": "recipient", "label": "To", "required": true}, {"key": "subject", "label": "Subject"}, {"key": "body", "label": "Message", "type": "textarea", "required": true}]});
