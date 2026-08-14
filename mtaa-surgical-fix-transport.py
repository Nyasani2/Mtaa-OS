#!/usr/bin/env python3
"""
MTAA OS — Phase A.2: Surgical fix for transport types
Fixes:
1. ride.service.ts: Add import for CreateRidePayload from ../types
2. types/index.ts: Ensure NearbyDriver is exported
"""
import os, re

ROOT = os.path.expanduser("~/MTAA_OS_V10")
os.chdir(ROOT)

types_file = os.path.join(ROOT, "lib/transport/types/index.ts")
ride_service = os.path.join(ROOT, "lib/transport/services/ride.service.ts")

# ============================================================
# FIX 1: ride.service.ts — add import for CreateRidePayload
# ============================================================
with open(ride_service, "r", encoding="utf-8", errors="ignore") as f:
    ride_content = f.read()

# Check if CreateRidePayload is already imported from ../types
if "CreateRidePayload" in ride_content and "from '../types'" in ride_content:
    print("✅ CreateRidePayload already imported from ../types")
elif "CreateRidePayload" in ride_content:
    # There's a reference but no import — add one
    # Find the first import line and add after it, or at top of file
    lines = ride_content.split("\n")
    import_idx = -1
    for i, line in enumerate(lines):
        if line.startswith("import "):
            import_idx = i

    new_import = "import { CreateRidePayload } from '../types';"
    if import_idx >= 0:
        lines.insert(import_idx + 1, new_import)
    else:
        lines.insert(0, new_import)

    # Remove the consolidated comment if present
    new_lines = []
    for line in lines:
        if "[CONSOLIDATED] CreateRidePayload" in line:
            continue
        new_lines.append(line)

    with open(ride_service, "w", encoding="utf-8") as f:
        f.write("\n".join(new_lines))
    print("✅ Added import { CreateRidePayload } from '../types' to ride.service.ts")

# ============================================================
# FIX 2: types/index.ts — ensure NearbyDriver is exported
# ============================================================
with open(types_file, "r", encoding="utf-8", errors="ignore") as f:
    types_content = f.read()

# Check if NearbyDriver is already exported
if "export interface NearbyDriver" in types_content or "export type NearbyDriver" in types_content:
    print("✅ NearbyDriver already exported from types/index.ts")
else:
    # NearbyDriver is missing — we need to add it
    # Try to reconstruct from common patterns in the codebase
    nearby_driver_interface = """
// === NearbyDriver (reconstructed) ===
export interface NearbyDriver {
  id: string;
  name: string;
  phone?: string;
  vehicle_type?: string;
  latitude: number;
  longitude: number;
  distance?: number;
  eta?: number;
  rating?: number;
  is_available?: boolean;
  avatar_url?: string;
  plate_number?: string;
}
"""
    with open(types_file, "a", encoding="utf-8") as f:
        f.write(nearby_driver_interface)
    print("✅ Added NearbyDriver interface to types/index.ts")

# ============================================================
# VERIFY
# ============================================================
print("\n[VERIFY] Running TypeScript check...")
exit_code = os.system("npx tsc --noEmit")
if exit_code == 0:
    print("\n✅ TypeScript check PASSED — 0 errors")
    print("\nCommit now:")
    print("  git add -A")
    print("  git commit -m 'consolidate: Phase A safe type merges + transport fixes'")
else:
    print(f"\n⚠️ TypeScript check failed with exit code {exit_code}")
    print("Run 'npx tsc --noEmit' manually to see all errors.")
