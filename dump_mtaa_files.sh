#!/bin/bash
# MTAA OS V10 Frontend Dump Script
# Run from ~/MTAA_OS_V10
# Output: ~/Desktop/mtaa_frontend_dump.txt

PROJECT_DIR="${PWD}"
OUTPUT_FILE="$HOME/Desktop/mtaa_frontend_dump.txt"

echo "=== MTAA OS V10 Frontend Dump ===" > "$OUTPUT_FILE"
echo "Generated: $(date)" >> "$OUTPUT_FILE"
echo "Project: $PROJECT_DIR" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Helper function to dump a file with clear separators
dump_file() {
    local file="$1"
    if [ -f "$file" ]; then
        echo "" >> "$OUTPUT_FILE"
        echo "========================================" >> "$OUTPUT_FILE"
        echo "FILE: $file" >> "$OUTPUT_FILE"
        echo "========================================" >> "$OUTPUT_FILE"
        cat "$file" >> "$OUTPUT_FILE"
        echo "" >> "$OUTPUT_FILE"
    else
        echo "" >> "$OUTPUT_FILE"
        echo "========================================" >> "$OUTPUT_FILE"
        echo "FILE: $file [MISSING]" >> "$OUTPUT_FILE"
        echo "========================================" >> "$OUTPUT_FILE"
        echo "" >> "$OUTPUT_FILE"
    fi
}

echo "--- FILE TREE: app/ (first 3 levels) ---" >> "$OUTPUT_FILE"
find "$PROJECT_DIR/app" -maxdepth 3 -type f -name "*.tsx" -o -name "*.ts" -o -name "*.json" | sort >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

echo "--- FILE TREE: lib/services/ (first 3 levels) ---" >> "$OUTPUT_FILE"
find "$PROJECT_DIR/lib/services" -maxdepth 3 -type f -name "*.ts" | sort >> "$OUTPUT_FILE" 2>/dev/null || echo "lib/services/ not found" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

echo "--- FILE TREE: lib/hooks/ (first 3 levels) ---" >> "$OUTPUT_FILE"
find "$PROJECT_DIR/lib/hooks" -maxdepth 3 -type f -name "*.ts" | sort >> "$OUTPUT_FILE" 2>/dev/null || echo "lib/hooks/ not found" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# === BROKEN / CRASHING SCREENS ===
dump_file "app/(os)/health/hospital-admin/staff/index.tsx"
dump_file "app/(os)/streets/index.tsx"
dump_file "app/(os)/tribes.tsx"
dump_file "app/(garage)/index.tsx"

# === MISSING ROUTES (check if they exist) ===
dump_file "app/(os)/jobs/index.tsx"
dump_file "app/(os)/jobs.tsx"
dump_file "app/(work)/index.tsx"
dump_file "app/(work)/workspace/index.tsx"
dump_file "app/(work)/tasks/index.tsx"
dump_file "app/(education)/index.tsx"
dump_file "app/(education)/library/index.tsx"
dump_file "app/(education)/portal/index.tsx"
dump_file "app/(education)/results/index.tsx"
dump_file "app/(admin)/index.tsx"
dump_file "app/(admin)/system/index.tsx"

# === RELATED SERVICES ===
dump_file "lib/services/tribes-service.ts"
dump_file "lib/services/tribes.ts"
dump_file "lib/services/tribes/index.ts"
dump_file "lib/services/streets-service.ts"
dump_file "lib/services/streets.ts"
dump_file "lib/services/streets/index.ts"
dump_file "lib/services/garage-service.ts"
dump_file "lib/services/garage.ts"
dump_file "lib/services/garage/index.ts"
dump_file "lib/services/health/staff-service.ts"
dump_file "lib/services/health/hospital-admin.ts"
dump_file "lib/services/health/index.ts"

# === RELATED HOOKS ===
dump_file "lib/hooks/useStreets.ts"
dump_file "lib/hooks/useTribes.ts"
dump_file "lib/hooks/useGarage.ts"
dump_file "lib/hooks/useHealthStaff.ts"
dump_file "lib/hooks/useHospitalAdmin.ts"

# === BARREL EXPORTS ===
dump_file "lib/services/index.ts"
dump_file "lib/hooks/index.ts"

# === APP REGISTRY / MANIFEST ===
dump_file "lib/app-registry.ts"
dump_file "lib/kernel/registry.ts"
dump_file "lib/apps/manifest.ts"
dump_file "lib/apps/index.ts"

# === LAYOUTS ===
dump_file "app/(os)/_layout.tsx"
dump_file "app/(work)/_layout.tsx"
dump_file "app/(education)/_layout.tsx"
dump_file "app/(admin)/_layout.tsx"
dump_file "app/(garage)/_layout.tsx"

# === HEALTH MODULE (full audit) ===
dump_file "app/(os)/health/index.tsx"
dump_file "app/(os)/health/hospital-admin/index.tsx"
dump_file "app/(os)/health/hospital-admin/pos/index.tsx"
dump_file "app/(os)/health/hospital-admin/accounting/index.tsx"
dump_file "app/(os)/health/ambulance/index.tsx"
dump_file "app/(os)/health/pharmacy/index.tsx"
dump_file "app/(os)/health/pharmacy/inventory.tsx"
dump_file "app/(os)/health/insurance/index.tsx"

# === TRANSPORT MODULE ===
dump_file "app/(os)/transport/index.tsx"
dump_file "app/(os)/mtaxi/index.tsx"
dump_file "app/(os)/mtruck/index.tsx"
dump_file "app/(os)/boda/index.tsx"

# === COMMERCE MODULE ===
dump_file "app/(os)/shop/index.tsx"
dump_file "app/(os)/restaurant/index.tsx"
dump_file "app/(os)/marketplace/index.tsx"

# === CIVIC MODULE ===
dump_file "app/(os)/civic/index.tsx"
dump_file "app/(os)/police/index.tsx"
dump_file "app/(os)/courts/index.tsx"
dump_file "app/(os)/prisons/index.tsx"

# === SOCIAL MODULE ===
dump_file "app/(os)/streets/_layout.tsx"
dump_file "app/(os)/messages/index.tsx"
dump_file "app/(os)/camera/index.tsx"
dump_file "app/(os)/gallery/index.tsx"

# === MEDIA MODULE ===
dump_file "app/(os)/music/index.tsx"
dump_file "app/(os)/podcast/index.tsx"
dump_file "app/(os)/video/index.tsx"
dump_file "app/(os)/studio/index.tsx"

# === EDUCATION MODULE ===
dump_file "app/(os)/education/index.tsx"
dump_file "app/(os)/schools/index.tsx"
dump_file "app/(os)/teachers/index.tsx"
dump_file "app/(os)/timetable/index.tsx"
dump_file "app/(os)/head-teacher/index.tsx"
dump_file "app/(os)/emergency/index.tsx"
dump_file "app/(os)/command-center/index.tsx"

# === WALLET / FINANCE ===
dump_file "app/(os)/wallet/index.tsx"
dump_file "app/(os)/binance/index.tsx"
dump_file "app/(os)/credit/index.tsx"

# === OS CORE ===
dump_file "app/(os)/appstore/index.tsx"
dump_file "app/(os)/settings/index.tsx"
dump_file "app/(os)/profile/index.tsx"
dump_file "app/(os)/profile/edit.tsx"
dump_file "app/(os)/calculator/index.tsx"
dump_file "app/(os)/calendar/index.tsx"
dump_file "app/(os)/clock/index.tsx"
dump_file "app/(os)/contacts/index.tsx"
dump_file "app/(os)/network/index.tsx"
dump_file "app/(os)/phone/index.tsx"

# === ASIS ===
dump_file "app/(os)/asis/index.tsx"

# === SUPABASE CLIENT ===
dump_file "lib/supabase/client.ts"
dump_file "lib/supabase/index.ts"

# === AUTH ===
dump_file "lib/auth/store/auth.store.ts"
dump_file "lib/auth/useAuth.ts"
dump_file "lib/auth/useAuthStore.ts"
dump_file "lib/auth/index.ts"

echo ""
echo "========================================"
echo "Dump complete! File saved to:"
echo "$OUTPUT_FILE"
echo "========================================"
