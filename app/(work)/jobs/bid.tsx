// @ts-nocheck
import { makeEduForm } from '@/lib/hubs/EduFormScreen';
export default makeEduForm({"table": "jobs_bids", "title": "Place Bid", "icon": "cash", "accent": "#10b981", "userIdField": "bidder_id", "successMessage": "Bid submitted.", "fields": [{"key": "job_title", "label": "Job", "required": true}, {"key": "amount", "label": "Bid Amount (KES)", "type": "number", "required": true}, {"key": "proposal", "label": "Proposal", "type": "textarea"}]});
