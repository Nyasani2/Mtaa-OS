#!/usr/bin/env python3
"""
MTAA OS — Phase A.1: Fix CreateRidePayload mismatch
Replaces the merged (incomplete) CreateRidePayload in types/index.ts
with the correct version from ride.service.ts
"""
import os, re

ROOT = os.path.expanduser("~/MTAA_OS_V10")
os.chdir(ROOT)

types_file = os.path.join(ROOT, "lib/transport/types/index.ts")
ride_service = os.path.join(ROOT, "lib/transport/services/ride.service.ts")

if not os.path.exists(types_file):
    print("❌ lib/transport/types/index.ts not found")
    exit(1)

if not os.path.exists(ride_service):
    print("❌ lib/transport/services/ride.service.ts not found")
    exit(1)

# Read ride.service.ts and extract the CreateRidePayload interface
with open(ride_service, "r", encoding="utf-8", errors="ignore") as f:
    ride_content = f.read()

# Find the CreateRidePayload interface in ride.service.ts
interface_pattern = re.compile(
    r'(export\s+interface\s+CreateRidePayload\s*\{[\s\S]*?^\s*\})',
    re.MULTILINE
)
match = interface_pattern.search(ride_content)

if not match:
    print("⚠️ CreateRidePayload not found in ride.service.ts — may already be fixed")
    exit(0)

correct_interface = match.group(1)

# Read types/index.ts
with open(types_file, "r", encoding="utf-8", errors="ignore") as f:
    types_content = f.read()

# Find and replace the merged CreateRidePayload block
# The merged block is marked with: // === MERGED FROM transport/types.ts ===
merged_block_pattern = re.compile(
    r'\n?// === MERGED FROM transport/types\.ts ===\n(export\s+interface\s+CreateRidePayload\s*\{[\s\S]*?^\s*\})',
    re.MULTILINE
)

if merged_block_pattern.search(types_content):
    new_content = merged_block_pattern.sub(
        "\n// === CORRECTED CreateRidePayload from ride.service.ts ===\n" + correct_interface,
        types_content
    )
    with open(types_file, "w", encoding="utf-8") as f:
        f.write(new_content)
    print("✅ Replaced merged CreateRidePayload with correct version from ride.service.ts")
else:
    # Try finding any CreateRidePayload in types/index.ts
    generic_pattern = re.compile(
        r'(export\s+interface\s+CreateRidePayload\s*\{[\s\S]*?^\s*\})',
        re.MULTILINE
    )
    if generic_pattern.search(types_content):
        new_content = generic_pattern.sub(
            "// === CORRECTED CreateRidePayload from ride.service.ts ===\n" + correct_interface,
            types_content
        )
        with open(types_file, "w", encoding="utf-8") as f:
            f.write(new_content)
        print("✅ Replaced CreateRidePayload with correct version from ride.service.ts")
    else:
        print("⚠️ CreateRidePayload not found in types/index.ts — appending correct version")
        with open(types_file, "a", encoding="utf-8") as f:
            f.write("\n\n// === CORRECTED CreateRidePayload from ride.service.ts ===\n" + correct_interface)

# Now remove the duplicate from ride.service.ts to prevent future conflicts
with open(ride_service, "r", encoding="utf-8", errors="ignore") as f:
    ride_lines = f.readlines()

new_ride_lines = []
skip_until = -1
for i, line in enumerate(ride_lines):
    if i < skip_until:
        continue
    if re.match(r'^\s*export\s+interface\s+CreateRidePayload\s*\{', line):
        # Comment it out and skip the block
        new_ride_lines.append("// [CONSOLIDATED] CreateRidePayload moved to lib/transport/types/index.ts\n")
        brace_count = line.count("{") - line.count("}")
        j = i + 1
        while j < len(ride_lines) and brace_count > 0:
            brace_count += ride_lines[j].count("{") - ride_lines[j].count("}")
            j += 1
        skip_until = j
    else:
        new_ride_lines.append(line)

with open(ride_service, "w", encoding="utf-8") as f:
    f.writelines(new_ride_lines)

print("✅ Removed duplicate CreateRidePayload from ride.service.ts")

# Verify
print("\n[VERIFY] Running TypeScript check...")
exit_code = os.system("npx tsc --noEmit")
if exit_code == 0:
    print("\n✅ TypeScript check PASSED — 0 errors")
    print("\nCommit now:")
    print("  git add -A")
    print("  git commit -m 'consolidate: Phase A safe type merges + CreateRidePayload fix'")
else:
    print(f"\n⚠️ TypeScript check failed with exit code {exit_code}")
    print("Run 'npx tsc --noEmit' manually to see all errors.")
