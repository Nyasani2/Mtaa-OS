p = "app/(os)/wallet/index.tsx"
s = open(p).read()

if "Alert," not in s:
    s = s.replace("RefreshControl,", "RefreshControl, Alert,", 1)

# no infinite spinner when not (yet) authenticated
s = s.replace("""  useEffect(() => {
    if (isAuthenticated && user?.id) loadWalletData();
  }, [isAuthenticated, user?.id]);""",
"""  useEffect(() => {
    if (isAuthenticated && user?.id) loadWalletData();
    else { setIsLoading(false); setRefreshing(false); }
  }, [isAuthenticated, user?.id]);""")

# empty-safe read + auto-create wallet via canonical RPC + visible error
s = s.replace("""      const { data: account } = await supabase
        .from('wallet_accounts').select('balance').eq('user_id', user.id).single();
      const bal = account?.balance || 0;
      setBalance(bal);""",
"""      let account = (await supabase
        .from('wallet_accounts').select('balance').eq('user_id', user.id).maybeSingle()).data;
      if (!account) {
        for (const params of [{ p_user_id: user.id }, { user_id: user.id }]) {
          const r = await supabase.rpc('mtaa_get_or_create_wallet', params);
          if (!r.error) break;
        }
        account = (await supabase.from('wallet_accounts').select('balance').eq('user_id', user.id).maybeSingle()).data;
      }
      const bal = account?.balance || 0;
      setBalance(bal);""")

s = s.replace("} catch (err) { console.error('[Wallet] Load error:', err); }",
"} catch (err: any) { console.error('[Wallet] Load error:', err); Alert.alert('Wallet load failed', err?.message || String(err)); }")

open(p, "w").write(s)
print("✅ minimal fix applied to ORIGINAL wallet screen")
