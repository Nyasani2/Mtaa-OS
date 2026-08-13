# URGENT: Run fix_broken_routes.py FIRST

The previous script broke some template literal strings. Run this FIRST:

```bash
cd ~/MTAA_OS_V10
python3 fix_broken_routes.py
npx tsc --noEmit
```

If errors remain, the files may need manual review. Cat the broken files and send them.
