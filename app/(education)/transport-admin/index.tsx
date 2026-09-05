// @ts-nocheck
import { makeEduList } from '@/lib/hubs/EduListScreen';
export default makeEduList({'table': 'education_transport_requests', 'title': 'Transport', 'subtitle': 'Bus & route requests', 'columns': ['route_name', 'status'], 'icon': 'bus', 'accent': '#0ea5e9', 'canCreate': True, 'createRoute': '/education/transport-admin/create'});
