#!/bin/bash
# MTAA OS V10 — Error Fix Installation Script
# Run this from ~/MTAA_OS_V10 after downloading all ZIPs

echo "========================================"
echo "  MTAA OS V10 Error Fix Installer"
echo "========================================"
echo ""

PROJECT_DIR="$HOME/MTAA_OS_V10"
DOWNLOADS_DIR="$HOME/Downloads"

cd "$PROJECT_DIR" || { echo "ERROR: Cannot find $PROJECT_DIR"; exit 1; }

echo "[1/6] Extracting ZIP1: Wallet Hooks..."
unzip -o "$DOWNLOADS_DIR/ZIP1_WalletHooks.zip" -d .

echo "[2/6] Extracting ZIP2: Auth & Theme Hooks..."
unzip -o "$DOWNLOADS_DIR/ZIP2_AuthThemeHooks.zip" -d .

echo "[3/6] Extracting ZIP3: Education Hooks..."
unzip -o "$DOWNLOADS_DIR/ZIP3_EducationHooks.zip" -d .

echo "[4/6] Extracting ZIP4: Service Fixes..."
unzip -o "$DOWNLOADS_DIR/ZIP4_ServiceFixes.zip" -d .

echo "[5/6] Extracting ZIP5: Config & Scripts..."
unzip -o "$DOWNLOADS_DIR/ZIP5_ConfigScripts.zip" -d .

echo "[6/6] Applying tsconfig.json..."
cp tsconfig.json tsconfig.json.backup
cp tsconfig-updated.json tsconfig.json

echo ""
echo "========================================"
echo "  Installation Complete!"
echo "========================================"
echo ""
echo "Next steps:"
echo "  1. Add wallet-service additions to lib/services/wallet-service.ts"
echo "     (see wallet-service-additions.ts for the code)"
echo "  2. Run: npx tsc --noEmit"
echo "  3. Fix any remaining errors manually"
echo ""
echo "Files created:"
echo "  - domains/wallet/hooks/useWallet.ts"
echo "  - hooks/useAuth.ts"
echo "  - hooks/useTheme.ts"
echo "  - hooks/useOSKernel.ts"
echo "  - hooks/useMediaContent.ts"
echo "  - constants/theme.ts"
echo "  - domains/education/hooks/useClassManager.ts"
echo "  - domains/education/hooks/useAssignmentEngine.ts"
echo "  - lib/services/health-service.ts"
echo "  - lib/services/streets-service.ts"
echo "  - lib/services/profile-service.ts"
echo "  - lib/services/wallet-service-additions.ts"
echo "  - tsconfig.json (updated with civic exclusions)"
echo ""
