// @ts-nocheck
import { makeEduForm } from '@/lib/hubs/EduFormScreen';
export default makeEduForm({'table': 'education_feed_posts', 'title': 'New Post', 'accent': '#3b82f6', 'icon': 'chatbubbles', 'userIdField': 'author_id', 'fields': [{'key': 'title', 'label': 'Title', 'placeholder': 'Announcement title', 'required': True}, {'key': 'body', 'label': 'Body', 'type': 'textarea', 'required': True}, {'key': 'audience', 'label': 'Audience', 'placeholder': 'e.g. parents, teachers, all'}]});
