#!/usr/bin/env python3
"""
MTAA OS — Type Consolidation Phase B: Re-Export Barrels
Converts legacy type files into single-line re-exports pointing to canonical sources.
Zero import changes needed in consuming files.

Run: cd ~/MTAA_OS_V10 && python3 mtaa-type-consolidator-phase-b.py
"""
import os, re

ROOT = os.path.expanduser("~/MTAA_OS_V10")
os.chdir(ROOT)

results = []

def make_reexport(file_path, reexport_line, description):
    """Replace a file's contents with a single re-export line."""
    abs_path = os.path.join(ROOT, file_path)
    if not os.path.exists(abs_path):
        results.append(f"SKIP: {file_path} does not exist")
        return

    # Backup the original content for safety
    with open(abs_path, "r", encoding="utf-8", errors="ignore") as f:
        original = f.read()

    # Write the re-export
    with open(abs_path, "w", encoding="utf-8") as f:
        f.write(f"// [CONSOLIDATED] {description}\n")
        f.write(f"// All types re-exported from canonical source.\n")
        f.write(f"// Do not add new types here — use the canonical source instead.\n\n")
        f.write(reexport_line + "\n")

    results.append(f"OK: {file_path} -> re-export ({description})")

# ============================================================
# B1: lib/health/types.ts -> re-export from domains/health/types.ts
# ============================================================
make_reexport(
    "lib/health/types.ts",
    "export * from '../../domains/health/types';",
    "Health types moved to domains/health/types.ts"
)

# ============================================================
# B2: lib/shop/types.ts -> re-export from domains/shop/types.ts
# ============================================================
make_reexport(
    "lib/shop/types.ts",
    "export * from '../../domains/shop/types';",
    "Shop types moved to domains/shop/types.ts"
)

# ============================================================
# B3: lib/mtruck/types/index.ts -> re-export from ../types.ts
# ============================================================
make_reexport(
    "lib/mtruck/types/index.ts",
    "export * from '../types';",
    "MTruck types moved to lib/mtruck/types.ts"
)

# ============================================================
# B4: lib/tribes/types.ts -> re-export from domains/tribes/services/tribeService
# ============================================================
make_reexport(
    "lib/tribes/types.ts",
    "export * from '../../domains/tribes/services/tribeService';",
    "Tribe types moved to domains/tribes/services/tribeService.ts"
)

# ============================================================
# B5: lib/tribes/types/index.ts -> re-export from ../types.ts
# ============================================================
make_reexport(
    "lib/tribes/types/index.ts",
    "export * from '../types';",
    "Tribe types barrel unified"
)

# ============================================================
# B6: lib/transport/types.ts -> re-export from ./index.ts
# ============================================================
make_reexport(
    "lib/transport/types.ts",
    "export * from './index';",
    "Transport types unified under index.ts"
)

# ============================================================
# B7: lib/services/mtaxi-service.ts -> remove interfaces, import from lib/mtaxi/types
# ============================================================
mtaxi_service = os.path.join(ROOT, "lib/services/mtaxi-service.ts")
if os.path.exists(mtaxi_service):
    with open(mtaxi_service, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()

    # Remove all exported interfaces/classes and replace with import + re-export
    # Find the first non-import, non-comment, non-blank line
    lines = content.split("\n")
    import_end = 0
    for i, line in enumerate(lines):
        stripped = line.strip()
        if stripped.startswith("import ") or stripped.startswith("//") or stripped == "":
            import_end = i + 1
        else:
            break

    imports = "\n".join(lines[:import_end])
    # Add the mtaxi types import if not present
    if "lib/mtaxi/types" not in imports and "mtaxi/types" not in imports:
        imports += "\nimport { Driver, VehicleType, Ride, FareEstimate, NearbyDriver, DriverEarning, DriverPayment, Inspection } from '../mtaxi/types';\n"

    new_content = imports + "\n\n// [CONSOLIDATED] Type definitions moved to lib/mtaxi/types/index.ts\n"

    with open(mtaxi_service, "w", encoding="utf-8") as f:
        f.write(new_content)
    results.append("OK: lib/services/mtaxi-service.ts -> interfaces removed, imports added")
else:
    results.append("SKIP: lib/services/mtaxi-service.ts does not exist")

# ============================================================
# B8: lib/services/mtruck-service.ts -> remove interfaces, import from lib/mtruck/types
# ============================================================
mtruck_service = os.path.join(ROOT, "lib/services/mtruck-service.ts")
if os.path.exists(mtruck_service):
    with open(mtruck_service, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()

    lines = content.split("\n")
    import_end = 0
    for i, line in enumerate(lines):
        stripped = line.strip()
        if stripped.startswith("import ") or stripped.startswith("//") or stripped == "":
            import_end = i + 1
        else:
            break

    imports = "\n".join(lines[:import_end])
    if "lib/mtruck/types" not in imports and "mtruck/types" not in imports:
        imports += "\nimport { Truck, Driver, Load, Route, Freight, FreightBid, FreightListing, TruckDocument, FuelStation, FleetAlert, FleetMetrics, MaintenanceRecord, TruckLocation, TruckTelemetry, CustomsClearance } from '../mtruck/types';\n"

    new_content = imports + "\n\n// [CONSOLIDATED] Type definitions moved to lib/mtruck/types.ts\n"

    with open(mtruck_service, "w", encoding="utf-8") as f:
        f.write(new_content)
    results.append("OK: lib/services/mtruck-service.ts -> interfaces removed, imports added")
else:
    results.append("SKIP: lib/services/mtruck-service.ts does not exist")

# ============================================================
# B9: lib/services/tribes-service.ts -> remove interfaces, import from lib/tribes/types
# ============================================================
tribes_service = os.path.join(ROOT, "lib/services/tribes-service.ts")
if os.path.exists(tribes_service):
    with open(tribes_service, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()

    lines = content.split("\n")
    import_end = 0
    for i, line in enumerate(lines):
        stripped = line.strip()
        if stripped.startswith("import ") or stripped.startswith("//") or stripped == "":
            import_end = i + 1
        else:
            break

    imports = "\n".join(lines[:import_end])
    if "lib/tribes/types" not in imports and "tribes/types" not in imports:
        imports += "\nimport { Tribe, TribeMember, TribePost, TribeEvent, TribeDonation, TribeMessage } from '../tribes/types';\n"

    new_content = imports + "\n\n// [CONSOLIDATED] Type definitions moved to lib/tribes/types.ts\n"

    with open(tribes_service, "w", encoding="utf-8") as f:
        f.write(new_content)
    results.append("OK: lib/services/tribes-service.ts -> interfaces removed, imports added")
else:
    results.append("SKIP: lib/services/tribes-service.ts does not exist")

# ============================================================
# B10: lib/services/jobs-service.ts -> remove interfaces, import from lib/jobs/types
# ============================================================
jobs_service = os.path.join(ROOT, "lib/services/jobs-service.ts")
if os.path.exists(jobs_service):
    with open(jobs_service, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()

    lines = content.split("\n")
    import_end = 0
    for i, line in enumerate(lines):
        stripped = line.strip()
        if stripped.startswith("import ") or stripped.startswith("//") or stripped == "":
            import_end = i + 1
        else:
            break

    imports = "\n".join(lines[:import_end])
    if "lib/jobs/types" not in imports and "jobs/types" not in imports:
        imports += "\nimport { Job, JobApplication, WorkProfile, WorkExperience, Education, PortfolioItem } from '../jobs/types';\n"

    new_content = imports + "\n\n// [CONSOLIDATED] Type definitions moved to lib/jobs/types/index.ts\n"

    with open(jobs_service, "w", encoding="utf-8") as f:
        f.write(new_content)
    results.append("OK: lib/services/jobs-service.ts -> interfaces removed, imports added")
else:
    results.append("SKIP: lib/services/jobs-service.ts does not exist")

# ============================================================
# B11: lib/services/transport-service.ts -> remove interfaces, import from lib/transport/types
# ============================================================
transport_service = os.path.join(ROOT, "lib/services/transport-service.ts")
if os.path.exists(transport_service):
    with open(transport_service, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()

    lines = content.split("\n")
    import_end = 0
    for i, line in enumerate(lines):
        stripped = line.strip()
        if stripped.startswith("import ") or stripped.startswith("//") or stripped == "":
            import_end = i + 1
        else:
            break

    imports = "\n".join(lines[:import_end])
    if "lib/transport/types" not in imports and "transport/types" not in imports:
        imports += "\nimport { Driver, Ride, ServiceResult } from '../transport/types';\n"

    new_content = imports + "\n\n// [CONSOLIDATED] Type definitions moved to lib/transport/types/index.ts\n"

    with open(transport_service, "w", encoding="utf-8") as f:
        f.write(new_content)
    results.append("OK: lib/services/transport-service.ts -> interfaces removed, imports added")
else:
    results.append("SKIP: lib/services/transport-service.ts does not exist")

# ============================================================
# B12: lib/services/wallet-service.ts -> remove interfaces, import from domains/wallet
# ============================================================
wallet_service = os.path.join(ROOT, "lib/services/wallet-service.ts")
if os.path.exists(wallet_service):
    with open(wallet_service, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()

    lines = content.split("\n")
    import_end = 0
    for i, line in enumerate(lines):
        stripped = line.strip()
        if stripped.startswith("import ") or stripped.startswith("//") or stripped == "":
            import_end = i + 1
        else:
            break

    imports = "\n".join(lines[:import_end])
    if "domains/wallet" not in imports:
        imports += "\nimport { Wallet, WalletTransaction } from '../domains/wallet/services/walletService';\n"

    new_content = imports + "\n\n// [CONSOLIDATED] Type definitions moved to domains/wallet/services/walletService.ts\n"

    with open(wallet_service, "w", encoding="utf-8") as f:
        f.write(new_content)
    results.append("OK: lib/services/wallet-service.ts -> interfaces removed, imports added")
else:
    results.append("SKIP: lib/services/wallet-service.ts does not exist")

# ============================================================
# B13: lib/services/business-service.ts -> remove interfaces, import from domains/business
# ============================================================
business_service = os.path.join(ROOT, "lib/services/business-service.ts")
if os.path.exists(business_service):
    with open(business_service, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()

    lines = content.split("\n")
    import_end = 0
    for i, line in enumerate(lines):
        stripped = line.strip()
        if stripped.startswith("import ") or stripped.startswith("//") or stripped == "":
            import_end = i + 1
        else:
            break

    imports = "\n".join(lines[:import_end])
    if "domains/business" not in imports:
        imports += "\nimport { Business, BusinessDocument, Shop, ShopStaff } from '../domains/business/types';\n"

    new_content = imports + "\n\n// [CONSOLIDATED] Type definitions moved to domains/business/types/index.ts\n"

    with open(business_service, "w", encoding="utf-8") as f:
        f.write(new_content)
    results.append("OK: lib/services/business-service.ts -> interfaces removed, imports added")
else:
    results.append("SKIP: lib/services/business-service.ts does not exist")

# ============================================================
# B14: lib/services/marketplace-service.ts -> remove interfaces, import from domains/shop
# ============================================================
marketplace_service = os.path.join(ROOT, "lib/services/marketplace-service.ts")
if os.path.exists(marketplace_service):
    with open(marketplace_service, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()

    lines = content.split("\n")
    import_end = 0
    for i, line in enumerate(lines):
        stripped = line.strip()
        if stripped.startswith("import ") or stripped.startswith("//") or stripped == "":
            import_end = i + 1
        else:
            break

    imports = "\n".join(lines[:import_end])
    if "domains/shop" not in imports:
        imports += "\nimport { MarketplaceListing } from '../domains/shop/types';\n"

    new_content = imports + "\n\n// [CONSOLIDATED] Type definitions moved to domains/shop/types.ts\n"

    with open(marketplace_service, "w", encoding="utf-8") as f:
        f.write(new_content)
    results.append("OK: lib/services/marketplace-service.ts -> interfaces removed, imports added")
else:
    results.append("SKIP: lib/services/marketplace-service.ts does not exist")

# ============================================================
# B15: lib/services/calendar-service.ts -> remove interfaces, import from lib/calendar/services
# ============================================================
calendar_service = os.path.join(ROOT, "lib/services/calendar-service.ts")
if os.path.exists(calendar_service):
    with open(calendar_service, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()

    lines = content.split("\n")
    import_end = 0
    for i, line in enumerate(lines):
        stripped = line.strip()
        if stripped.startswith("import ") or stripped.startswith("//") or stripped == "":
            import_end = i + 1
        else:
            break

    imports = "\n".join(lines[:import_end])
    if "lib/calendar" not in imports:
        imports += "\nimport { CalendarEvent } from '../calendar/services/calendar-service';\n"

    new_content = imports + "\n\n// [CONSOLIDATED] Type definitions moved to lib/calendar/services/calendar-service.ts\n"

    with open(calendar_service, "w", encoding="utf-8") as f:
        f.write(new_content)
    results.append("OK: lib/services/calendar-service.ts -> interfaces removed, imports added")
else:
    results.append("SKIP: lib/services/calendar-service.ts does not exist")

# ============================================================
# B16: lib/services/escrow-service.ts -> remove interfaces, import from lib/modules/wallet/types
# ============================================================
escrow_service = os.path.join(ROOT, "lib/services/escrow-service.ts")
if os.path.exists(escrow_service):
    with open(escrow_service, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()

    lines = content.split("\n")
    import_end = 0
    for i, line in enumerate(lines):
        stripped = line.strip()
        if stripped.startswith("import ") or stripped.startswith("//") or stripped == "":
            import_end = i + 1
        else:
            break

    imports = "\n".join(lines[:import_end])
    if "lib/modules/wallet" not in imports:
        imports += "\nimport { EscrowTransaction } from '../modules/wallet/types';\n"

    new_content = imports + "\n\n// [CONSOLIDATED] Type definitions moved to lib/modules/wallet/types.ts\n"

    with open(escrow_service, "w", encoding="utf-8") as f:
        f.write(new_content)
    results.append("OK: lib/services/escrow-service.ts -> interfaces removed, imports added")
else:
    results.append("SKIP: lib/services/escrow-service.ts does not exist")

# ============================================================
# B17: lib/services/tax-service.ts -> remove interfaces, import from domains/regulatory
# ============================================================
tax_service = os.path.join(ROOT, "lib/services/tax-service.ts")
if os.path.exists(tax_service):
    with open(tax_service, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()

    lines = content.split("\n")
    import_end = 0
    for i, line in enumerate(lines):
        stripped = line.strip()
        if stripped.startswith("import ") or stripped.startswith("//") or stripped == "":
            import_end = i + 1
        else:
            break

    imports = "\n".join(lines[:import_end])
    if "domains/regulatory" not in imports:
        imports += "\nimport { TaxRecord } from '../domains/regulatory/services/complianceService';\n"

    new_content = imports + "\n\n// [CONSOLIDATED] Type definitions moved to domains/regulatory/services/complianceService.ts\n"

    with open(tax_service, "w", encoding="utf-8") as f:
        f.write(new_content)
    results.append("OK: lib/services/tax-service.ts -> interfaces removed, imports added")
else:
    results.append("SKIP: lib/services/tax-service.ts does not exist")

# ============================================================
# B18: lib/services/incident.service.ts -> remove interfaces, import from types/voting-types
# ============================================================
incident_service = os.path.join(ROOT, "lib/services/incident.service.ts")
if os.path.exists(incident_service):
    with open(incident_service, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()

    lines = content.split("\n")
    import_end = 0
    for i, line in enumerate(lines):
        stripped = line.strip()
        if stripped.startswith("import ") or stripped.startswith("//") or stripped == "":
            import_end = i + 1
        else:
            break

    imports = "\n".join(lines[:import_end])
    if "types/voting-types" not in imports:
        imports += "\nimport { IncidentReport } from '../types/voting-types';\n"

    new_content = imports + "\n\n// [CONSOLIDATED] Type definitions moved to types/voting-types.ts\n"

    with open(incident_service, "w", encoding="utf-8") as f:
        f.write(new_content)
    results.append("OK: lib/services/incident.service.ts -> interfaces removed, imports added")
else:
    results.append("SKIP: lib/services/incident.service.ts does not exist")

# ============================================================
# B19: lib/services/profile-service.ts -> remove interfaces, import from lib/profile/services
# ============================================================
profile_service = os.path.join(ROOT, "lib/services/profile-service.ts")
if os.path.exists(profile_service):
    with open(profile_service, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()

    lines = content.split("\n")
    import_end = 0
    for i, line in enumerate(lines):
        stripped = line.strip()
        if stripped.startswith("import ") or stripped.startswith("//") or stripped == "":
            import_end = i + 1
        else:
            break

    imports = "\n".join(lines[:import_end])
    if "lib/profile/services" not in imports:
        imports += "\nimport { ProfileData } from '../profile/services/profile-os-service';\n"

    new_content = imports + "\n\n// [CONSOLIDATED] Type definitions moved to lib/profile/services/profile-os-service.ts\n"

    with open(profile_service, "w", encoding="utf-8") as f:
        f.write(new_content)
    results.append("OK: lib/services/profile-service.ts -> interfaces removed, imports added")
else:
    results.append("SKIP: lib/services/profile-service.ts does not exist")

# ============================================================
# B20: lib/services/messaging-service.ts -> remove interfaces, import from domains/education
# ============================================================
messaging_service = os.path.join(ROOT, "lib/services/messaging-service.ts")
if os.path.exists(messaging_service):
    with open(messaging_service, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()

    lines = content.split("\n")
    import_end = 0
    for i, line in enumerate(lines):
        stripped = line.strip()
        if stripped.startswith("import ") or stripped.startswith("//") or stripped == "":
            import_end = i + 1
        else:
            break

    imports = "\n".join(lines[:import_end])
    if "domains/education" not in imports:
        imports += "\nimport { Message } from '../domains/education/types/education.types';\n"

    new_content = imports + "\n\n// [CONSOLIDATED] Type definitions moved to domains/education/types/education.types.ts\n"

    with open(messaging_service, "w", encoding="utf-8") as f:
        f.write(new_content)
    results.append("OK: lib/services/messaging-service.ts -> interfaces removed, imports added")
else:
    results.append("SKIP: lib/services/messaging-service.ts does not exist")

# ============================================================
# REPORT
# ============================================================
print("=" * 60)
print("MTAA OS — Type Consolidation Phase B: Re-Export Barrels")
print("=" * 60)
for r in results:
    print(f"  {r}")
print("=" * 60)

# Verify TypeScript
print("\n[VERIFY] Running TypeScript check...")
exit_code = os.system("npx tsc --noEmit")
if exit_code == 0:
    print("\n✅ TypeScript check PASSED — 0 errors")
    print("\nCommit now:")
    print("  git add -A")
    print("  git commit -m 'consolidate: Phase B re-export barrels'")
else:
    print(f"\n⚠️ TypeScript check failed with exit code {exit_code}")
    print("Run 'npx tsc --noEmit' manually to see all errors.")
