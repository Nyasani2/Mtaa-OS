import { useEffect, useState } from 'react'
import { walletEventBus } from '@/lib/hookup/wallet-bridge/walletEventBus'
import { useWalletStore } from '@/lib/stores/wallet-store'

export function useWalletLive() {
  const {
    setBalance,
    setLoading,
    setLastTransaction,
  } = useWalletStore()

  const [connected, setConnected] =
    useState(false)

  useEffect(() => {
    setLoading(true)

    const unsubscribe =
      walletEventBus.on((event) => {
        switch (event.type) {
          case 'WALLET_LOADED':
            setConnected(true)
            setLoading(false)
            break

          case 'BALANCE_UPDATED':
            setBalance(event.payload.balance)
            break

          case 'TRANSACTION_CREATED':
            if (event.payload?.list?.length) {
              setLastTransaction(
                event.payload.list[0]?.id
              )
            }
            break

          case 'TRANSACTION_FAILED':
            setLoading(false)
            break
        }
      })

    return () => {
      unsubscribe()
    }
  }, [])

  return {
    connected,
  }
}
