import PaymentsShell from '@/domains/civic/treasury/components/PaymentsShell'

export default function PaymentsLayout({ children }: { children: React.ReactNode }) {
  return <PaymentsShell>{children}</PaymentsShell>
}
