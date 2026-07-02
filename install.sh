#!/bin/bash
# MTAA Streets Final Fix Installation Script
# Run this from ~/MTAA_OS_V10

set -e

echo "=========================================="
echo "MTAA STREETS FINAL FIX INSTALLER"
echo "=========================================="
echo ""

# Check we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Run this script from ~/MTAA_OS_V10"
    exit 1
fi

echo "📁 Step 1: Backing up current files..."
cp app/\(os\)/streets/feed.tsx app/\(os\)/streets/feed.tsx.bak.$(date +%s) 2>/dev/null || true
cp domains/streets/components/CommentThread.tsx domains/streets/components/CommentThread.tsx.bak.$(date +%s) 2>/dev/null || true
cp domains/streets/components/CreateModal.tsx domains/streets/components/CreateModal.tsx.bak.$(date +%s) 2>/dev/null || true
cp domains/streets/components/InboxList.tsx domains/streets/components/InboxList.tsx.bak.$(date +%s) 2>/dev/null || true
cp domains/streets/screens/CreateScreen.tsx domains/streets/screens/CreateScreen.tsx.bak.$(date +%s) 2>/dev/null || true
cp domains/streets/screens/ShareScreen.tsx domains/streets/screens/ShareScreen.tsx.bak.$(date +%s) 2>/dev/null || true

echo "📦 Step 2: Installing fixed files..."
cp streets_final_fix/app/os/streets/feed.tsx app/\(os\)/streets/feed.tsx
cp streets_final_fix/domains/streets/components/CommentThread.tsx domains/streets/components/CommentThread.tsx
cp streets_final_fix/domains/streets/components/CreateModal.tsx domains/streets/components/CreateModal.tsx
cp streets_final_fix/domains/streets/components/InboxList.tsx domains/streets/components/InboxList.tsx
cp streets_final_fix/domains/streets/screens/CreateScreen.tsx domains/streets/screens/CreateScreen.tsx
cp streets_final_fix/domains/streets/screens/ShareScreen.tsx domains/streets/screens/ShareScreen.tsx

echo "🗑️  Step 3: Removing conflicting duplicate files..."
# Remove the (tabs) duplicate that conflicts with the stack routes
rm -f app/\(os\)/streets/\(tabs\)/feed.tsx 2>/dev/null || true
rm -f app/\(os\)/streets/\(tabs\)/create.tsx 2>/dev/null || true
rm -f app/\(os\)/streets/\(tabs\)/discover.tsx 2>/dev/null || true
rm -f app/\(os\)/streets/\(tabs\)/inbox.tsx 2>/dev/null || true
rm -f app/\(os\)/streets/\(tabs\)/profile.tsx 2>/dev/null || true

echo "🗑️  Step 4: Removing old conflicting streets files..."
rm -f lib/streets/index.ts 2>/dev/null || true
rm -f lib/streets/components/StreetsShell.tsx 2>/dev/null || true
rm -f lib_streets_index.ts 2>/dev/null || true

echo ""
echo "=========================================="
echo "✅ FILES INSTALLED SUCCESSFULLY"
echo "=========================================="
echo ""
echo "⚠️  IMPORTANT: You must run the SQL in Supabase BEFORE testing:"
echo ""
echo "   1. Open Supabase Dashboard → SQL Editor"
echo "   2. Open: streets_final_fix/sql/streets_schema_fix.sql"
echo "   3. Run the entire script"
echo ""
echo "📋 What this fix does:"
echo "   • Creates streets_posts, streets_likes, streets_comments tables"
echo "   • Creates triggers for auto-counting likes/comments/shares"
echo "   • Creates RLS policies for security"
echo "   • Fixes feed.tsx (no broken imports, working comments nav)"
echo "   • Fixes CommentThread (real data fetching, add/delete/like comments)"
echo "   • Fixes CreateModal (accepts visible prop, inserts to correct table)"
echo "   • Fixes CreateScreen (proper modal wrapper)"
echo "   • Fixes ShareScreen (router import before styles)"
echo "   • Fixes InboxList (TextInput import at top)"
echo "   • Removes duplicate (tabs) routes that conflicted"
echo ""
echo "🚀 After SQL is run, restart:"
echo "   npx expo start -c"
echo ""
