/*
============================================
WALLET V2 INSTALLATION NOTES
============================================

Files to copy into your project:

1. app/(os)/wallet/index.tsx 
   -> Use wallet-index-v2.tsx (rename to index.tsx or replace contents)

2. app/(os)/wallet/banking-hub.tsx
   -> Copy banking-hub.tsx as-is

3. app/(os)/wallet/gofund-hub.tsx
   -> Copy gofund-hub.tsx as-is

4. app/(os)/wallet/savings-hub.tsx
   -> Copy savings-hub.tsx as-is

5. app/(os)/wallet/sacco-hub.tsx
   -> Copy sacco-hub.tsx as-is

6. app/(os)/wallet/insurance-hub.tsx
   -> Copy insurance-hub.tsx as-is

7. app/(os)/wallet/government-hub.tsx
   -> Copy government-hub.tsx as-is

8. app/(os)/wallet/partner-ecosystem.tsx
   -> Copy partner-ecosystem.tsx as-is

9. app/(os)/wallet/_layout.tsx
   -> Use wallet-layout-v2.tsx (rename to _layout.tsx or replace contents)

10. lib/wallet/wallet-v2-types.ts
    -> Copy wallet-v2-types.ts as-is

11. lib/wallet/wallet-v2-service.ts
    -> Copy wallet-v2-service.ts as-is

12. app/(os)/appstore/index.tsx
    -> Use appstore-index-v2.tsx (rename to index.tsx or replace contents)

============================================
SQL TO RUN (in Supabase Dashboard):
============================================

1. wallet-v2-schema.sql (from Batch 1)
2. wallet-v2-rpc-and-rls.sql (from Batch 5)

============================================
EDGE FUNCTIONS TO DEPLOY:
============================================

Batch 1:
- wallet-partner-submit
- wallet-partner-review
- wallet-gofund-campaign
- wallet-gofund-callback

Batch 2:
- wallet-savings-goal
- wallet-sacco-directory
- wallet-government-submit
- wallet-insurance-submit
- wallet-partner-list

============================================
ROUTES REGISTERED:
============================================

/(os)/wallet                    -> Wallet Home V2
/(os)/wallet/banking-hub      -> Banking Hub
/(os)/wallet/gofund-hub       -> GoFund Hub
/(os)/wallet/savings-hub      -> Savings Hub
/(os)/wallet/sacco-hub        -> SACCO Hub
/(os)/wallet/insurance-hub    -> Insurance Hub
/(os)/wallet/government-hub   -> Government Hub
/(os)/wallet/partner-ecosystem -> Partner Ecosystem

============================================
*/
