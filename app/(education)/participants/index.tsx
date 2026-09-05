// @ts-nocheck
import { makeEduList } from '@/lib/hubs/EduListScreen';
export default makeEduList({'table': 'education_participants', 'title': 'Participants', 'subtitle': 'People in program', 'columns': ['name', 'role'], 'icon': 'people', 'accent': '#0ea5e9', 'canCreate': True, 'createRoute': '/education/participants/create'});
