
import os
import re

base = os.path.expanduser("~/MTAA_OS_V10")

# FIX 1: targetCategories in launcher
launcher_path = os.path.join(base, "app/(os)/index.tsx")
if os.path.exists(launcher_path):
    with open(launcher_path, "r") as f:
        content = f.read()

    # If targetCategories is used but not defined, inject it
    if "targetCategories" in content and "const targetCategories" not in content:
        # Find a good spot to inject — after the first const declaration in the component
        pattern = r'(export default function\s+\w+\([^)]*\)\s*\{)'
        replacement = r'
  const targetCategories: string[] = [];'
        content = re.sub(pattern, replacement, content, count=1)

        with open(launcher_path, "w") as f:
            f.write(content)
        print("[✓] Fixed targetCategories in launcher")
    else:
        print("[✓] targetCategories already defined or not used")
else:
    print("[!] Launcher not found at", launcher_path)

# FIX 2: loadGarage in garage index
garage_path = os.path.join(base, "app/(garage)/index.tsx")
if os.path.exists(garage_path):
    with open(garage_path, "r") as f:
        content = f.read()

    original = content
    # Remove loadGarage() calls from Promise.all arrays
    content = re.sub(r'loadGarage\(\),?\s*', '', content)
    # Remove standalone loadGarage() calls
    content = re.sub(r'await\s+loadGarage\(\);?\s*', '', content)
    content = re.sub(r'loadGarage\(\);?\s*', '', content)

    if content != original:
        with open(garage_path, "w") as f:
            f.write(content)
        print("[✓] Fixed loadGarage calls in garage index")
    else:
        print("[✓] No loadGarage calls to fix")
else:
    print("[!] Garage index not found at", garage_path)

print("Done.")
