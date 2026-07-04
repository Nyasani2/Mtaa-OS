# MTAA OS V10 — Direct Supabase → Service Wiring Guide
# Generated from audit: 137 direct calls found

## How to use this guide:
# 1. Find your file in the list below
# 2. Replace the direct supabase.from() call with the service function
# 3. Import the service at the top of the file

## PROFILE MODULE (app/(os)/profile/)

### app/(os)/profile/[id].tsx
| Line | Current | Replace With |
|------|---------|-------------|
| 86 | `supabase.from('streets_follows')` | `import { followUser, unfollowUser } from '@/lib/services/streets-service'` |
| 91 | `supabase.from('streets_follows')` | Use service above |
| 97 | `supabase.from('profile_blocks')` | `import { blockUser, unblockUser } from '@/lib/services/profile-service'` |
| 103 | `supabase.from('profile_subscriptions')` | `import { subscribe, unsubscribe } from '@/lib/services/profile-service'` |
| 128 | `supabase.from('streets_follows').delete()` | `unfollowUser()` |
| 135 | `supabase.from('streets_follows').insert()` | `followUser()` |
| 146 | `supabase.from('profile_blocks').delete()` | `unblockUser()` |
| 154 | `supabase.from('profile_blocks').insert()` | `blockUser()` |
| 177 | `supabase.from('profile_tips').insert()` | `import { sendTip } from '@/lib/services/wallet-service'` |
| 195 | `supabase.from('profile_subscriptions').delete()` | `unsubscribe()` |
| 205 | `supabase.from('profile_subscriptions').insert()` | `subscribe()` |
| 436 | `supabase.from('streets_posts').select()` | `import { getUserPosts } from '@/lib/services/streets-service'` |
| 457 | `supabase.from('streets_posts').select()` | `getUserPosts()` |
| 478 | `supabase.from('streets_posts').select()` | `getUserPosts()` |
| 499 | `supabase.from('marketplace_listings')` | `import { getListings } from '@/lib/services/marketplace-service'` |

### app/(os)/profile/achievements.tsx
| Line | Current | Replace With |
|------|---------|-------------|
| 63-70 | Multiple supabase calls | `import { getUserAchievements } from '@/lib/services/profile-service'` |

### app/(os)/profile/earnings.tsx
| Line | Current | Replace With |
|------|---------|-------------|
| 51 | `supabase.from('user_profiles')` | `import { getCreatorEarnings } from '@/lib/services/profile-service'` |
| 56 | `supabase.from('wallet_transactions')` | `import { getTransactions } from '@/lib/services/wallet-service'` |

### app/(os)/profile/family/add.tsx
| Line | Current | Replace With |
|------|---------|-------------|
| 70 | `supabase.from('family_members').insert()` | `import { addFamilyMember } from '@/lib/services/profile-service'` |

### app/(os)/profile/followers.tsx
| Line | Current | Replace With |
|------|---------|-------------|
| 49 | `supabase.from('streets_follows').insert()` | `import { followUser } from '@/lib/services/streets-service'` |

### app/(os)/profile/following.tsx
| Line | Current | Replace With |
|------|---------|-------------|
| 52 | `supabase.from('streets_follows').delete()` | `import { unfollowUser } from '@/lib/services/streets-service'` |

### app/(os)/profile/privacy.tsx
| Line | Current | Replace With |
|------|---------|-------------|
| 34 | `supabase.from('profile_settings')` | `import { getPrivacySettings } from '@/lib/services/profile-service'` |
| 46 | `supabase.from('profile_settings').upsert()` | `import { updatePrivacySettings } from '@/lib/services/profile-service'` |

## WALLET MODULE (app/(os)/wallet/)

### app/(os)/wallet/advance/request.tsx
| Line | Current | Replace With |
|------|---------|-------------|
| 32 | `supabase.from('wallet_advances').insert()` | `import { requestAdvance } from '@/lib/services/wallet-service'` |

### app/(os)/wallet/agent.tsx
| Line | Current | Replace With |
|------|---------|-------------|
| 73 | `supabase.from('wallet_transactions').insert()` | `import { createTransaction } from '@/lib/services/wallet-service'` |
| 86 | `supabase.from('agents').update()` | `import { updateAgent } from '@/lib/services/business-service'` |

### app/(os)/wallet/banks.tsx
| Line | Current | Replace With |
|------|---------|-------------|
| 74 | `supabase.from('bank_accounts').insert()` | `import { addBankAccount } from '@/lib/services/wallet-service'` |
| 97 | `supabase.from('bank_accounts').delete()` | `import { removeBankAccount } from '@/lib/services/wallet-service'` |

### app/(os)/wallet/crypto.tsx
| Line | Current | Replace With |
|------|---------|-------------|
| 63 | `supabase.from('crypto_balances')` | `import { getCryptoBalances } from '@/lib/services/wallet-service'` |
| 80 | `supabase.from('crypto_transactions')` | `import { getCryptoTransactions } from '@/lib/services/wallet-service'` |

### app/(os)/wallet/daraja.tsx
| Line | Current | Replace With |
|------|---------|-------------|
| 62 | `supabase.from('daraja_configs')` | `import { getDarajaConfig } from '@/lib/services/wallet-service'` |
| 68 | `supabase.from('daraja_transactions')` | `import { getDarajaTransactions } from '@/lib/services/wallet-service'` |
| 105 | `supabase.from('daraja_configs').upsert()` | `import { saveDarajaConfig } from '@/lib/services/wallet-service'` |

### app/(os)/wallet/escrow.tsx
| Line | Current | Replace With |
|------|---------|-------------|
| 161 | `supabase.from('wallet_transactions').insert()` | `import { createTransaction } from '@/lib/services/wallet-service'` |

### app/(os)/wallet/savings-loans.tsx
| Line | Current | Replace With |
|------|---------|-------------|
| 62-63 | `supabase.from('savings_accounts')` / `supabase.from('loans')` | `import { getSavings, getLoans } from '@/lib/services/wallet-service'` |
| 86 | `supabase.from('savings_accounts').insert()` | `import { createSavingsAccount } from '@/lib/services/wallet-service'` |
| 110 | `supabase.from('loans').insert()` | `import { applyForLoan } from '@/lib/services/wallet-service'` |
| 135-136 | `supabase.from('savings_accounts').update()` / `wallet_transactions` | `import { depositSavings } from '@/lib/services/wallet-service'` |

### app/(os)/wallet/support.tsx
| Line | Current | Replace With |
|------|---------|-------------|
| 69 | `supabase.from('support_tickets').insert()` | `import { createSupportTicket } from '@/lib/services/notification-service'` |

## HEALTH MODULE (app/(os)/health/)

### app/(os)/health/doctor/follow-ups/index.tsx
| Line | Current | Replace With |
|------|---------|-------------|
| 86 | `supabase.from('follow_ups').insert()` | `import { createFollowUp } from '@/lib/services/health-service'` |
| 111 | `supabase.from('follow_ups').update()` | `import { updateFollowUp } from '@/lib/services/health-service'` |
| 122 | `supabase.from('app_notifications').insert()` | `import { sendNotification } from '@/lib/services/notification-service'` |
| 129 | `supabase.from('follow_ups').update()` | `updateFollowUp()` |

### app/(os)/health/doctor/notes/index.tsx
| Line | Current | Replace With |
|------|---------|-------------|
| 108 | `supabase.from('clinical_notes').update()` | `import { updateClinicalNote } from '@/lib/services/health-service'` |
| 111 | `supabase.from('clinical_notes').insert()` | `import { createClinicalNote } from '@/lib/services/health-service'` |

### app/(os)/health/doctor/orders/index.tsx
| Line | Current | Replace With |
|------|---------|-------------|
| 87 | `supabase.from('medical_orders').insert()` | `import { createMedicalOrder } from '@/lib/services/health-service'` |
| 115 | `supabase.from('medical_orders').update()` | `import { updateMedicalOrder } from '@/lib/services/health-service'` |

### app/(os)/health/find-care/index.tsx
| Line | Current | Replace With |
|------|---------|-------------|
| 49 | `supabase.from('facilities')` | `import { getFacilities } from '@/lib/services/health-service'` |

### app/(os)/health/lab/index.tsx
| Line | Current | Replace With |
|------|---------|-------------|
| 59 | `supabase.from('lab_tests').update()` | `import { updateLabTest } from '@/lib/services/health-service'` |

### app/(os)/health/lab/results/index.tsx
| Line | Current | Replace With |
|------|---------|-------------|
| 92 | `supabase.from('lab_results').delete()` | `import { deleteLabResult } from '@/lib/services/health-service'` |
| 99 | `supabase.from('lab_results').insert()` | `import { createLabResult } from '@/lib/services/health-service'` |
| 102 | `supabase.from('lab_tests').update()` | `import { updateLabTest } from '@/lib/services/health-service'` |
| 107 | `supabase.from('app_notifications').insert()` | `import { sendNotification } from '@/lib/services/notification-service'` |

### app/(os)/health/lab/samples/index.tsx
| Line | Current | Replace With |
|------|---------|-------------|
| 45 | `supabase.from('lab_samples').update()` | `import { updateLabSample } from '@/lib/services/health-service'` |
| 49 | `supabase.from('lab_tests').update()` | `updateLabTest()` |
| 56 | `supabase.from('lab_samples').update()` | `updateLabSample()` |

### app/(os)/health/nurse/meds/index.tsx
| Line | Current | Replace With |
|------|---------|-------------|
| 68 | `supabase.from('medication_administrations').update()` | `import { updateMedication } from '@/lib/services/health-service'` |
| 78 | `supabase.from('medication_administrations').update()` | `updateMedication()` |

### app/(os)/health/nurse/vitals/index.tsx
| Line | Current | Replace With |
|------|---------|-------------|
| 53 | `supabase.from('patients')` | `import { getPatient } from '@/lib/services/health-service'` |
| 89 | `supabase.from('health_profiles').insert()` | `import { createHealthProfile } from '@/lib/services/health-service'` |
| 111 | `supabase.from('app_notifications').insert()` | `import { sendNotification } from '@/lib/services/notification-service'` |

### app/(os)/health/pharmacy/dispense/index.tsx
| Line | Current | Replace With |
|------|---------|-------------|
| 53 | `supabase.from('pharmacy_queue').update()` | `import { updatePharmacyQueue } from '@/lib/services/health-service'` |
| 65 | `supabase.from('dispensing_records').insert()` | `import { createDispensingRecord } from '@/lib/services/health-service'` |

### app/(os)/health/pharmacy/index.tsx
| Line | Current | Replace With |
|------|---------|-------------|
| 58 | `supabase.from('pharmacy_queue').update()` | `import { updatePharmacyQueue } from '@/lib/services/health-service'` |

### app/(os)/health/telemedicine/index.tsx
| Line | Current | Replace With |
|------|---------|-------------|
| 71 | `supabase.from('telemedicine_sessions').update()` | `import { updateTelemedicineSession } from '@/lib/services/health-service'` |
| 89 | `supabase.from('telemedicine_sessions').update()` | `updateTelemedicineSession()` |

## COMMERCE MODULE (app/(commerce)/)

### app/(commerce)/shop/[id]/settings.tsx
| Line | Current | Replace With |
|------|---------|-------------|
| 21 | `supabase.from('shops').update()` | `import { updateShop } from '@/lib/services/business-service'` |

### app/(commerce)/shop/[id]/staff.tsx
| Line | Current | Replace With |
|------|---------|-------------|
| 29 | `supabase.from('shop_staff')` | `import { getShopStaff } from '@/lib/services/business-service'` |

### app/(commerce)/shop/[id]/suppliers.tsx
| Line | Current | Replace With |
|------|---------|-------------|
| 20 | `supabase.from('shop_suppliers')` | `import { getShopSuppliers } from '@/lib/services/business-service'` |

### app/(commerce)/shop/create.tsx
| Line | Current | Replace With |
|------|---------|-------------|
| 37 | `supabase.from('shops').insert()` | `import { createShop } from '@/lib/services/business-service'` |
| 45 | `supabase.from('shop_staff').insert()` | `import { addShopStaff } from '@/lib/services/business-service'` |

## EDUCATION MODULE (app/(education)/)

### app/(education)/announcements/create.tsx
| Line | Current | Replace With |
|------|---------|-------------|
| 35 | `supabase.from('education_announcements').insert()` | `import { createAnnouncement } from '@/lib/services/education-service'` |

## BUSINESS MODULE (app/(os)/business/)

### app/(os)/business/[id].tsx
| Line | Current | Replace With |
|------|---------|-------------|
| 15 | `supabase.from('profiles')` | `import { getProfile } from '@/lib/services/profile-service'` |

### app/(os)/profile/business/edit.tsx
| Line | Current | Replace With |
|------|---------|-------------|
| 30 | `supabase.from('business_profiles')` | `import { getBusinessProfile } from '@/lib/services/business-service'` |
| 50 | `supabase.from('business_profiles').upsert()` | `import { updateBusinessProfile } from '@/lib/services/business-service'` |

### app/(os)/profile/business/index.tsx
| Line | Current | Replace With |
|------|---------|-------------|
| 20 | `supabase.from('business_profiles')` | `import { getBusinessProfile } from '@/lib/services/business-service'` |

## RESTAURANT MODULE (app/(os)/restaurant/)

### app/(os)/restaurant/customers.tsx
| Line | Current | Replace With |
|------|---------|-------------|
| 19 | `supabase.from('restaurant_customers')` | `import { getCustomers } from '@/lib/services/business-service'` |

## SETTINGS MODULE (app/(os)/settings/)

### app/(os)/settings/privacy.tsx
| Line | Current | Replace With |
|------|---------|-------------|
| 20 | `supabase.from('profile_settings')` | `import { getPrivacySettings } from '@/lib/services/profile-service'` |
| 27 | `supabase.from('profile_settings').upsert()` | `import { updatePrivacySettings } from '@/lib/services/profile-service'` |

### app/(os)/settings/profile.tsx
| Line | Current | Replace With |
|------|---------|-------------|
| 18 | `supabase.from('profiles')` | `import { getProfile } from '@/lib/services/profile-service'` |
| 34 | Delete account | `import { deleteAccount } from '@/lib/services/identity-service'` |

## ADMIN MODULE (app/(admin)/)

### app/(admin)/command-centre/treasury/central-bank.tsx
| Line | Current | Replace With |
|------|---------|-------------|
| 49 | `supabase.from('treasury_officers')` | `import { getTreasuryOfficers } from '@/lib/services/government-service'` |

## KERNEL (lib/)

### lib/kernel/kernel-provider.tsx
| Line | Current | Replace With |
|------|---------|-------------|
| 15 | `supabase.from('kernel_events')` | `import { checkKernelHealth } from '@/lib/services/kernel-service'` |

---

## NEXT STEPS:
# 1. Run: node scripts/fix-layouts.js
# 2. Run: node scripts/fix-dead-buttons.js
# 3. For each file above, replace direct supabase calls with service imports
# 4. Re-run: node scripts/audit-buttons.js to verify score improvement
