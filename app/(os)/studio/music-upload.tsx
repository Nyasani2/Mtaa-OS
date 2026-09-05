// @ts-nocheck
import { makeEduForm } from '@/lib/hubs/EduFormScreen';
export default makeEduForm({'table': 'studio_tracks', 'title': 'Upload Music', 'icon': 'musical-notes', 'accent': '#8b5cf6', 'userIdField': 'creator_id', 'successMessage': 'Track uploaded.', 'fields': [{'key': 'title', 'label': 'Title', 'required': True}, {'key': 'artist', 'label': 'Artist', 'required': True}, {'key': 'genre', 'label': 'Genre'}, {'key': 'audio_url', 'label': 'Audio URL'}, {'key': 'cover_url', 'label': 'Cover URL'}]});
