// Role-based workstation definitions. Routes map to EXISTING screens only.
export interface WsTile { label: string; icon: string; route: string; }
export interface WsDef { title: string; icon: string; color: string; tiles: WsTile[]; }

export const WORKSTATIONS: Record<string, WsDef> = {
  patient: {
    title: 'My Health', icon: 'heart', color: '#0ea5e9',
    tiles: [
      { label: 'Find Care', icon: 'search', route: '/health/find-care' },
      { label: 'Appointments', icon: 'calendar', route: '/health/appointments' },
      { label: 'My Records', icon: 'document-text', route: '/health/records' },
      { label: 'Medications', icon: 'medkit', route: '/health/medications' },
      { label: 'Telemedicine', icon: 'videocam', route: '/health/telemedicine' },
      { label: 'Emergency', icon: 'warning', route: '/health/emergency' },
      { label: 'Insurance', icon: 'shield-checkmark', route: '/health/insurance' },
      { label: 'Health Wallet', icon: 'wallet', route: '/health/wallet' },
    ],
  },
  doctor: {
    title: 'Doctor Workstation', icon: 'medical', color: '#8b5cf6',
    tiles: [
      { label: 'Appointments', icon: 'calendar', route: '/health/appointments' },
      { label: 'My Patients', icon: 'people', route: '/health/doctor' },
      { label: 'Admit Patient', icon: 'bed', route: '/health/doctor/admit' },
      { label: 'Prescribe', icon: 'create', route: '/health/doctor/prescribe' },
      { label: 'Lab Orders', icon: 'flask', route: '/health/doctor/lab-orders' },
      { label: 'Clinical Notes', icon: 'document-text', route: '/health/doctor/notes' },
      { label: 'Follow-ups', icon: 'refresh', route: '/health/doctor/follow-ups' },
      { label: 'Telemedicine', icon: 'videocam', route: '/health/telemedicine' },
    ],
  },
  nurse: {
    title: 'Nurse Workstation', icon: 'heart', color: '#ec4899',
    tiles: [
      { label: 'Dashboard', icon: 'grid', route: '/health/nurse' },
      { label: 'Vitals', icon: 'pulse', route: '/health/nurse/vitals' },
      { label: 'Med Administration', icon: 'medkit', route: '/health/nurse/meds' },
      { label: 'Handover', icon: 'swap-horizontal', route: '/health/nurse/handover' },
    ],
  },
  pharmacist: {
    title: 'Pharmacy Workstation', icon: 'cube', color: '#10b981',
    tiles: [
      { label: 'Dispense Queue', icon: 'list', route: '/health/pharmacy/queue' },
      { label: 'Dispense', icon: 'checkmark-circle', route: '/health/pharmacy/dispense' },
      { label: 'Inventory', icon: 'file-tray', route: '/health/pharmacy/inventory' },
      { label: 'Interactions', icon: 'alert', route: '/health/pharmacy/interactions' },
      { label: 'Pharmacy POS', icon: 'card', route: '/health/pharmacy/pos' },
    ],
  },
  lab_technician: {
    title: 'Lab Workstation', icon: 'flask', color: '#f59e0b',
    tiles: [
      { label: 'Sample Queue', icon: 'list', route: '/health/lab/queue' },
      { label: 'Samples', icon: 'albums', route: '/health/lab/samples' },
      { label: 'Results', icon: 'document-text', route: '/health/lab/results' },
      { label: 'Critical Values', icon: 'warning', route: '/health/lab/critical' },
    ],
  },
  cashier: {
    title: 'Cashier Workstation', icon: 'cash', color: '#22c55e',
    tiles: [
      { label: 'New Payment', icon: 'add-circle', route: '/health/cashier/payments/new' },
      { label: 'Invoices', icon: 'receipt', route: '/health/cashier/invoices' },
      { label: 'Insurance Claims', icon: 'shield', route: '/health/cashier/insurance' },
    ],
  },
  hospital_admin: {
    title: 'Admin Workstation', icon: 'business', color: '#0f172a',
    tiles: [
      { label: 'Beds', icon: 'bed', route: '/health/hospital-admin/beds' },
      { label: 'Admissions', icon: 'log-in', route: '/health/hospital-admin/admissions' },
      { label: 'Discharges', icon: 'log-out', route: '/health/hospital-admin/discharges' },
      { label: 'Staff', icon: 'people', route: '/health/hospital-admin/staff' },
      { label: 'Appointments', icon: 'calendar', route: '/health/hospital-admin/appointments' },
      { label: 'Inventory', icon: 'file-tray', route: '/health/hospital-admin/inventory' },
      { label: 'Facility POS', icon: 'card', route: '/health/hospital-admin/pos' },
      { label: 'Facility Wallet', icon: 'wallet', route: '/health/hospital-admin/wallet' },
    ],
  },
  ambulance_driver: {
    title: 'Ambulance Workstation', icon: 'car', color: '#ef4444',
    tiles: [
      { label: 'Dispatch', icon: 'navigate', route: '/health/ambulance/dispatch' },
      { label: 'Handover', icon: 'swap-horizontal', route: '/health/ambulance/handover' },
      { label: 'My Vehicle', icon: 'car', route: '/health/ambulance' },
    ],
  },
  government_officer: {
    title: 'Government Workstation', icon: 'shield', color: '#334155',
    tiles: [
      { label: 'Verify Facilities', icon: 'checkmark-done', route: '/health/government/verify-facilities' },
      { label: 'Surveillance', icon: 'eye', route: '/health/government/surveillance' },
      { label: 'Population Health', icon: 'people', route: '/health/government' },
    ],
  },
  herbalist: {
    title: 'Herbalist Workstation', icon: 'leaf', color: '#65a30d',
    tiles: [
      { label: 'Remedies', icon: 'leaf', route: '/health/traditional-healer/remedies' },
      { label: 'Herbal Pharmacy', icon: 'flower', route: '/health/herbal-pharmacy' },
    ],
  },
};
