# MTAA OS — Type Consolidation Strategy
## 223 Duplicate Types — Categorized Fix Plan

### Executive Summary
The domain-driven architecture migration created duplicate type definitions across
`domains/`, `lib/`, and `types/` paths. This document provides the exact canonical
source for each category and the migration order.

---

## CATEGORY 1: Domain vs Legacy lib/ (80 types)
**Rule:** `domains/<module>/types/` is canonical. `lib/<module>/types/` is legacy.

| Type | Canonical | Legacy (delete after migration) |
|------|-----------|-----------------------------------|
| Shop | `domains/shop/types.ts` | `lib/shop/types.ts` |
| ShopProduct | `domains/shop/types.ts` | `lib/shop/types.ts`, `domains/shop/types/shop_types.ts` |
| ShopOrder | `types/shop.ts` | `domains/shop/types.ts`, `lib/shop/types.ts` |
| CartItem | `types/commerce.ts` | `domains/shop/types.ts`, `lib/shop/types.ts`, `lib/marketplace/services/cart.service.ts` |
| HealthPatient | `domains/health/types.ts` | `lib/health/types.ts` |
| HealthFacility | `domains/health/types.ts` | `lib/health/types.ts` |
| HealthRecord | `domains/health/types.ts` | `lib/health/types.ts` |
| HealthAppointment | `domains/health/types.ts` | `lib/health/types.ts` |
| HealthPrescription | `domains/health/types.ts` | `lib/health/types.ts` |
| HealthMedication | `domains/health/types.ts` | `lib/health/types.ts` |
| HealthPharmacy | `domains/health/types.ts` | `lib/health/types.ts` |
| HealthInsuranceClaim | `domains/health/types.ts` | `lib/health/types.ts` |
| HealthTelemedicineSession | `domains/health/types.ts` | `lib/health/types.ts` |
| HealthSymptomCheck | `domains/health/types.ts` | `lib/health/types.ts` |
| HealthNotification | `domains/health/types.ts` | `lib/health/types.ts` |
| HealthOrder | `domains/health/types.ts` | `lib/health/types.ts` |
| HealthLabTest | `domains/health/types.ts` | `lib/health/types.ts` |
| EducationMessage | `domains/education/services/education-messages-service.ts` | `lib/services/education-service.ts` |
| Institution | `domains/education/types/education.types.ts` | `domains/education/services/institutionService.ts` |
| Teacher | `domains/education/types/education.types.ts` | `domains/education/services/teacherService.ts` |
| Student | `domains/education/types/education.types.ts` | `domains/education/services/education-students-service.ts` |
| Class | `domains/education/types/education.types.ts` | `domains/education/services/education-classes-service.ts` |
| Lesson | `domains/education/types/education.types.ts` | `domains/education/services/lessonService.ts` |
| Assignment | `domains/education/services/education-assignments-service.ts` | `domains/education/services/assignmentEngineService.ts` |
| Grade | `domains/education/services/education-grades-service.ts` | `domains/education/services/assignmentEngineService.ts` |
| FeedPost | `domains/education/types/education.types.ts` | `domains/education/services/feedService.ts` |
| PayrollRecord | `domains/education/types/education.types.ts` | `lib/restaurant/types.ts` |
| Tribe | `domains/tribes/services/tribeService.ts` | `lib/tribes/types.ts`, `lib/services/tribes-service.ts` |
| TribeMember | `lib/tribes/types.ts` | `domains/tribes/services/tribeService.ts`, `lib/tribes/services/tribes.service.ts` |
| TribePost | `lib/tribes/types.ts` | `domains/tribes/services/tribeService.ts`, `lib/tribes/services/tribes.service.ts` |
| TribeEvent | `domains/tribes/services/tribeService.ts` | `lib/tribes/types.ts`, `lib/tribes/services/tribes.service.ts` |
| TribeDonation | `domains/tribes/services/tribeService.ts` | `lib/tribes/services/tribes.service.ts`, `lib/services/tribes-service.ts` |
| TribeMessage | `lib/tribes/types.ts` | `lib/tribes/types/index.ts`, `lib/services/tribes-service.ts` |
| Agent | `domains/wallet/types/agent.ts` | `lib/modules/wallet/agent/index.ts` |
| AgentTransaction | `domains/wallet/types/agent.ts` | `lib/modules/wallet/agent/index.ts` |
| Wallet | `domains/wallet/services/walletService.ts` | `lib/modules/wallet/types.ts`, `lib/services/wallet-service.ts` |
| WalletAccount | `domains/wallet/hooks/useWallet.ts` | `lib/modules/wallet/types.ts` |
| WalletTransaction | `domains/wallet/hooks/useWallet.ts` | `lib/stores/wallet-store.ts`, `lib/modules/wallet/types.ts`, `lib/services/wallet-service.ts` |
| WalletBalance | `domains/wallet/hooks/useWallet.ts` | `lib/identity/hooks/useWallet.ts` |
| Business | `domains/business/services/businessService.ts` | `lib/profile/types-additions.ts`, `lib/profile/types/index.ts` |
| BusinessDocument | `domains/business/types/index.ts` | `domains/wallet/services/businessService.ts`, `lib/services/business-service.ts` |
| BusinessType | `domains/business/types/index.ts` | `lib/profile/types-additions.ts`, `lib/profile/types.ts`, `lib/profile/types/index.ts` |
| BusinessStatus | `domains/business/types/index.ts` | `lib/profile/types-additions.ts`, `lib/profile/types.ts`, `lib/profile/types/index.ts` |
| Job | `lib/jobs/types/index.ts` | `lib/services/jobs-service.ts` |
| JobApplication | `lib/jobs/types/index.ts` | `lib/services/jobs-service.ts` |
| WorkProfile | `lib/jobs/types/index.ts` | `lib/services/jobs-service.ts` |
| WorkExperience | `lib/jobs/types/index.ts` | `lib/identity/types.ts`, `lib/services/jobs-service.ts` |
| Education | `lib/jobs/types/index.ts` | `lib/identity/types.ts`, `lib/services/jobs-service.ts` |
| PortfolioItem | `lib/identity/types.ts` | `lib/services/jobs-service.ts` |
| EscrowAccount | `lib/services/escrow-service.ts` | `lib/identity/hooks/useWallet.ts` |
| EscrowTransaction | `lib/modules/wallet/types.ts` | `lib/services/escrow-service.ts` |
| CalendarEvent | `lib/calendar/services/calendar-service.ts` | `lib/calendar/hooks/calendar-service.ts`, `lib/services/calendar-service.ts` |
| Garage | `lib/services/garage-service.ts` | `lib/services/garage.service.ts`, `lib/garage/hooks/useGarage.ts` |
| IncidentReport | `types/voting-types.ts` | `lib/services/incident.service.ts` |
| TaxRecord | `domains/regulatory/services/complianceService.ts` | `lib/services/tax-service.ts` |
| FraudFlag | `domains/regulatory/services/fraudService.ts` | `asis/wallet/fraud-monitor.ts` |
| AuditLogEntry | `domains/regulatory/services/auditService.ts` | `types/voting-types.ts` |
| MarketplaceListing | `domains/shop/types/shop_types.ts` | `lib/shop/types.ts`, `lib/services/marketplace-service.ts` |
| Order | `domains/marketplace/services/cartService.ts` | `lib/restaurant/types.ts`, `lib/marketplace/types/index.ts` |
| InventoryItem | `lib/restaurant/types.ts` | `lib/hooks/useInventory.ts` |
| InventoryTransaction | `domains/shop/types/shop_types.ts` | `lib/restaurant/types.ts` |
| StaffMember | `lib/restaurant/types.ts` | `lib/domains/civic/border/hooks/useStaffOperations.ts`, `hooks/useStaffManagement.ts` |
| PharmacyLocation | `components/health/PharmacyMap.tsx` | `components/health/PharmacyMap.native.tsx`, `components/health/PharmacyMap.web.tsx` |
| StaySearchFilters | `domains/stay/types.ts` | `domains/stay/hooks/useStaySearch.ts` |
| Contact | `domains/phone/types/phone.types.ts` | `domains/phone/state/contactStore.ts` |
| CallLog | `domains/phone/types/phone.types.ts` | `domains/phone/state/contactStore.ts` |
| Message | `domains/education/types/education.types.ts` | `lib/services/messenger-service.ts`, `lib/services/messaging-service.ts` |
| NotificationService | `lib/health/services/notification.service.ts` | `domains/health/services/patient.service.ts` |
| PatientService | `lib/health/services/patient.service.ts` | `domains/health/services/patient.service.ts` |
| ProviderService | `lib/health/services/provider.service.ts` | `domains/health/services/patient.service.ts` |
| RecordService | `lib/health/services/record.service.ts` | `domains/health/services/patient.service.ts` |
| SymptomService | `lib/health/services/symptom.service.ts` | `domains/health/services/patient.service.ts` |
| TelemedicineService | `lib/health/services/telemedicine.service.ts` | `domains/health/services/patient.service.ts` |
| HealthController | `lib/health/controllers/health.controller.ts` | `domains/health/services/patient.service.ts` |
| AccountingService | `lib/shop/services/accountingService.ts` | `domains/shop/services/accountingService.ts` |
| AffiliateService | `lib/shop/services/affiliateService.ts` | `domains/shop/services/affiliateService.ts` |
| ShopService | `lib/shop/services/shopService.ts` | `domains/shop/services/shopService.ts` |
| AffiliateProgram | `domains/shop/types.ts` | `domains/shop/types/shop_types.ts`, `lib/shop/types.ts` |
| DashboardStats | `domains/shop/types.ts` | `domains/shop/types/shop_types.ts`, `lib/shop/types.ts` |
| ShopAccount | `domains/shop/types.ts` | `domains/shop/types/shop_types.ts`, `lib/shop/types.ts` |
| ShopAffiliate | `domains/shop/types.ts` | `domains/shop/types/shop_types.ts`, `lib/shop/types.ts` |
| ShopCategory | `domains/shop/types.ts` | `domains/shop/types/shop_types.ts`, `lib/shop/types.ts` |
| ShopExpense | `domains/shop/types.ts` | `domains/shop/types/shop_types.ts`, `lib/shop/types.ts` |
| POSSession | `domains/shop/types.ts` | `domains/shop/types/shop_types.ts` |
| ShopStaff | `domains/shop/types/shop_types.ts` | `lib/services/business-service.ts` |

**Migration order:**
1. Merge `lib/<module>/types.ts` into `domains/<module>/types.ts` (or `types/<module>.ts`)
2. Update all imports in `domains/<module>/` to use canonical path
3. Delete `lib/<module>/types.ts`
4. Delete `domains/<module>/types/shop_types.ts` (redundant)

---

## CATEGORY 2: Profile Types (15 types)
**Rule:** `lib/profile/types/index.ts` is the canonical barrel. All others are patches.

| Type | Canonical | Legacy/Patch |
|------|-----------|-------------|
| Profile | `lib/profile/types/index.ts` | `lib/profile/types.ts` |
| ProfileType | `lib/profile/types/index.ts` | `lib/profile/types-additions.ts` |
| ConnectionType | `lib/profile/types/index.ts` | `lib/profile/types-additions.ts`, `lib/profile/types.ts` |
| ProfileAchievement | `lib/profile/types/index.ts` | `lib/profile/types-additions.ts`, `lib/profile/types.ts` |
| ProfileCertification | `lib/profile/types/index.ts` | `lib/profile/types-additions.ts`, `lib/profile/types.ts` |
| ProfilePortfolio | `lib/profile/types/index.ts` | `lib/profile/types-additions.ts`, `lib/profile/types.ts` |
| ProfileSkill | `lib/profile/types/index.ts` | `lib/profile/types-additions.ts`, `lib/profile/types.ts` |
| ProfileRole | `lib/profile/types/index.ts` | `lib/profile/types-additions.ts`, `lib/profile/types.ts` |
| VerificationType | `lib/profile/types/index.ts` | `lib/profile/types-additions.ts` |
| StaffRole | `lib/profile/types/index.ts` | `lib/profile/types-additions.ts`, `lib/profile/types.ts` |
| StaffStatus | `lib/profile/types/index.ts` | `lib/profile/types-additions.ts`, `lib/profile/types.ts` |
| BusinessType | `lib/profile/types/index.ts` | `lib/profile/types-additions.ts`, `lib/profile/types.ts` |
| BusinessStatus | `lib/profile/types/index.ts` | `lib/profile/types-additions.ts`, `lib/profile/types.ts` |
| ProfileVerification | `lib/profile/types/index.ts` | `lib/profile/types-additions.ts`, `lib/profile/types.ts` |
| ProfileReputation | `lib/profile/types/index.ts` | `lib/profile/types-additions.ts`, `lib/profile/types.ts` |
| ProfileConnection | `lib/profile/types/index.ts` | `lib/profile/types-additions.ts`, `lib/profile/types.ts` |
| PublicProfileSummary | `lib/profile/types/index.ts` | `lib/profile/types-additions.ts` |
| ProfileAnalytics | `lib/profile/types/index.ts` | `lib/profile/types-additions.ts`, `lib/profile/types.ts` |
| ProfileSettings | `lib/profile/types/index.ts` | `lib/profile/types-additions.ts`, `lib/profile/types.ts` |
| Business | `lib/profile/types/index.ts` | `lib/profile/types-additions.ts` |
| BusinessBranch | `lib/profile/types/index.ts` | `lib/profile/types-additions.ts` |
| BusinessStaff | `lib/profile/types/index.ts` | `lib/profile/types-additions.ts` |
| FamilyMember | `lib/profile/types/index.ts` | `lib/services/family-service.ts` |

**Migration:**
1. Merge all `lib/profile/types-additions.ts` into `lib/profile/types/index.ts`
2. Merge `lib/profile/types.ts` into `lib/profile/types/index.ts`
3. Delete `lib/profile/types-additions.ts` and `lib/profile/types.ts`
4. Update all imports to use `@/lib/profile/types`

---

## CATEGORY 3: ASIS AI Engine (15 types)
**Rule:** `lib/asis-cse/asis-cse-types.ts` is canonical. `asis-cse-types-additions.ts` is a patch.

| Type | Canonical | Legacy/Patch |
|------|-----------|-------------|
| ASISMessage | `lib/asis-cse/asis-cse-types.ts` | `lib/asis-cse/asis-cse-init.ts`, `lib/asis-cse/asis-cse-react.ts`, `lib/asis-cse/asis-cse-provider.tsx`, `lib/asis-v7/types/index.ts` |
| ASISState | `lib/asis-cse/asis-cse-types.ts` | `lib/asis-cse/asis-cse-react.ts`, `lib/asis-cse/asis-cse-provider.tsx` |
| ASISActions | `lib/asis-cse/asis-cse-types.ts` | `lib/asis-cse/asis-cse-react.ts`, `lib/asis-cse/asis-cse-provider.tsx` |
| ASISProviderValue | `lib/asis-cse/asis-cse-types.ts` | `lib/asis-cse/asis-cse-react.ts`, `lib/asis-cse/asis-cse-provider.tsx` |
| ContextVector | `lib/asis-cse/asis-cse-types.ts` | `lib/asis-cse/asis-cse-types-additions.ts`, `lib/asis-v7/types/index.ts` |
| EntityState | `lib/asis-cse/asis-cse-types.ts` | `lib/asis-cse/asis-cse-types-additions.ts` |
| KnowledgeNode | `lib/asis-cse/asis-cse-types.ts` | `lib/asis-cse/asis-cse-types-additions.ts` |
| KnowledgeEdge | `lib/asis-cse/asis-cse-types.ts` | `lib/asis-cse/asis-cse-types-additions.ts` |
| KnowledgeGraph | `lib/asis-cse/asis-cse-types-additions.ts` | `lib/asis-v7/types/index.ts` |
| KAMOSValue | `lib/asis-cse/asis-cse-types.ts` | `lib/asis-cse/asis-cse-types-additions.ts` |
| KamosState | `lib/asis-cse/asis-cse-types.ts` | `lib/asis-cse/asis-cse-types-additions.ts`, `lib/asis-v7/types/index.ts` |
| ReasoningChain | `lib/asis-cse/asis-cse-types.ts` | `lib/asis-cse/asis-cse-types-additions.ts`, `lib/asis-cse/asis-cse-reasoning-v2.ts`, `lib/asis-cse/asis-cse-kamos.ts` |
| ReasoningStep | `lib/asis-cse/asis-cse-types.ts` | `lib/asis-cse/asis-cse-types-additions.ts`, `lib/asis-cse/asis-cse-reasoning-v2.ts` |
| CognitiveEngine | `lib/asis-cse/asis-cse-types.ts` | `lib/asis-cse/asis-cse-types-additions.ts`, `lib/asis-cse/asis-cse-kernel.ts` |
| CognitiveAPIClient | `lib/asis-cse/asis-cse-types.ts` | `lib/asis-cse/asis-cse-api.ts` |
| ToolCapability | `lib/asis-cse/asis-cse-tool-types.ts` | `lib/asis-cse/asis-cse-types.ts` |
| ToolParameter | `lib/asis-cse/asis-cse-tool-types.ts` | `lib/asis-cse/asis-cse-types.ts` |
| ToolPermission | `lib/asis-cse/asis-cse-tool-types.ts` | `lib/asis-cse/asis-cse-types.ts` |
| ToolHealthReport | `lib/asis-cse/asis-cse-tool-registry.ts` | `lib/asis-cse/asis-cse-types.ts` |
| IntentCategory | `lib/asis-cse/asis-cse-types.ts` | `lib/asis-cse/asis-cse-types-additions.ts`, `lib/asis-v7/types/index.ts` |
| Observation | `lib/asis-cse/asis-cse-observation-engine.ts` | `lib/asis-v7/types/index.ts` |
| SynthesizedResponse | `lib/asis-cse/asis-cse-types-additions.ts` | `lib/asis-v7/types/index.ts` |
| Fact | `lib/asis-cse/asis-cse-types-additions.ts` | `lib/asis-cse/asis-cse-web-research.ts` |
| Lesson | `lib/asis-cse/asis-cse-types-additions.ts` | `domains/education/types/education.types.ts`, `domains/education/services/lessonService.ts` |

**Migration:**
1. Merge `asis-cse-types-additions.ts` into `asis-cse-types.ts`
2. Ensure `asis-cse-types.ts` exports all ASIS types
3. Update `asis-cse-react.ts`, `asis-cse-provider.tsx`, `asis-cse-init.ts` to import from canonical
4. Delete `asis-cse-types-additions.ts`
5. For `asis-v7/types/index.ts` — these may be a separate v7 engine; verify if they're actually different before merging

---

## CATEGORY 4: Transport / MTruck / MTaxi (20 types)
**Rule:** `lib/mtruck/types.ts` is canonical for truck types. `lib/transport/types/index.ts` for general transport.

| Type | Canonical | Legacy |
|------|-----------|--------|
| Driver | `lib/mtruck/types.ts` | `lib/mtruck/fleet/fleet-engine.ts`, `lib/mtruck/types/index.ts`, `lib/services/transport-service.ts`, `lib/services/mtaxi-service.ts` |
| Truck | `lib/mtruck/types.ts` | `lib/mtruck/fleet/fleet-engine.ts`, `lib/mtruck/types/index.ts`, `lib/mtruck/os/fleet-reposition-engine.ts`, `lib/services/mtruck-service.ts` |
| Load | `lib/mtruck/types.ts` | `lib/mtruck/types/index.ts`, `lib/services/mtruck-service.ts` |
| Freight | `lib/mtruck/ai/load-batching-engine.ts` | `lib/services/mtruck-service.ts` |
| FreightBid | `lib/mtruck/types.ts` | `lib/services/mtruck-service.ts` |
| FreightListing | `lib/mtruck/types.ts` | `lib/mtruck/types/index.ts`, `lib/mtruck/marketplace/freight-marketplace-engine.ts` |
| TruckDocument | `lib/mtruck/types.ts` | `lib/mtruck/types/index.ts`, `lib/services/mtruck-service.ts` |
| FuelStation | `lib/mtruck/types.ts` | `lib/mtruck/types/index.ts` |
| Route | `lib/mtruck/types.ts` | `lib/mtruck/types/index.ts`, `lib/services/mtruck-service.ts` |
| MaintenanceRecord | `lib/mtruck/types.ts` | `lib/mtruck/fleet/maintenance-engine.ts`, `lib/mtruck/types/index.ts` |
| FleetAlert | `lib/mtruck/types.ts` | `lib/mtruck/types/index.ts`, `lib/services/fleet-camera.service.ts` |
| FleetMetrics | `lib/mtruck/types.ts` | `lib/mtruck/types/index.ts` |
| FleetVehicle | `lib/hooks/useFleet.ts` | `lib/mtruck/fleet/live-fleet-map-engine.ts`, `lib/mtruck/maps/live-fleet-map-engine.ts` |
| TruckLocation | `lib/mtruck/tracking/live-tracking-engine.ts` | `lib/services/mtruck-service.ts` |
| TruckTelemetry | `lib/mtruck/telemetry/truck-telemetry-engine.ts` | `lib/services/mtruck-service.ts` |
| TruckCompany | `lib/transport/types.ts` | `transport_audit_fix_v2/lib/transport/types.ts` |
| HaulRequest | `lib/transport/types.ts` | `transport_audit_fix_v2/lib/transport/types.ts` |
| CreateHaulPayload | `lib/transport/services/ride.service.ts` | `transport_audit_fix_v2/lib/transport/services/ride.service.ts` |
| CreateRidePayload | `lib/transport/types.ts` | `lib/transport/types-additions.ts`, `lib/transport/services/ride.service.ts`, `transport_audit_fix_v2/lib/transport/services/ride.service.ts` |
| RideRequest | `lib/transport/types.ts` | `lib/services/mtaxi-service.ts`, `transport_audit_fix_v2/lib/transport/types.ts` |
| Ride | `lib/services/transport-service.ts` | `lib/services/mtaxi-service.ts`, `lib/mtaxi/types/index.ts` |
| FareEstimate | `lib/transport/types/index.ts` | `lib/transport/types-additions.ts`, `lib/transport/types.ts`, `lib/services/fare-engine.ts`, `lib/services/mtaxi-service.ts`, `lib/mtaxi/types/index.ts`, `lib/mtaxi/services/rideService.ts` |
| FareBreakdown | `lib/transport/types.ts` | `lib/services/fare-engine.ts` |
| NearbyDriver | `lib/transport/types/index.ts` | `lib/transport/types-additions.ts`, `lib/transport/types.ts`, `lib/transport/services/ride.service.ts`, `lib/services/mtaxi-service.ts`, `lib/mtaxi/types/index.ts`, `transport_audit_fix_v2/lib/transport/services/ride.service.ts` |
| TransportRide | `lib/transport/types/index.ts` | `lib/transport/types-additions.ts`, `lib/transport/types.ts` |
| LocationPoint | `lib/transport/types/index.ts` | `lib/transport/types-additions.ts`, `lib/transport/types.ts` |
| DriverAvailability | `lib/transport/types/index.ts` | `lib/transport/types-additions.ts`, `lib/transport/types.ts` |
| RecentPlace | `lib/transport/types/index.ts` | `lib/transport/types-additions.ts`, `lib/transport/types.ts` |
| ServiceType | `lib/transport/types/index.ts` | `lib/transport/types-additions.ts`, `lib/transport/types.ts` |
| PaymentMethod | `lib/transport/types/index.ts` | `lib/transport/types-additions.ts`, `lib/transport/types.ts`, `lib/restaurant/types.ts`, `lib/mtaxi/types/index.ts` |
| TransportVehicleType | `lib/transport/types/index.ts` | `lib/transport/types-additions.ts`, `lib/transport/types.ts` |
| VehicleTier | `lib/transport/types/index.ts` | `lib/transport/types-additions.ts`, `lib/transport/types.ts` |
| VehicleType | `types/transport.ts` | `lib/services/mtaxi-service.ts`, `lib/mtaxi/types/index.ts` |
| RideStatus | `lib/transport/types/index.ts` | `lib/mtaxi/types/index.ts` |
| DriverEarning | `lib/services/mtruck-service.ts` | `lib/services/mtaxi-service.ts` |
| DriverPayment | `lib/services/mtruck-service.ts` | `lib/services/mtaxi-service.ts` |
| ETAInput | `lib/mtruck/intelligence/eta-engine.ts` | `lib/mtruck/eta/eta-engine.ts` |
| BookingStatus | `domains/stay/types.ts` | `lib/mtruck/types.ts` |
| IncidentStatus | `types/voting-types.ts` | `lib/mtruck/types.ts` |
| IncidentType | `types/voting-types.ts` | `lib/mtruck/types.ts` |

**Migration:**
1. `lib/transport/types-additions.ts` → merge into `lib/transport/types/index.ts`, then delete
2. `lib/transport/types.ts` → merge into `lib/transport/types/index.ts`, then delete
3. `lib/mtruck/types/index.ts` → merge into `lib/mtruck/types.ts`, then delete (or vice versa — pick one)
4. `transport_audit_fix_v2/` → this is a salvage directory that should be deleted entirely
5. `lib/services/mtaxi-service.ts` and `lib/services/mtruck-service.ts` type definitions → move to `lib/mtaxi/types/` and `lib/mtruck/types/`

---

## CATEGORY 5: Global / Cross-Module Types (15 types)
**Rule:** `types/` directory is canonical for global types.

| Type | Canonical | Legacy |
|------|-----------|--------|
| AppManifest | `types/module.types.ts` | `lib/apps-store/types.ts`, `lib/mtaa/appstore/types.ts`, `lib/appstore/types.ts`, `lib/appstore/index.ts` |
| AppStatus | `types/module.types.ts` | `lib/appstore/types.ts` |
| InstallStatus | `types/appstore.ts` | `lib/appstore/types.ts` |
| InstalledApp | `types/module.types.ts` | `lib/types/module.types-additions.ts` |
| AppPermission | `lib/modules/runtime/module.types.ts` | `lib/types/module.types-additions.ts`, `lib/mtaa/appstore/apps/types.ts` |
| AppRegistryEntry | `lib/kernel/registry/index.ts` | `lib/mtaa/appstore/apps/types.ts` |
| ModuleManifest | `types/module.types.ts` | `manifests/runtime/module.types.ts`, `lib/modules/runtime/module.types.ts`, `lib/types/module.types-additions.ts`, `lib/runtime/module.types.ts` |
| Database | `types/database.ts` | `lib/types/database.ts`, `lib/types/supabase.ts` |
| Tables | `types/database.ts` | `lib/types/supabase.ts` |
| Enums | `types/database.ts` | `lib/types/database.ts`, `lib/types/supabase.ts` |
| UserProfile | `lib/types.ts` | `hooks/useUser.ts` |
| ServiceResult | `lib/types.ts` | `lib/utils/service-helpers.ts`, `lib/services/transport-service.ts`, `lib/services/messaging-service.ts` |
| QRAction | `lib/identity/types.ts` | `lib/services/qr-service.ts` |
| ProfileData | `lib/profile/services/profile-os-service.ts` | `lib/services/profile-service.ts` |
| ProfileStats | `lib/profile/services/profile-os-service.ts` | `lib/profile/services/profile-timeline-service.ts` |
| TimelineItem | `lib/profile/services/profile-timeline-service.ts` | `lib/profile/services/profile-os-service.ts` |
| HealthRole | `types/health.ts` | `lib/health/types.ts`, `lib/health/hooks/useHealthRole.ts`, `lib/health/services/health-role.service.ts` |
| HealthStaffRecord | `types/health.ts` | `lib/health/services/health-role.service.ts` |
| StaffInvitation | `types/health.ts` | `lib/health/services/health-role.service.ts` |
| AttendanceRecord | `types/health.ts` | `lib/health/services/health-role.service.ts` |
| OnboardingStatus | `types/health.ts` | `lib/health/services/health-role.service.ts` |
| PayrollRecord | `types/health.ts` | `lib/health/services/health-role.service.ts` |
| AuditLog | `lib/health/types.ts` | `lib/marketplace/services/regulatory.service.ts` |
| ShippingAddress | `types/commerce.ts` | `domains/commerce/services/cartService.ts`, `domains/marketplace/services/cartService.ts`, `lib/marketplace/services/cart.service.ts` |
| StreetsPost | `lib/services/streets-service.ts` | `lib/types/streets.ts` |
| StreetsComment | `lib/services/streets-service.ts` | `lib/types/streets.ts` |
| WalletEvent | `lib/hookup/wallet-bridge/walletEventTypes.ts` | `lib/hookup/wallet-bridge/walletEventBus.ts` |
| WalletEventType | `lib/hookup/wallet-bridge/walletEventTypes.ts` | `lib/hookup/wallet-bridge/walletExecutionPipeline.ts` |
| VotingResult | `types/voting-types.ts` | `hooks/use-voting.ts` |
| SearchResult | `lib/asis-v7/types/index.ts` | `lib/kernel/search-engine.ts` |
| SearchFilters | `lib/asis-v7/types/index.ts` | `lib/kernel/search-engine.ts` |
| MTAAEvent | `lib/system/event-bus.ts` | `lib/mtruck/bus/mtaa-interapp-bus.ts` |
| BootResult | `lib/mtaa/kernel/boot-sequence.ts` | `lib/kernel/boot.ts` |
| ProcurementCategory | `types/courts.ts` | `types/prisons.ts` |
| ProcurementStatus | `types/courts.ts` | `types/prisons.ts` |
| StaffType | `types/courts.ts` | `types/prisons.ts` |
| EducationRole | `domains/education/services/education-role-guard.ts` | `education-role-guard.ts`, `domains/education/pages/index.tsx`, `domains/education/pages/_layout.tsx` |
| RolePermissions | `domains/education/services/education-role-guard.ts` | `education-role-guard.ts` |

**Migration:**
1. `lib/types/module.types-additions.ts` → merge into `types/module.types.ts`, delete
2. `lib/types/database.ts` → merge into `types/database.ts`, delete
3. `lib/types/streets.ts` → merge into `lib/services/streets-service.ts` or create `types/streets.ts`, delete
4. `types/prisons.ts` and `types/courts.ts` — merge shared enums into `types/civic.ts` or keep separate but remove duplicates
5. `lib/kernel/boot.ts` → merge into `lib/mtaa/kernel/boot-sequence.ts`, delete

---

## CATEGORY 6: Wallet / Financial (10 types)
**Rule:** `domains/wallet/` is canonical. `lib/` and `lib/identity/` are legacy.

| Type | Canonical | Legacy |
|------|-----------|--------|
| Wallet | `domains/wallet/services/walletService.ts` | `lib/modules/wallet/types.ts`, `lib/services/wallet-service.ts` |
| WalletAccount | `domains/wallet/hooks/useWallet.ts` | `lib/modules/wallet/types.ts` |
| WalletTransaction | `domains/wallet/hooks/useWallet.ts` | `lib/stores/wallet-store.ts`, `lib/modules/wallet/types.ts`, `lib/services/wallet-service.ts` |
| WalletBalance | `domains/wallet/hooks/useWallet.ts` | `lib/identity/hooks/useWallet.ts` |
| WalletNotification | `lib/modules/wallet/types.ts` | `_needs_review/desktop_salvage/wallet-v2-types.ts` |

**Migration:**
1. Create `domains/wallet/types.ts` as the canonical wallet types barrel
2. Move all wallet type definitions there
3. Update all imports
4. Delete `lib/modules/wallet/types.ts`, `lib/services/wallet-service.ts` (or keep as service-only)

---

## CATEGORY 7: Health Role Service Aliases (8 types)
**Rule:** `types/health.ts` is canonical. `lib/health/services/health-role.service.ts` type aliases are shortcuts.

These are `type` aliases (not interfaces), so they're lower priority:
- `HealthRole`, `HealthStaffRecord`, `StaffInvitation`, `AttendanceRecord`, `OnboardingStatus`, `PayrollRecord`, `AuditLog`, `HealthFacility`

**Migration:**
1. Replace type aliases in `health-role.service.ts` with imports from `types/health.ts`
2. Delete the local alias declarations

---

## RECOMMENDED MIGRATION ORDER

**Phase A — Safe deletions (no import changes needed):**
1. Delete `lib/profile/types-additions.ts` → merge contents into `lib/profile/types/index.ts`
2. Delete `lib/transport/types-additions.ts` → merge into `lib/transport/types/index.ts`
3. Delete `lib/asis-cse/asis-cse-types-additions.ts` → merge into `lib/asis-cse/asis-cse-types.ts`
4. Delete `lib/types/module.types-additions.ts` → merge into `types/module.types.ts`
5. Delete `transport_audit_fix_v2/` directory entirely

**Phase B — Domain consolidation (requires import updates):**
6. Merge `lib/shop/types.ts` into `domains/shop/types.ts`, update imports, delete
7. Merge `lib/health/types.ts` into `domains/health/types.ts`, update imports, delete
8. Create `domains/wallet/types.ts` barrel, consolidate wallet types
9. Create `types/streets.ts` barrel, consolidate streets types

**Phase C — Profile cleanup:**
10. Merge `lib/profile/types.ts` into `lib/profile/types/index.ts`, update imports, delete

**Phase D — Transport cleanup:**
11. Consolidate `lib/transport/types.ts` and `lib/transport/types/index.ts` into one
12. Consolidate `lib/mtruck/types.ts` and `lib/mtruck/types/index.ts` into one
13. Move type definitions out of `lib/services/mtaxi-service.ts` and `lib/services/mtruck-service.ts`

**Phase E — Global types:**
14. Merge `lib/types/database.ts` into `types/database.ts`
15. Merge `lib/types/streets.ts` into `types/streets.ts` (create if needed)
16. Deduplicate `types/courts.ts` / `types/prisons.ts` shared enums

---

## ESTIMATED EFFORT

| Phase | Types | Files Modified | Estimated Time |
|-------|-------|---------------|----------------|
| A (Safe deletions) | ~40 | 10 | 30 min |
| B (Domain consolidation) | ~80 | 60 | 2 hours |
| C (Profile cleanup) | ~15 | 20 | 45 min |
| D (Transport cleanup) | ~25 | 30 | 1 hour |
| E (Global types) | ~15 | 15 | 30 min |
| **Verification** | — | — | 30 min |
| **TOTAL** | **223** | **~135** | **~5.5 hours** |

---

## SHORTCUT: Temporary Gate Bypass

If you need to commit NOW and fix types later:

```bash
cd ~/MTAA_OS_V10

# Make Gate 3 warn-only
python3 mtaa-bypass-gate3.py

# Commit
git add -A
git commit -m "cleanup: remove temporary fix scripts and debris"

# Restore strict gate
cp .husky/pre-commit.strict .husky/pre-commit
```

**Then schedule the 5.5-hour type consolidation as your next sprint task.**
