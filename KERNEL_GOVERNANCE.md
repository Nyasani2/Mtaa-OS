# MTAA KERNEL GOVERNANCE RULES

## RULE 1: Single Kernel Principle
Only ONE active kernel exists:
- lib/kernel/runtime/kernel-runtime.ts

## RULE 2: Archive Policy
All backups must live in:
- _KERNEL_BACKUP_ARCHIVE/
- _KERNEL_ARCHIVE_LOCK/

## RULE 3: Staging Isolation
Staging systems must NEVER be imported directly into runtime.

## RULE 4: Cleanup Enforcement
scripts/cleanup-os.sh must:
- Remove duplicate kernel execution paths
- Prevent multiple runtime loops
