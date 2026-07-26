#!/usr/bin/env bash
# MTAA OS -- Missing Import Scanner (Bash Version)
# Scans app/ and lib/ for imports that point to non-existent local files

set -euo pipefail

PROJECT_ROOT="$(pwd)"
SEARCH_DIRS=("app" "lib")

# Known npm packages to skip
SKIP_PACKAGES=(
  react react-native react-native-safe-area-context react-native-webview
  expo-router expo-constants expo-secure-store expo-image-picker
  expo-notifications expo-linking expo-font expo-splash-screen
  expo-status-bar expo-updates expo-auth-session expo-web-browser
  @expo/vector-icons @expo/config-plugins @expo/prebuild-config
  zustand axios date-fns lodash uuid base64-js
  typescript tslib @types/react @types/react-native
  metro metro-config @babel babel-preset-expo
  jest @testing-library eslint prettier
  tailwindcss nativewind class-variance-authority clsx tailwind-merge
  @radix-ui @tanstack react-query @react-navigation
  i18next react-i18next i18next-http-backend
  socket.io-client @supabase/supabase-js @supabase/realtime-js
  react-native-maps react-native-gesture-handler react-native-reanimated
  react-native-screens react-native-svg react-native-paper
  react-native-elements react-native-vector-icons
  @stripe/stripe-react-native @react-native-async-storage/async-storage
  react-native-keychain react-native-encrypted-storage
  react-native-image-picker react-native-document-picker
  react-native-fs react-native-share
  react-native-linear-gradient react-native-blur lottie-react-native
  react-native-chart-kit victory-native react-native-calendars
  react-native-modal react-native-toast-message react-native-flash-message
)

is_skipped() {
  local pkg="$1"
  for skip in "${SKIP_PACKAGES[@]}"; do
    if [[ "$pkg" == "$skip" ]]; then return 0; fi
  done
  return 1
}

resolve_alias() {
  local imp="$1"
  local base="${PROJECT_ROOT}/${imp#@/}"
  echo "${base}.ts"
  echo "${base}.tsx"
  echo "${base}.js"
  echo "${base}.jsx"
  echo "${base}/index.tsx"
  echo "${base}/index.ts"
  echo "${base}/index.js"
}

resolve_relative() {
  local src_dir="$1"
  local imp="$2"
  local target
  target="$(cd "$src_dir" && realpath -m "$imp" 2>/dev/null || echo "${src_dir}/${imp}")"
  echo "${target}.ts"
  echo "${target}.tsx"
  echo "${target}.js"
  echo "${target}.jsx"
  echo "${target}/index.tsx"
  echo "${target}/index.ts"
  echo "${target}/index.js"
}

missing_count=0
files_scanned=0
declare -A missing_by_file

echo "======================================================================"
echo "  MTAA OS -- Missing Import Scanner"
echo "  Project: ${PROJECT_ROOT}"
echo "  Scanning: ${SEARCH_DIRS[*]}"
echo "======================================================================"

for search_dir in "${SEARCH_DIRS[@]}"; do
  dir_path="${PROJECT_ROOT}/${search_dir}"
  if [[ ! -d "$dir_path" ]]; then
    echo "  ! Directory not found: ${search_dir}"
    continue
  fi

  while IFS= read -r -d '' filepath; do
    files_scanned=$((files_scanned + 1))
    src_dir=$(dirname "$filepath")

    # Extract import statements
    grep -nE "import\s+.*\s+from\s+['"]|import\s*\(\s*['"]|require\s*\(\s*['"]" "$filepath" 2>/dev/null | while IFS=: read -r line_no line; do
      # Extract the path from quotes
      imp=$(echo "$line" | grep -oE "['"][^'"]+['"]" | tail -1 | sed "s/['"]//g")

      # Skip if not local
      if [[ ! "$imp" =~ ^\. && ! "$imp" =~ ^@/ ]]; then
        # Check if it's a known package
        pkg="${imp%%/*}"
        if [[ "$pkg" == "@"* ]]; then
          pkg="${imp%%/*}/${imp#*/}"
          pkg="${pkg%%/*}"
        fi
        if is_skipped "$pkg"; then continue; fi
        # Unknown package -- skip for now (could be a local alias we don't know)
        continue
      fi

      found=0
      if [[ "$imp" == @/* ]]; then
        while IFS= read -r candidate; do
          if [[ -e "$candidate" ]]; then found=1; break; fi
        done < <(resolve_alias "$imp")
      else
        while IFS= read -r candidate; do
          if [[ -e "$candidate" ]]; then found=1; break; fi
        done < <(resolve_relative "$src_dir" "$imp")
      fi

      if [[ $found -eq 0 ]]; then
        rel_path=$(realpath --relative-to="$PROJECT_ROOT" "$filepath")
        echo "MISSING:${rel_path}:${line_no}:${imp}"
      fi
    done
  done < <(find "$dir_path" -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) -print0)
done > /tmp/mtaa_missing_imports.txt

# Count and report
total_missing=$(wc -l < /tmp/mtaa_missing_imports.txt | tr -d ' ')

echo ""
echo "  Files scanned: ${files_scanned}"
echo "  Missing imports: ${total_missing}"
echo "----------------------------------------------------------------------"

if [[ "$total_missing" -eq 0 ]]; then
  echo ""
  echo "  OK ALL IMPORTS RESOLVED -- no missing local modules!"
  exit 0
fi

# Group by file and print
cut -d: -f1 /tmp/mtaa_missing_imports.txt | sort -u | while IFS= read -r file; do
  echo ""
  echo "  X ${file}"
  grep "^${file}:" /tmp/mtaa_missing_imports.txt | while IFS=: read -r _ line_no imp; do
    echo "      Line ${line_no}:  import from '${imp}'"
  done
done

echo ""
echo "  Total missing: ${total_missing} import(s)"
exit 1
