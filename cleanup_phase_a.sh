#!/bin/bash
# MTAA OS Phase A Cleanup Script
# Run from project root: ~/MTAA_OS_V10

set -e

echo '=== MTAA OS Phase A: Cleanup ==='
echo 'This will delete old, duplicate, and temporary files.'
echo ''

# 1. Delete audit reports
echo '[1/8] Removing audit reports...'
rm -f ./audit/reports/auth-store-usage.txt
rm -f ./audit/reports/broken-files.txt
rm -f ./audit/reports/camera.txt
rm -f ./audit/reports/device.txt
rm -f ./audit/reports/empty-files.txt
rm -f ./audit/reports/filesystem.txt
rm -f ./audit/reports/maps.txt
rm -f ./audit/reports/native-imports.txt
rm -f ./audit/reports/native-routes.txt
rm -f ./audit/reports/qr.txt
rm -f ./audit/reports/small-files.txt
rm -f ./audit/reports/web-breakers.txt
rm -f ./audit/reports/webview.txt

# 2. Delete cleanup/fix scripts
echo '[2/8] Removing cleanup and fix scripts...'
rm -f ./_fix_expo_router.sh
rm -f ./cleanup_phase1.sh
rm -f ./deploy_messenger_calls_part1.sh
rm -f ./deploy_messenger_calls_part2.sh
rm -f ./scripts/cleanup-os.sh
rm -f ./scripts/kernel-type-repair.sh
rm -f ./scripts/remove-duplicates.sh
rm -f ./scripts/remove-stubs.sh

# 3. Delete old duplicate app folders (apps/ — domains/ is canonical)
echo '[3/8] Removing old app duplicates...'
rm -rf ./apps/appstore/asis/entry.ts
rm -rf ./apps/appstore/asis/evolution-controller.ts
rm -rf ./apps/marketplace/README.md
rm -rf ./apps/marketplace/escrow/escrow-engine.ts
rm -rf ./apps/marketplace/index.ts
rm -rf ./apps/marketplace/listings/listings-engine.ts
rm -rf ./apps/marketplace/orders/order-engine.ts
rm -rf ./apps/marketplace/pricing/market-pricing-engine.ts
rm -rf ./apps/marketplace/trust/trust-engine.ts
rm -rf ./apps/mtruck/README.md
rm -rf ./apps/mtruck/dispatch/freight-dispatch-engine.ts
rm -rf ./apps/mtruck/index.ts
rm -rf ./apps/mtruck/intelligence/fleet-brain.ts
rm -rf ./apps/mtruck/pricing/freight-pricing-engine.ts
rm -rf ./apps/shop/pages/cart.tsx
rm -rf ./apps/shop/pages/create.tsx
rm -rf ./apps/shop/pages/index.tsx
rm -rf ./apps/shop/pages/marketplace.tsx
rm -rf ./apps/shop/pages/orders.tsx
rm -rf ./apps/shop/pages/product-detail.tsx
rm -rf ./apps/streets/README.md
rm -rf ./apps/streets/feed/streets-feed.ts
rm -rf ./apps/streets/index.ts
rm -rf ./apps/streets/intelligence/streets-brain.ts
rm -rf ./apps/streets/maps/street-map-engine.ts
rm -rf ./apps/treasury/budget-planning/treasury-budget-planning/app/civic/treasury/budget/allocations/page.tsx
rm -rf ./apps/treasury/budget-planning/treasury-budget-planning/app/civic/treasury/budget/approvals/page.tsx
rm -rf ./apps/treasury/budget-planning/treasury-budget-planning/app/civic/treasury/budget/commitments/page.tsx
rm -rf ./apps/treasury/budget-planning/treasury-budget-planning/app/civic/treasury/budget/cycles/page.tsx
rm -rf ./apps/treasury/budget-planning/treasury-budget-planning/app/civic/treasury/budget/delegations/page.tsx
rm -rf ./apps/treasury/budget-planning/treasury-budget-planning/app/civic/treasury/budget/layout.tsx
rm -rf ./apps/treasury/budget-planning/treasury-budget-planning/app/civic/treasury/budget/page.tsx
rm -rf ./apps/treasury/budget-planning/treasury-budget-planning/app/civic/treasury/budget/warrants/page.tsx
rm -rf ./apps/treasury/budget-planning/treasury-budget-planning/core/api/allocations/route.ts
rm -rf ./apps/treasury/budget-planning/treasury-budget-planning/core/api/budget/route.ts
rm -rf ./apps/treasury/budget-planning/treasury-budget-planning/core/api/commitments/route.ts
rm -rf ./apps/treasury/budget-planning/treasury-budget-planning/core/api/warrants/route.ts
rm -rf ./apps/treasury/budget-planning/treasury-budget-planning/domains/civic/treasury/components/AllocationTable.tsx
rm -rf ./apps/treasury/budget-planning/treasury-budget-planning/domains/civic/treasury/components/ApprovalChain.tsx
rm -rf ./apps/treasury/budget-planning/treasury-budget-planning/domains/civic/treasury/components/BudgetShell.tsx
rm -rf ./apps/treasury/budget-planning/treasury-budget-planning/domains/civic/treasury/components/CommitmentTracker.tsx
rm -rf ./apps/treasury/budget-planning/treasury-budget-planning/domains/civic/treasury/components/CycleForm.tsx
rm -rf ./apps/treasury/budget-planning/treasury-budget-planning/domains/civic/treasury/components/CycleList.tsx
rm -rf ./apps/treasury/budget-planning/treasury-budget-planning/domains/civic/treasury/components/DelegationManager.tsx
rm -rf ./apps/treasury/budget-planning/treasury-budget-planning/domains/civic/treasury/components/WarrantCard.tsx
rm -rf ./apps/treasury/budget-planning/treasury-budget-planning/domains/civic/treasury/hooks/useAllocations.ts
rm -rf ./apps/treasury/budget-planning/treasury-budget-planning/domains/civic/treasury/hooks/useApprovals.ts
rm -rf ./apps/treasury/budget-planning/treasury-budget-planning/domains/civic/treasury/hooks/useBudgetCycles.ts
rm -rf ./apps/treasury/budget-planning/treasury-budget-planning/domains/civic/treasury/hooks/useCommitments.ts
rm -rf ./apps/treasury/budget-planning/treasury-budget-planning/domains/civic/treasury/hooks/useWarrants.ts
rm -rf ./apps/treasury/budget-planning/treasury-budget-planning/domains/civic/treasury/services/allocationService.ts
rm -rf ./apps/treasury/budget-planning/treasury-budget-planning/domains/civic/treasury/services/approvalService.ts
rm -rf ./apps/treasury/budget-planning/treasury-budget-planning/domains/civic/treasury/services/budgetCycleService.ts
rm -rf ./apps/treasury/budget-planning/treasury-budget-planning/domains/civic/treasury/services/commitmentService.ts
rm -rf ./apps/treasury/budget-planning/treasury-budget-planning/domains/civic/treasury/services/warrantService.ts
rm -rf ./apps/treasury/budget-planning/treasury-budget-planning/domains/civic/treasury/state/budgetStore.ts
rm -rf ./apps/treasury/budget-planning/treasury-budget-planning/domains/civic/treasury/types/budget.types.ts
rm -rf ./apps/treasury/budget-planning/treasury-budget-planning/lib/kernel/registry.ts
rm -rf ./apps/treasury/budget-planning/treasury-budget-planning/lib/supabase/client.ts
rm -rf ./apps/treasury/budget-planning/treasury-budget-planning/next.config.js
rm -rf ./apps/treasury/budget-planning/treasury-budget-planning/package.json
rm -rf ./apps/treasury/budget-planning/treasury-budget-planning/tailwind.config.ts
rm -rf ./apps/treasury/budget-planning/treasury-budget-planning/tsconfig.json
rm -rf ./apps/treasury/command-centre/treasury-command-centre/app/civic/treasury/audit/page.tsx
rm -rf ./apps/treasury/command-centre/treasury-command-centre/app/civic/treasury/budget/page.tsx
rm -rf ./apps/treasury/command-centre/treasury-command-centre/app/civic/treasury/debt-payroll/page.tsx
rm -rf ./apps/treasury/command-centre/treasury-command-centre/app/civic/treasury/feedback/page.tsx
rm -rf ./apps/treasury/command-centre/treasury-command-centre/app/civic/treasury/layout.tsx
rm -rf ./apps/treasury/command-centre/treasury-command-centre/app/civic/treasury/page.tsx
rm -rf ./apps/treasury/command-centre/treasury-command-centre/app/civic/treasury/payments/page.tsx
rm -rf ./apps/treasury/command-centre/treasury-command-centre/app/civic/treasury/procurement/page.tsx
rm -rf ./apps/treasury/command-centre/treasury-command-centre/app/civic/treasury/reports/page.tsx
rm -rf ./apps/treasury/command-centre/treasury-command-centre/core/api/audit/route.ts
rm -rf ./apps/treasury/command-centre/treasury-command-centre/core/api/dashboard/route.ts
rm -rf ./apps/treasury/command-centre/treasury-command-centre/core/api/feedback/route.ts
rm -rf ./apps/treasury/command-centre/treasury-command-centre/domains/civic/treasury/components/AlertPanel.tsx
rm -rf ./apps/treasury/command-centre/treasury-command-centre/domains/civic/treasury/components/AuditLogTable.tsx
rm -rf ./apps/treasury/command-centre/treasury-command-centre/domains/civic/treasury/components/CashFlowChart.tsx
rm -rf ./apps/treasury/command-centre/treasury-command-centre/domains/civic/treasury/components/CommandShell.tsx
rm -rf ./apps/treasury/command-centre/treasury-command-centre/domains/civic/treasury/components/FeedbackForm.tsx
rm -rf ./apps/treasury/command-centre/treasury-command-centre/domains/civic/treasury/components/KpiCards.tsx
rm -rf ./apps/treasury/command-centre/treasury-command-centre/domains/civic/treasury/components/TransactionFeed.tsx
rm -rf ./apps/treasury/command-centre/treasury-command-centre/domains/civic/treasury/hooks/useAlerts.ts
rm -rf ./apps/treasury/command-centre/treasury-command-centre/domains/civic/treasury/hooks/useAuditLogs.ts
rm -rf ./apps/treasury/command-centre/treasury-command-centre/domains/civic/treasury/hooks/useDashboard.ts
rm -rf ./apps/treasury/command-centre/treasury-command-centre/domains/civic/treasury/hooks/useFeedback.ts
rm -rf ./apps/treasury/command-centre/treasury-command-centre/domains/civic/treasury/services/auditService.ts
rm -rf ./apps/treasury/command-centre/treasury-command-centre/domains/civic/treasury/services/dashboardService.ts
rm -rf ./apps/treasury/command-centre/treasury-command-centre/domains/civic/treasury/services/feedbackService.ts
rm -rf ./apps/treasury/command-centre/treasury-command-centre/domains/civic/treasury/state/commandStore.ts
rm -rf ./apps/treasury/command-centre/treasury-command-centre/domains/civic/treasury/types/command.types.ts
rm -rf ./apps/treasury/command-centre/treasury-command-centre/lib/kernel/registry.ts
rm -rf ./apps/treasury/command-centre/treasury-command-centre/lib/supabase/client.ts
rm -rf ./apps/treasury/command-centre/treasury-command-centre/next.config.js
rm -rf ./apps/treasury/command-centre/treasury-command-centre/package.json
rm -rf ./apps/treasury/command-centre/treasury-command-centre/tailwind.config.ts
rm -rf ./apps/treasury/command-centre/treasury-command-centre/tsconfig.json
rm -rf ./apps/treasury/debt-payroll/treasury-debt-payroll/app/civic/treasury/debt-payroll/debt/page.tsx
rm -rf ./apps/treasury/debt-payroll/treasury-debt-payroll/app/civic/treasury/debt-payroll/forecasts/page.tsx
rm -rf ./apps/treasury/debt-payroll/treasury-debt-payroll/app/civic/treasury/debt-payroll/forecasts/revenue/page.tsx
rm -rf ./apps/treasury/debt-payroll/treasury-debt-payroll/app/civic/treasury/debt-payroll/layout.tsx
rm -rf ./apps/treasury/debt-payroll/treasury-debt-payroll/app/civic/treasury/debt-payroll/page.tsx
rm -rf ./apps/treasury/debt-payroll/treasury-debt-payroll/app/civic/treasury/debt-payroll/payroll/page.tsx
rm -rf ./apps/treasury/debt-payroll/treasury-debt-payroll/core/api/debt/route.ts
rm -rf ./apps/treasury/debt-payroll/treasury-debt-payroll/core/api/forecasts/route.ts
rm -rf ./apps/treasury/debt-payroll/treasury-debt-payroll/core/api/payroll/route.ts
rm -rf ./apps/treasury/debt-payroll/treasury-debt-payroll/domains/civic/treasury/components/BiometricVerifyBadge.tsx
rm -rf ./apps/treasury/debt-payroll/treasury-debt-payroll/domains/civic/treasury/components/CashForecastChart.tsx
rm -rf ./apps/treasury/debt-payroll/treasury-debt-payroll/domains/civic/treasury/components/DebtInstrumentCard.tsx
rm -rf ./apps/treasury/debt-payroll/treasury-debt-payroll/domains/civic/treasury/components/DebtPayrollShell.tsx
rm -rf ./apps/treasury/debt-payroll/treasury-debt-payroll/domains/civic/treasury/components/DebtServiceCalendar.tsx
rm -rf ./apps/treasury/debt-payroll/treasury-debt-payroll/domains/civic/treasury/components/ForecastModelBadge.tsx
rm -rf ./apps/treasury/debt-payroll/treasury-debt-payroll/domains/civic/treasury/components/MaturityAlert.tsx
rm -rf ./apps/treasury/debt-payroll/treasury-debt-payroll/domains/civic/treasury/components/PayrollCycleForm.tsx
rm -rf ./apps/treasury/debt-payroll/treasury-debt-payroll/domains/civic/treasury/components/PayrollEntryTable.tsx
rm -rf ./apps/treasury/debt-payroll/treasury-debt-payroll/domains/civic/treasury/components/PayslipGenerator.tsx
rm -rf ./apps/treasury/debt-payroll/treasury-debt-payroll/domains/civic/treasury/components/VarianceIndicator.tsx
rm -rf ./apps/treasury/debt-payroll/treasury-debt-payroll/domains/civic/treasury/hooks/useCashForecasts.ts
rm -rf ./apps/treasury/debt-payroll/treasury-debt-payroll/domains/civic/treasury/hooks/useDebtInstruments.ts
rm -rf ./apps/treasury/debt-payroll/treasury-debt-payroll/domains/civic/treasury/hooks/useDebtPayments.ts
rm -rf ./apps/treasury/debt-payroll/treasury-debt-payroll/domains/civic/treasury/hooks/usePayrollCycles.ts
rm -rf ./apps/treasury/debt-payroll/treasury-debt-payroll/domains/civic/treasury/hooks/usePayrollEntries.ts
rm -rf ./apps/treasury/debt-payroll/treasury-debt-payroll/domains/civic/treasury/hooks/useRevenueForecasts.ts
rm -rf ./apps/treasury/debt-payroll/treasury-debt-payroll/domains/civic/treasury/services/cashForecastService.ts
rm -rf ./apps/treasury/debt-payroll/treasury-debt-payroll/domains/civic/treasury/services/debtInstrumentService.ts
rm -rf ./apps/treasury/debt-payroll/treasury-debt-payroll/domains/civic/treasury/services/debtPaymentService.ts
rm -rf ./apps/treasury/debt-payroll/treasury-debt-payroll/domains/civic/treasury/services/payrollCycleService.ts
rm -rf ./apps/treasury/debt-payroll/treasury-debt-payroll/domains/civic/treasury/services/payrollEntryService.ts
rm -rf ./apps/treasury/debt-payroll/treasury-debt-payroll/domains/civic/treasury/services/revenueForecastService.ts
rm -rf ./apps/treasury/debt-payroll/treasury-debt-payroll/domains/civic/treasury/state/debtPayrollStore.ts
rm -rf ./apps/treasury/debt-payroll/treasury-debt-payroll/domains/civic/treasury/types/debtPayroll.types.ts
rm -rf ./apps/treasury/debt-payroll/treasury-debt-payroll/lib/kernel/registry.ts
rm -rf ./apps/treasury/debt-payroll/treasury-debt-payroll/lib/supabase/client.ts
rm -rf ./apps/treasury/debt-payroll/treasury-debt-payroll/next.config.js
rm -rf ./apps/treasury/debt-payroll/treasury-debt-payroll/package.json
rm -rf ./apps/treasury/debt-payroll/treasury-debt-payroll/tailwind.config.ts
rm -rf ./apps/treasury/debt-payroll/treasury-debt-payroll/tsconfig.json
rm -rf ./apps/treasury/payments-cash/treasury-payments-cash/app/civic/treasury/payments/expenditures/page.tsx
rm -rf ./apps/treasury/payments-cash/treasury-payments-cash/app/civic/treasury/payments/layout.tsx
rm -rf ./apps/treasury/payments-cash/treasury-payments-cash/app/civic/treasury/payments/page.tsx
rm -rf ./apps/treasury/payments-cash/treasury-payments-cash/app/civic/treasury/payments/reconciliation/page.tsx
rm -rf ./apps/treasury/payments-cash/treasury-payments-cash/app/civic/treasury/payments/revenue/page.tsx
rm -rf ./apps/treasury/payments-cash/treasury-payments-cash/app/civic/treasury/payments/smart-contracts/page.tsx
rm -rf ./apps/treasury/payments-cash/treasury-payments-cash/app/civic/treasury/payments/tsa/page.tsx
rm -rf ./apps/treasury/payments-cash/treasury-payments-cash/core/api/expenditures/route.ts
rm -rf ./apps/treasury/payments-cash/treasury-payments-cash/core/api/reconciliation/route.ts
rm -rf ./apps/treasury/payments-cash/treasury-payments-cash/core/api/revenue/route.ts
rm -rf ./apps/treasury/payments-cash/treasury-payments-cash/core/api/tsa/route.ts
rm -rf ./apps/treasury/payments-cash/treasury-payments-cash/domains/civic/treasury/components/AiAnomalyBadge.tsx
rm -rf ./apps/treasury/payments-cash/treasury-payments-cash/domains/civic/treasury/components/BlockchainStatus.tsx
rm -rf ./apps/treasury/payments-cash/treasury-payments-cash/domains/civic/treasury/components/PaymentProcessor.tsx
rm -rf ./apps/treasury/payments-cash/treasury-payments-cash/domains/civic/treasury/components/PaymentsShell.tsx
rm -rf ./apps/treasury/payments-cash/treasury-payments-cash/domains/civic/treasury/components/ReconciliationMatcher.tsx
rm -rf ./apps/treasury/payments-cash/treasury-payments-cash/domains/civic/treasury/components/RevenueCollector.tsx
rm -rf ./apps/treasury/payments-cash/treasury-payments-cash/domains/civic/treasury/components/SmartContractDeployer.tsx
rm -rf ./apps/treasury/payments-cash/treasury-payments-cash/domains/civic/treasury/components/TransactionLedger.tsx
rm -rf ./apps/treasury/payments-cash/treasury-payments-cash/domains/civic/treasury/components/TsaAccountCard.tsx
rm -rf ./apps/treasury/payments-cash/treasury-payments-cash/domains/civic/treasury/components/VoucherForm.tsx
rm -rf ./apps/treasury/payments-cash/treasury-payments-cash/domains/civic/treasury/hooks/useBankReconciliations.ts
rm -rf ./apps/treasury/payments-cash/treasury-payments-cash/domains/civic/treasury/hooks/useExpenditures.ts
rm -rf ./apps/treasury/payments-cash/treasury-payments-cash/domains/civic/treasury/hooks/useRevenueCollections.ts
rm -rf ./apps/treasury/payments-cash/treasury-payments-cash/domains/civic/treasury/hooks/useSmartContracts.ts
rm -rf ./apps/treasury/payments-cash/treasury-payments-cash/domains/civic/treasury/hooks/useTsaAccounts.ts
rm -rf ./apps/treasury/payments-cash/treasury-payments-cash/domains/civic/treasury/hooks/useTsaTransactions.ts
rm -rf ./apps/treasury/payments-cash/treasury-payments-cash/domains/civic/treasury/services/expenditureService.ts
rm -rf ./apps/treasury/payments-cash/treasury-payments-cash/domains/civic/treasury/services/reconciliationService.ts
rm -rf ./apps/treasury/payments-cash/treasury-payments-cash/domains/civic/treasury/services/revenueService.ts
rm -rf ./apps/treasury/payments-cash/treasury-payments-cash/domains/civic/treasury/services/smartContractService.ts
rm -rf ./apps/treasury/payments-cash/treasury-payments-cash/domains/civic/treasury/services/tsaService.ts
rm -rf ./apps/treasury/payments-cash/treasury-payments-cash/domains/civic/treasury/state/paymentsStore.ts
rm -rf ./apps/treasury/payments-cash/treasury-payments-cash/domains/civic/treasury/types/payments.types.ts
rm -rf ./apps/treasury/payments-cash/treasury-payments-cash/lib/kernel/registry.ts
rm -rf ./apps/treasury/payments-cash/treasury-payments-cash/lib/supabase/client.ts
rm -rf ./apps/treasury/payments-cash/treasury-payments-cash/next.config.js
rm -rf ./apps/treasury/payments-cash/treasury-payments-cash/package.json
rm -rf ./apps/treasury/payments-cash/treasury-payments-cash/tailwind.config.ts
rm -rf ./apps/treasury/payments-cash/treasury-payments-cash/tsconfig.json
rm -rf ./apps/treasury/procurement-assets/treasury-procurement-assets/app/civic/treasury/procurement/assets/page.tsx
rm -rf ./apps/treasury/procurement-assets/treasury-procurement-assets/app/civic/treasury/procurement/contracts/page.tsx
rm -rf ./apps/treasury/procurement-assets/treasury-procurement-assets/app/civic/treasury/procurement/layout.tsx
rm -rf ./apps/treasury/procurement-assets/treasury-procurement-assets/app/civic/treasury/procurement/page.tsx
rm -rf ./apps/treasury/procurement-assets/treasury-procurement-assets/app/civic/treasury/procurement/requisitions/page.tsx
rm -rf ./apps/treasury/procurement-assets/treasury-procurement-assets/app/civic/treasury/procurement/tenders/page.tsx
rm -rf ./apps/treasury/procurement-assets/treasury-procurement-assets/core/api/assets/route.ts
rm -rf ./apps/treasury/procurement-assets/treasury-procurement-assets/core/api/contracts/route.ts
rm -rf ./apps/treasury/procurement-assets/treasury-procurement-assets/core/api/requisitions/route.ts
rm -rf ./apps/treasury/procurement-assets/treasury-procurement-assets/core/api/tenders/route.ts
rm -rf ./apps/treasury/procurement-assets/treasury-procurement-assets/domains/civic/treasury/components/AssetRegister.tsx
rm -rf ./apps/treasury/procurement-assets/treasury-procurement-assets/domains/civic/treasury/components/BidCounter.tsx
rm -rf ./apps/treasury/procurement-assets/treasury-procurement-assets/domains/civic/treasury/components/ConditionBadge.tsx
rm -rf ./apps/treasury/procurement-assets/treasury-procurement-assets/domains/civic/treasury/components/ContractAwarder.tsx
rm -rf ./apps/treasury/procurement-assets/treasury-procurement-assets/domains/civic/treasury/components/CustodyTransfer.tsx
rm -rf ./apps/treasury/procurement-assets/treasury-procurement-assets/domains/civic/treasury/components/DepreciationChart.tsx
rm -rf ./apps/treasury/procurement-assets/treasury-procurement-assets/domains/civic/treasury/components/MilestoneTracker.tsx
rm -rf ./apps/treasury/procurement-assets/treasury-procurement-assets/domains/civic/treasury/components/PerformanceRating.tsx
rm -rf ./apps/treasury/procurement-assets/treasury-procurement-assets/domains/civic/treasury/components/ProcurementShell.tsx
rm -rf ./apps/treasury/procurement-assets/treasury-procurement-assets/domains/civic/treasury/components/QrCodeDisplay.tsx
rm -rf ./apps/treasury/procurement-assets/treasury-procurement-assets/domains/civic/treasury/components/RequisitionForm.tsx
rm -rf ./apps/treasury/procurement-assets/treasury-procurement-assets/domains/civic/treasury/components/TenderBoard.tsx
rm -rf ./apps/treasury/procurement-assets/treasury-procurement-assets/domains/civic/treasury/components/UrgencyBadge.tsx
rm -rf ./apps/treasury/procurement-assets/treasury-procurement-assets/domains/civic/treasury/hooks/useAssets.ts
rm -rf ./apps/treasury/procurement-assets/treasury-procurement-assets/domains/civic/treasury/hooks/useContracts.ts
rm -rf ./apps/treasury/procurement-assets/treasury-procurement-assets/domains/civic/treasury/hooks/useRequisitions.ts
rm -rf ./apps/treasury/procurement-assets/treasury-procurement-assets/domains/civic/treasury/hooks/useTenders.ts
rm -rf ./apps/treasury/procurement-assets/treasury-procurement-assets/domains/civic/treasury/services/assetService.ts
rm -rf ./apps/treasury/procurement-assets/treasury-procurement-assets/domains/civic/treasury/services/contractService.ts
rm -rf ./apps/treasury/procurement-assets/treasury-procurement-assets/domains/civic/treasury/services/requisitionService.ts
rm -rf ./apps/treasury/procurement-assets/treasury-procurement-assets/domains/civic/treasury/services/tenderService.ts
rm -rf ./apps/treasury/procurement-assets/treasury-procurement-assets/domains/civic/treasury/state/procurementStore.ts
rm -rf ./apps/treasury/procurement-assets/treasury-procurement-assets/domains/civic/treasury/types/procurement.types.ts
rm -rf ./apps/treasury/procurement-assets/treasury-procurement-assets/lib/kernel/registry.ts
rm -rf ./apps/treasury/procurement-assets/treasury-procurement-assets/lib/supabase/client.ts
rm -rf ./apps/treasury/procurement-assets/treasury-procurement-assets/next.config.js
rm -rf ./apps/treasury/procurement-assets/treasury-procurement-assets/package.json
rm -rf ./apps/treasury/procurement-assets/treasury-procurement-assets/tailwind.config.ts
rm -rf ./apps/treasury/procurement-assets/treasury-procurement-assets/tsconfig.json

# 4. Delete old shop_module folder
echo '[4/8] Removing old shop_module...'
rm -rf ./shop_module/AccountingDashboard.tsx
rm -rf ./shop_module/AffiliateManager.tsx
rm -rf ./shop_module/CustomerChat.tsx
rm -rf ./shop_module/INSTALL.md
rm -rf ./shop_module/MarketplaceBrowser.tsx
rm -rf ./shop_module/OrderManager.tsx
rm -rf ./shop_module/POSScreen.tsx
rm -rf ./shop_module/ProductManager.tsx
rm -rf ./shop_module/ShopDashboard.tsx
rm -rf ./shop_module/ShopQuickAccess.tsx
rm -rf ./shop_module/accountingService.ts
rm -rf ./shop_module/affiliateService.ts
rm -rf ./shop_module/cart_screen.tsx
rm -rf ./shop_module/marketplace_index.tsx
rm -rf ./shop_module/my_orders.tsx
rm -rf ./shop_module/product_detail.tsx
rm -rf ./shop_module/shop-accounting-sync.ts
rm -rf ./shop_module/shop-create-order.ts
rm -rf ./shop_module/shop-escrow-release.ts
rm -rf ./shop_module/shop-marketplace-sync.ts
rm -rf ./shop_module/shop-pos-scan.ts
rm -rf ./shop_module/shopRegistry.ts
rm -rf ./shop_module/shopService.ts
rm -rf ./shop_module/shopStore.ts
rm -rf ./shop_module/shop_create.tsx
rm -rf ./shop_module/shop_index.tsx
rm -rf ./shop_module/shop_module_schema.sql
rm -rf ./shop_module/shop_types.ts
rm -rf ./shop_module/useMarketplace.ts
rm -rf ./shop_module/useShop.ts

# 5. Delete old treasury apps
echo '[5/8] Removing old treasury apps...'
rm -rf ./apps/treasury/budget-planning/treasury-budget-planning/app/civic/treasury/budget/allocations/page.tsx
rm -rf ./apps/treasury/budget-planning/treasury-budget-planning/app/civic/treasury/budget/approvals/page.tsx
rm -rf ./apps/treasury/budget-planning/treasury-budget-planning/app/civic/treasury/budget/commitments/page.tsx
rm -rf ./apps/treasury/budget-planning/treasury-budget-planning/app/civic/treasury/budget/cycles/page.tsx
rm -rf ./apps/treasury/budget-planning/treasury-budget-planning/app/civic/treasury/budget/delegations/page.tsx
rm -rf ./apps/treasury/budget-planning/treasury-budget-planning/app/civic/treasury/budget/layout.tsx
rm -rf ./apps/treasury/budget-planning/treasury-budget-planning/app/civic/treasury/budget/page.tsx
rm -rf ./apps/treasury/budget-planning/treasury-budget-planning/app/civic/treasury/budget/warrants/page.tsx
rm -rf ./apps/treasury/budget-planning/treasury-budget-planning/core/api/allocations/route.ts
rm -rf ./apps/treasury/budget-planning/treasury-budget-planning/core/api/budget/route.ts
rm -rf ./apps/treasury/budget-planning/treasury-budget-planning/core/api/commitments/route.ts
rm -rf ./apps/treasury/budget-planning/treasury-budget-planning/core/api/warrants/route.ts
rm -rf ./apps/treasury/budget-planning/treasury-budget-planning/domains/civic/treasury/components/AllocationTable.tsx
rm -rf ./apps/treasury/budget-planning/treasury-budget-planning/domains/civic/treasury/components/ApprovalChain.tsx
rm -rf ./apps/treasury/budget-planning/treasury-budget-planning/domains/civic/treasury/components/BudgetShell.tsx
rm -rf ./apps/treasury/budget-planning/treasury-budget-planning/domains/civic/treasury/components/CommitmentTracker.tsx
rm -rf ./apps/treasury/budget-planning/treasury-budget-planning/domains/civic/treasury/components/CycleForm.tsx
rm -rf ./apps/treasury/budget-planning/treasury-budget-planning/domains/civic/treasury/components/CycleList.tsx
rm -rf ./apps/treasury/budget-planning/treasury-budget-planning/domains/civic/treasury/components/DelegationManager.tsx
rm -rf ./apps/treasury/budget-planning/treasury-budget-planning/domains/civic/treasury/components/WarrantCard.tsx
rm -rf ./apps/treasury/budget-planning/treasury-budget-planning/domains/civic/treasury/hooks/useAllocations.ts
rm -rf ./apps/treasury/budget-planning/treasury-budget-planning/domains/civic/treasury/hooks/useApprovals.ts
rm -rf ./apps/treasury/budget-planning/treasury-budget-planning/domains/civic/treasury/hooks/useBudgetCycles.ts
rm -rf ./apps/treasury/budget-planning/treasury-budget-planning/domains/civic/treasury/hooks/useCommitments.ts
rm -rf ./apps/treasury/budget-planning/treasury-budget-planning/domains/civic/treasury/hooks/useWarrants.ts
rm -rf ./apps/treasury/budget-planning/treasury-budget-planning/domains/civic/treasury/services/allocationService.ts
rm -rf ./apps/treasury/budget-planning/treasury-budget-planning/domains/civic/treasury/services/approvalService.ts
rm -rf ./apps/treasury/budget-planning/treasury-budget-planning/domains/civic/treasury/services/budgetCycleService.ts
rm -rf ./apps/treasury/budget-planning/treasury-budget-planning/domains/civic/treasury/services/commitmentService.ts
rm -rf ./apps/treasury/budget-planning/treasury-budget-planning/domains/civic/treasury/services/warrantService.ts
rm -rf ./apps/treasury/budget-planning/treasury-budget-planning/domains/civic/treasury/state/budgetStore.ts
rm -rf ./apps/treasury/budget-planning/treasury-budget-planning/domains/civic/treasury/types/budget.types.ts
rm -rf ./apps/treasury/budget-planning/treasury-budget-planning/lib/kernel/registry.ts
rm -rf ./apps/treasury/budget-planning/treasury-budget-planning/lib/supabase/client.ts
rm -rf ./apps/treasury/budget-planning/treasury-budget-planning/next.config.js
rm -rf ./apps/treasury/budget-planning/treasury-budget-planning/package.json
rm -rf ./apps/treasury/budget-planning/treasury-budget-planning/tailwind.config.ts
rm -rf ./apps/treasury/budget-planning/treasury-budget-planning/tsconfig.json
rm -rf ./apps/treasury/command-centre/treasury-command-centre/app/civic/treasury/audit/page.tsx
rm -rf ./apps/treasury/command-centre/treasury-command-centre/app/civic/treasury/budget/page.tsx
rm -rf ./apps/treasury/command-centre/treasury-command-centre/app/civic/treasury/debt-payroll/page.tsx
rm -rf ./apps/treasury/command-centre/treasury-command-centre/app/civic/treasury/feedback/page.tsx
rm -rf ./apps/treasury/command-centre/treasury-command-centre/app/civic/treasury/layout.tsx
rm -rf ./apps/treasury/command-centre/treasury-command-centre/app/civic/treasury/page.tsx
rm -rf ./apps/treasury/command-centre/treasury-command-centre/app/civic/treasury/payments/page.tsx
rm -rf ./apps/treasury/command-centre/treasury-command-centre/app/civic/treasury/procurement/page.tsx
rm -rf ./apps/treasury/command-centre/treasury-command-centre/app/civic/treasury/reports/page.tsx
rm -rf ./apps/treasury/command-centre/treasury-command-centre/core/api/audit/route.ts
rm -rf ./apps/treasury/command-centre/treasury-command-centre/core/api/dashboard/route.ts
rm -rf ./apps/treasury/command-centre/treasury-command-centre/core/api/feedback/route.ts
rm -rf ./apps/treasury/command-centre/treasury-command-centre/domains/civic/treasury/components/AlertPanel.tsx
rm -rf ./apps/treasury/command-centre/treasury-command-centre/domains/civic/treasury/components/AuditLogTable.tsx
rm -rf ./apps/treasury/command-centre/treasury-command-centre/domains/civic/treasury/components/CashFlowChart.tsx
rm -rf ./apps/treasury/command-centre/treasury-command-centre/domains/civic/treasury/components/CommandShell.tsx
rm -rf ./apps/treasury/command-centre/treasury-command-centre/domains/civic/treasury/components/FeedbackForm.tsx
rm -rf ./apps/treasury/command-centre/treasury-command-centre/domains/civic/treasury/components/KpiCards.tsx
rm -rf ./apps/treasury/command-centre/treasury-command-centre/domains/civic/treasury/components/TransactionFeed.tsx
rm -rf ./apps/treasury/command-centre/treasury-command-centre/domains/civic/treasury/hooks/useAlerts.ts
rm -rf ./apps/treasury/command-centre/treasury-command-centre/domains/civic/treasury/hooks/useAuditLogs.ts
rm -rf ./apps/treasury/command-centre/treasury-command-centre/domains/civic/treasury/hooks/useDashboard.ts
rm -rf ./apps/treasury/command-centre/treasury-command-centre/domains/civic/treasury/hooks/useFeedback.ts
rm -rf ./apps/treasury/command-centre/treasury-command-centre/domains/civic/treasury/services/auditService.ts
rm -rf ./apps/treasury/command-centre/treasury-command-centre/domains/civic/treasury/services/dashboardService.ts
rm -rf ./apps/treasury/command-centre/treasury-command-centre/domains/civic/treasury/services/feedbackService.ts
rm -rf ./apps/treasury/command-centre/treasury-command-centre/domains/civic/treasury/state/commandStore.ts
rm -rf ./apps/treasury/command-centre/treasury-command-centre/domains/civic/treasury/types/command.types.ts
rm -rf ./apps/treasury/command-centre/treasury-command-centre/lib/kernel/registry.ts
rm -rf ./apps/treasury/command-centre/treasury-command-centre/lib/supabase/client.ts
rm -rf ./apps/treasury/command-centre/treasury-command-centre/next.config.js
rm -rf ./apps/treasury/command-centre/treasury-command-centre/package.json
rm -rf ./apps/treasury/command-centre/treasury-command-centre/tailwind.config.ts
rm -rf ./apps/treasury/command-centre/treasury-command-centre/tsconfig.json
rm -rf ./apps/treasury/debt-payroll/treasury-debt-payroll/app/civic/treasury/debt-payroll/debt/page.tsx
rm -rf ./apps/treasury/debt-payroll/treasury-debt-payroll/app/civic/treasury/debt-payroll/forecasts/page.tsx
rm -rf ./apps/treasury/debt-payroll/treasury-debt-payroll/app/civic/treasury/debt-payroll/forecasts/revenue/page.tsx
rm -rf ./apps/treasury/debt-payroll/treasury-debt-payroll/app/civic/treasury/debt-payroll/layout.tsx
rm -rf ./apps/treasury/debt-payroll/treasury-debt-payroll/app/civic/treasury/debt-payroll/page.tsx
rm -rf ./apps/treasury/debt-payroll/treasury-debt-payroll/app/civic/treasury/debt-payroll/payroll/page.tsx
rm -rf ./apps/treasury/debt-payroll/treasury-debt-payroll/core/api/debt/route.ts
rm -rf ./apps/treasury/debt-payroll/treasury-debt-payroll/core/api/forecasts/route.ts
rm -rf ./apps/treasury/debt-payroll/treasury-debt-payroll/core/api/payroll/route.ts
rm -rf ./apps/treasury/debt-payroll/treasury-debt-payroll/domains/civic/treasury/components/BiometricVerifyBadge.tsx
rm -rf ./apps/treasury/debt-payroll/treasury-debt-payroll/domains/civic/treasury/components/CashForecastChart.tsx
rm -rf ./apps/treasury/debt-payroll/treasury-debt-payroll/domains/civic/treasury/components/DebtInstrumentCard.tsx
rm -rf ./apps/treasury/debt-payroll/treasury-debt-payroll/domains/civic/treasury/components/DebtPayrollShell.tsx
rm -rf ./apps/treasury/debt-payroll/treasury-debt-payroll/domains/civic/treasury/components/DebtServiceCalendar.tsx
rm -rf ./apps/treasury/debt-payroll/treasury-debt-payroll/domains/civic/treasury/components/ForecastModelBadge.tsx
rm -rf ./apps/treasury/debt-payroll/treasury-debt-payroll/domains/civic/treasury/components/MaturityAlert.tsx
rm -rf ./apps/treasury/debt-payroll/treasury-debt-payroll/domains/civic/treasury/components/PayrollCycleForm.tsx
rm -rf ./apps/treasury/debt-payroll/treasury-debt-payroll/domains/civic/treasury/components/PayrollEntryTable.tsx
rm -rf ./apps/treasury/debt-payroll/treasury-debt-payroll/domains/civic/treasury/components/PayslipGenerator.tsx
rm -rf ./apps/treasury/debt-payroll/treasury-debt-payroll/domains/civic/treasury/components/VarianceIndicator.tsx
rm -rf ./apps/treasury/debt-payroll/treasury-debt-payroll/domains/civic/treasury/hooks/useCashForecasts.ts
rm -rf ./apps/treasury/debt-payroll/treasury-debt-payroll/domains/civic/treasury/hooks/useDebtInstruments.ts
rm -rf ./apps/treasury/debt-payroll/treasury-debt-payroll/domains/civic/treasury/hooks/useDebtPayments.ts
rm -rf ./apps/treasury/debt-payroll/treasury-debt-payroll/domains/civic/treasury/hooks/usePayrollCycles.ts
rm -rf ./apps/treasury/debt-payroll/treasury-debt-payroll/domains/civic/treasury/hooks/usePayrollEntries.ts
rm -rf ./apps/treasury/debt-payroll/treasury-debt-payroll/domains/civic/treasury/hooks/useRevenueForecasts.ts
rm -rf ./apps/treasury/debt-payroll/treasury-debt-payroll/domains/civic/treasury/services/cashForecastService.ts
rm -rf ./apps/treasury/debt-payroll/treasury-debt-payroll/domains/civic/treasury/services/debtInstrumentService.ts
rm -rf ./apps/treasury/debt-payroll/treasury-debt-payroll/domains/civic/treasury/services/debtPaymentService.ts
rm -rf ./apps/treasury/debt-payroll/treasury-debt-payroll/domains/civic/treasury/services/payrollCycleService.ts
rm -rf ./apps/treasury/debt-payroll/treasury-debt-payroll/domains/civic/treasury/services/payrollEntryService.ts
rm -rf ./apps/treasury/debt-payroll/treasury-debt-payroll/domains/civic/treasury/services/revenueForecastService.ts
rm -rf ./apps/treasury/debt-payroll/treasury-debt-payroll/domains/civic/treasury/state/debtPayrollStore.ts
rm -rf ./apps/treasury/debt-payroll/treasury-debt-payroll/domains/civic/treasury/types/debtPayroll.types.ts
rm -rf ./apps/treasury/debt-payroll/treasury-debt-payroll/lib/kernel/registry.ts
rm -rf ./apps/treasury/debt-payroll/treasury-debt-payroll/lib/supabase/client.ts
rm -rf ./apps/treasury/debt-payroll/treasury-debt-payroll/next.config.js
rm -rf ./apps/treasury/debt-payroll/treasury-debt-payroll/package.json
rm -rf ./apps/treasury/debt-payroll/treasury-debt-payroll/tailwind.config.ts
rm -rf ./apps/treasury/debt-payroll/treasury-debt-payroll/tsconfig.json
rm -rf ./apps/treasury/payments-cash/treasury-payments-cash/app/civic/treasury/payments/expenditures/page.tsx
rm -rf ./apps/treasury/payments-cash/treasury-payments-cash/app/civic/treasury/payments/layout.tsx
rm -rf ./apps/treasury/payments-cash/treasury-payments-cash/app/civic/treasury/payments/page.tsx
rm -rf ./apps/treasury/payments-cash/treasury-payments-cash/app/civic/treasury/payments/reconciliation/page.tsx
rm -rf ./apps/treasury/payments-cash/treasury-payments-cash/app/civic/treasury/payments/revenue/page.tsx
rm -rf ./apps/treasury/payments-cash/treasury-payments-cash/app/civic/treasury/payments/smart-contracts/page.tsx
rm -rf ./apps/treasury/payments-cash/treasury-payments-cash/app/civic/treasury/payments/tsa/page.tsx
rm -rf ./apps/treasury/payments-cash/treasury-payments-cash/core/api/expenditures/route.ts
rm -rf ./apps/treasury/payments-cash/treasury-payments-cash/core/api/reconciliation/route.ts
rm -rf ./apps/treasury/payments-cash/treasury-payments-cash/core/api/revenue/route.ts
rm -rf ./apps/treasury/payments-cash/treasury-payments-cash/core/api/tsa/route.ts
rm -rf ./apps/treasury/payments-cash/treasury-payments-cash/domains/civic/treasury/components/AiAnomalyBadge.tsx
rm -rf ./apps/treasury/payments-cash/treasury-payments-cash/domains/civic/treasury/components/BlockchainStatus.tsx
rm -rf ./apps/treasury/payments-cash/treasury-payments-cash/domains/civic/treasury/components/PaymentProcessor.tsx
rm -rf ./apps/treasury/payments-cash/treasury-payments-cash/domains/civic/treasury/components/PaymentsShell.tsx
rm -rf ./apps/treasury/payments-cash/treasury-payments-cash/domains/civic/treasury/components/ReconciliationMatcher.tsx
rm -rf ./apps/treasury/payments-cash/treasury-payments-cash/domains/civic/treasury/components/RevenueCollector.tsx
rm -rf ./apps/treasury/payments-cash/treasury-payments-cash/domains/civic/treasury/components/SmartContractDeployer.tsx
rm -rf ./apps/treasury/payments-cash/treasury-payments-cash/domains/civic/treasury/components/TransactionLedger.tsx
rm -rf ./apps/treasury/payments-cash/treasury-payments-cash/domains/civic/treasury/components/TsaAccountCard.tsx
rm -rf ./apps/treasury/payments-cash/treasury-payments-cash/domains/civic/treasury/components/VoucherForm.tsx
rm -rf ./apps/treasury/payments-cash/treasury-payments-cash/domains/civic/treasury/hooks/useBankReconciliations.ts
rm -rf ./apps/treasury/payments-cash/treasury-payments-cash/domains/civic/treasury/hooks/useExpenditures.ts
rm -rf ./apps/treasury/payments-cash/treasury-payments-cash/domains/civic/treasury/hooks/useRevenueCollections.ts
rm -rf ./apps/treasury/payments-cash/treasury-payments-cash/domains/civic/treasury/hooks/useSmartContracts.ts
rm -rf ./apps/treasury/payments-cash/treasury-payments-cash/domains/civic/treasury/hooks/useTsaAccounts.ts
rm -rf ./apps/treasury/payments-cash/treasury-payments-cash/domains/civic/treasury/hooks/useTsaTransactions.ts
rm -rf ./apps/treasury/payments-cash/treasury-payments-cash/domains/civic/treasury/services/expenditureService.ts
rm -rf ./apps/treasury/payments-cash/treasury-payments-cash/domains/civic/treasury/services/reconciliationService.ts
rm -rf ./apps/treasury/payments-cash/treasury-payments-cash/domains/civic/treasury/services/revenueService.ts
rm -rf ./apps/treasury/payments-cash/treasury-payments-cash/domains/civic/treasury/services/smartContractService.ts
rm -rf ./apps/treasury/payments-cash/treasury-payments-cash/domains/civic/treasury/services/tsaService.ts
rm -rf ./apps/treasury/payments-cash/treasury-payments-cash/domains/civic/treasury/state/paymentsStore.ts
rm -rf ./apps/treasury/payments-cash/treasury-payments-cash/domains/civic/treasury/types/payments.types.ts
rm -rf ./apps/treasury/payments-cash/treasury-payments-cash/lib/kernel/registry.ts
rm -rf ./apps/treasury/payments-cash/treasury-payments-cash/lib/supabase/client.ts
rm -rf ./apps/treasury/payments-cash/treasury-payments-cash/next.config.js
rm -rf ./apps/treasury/payments-cash/treasury-payments-cash/package.json
rm -rf ./apps/treasury/payments-cash/treasury-payments-cash/tailwind.config.ts
rm -rf ./apps/treasury/payments-cash/treasury-payments-cash/tsconfig.json
rm -rf ./apps/treasury/procurement-assets/treasury-procurement-assets/app/civic/treasury/procurement/assets/page.tsx
rm -rf ./apps/treasury/procurement-assets/treasury-procurement-assets/app/civic/treasury/procurement/contracts/page.tsx
rm -rf ./apps/treasury/procurement-assets/treasury-procurement-assets/app/civic/treasury/procurement/layout.tsx
rm -rf ./apps/treasury/procurement-assets/treasury-procurement-assets/app/civic/treasury/procurement/page.tsx
rm -rf ./apps/treasury/procurement-assets/treasury-procurement-assets/app/civic/treasury/procurement/requisitions/page.tsx
rm -rf ./apps/treasury/procurement-assets/treasury-procurement-assets/app/civic/treasury/procurement/tenders/page.tsx
rm -rf ./apps/treasury/procurement-assets/treasury-procurement-assets/core/api/assets/route.ts
rm -rf ./apps/treasury/procurement-assets/treasury-procurement-assets/core/api/contracts/route.ts
rm -rf ./apps/treasury/procurement-assets/treasury-procurement-assets/core/api/requisitions/route.ts
rm -rf ./apps/treasury/procurement-assets/treasury-procurement-assets/core/api/tenders/route.ts
rm -rf ./apps/treasury/procurement-assets/treasury-procurement-assets/domains/civic/treasury/components/AssetRegister.tsx
rm -rf ./apps/treasury/procurement-assets/treasury-procurement-assets/domains/civic/treasury/components/BidCounter.tsx
rm -rf ./apps/treasury/procurement-assets/treasury-procurement-assets/domains/civic/treasury/components/ConditionBadge.tsx
rm -rf ./apps/treasury/procurement-assets/treasury-procurement-assets/domains/civic/treasury/components/ContractAwarder.tsx
rm -rf ./apps/treasury/procurement-assets/treasury-procurement-assets/domains/civic/treasury/components/CustodyTransfer.tsx
rm -rf ./apps/treasury/procurement-assets/treasury-procurement-assets/domains/civic/treasury/components/DepreciationChart.tsx
rm -rf ./apps/treasury/procurement-assets/treasury-procurement-assets/domains/civic/treasury/components/MilestoneTracker.tsx
rm -rf ./apps/treasury/procurement-assets/treasury-procurement-assets/domains/civic/treasury/components/PerformanceRating.tsx
rm -rf ./apps/treasury/procurement-assets/treasury-procurement-assets/domains/civic/treasury/components/ProcurementShell.tsx
rm -rf ./apps/treasury/procurement-assets/treasury-procurement-assets/domains/civic/treasury/components/QrCodeDisplay.tsx
rm -rf ./apps/treasury/procurement-assets/treasury-procurement-assets/domains/civic/treasury/components/RequisitionForm.tsx
rm -rf ./apps/treasury/procurement-assets/treasury-procurement-assets/domains/civic/treasury/components/TenderBoard.tsx
rm -rf ./apps/treasury/procurement-assets/treasury-procurement-assets/domains/civic/treasury/components/UrgencyBadge.tsx
rm -rf ./apps/treasury/procurement-assets/treasury-procurement-assets/domains/civic/treasury/hooks/useAssets.ts
rm -rf ./apps/treasury/procurement-assets/treasury-procurement-assets/domains/civic/treasury/hooks/useContracts.ts
rm -rf ./apps/treasury/procurement-assets/treasury-procurement-assets/domains/civic/treasury/hooks/useRequisitions.ts
rm -rf ./apps/treasury/procurement-assets/treasury-procurement-assets/domains/civic/treasury/hooks/useTenders.ts
rm -rf ./apps/treasury/procurement-assets/treasury-procurement-assets/domains/civic/treasury/services/assetService.ts
rm -rf ./apps/treasury/procurement-assets/treasury-procurement-assets/domains/civic/treasury/services/contractService.ts
rm -rf ./apps/treasury/procurement-assets/treasury-procurement-assets/domains/civic/treasury/services/requisitionService.ts
rm -rf ./apps/treasury/procurement-assets/treasury-procurement-assets/domains/civic/treasury/services/tenderService.ts
rm -rf ./apps/treasury/procurement-assets/treasury-procurement-assets/domains/civic/treasury/state/procurementStore.ts
rm -rf ./apps/treasury/procurement-assets/treasury-procurement-assets/domains/civic/treasury/types/procurement.types.ts
rm -rf ./apps/treasury/procurement-assets/treasury-procurement-assets/lib/kernel/registry.ts
rm -rf ./apps/treasury/procurement-assets/treasury-procurement-assets/lib/supabase/client.ts
rm -rf ./apps/treasury/procurement-assets/treasury-procurement-assets/next.config.js
rm -rf ./apps/treasury/procurement-assets/treasury-procurement-assets/package.json
rm -rf ./apps/treasury/procurement-assets/treasury-procurement-assets/tailwind.config.ts
rm -rf ./apps/treasury/procurement-assets/treasury-procurement-assets/tsconfig.json

# 6. Delete conversation-text schema dumps
echo '[6/8] Removing fake schema dumps...'
rm -f ./schema_data.sql
rm -f ./schema_dump.sql

# 7. Delete old structure/list files
echo '[7/8] Removing old structure files...'
rm -f ./all_files.txt
rm -f ./frontend_files_list.txt
rm -f ./mtaa_clean_structure.txt
rm -f ./mtaa_structure.txt
rm -f ./structure.txt

# 8. Delete lock files and old zips
echo '[8/8] Removing lock files and old zips...'
rm -f ./~lock.setup.sh.odt#
rm -f ./MTAA_Shop_Module.zip
rm -f ./mtaa_kernel_bundle.zip
rm -f ./mtaa_os_shell.zip
rm -f ./mtaa_os_shell_expo.zip

# 9. Clean up empty directories
echo '[9/8] Cleaning empty directories...'
find . -type d -empty -delete 2>/dev/null || true

# 10. Remove node_modules/.expo caches if they exist
echo '[10/8] Cleaning caches...'
rm -rf .expo/web/cache 2>/dev/null || true
rm -rf node_modules/.cache 2>/dev/null || true

echo ''
echo '=== Phase A Cleanup Complete ==='
echo 'Files deleted. Run git status to review changes.'
echo ''
echo 'MANUAL REVIEW REQUIRED:'
echo '  - Check auth-store duplicates (lib/stores/auth-store.ts is canonical)'
echo '  - Check rail-registry vs railRegistry naming'
echo '  - Check kernel event-bus duplicates'
echo '  - Verify modules_disabled/disabled.list is intentional'