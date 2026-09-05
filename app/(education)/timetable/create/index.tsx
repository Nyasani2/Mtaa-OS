// @ts-nocheck
import { makeEduForm } from '@/lib/hubs/EduFormScreen';
export default makeEduForm({'table': 'education_timetables', 'title': 'New Timetable Entry', 'accent': '#f59e0b', 'icon': 'time', 'fields': [{'key': 'subject', 'label': 'Subject', 'required': True}, {'key': 'teacher', 'label': 'Teacher', 'required': True}, {'key': 'day_of_week', 'label': 'Day', 'placeholder': 'Monday'}, {'key': 'start_time', 'label': 'Start', 'placeholder': '08:00'}, {'key': 'end_time', 'label': 'End', 'placeholder': '09:00'}]});
