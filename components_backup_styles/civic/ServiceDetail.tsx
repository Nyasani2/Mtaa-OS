import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/router';
import Link from 'next/link';

interface Service {
  id: string;
  name: string;
  description: string;
  purpose: string;
  requirements: Array<{ label: string; description: string }>;
  outcome: string;
  processing_time: string;
  fees: { amount: number; currency: string };
  responsible_department: string;
  legal_basis: string;
  eligibility_rules: Array<{ rule: string }>;
  ministry_id: string;
}

interface Ministry {
  id: string;
  name: string;
}

export default function ServiceDetail() {
  const router = useRouter();
  const { slug } = router.query;
  
  const [service, setService] = useState<Service | null>(null);
  const [ministry, setMinistry] = useState<Ministry | null>(null);
  const [hasApplication, setHasApplication] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) fetchService();
  }, [slug]);

  const fetchService = async () => {
    setLoading(true);
    const { data: svcData } = await supabase
      .from('civic_services')
      .select('*')
      .eq('slug', slug)
      .single();

    if (svcData) {
      setService(svcData);
      
      // Fetch ministry
      const { data: minData } = await supabase
        .from('ministries')
        .select('id, name')
        .eq('id', svcData.ministry_id)
        .single();
      setMinistry(minData);

      // Check if user has existing application
      const { data: user } = await supabase.auth.getUser();
      if (user.user) {
        const { data: appData } = await supabase
          .from('service_applications')
          .select('id, status')
          .eq('service_id', svcData.id)
          .eq('user_id', user.user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        setHasApplication(!!appData);
      }
    }
    setLoading(false);
  };

  const handleApply = () => {
    router.push(`/civic/apply/${service?.slug}`);
  };

  if (loading) return <div className="p-8 text-center">Loading service details...</div>;
  if (!service) return <div className="p-8 text-center">Service not found.</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <Link href="/civic" className="hover:text-blue-600">Civic Home</Link>
            <span>›</span>
            <Link href="/civic/services" className="hover:text-blue-600">Services</Link>
            <span>›</span>
            <span className="text-gray-800">{service.name}</span>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{service.name}</h1>
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">{ministry?.name || 'Government'}</span>
            <span>{service.responsible_department}</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-3">Purpose</h2>
              <p className="text-gray-600">{service.purpose}</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-3">Description</h2>
              <p className="text-gray-600 whitespace-pre-line">{service.description}</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-3">Requirements</h2>
              <ul className="space-y-3">
                {(service.requirements || []).map((req, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="font-medium text-gray-800">{req.label || req}</div>
                      {req.description && <div className="text-sm text-gray-500">{req.description}</div>}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-3">Eligibility</h2>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                {(service.eligibility_rules || []).map((rule, idx) => (
                  <li key={idx}>{rule.rule || rule}</li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-3">Outcome</h2>
              <p className="text-gray-600">{service.outcome}</p>
            </div>

            {service.legal_basis && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-3">Legal Basis</h2>
                <p className="text-gray-600 text-sm">{service.legal_basis}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow p-6 sticky top-4">
              <div className="text-center mb-4">
                <div className="text-3xl font-bold text-gray-800">
                  {service.fees?.amount > 0 ? `KES ${service.fees.amount}` : 'Free'}
                </div>
                <div className="text-sm text-gray-500">{service.fees?.currency || 'KES'}</div>
              </div>

              <div className="space-y-3 mb-6 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Processing Time</span>
                  <span className="font-medium">{service.processing_time || 'Varies'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Department</span>
                  <span className="font-medium text-right">{service.responsible_department}</span>
                </div>
              </div>

              <button
                onClick={handleApply}
                className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition mb-2"
              >
                {hasApplication ? 'Continue Application' : 'Apply Now'}
              </button>
              
              {hasApplication && (
                <Link
                  href="/civic/my-applications"
                  className="block w-full py-2 text-center text-blue-600 hover:underline text-sm"
                >
                  View My Applications
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
