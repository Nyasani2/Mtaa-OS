#!/usr/bin/env python3
import sys

filepath = "app/(os)/streets/index.tsx"
try:
    with open(filepath, "r") as f:
        text = f.read()
except FileNotFoundError:
    print("ERROR: " + filepath + " not found")
    sys.exit(1)

old_block = """          if (entry.isIntersecting) {
            v.muted = true;
            v.play().catch(() => {});
            setIsPlaying(true);
            setIsMuted(true);
          } else {
            v.pause();
            v.muted = true;
            setIsPlaying(false);
            setIsMuted(true);
          }"""
new_block = """          if (entry.isIntersecting) {
            v.muted = false;
            v.play().catch(() => {});
            setIsPlaying(true);
            setIsMuted(false);
          } else {
            v.pause();
            v.muted = true;
            setIsPlaying(false);
            setIsMuted(true);
          }"""

if old_block in text:
    text = text.replace(old_block, new_block)
    with open(filepath, "w") as f:
        f.write(text)
    print("OK: Visible videos now unmute on entry, hidden videos mute on exit.")
else:
    print("WARNING: Observer block not found exactly. No changes made.")
    print("Tip: Run this to find the line manually:")
    print('  grep -n "v.muted = true" app/(os)/streets/index.tsx')
