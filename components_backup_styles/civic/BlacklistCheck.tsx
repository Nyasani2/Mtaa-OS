import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface BlacklistResult {
  id: string;
  entity_name: string;
  entity_type: string;
  id_number: string;
  kra_pin: string;
  reason: string;
  blacklist_date: string;
  is_active: boolean;
  related_entities: Array<{ name: string; relationship: string }>;
}

export default function BlacklistCheck() {
  const [searchType, setSearchType] = useState<'name' | 'id' | 'kra'>('name');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<BlacklistResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);

    let dbQuery = supabase.from('civic_blacklist_registry').select('*').eq('is_active', true);

    if (searchType === 'name') {
      dbQuery = dbQuery.ilike('entity_name', `%${query}%`);
    } else if (searchType === 'id') {
      dbQuery = dbQuery.eq('id_number', query);
    } else if (searchType === 'kra') {
      dbQuery = dbQuery.eq('kra_pin', query);
    }

    const { data } = await dbQuery;
    setResults(data || []);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-red-900 text-white py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-2">Blacklist Registry</h1>
          <p className="text-red-200">Verify entities against the national anti-corruption database</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/civic" className="hover:text-blue-600">Civic Home</Link>
          <span>›</span>
          <span className="text-gray-800">Blacklist Check</span>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <form onSubmit={handleSearch}>
            <div className="flex gap-2 mb-4">
              {[
                { key: 'name' as const, label: 'Entity Name' },
                { key: 'id' as const, label: 'ID Number' },
                { key: 'kra' as const, label: 'KRA PIN' }
              ].map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => { setSearchType(t.key); setQuery(''); }}
                  style={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    searchType === t.key ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Enter ${searchType === 'name' ? 'company or person name' : searchType === 'id' ? 'national ID number' : 'KRA PIN'}...`}
                className="flex-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition disabled:opacity-50"
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </form>
        </div>

        {searched && (
          <div>
            {results.length === 0 ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
                <div className="text-4xl mb-2">✅</div>
                <h2 className="text-xl font-semibold text-green-800 mb-2">No Records Found</h2>
                <p className="text-green-600">This entity does not appear in the blacklist registry.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <span className="text-red-800 font-semibold">⚠️ {results.length} record(s) found</span>
                </div>
                
                {results.map((r) => (
                  <div key={r.id} className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">{r.entity_name}</h3>
                        <div className="flex gap-2 text-sm text-gray-500">
                          <span className="capitalize">{r.entity_type.replace('_', ' ')}</span>
                          {r.id_number && <span>ID: {r.id_number}</span>}
                          {r.kra_pin && <span>KRA: {r.kra_pin}</span>}
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                        ACTIVE BLACKLIST
                      </span>
                    </div>

                    <div className="bg-red-50 p-4 rounded-lg mb-4">
                      <div className="text-sm text-red-800 font-medium mb-1">Reason for Blacklisting:</div>
                      <p className="text-red-700">{r.reason}</p>
                    </div>

                    <div className="flex gap-4 text-sm text-gray-500 mb-3">
                      <span>Blacklisted: {new Date(r.blacklist_date).toLocaleDateString()}</span>
                    </div>

                    {r.related_entities && r.related_entities.length > 0 && (
                      <div className="border-t pt-3">
                        <div className="text-sm text-gray-500 mb-2">Related Entities:</div>
                        <div className="flex gap-2 flex-wrap">
                          {r.related_entities.map((rel, idx) => (
                            <span key={idx} className="text-sm bg-gray-100 px-3 py-1 rounded-full">
                              {rel.name} ({rel.relationship})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
