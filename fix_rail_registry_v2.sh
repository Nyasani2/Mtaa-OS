
# ============================================================
# FIX: Move rail registry files to correct location
# ============================================================

# 1. Check where the files were created (in Downloads by mistake)
ls ~/Downloads/lib/integrations/rails/ 2>/dev/null || echo "No files in Downloads"

# 2. Create the correct directory if it doesn't exist
mkdir -p ~/MTAA_OS_V10/lib/integrations/rails/

# 3. Move the files from Downloads to the project
mv ~/Downloads/lib/integrations/rails/railRegistry.ts ~/MTAA_OS_V10/lib/integrations/rails/ 2>/dev/null || echo "railRegistry.ts not in Downloads"
mv ~/Downloads/lib/integrations/rails/rail-registry.ts ~/MTAA_OS_V10/lib/integrations/rails/ 2>/dev/null || echo "rail-registry.ts not in Downloads"

# 4. If move failed (files weren't created), generate them fresh in the right place
cd ~/MTAA_OS_V10

# Check if railRegistry.ts exists now
if [ ! -f "lib/integrations/rails/railRegistry.ts" ]; then
    echo "Creating railRegistry.ts in correct location..."
    cat > lib/integrations/rails/railRegistry.ts << 'RAILEOF'
export type RailStatus = 'active' | 'inactive' | 'error' | 'maintenance';
export type RailType = 'mpesa' | 'card' | 'bank' | 'crypto';

export interface RailConfig {
  id: string;
  name: string;
  type: RailType;
  status: RailStatus;
  endpoint: string;
}

const rails: RailConfig[] = [
  { id: 'mpesa', name: 'M-Pesa', type: 'mpesa', status: 'active', endpoint: '/api/mpesa' },
  { id: 'card', name: 'Card Payment', type: 'card', status: 'active', endpoint: '/api/card' },
  { id: 'bank', name: 'Bank Transfer', type: 'bank', status: 'active', endpoint: '/api/bank' },
];

export const railRegistry = {
  register: (config: RailConfig) => { rails.push(config); return config; },
  unregister: (id: string) => { const i = rails.findIndex(r => r.id === id); if (i > -1) rails.splice(i, 1); },
  list: () => [...rails],
  get: (id: string) => rails.find(r => r.id === id),
};

export const getRailStatus = (id: string): RailStatus => {
  const rail = rails.find(r => r.id === id);
  return rail?.status || 'inactive';
};

export const registerRail = (config: RailConfig) => railRegistry.register(config);
export const unregisterRail = (id: string) => railRegistry.unregister(id);
export const listActiveRails = () => rails.filter(r => r.status === 'active');
export const getRailById = (id: string) => rails.find(r => r.id === id);

export default railRegistry;
RAILEOF
fi

# 5. Create the kebab-case wrapper in the correct location
if [ ! -f "lib/integrations/rails/rail-registry.ts" ]; then
    echo "Creating rail-registry.ts wrapper in correct location..."
    cat > lib/integrations/rails/rail-registry.ts << 'WRAPEOF'
export * from './railRegistry';
export { default } from './railRegistry';
WRAPEOF
fi

# 6. Verify both files exist
echo ""
echo "=== Verification ==="
ls -la lib/integrations/rails/railRegistry.ts 2>/dev/null && echo "✅ railRegistry.ts" || echo "❌ railRegistry.ts MISSING"
ls -la lib/integrations/rails/rail-registry.ts 2>/dev/null && echo "✅ rail-registry.ts" || echo "❌ rail-registry.ts MISSING"

# 7. Clear caches and rebuild
echo ""
echo "Clearing Metro cache..."
rm -rf $TMPDIR/metro-* $TMPDIR/haste-map-* .expo/web/cache 2>/dev/null || true

echo ""
echo "✅ Fix complete. Run: npx expo start --clear"
