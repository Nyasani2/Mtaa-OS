'use client'
import { ReactNode } from 'react'
import { Wallet, FileText, Receipt, Lock, Users, ArrowLeftRight } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { label: 'Budget Cycles', href: '/civic/treasury/budget/cycles', icon: Wallet },
  { label: 'Allocations', href: '/civic/treasury/budget/allocations', icon: FileText },
  { label: 'Warrants', href: '/civic/treasury/budget/warrants', icon: Receipt },
  { label: 'Commitments', href: '/civic/treasury/budget/commitments', icon: Lock },
  { label: 'Approvals', href: '/civic/treasury/budget/approvals', icon: Users },
  { label: 'Delegations', href: '/civic/treasury/budget/delegations', icon: ArrowLeftRight }
]

export default function BudgetShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border p-4">
        <div className="flex items-center gap-2 mb-4">
          <Wallet size={20} className="text-treasury-600"/>
          <h2 className="text-lg font-semibold text-gray-900">Budget & Planning</h2>
        </div>
        <nav className="flex gap-2">
          {navItems.map(item => {
            const Icon = item.icon
            const active = pathname === item.href
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
