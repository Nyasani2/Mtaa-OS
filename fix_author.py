import os

file_path = 'app/(os)/health/doctor/index.tsx'

if not os.path.exists(file_path):
    print("File not found!")
    exit(1)

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add resolveStaff helper
helper = """
const resolveStaff = async () => {
  const { data: staff, error } = await supabase
    .from('health_staff')
    .select('id, facility_id, full_name')
    .eq('user_id', user.id)
    .single();
  if (error || !staff) throw new Error('Staff profile not found.');
  return staff;
};

const completeConsultation = async () => {"""

content = content.replace('const completeConsultation = async () => {', helper)

# 2. Inject staff resolution at the start of the try block
old_try = "setSaving(true);\n    try {\n      const appointmentId = selectedAppointment.id;"
new_try = "setSaving(true);\n    try {\n      const staff = await resolveStaff();\n      const doctorId = staff.id;\n      const facilityId = staff.facility_id;\n      const appointmentId = selectedAppointment.id;"
content = content.replace(old_try, new_try)

# 3. Replace user.id with the resolved staff.id
content = content.replace('doctor_id: user.id,', 'doctor_id: doctorId,')
content = content.replace('ordered_by: user.id,', 'ordered_by: doctorId,')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Author Resolution applied successfully!")
