// @ts-nocheck
import { makeEduForm } from '@/lib/hubs/EduFormScreen';
export default makeEduForm({'table': 'education_teacher_invitations', 'title': 'Invite Teacher', 'accent': '#3b82f6', 'icon': 'mail', 'successMessage': 'Invitation sent.', 'fields': [{'key': 'email', 'label': 'Email', 'required': True}, {'key': 'name', 'label': 'Name'}, {'key': 'message', 'label': 'Message', 'type': 'textarea'}]});
