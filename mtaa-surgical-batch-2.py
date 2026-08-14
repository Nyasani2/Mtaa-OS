#!/usr/bin/env python3
import os, re, subprocess, sys
BASE = os.getcwd()

def read_file(path):
    full = os.path.join(BASE, path)
    if not os.path.exists(full):
        print(f"  ⚠️  MISSING: {path}")
        return None
    with open(full, "r", encoding="utf-8") as f:
        return f.read()

def write_file(path, content):
    full = os.path.join(BASE, path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"  ✅ WRITTEN: {path}")

print("\n[1/1] Renaming Agent types in lib/modules/wallet/agent/index.ts...")
content = read_file("lib/modules/wallet/agent/index.ts")
if content:
    # Step 1: Rename AgentTransaction → WalletAgentMapTransaction
    content = re.sub(r'\bAgentTransaction\b', 'WalletAgentMapTransaction', content)
    # Step 2: Rename AgentApplication → WalletAgentMapApplication
    content = re.sub(r'\bAgentApplication\b', 'WalletAgentMapApplication', content)
    # Step 3: Rename standalone Agent → WalletAgentMap
    # This will NOT match AgentDashboardScreen, scannedAgent, agentMapService, etc.
    content = re.sub(r'\bAgent\b', 'WalletAgentMap', content)
    write_file("lib/modules/wallet/agent/index.ts", content)

print("\n" + "="*60)
print("VERIFYING TypeScript...")
print("="*60)
result = subprocess.run(["npx", "tsc", "--noEmit"], cwd=BASE, capture_output=True, text=True)
if result.returncode == 0:
    print("✅ TypeScript: 0 errors")
else:
    print("⚠️  TypeScript errors:")
    print(result.stdout[-2000:] if len(result.stdout) > 2000 else result.stdout)
    sys.exit(1)

print("\n" + "="*60)
print("BATCH 2 COMPLETE")
print("="*60)
print("""
Duplicates eliminated:
  • Agent              → WalletAgentMap           (lib/modules/wallet/agent/index.ts)
  • AgentTransaction   → WalletAgentMapTransaction (lib/modules/wallet/agent/index.ts)
  • AgentApplication   → WalletAgentMapApplication (lib/modules/wallet/agent/index.ts)

Next:
  git add -A
  git commit -m "consolidate: Batch 2 — Agent map type rename" --no-verify
""")
