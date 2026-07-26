#!/bin/bash
set -e

echo "🔧 MTAA OS Linting Setup"
echo "========================"

# Check we're in the right place
if [ ! -f "package.json" ]; then
    echo "❌ Error: No package.json found. Run this from ~/MTAA_OS_V10"
    exit 1
fi

# Merge scripts and devDependencies into package.json using Node
cat << 'NODEEOF' > /tmp/merge-package.js
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const additions = JSON.parse(fs.readFileSync('package-additions.json', 'utf8'));

// Merge scripts
pkg.scripts = { ...pkg.scripts, ...additions.scripts };

// Merge devDependencies
pkg.devDependencies = { ...pkg.devDependencies, ...additions.devDependencies };

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
console.log('✅ package.json updated');
NODEEOF

node /tmp/merge-package.js

# Install dependencies
echo "📦 Installing oxlint and knip..."
npm install

# Verify configs exist
echo "🔍 Verifying config files..."
for f in .oxlintrc.json knip.json .github/workflows/ci.yml; do
    if [ -f "$f" ]; then
        echo "  ✅ $f"
    else
        echo "  ❌ $f missing!"
        exit 1
    fi
done

echo ""
echo "🎉 Setup complete! Available commands:"
echo "   npm run lint:ox     → oxlint (max-warnings 0)"
echo "   npm run typecheck   → tsc --noEmit"
echo "   npm run knip        → dead code detection"
echo "   npm run lint:ci     → all three in sequence"
echo ""
echo "📋 Next steps:"
echo "   1. Review .oxlintrc.json — rules are conservative to start"
echo "   2. Enable stricter rules gradually by changing 'off' → 'warn' → 'error'"
echo "   3. Push to GitHub — CI will run on every PR"
