import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface Contractor {
  id: string;
  name: string;
  registration_number: string;
  company_type: string;
  agpo_category: string;
  company_score: number;
  projects_completed: number;
  total_contract_value: number;
  blacklist_status: string;
  tax_compliant: boolean;
  county: string;
}

export default function ContractorList() {
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContractors();
  }, [filter, search]);

  const fetchContractors = async () => {
    setLoading(true);
    let query = supabase
      .from('civic_contractors')
      .select('id, name, registration_number, company_type, agpo_category, company_score, projects_completed, total_contract_value, blacklist_status, tax_compliant, county')
      .order('company_score', { ascending: false });

    if (filter === 'agpo') {
      query = query.eq('agpo_certified', true);
    } else if (filter === 'blacklisted') {
      query = query.eq('blacklist_status', 'blacklisted');
    } else if (filter === 'watch') {
      query = query.eq('blacklist_status', 'watch');
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,registration_number.ilike.%${search}%,county.ilike.%${search}%`);
    }

    const { data } = await query;
    setContractors(data || []);
    setLoading(false);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusBadge = (status: string, tax: boolean) => {
    if (status === 'blacklisted') return <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-xs">Blacklisted</span>;
    if (status === 'watch') return <span className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 text-xs">Watch</span>;
    if (!tax) return <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 text-xs">Tax Non-Compliant</span>;
    return <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 text-xs">Clear</span>;
  };

  if (loading) return <div className="p-8 text-center">Loading contractors...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <Link href="/civic" className="hover:text-blue-600">Civic Home</Link>
            <span>›</span>
            <span className="text-gray-800">Contractors</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <h1 className="text-3xl font-bold text-gray-800">Vetted Contractors</h1>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contractors..."
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            {[
              { key: 'all', label: 'All' },
              { key: 'agpo', label: 'AGPO Certified' },
              { key: 'watch', label: 'Watch List' },
              { key: 'blacklisted', label: 'Blacklisted' }
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
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {contractors.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No contractors found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contractors.map((c) => (
              <Link
                key={c.id}
                href={`/civic/contractor/${c.id}`}
                className="bg-white rounded-lg shadow hover:shadow-md transition p-5"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-800">{c.name}</h3>
                    <div className="text-xs text-gray-500 font-mono">{c.registration_number}</div>
                  </div>
                  {getStatusBadge(c.blacklist_status, c.tax_compliant)}
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${c.company_score}%` }}
                    />
                  </div>
                  <span style={`text-sm font-bold ${getScoreColor(c.company_score)}`}>
                    {c.company_score}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                  <div className="bg-gray-50 p-2 rounded">
                    <div className="text-gray-500 text-xs">Projects</div>
                    <div className="font-medium">{c.projects_completed}</div>
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <div className="text-gray-500 text-xs">Value</div>
                    <div className="font-medium">KES {(c.total_contract_value / 1000000).toFixed(1)}M</div>
                  </div>
                </div>

                <div className="flex gap-2 text-xs text-gray-500">
                  <span className="bg-blue-50 px-2 py-1 rounded">{c.company_type || 'Local'}</span>
                  {c.agpo_category && c.agpo_category !== 'none' && (
                    <span className="bg-purple-50 px-2 py-1 rounded capitalize">AGPO: {c.agpo_category}</span>
                  )}
                  <span className="bg-gray-100 px-2 py-1 rounded">{c.county || 'N/A'}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
