#!/bin/bash
cd "$HOME/MTAA_OS_V10"
echo "Removing _ARCHIVE directories..."
find . -type d \( -name "_ARCHIVE" -o -name "archive" -o -name "ARCHIVE" -o -name "_archive" \) | grep -v node_modules | while read d; do echo "  🗑️  $d"; rm -rf "$d"; done
echo "Removing .bak files..."
find . -type f \( -name "*.bak" -o -name "*.backup" -o -name "*copy*" -o -name "*.orig" \) | grep -v node_modules | while read f; do echo "  🗑️  $f"; rm -f "$f"; done
echo "✅ Duplicate cleanup complete"
