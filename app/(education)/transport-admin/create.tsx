// @ts-nocheck
import { makeEduForm } from '@/lib/hubs/EduFormScreen';
export default makeEduForm({'table': 'education_transport_requests', 'title': 'New Transport Request', 'accent': '#0ea5e9', 'icon': 'bus', 'fields': [{'key': 'route_name', 'label': 'Route Name', 'required': True}, {'key': 'pickup_point', 'label': 'Pickup Point'}, {'key': 'dropoff_point', 'label': 'Dropoff Point'}, {'key': 'student_count', 'label': 'Student Count', 'type': 'number'}]});
