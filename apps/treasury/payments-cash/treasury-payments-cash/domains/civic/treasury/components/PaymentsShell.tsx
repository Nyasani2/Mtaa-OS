'use client'
import { ReactNode } from 'react'
import { FileText, Landmark, Coins, Scale, FileCode } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { label: 'Expenditures', href: '/civic/treasury/payments/expenditures', icon: FileText },
  { label: 'TSA Accounts', href: '/civic/treasury/payments/tsa', icon: Landmark },
  { label: 'Revenue', href: '/civic/treasury/payments/revenue', icon: Coins },
  { label: 'Reconciliation', href: '/civic/treasury/payments/reconciliation', icon: Scale },
  { label: 'Smart Contracts', href: '/civic/treasury/payments/smart-contracts', icon: FileCode }
]

export default function PaymentsShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border p-4">
        <div className="flex items-center gap-2 mb-4">
          <Landmark size={20} className="text-treasury-600"/>
          <h2 className="text-lg font-semibold text-gray-900">Payments & Cash</h2>
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
