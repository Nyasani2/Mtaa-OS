#!/usr/bin/env python3
import os, re

path = "app/(os)/streets/create.tsx"
with open(path, "r") as f:
    src = f.read()

# ── FIX 1: Inject `user` from useAuthStore inside the component ──
if "const user = useAuthStore" not in src:
    # Find the main component function and inject right after the opening brace
    src = re.sub(
        r"(export default function \w+\(\)\s*\{)",
        r"\1\n  const user = useAuthStore((s) => s.user);",
        src, count=1
    )
    # Fallback if it's not exported as default or named differently
    if "const user = useAuthStore" not in src:
        src = re.sub(
            r"(function \w+\(\)\s*\{)",
            r"\1\n  const user = useAuthStore((s) => s.user);",
            src, count=1
        )

# ── FIX 2: Clean up the broken useStreets destructuring ──
# The previous script left ghost properties that don't exist in the hook
src = re.sub(r'\bisPosting\b,?', '', src)
src = re.sub(r'\buploadProgress\b,?', '', src)
src = re.sub(r'\bpostError\b', 'localError', src)  # Map to the existing localError state

# Clean up any double commas or trailing commas left behind
src = re.sub(r',\s*,', ',', src)
src = re.sub(r'\{\s*,', '{ ', src)
src = re.sub(r',\s*\}', ' }', src)
src = re.sub(r'\{\s*\}', '', src)  # Remove empty destructuring if it happens

# ── FIX 3: Add local state for isPosting ──
if "const [isPosting, setIsPosting]" not in src:
    # Inject right after the first useState declaration
    src = re.sub(
        r"(const \[[^\]]+\] = useState[^\n]+\n)",
        r"\1  const [isPosting, setIsPosting] = useState(false);\n",
        src, count=1
    )

# ── FIX 4: Wrap the createPost call with loading state and error handling ──
if "setIsPosting(true)" not in src and "await createPost" in src:
    src = src.replace(
        "const result = await createPost({",
        "setIsPosting(true);\n    try {\n      const result = await createPost({"
    )
    src = src.replace(
        "if (result) router.back();",
        "if (result) router.back();\n    } catch (e: any) { setLocalError(e.message || 'Failed to create post'); }\n    finally { setIsPosting(false); }"
    )

with open(path, "w") as f:
    f.write(src)

print("✅ create.tsx fully repaired — user bound, local state added, hook cleaned")
