'use client'
import { ReactNode } from 'react'
import { Landmark, Users, TrendingUp, TrendingDown } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { label: 'Debt Instruments', href: '/civic/treasury/debt-payroll/debt', icon: Landmark },
  { label: 'Payroll', href: '/civic/treasury/debt-payroll/payroll', icon: Users },
  { label: 'Cash Forecasts', href: '/civic/treasury/debt-payroll/forecasts', icon: TrendingUp },
  { label: 'Revenue Forecasts', href: '/civic/treasury/debt-payroll/forecasts/revenue', icon: TrendingDown }
]

export default function DebtPayrollShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border p-4">
        <div className="flex items-center gap-2 mb-4">
          <Landmark size={20} className="text-treasury-600"/>
          <h2 className="text-lg font-semibold text-gray-900">Debt & Payroll</h2>
        </div>
        <nav className="flex gap-2 flex-wrap">
          {navItems.map(item => {
            const Icon = item.icon
            const active = pathname === item.href || pathname?.startsWith(item.href + '/')
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active ? 'bg-treasury-600 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}>
                <Icon size={16}/> {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
      {children}
    </div>
  )
}
