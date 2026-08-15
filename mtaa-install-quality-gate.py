#!/usr/bin/env python3
import os, subprocess, sys, json

BASE = os.getcwd()

def run(cmd, cwd=BASE):
    return subprocess.run(cmd, shell=True, cwd=cwd, capture_output=True, text=True)

print("="*60)
print("INSTALLING QUALITY GATE (pre-commit hook)")
print("="*60)

# ── 1. Check if husky is installed ───────────────────────────
print("\n[1/4] Checking for husky...")
pkg = {}
with open("package.json", "r") as f:
    pkg = json.load(f)

has_husky = "husky" in pkg.get("devDependencies", {}) or os.path.exists(".husky")
if has_husky:
    print("  ℹ️  husky already in devDependencies or .husky exists")
else:
    print("  📦 Installing husky + lint-staged...")
    r = run("npm install --save-dev husky lint-staged")
    if r.returncode != 0:
        print("  ❌ npm install failed:")
        print(r.stderr[-500:])
        sys.exit(1)
    print("  ✅ Installed husky + lint-staged")

# ── 2. Ensure prepare script exists ──────────────────────────
print("\n[2/4] Configuring package.json prepare script...")
with open("package.json", "r") as f:
    content = f.read()
    pkg = json.load(f)

if "prepare" not in pkg.get("scripts", {}):
    pkg["scripts"]["prepare"] = "husky"
    with open("package.json", "w") as f:
        json.dump(pkg, f, indent=2)
    print("  ✅ Added 'prepare': 'husky' to package.json")
else:
    print("  ℹ️  prepare script already exists")

# ── 3. Configure lint-staged in package.json ─────────────────
print("\n[3/4] Configuring lint-staged...")
if "lint-staged" not in pkg:
    pkg["lint-staged"] = {
        "*.{ts,tsx}": [
            "bash -c 'npm run typecheck'",
            "npm run lint:ci -- --max-warnings=0"
        ]
    }
    with open("package.json", "w") as f:
        json.dump(pkg, f, indent=2)
    print("  ✅ Added lint-staged config to package.json")
else:
    print("  ℹ️  lint-staged config already exists")

# ── 4. Create the pre-commit hook ────────────────────────────
print("\n[4/4] Creating pre-commit hook...")
os.makedirs(".husky", exist_ok=True)

hook_path = os.path.join(BASE, ".husky", "pre-commit")
hook_content = """#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

echo "🔒 MTAA Quality Gate — Running checks..."

# TypeScript type check
echo "→ Running TypeScript check..."
npx tsc --noEmit
if [ $? -ne 0 ]; then
    echo "❌ TypeScript errors found. Commit blocked."
    exit 1
fi

# Lint check
echo "→ Running lint check..."
npm run lint:ci
if [ $? -ne 0 ]; then
    echo "❌ Lint errors found. Commit blocked."
    exit 1
fi

echo "✅ Quality gate passed. Commit allowed."
"""

with open(hook_path, "w") as f:
    f.write(hook_content)
os.chmod(hook_path, 0o755)
print(f"  ✅ Created: {hook_path}")

# ── 5. Run prepare to ensure husky is hooked ─────────────────
print("\n[5/4] Running husky install...")
r = run("npx husky install")
if r.returncode == 0:
    print("  ✅ Husky hooks active")
else:
    print("  ⚠️  husky install output:", r.stderr[-300:])

# ── 6. Verify the hook is registered ─────────────────────────
print("\n[6/4] Verifying git hooks...")
r = run("ls -la .git/hooks/pre-commit")
if r.returncode == 0:
    print("  ✅ Git pre-commit hook is registered")
else:
    print("  ⚠️  Git pre-commit hook not found in .git/hooks/")

print("\n" + "="*60)
print("QUALITY GATE INSTALLED")
print("="*60)
print("""
RULES GOING FORWARD:
  1. NEVER use 'git commit --no-verify' again
  2. If TypeScript has errors, the commit is BLOCKED
  3. If lint:ci fails, the commit is BLOCKED
  4. Fix first, then commit

NEXT STEP:
  npm run prepare
  git add package.json package-lock.json .husky/
  git commit -m "chore: install pre-commit quality gate"
""")
