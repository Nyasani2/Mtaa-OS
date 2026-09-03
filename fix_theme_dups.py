import re

path = 'constants/theme.ts'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

seen = set()
new_lines = []
in_duplicate_block = False
brace_count = 0

for line in lines:
    if in_duplicate_block:
        brace_count += line.count('{') - line.count('}')
        new_lines.append(f"// [REMOVED DUP] {line}")
        if brace_count <= 0:
            in_duplicate_block = False
        continue

    # Match: export const FONTS, const SIZES, let COLORS, etc.
    match = re.match(r'^\s*(?:export\s+)?(?:const|let|var)\s+([a-zA-Z0-9_]+)\b', line)
    if match:
        var_name = match.group(1)
        if var_name in seen:
            # Duplicate found! Comment out this entire block.
            in_duplicate_block = True
            brace_count = line.count('{') - line.count('}')
            new_lines.append(f"// [REMOVED DUP] {line}")
            if brace_count <= 0:
                in_duplicate_block = False
            continue
        else:
            seen.add(var_name)
            
    new_lines.append(line)

with open(path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
print("✅ Cleaned duplicate declarations in constants/theme.ts")
