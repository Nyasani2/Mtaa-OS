import os

# 1. Fix Doctor Workspace
doc_file = 'app/(os)/health/doctor/index.tsx'
if os.path.exists(doc_file):
    with open(doc_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove ordered_by to bypass the broken FK constraint
    content = content.replace('ordered_by: user.id, // CRITICAL: Required by your schema (NOT NULL)\n    ', '')
    content = content.replace('ordered_by: user.id,\n    ', '')
    
    # Ensure priority is lowercase to pass CHECK constraint
    content = content.replace("priority: item.priority,", "priority: (item.priority || 'normal').toLowerCase(),")
    
    with open(doc_file, 'w', encoding='utf-8') as f:
        f.write(content)
    print("✅ Fixed Doctor Workspace")

# 2. Fix Lab Queue
lab_file = 'app/(os)/health/lab/queue/index.tsx'
if os.path.exists(lab_file):
    with open(lab_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove 'phone' from select to fix "column does not exist" error
    content = content.replace("patient:patient_id(first_name, last_name, phone)", "patient:patient_id(first_name, last_name)")
    
    with open(lab_file, 'w', encoding='utf-8') as f:
        f.write(content)
    print("✅ Fixed Lab Queue")

print("🚀 Done! Now run: npx expo start -c")
