import ProcurementShell from '@/domains/civic/treasury/components/ProcurementShell'

export default function ProcurementLayout({ children }: { children: React.ReactNode }) {
  return <ProcurementShell>{children}</ProcurementShell>
}
