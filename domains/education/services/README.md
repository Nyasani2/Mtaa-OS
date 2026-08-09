# MTAA Education Module — Schema-Aligned Service Fixes v2

## What Was Wrong
1. `education_schools` table didn't exist → actual table is `education_institutions`
2. FK constraints missing: `education_teachers.user_id`, `education_students.user_id`, `education_staff.user_id` → `user_profiles(user_id)`
3. All frontend services used **assumed column names** that didn't match your actual schema
4. Implicit joins failed because PostgREST couldn't find FK relationships

## What This Fix Does

### SQL Fix (`education_schema_fixes_v3.sql`)
- Creates `education_schools` view → `SELECT * FROM education_institutions` (fixes all 404s)
- Adds 3 missing FK constraints referencing `user_profiles(user_id)` NOT `user_profiles(id)`
- Wrapped in `DO $$ EXCEPTION` blocks → safe to re-run, won't crash

### 13 Service Files (regenerated with YOUR exact column names)
Every interface, query, and filter uses columns that actually exist in your schema:

| Service | Exact Table | Key Columns Used |
|---|---|---|
| Schools | `education_institutions` | id, name, type, level, county, district, country, is_active |
| Teachers | `education_teachers` | id, user_id, full_name, kyc_status, tsc_number, is_active |
| Students | `education_students` | id, user_id, admission_number, class_level, stream, is_active |
| Classes | `education_classes` | id, institution_id, name, level, stream, class_teacher_id |
| Assignments | `education_assignments` | id, class_id, subject_id, teacher_id, title, type, max_score, due_date |
| Feed | `education_feed_posts` | id, institution_id, status, created_at |
| Timetable | `education_timetable` | id, institution_id, status, created_at |
| Announcements | `education_announcements` | id, staff_id, title, content, priority, is_pinned, visibility_scope |
| Transport | `education_transport_routes` | id, route_name, route_code, driver_name, vehicle_plate, stops |
| Attendance | `education_attendance` | id, lesson_id, student_id, class_id, date, status, marked_by |
| Grades | `education_grades` | id, student_id, subject_id, term, exam_type, score, grade |
| Messages | `education_messages` | id, sender_id, receiver_id, subject, body, is_read |
| Payroll | `education_payroll` | id, teacher_id, month, basic_salary, net_pay, status |

All services use **explicit separate queries** — no implicit joins.

## Installation

### Step 1: Run SQL in Supabase
```sql
-- Open Supabase SQL Editor → New Query
-- Paste entire contents of education_schema_fixes_v3.sql
-- Click Run
-- Then run this to refresh cache:
NOTIFY pgrst, 'reload schema';
```

### Step 2: Extract Services
```bash
cd ~/MTAA_OS_V10

# Backup old services
mkdir -p domains/education/services/backup_$(date +%Y%m%d)
cp domains/education/services/*.ts domains/education/services/backup_$(date +%Y%m%d)/ 2>/dev/null || true

# Extract new services
unzip -o ~/Downloads/education_services_fix_v2.zip -d domains/education/services/
```

### Step 3: Update imports in your pages/hooks
If your pages import from old paths, update them:
```typescript
// Old (broken)
import { getSchools } from '@/lib/services/education-service';

// New (schema-correct)
import { getInstitutions, getTeachers, getStudents } from '@/domains/education/services';
```

### Step 4: Restart
```bash
npx expo start --clear
```

## Troubleshooting

**Still seeing 404 on education_schools?**
- Check view exists: `SELECT * FROM education_schools LIMIT 1;`
- Force PostgREST refresh: `NOTIFY pgrst, 'reload schema';`

**Still seeing PGRST200 on teacher joins?**
- Check FK exists: `\d education_teachers` (in psql) or check Table Editor → Constraints
- The services use explicit queries, so this won't break them even if FK is missing

**Column not found errors in services?**
- These services use ONLY columns from your actual schema dump
- If you see a column error, your schema may have changed since the dump
- Send me the new column list and I'll regenerate
