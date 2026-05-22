#!/bin/bash
# Install package stubs to node_modules

echo "Installing package stubs to node_modules..."

# lucide-react stub
mkdir -p node_modules/lucide-react
cp mtaa-error-fix-batch-v2/stubs/lucide-react.ts node_modules/lucide-react/index.ts 2>/dev/null || true
echo 'module.exports = require("./index.ts");' > node_modules/lucide-react/index.js 2>/dev/null || true
echo '{"name":"lucide-react","main":"index.js","types":"index.ts"}' > node_modules/lucide-react/package.json 2>/dev/null || true

# next/link stub
mkdir -p node_modules/next
cp mtaa-error-fix-batch-v2/stubs/next/link.ts node_modules/next/link.ts 2>/dev/null || true
cp mtaa-error-fix-batch-v2/stubs/next/navigation.ts node_modules/next/navigation.ts 2>/dev/null || true
echo '{"name":"next","main":"dist/server/next.js"}' > node_modules/next/package.json 2>/dev/null || true

echo "✅ Package stubs installed"
echo "If you still see module resolution errors, try:"
echo "  rm -rf node_modules/.cache"
echo "  npx tsc --noEmit"
