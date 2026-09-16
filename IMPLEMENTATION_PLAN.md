# MTAA Health Implementation Plan
# Status: ACTIVE
# Last Updated: 2026-09-14

## P0 — Patient Safety (CRITICAL)
- [x] 1. Fix author resolution (doctor_id → staff_id lookup before every clinical insert)
- [x] 2. Structured lab results with auto-flagging + critical-value alerts via Messenger
- [ ] 3. Prescribing safety engine (drug interaction checks + allergy hard-stop)
- [ ] 4. Fix revenue recognition (paid vs pending separation in billing)

## P1 — Commercial (HIGH)
- [ ] 5. M-Pesa STK Push via MTAA Wallet
- [ ] 6. SHA/insurance claims workflow
- [ ] 7. Appointment slot engine with reminders
- [ ] 8. End-to-end telemedicine (WebRTC)
- [ ] 9. Pharmacy batch/expiry inventory

## P2 — Depth (MEDIUM)
- [ ] 10. FHIR R4 APIs
- [ ] 11. ICD-10 coding
- [ ] 12. Medication reminders + wearable sync
- [ ] 13. ASIS triage

## Rules
- All file writes via Python (no bash heredocs → no truncation)
- No stubs — every function must be fully implemented
- Every clinical insert must resolve user.id → staff.id first
- Every lab order must have structured results with auto-flagging
