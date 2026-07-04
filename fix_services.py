import os

service_files = [
    'domains/education/services/attendanceService.ts',
    'domains/education/services/classroomService.ts', 
    'domains/education/services/feedFinanceService.ts',
    'domains/education/services/identityService.ts',
    'domains/education/services/institutionProfileService.ts',
    'domains/education/services/lessonService.ts',
    'domains/education/services/messageService.ts',
    'domains/education/services/parentService.ts',
    'domains/education/services/qrSessionService.ts',
    'domains/education/services/safetyService.ts',
    'domains/education/services/studentIdentityService.ts',
    'domains/education/services/teacherDashboardService.ts',
    'domains/education/services/teacherEconomyService.ts',
    'domains/education/services/teacherIdentityService.ts',
    'domains/education/services/transportService.ts',
    'domains/education/services/walkingService.ts',
]

for f in service_files:
    path = os.path.join(os.getcwd(), f)
    if not os.path.exists(path):
        print(f"SKIP: {f}")
        continue
    
    with open(path, 'r') as file:
        content = file.read()
    
    original = content
    content = content.replace('|| null', '|| undefined')
    content = content.replace('error: error?.message || undefined };', 'error: error?.message || undefined, success: !error };')
    content = content.replace('error: error?.message || undefined }', 'error: error?.message || undefined, success: !error }')
    
    if content != original:
        with open(path, 'w') as file:
            file.write(content)
        print(f"FIXED: {f}")
    else:
        print(f"NO CHANGE: {f}")

print("Done!")
