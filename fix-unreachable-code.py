import os, re

ROOT = os.path.dirname(os.path.abspath(__file__))
os.chdir(ROOT)

path = "lib/hooks/useStreets.ts"
with open(path, "r") as f:
    content = f.read()

# Fix 1: The mangled early return at the top of likePost
bad_pattern1 = r"if \(!user\?\.id\) return \{\s*searchPosts,\s*searchUsers,\s*searchHashtags, liked: false, count: 0 \};"
good_code1 = "if (!user?.id) return { liked: false, count: 0 };"
if re.search(bad_pattern1, content):
    content = re.sub(bad_pattern1, good_code1, content)
    print("✅ Fixed mangled early return in likePost.")

# Fix 2: The mangled return in the catch block
bad_pattern2 = r"return \{\s*searchPosts,\s*searchUsers,\s*searchHashtags, liked: false, count: 0 \};"
good_code2 = "return { liked: false, count: 0 };"
content = re.sub(bad_pattern2, good_code2, content)

# Fix 3: Remove any stray orphaned lines from previous bad injections
content = re.sub(r"^\s*searchPosts,\s*$", "", content, flags=re.MULTILINE)
content = re.sub(r"^\s*searchUsers,\s*$", "", content, flags=re.MULTILINE)
content = re.sub(r"^\s*searchHashtags, liked: false, count: 0 \};\s*$", "", content, flags=re.MULTILINE)

with open(path, "w") as f:
    f.write(content)

print("✅ Unreachable code removed.")
