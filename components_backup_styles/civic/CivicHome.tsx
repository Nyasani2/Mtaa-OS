import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/router';
import Link from 'next/link';

interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
}

interface FeaturedService {
  id: string;
  name: string;
  slug: string;
  description: string;
  ministry: string;
  processing_time: string;
}

interface ActiveProject {
  id: string;
  project_code: string;
  name: string;
  ministry: string;
  budget_allocated: number;
  completion_pct: number;
  status: string;
}

export default function CivicHome() {
  const router = useRouter();
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [featured, setFeatured] = useState<FeaturedService[]>([]);
  const [projects, setProjects] = useState<ActiveProject[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch categories
    const { data: catData } = await supabase
      .from('civic_categories')
      .select('*')
      .order('sort_order', { ascending: true });
    
    // Fetch featured services
    const { data: svcData } = await supabase
      .from('civic_services')
      .select('id, name, slug, description, ministry, processing_time')
      .eq('status', 'active')
      .limit(6);
    
    // Fetch active projects
    const { data: projData } = await supabase
      .from('civic_projects')
      .select('id, project_code, name, ministry, budget_allocated, completion_pct, status')
      .in('status', ['active', 'on_track', 'at_risk'])
      .order('created_at', { ascending: false })
      .limit(5);
    
    setCategories(catData || []);
    setFeatured(svcData || []);
    setProjects(projData || []);
    setLoading(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/civic/services?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      on_track: 'bg-blue-100 text-blue-800',
      at_risk: 'bg-yellow-100 text-yellow-800',
      stalled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) return <div className="p-8 text-center">Loading Civic Front Door...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero / Search */}
      <div className="bg-blue-900 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">Civic Front Door</h1>
          <p className="text-blue-200 mb-6">Access government services, track projects, verify contractors</p>
          
          <form onSubmit={handleSearch} className="flex gap-2 max-w-2xl">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search services, projects, contractors..."
              className="flex-1 px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-yellow-500 text-blue-900 font-semibold rounded-lg hover:bg-yellow-400 transition"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <Link href="/civic/services" className="bg-white p-4 rounded-lg shadow hover:shadow-md transition text-center">
            <div className="text-3xl mb-2">📋</div>
            <div className="font-semibold text-gray-800">All Services</div>
          </Link>
          <Link href="/civic/projects" className="bg-white p-4 rounded-lg shadow hover:shadow-md transition text-center">
            <div className="text-3xl mb-2">🏗️</div>
            <div className="font-semibold text-gray-800">Projects</div>
          </Link>
          <Link href="/civic/contractors" className="bg-white p-4 rounded-lg shadow hover:shadow-md transition text-center">
            <div className="text-3xl mb-2">🏢</div>
            <div className="font-semibold text-gray-800">Contractors</div>
          </Link>
          <Link href="/civic/blacklist" className="bg-white p-4 rounded-lg shadow hover:shadow-md transition text-center">
            <div className="text-3xl mb-2">🔍</div>
            <div className="font-semibold text-gray-800">Blacklist Check</div>
          </Link>
        </div>

        {/* Categories */}
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Service Categories</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-10">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/civic/services?category=${cat.slug}`}
              className="bg-white p-5 rounded-lg shadow hover:shadow-md transition group"
            >
              <div className="text-2xl mb-2 group-hover:scale-110 transition-transform inline-block">
                {cat.icon || '📁'}
              </div>
              <h3 className="font-semibold text-gray-800 mb-1">{cat.name}</h3>
              <p className="text-sm text-gray-500 line-clamp-2">{cat.description}</p>
            </Link>
          ))}
        </div>

        {/* Featured Services */}
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Featured Services</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {featured.map((svc) => (
            <Link
              key={svc.id}
              href={`/civic/service/${svc.slug}`}
              className="bg-white p-5 rounded-lg shadow hover:shadow-md transition border-l-4 border-blue-500"
            >
              <h3 className="font-semibold text-gray-800 mb-2">{svc.name}</h3>
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{svc.description}</p>
              <div className="flex justify-between text-xs text-gray-500">
                <span>{svc.ministry}</span>
                <span>⏱️ {svc.processing_time || 'Varies'}</span>
              </div>
            </Link>
          ))}
        </div>

        {/* Active Projects */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Active Projects</h2>
          <Link href="/civic/projects" className="text-blue-600 hover:underline">View All →</Link>
        </div>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {projects.map((proj, idx) => (
            <Link
              key={proj.id}
              href={`/civic/project/${proj.id}`}
              style={`flex items-center p-4 hover:bg-gray-50 transition ${idx !== projects.length - 1 ? 'border-b' : ''}`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-gray-500">{proj.project_code}</span>
                  <span style={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(proj.status)}`}>
                    {proj.status.replace('_', ' ')}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-800">{proj.name}</h3>
                <p className="text-sm text-gray-500">{proj.ministry}</p>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-gray-800">
                  KES {proj.budget_allocated?.toLocaleString() || '0'}
                </div>
                <div className="text-xs text-gray-500">{proj.completion_pct}% complete</div>
                <div className="w-24 h-1.5 bg-gray-200 rounded-full mt-1 overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${proj.completion_pct}%` }}
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Treasury Watch Link */}
        <div className="mt-8 bg-gradient-to-r from-blue-900 to-blue-800 rounded-lg p-6 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold mb-1">Treasury Watch</h3>
              <p className="text-blue-200">Track presidential transactions and multi-level approvals</p>
            </div>
            <Link
              href="/civic/treasury"
              className="px-6 py-2 bg-yellow-500 text-blue-900 font-semibold rounded-lg hover:bg-yellow-400 transition"
            >
              View Transactions
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
