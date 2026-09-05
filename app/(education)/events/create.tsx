// @ts-nocheck
import { makeEduForm } from '@/lib/hubs/EduFormScreen';
export default makeEduForm({'table': 'education_events', 'title': 'New Event', 'accent': '#ec4899', 'icon': 'calendar', 'fields': [{'key': 'title', 'label': 'Event Title', 'placeholder': 'e.g. Sports Day 2026', 'required': True}, {'key': 'description', 'label': 'Description', 'type': 'textarea'}, {'key': 'date', 'label': 'Date', 'placeholder': 'YYYY-MM-DD', 'required': True}, {'key': 'location', 'label': 'Location', 'placeholder': 'Main field'}]});
