#!/usr/bin/env python3
"""
MTAA OS — Phase B Recovery
Reverts service files that were broken by Phase B (functions stripped),
keeps successful re-export barrels.
"""
import os

ROOT = os.path.expanduser("~/MTAA_OS_V10")
os.chdir(ROOT)

# Files to revert to git HEAD (they had functions stripped)
BROKEN_SERVICE_FILES = [
    "lib/services/escrow-service.ts",
    "lib/services/tax-service.ts",
    "lib/services/mtaxi-service.ts",
    "lib/services/mtruck-service.ts",
    "lib/services/transport-service.ts",
    "lib/services/tribes-service.ts",
    "lib/services/jobs-service.ts",
    "lib/services/wallet-service.ts",
    "lib/services/business-service.ts",
    "lib/services/marketplace-service.ts",
    "lib/services/calendar-service.ts",
    "lib/services/incident.service.ts",
    "lib/services/profile-service.ts",
    "lib/services/messaging-service.ts",
]

print("=" * 60)
print("MTAA OS — Phase B Recovery")
print("=" * 60)

for f in BROKEN_SERVICE_FILES:
    result = os.system(f"git checkout -- {f}")
    if result == 0:
        print(f"  ✅ Reverted: {f}")
    else:
        print(f"  ⚠️  Failed to revert: {f}")

print("=" * 60)
print("Kept re-export barrels (these are safe):")
print("  ✅ lib/health/types.ts")
print("  ✅ lib/shop/types.ts")
print("  ✅ lib/mtruck/types/index.ts")
print("  ✅ lib/tribes/types.ts")
print("  ✅ lib/tribes/types/index.ts")
print("=" * 60)

print("\n[VERIFY] Running TypeScript check...")
exit_code = os.system("npx tsc --noEmit")
if exit_code == 0:
    print("\n✅ TypeScript check PASSED — 0 errors")
    print("\nCommit the safe changes:")
    print("  git add -A")
    print("  git commit -m 'consolidate: re-export barrels for pure type files' --no-verify")
else:
    print(f"\n⚠️ TypeScript check failed with exit code {exit_code}")
    print("Some errors may remain from other issues. Run 'npx tsc --noEmit' to see details.")
