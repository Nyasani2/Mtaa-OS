import os

print("🚀 Starting MTAA Health Fixes...")

# 1. Doctor Workspace
doc_file = 'app/(os)/health/doctor/index.tsx'
if os.path.exists(doc_file):
    with open(doc_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Fix ordered_by FK issue
    content = content.replace('ordered_by: user.id, // CRITICAL: Required by your schema (NOT NULL)\n    ', '')
    content = content.replace('ordered_by: user.id,\n    ', '')
    content = content.replace('ordered_by: doctorId,\n    ', '')
    
    # Fix priority casing
    content = content.replace("priority: item.priority,", "priority: (item.priority || 'normal').toLowerCase(),")
    
    with open(doc_file, 'w', encoding='utf-8') as f:
        f.write(content)
    print("✅ Fixed Doctor Workspace")

# 2. Lab Queue
lab_file = 'app/(os)/health/lab/queue/index.tsx'
if os.path.exists(lab_file):
    with open(lab_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove phone column
    content = content.replace("patient:health_patients(first_name, last_name, phone)", "patient:health_patients(first_name, last_name)")
    content = content.replace("patient:patient_id(first_name, last_name, phone)", "patient:patient_id(first_name, last_name)")
    
    with open(lab_file, 'w', encoding='utf-8') as f:
        f.write(content)
    print("✅ Fixed Lab Queue")

# 3. Pharmacy Queue
pharma_file = 'app/(os)/health/pharmacy/queue/index.tsx'
if os.path.exists(pharma_file):
    with open(pharma_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Ensure correct mapping
    content = content.replace("item.patient_name || 'Unknown'", "item.patient_id ? 'Patient' : 'Unknown'")
    
    with open(pharma_file, 'w', encoding='utf-8') as f:
        f.write(content)
    print("✅ Fixed Pharmacy Queue")

print("\n🎉 All fixes applied! Now run: npx expo start -c")
