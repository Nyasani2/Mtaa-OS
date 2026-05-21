'use client'
import SmartContractDeployer from '@/domains/civic/treasury/components/SmartContractDeployer'
import BlockchainStatus from '@/domains/civic/treasury/components/BlockchainStatus'

export default function SmartContractsPage() {
  return (
    <div className="space-y-6">
      <BlockchainStatus/>
      <SmartContractDeployer/>
    </div>
  )
}
