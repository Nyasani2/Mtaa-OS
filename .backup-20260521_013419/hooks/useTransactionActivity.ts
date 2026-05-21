import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export interface Transaction {
  id: string
  type: 'in' | 'out'
  amount: string
  description: string
  time: string
}

export function useTransactionActivity() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadTransactions()

    const channel = supabase
      .channel('wallet-transactions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wallet_transactions',
        },
        () => {
          loadTransactions()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const loadTransactions = async () => {
    try {
      setIsLoading(true)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setIsLoading(false)
        return
      }

      // get user wallets
      const { data: wallets, error: walletError } =
        await supabase
          .from('wallets')
          .select('id')
          .eq('user_id', user.id)

      if (walletError) {
        console.log(walletError)
        setIsLoading(false)
        return
      }

      const walletIds =
        wallets?.map((w) => w.id) || []

      if (walletIds.length === 0) {
        setTransactions([])
        setIsLoading(false)
        return
      }

      const {
        data: txs,
        error: txError,
      } = await supabase
        .from('wallet_transactions')
        .select('*')
        .in('wallet_id', walletIds)
        .order('created_at', {
          ascending: false,
        })
        .limit(20)

      if (txError) {
        console.log(txError)
        setIsLoading(false)
        return
      }

      const mapped: Transaction[] =
        (txs || []).map((tx: any) => ({
          id: tx.id,
          type:
            tx.type === 'credit'
              ? 'in'
              : 'out',

          amount: `KES ${Number(
            tx.amount || 0
          ).toLocaleString()}`,

          description:
            tx.description ||
            tx.reference ||
            'Wallet transaction',

          time: formatTime(tx.created_at),
        }))

      setTransactions(mapped)
    } catch (err) {
      console.log(err)
    } finally {
      setIsLoading(false)
    }
  }

  return {
    transactions,
    isLoading,
    refreshTransactions: loadTransactions,
  }
}

function formatTime(dateString: string) {
  const date = new Date(dateString)

  const now = new Date()

  const diff =
    Math.floor(
      (now.getTime() - date.getTime()) / 1000
    )

  if (diff < 60) {
    return 'Just now'
  }

  if (diff < 3600) {
    return `${Math.floor(diff / 60)} min ago`
  }

  if (diff < 86400) {
    return `${Math.floor(diff / 3600)} hr ago`
  }

  return `${Math.floor(diff / 86400)} day ago`
}
