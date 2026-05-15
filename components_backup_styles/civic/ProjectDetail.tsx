import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/router';
import Link from 'next/link';

interface Project {
  id: string;
  project_code: string;
  name: string;
  description: string;
  ministry: string;
  department: string;
  county: string;
  constituency: string;
  ward: string;
  budget_allocated: number;
  budget_spent: number;
  budget_remaining: number;
  completion_pct: number;
  status: string;
  location_lat: number;
  location_lng: number;
  start_date: string;
  expected_completion: string;
  actual_completion: string;
  total_paid: number;
  total_held: number;
  ai_hold: boolean;
  ai_hold_reason: string;
  drone_verified: boolean;
  drone_scan_count: number;
  contractor_id: string;
}

interface Contractor {
  id: string;
  name: string;
  registration_number: string;
  company_score: number;
  blacklist_status: string;
}

interface Milestone {
  id: string;
  milestone_number: number;
  name: string;
  description: string;
  target_pct: number;
  target_date: string;
  status: string;
  payment_amount: number;
  payment_released: boolean;
  drone_verified: boolean;
  human_verified: boolean;
  ai_approved: boolean;
}

interface DroneMission {
  id: string;
  mission_type: string;
  status: string;
  scheduled_at: string;
  completed_at: string;
  images_captured: number;
  ai_recommendation: string;
}

export default function ProjectDetail() {
  const router = useRouter();
  const { id } = router.query;
  
  const [project, setProject] = useState<Project | null>(null);
  const [contractor, setContractor] = useState<Contractor | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [droneMissions, setDroneMissions] = useState<DroneMission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchProjectData();
  }, [id]);

  const fetchProjectData = async () => {
    setLoading(true);
    
    // Fetch project
    const { data: projData } = await supabase
      .from('civic_projects')
      .select('*')
      .eq('id', id)
      .single();

    if (projData) {
      setProject(projData);

      // Fetch contractor
      if (projData.contractor_id) {
        const { data: contData } = await supabase
          .from('civic_contractors')
          .select('id, name, registration_number, company_score, blacklist_status')
          .eq('id', projData.contractor_id)
          .single();
        setContractor(contData);
      }

      // Fetch milestones
      const { data: mileData } = await supabase
        .from('civic_project_milestones')
        .select('*')
        .eq('project_id', id)
        .order('milestone_number');
      setMilestones(mileData || []);

      // Fetch drone missions
      const { data: droneData } = await supabase
        .from('civic_drone_missions')
        .select('*')
        .eq('project_id', id)
        .order('scheduled_at', { ascending: false });
      setDroneMissions(droneData || []);
    }

    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-gray-100 text-gray-800',
      in_progress: 'bg-blue-100 text-blue-800',
      drone_scanning: 'bg-purple-100 text-purple-800',
      ai_review: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      paid: 'bg-emerald-100 text-emerald-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) return <div className="p-8 text-center">Loading project details...</div>;
  if (!project) return <div className="p-8 text-center">Project not found.</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <Link href="/civic" className="hover:text-blue-600">Civic Home</Link>
            <span>›</span>
            <Link href="/civic/projects" className="hover:text-blue-600">Projects</Link>
            <span>›</span>
            <span className="text-gray-800">{project.project_code}</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">{project.name}</h1>
              <div className="flex gap-3 text-sm text-gray-500">
                <span>{project.ministry}</span>
                <span>{project.county}</span>
                <span>{project.constituency}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {project.ai_hold && (
                <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                  🤖 AI HOLD
                </span>
              )}
              {project.drone_verified && (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  ✓ Drone Verified
                </span>
              )}
              <span style={`px-3 py-1 rounded-full text-sm font-medium ${
                project.status === 'active' || project.status === 'on_track' ? 'bg-green-100 text-green-800' :
                project.status === 'at_risk' ? 'bg-yellow-100 text-yellow-800' :
                project.status === 'stalled' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {project.status.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Budget Overview */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Budget Overview</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-500">Allocated</div>
                  <div className="text-xl font-bold text-blue-900">KES {project.budget_allocated?.toLocaleString()}</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-500">Spent</div>
                  <div className="text-xl font-bold text-yellow-900">KES {project.budget_spent?.toLocaleString()}</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-500">Remaining</div>
                  <div className="text-xl font-bold text-green-900">KES {project.budget_remaining?.toLocaleString()}</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-500">Held</div>
                  <div className="text-xl font-bold text-purple-900">KES {project.total_held?.toLocaleString()}</div>
                </div>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all"
                  style={{ width: `${Math.min(project.completion_pct, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-sm text-gray-500 mt-2">
                <span>{project.completion_pct}% Complete</span>
                <span>{100 - project.completion_pct}% Remaining</span>
              </div>
            </div>

            {/* Description */}
            {project.description && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-3">Description</h2>
                <p className="text-gray-600 whitespace-pre-line">{project.description}</p>
              </div>
            )}

            {/* Milestones */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Milestones</h2>
              {milestones.length === 0 ? (
                <p className="text-gray-500">No milestones defined yet.</p>
              ) : (
                <div className="space-y-4">
                  {milestones.map((m) => (
                    <div key={m.id} className="border-l-4 border-blue-500 pl-4 py-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-mono text-gray-500">M{m.milestone_number}</span>
                        <span style={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(m.status)}`}>
                          {m.status.replace('_', ' ')}
                        </span>
                        {m.payment_released && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800">Paid</span>
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-800">{m.name}</h3>
                      <p className="text-sm text-gray-500 mb-2">{m.description}</p>
                      <div className="flex gap-4 text-xs text-gray-400">
                        <span>Target: {m.target_pct}%</span>
                        <span>Due: {m.target_date ? new Date(m.target_date).toLocaleDateString() : 'TBD'}</span>
                        <span>Payment: KES {m.payment_amount?.toLocaleString()}</span>
                      </div>
                      <div className="flex gap-2 mt-2">
                        {m.drone_verified && <span className="text-xs text-blue-600">✓ Drone</span>}
                        {m.human_verified && <span className="text-xs text-green-600">✓ Human</span>}
                        {m.ai_approved && <span className="text-xs text-purple-600">✓ AI</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Drone Missions */}
            {droneMissions.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Drone Verification Log</h2>
                <div className="space-y-3">
                  {droneMissions.map((dm) => (
                    <div key={dm.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-800 capitalize">{dm.mission_type.replace('_', ' ')}</div>
                        <div className="text-xs text-gray-500">
                          {dm.scheduled_at ? new Date(dm.scheduled_at).toLocaleString() : 'Scheduled'}
                        </div>
                      </div>
                      <div className="text-right">
                        <span style={`text-xs px-2 py-1 rounded-full ${
                          dm.status === 'completed' ? 'bg-green-100 text-green-800' :
                          dm.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {dm.status.replace('_', ' ')}
                        </span>
                        {dm.ai_recommendation && (
                          <div className="text-xs text-purple-600 mt-1">AI: {dm.ai_recommendation}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Contractor Card */}
            {contractor ? (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-semibold text-gray-800 mb-3">Contractor</h3>
                <div className="mb-3">
                  <div className="font-medium text-lg">{contractor.name}</div>
                  <div className="text-sm text-gray-500">Reg: {contractor.registration_number}</div>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${contractor.company_score}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{contractor.company_score}/100</span>
                </div>
                <div style={`text-xs px-2 py-1 rounded-full inline-block ${
                  contractor.blacklist_status === 'clear' ? 'bg-green-100 text-green-800' :
                  contractor.blacklist_status === 'watch' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {contractor.blacklist_status}
                </div>
                <Link
                  href={`/civic/contractor/${contractor.id}`}
                  className="block mt-3 text-sm text-blue-600 hover:underline"
                >
                  View Contractor Profile →
                </Link>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-semibold text-gray-800 mb-2">Contractor</h3>
                <p className="text-sm text-gray-500">No contractor assigned yet.</p>
              </div>
            )}

            {/* Timeline */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold text-gray-800 mb-3">Timeline</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Start Date</span>
                  <span>{project.start_date ? new Date(project.start_date).toLocaleDateString() : 'TBD'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Expected Completion</span>
                  <span>{project.expected_completion ? new Date(project.expected_completion).toLocaleDateString() : 'TBD'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Actual Completion</span>
                  <span>{project.actual_completion ? new Date(project.actual_completion).toLocaleDateString() : 'Pending'}</span>
                </div>
              </div>
            </div>

            {/* Location */}
            {(project.location_lat && project.location_lng) && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-semibold text-gray-800 mb-2">Location</h3>
                <div className="text-sm text-gray-500 mb-2">
                  Lat: {project.location_lat}, Lng: {project.location_lng}
                </div>
                <a
                  href={`https://maps.google.com/?q=${project.location_lat},${project.location_lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  View on Map →
                </a>
              </div>
            )}

            {/* AI Hold Warning */}
            {project.ai_hold && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-red-600">⚠️</span>
                  <h3 className="font-semibold text-red-800">AI Hold Active</h3>
                </div>
                <p className="text-sm text-red-600">{project.ai_hold_reason || 'Project flagged for review by AI governance system.'}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
