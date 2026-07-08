import os

hookup_dir = os.path.expanduser('~/MTAA_OS_V10/app/(os)/hookup')
files = sorted([f for f in os.listdir(hookup_dir) if f.endswith(('.tsx', '.ts', '.sql', '.json', '.md'))])

lines = []
lines.append("=" * 80)
lines.append("HOOKUP MODULE COMPLETE DUMP — MTAA OS V10")
lines.append("Generated: 2026-07-08")
lines.append("=" * 80)
lines.append("")

lines.append("FILE INVENTORY")
lines.append("-" * 80)
total_size = 0
for f in files:
    size = os.path.getsize(os.path.join(hookup_dir, f))
    total_size += size
    lines.append(f"  {f:<45} {size:>10,} bytes")
lines.append(f"\n  TOTAL: {len(files)} files, {total_size:,} bytes\n")

for f in files:
    path = os.path.join(hookup_dir, f)
    lines.append("=" * 80)
    lines.append(f"FILE: {f}")
    lines.append("=" * 80)
    with open(path, 'r', encoding='utf-8', errors='replace') as fh:
        lines.append(fh.read())
    lines.append("")
    lines.append("")

with open(os.path.expanduser('~/Desktop/hookup_dump.txt'), 'w', encoding='utf-8') as out:
    out.write("\n".join(lines))

print("✅ Hookup dump saved to ~/Desktop/hookup_dump.txt")
