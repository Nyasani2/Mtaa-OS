# MTAA Streets Frontend Fix

## Extraction Commands

Run these from ~/MTAA_OS_V10:

```bash
cd ~/MTAA_OS_V10

# Backup current files
cp domains/streets/services/commentService.ts domains/streets/services/commentService.ts.bak 2>/dev/null || true
cp domains/streets/hooks/useComments.ts domains/streets/hooks/useComments.ts.bak 2>/dev/null || true
cp domains/streets/components/CommentThread.tsx domains/streets/components/CommentThread.tsx.bak 2>/dev/null || true
cp domains/streets/components/CreateModal.tsx domains/streets/components/CreateModal.tsx.bak 2>/dev/null || true
cp domains/streets/components/InboxList.tsx domains/streets/components/InboxList.tsx.bak 2>/dev/null || true
cp domains/streets/screens/CreateScreen.tsx domains/streets/screens/CreateScreen.tsx.bak 2>/dev/null || true
cp domains/streets/screens/ShareScreen.tsx domains/streets/screens/ShareScreen.tsx.bak 2>/dev/null || true

# Copy fixed files
cp streets_frontend_fix/domains/streets/services/commentService.ts domains/streets/services/commentService.ts
cp streets_frontend_fix/domains/streets/hooks/useComments.ts domains/streets/hooks/useComments.ts
cp streets_frontend_fix/domains/streets/components/CommentThread.tsx domains/streets/components/CommentThread.tsx
cp streets_frontend_fix/domains/streets/components/CreateModal.tsx domains/streets/components/CreateModal.tsx
cp streets_frontend_fix/domains/streets/components/InboxList.tsx domains/streets/components/InboxList.tsx
cp streets_frontend_fix/domains/streets/screens/CreateScreen.tsx domains/streets/screens/CreateScreen.tsx
cp streets_frontend_fix/domains/streets/screens/ShareScreen.tsx domains/streets/screens/ShareScreen.tsx

# Restart
npx expo start -c
```

## Files Fixed

| File | Fix |
|------|-----|
| commentService.ts | Fixed column names, added addComment/addReply aliases |
| useComments.ts | Added useQuery to fetch comments data |
| CommentThread.tsx | Uses real comments data instead of data={[]} |
| CreateModal.tsx | Added visible prop for modal usage |
| InboxList.tsx | Fixed TextInput import order |
| CreateScreen.tsx | Proper modal wrapper |
| ShareScreen.tsx | Fixed router import order |
