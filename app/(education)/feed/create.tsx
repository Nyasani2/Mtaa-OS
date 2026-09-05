// @ts-nocheck
import { makeEduForm } from '@/lib/hubs/EduFormScreen';
export default makeEduForm({"table": "education_feed_posts", "title": "New Post", "accent": "#3b82f6", "userIdField": "author_id", "fields": [{"key": "title", "label": "Title", "required": true}, {"key": "body", "label": "Body", "type": "textarea", "required": true}, {"key": "audience", "label": "Audience"}]});
