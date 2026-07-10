#!/bin/bash

# ============================================================
# MTAA OS V10 - PHASE 2 FRONTEND RENAME SCRIPT (Option A)
# Run from project root: ~/MTAA_OS_V10
# BACKUP FIRST: git add -A && git commit -m "pre-rename-backup"
# ============================================================

set -e

echo "Starting frontend table renames..."

# civic_audit_logs → civic_audit_log
find app/ lib/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/"civic_audit_logs"/"civic_audit_log"/g' {} +

# health_queue → health_queues
find app/ lib/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/"health_queue"/"health_queues"/g' {} +

# identity_verifications → identity_verification
find app/ lib/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/"identity_verifications"/"identity_verification"/g' {} +

# prison_procurements → prison_procurement
find app/ lib/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/"prison_procurements"/"prison_procurement"/g' {} +

# civic_applications → civic_transaction_approvals (VERIFY: check columns match before running)
find app/ lib/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/"civic_applications"/"civic_transaction_approvals"/g' {} +

# civic_prisoners → civic_personnel (VERIFY: check columns match before running)
find app/ lib/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/"civic_prisoners"/"civic_personnel"/g' {} +

# civic_revenue_consolidations → civic_transaction_approvals (VERIFY: check columns match before running)
find app/ lib/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/"civic_revenue_consolidations"/"civic_transaction_approvals"/g' {} +

# education_assignment_submissions → education_submissions (VERIFY: check columns match before running)
find app/ lib/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/"education_assignment_submissions"/"education_submissions"/g' {} +

# education_class_enrollments → education_lesson_comments (VERIFY: check columns match before running)
find app/ lib/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/"education_class_enrollments"/"education_lesson_comments"/g' {} +

# education_class_subjects → education_subjects (VERIFY: check columns match before running)
find app/ lib/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/"education_class_subjects"/"education_subjects"/g' {} +

# education_classes_v2 → education_classes (VERIFY: check columns match before running)
find app/ lib/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/"education_classes_v2"/"education_classes"/g' {} +

# education_feed_comments → education_lesson_comments (VERIFY: check columns match before running)
find app/ lib/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/"education_feed_comments"/"education_lesson_comments"/g' {} +

# education_parent_notifications → education_parent_connections (VERIFY: check columns match before running)
find app/ lib/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/"education_parent_notifications"/"education_parent_connections"/g' {} +

# education_student_identities → education_students (VERIFY: check columns match before running)
find app/ lib/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/"education_student_identities"/"education_students"/g' {} +

# education_teacher_activities → education_teacher_services (VERIFY: check columns match before running)
find app/ lib/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/"education_teacher_activities"/"education_teacher_services"/g' {} +

# education_teacher_identities → education_teacher_services (VERIFY: check columns match before running)
find app/ lib/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/"education_teacher_identities"/"education_teacher_services"/g' {} +

# education_verification_logs → education_earnings_transactions (VERIFY: check columns match before running)
find app/ lib/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/"education_verification_logs"/"education_earnings_transactions"/g' {} +

# health_claims → health_sha_claims (VERIFY: check columns match before running)
find app/ lib/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/"health_claims"/"health_sha_claims"/g' {} +

# health_insurance_claims → health_insurance (VERIFY: check columns match before running)
find app/ lib/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/"health_insurance_claims"/"health_insurance"/g' {} +

# health_lab_order_items → health_lab_orders (VERIFY: check columns match before running)
find app/ lib/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/"health_lab_order_items"/"health_lab_orders"/g' {} +

# health_lab_results → health_leave_requests (VERIFY: check columns match before running)
find app/ lib/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/"health_lab_results"/"health_leave_requests"/g' {} +

# health_medication_administrations → health_wallet_transactions (VERIFY: check columns match before running)
find app/ lib/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/"health_medication_administrations"/"health_wallet_transactions"/g' {} +

# health_medications → health_appointments (VERIFY: check columns match before running)
find app/ lib/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/"health_medications"/"health_appointments"/g' {} +

# health_orders → health_pharmacy_orders (VERIFY: check columns match before running)
find app/ lib/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/"health_orders"/"health_pharmacy_orders"/g' {} +

# health_radiology_requests → health_audit_logs (VERIFY: check columns match before running)
find app/ lib/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/"health_radiology_requests"/"health_audit_logs"/g' {} +

# health_wallet → health_wallet_transactions (VERIFY: check columns match before running)
find app/ lib/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/"health_wallet"/"health_wallet_transactions"/g' {} +

# hookup_private_messages → hookup_messages (VERIFY: check columns match before running)
find app/ lib/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/"hookup_private_messages"/"hookup_messages"/g' {} +

# police_notifications → police_stations (VERIFY: check columns match before running)
find app/ lib/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/"police_notifications"/"police_stations"/g' {} +

# prison_attendance → prison_staff_attendance (VERIFY: check columns match before running)
find app/ lib/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/"prison_attendance"/"prison_staff_attendance"/g' {} +

# public_participation_by_county → public_participation (VERIFY: check columns match before running)
find app/ lib/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/"public_participation_by_county"/"public_participation"/g' {} +

# shop_accounting_periods → shop_product_tags (VERIFY: check columns match before running)
find app/ lib/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/"shop_accounting_periods"/"shop_product_tags"/g' {} +

# shop_order_items → shop_items (VERIFY: check columns match before running)
find app/ lib/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/"shop_order_items"/"shop_items"/g' {} +

# shop_orders → shop_purchase_orders (VERIFY: check columns match before running)
find app/ lib/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/"shop_orders"/"shop_purchase_orders"/g' {} +

# shop_products → shop_collection_products (VERIFY: check columns match before running)
find app/ lib/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/"shop_products"/"shop_collection_products"/g' {} +

# studio_broadcast_members → studio_camera_nodes (VERIFY: check columns match before running)
find app/ lib/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/"studio_broadcast_members"/"studio_camera_nodes"/g' {} +

# studio_creator_revenue → studio_revenue (VERIFY: check columns match before running)
find app/ lib/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/"studio_creator_revenue"/"studio_revenue"/g' {} +

# studio_creator_subscriptions → studio_subscriptions (VERIFY: check columns match before running)
find app/ lib/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/"studio_creator_subscriptions"/"studio_subscriptions"/g' {} +

# studio_integration_logs → studio_pairing_sessions (VERIFY: check columns match before running)
find app/ lib/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/"studio_integration_logs"/"studio_pairing_sessions"/g' {} +

# studio_music_albums → studio_music_releases (VERIFY: check columns match before running)
find app/ lib/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/"studio_music_albums"/"studio_music_releases"/g' {} +

# studio_music_royalties → studio_music_releases (VERIFY: check columns match before running)
find app/ lib/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/"studio_music_royalties"/"studio_music_releases"/g' {} +

# studio_reports → studio_projects (VERIFY: check columns match before running)
find app/ lib/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/"studio_reports"/"studio_projects"/g' {} +

# studio_revenue_shares → studio_revenue (VERIFY: check columns match before running)
find app/ lib/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/"studio_revenue_shares"/"studio_revenue"/g' {} +

# tribe_post_comments → tribe_comments (VERIFY: check columns match before running)
find app/ lib/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/"tribe_post_comments"/"tribe_comments"/g' {} +

# wallet_credit_scores → wallet_sacco_directory (VERIFY: check columns match before running)
find app/ lib/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/"wallet_credit_scores"/"wallet_sacco_directory"/g' {} +

# wallet_pending_transactions → wallet_transactions (VERIFY: check columns match before running)
find app/ lib/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/"wallet_pending_transactions"/"wallet_transactions"/g' {} +

echo "Renames complete. Run: npx tsc --noEmit to verify."
