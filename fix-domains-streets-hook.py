#!/usr/bin/env python3
import os, re

path = "domains/streets/hooks/useStreets.ts"
with open(path, "r") as f:
    src = f.read()

# 1. Remove the @ts-nocheck that was hiding these runtime crashes
src = src.replace("// @ts-nocheck\n", "")
src = src.replace("// @ts-nocheck\r\n", "")

# 2. Fix the mismatched function names from the service refactoring
renames = {
    r"\bgetPosts\b": "fetchStreetsPosts",
    r"\bgetAuthorProfiles\b": "fetchAuthorProfiles",
    r"\btoggleLike\b": "toggleLikePost",
    r"\bhasUserLiked\b": "checkUserLiked",
    r"\bgetComments\b": "fetchComments",
    r"\brepost\b": "repostPost",
}

for old, new in renames.items():
    src = re.sub(old, new, src)

with open(path, "w") as f:
    f.write(src)

print("✅ Fixed domains/streets hook import mismatches and removed @ts-nocheck")
