#!/bin/bash

# ============================================================
# MTAA OS V10 - PHASE 2 STUB REMOVAL SCRIPT (Option A)
# Removes frontend references to 101 orphaned/stub tables
# Run from project root: ~/MTAA_OS_V10
# BACKUP FIRST: git add -A && git commit -m "pre-stub-removal-backup"
# ============================================================

set -e

echo "Removing frontend references to orphaned/stub tables..."
echo "This will comment out .from() calls and service methods for stubs."
echo ""

# Tables to remove (101 stubs/orphans)
STUBS=(
  "_realtime_events"
  "accountings"
  "active_governance_members"
  "affiliate_clicks"
  "affiliate_programs"
  "app_message_queue"
  "asis_analysis_results"
  "asis_findings"
  "asis_provider_status"
  "bus_acks"
  "case_updates"
  "clinical_notes"
  "compliance_checks"
  "creator_withdrawals"
  "daraja_configs"
  "driver_repositioning"
  "election_observers"
  "election_voters"
  "external_credit_history"
  "follow_ups"
  "garage_parts_used"
  "go_fund"
  "health_children"
  "health_emergencies"
  "health_emergency_requests"
  "health_handovers"
  "health_outbreaks"
  "health_population"
  "health_sharing_grants"
  "health_symptom_checks"
  "health_telemedicine"
  "health_vitals"
  "hookup_activity_heatmap"
  "hookup_boost_purchases"
  "hookup_cross_app_activity"
  "hookup_event_participants"
  "hookup_fraud_scores"
  "hookup_group_members"
  "hookup_identity_passports"
  "hookup_identity_signals"
  "hookup_interaction_graph"
  "hookup_live_presence"
  "hookup_livestreams"
  "hookup_marriage_proposals"
  "hookup_moderation_actions"
  "hookup_moderators"
  "hookup_passes"
  "hookup_profile_media"
  "hookup_room_signals"
  "hookup_tokens"
  "lab_results"
  "lab_samples"
  "logistics_ai_decisions"
  "medication_administrations"
  "mtaa_cross_border_routes"
  "mtaa_cross_border_settlements"
  "mtaa_digital_trade_flows"
  "ntsa_saccos"
  "overstays"
  "passports"
  "patients"
  "payslips"
  "pos_sale_items"
  "pos_sales"
  "prison_visitors"
  "profile_achievements"
  "profile_businesses"
  "profile_connections"
  "profile_qr_codes"
  "regulatory_businesses"
  "regulatory_tax_payments"
  "regulatory_tax_revenue"
  "sanctions_checks"
  "sanctions_list"
  "savings_group_contributions"
  "savings_group_members"
  "scheduled_tasks"
  "search_queries"
  "shipping_addresses"
  "shop_expenses"
  "storage_files"
  "storage_quotas"
  "studio_beats"
  "studio_broadcasters"
  "studio_copyright_claims"
  "studio_copyright_licenses"
  "studio_copyright_ownership"
  "studio_group_members"
  "tax_statements"
  "traffic_zones"
  "tribe_join_requests"
  "trip_intelligence"
  "truck_repositioning"
  "user_identities"
  "user_interests"
  "user_message_inbox"
  "visas"
  "voting_results_summary"
  "wallet_credit_limits"
  "ward_project_rankings"
  "work_permits"
)

for TABLE in "${STUBS[@]}"; do
  echo "Processing: $TABLE"

  # Comment out .from("table") references
  find app/ lib/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec     sed -i "s/\.from("$TABLE")/\/\/ STUB_REMOVED: .from(\"$TABLE\")/g" {} +

  # Comment out .from('table') references (single quotes)
  find app/ lib/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec     sed -i "s/\.from('''$TABLE''')/\/\/ STUB_REMOVED: .from(\'$TABLE\')/g" {} +

  # Comment out table name in type definitions
  find app/ lib/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec     sed -i "s/"$TABLE"/\/\/ STUB_REMOVED: \"$TABLE\"/g" {} +
done

echo ""
echo "Stub removal complete."
echo "Review changes with: git diff --stat"
echo "Then commit with: git add -A && git commit -m "Remove 101 stub table references""
