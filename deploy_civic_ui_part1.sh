#!/bin/bash
cd ~/MTAA_OS_V10
mkdir -p components/civic lib/civic/tooltips

cat << 'EOF' > lib/civic/tooltips/ServiceTooltip.tsx
import React, { useState, useRef } from 'react';

interface TooltipData {
  name: string;
  what: string;
  why: string;
  requirements: string[];
  outcome: string;
  time: string;
  fee: string;
  department: string;
  legal_basis?: string;
}

interface ServiceTooltipProps {
  data: TooltipData;
  children: React.ReactNode;
  className?: string;
}

export default function ServiceTooltip({ data, children, className = '' }: ServiceTooltipProps) {
  const [show, setShow] = useState(false);
  const [position, setPosition] = useState<'top' | 'bottom'>('top');
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setPosition(rect.top < 300 ? 'bottom' : 'top');
    }
    setShow(true);
  };

  return (
    <div
      ref={ref}
      className={`relative ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setShow(false)}
      onTouchStart={() => setShow(true)}
      onTouchEnd={() => setTimeout(() => setShow(false), 4000)}
    >
      {children}
      {show && (
        <div className={`absolute z-50 left-0 right-0 ${position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'} w-full`}>
          <div className="bg-slate-800 text-white text-sm rounded-xl shadow-2xl p-4 border border-slate-700">
            <div className="font-bold text-yellow-400 mb-2 text-base">{data.name}</div>
            <div className="space-y-1.5 text-xs text-slate-300">
              <div><span className="text-slate-400 font-medium">What:</span> {data.what}</div>
              <div><span className="text-slate-400 font-medium">Why:</span> {data.why}</div>
              <div><span className="text-slate-400 font-medium">Requirements:</span> {data.requirements.join(', ')}</div>
              <div><span className="text-slate-400 font-medium">Outcome:</span> {data.outcome}</div>
              <div className="flex gap-4 pt-1 border-t border-slate-700 mt-2">
                <span>⏱️ {data.time}</span>
                <span>💰 {data.fee}</span>
              </div>
              <div className="text-slate-400">🏛️ {data.department}</div>
              {data.legal_basis && <div className="text-slate-500 italic">📜 {data.legal_basis}</div>}
            </div>
            <div className={`absolute left-1/2 -translate-x-1/2 ${position === 'top' ? 'top-full -mt-1' : 'bottom-full -mb-1'} border-4 border-transparent ${position === 'top' ? 'border-t-slate-800' : 'border-b-slate-800'}`} />
          </div>
        </div>
      )}
    </div>
  );
}
EOF

cat << 'EOF' > components/civic/ServiceList.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/router';
import Link from 'next/link';
import ServiceTooltip from '@/lib/civic/tooltips/ServiceTooltip';

interface Service {
  id: string;
  name: string;
  slug: string;
  description: string;
  purpose: string;
  ministry: string;
  processing_time: string;
  fees: { amount: number; currency: string };
  category_id: string;
  category_name: string;
  status: string;
  tooltip_summary: string;
  eligibility_rules: Array<{ rule: string; description: string }>;
  required_documents: Array<{ name: string; description: string }>;
  estimated_steps: number;
  responsible_department: string;
  legal_basis: string;
  is_featured: boolean;
}

export default function ServiceList() {
  const router = useRouter();
  const { search, category } = router.query;
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string; slug: string; icon: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'fee' | 'time'>('name');

  useEffect(() => {
    if (search) setSearchQuery(search as string);
    if (category) setActiveCategory(category as string);
    fetchData();
  }, [search, category]);

  const fetchData = async () => {
    setLoading(true);
    const [{ data: catData }, { data: svcData }] = await Promise.all([
      supabase.from('civic_categories').select('id, name, slug, icon').eq('status', 'active').order('sort_order'),
      supabase.from('civic_services').select('*, ministries(name), civic_categories(name)').eq('status', 'active')
    ]);

    const mappedServices = (svcData || []).map((s: any) => ({
      ...s,
      ministry: s.ministries?.name || 'Government',
      category_name: s.civic_categories?.name || 'General'
    }));

    setCategories(catData || []);
    setServices(mappedServices);
    setLoading(false);
  };

  const filteredServices = services.filter(s => {
    const matchesSearch = !searchQuery || 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.ministry.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || s.category_id === activeCategory;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    if (sortBy === 'fee') return (a.fees?.amount || 0) - (b.fees?.amount || 0);
    if (sortBy === 'time') return (a.estimated_steps || 1) - (b.estimated_steps || 1);
    return a.name.localeCompare(b.name);
  });

  const getTooltipData = (svc: Service) => ({
    name: svc.name,
    what: svc.tooltip_summary || svc.description,
    why: svc.purpose || 'Government service for public benefit',
    requirements: svc.required_documents?.map((d: any) => d.name) || ['ID Document'],
    outcome: 'Digital certificate or official confirmation',
    time: svc.processing_time || 'Varies by application',
    fee: svc.fees?.amount > 0 ? `${svc.fees.currency} ${svc.fees.amount.toLocaleString()}` : 'Free',
    department: svc.responsible_department || svc.ministry || 'Relevant Ministry',
    legal_basis: svc.legal_basis
  });

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4 animate-pulse">🏛️</div>
        <div className="text-gray-600">Loading government services...</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-900 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 text-sm text-blue-300 mb-4">
            <Link href="/civic" className="hover:text-white transition">Civic Home</Link>
            <span>›</span>
            <span className="text-white">Government Services</span>
          </div>
          <h1 className="text-4xl font-bold mb-2">Public Service Marketplace</h1>
          <p className="text-blue-200 mb-6">Explore, understand, and apply for government services — no gatekeeping</p>
          <div className="flex gap-3 max-w-2xl">
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search services by name, description, or ministry..."
              className="flex-1 px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400" />
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-3 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400">
              <option value="name">Sort by Name</option>
              <option value="fee">Sort by Fee</option>
              <option value="time">Sort by Steps</option>
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-2 flex-wrap mb-8">
          <button onClick={() => setActiveCategory('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${activeCategory === 'all' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100 shadow'}`}>
            All Services
          </button>
          {categories.map((cat) => (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${activeCategory === cat.id ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100 shadow'}`}>
              {cat.icon && <span className="mr-1">{cat.icon}</span>}{cat.name}
            </button>
          ))}
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">{filteredServices.length} Service{filteredServices.length !== 1 ? 's' : ''} Available</h2>
          {searchQuery && <button onClick={() => setSearchQuery('')} className="text-sm text-blue-600 hover:underline">Clear search</button>}
        </div>

        {filteredServices.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No services found</h3>
            <p className="text-gray-500">Try adjusting your search or category filter</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((svc) => (
              <ServiceTooltip key={svc.id} data={getTooltipData(svc)} className="w-full">
                <Link href={`/civic/service/${svc.slug}`}
                  className="block bg-white rounded-xl shadow hover:shadow-lg transition-all duration-200 border border-gray-100 hover:border-blue-200 group h-full">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <div className="bg-blue-50 text-blue-700 text-xs font-semibold px-2 py-1 rounded-full">{svc.category_name}</div>
                      {svc.fees?.amount === 0 ? (
                        <span className="text-green-600 text-xs font-semibold">FREE</span>
                      ) : (
                        <span className="text-gray-600 text-xs font-medium">{svc.fees?.currency} {svc.fees?.amount?.toLocaleString()}</span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-blue-700 transition">{svc.name}</h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{svc.description}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                      <span>⏱️ {svc.processing_time || 'Varies'}</span>
                      <span>📋 {svc.estimated_steps || 1} step{svc.estimated_steps !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                      <span className="text-xs text-gray-500 truncate max-w-[60%]">🏛️ {svc.ministry}</span>
                      <span className="text-sm font-semibold text-blue-600 group-hover:translate-x-1 transition-transform">Apply →</span>
                    </div>
                  </div>
                </Link>
              </ServiceTooltip>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
EOF

cat << 'EOF' > components/civic/ServiceDetail.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/router';
import Link from 'next/link';

interface Service {
  id: string; name: string; slug: string; description: string; purpose: string;
  requirements: Array<{ label: string; description: string }>;
  outcome: string; processing_time: string;
  fees: { amount: number; currency: string };
  responsible_department: string; ministry: string; ministry_id: string;
  category_id: string; category_name: string; tooltip_summary: string;
  eligibility_rules: Array<{ rule: string; description: string }>;
  required_documents: Array<{ name: string; description: string }>;
  estimated_steps: number; legal_basis: string; version: number;
  edited_at: string; status: string;
}

interface RelatedService { id: string; name: string; slug: string; description: string; }

export default function ServiceDetail() {
  const router = useRouter();
  const { slug } = router.query;
  const [service, setService] = useState<Service | null>(null);
  const [related, setRelated] = useState<RelatedService[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'requirements' | 'fees' | 'legal'>('overview');

  useEffect(() => { if (slug) fetchService(); }, [slug]);

  const fetchService = async () => {
    setLoading(true);
    const { data } = await supabase.from('civic_services').select('*, ministries(name, id), civic_categories(name)').eq('slug', slug).single();
    if (data) {
      const mapped: Service = { ...data, ministry: data.ministries?.name || 'Government', ministry_id: data.ministries?.id, category_name: data.civic_categories?.name || 'General' };
      setService(mapped);
      const { data: relData } = await supabase.from('civic_services').select('id, name, slug, description').eq('category_id', data.category_id).eq('status', 'active').neq('id', data.id).limit(3);
      setRelated(relData || []);
    }
    setLoading(false);
  };

  const handleApply = () => { router.push(`/civic/apply/${service?.slug}`); };

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-center"><div className="text-4xl mb-4 animate-pulse">🏛️</div><div className="text-gray-600">Loading service details...</div></div></div>;
  if (!service) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-center"><div className="text-5xl mb-4">❓</div><h2 className="text-2xl font-bold text-gray-800 mb-2">Service Not Found</h2><Link href="/civic/services" className="text-blue-600 hover:underline">Browse all services →</Link></div></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-900 text-white py-10 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 text-sm text-blue-300 mb-4">
            <Link href="/civic" className="hover:text-white transition">Civic Home</Link><span>›</span>
            <Link href="/civic/services" className="hover:text-white transition">Services</Link><span>›</span>
            <span className="text-white">{service.name}</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-blue-700 text-blue-200 text-xs font-semibold px-3 py-1 rounded-full">{service.category_name}</span>
                <span className="text-xs text-blue-300">Version {service.version} {service.edited_at && `• Updated ${new Date(service.edited_at).toLocaleDateString()}`}</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{service.name}</h1>
              <p className="text-blue-200 text-lg max-w-2xl">{service.description}</p>
            </div>
            <div className="flex flex-col gap-3">
              <button onClick={handleApply} className="px-8 py-3 bg-yellow-500 text-blue-900 font-bold rounded-lg hover:bg-yellow-400 transition shadow-lg">Apply Now</button>
              <div className="text-center text-xs text-blue-300">{service.fees?.amount === 0 ? 'Free of charge' : `Fee: ${service.fees?.currency} ${service.fees?.amount?.toLocaleString()}`}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center"><div className="text-2xl mb-1">⏱️</div><div className="text-sm text-gray-500">Processing Time</div><div className="font-semibold text-gray-800">{service.processing_time || 'Varies'}</div></div>
            <div className="text-center"><div className="text-2xl mb-1">💰</div><div className="text-sm text-gray-500">Fee</div><div className="font-semibold text-gray-800">{service.fees?.amount === 0 ? 'Free' : `${service.fees?.currency} ${service.fees?.amount?.toLocaleString()}`}</div></div>
            <div className="text-center"><div className="text-2xl mb-1">📋</div><div className="text-sm text-gray-500">Steps</div><div className="font-semibold text-gray-800">{service.estimated_steps || 1} step{service.estimated_steps !== 1 ? 's' : ''}</div></div>
            <div className="text-center"><div className="text-2xl mb-1">🏛️</div><div className="text-sm text-gray-500">Department</div><div className="font-semibold text-gray-800">{service.responsible_department || service.ministry}</div></div>
          </div>
        </div>

        <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
          {[{key:'overview',label:'Overview',icon:'📖'},{key:'requirements',label:'Requirements',icon:'📋'},{key:'fees',label:'Fees & Payment',icon:'💰'},{key:'legal',label:'Legal Basis',icon:'⚖️'}].map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key as any)} className={`px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === tab.key ? 'bg-white text-blue-700 shadow' : 'text-gray-600 hover:text-gray-800'}`}><span className="mr-1">{tab.icon}</span>{tab.label}</button>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div><h3 className="text-lg font-semibold text-gray-800 mb-2">Purpose</h3><p className="text-gray-600">{service.purpose || 'This government service is provided for public benefit and regulatory compliance.'}</p></div>
              <div><h3 className="text-lg font-semibold text-gray-800 mb-2">What You Get</h3><div className="bg-green-50 border border-green-200 rounded-lg p-4"><p className="text-green-800">{service.outcome || 'Official digital certificate or confirmation upon successful application.'}</p></div></div>
              {service.tooltip_summary && <div><h3 className="text-lg font-semibold text-gray-800 mb-2">Summary</h3><p className="text-gray-600">{service.tooltip_summary}</p></div>}
              {service.eligibility_rules?.length > 0 && (
                <div><h3 className="text-lg font-semibold text-gray-800 mb-2">Who Can Apply</h3><ul className="space-y-2">{service.eligibility_rules.map((rule, idx) => (
                  <li key={idx} className="flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span><div><span className="font-medium text-gray-800">{rule.rule}</span>{rule.description && <p className="text-sm text-gray-500">{rule.description}</p>}</div></li>
                ))}</ul></div>
              )}
            </div>
          )}
          {activeTab === 'requirements' && (
            <div className="space-y-6">
              <div><h3 className="text-lg font-semibold text-gray-800 mb-3">Required Documents</h3>{service.required_documents?.length > 0 ? <div className="grid gap-3">{service.required_documents.map((doc, idx) => (
                <div key={idx} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg"><div className="text-2xl">📄</div><div><div className="font-medium text-gray-800">{doc.name}</div><p className="text-sm text-gray-500">{doc.description}</p></div></div>
              ))}</div> : <p className="text-gray-500">No specific documents required.</p>}</div>
              {service.requirements?.length > 0 && <div><h3 className="text-lg font-semibold text-gray-800 mb-3">Additional Requirements</h3><ul className="space-y-2">{service.requirements.map((req, idx) => (
                <li key={idx} className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg"><span className="text-blue-500 font-bold">{idx + 1}.</span><div><span className="font-medium text-gray-800">{req.label}</span><p className="text-sm text-gray-500">{req.description}</p></div></li>
              ))}</ul></div>}
            </div>
          )}
          {activeTab === 'fees' && (
            <div className="space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6"><h3 className="text-lg font-semibold text-yellow-800 mb-2">Service Fee</h3><div className="text-3xl font-bold text-yellow-900">{service.fees?.amount === 0 ? 'FREE' : `${service.fees?.currency} ${service.fees?.amount?.toLocaleString()}`}</div>{service.fees?.amount === 0 && <p className="text-yellow-700 mt-2">This service is provided free of charge by the government.</p>}</div>
              <div><h3 className="text-lg font-semibold text-gray-800 mb-2">Payment Methods</h3><div className="grid grid-cols-2 md:grid-cols-4 gap-3">{['M-Pesa','Bank Transfer','Credit Card','Cash at Office'].map((m) => <div key={m} className="bg-gray-50 p-3 rounded-lg text-center text-sm text-gray-600">{m}</div>)}</div></div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4"><h4 className="font-medium text-blue-800 mb-1">💡 Fee Waiver</h4><p className="text-sm text-blue-700">Certain applicants may qualify for fee waivers. Check eligibility during application.</p></div>
            </div>
          )}
          {activeTab === 'legal' && (
            <div className="space-y-6">
              <div><h3 className="text-lg font-semibold text-gray-800 mb-2">Legal Basis</h3>{service.legal_basis ? <div className="bg-gray-50 p-4 rounded-lg font-mono text-sm text-gray-700">{service.legal_basis}</div> : <p className="text-gray-500">Legal reference information being updated.</p>}</div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4"><h4 className="font-medium text-amber-800 mb-1">⚠️ Transparency Notice</h4><p className="text-sm text-amber-700">This service is publicly funded and monitored. All applications, approvals, and fee transactions are recorded in the MTAA system for transparency and anti-corruption monitoring.</p></div>
              <div><h3 className="text-lg font-semibold text-gray-800 mb-2">Responsible Authority</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="bg-white border rounded-lg p-4"><div className="text-sm text-gray-500">Ministry</div><div className="font-medium text-gray-800">{service.ministry}</div></div><div className="bg-white border rounded-lg p-4"><div className="text-sm text-gray-500">Department</div><div className="font-medium text-gray-800">{service.responsible_department || 'Directorate'}</div></div></div></div>
            </div>
          )}
        </div>

        <div className="bg-blue-900 rounded-xl p-6 text-white text-center">
          <h3 className="text-xl font-bold mb-2">Ready to Apply?</h3>
          <p className="text-blue-200 mb-4">Complete your application in {service.estimated_steps || 1} simple step{service.estimated_steps !== 1 ? 's' : ''}</p>
          <button onClick={handleApply} className="px-8 py-3 bg-yellow-500 text-blue-900 font-bold rounded-lg hover:bg-yellow-400 transition shadow-lg">Start Application</button>
        </div>

        {related.length > 0 && (
          <div className="mt-10"><h3 className="text-xl font-semibold text-gray-800 mb-4">Related Services</h3><div className="grid grid-cols-1 md:grid-cols-3 gap-4">{related.map((rel) => (
            <Link key={rel.id} href={`/civic/service/${rel.slug}`} className="bg-white p-4 rounded-lg shadow hover:shadow-md transition border border-gray-100"><h4 className="font-semibold text-gray-800 mb-1">{rel.name}</h4><p className="text-sm text-gray-500 line-clamp-2">{rel.description}</p></Link>
          ))}</div></div>
        )}
      </div>
    </div>
  );
}
EOF

cat << 'EOF' > components/civic/ServiceApply.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/router';
import Link from 'next/link';

interface Service { id: string; name: string; slug: string; requirements: Array<{ label: string }>; required_documents: Array<{ name: string; description: string }>; fees: { amount: number; currency: string }; estimated_steps: number; }
interface FormField { label: string; key: string; type: 'text' | 'email' | 'tel' | 'date' | 'select' | 'textarea' | 'number'; required: boolean; options?: string[]; placeholder?: string; }

export default function ServiceApply() {
  const router = useRouter();
  const { slug } = router.query;
  const [service, setService] = useState<Service | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [documents, setDocuments] = useState<Array<{ name: string; url: string }>>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [applicationId, setApplicationId] = useState('');
  const [formFields, setFormFields] = useState<FormField[]>([]);

  useEffect(() => { if (slug) fetchService(); }, [slug]);

  const fetchService = async () => {
    setLoading(true);
    const { data } = await supabase.from('civic_services').select('id, name, slug, requirements, required_documents, fees, estimated_steps').eq('slug', slug).eq('status', 'active').single();
    if (data) {
      setService(data);
      const fields: FormField[] = [
        { label: 'Full Name', key: 'full_name', type: 'text', required: true, placeholder: 'Enter your full name' },
        { label: 'ID Number', key: 'id_number', type: 'text', required: true, placeholder: 'National ID or Passport' },
        { label: 'Email Address', key: 'email', type: 'email', required: true, placeholder: 'your@email.com' },
        { label: 'Phone Number', key: 'phone', type: 'tel', required: true, placeholder: '+254...' },
        { label: 'County', key: 'county', type: 'select', required: true, options: ['Nairobi','Mombasa','Kisumu','Nakuru','Other'] },
        { label: 'Physical Address', key: 'address', type: 'textarea', required: true, placeholder: 'Street, Building, Estate' },
      ];
      data.requirements?.forEach((req: any, idx: number) => { fields.push({ label: req.label, key: `requirement_${idx}`, type: 'text', required: true, placeholder: `Enter ${req.label}` }); });
      setFormFields(fields);
    }
    setLoading(false);
  };

  const handleInputChange = (key: string, value: string) => { setFormData(prev => ({ ...prev, [key]: value })); };
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, docName: string) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true); setError('');
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `applications/${fileName}`;
      const { error: uploadError } = await supabase.storage.from('civic-documents').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('civic-documents').getPublicUrl(filePath);
      setDocuments(prev => [...prev, { name: docName, url: publicUrl }]);
    } catch (err: any) { setError(`Upload failed: ${err.message}`); } finally { setUploading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSubmitting(true);
    try {
      const missingFields = formFields.filter(f => f.required && !formData[f.key]);
      if (missingFields.length > 0) throw new Error(`Please fill in: ${missingFields.map(f => f.label).join(', ')}`);
      const requiredDocNames = service?.required_documents?.map((d: any) => d.name) || [];
      const uploadedDocNames = documents.map(d => d.name);
      const missingDocs = requiredDocNames.filter((name: string) => !uploadedDocNames.includes(name));
      if (missingDocs.length > 0) throw new Error(`Please upload: ${missingDocs.join(', ')}`);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Please sign in to submit an application');
      const { data, error: insertError } = await supabase.from('civic_applications').insert({ user_id: user.id, service_id: service?.id, status: 'submitted', form_data: formData, documents: documents, payment_status: service?.fees?.amount === 0 ? 'waived' : 'pending', payment_amount: service?.fees?.amount || 0, submitted_at: new Date().toISOString() }).select('id').single();
      if (insertError) throw insertError;
      setApplicationId(data.id); setSuccess(true);
    } catch (err: any) { setError(err.message); } finally { setSubmitting(false); }
  };

  const totalSteps = service?.estimated_steps || 3;
  const progress = (currentStep / totalSteps) * 100;

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-center"><div className="text-4xl mb-4 animate-pulse">📝</div><div className="text-gray-600">Loading application form...</div></div></div>;
  if (!service) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-center"><div className="text-5xl mb-4">❓</div><h2 className="text-2xl font-bold text-gray-800 mb-2">Service Not Found</h2><Link href="/civic/services" className="text-blue-600 hover:underline">Browse services →</Link></div></div>;
  if (success) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Application Submitted!</h2>
        <p className="text-gray-600 mb-4">Your application for <strong>{service.name}</strong> has been received.</p>
        <div className="bg-blue-50 rounded-lg p-4 mb-6"><div className="text-sm text-gray-500">Application ID</div><div className="font-mono font-bold text-blue-800">{applicationId}</div></div>
        <div className="flex gap-3 justify-center">
          <Link href="/civic/my-applications" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">My Applications</Link>
          <Link href="/civic/services" className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition">More Services</Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-900 text-white py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2 text-sm text-blue-300 mb-3">
            <Link href="/civic" className="hover:text-white transition">Civic Home</Link><span>›</span>
            <Link href="/civic/services" className="hover:text-white transition">Services</Link><span>›</span>
            <Link href={`/civic/service/${service.slug}`} className="hover:text-white transition">{service.name}</Link><span>›</span>
            <span className="text-white">Apply</span>
          </div>
          <h1 className="text-3xl font-bold">Apply for {service.name}</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-500 mb-2"><span>Step {currentStep} of {totalSteps}</span><span>{Math.round(progress)}% complete</span></div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-blue-600 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} /></div>
        </div>

        {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-800 text-sm">⚠️ {error}</div>}

        <form onSubmit={handleSubmit}>
          {currentStep === 1 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formFields.slice(0, 6).map((field) => (
                  <div key={field.key} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{field.label} {field.required && <span className="text-red-500">*</span>}</label>
                    {field.type === 'select' ? (
                      <select value={formData[field.key] || ''} onChange={(e) => handleInputChange(field.key, e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required={field.required}><option value="">Select {field.label}</option>{field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select>
                    ) : field.type === 'textarea' ? (
                      <textarea value={formData[field.key] || ''} onChange={(e) => handleInputChange(field.key, e.target.value)} placeholder={field.placeholder} rows={3} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required={field.required} />
                    ) : (
                      <input type={field.type} value={formData[field.key] || ''} onChange={(e) => handleInputChange(field.key, e.target.value)} placeholder={field.placeholder} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required={field.required} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Service Requirements</h2>
              <div className="space-y-4">
                {formFields.slice(6).map((field) => (
                  <div key={field.key}><label className="block text-sm font-medium text-gray-700 mb-1">{field.label} {field.required && <span className="text-red-500">*</span>}</label><input type="text" value={formData[field.key] || ''} onChange={(e) => handleInputChange(field.key, e.target.value)} placeholder={field.placeholder} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required={field.required} /></div>
                ))}
                {formFields.length <= 6 && <p className="text-gray-500 text-center py-4">No additional requirements for this service.</p>}
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Required Documents</h2>
              <div className="space-y-4">
                {service.required_documents?.map((doc: any, idx: number) => (
                  <div key={idx} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2"><div><div className="font-medium text-gray-800">{doc.name}</div><p className="text-sm text-gray-500">{doc.description}</p></div>{documents.find(d => d.name === doc.name) ? <span className="text-green-600 text-sm font-medium">✓ Uploaded</span> : <span className="text-red-500 text-sm font-medium">Required</span>}</div>
                    <input type="file" onChange={(e) => handleFileUpload(e, doc.name)} disabled={uploading} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                  </div>
                ))}
                {(!service.required_documents || service.required_documents.length === 0) && <p className="text-gray-500 text-center py-4">No documents required for this service.</p>}
              </div>
              <div className="mt-6 bg-gray-50 rounded-lg p-4"><h3 className="font-semibold text-gray-800 mb-2">Payment Summary</h3><div className="flex justify-between text-sm"><span className="text-gray-600">Service Fee</span><span className="font-medium">{service.fees?.amount === 0 ? 'FREE' : `${service.fees?.currency} ${service.fees?.amount?.toLocaleString()}`}</span></div>{service.fees?.amount > 0 && <p className="text-xs text-gray-500 mt-2">Payment will be processed after application review.</p>}</div>
            </div>
          )}

          <div className="flex justify-between">
            <button type="button" onClick={() => setCurrentStep(Math.max(1, currentStep - 1))} disabled={currentStep === 1} className="px-6 py-2 border rounded-lg text-gray-700 hover:bg-gray-50 transition disabled:opacity-50">← Previous</button>
            {currentStep < totalSteps ? (
              <button type="button" onClick={() => setCurrentStep(currentStep + 1)} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">Next →</button>
            ) : (
              <button type="submit" disabled={submitting || uploading} className="px-8 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition disabled:opacity-50">{submitting ? 'Submitting...' : uploading ? 'Uploading...' : 'Submit Application'}</button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
EOF

echo "Part 1 complete: ServiceTooltip, ServiceList, ServiceDetail, ServiceApply"
