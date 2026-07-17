#!/usr/bin/env python3
"""Fix TransportAdminScreen.tsx - add missing closing parens."""
import re

filepath = 'domains/education/pages/TransportAdminScreen.tsx'

with open(filepath, 'r') as f:
    lines = f.readlines()

fixed_lines = []
for line in lines:
    # Pattern: setRouteForm(p => ({ ...p, field: v })} prop
    # The }) closes the object, but we're missing the ) to close setRouteForm
    # and the } to close the JSX expression is also missing one )
    # Current broken: onChange={v => setRouteForm(p => ({ ...p, field: v })} placeholder
    # Should be:      onChange={v => setRouteForm(p => ({ ...p, field: v }))} placeholder

    # Fix: replace })} with }))} for setRouteForm and setPsvForm lines
    if 'setRouteForm(p => ({ ...p,' in line or 'setPsvForm(p => ({ ...p,' in line:
        # The broken pattern ends with })} — object close + JSX expression close
        # But setRouteForm needs one more ) to close its call
        # So })} becomes }))}
        line = line.replace('})}', '}))}')

    fixed_lines.append(line)

with open(filepath, 'w') as f:
    f.writelines(fixed_lines)

print("Fixed TransportAdminScreen.tsx")
