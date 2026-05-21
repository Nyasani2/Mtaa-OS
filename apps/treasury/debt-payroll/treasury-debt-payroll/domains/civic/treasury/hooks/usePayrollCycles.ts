'use client'
import { useEffect, useState } from 'react'
import { PayrollCycle } from '../types/debtPayroll.types'
import { fetchPayrollCycles, createPayrollCycle, updatePayrollStatus, reversePayroll } from '../services/payrollCycleService'

export function usePayrollCycles() {
  const [cycles, setCycles] = useState<PayrollCycle[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchPayrollCycles().then(setCycles).finally(() => setLoading(false)) }, [])

  const create = async (cycle: Omit<PayrollCycle, 'id' | 'total_gross_pay' | 'total_deductions' | 'total_net_pay' | 'employee_count' | 'created_at'>) => {
    const created = await createPayrollCycle(cycle)
    setCycles(prev => [created, ...prev])
    return created
  }

  const updateStatus = async (id: string, status: PayrollCycle['status']) => {
    await updatePayrollStatus(id, status)
    setCycles(prev => prev.map(c => c.id === id ? { ...c, status } : c))
  }

  const reverse = async (id: string) => {
    await reversePayroll(id)
    setCycles(prev => prev.map(c => c.id === id ? { ...c, status: 'reversed' } : c))
  }

  return { cycles, loading, create, updateStatus, reverse }
}
