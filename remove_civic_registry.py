#!/usr/bin/env python3
import re

# Read the file
with open('lib/mtaa/appstore/unified-registry.ts', 'r') as f:
    content = f.read()

# Pattern to match the entire civic object
# It starts with "civic:" or a line containing "id: 'civic'"
# and ends with the closing brace+comma before the next app

# Find the civic object - match from "civic:" through its closing "},"
pattern = r"civic:\s*\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\},?\s*"

# Or simpler: find and remove lines from civic: through its closing },
lines = content.split('\n')
new_lines = []
skip = False
brace_count = 0

for line in lines:
    if "civic:" in line.lower() and not skip:
        skip = True
        brace_count = line.count('{') - line.count('}')
        continue

    if skip:
        brace_count += line.count('{') - line.count('}')
        if brace_count <= 0:
            skip = False
        continue

    new_lines.append(line)

# Write back
with open('lib/mtaa/appstore/unified-registry.ts', 'w') as f:
    f.write('\n'.join(new_lines))

print("Civic object removed successfully")
