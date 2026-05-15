import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface Application {
  id: string;
  status: string;
  form_data: Record<string, string>;
  documents: Array<{ url: string; name: string }>;
  payment_status: string;
  submitted_at: string;
  completed_at: string;
  service: {
    id: string;
    name: string;
    slug: string;
    ministry: string;
  };
}

export default function MyApplications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from('service_applications')
      .select(`
        id,
        status,
        form_data,
        documents,
        payment_status,
        submitted_at,
        completed_at,
        service:civic_services(id, name, slug, ministry)
      `)
      .eq('user_id', userData.user.id)
      .order('created_at', { ascending: false });

    setApplications((data as any) || []);
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      submitted: 'bg-blue-100 text-blue-800',
      under_review: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      completed: 'bg-purple-100 text-purple-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) return <div className="p-8 text-center">Loading your applications...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <Link href="/civic" className="hover:text-blue-600">Civic Home</Link>
          <span>›</span>
          <span className="text-gray-800">My Applications</span>
        </div>

        <h1 className="text-3xl font-bold text-gray-800 mb-6">My Applications</h1>

        {applications.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-4xl mb-2">📋</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">No applications yet</h2>
            <p className="text-gray-500 mb-4">Browse services and start your first application.</p>
            <Link
              href="/civic/services"
              className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Browse Services
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <div key={app.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-800">
                      {app.service?.name || 'Unknown Service'}
                    </h3>
                    <p className="text-sm text-gray-500">{app.service?.ministry}</p>
                  </div>
                  <span style={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(app.status)}`}>
                    {app.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                  <div>
                    <div className="text-gray-500">Submitted</div>
                    <div className="font-medium">
                      {app.submitted_at ? new Date(app.submitted_at).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Payment</div>
                    <div className="font-medium capitalize">{app.payment_status}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Completed</div>
                    <div className="font-medium">
                      {app.completed_at ? new Date(app.completed_at).toLocaleDateString() : 'Pending'}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Reference</div>
                    <div className="font-medium font-mono text-xs">{app.id.slice(0, 8)}</div>
                  </div>
                </div>

                {app.documents && app.documents.length > 0 && (
                  <div className="border-t pt-3">
                    <div className="text-sm text-gray-500 mb-2">Attached Documents</div>
                    <div className="flex gap-2 flex-wrap">
                      {app.documents.map((doc, idx) => (
                        <a
                          key={idx}
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline bg-blue-50 px-3 py-1 rounded-full"
                        >
                          📎 {doc.name || `Document ${idx + 1}`}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border-t pt-3 mt-3 flex justify-end">
                  <Link
                    href={`/civic/service/${app.service?.slug}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    View Service →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
