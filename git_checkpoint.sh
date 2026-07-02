#!/bin/bash
# MTAA OS V10 — Streets Checkpoint Commit Script
# Run this from ~/MTAA_OS_V10

cd ~/MTAA_OS_V10

echo "=== MTAA OS V10 — Git Checkpoint ==="
echo ""

# Check if git repo exists
if [ ! -d .git ]; then
    echo "Initializing git repo..."
    git init
    git branch -M main
fi

# Add all current changes
echo "Adding all changes..."
git add .

# Create checkpoint commit with timestamp
COMMIT_MSG="checkpoint: streets partial fix — profiles working, media/thumbnails/RLS pending revisit"
echo "Committing with message: $COMMIT_MSG"
git commit -m "$COMMIT_MSG" || echo "Nothing new to commit (or commit failed)"

echo ""
echo "=== Current git status ==="
git status --short

echo ""
echo "=== Last 3 commits ==="
git log --oneline -3

echo ""
echo "=== Files changed in last commit ==="
git diff --name-only HEAD~1 HEAD 2>/dev/null || echo "(first commit)"

echo ""
echo "✅ Checkpoint saved. You can now switch branches or continue."
