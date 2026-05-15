import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/router';
import Link from 'next/link';

interface Project {
  id: string;
  project_code: string;
  name: string;
  ministry: string;
  county: string;
  budget_allocated: number;
  budget_spent: number;
  completion_pct: number;
  status: string;
  contractor: {
    name: string;
    registration_number: string;
  } | null;
  start_date: string;
  expected_completion: string;
}

export default function ProjectList() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, [filter, search]);

  const fetchProjects = async () => {
    setLoading(true);
    let query = supabase
      .from('civic_projects')
      .select(`
        id, project_code, name, ministry, county,
        budget_allocated, budget_spent, completion_pct, status,
        start_date, expected_completion,
        contractor:civic_contractors(name, registration_number)
      `)
      .order('created_at', { ascending: false });

    if (filter !== 'all') {
      query = query.eq('status', filter);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,ministry.ilike.%${search}%,county.ilike.%${search}%`);
    }

    const { data } = await query;
    setProjects((data as any) || []);
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      planning: 'bg-gray-100 text-gray-800',
      procurement: 'bg-purple-100 text-purple-800',
      active: 'bg-green-100 text-green-800',
      on_track: 'bg-blue-100 text-blue-800',
      at_risk: 'bg-yellow-100 text-yellow-800',
      stalled: 'bg-red-100 text-red-800',
      completed: 'bg-emerald-100 text-emerald-800',
      abandoned: 'bg-gray-100 text-gray-500'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'on_track', label: 'On Track' },
    { key: 'at_risk', label: 'At Risk' },
    { key: 'stalled', label: 'Stalled' },
    { key: 'completed', label: 'Completed' }
  ];

  if (loading) return <div className="p-8 text-center">Loading projects...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <Link href="/civic" className="hover:text-blue-600">Civic Home</Link>
            <span>›</span>
            <span className="text-gray-800">Projects</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <h1 className="text-3xl font-bold text-gray-800">Government Projects</h1>
            <div className="flex gap-2">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search projects..."
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            {filters.map((f) => (
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
        {projects.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No projects found.</div>
        ) : (
          <div className="space-y-4">
            {projects.map((proj) => (
              <Link
                key={proj.id}
                href={`/civic/project/${proj.id}`}
                className="block bg-white rounded-lg shadow hover:shadow-md transition p-6"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-mono text-gray-500">{proj.project_code}</span>
                      <span style={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(proj.status)}`}>
                        {proj.status.replace('_', ' ')}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">{proj.name}</h3>
                    <div className="flex gap-4 text-sm text-gray-500">
                      <span>{proj.ministry}</span>
                      <span>{proj.county}</span>
                      {proj.contractor && (
                        <span>Contractor: {proj.contractor.name}</span>
                      )}
                    </div>
                  </div>

                  <div className="md:text-right">
                    <div className="text-sm font-semibold text-gray-800">
                      KES {proj.budget_allocated?.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500 mb-2">
                      Spent: KES {proj.budget_spent?.toLocaleString()}
                    </div>
                    <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        style={`h-full rounded-full ${
                          proj.completion_pct >= 80 ? 'bg-green-500' :
                          proj.completion_pct >= 50 ? 'bg-blue-500' :
                          proj.completion_pct >= 20 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${proj.completion_pct}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{proj.completion_pct}% complete</div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t flex gap-6 text-sm text-gray-500">
                  <span>Start: {proj.start_date ? new Date(proj.start_date).toLocaleDateString() : 'TBD'}</span>
                  <span>Expected: {proj.expected_completion ? new Date(proj.expected_completion).toLocaleDateString() : 'TBD'}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
