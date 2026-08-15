import json, os

os.chdir(os.path.dirname(os.path.abspath(__file__)))

INVALID = ["optionalDependencies", "peerDependencies"]
fixed = False

# Try standalone knip config files first
for cfg in ["knip.json", ".knip.json", "knip.jsonc"]:
    if os.path.exists(cfg):
        with open(cfg) as f:
            data = json.load(f)
        rules = data.get("rules", {})
        removed = [k for k in INVALID if k in rules]
        for k in removed:
            del rules[k]
        if removed:
            with open(cfg, "w") as f:
                json.dump(data, f, indent=2)
            print(f"{cfg}: removed invalid rules -> {removed}")
            fixed = True
        else:
            print(f"{cfg}: no invalid rules found")
        break

# Also check package.json "knip" field
if not fixed and os.path.exists("package.json"):
    with open("package.json") as f:
        pkg = json.load(f)
    if isinstance(pkg.get("knip"), dict):
        rules = pkg["knip"].get("rules", {})
        removed = [k for k in INVALID if k in rules]
        for k in removed:
            del rules[k]
        if removed:
            with open("package.json", "w") as f:
                json.dump(pkg, f, indent=2)
            print(f"package.json knip: removed invalid rules -> {removed}")
            fixed = True

print("Done." if fixed else "No changes needed / config not found.")
