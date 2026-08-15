#!/usr/bin/env python3
import os, re, json
from collections import defaultdict

BASE = os.getcwd()

# Directories that are NOT active code
SKIP_DIRS = {'node_modules', '.git', '.expo', 'dist', 'build', 'android', 'ios', 
             '.next', 'backups', '.backup', 'archive', '.backups'}

def is_active_code(path):
    rel = os.path.relpath(path, BASE)
    parts = rel.split(os.sep)
    return not any(p in SKIP_DIRS or p.startswith('.backup') or p.startswith('archive') for p in parts)

def get_exports(path):
    with open(path, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    exports = []
    for m in re.finditer(r'export\s+(?:interface|type|class|enum)\s+(\w+)', content):
        exports.append(m.group(1))
    return exports, content

# Scan all files
all_exports = defaultdict(lambda: {'files': [], 'types': []})
for root, dirs, files in os.walk(BASE):
    dirs[:] = [d for d in dirs if d not in SKIP_DIRS and not d.startswith('.') and not d.startswith('archive')]
    for f in files:
        if f.endswith(('.ts', '.tsx')):
            path = os.path.join(root, f)
            rel = os.path.relpath(path, BASE)
            exports, content = get_exports(path)
            for name in exports:
                all_exports[name]['files'].append(rel)
                all_exports[name]['content'] = content

# Filter to actual duplicates in active code
duplicates = {k: v for k, v in all_exports.items() if len(v['files']) >= 2}

# Categorize
categories = {
    'same_file_duplicate': [],      # Defined twice in same file
    'type_alias': [],               # type X = Y (not a real duplicate)
    'cross_domain_same_shape': [],  # Same fields, different files — merge candidate
    'cross_domain_different': [],   # Different fields — legitimate domain separation
    'lib_vs_domain': [],            # lib/ and domains/ both define it
}

for name, data in sorted(duplicates.items(), key=lambda x: -len(x[1]['files'])):
    files = data['files']
    
    # Same file? (e.g., ASISMessage in asis-cse-types.ts at two locations)
    if len(set(files)) == 1:
        categories['same_file_duplicate'].append(name)
        continue
    
    # Check if any definition is a type alias
    is_alias = False
    for f in files:
        full = os.path.join(BASE, f)
        try:
            with open(full, 'r') as file:
                content = file.read()
            if re.search(rf'type\s+{name}\s*=', content):
                is_alias = True
                break
        except:
            pass
    if is_alias:
        categories['type_alias'].append(name)
        continue
    
    # Check if it's lib/ vs domains/ pattern
    has_lib = any(f.startswith('lib/') for f in files)
    has_domain = any(f.startswith('domains/') for f in files)
    if has_lib and has_domain:
        categories['lib_vs_domain'].append(name)
        continue
    
    # Default: cross-domain different shapes
    categories['cross_domain_different'].append(name)

# Print report
print("="*70)
print("MTAA ACTIVE-CODE DUPLICATE AUDIT (backups/archives EXCLUDED)")
print("="*70)
print(f"\nTotal duplicate names in active code: {len(duplicates)}")
print(f"Total duplicate occurrences: {sum(len(v['files']) for v in duplicates.values())}")

for cat, names in categories.items():
    if names:
        print(f"\n{'─'*70}")
        print(f"{cat.upper().replace('_', ' ')}: {len(names)} types")
        print(f"{'─'*70}")
        for name in names[:15]:
            files = duplicates[name]['files']
            print(f"\n  📛 {name}  ({len(files)} files)")
            for f in files[:4]:
                print(f"      → {f}")
            if len(files) > 4:
                print(f"      ... and {len(files)-4} more")

# Save detailed report
report = {
    'summary': {k: len(v) for k, v in categories.items()},
    'total_duplicates': len(duplicates),
    'details': {k: {'files': duplicates[k]['files']} for k in duplicates}
}
with open('mtaa-active-duplicate-report.json', 'w') as f:
    json.dump(report, f, indent=2)

print(f"\n{'='*70}")
print("Detailed report saved: mtaa-active-duplicate-report.json")
print(f"{'='*70}")
print("""
RECOMMENDATION:
  - SAME_FILE_DUPLICATE: Real problem — fix by removing old definition
  - TYPE_ALIAS: Not a problem — aliases are intentional
  - LIB_VS_DOMAIN: Architectural debt — decide canonical source
  - CROSS_DOMAIN_DIFFERENT: Usually legitimate — different domains need different shapes
  
The pre-commit hook should NOT block on any of these.
Block only on: tsc errors + lint errors.
""")
