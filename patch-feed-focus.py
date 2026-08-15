import os, re
os.chdir(os.path.dirname(os.path.abspath(__file__)))
p = "app/(os)/streets/index.tsx"; s = open(p).read()
if "useIsFocused" not in s:
    s = s.replace("import { useAuthStore } from '@/lib/auth/store/auth.store';",
                  "import { useAuthStore } from '@/lib/auth/store/auth.store';\nimport { useIsFocused } from '@react-navigation/native';")
    s = s.replace("const { user } = useAuthStore();", "const { user } = useAuthStore();\n  const isFocused = useIsFocused();")
    s = s.replace("isVisible={visiblePostId === item.id}", "isVisible={isFocused && visiblePostId === item.id}")
    s = s.replace("  const togglePlay = () => {",
"""  useEffect(() => () => {
    const v = videoRef.current;
    if (v) { v.pause(); v.muted = true; }
  }, []);

  const togglePlay = () => {""")
    open(p, "w").write(s); print("✅ feed: focus-aware autoplay + unmount cleanup")
else:
    print("✅ feed already patched")
