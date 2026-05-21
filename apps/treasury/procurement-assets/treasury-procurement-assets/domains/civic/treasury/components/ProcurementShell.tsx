'use client'
import { ReactNode } from 'react'
import { ShoppingCart, FileText, Award, ClipboardList, Package } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { label: 'Requisitions', href: '/civic/treasury/procurement/requisitions', icon: FileText },
  { label: 'Tenders', href: '/civic/treasury/procurement/tenders', icon: ShoppingCart },
  { label: 'Contracts', href: '/civic/treasury/procurement/contracts', icon: Award },
  { label: 'Assets', href: '/civic/treasury/procurement/assets', icon: Package }
]

export default function ProcurementShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border p-4">
        <div className="flex items-center gap-2 mb-4">
          <ShoppingCart size={20} className="text-treasury-600"/>
          <h2 className="text-lg font-semibold text-gray-900">Procurement & Assets</h2>
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
