#!/bin/bash
# MTAA Phase 5 Cleanup: Remove standalone device-trust edge function
# The merged device-register now handles trust/revoke too

echo "=== MTAA Device Function Cleanup ==="

if [ -d "supabase/functions/device-trust" ]; then
  echo "Removing standalone device-trust edge function (now merged into device-register)..."
  rm -rf supabase/functions/device-trust
  echo "✅ Removed supabase/functions/device-trust"
else
  echo "ℹ️  device-trust folder not found — already clean"
fi

echo ""
echo "=== Done ==="
echo "Next: Run 'supabase functions deploy device-register' to deploy the merged function."
