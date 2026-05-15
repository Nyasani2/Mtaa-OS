#!/bin/bash
cd ~/MTAA_OS_V10
mkdir -p components/civic

cat << 'EOF' > components/civic/MyApplications.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface Application {
  id: string; status: string; form_data: Record<string, string>;
  documents: Array<{ url: string; name: string }>; payment_status: string;
  payment_amount: number; submitted_at: string; completed_at: string;
  reviewed_by: string; review_notes: string;
  service: { id: string; name: string; slug: string; ministry: string; };
}

export default function MyApplications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  useEffect(() => { fetchApplications(); }, []);

  const fetchApplications = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data } = await supabase.from('civic_applications').select('id, status, form_data, documents, payment_status, payment_amount, submitted_at, completed_at, reviewed_by, review_notes, service:service_id(id, name, slug, ministry:ministries(name))').eq('user_id', user.id).order('submitted_at', { ascending: false });
    const mapped = (data || []).map((app: any) => ({ ...app, service: { ...app.service, ministry: app.service?.ministry?.name || 'Government' } }));
    setApplications(mapped); setLoading(false);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = { draft: 'bg-gray-100 text-gray-800', submitted: 'bg-blue-100 text-blue-800', under_review: 'bg-yellow-100 text-yellow-800', approved: 'bg-green-100 text-green-800', rejected: 'bg-red-100 text-red-800', completed: 'bg-emerald-100 text-emerald-800' };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };
  const getPaymentStatusColor = (status: string) => {
    const colors: Record<string, string> = { pending: 'bg-yellow-100 text-yellow-800', paid: 'bg-green-100 text-green-800', waived: 'bg-blue-100 text-blue-800', failed: 'bg-red-100 text-red-800' };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const filteredApps = filter === 'all' ? applications : applications.filter(a => a.status === filter);
  const stats = { total: applications.length, pending: applications.filter(a => ['submitted','under_review'].includes(a.status)).length, approved: applications.filter(a => a.status === 'approved').length, completed: applications.filter(a => a.status === 'completed').length };

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-center"><div className="text-4xl mb-4 animate-pulse">📋</div><div className="text-gray-600">Loading your applications...</div></div></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-900 text-white py-10 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 text-sm text-blue-300 mb-4">
            <Link href="/civic" className="hover:text-white transition">Civic Home</Link><span>›</span><span className="text-white">My Applications</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">My Applications</h1>
          <p className="text-blue-200">Track and manage your government service applications</p>
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur rounded-lg p-4"><div className="text-2xl font-bold">{stats.total}</div><div className="text-sm text-blue-200">Total</div></div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4"><div className="text-2xl font-bold text-yellow-400">{stats.pending}</div><div className="text-sm text-blue-200">Pending</div></div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4"><div className="text-2xl font-bold text-green-400">{stats.approved}</div><div className="text-sm text-blue-200">Approved</div></div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4"><div className="text-2xl font-bold text-emerald-400">{stats.completed}</div><div className="text-sm text-blue-200">Completed</div></div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex gap-2 flex-wrap mb-6">
          {[{key:'all',label:'All'},{key:'submitted',label:'Submitted'},{key:'under_review',label:'Under Review'},{key:'approved',label:'Approved'},{key:'completed',label:'Completed'},{key:'rejected',label:'Rejected'}].map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key)} className={`px-4 py-2 rounded-full text-sm font-medium transition ${filter === f.key ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100 shadow'}`}>{f.label}</button>
          ))}
        </div>

        {applications.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow">
            <div className="text-5xl mb-4">📭</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Applications Yet</h3>
            <p className="text-gray-500 mb-4">You haven't submitted any government service applications.</p>
            <Link href="/civic/services" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">Browse Services</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-3">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">{filteredApps.length} Application{filteredApps.length !== 1 ? 's' : ''}</h2>
              {filteredApps.map((app) => (
                <button key={app.id} onClick={() => setSelectedApp(app)} className={`w-full text-left p-4 rounded-lg transition ${selectedApp?.id === app.id ? 'bg-blue-50 border-2 border-blue-500' : 'bg-white shadow hover:shadow-md'}`}>
                  <div className="flex justify-between items-start mb-2"><div className="font-medium text-gray-800 truncate pr-2">{app.service?.name}</div><span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${getStatusColor(app.status)}`}>{app.status.replace('_', ' ')}</span></div>
                  <div className="text-xs text-gray-500 mb-1">{app.service?.ministry}</div>
                  <div className="text-xs text-gray-400">{app.submitted_at ? new Date(app.submitted_at).toLocaleDateString() : 'Draft'}</div>
                </button>
              ))}
            </div>

            <div className="lg:col-span-2">
              {selectedApp ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div><h2 className="text-xl font-semibold text-gray-800">{selectedApp.service?.name}</h2><p className="text-sm text-gray-500">{selectedApp.service?.ministry}</p></div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedApp.status)}`}>{selectedApp.status.replace('_', ' ')}</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gray-50 p-3 rounded-lg"><div className="text-xs text-gray-500">Application ID</div><div className="font-mono text-sm font-medium">{selectedApp.id.slice(0,8)}...</div></div>
                    <div className="bg-gray-50 p-3 rounded-lg"><div className="text-xs text-gray-500">Submitted</div><div className="text-sm font-medium">{selectedApp.submitted_at ? new Date(selectedApp.submitted_at).toLocaleDateString() : 'N/A'}</div></div>
                    <div className="bg-gray-50 p-3 rounded-lg"><div className="text-xs text-gray-500">Payment</div><span className={`text-xs px-2 py-0.5 rounded-full ${getPaymentStatusColor(selectedApp.payment_status)}`}>{selectedApp.payment_status.replace('_', ' ')}</span></div>
                  </div>
                  {selectedApp.review_notes && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6"><div className="text-sm font-medium text-yellow-800 mb-1">Review Notes</div><p className="text-sm text-yellow-700">{selectedApp.review_notes}</p></div>
                  )}
                  <div className="mb-6"><h3 className="text-sm font-semibold text-gray-800 mb-2">Submitted Information</h3><div className="bg-gray-50 rounded-lg p-4 space-y-2">{Object.entries(selectedApp.form_data || {}).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm"><span className="text-gray-500 capitalize">{key.replace(/_/g, ' ')}</span><span className="text-gray-800 font-medium">{value}</span></div>
                  ))}</div></div>
                  {selectedApp.documents && selectedApp.documents.length > 0 && (
                    <div><h3 className="text-sm font-semibold text-gray-800 mb-2">Uploaded Documents</h3><div className="space-y-2">{selectedApp.documents.map((doc, idx) => (
                      <a key={idx} href={doc.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition"><span className="text-blue-600">📄</span><span className="text-sm text-blue-800">{doc.name}</span></a>
                    ))}</div></div>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                  <div className="text-5xl mb-4">👆</div>
                  <p className="text-gray-500">Select an application to view details</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
EOF

cat << 'EOF' > components/civic/ProjectsList.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface Project {
  id: string; project_code: string; name: string; description: string;
  ministry: string; county: string; constituency: string; ward: string;
  budget_allocated: number; budget_spent: number; completion_pct: number;
  status: string; expected_completion: string; contractor: string;
  ai_risk_level: string; ai_recommendation: string;
}

export default function ProjectsList() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCounty, setFilterCounty] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [counties, setCounties] = useState<string[]>([]);

  useEffect(() => { fetchProjects(); }, []);

  const fetchProjects = async () => {
    setLoading(true);
    const { data } = await supabase.from('civic_projects').select('*, ministries(name), civic_contractors(name)').order('created_at', { ascending: false });
    const mapped = (data || []).map((p: any) => ({
      ...p,
      ministry: p.ministries?.name || 'Government',
      contractor: p.civic_contractors?.name || 'TBD'
    }));
    setProjects(mapped);
    const uniqueCounties = [...new Set(mapped.map((p: Project) => p.county).filter(Boolean))];
    setCounties(uniqueCounties);
    setLoading(false);
  };

  const filteredProjects = projects.filter(p => {
    const matchesSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.project_code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCounty = filterCounty === 'all' || p.county === filterCounty;
    const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
    return matchesSearch && matchesCounty && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = { active: 'bg-blue-100 text-blue-800', on_track: 'bg-green-100 text-green-800', at_risk: 'bg-yellow-100 text-yellow-800', stalled: 'bg-red-100 text-red-800', completed: 'bg-emerald-100 text-emerald-800', cancelled: 'bg-gray-100 text-gray-800' };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getRiskColor = (risk: string) => {
    const colors: Record<string, string> = { low: 'text-green-600', medium: 'text-yellow-600', high: 'text-orange-600', critical: 'text-red-600' };
    return colors[risk] || 'text-gray-600';
  };

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-center"><div className="text-4xl mb-4 animate-pulse">🏗️</div><div className="text-gray-600">Loading public projects...</div></div></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-900 text-white py-10 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 text-sm text-blue-300 mb-4">
            <Link href="/civic" className="hover:text-white transition">Civic Home</Link><span>›</span><span className="text-white">Public Projects</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">Public Project Transparency</h1>
          <p className="text-blue-200 mb-6">Track government projects, budgets, contractors, and AI risk assessments</p>
          <div className="flex gap-3 flex-wrap max-w-3xl">
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search projects..." className="flex-1 min-w-[200px] px-4 py-2 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400" />
            <select value={filterCounty} onChange={(e) => setFilterCounty(e.target.value)} className="px-4 py-2 rounded-lg text-gray-900 bg-white"><option value="all">All Counties</option>{counties.map(c => <option key={c} value={c}>{c}</option>)}</select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-4 py-2 rounded-lg text-gray-900 bg-white">
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="on_track">On Track</option>
              <option value="at_risk">At Risk</option>
              <option value="stalled">Stalled</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">{filteredProjects.length} Project{filteredProjects.length !== 1 ? 's' : ''}</h2>
          <div className="text-sm text-gray-500">Total Budget: KES {filteredProjects.reduce((sum, p) => sum + (p.budget_allocated || 0), 0).toLocaleString()}</div>
        </div>

        {filteredProjects.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow"><div className="text-5xl mb-4">🔍</div><h3 className="text-xl font-semibold text-gray-800 mb-2">No projects found</h3><p className="text-gray-500">Try adjusting your filters</p></div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredProjects.map((project) => (
              <div key={project.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="text-xs text-gray-500 font-mono mb-1">{project.project_code}</div>
                    <h3 className="text-lg font-bold text-gray-800">{project.name}</h3>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(project.status)}`}>{project.status.replace('_', ' ')}</span>
                </div>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{project.description}</p>
                <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                  <div className="bg-gray-50 p-2 rounded"><div className="text-xs text-gray-500">Budget</div><div className="font-medium">KES {(project.budget_allocated || 0).toLocaleString()}</div></div>
                  <div className="bg-gray-50 p-2 rounded"><div className="text-xs text-gray-500">Spent</div><div className="font-medium">KES {(project.budget_spent || 0).toLocaleString()}</div></div>
                </div>
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1"><span>Completion</span><span>{project.completion_pct || 0}%</span></div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${project.completion_pct || 0}%` }} /></div>
                </div>
                <div className="flex justify-between items-center text-xs text-gray-500 pt-3 border-t border-gray-100">
                  <span>🏛️ {project.ministry}</span>
                  <span>📍 {project.county || 'National'}</span>
                </div>
                {project.ai_risk_level && (
                  <div className={`mt-3 text-xs font-medium ${getRiskColor(project.ai_risk_level)}`}>🤖 AI Risk: {project.ai_risk_level.toUpperCase()}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
EOF

cat << 'EOF' > components/civic/ContractorsList.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface Contractor {
  id: string; name: string; registration_number: string; kra_pin: string;
  company_type: string; agpo_certified: boolean; agpo_category: string;
  company_score: number; projects_completed: number; projects_stalled: number;
  total_contract_value: number; total_paid_out: number; total_pending: number;
  blacklist_status: string; blacklist_reason: string; tax_compliant: boolean;
  county: string; email: string; phone: string;
}

export default function ContractorsList() {
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterAGPO, setFilterAGPO] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { fetchContractors(); }, []);

  const fetchContractors = async () => {
    setLoading(true);
    const { data } = await supabase.from('civic_contractors').select('*').order('company_score', { ascending: false });
    setContractors(data || []);
    setLoading(false);
  };

  const filtered = contractors.filter(c => {
    const matchesSearch = !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.registration_number.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || c.blacklist_status === filterStatus;
    const matchesAGPO = filterAGPO === 'all' || (filterAGPO === 'yes' ? c.agpo_certified : !c.agpo_certified);
    return matchesSearch && matchesStatus && matchesAGPO;
  });

  const getBlacklistColor = (status: string) => {
    const colors: Record<string, string> = { clear: 'bg-green-100 text-green-800', watch: 'bg-yellow-100 text-yellow-800', blacklisted: 'bg-red-100 text-red-800' };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-center"><div className="text-4xl mb-4 animate-pulse">🏢</div><div className="text-gray-600">Loading contractors...</div></div></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-900 text-white py-10 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 text-sm text-blue-300 mb-4">
            <Link href="/civic" className="hover:text-white transition">Civic Home</Link><span>›</span><span className="text-white">Contractors</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">Government Contractors Registry</h1>
          <p className="text-blue-200 mb-6">Transparent contractor scoring, AGPO status, and blacklist monitoring</p>
          <div className="flex gap-3 flex-wrap max-w-3xl">
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search contractors..." className="flex-1 min-w-[200px] px-4 py-2 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400" />
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-4 py-2 rounded-lg text-gray-900 bg-white">
              <option value="all">All Statuses</option>
              <option value="clear">Clear</option>
              <option value="watch">Watch</option>
              <option value="blacklisted">Blacklisted</option>
            </select>
            <select value={filterAGPO} onChange={(e) => setFilterAGPO(e.target.value)} className="px-4 py-2 rounded-lg text-gray-900 bg-white">
              <option value="all">All AGPO</option>
              <option value="yes">AGPO Certified</option>
              <option value="no">Not AGPO</option>
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">{filtered.length} Contractor{filtered.length !== 1 ? 's' : ''}</h2>
          <div className="text-sm text-gray-500">Total Contract Value: KES {filtered.reduce((sum, c) => sum + (c.total_contract_value || 0), 0).toLocaleString()}</div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow"><div className="text-5xl mb-4">🔍</div><h3 className="text-xl font-semibold text-gray-800 mb-2">No contractors found</h3><p className="text-gray-500">Try adjusting your filters</p></div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filtered.map((c) => (
              <div key={c.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">{c.name}</h3>
                    <div className="text-xs text-gray-500 font-mono">{c.registration_number}</div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${getBlacklistColor(c.blacklist_status)}`}>{c.blacklist_status}</span>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-4 text-sm">
                  <div className="bg-gray-50 p-2 rounded text-center"><div className="text-xs text-gray-500">Score</div><div className={`font-bold text-lg ${getScoreColor(c.company_score || 0)}`}>{c.company_score || 0}</div></div>
                  <div className="bg-gray-50 p-2 rounded text-center"><div className="text-xs text-gray-500">Completed</div><div className="font-bold text-lg text-gray-800">{c.projects_completed || 0}</div></div>
                  <div className="bg-gray-50 p-2 rounded text-center"><div className="text-xs text-gray-500">Stalled</div><div className="font-bold text-lg text-red-600">{c.projects_stalled || 0}</div></div>
                </div>
                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between"><span className="text-gray-500">Contract Value</span><span className="font-medium">KES {(c.total_contract_value || 0).toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Paid Out</span><span className="font-medium text-green-600">KES {(c.total_paid_out || 0).toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Pending</span><span className="font-medium text-yellow-600">KES {(c.total_pending || 0).toLocaleString()}</span></div>
                </div>
                <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
                  {c.agpo_certified && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">AGPO: {c.agpo_category || 'Certified'}</span>}
                  <span className={`text-xs px-2 py-1 rounded-full ${c.tax_compliant ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{c.tax_compliant ? '✓ Tax Compliant' : '✗ Tax Non-Compliant'}</span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">📍 {c.county || 'National'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
EOF

echo "Part 2 complete: MyApplications, ProjectsList, ContractorsList"
