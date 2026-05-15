import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface Transaction {
  id: string;
  transaction_code: string;
  type: string;
  amount: number;
  description: string;
  ministry: string;
  recipient_entity: string;
  status: string;
  approvals_received: number;
  approvals_required: number;
  ai_risk_level: string;
  ai_recommendation: string;
  presidential_override: boolean;
  created_at: string;
  released_at: string;
}

export default function TreasuryWatch() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, [filter]);

  const fetchTransactions = async () => {
    setLoading(true);
    let query = supabase
      .from('civic_presidential_transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (filter !== 'all') {
      query = query.eq('status', filter);
    }

    const { data } = await query;
    setTransactions(data || []);
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      pending_approval: 'bg-yellow-100 text-yellow-800',
      cabinet_approved: 'bg-blue-100 text-blue-800',
      ps_approved: 'bg-indigo-100 text-indigo-800',
      ag_approved: 'bg-purple-100 text-purple-800',
      presidential_approved: 'bg-green-100 text-green-800',
      ai_hold: 'bg-orange-100 text-orange-800',
      ai_rejected: 'bg-red-100 text-red-800',
      released: 'bg-emerald-100 text-emerald-800',
      rejected: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-500'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getRiskColor = (level: string) => {
    const colors: Record<string, string> = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };
    return colors[level] || 'bg-gray-100 text-gray-800';
  };

  const totalAmount = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);

  if (loading) return <div className="p-8 text-center">Loading treasury data...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">Treasury Watch</h1>
          <p className="text-blue-200">Presidential transaction tracking & multi-level approval monitoring</p>
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="text-2xl font-bold">{transactions.length}</div>
              <div className="text-sm text-blue-200">Total Transactions</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="text-2xl font-bold">KES {(totalAmount / 1000000000).toFixed(2)}B</div>
              <div className="text-sm text-blue-200">Total Value</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="text-2xl font-bold">{transactions.filter(t => t.status === 'pending_approval').length}</div>
              <div className="text-sm text-blue-200">Pending Approval</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="text-2xl font-bold">{transactions.filter(t => t.ai_risk_level === 'high' || t.ai_risk_level === 'critical').length}</div>
              <div className="text-sm text-blue-200">High Risk Flags</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/civic" className="hover:text-blue-600">Civic Home</Link>
          <span>›</span>
          <span className="text-gray-800">Treasury Watch</span>
        </div>

        <div className="flex gap-2 flex-wrap mb-6">
          {[
            { key: 'all', label: 'All' },
            { key: 'pending_approval', label: 'Pending' },
            { key: 'cabinet_approved', label: 'Cabinet' },
            { key: 'presidential_approved', label: 'Presidential' },
            { key: 'released', label: 'Released' },
            { key: 'ai_hold', label: 'AI Hold' },
            { key: 'rejected', label: 'Rejected' }
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={`px-4 py-2 rounded-full text-sm font-medium transition ${
                filter === f.key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {transactions.map((tx) => (
            <div key={tx.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-sm text-gray-500">{tx.transaction_code}</span>
                    <span style={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(tx.status)}`}>
                      {tx.status.replace('_', ' ')}
                    </span>
                    {tx.presidential_override && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-800">
                        ⚠️ Override
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-800">{tx.description}</h3>
                  <div className="text-sm text-gray-500">{tx.ministry} → {tx.recipient_entity}</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-800">KES {tx.amount?.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">{tx.type.replace('_', ' ')}</div>
                </div>
              </div>

              <div className="flex items-center gap-4 mb-4">
                <div className="flex-1">
                  <div className="text-xs text-gray-500 mb-1">Approval Progress</div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${(tx.approvals_received / tx.approvals_required) * 100}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {tx.approvals_received} of {tx.approvals_required} approvals
                  </div>
                </div>
                {tx.ai_risk_level && (
                  <span style={`px-3 py-1 rounded-full text-xs font-medium ${getRiskColor(tx.ai_risk_level)}`}>
                    AI Risk: {tx.ai_risk_level}
                  </span>
                )}
              </div>

              <div className="flex gap-4 text-xs text-gray-500 border-t pt-3">
                <span>Created: {new Date(tx.created_at).toLocaleDateString()}</span>
                {tx.released_at && <span>Released: {new Date(tx.released_at).toLocaleDateString()}</span>}
                {tx.ai_recommendation && <span className="text-purple-600">AI: {tx.ai_recommendation}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
