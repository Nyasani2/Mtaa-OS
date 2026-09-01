# 05 — WALLET INTEGRATION MAP

## Overview
34 TODO markers in `lib/stores/wallet-store.ts` need to be wired to existing backend infrastructure.

## Method-to-Backend Mapping

### Agent Operations (4 TODOs)
| Store Method | Line | Should Wire To | Edge Function/Service |
|--------------|------|----------------|----------------------|
| `loadProviders` | 1270 | Provider registry | `agent-operations` edge function |
| `loadAgents` | 1284 | Agent geo query | `agent-operations` edge function |
| `loadAgentTransactions` | 1298 | Agent transaction list | `agent-service.ts` |
| (duplicate) | 1314 | Agent transaction edge | `agent-operations` edge function |

### Payment Operations (2 TODOs)
| Store Method | Line | Should Wire To | Edge Function/Service |
|--------------|------|----------------|----------------------|
| `loadMerchantProfile` | 1330 | Merchant profile | `payment-service.ts` |
| (analytics) | 1338 | Real-time analytics | `payment-service.ts` |

### Business Operations (1 TODO)
| Store Method | Line | Should Wire To | Edge Function/Service |
|--------------|------|----------------|----------------------|
| `loadBusinessProfile` | 1348 | Business profile | `business-service.ts` (missing, create stub) |

### Credit Operations (4 TODOs)
| Store Method | Line | Should Wire To | Edge Function/Service |
|--------------|------|----------------|----------------------|
| `loadCreditInfo` | 1376 | Credit info | `wallet-service.ts` |
| `applyForCredit` | 1386 | Credit application | New edge function needed |
| `repayCredit` | 1398 | Credit repayment | `wallet-service.ts` |

### Escrow Operations (4 TODOs)
| Store Method | Line | Should Wire To | Edge Function/Service |
|--------------|------|----------------|----------------------|
| `loadEscrow` | 1414 | Escrow list | `escrow-service.ts` |
| `createEscrow` | 1424 | Escrow creation | New edge function needed |
| `releaseEscrow` | 1436 | Escrow release | `escrow-service.ts` |
| `disputeEscrow` | 1448 | Escrow dispute | `escrow-service.ts` |

### Savings Operations (3 TODOs)
| Store Method | Line | Should Wire To | Edge Function/Service |
|--------------|------|----------------|----------------------|
| `loadSavings` | 1464 | Savings list | `wallet-service.ts` |
| `createSavingsGoal` | 1474 | Goal creation | `wallet-service.ts` |
| `contributeToSavings` | 1486 | Savings deposit | `wallet-deposit-service.ts` |

### GoFund Operations (3 TODOs)
| Store Method | Line | Should Wire To | Edge Function/Service |
|--------------|------|----------------|----------------------|
| `loadGoFund` | 1502 | Campaign list | `wallet-service.ts` |
| `createCampaign` | 1512 | Campaign creation | New edge function needed |
| `donateToCampaign` | 1524 | Donation | `wallet-service.ts` |

### Tax Operations (4 TODOs)
| Store Method | Line | Should Wire To | Edge Function/Service |
|--------------|------|----------------|----------------------|
| `loadTax` | 1540 | Tax records | `wallet-tax` edge function |
| `calculateTax` | 1550 | Tax calculation | `tax-service.ts` |
| `fileTaxReturn` | 1562 | Tax filing | `wallet-tax` edge function |
| `exportTaxCSV` | 1574 | CSV export | `tax-service.ts` |

### Regulatory Operations (3 TODOs)
| Store Method | Line | Should Wire To | Edge Function/Service |
|--------------|------|----------------|----------------------|
| `loadRegulatory` | 1590 | Regulatory info | `wallet-service.ts` |
| `loadJurisdictions` | 1600 | Jurisdiction list | `wallet-service.ts` |
| `loadCentralBanks` | 1616 | Central bank registry | New edge function needed |
| `syncCentralBank` | 1626 | Central bank sync | New edge function needed |

### QR Operations (1 TODO)
| Store Method | Line | Should Wire To | Edge Function/Service |
|--------------|------|----------------|----------------------|
| `scanQR` | 1671 | QR resolution | `qr-resolve` edge function |

### Audit/Reconciliation (4 TODOs)
| Store Method | Line | Should Wire To | Edge Function/Service |
|--------------|------|----------------|----------------------|
| `loadAuditLog` | 1719 | Audit log | New edge function needed |
| `loadReconciliation` | 1733 | Reconciliation list | `wallet-service.ts` |
| `resolveReconciliation` | 1743 | Reconciliation resolution | `wallet-service.ts` |

### Notifications (1 TODO)
| Store Method | Line | Should Wire To | Edge Function/Service |
|--------------|------|----------------|----------------------|
| `loadNotifications` | 1757 | Notification list | `notification-service.ts` |

### Fee Configuration (1 TODO)
| Store Method | Line | Should Wire To | Edge Function/Service |
|--------------|------|----------------|----------------------|
| `loadFeeStructures` | 1834 | Fee structures | `wallet-service.ts` |

## Implementation Priority

### Priority 1: Core Payment Operations (implement first)
1. `scanQR` → `qr-resolve` edge function
2. `loadMerchantProfile` → `payment-service.ts`
3. `loadAgents` → `agent-operations` edge function
4. `loadAgentTransactions` → `agent-service.ts`

### Priority 2: Credit & Escrow (financial operations)
5. `loadCreditInfo` → `wallet-service.ts`
6. `applyForCredit` → Create new edge function
7. `loadEscrow` → `escrow-service.ts`
8. `createEscrow` → Create new edge function

### Priority 3: Savings & GoFund (user features)
9. `loadSavings` → `wallet-service.ts`
10. `createSavingsGoal` → `wallet-service.ts`
11. `loadGoFund` → `wallet-service.ts`

### Priority 4: Tax & Regulatory (compliance)
12. `loadTax` → `wallet-tax` edge function
13. `calculateTax` → `tax-service.ts`

### Priority 5: Admin & Audit (admin features)
14. `loadAuditLog` → Create new edge function
15. `loadReconciliation` → `wallet-service.ts`

## Missing Infrastructure
The following require new edge functions:
- `credit-application` edge function
- `escrow-operations` edge function  
- `gofund-operations` edge function
- `central-bank-registry` edge function
- `audit-log` edge function

**Recommendation:** Create these as thin wrappers around existing services rather than building from scratch.

