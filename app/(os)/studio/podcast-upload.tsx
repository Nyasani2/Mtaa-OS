// @ts-nocheck
import { makeEduForm } from '@/lib/hubs/EduFormScreen';
export default makeEduForm({'table': 'studio_tracks', 'title': 'Upload Podcast', 'icon': 'mic', 'accent': '#ec4899', 'userIdField': 'creator_id', 'successMessage': 'Podcast uploaded.', 'fields': [{'key': 'title', 'label': 'Episode Title', 'required': True}, {'key': 'artist', 'label': 'Show Name', 'required': True}, {'key': 'genre', 'label': 'Category'}, {'key': 'audio_url', 'label': 'Audio URL'}]});
