// @ts-nocheck
import { makeEduList } from '@/lib/hubs/EduListScreen';
export default makeEduList({'table': 'education_enrollments', 'title': 'Enrollments', 'subtitle': 'Student registrations', 'columns': ['student_name', 'grade'], 'icon': 'people', 'accent': '#8b5cf6', 'canCreate': True, 'createRoute': '/education/enrollments/create'});
