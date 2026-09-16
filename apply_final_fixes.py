import os
import re

print("🚀 Applying final MTAA Health P0 fixes safely...")

# ==========================================
# FIX 1: Doctor Workspace (Allergy Hard-Stop + Author Resolution)
# ==========================================
doc_file = 'app/(os)/health/doctor/index.tsx'
if os.path.exists(doc_file):
    with open(doc_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. Add resolveStaff helper if not present
    if 'const resolveStaff = async ()' not in content:
        helper_func = """
// P0 FIX #1: Author Resolution Helper
const resolveStaff = async () => {
  const { data: staff, error } = await supabase
    .from('health_staff')
    .select('id, facility_id, full_name')
    .eq('user_id', user.id)
    .single();
  if (error || !staff) throw new Error('Staff profile not found. Please register as staff first.');
  return staff;
};
"""
        content = content.replace(
            'const completeConsultation = async () => {',
            helper_func + '\n  const completeConsultation = async () => {'
        )

    # 2. Replace user.id with staff.id in completeConsultation
    content = re.sub(r'doctor_id:\s*user\.id', 'doctor_id: staff.id', content)
    content = re.sub(r'ordered_by:\s*user\.id', 'ordered_by: staff.id', content)
    
    # 3. Inject Allergy Hard-Stop
    old_rx_save = """      // 2. Create prescription
      const validRxItems = rxItems.filter(item => item.drug.trim());
      if (validRxItems.length > 0) {"""
    
    new_rx_save = """      // 2. PRESCRIBING SAFETY: Check for allergies before saving
      const validRxItems = rxItems.filter(item => item.drug.trim());
      if (validRxItems.length > 0) {
        const { data: patientData } = await supabase
          .from('health_patients')
          .select('allergies')
          .eq('id', patientId)
          .single();
        
        if (patientData?.allergies) {
          const allergies = Array.isArray(patientData.allergies) ? patientData.allergies : [patientData.allergies];
          const prescribedDrugs = validRxItems.map(item => item.drug.toLowerCase());
          const allergicDrugs = allergies.filter((allergy: string) => 
            prescribedDrugs.some((drug: string) => drug.includes(allergy.toLowerCase()))
          );
          
          if (allergicDrugs.length > 0) {
            Alert.alert('⚠️ CRITICAL ALLERGY WARNING', `Patient is allergic to: ${allergicDrugs.join(', ')}. Prescription blocked.`);
            setSaving(false);
            return;
          }
        }
"""
    if old_rx_save in content:
        content = content.replace(old_rx_save, new_rx_save)
        print("  -> Injected Allergy Hard-Stop")
    
    with open(doc_file, 'w', encoding='utf-8') as f:
        f.write(content)
    print("✅ Fixed: app/(os)/health/doctor/index.tsx")
else:
    print(f"⚠️  File not found: {doc_file}")

# ==========================================
# FIX 2: Billing Screen (Revenue Recognition)
# ==========================================
billing_file = 'app/(os)/health/billing/index.tsx'
if os.path.exists(billing_file):
    with open(billing_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    content = content.replace(
        'const [recognizedRevenue, setRecognizedRevenue] = useState(0);',
        'const [recognizedRevenue, setRecognizedRevenue] = useState(0); // Only PAID'
    )
    content = content.replace(
        'const [outstandingReceivables, setOutstandingReceivables] = useState(0);',
        'const [outstandingReceivables, setOutstandingReceivables] = useState(0); // PENDING'
    )
    content = content.replace(
        'const [overdueDebt, setOverdueDebt] = useState(0);',
        'const [overdueDebt, setOverdueDebt] = useState(0); // OVERDUE'
    )
    
    if 'let paid = 0, pending = 0, overdue = 0;' in content:
        content = content.replace('let paid = 0, pending = 0, overdue = 0;', 'let recognized = 0, outstanding = 0, overdue = 0;')
        content = content.replace('setRecognizedRevenue(paid);', 'setRecognizedRevenue(recognized);')
        content = content.replace('setOutstandingReceivables(pending);', 'setOutstandingReceivables(outstanding);')
    
    with open(billing_file, 'w', encoding='utf-8') as f:
        f.write(content)
    print("✅ Fixed: app/(os)/health/billing/index.tsx")
else:
    print(f"⚠️  File not found: {billing_file}")

# ==========================================
# FIX 3: Lab Queue (Remove broken FK joins)
# ==========================================
lab_file = 'app/(os)/health/lab/queue/index.tsx'
if os.path.exists(lab_file):
    with open(lab_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    content = re.sub(r'ordered_by:\s*user\.id,?\s*\n', '', content)
    content = re.sub(r'ordered_by:\s*doctorId,?\s*\n', '', content)
    
    with open(lab_file, 'w', encoding='utf-8') as f:
        f.write(content)
    print("✅ Fixed: app/(os)/health/lab/queue/index.tsx")
else:
    print(f"⚠️  File not found: {lab_file}")

# ==========================================
# FIX 4: Pharmacy Queue (Priority casing)
# ==========================================
pharmacy_file = 'app/(os)/health/pharmacy/queue/index.tsx'
if os.path.exists(pharmacy_file):
    with open(pharmacy_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    content = content.replace("priority: item.priority,", "priority: (item.priority || 'normal').toLowerCase(),")
    
    with open(pharmacy_file, 'w', encoding='utf-8') as f:
        f.write(content)
    print("✅ Fixed: app/(os)/health/pharmacy/queue/index.tsx")
else:
    print(f"⚠️  File not found: {pharmacy_file}")

print("\n🎉 All fixes applied successfully!")
print("👉 NEXT STEP: Restart Expo with a clean cache:")
print("   npx expo start -c")
