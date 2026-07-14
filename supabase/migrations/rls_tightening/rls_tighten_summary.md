# RLS Policy Tightening — Summary Report

## Stats
- **Total policies analyzed**: 1,176
- **Policies with using_expr = 'true'**: 889
- **Tables with true policies**: 666
- **(Table, CMD) pairs to tighten**: 848
- **Policies being tightened**: 614
- **Policies skipped (system/public/config)**: 275
- **Batches**: 20

## Method
Each batch is wrapped in PL/pgSQL DO blocks that:
1. Check if the target column exists on the table
2. Drop the old "always-true" policy
3. Create a new tightened policy with `auth.uid() = {user_column}`

This prevents "column does not exist" errors.

## Tables Skipped (public/system/config — stay as true)
- `admin_actions`
- `admin_commands`
- `admin_regions`
- `admin_users`
- `app_categories`
- `app_manifests`
- `app_store_versions`
- `apps`
- `asis_usage`
- `async_jobs`
- `binance_bridge_config`
- `binance_rate_history`
- `border_alerts`
- `border_payments`
- `border_payroll`
- `border_posts`
- `border_procurement`
- `border_staff`
- `border_staff_attendance`
- `cargo_declarations`
- `cargo_inspections`
- `carpool_rides`
- `civic_audit_log`
- `civic_audit_logs`
- `civic_categories`
- `civic_counties`
- `civic_countries`
- `civic_departments`
- `civic_jurisdictions`
- `civic_sub_counties`
- `civic_wards`
- `commands`
- `commission_tiers_select`
- `compliance_checks`
- `compliance_rules`
- `connection_pool_stats`
- `container_movements`
- `contraband_seizures`
- `country_configs`
- `court_houses`
- `court_judges`
- `court_rooms`
- `court_stats`
- `crypto_prices`
- `crypto_swap_pairs`
- `customs_alerts`
- `customs_entries`
- `customs_inspections`
- `device_assignments_select_all`
- `devices_select_all`
- `driver_stats`
- `drivers`
- `education_institutions`
- `education_lesson_comments`
- `education_lesson_views`
- `election_audit_log`
- `election_candidates`
- `event_consumers`
- `event_ledger`
- `event_logs`
- `event_logs_archive`
- `farm_inspections`
- `fee_structures`
- `firmware_versions`
- `garage_roadworthy_certs`
- `governance_audit_log`
- `groups`
- `hashtags`
- `health_beds`
- `health_departments`
- `health_doctor_hospitals`
- `health_facilities`
- `health_facility_registrations`
- `health_hospitals`
- `health_sha_fund_pools`
- `health_sha_service_catalog`
- `herbalists`
- `hookup_profiles`
- `immigration_alerts`
- `immigration_records`
- `insurance_providers`
- `kephis_market_prices`
- `kephis_pest_reports`
- `kernel_events`
- `kernel_health_snapshots`
- `market_prices`
- `module_registry`
- `modules`
- `mtaxi_boda_zones`
- `mtaxi_garage_inspectors`
- `mtaxi_garages`
- `mtaxi_marshals`
- `mtaxi_qr_payments`
- `mtaxi_ratings`
- `mtaxi_ride_pricing`
- `mtaxi_scan_sessions`
- `mtaxi_service_zones`
- `mtaxi_surge_pricing`
- `mtaxi_vehicle_types`
- `mtaxi_zone_demand`
- `mtruck_ai_insights`
- `mtruck_eta_predictions`
- `mtruck_fleet_snapshots`
- `mtruck_fuel_alerts`
- `mtruck_gps_stream`
- `mtruck_maintenance_alerts`
- `mtruck_os_logs`
- `mtruck_pricing_state`
- `mtruck_security_alerts`
- `mtruck_telemetry`
- `mtruck_trade_corridors`
- `mtruck_traffic_hotspots`
- `mtruck_warehouse_inventory`
- `musicians`
- `ntsa_saccos`
- `osbp_operations`
- `overstays`
- `passports`
- `pest_disease_reports`
- `petitions`
- `pharmacies`
- `police_county_stats`
- `police_fine_catalog`
- `police_national_stats`
- `police_radio_channels`
- `police_stations`
- `police_workstations`
- `poll_options`
- `polls`
- `prison_cells`
- `prison_facilities`
- `prison_stats`
- `prison_wardens`
- `product_categories`
- `products`
- `property_photos`
- `public_participation`
- `query_performance_log`
- `rail_registry`
- `rate_limits`
- `restaurant_attendance`
- `restaurant_customers`
- `restaurant_inventory`
- `restaurant_inventory_transactions`
- `restaurant_kds_stations`
- `restaurant_kds_ticket_items`
- `restaurant_kds_tickets`
- `restaurant_menu_categories`
- `restaurant_menu_items`
- `restaurant_order_items`
- `restaurant_order_splits`
- `restaurant_orders`
- `restaurant_payroll`
- `restaurant_reservations`
- `restaurant_staff`
- `restaurant_suppliers`
- `restaurant_table_sections`
- `restaurant_tables`
- `revenue_country_config`
- `revenue_staff`
- `revenue_workstations`
- `road_incidents`
- `security_events`
- `shop_brands`
- `shop_collection_products`
- `shop_collections`
- `shop_coupons`
- `shop_discounts`
- `shop_product_tags`
- `shop_shipping_rates`
- `shop_shipping_zones`
- `shop_tags`
- `shop_variant_options`
- `shop_variants`
- `skills_public`
- `streets_ads`
- `streets_creator_stats`
- `streets_gift_catalog`
- `streets_live_streams`
- `streets_products`
- `streets_shops`
- `system_events`
- `system_health`
- `system_logs`
- `system_settings`
- `tariff_schedule`
- `track_ads`
- `track_collaborators`
- `track_revenue`
- `tracks`
- `transit_checkpoint_logs`
- `transit_guarantees`
- `treasury_country_config`
- `treasury_dashboard_metrics`
- `tribe_culture_tags`
- `tribe_groups`
- `tribe_museum_map`
- `tribe_oral_histories`
- `tribe_timeline_events`
- `vessel_manifests`
- `visa_applications`
- `visas`
- `votes`
- `wallet_agent_commission_tiers`
- `wallet_role_types`
- `work_skills`

## Run Instructions

Run each batch in order in your Supabase SQL Editor:

```bash
# Download all 20 batches, then run:
for i in $(seq -w 1 20); do
  echo "Running batch $i..."
  # paste rls_tighten_batch_${i}_of_20.sql into Supabase SQL Editor
  # click Run
done
```

## Verification

After running all batches, verify with:

```sql
SELECT tablename, count(*) as remaining_true
FROM pg_policies
WHERE schemaname = 'public'
  AND qual::text = 'true'
GROUP BY tablename
ORDER BY remaining_true DESC;
```

Only system/public tables should remain.
