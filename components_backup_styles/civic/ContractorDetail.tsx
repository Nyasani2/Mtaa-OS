import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/router';
import Link from 'next/link';

interface Contractor {
  id: string;
  name: string;
  registration_number: string;
  kra_pin: string;
  company_type: string;
  agpo_category: string;
  agpo_certified: boolean;
  agpo_cert_number: string;
  company_score: number;
  score_breakdown: Record<string, number>;
  projects_completed: number;
  projects_stalled: number;
  projects_incomplete: number;
  total_contract_value: number;
  total_paid_out: number;
  total_pending: number;
  blacklist_status: string;
  blacklist_reason: string;
  tax_compliant: boolean;
  last_kra_check: string;
  kra_remarks: string;
  registration_date: string;
  director_count: number;
  employee_count: number;
  annual_turnover: number;
  email: string;
  phone: string;
  physical_address: string;
  county: string;
}

interface Director {
  id: string;
  full_name: string;
  id_number: string;
  nationality: string;
  share_percentage: number;
  is_ceo: boolean;
  is_cfo: boolean;
}

interface Project {
  id: string;
  project_code: string;
  name: string;
  status: string;
  budget_allocated: number;
  completion_pct: number;
}

export default function ContractorDetail() {
  const router = useRouter();
  const { id } = router.query;
  
  const [contractor, setContractor] = useState<Contractor | null>(null);
  const [directors, setDirectors] = useState<Director[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchContractorData();
  }, [id]);

  const fetchContractorData = async () => {
    setLoading(true);
    
    const { data: contData } = await supabase
      .from('civic_contractors')
      .select('*')
      .eq('id', id)
      .single();

    if (contData) {
      setContractor(contData);

      const [{ data: dirData }, { data: projData }] = await Promise.all([
        supabase.from('civic_contractor_directors').select('*').eq('contractor_id', id),
        supabase.from('civic_projects').select('id, project_code, name, status, budget_allocated, completion_pct').eq('contractor_id', id)
      ]);

      setDirectors(dirData || []);
      setProjects(projData || []);
    }

    setLoading(false);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading) return <div className="p-8 text-center">Loading contractor profile...</div>;
  if (!contractor) return <div className="p-8 text-center">Contractor not found.</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <Link href="/civic" className="hover:text-blue-600">Civic Home</Link>
            <span>›</span>
            <Link href="/civic/contractors" className="hover:text-blue-600">Contractors</Link>
            <span>›</span>
            <span className="text-gray-800">{contractor.name}</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">{contractor.name}</h1>
              <div className="flex gap-3 text-sm text-gray-500">
                <span className="font-mono">{contractor.registration_number}</span>
                <span>{contractor.company_type}</span>
                <span>{contractor.county}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {contractor.agpo_certified && (
                <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                  AGPO {contractor.agpo_category}
                </span>
              )}
              <span style={`px-3 py-1 rounded-full text-sm font-medium ${
                contractor.blacklist_status === 'clear' ? 'bg-green-100 text-green-800' :
                contractor.blacklist_status === 'watch' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {contractor.blacklist_status}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main */}
          <div className="lg:col-span-2 space-y-6">
            {/* Score Breakdown */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Company Score</h2>
                <div className="text-3xl font-bold text-gray-800">{contractor.company_score}<span className="text-lg text-gray-400">/100</span></div>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden mb-4">
                <div
                  style={`h-full ${getScoreColor(contractor.company_score)} rounded-full`}
                  style={{ width: `${contractor.company_score}%` }}
                />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {Object.entries(contractor.score_breakdown || {}).map(([key, val]) => (
                  <div key={key} className="bg-gray-50 p-3 rounded-lg text-center">
                    <div className="text-lg font-bold text-gray-800">{val}</div>
                    <div className="text-xs text-gray-500 capitalize">{key.replace('_', ' ')}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Directors */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Directors ({contractor.director_count})</h2>
              {directors.length === 0 ? (
                <p className="text-gray-500">No director information available.</p>
              ) : (
                <div className="space-y-3">
                  {directors.map((d) => (
                    <div key={d.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-800">
                          {d.full_name}
                          {d.is_ceo && <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">CEO</span>}
                          {d.is_cfo && <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">CFO</span>}
                        </div>
                        <div className="text-xs text-gray-500">
                          ID: {d.id_number} • {d.nationality}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{d.share_percentage}%</div>
                        <div className="text-xs text-gray-500">Ownership</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Projects */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Project History ({projects.length})</h2>
              {projects.length === 0 ? (
                <p className="text-gray-500">No completed projects on record.</p>
              ) : (
                <div className="space-y-3">
                  {projects.map((p) => (
                    <Link
                      key={p.id}
                      href={`/civic/project/${p.id}`}
                      className="block flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                    >
                      <div>
                        <div className="font-medium text-gray-800">{p.name}</div>
                        <div className="text-xs text-gray-500">{p.project_code}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">KES {p.budget_allocated?.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">{p.completion_pct}% complete</div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Financial Overview */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Financial Overview</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Contracts</span>
                  <span className="font-medium">KES {contractor.total_contract_value?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Paid Out</span>
                  <span className="font-medium text-green-600">KES {contractor.total_paid_out?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Pending</span>
                  <span className="font-medium text-yellow-600">KES {contractor.total_pending?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Annual Turnover</span>
                  <span className="font-medium">KES {contractor.annual_turnover?.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold text-gray-800 mb-3">Contact</h3>
              <div className="space-y-2 text-sm">
                {contractor.email && <div className="text-gray-600">📧 {contractor.email}</div>}
                {contractor.phone && <div className="text-gray-600">📞 {contractor.phone}</div>}
                {contractor.physical_address && <div className="text-gray-600">📍 {contractor.physical_address}</div>}
              </div>
            </div>

            {/* Tax Status */}
            <div style={`rounded-lg shadow p-6 ${
              contractor.tax_compliant ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              <h3 style={`font-semibold mb-2 ${contractor.tax_compliant ? 'text-green-800' : 'text-red-800'}`}>
                Tax Status: {contractor.tax_compliant ? 'Compliant' : 'Non-Compliant'}
              </h3>
              {contractor.last_kra_check && (
                <p className="text-xs text-gray-500">Last KRA Check: {new Date(contractor.last_kra_check).toLocaleDateString()}</p>
              )}
              {contractor.kra_remarks && (
                <p className="text-xs text-gray-500 mt-1">{contractor.kra_remarks}</p>
              )}
            </div>

            {/* Stats */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold text-gray-800 mb-3">Performance</h3>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-green-50 p-2 rounded">
                  <div className="text-lg font-bold text-green-700">{contractor.projects_completed}</div>
                  <div className="text-xs text-gray-500">Completed</div>
                </div>
                <div className="bg-yellow-50 p-2 rounded">
                  <div className="text-lg font-bold text-yellow-700">{contractor.projects_stalled}</div>
                  <div className="text-xs text-gray-500">Stalled</div>
                </div>
                <div className="bg-red-50 p-2 rounded">
                  <div className="text-lg font-bold text-red-700">{contractor.projects_incomplete}</div>
                  <div className="text-xs text-gray-500">Incomplete</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
