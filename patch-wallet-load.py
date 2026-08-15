p = "app/(os)/wallet/index.tsx"
s = open(p).read()

# Alert import
if "Alert," not in s:
    s = s.replace("RefreshControl,", "RefreshControl, Alert,", 1)

# 1) Kill the infinite spinner: handle the not-authenticated case
s = s.replace("""  useEffect(() => {
    if (isAuthenticated && user?.id) loadWalletData();
  }, [isAuthenticated, user?.id]);""",
"""  useEffect(() => {
    if (isAuthenticated && user?.id) loadWalletData();
    else { setIsLoading(false); setRefreshing(false); }
  }, [isAuthenticated, user?.id]);""")

# 2) Empty-safe account read + surface the real error
s = s.replace(".from('wallet_accounts').select('balance').eq('user_id', user.id).single();",
              ".from('wallet_accounts').select('balance').eq('user_id', user.id).maybeSingle();")
s = s.replace("} catch (err) { console.error('[Wallet] Load error:', err); }",
"} catch (err: any) { console.error('[Wallet] Load error:', err); Alert.alert('Wallet load failed', err?.message || String(err)); }")

open(p, "w").write(s)
print("✅ wallet load hardened")
