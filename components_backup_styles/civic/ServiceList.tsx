import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/router';
import Link from 'next/link';

interface Service {
  id: string;
  name: string;
  slug: string;
  description: string;
  ministry: string;
  processing_time: string;
  fees: { amount: number; currency: string };
  category_id: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function ServiceList() {
  const router = useRouter();
  const { category, search } = router.query;
  
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (category) setActiveCategory(category as string);
    if (search) setSearchQuery(search as string);
    fetchCategories();
  }, [category, search]);

  useEffect(() => {
    fetchServices();
  }, [activeCategory, searchQuery]);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('civic_categories')
      .select('id, name, slug')
      .order('sort_order');
    setCategories(data || []);
  };

  const fetchServices = async () => {
    setLoading(true);
    let query = supabase
      .from('civic_services')
      .select('id, name, slug, description, ministry, processing_time, fees, category_id')
      .eq('status', 'active');

    if (activeCategory) {
      const cat = categories.find(c => c.slug === activeCategory);
      if (cat) query = query.eq('category_id', cat.id);
    }

    if (searchQuery) {
      query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
    }

    const { data } = await query.order('name');
    setServices(data || []);
    setLoading(false);
  };

  const handleCategoryClick = (slug: string) => {
    setActiveCategory(activeCategory === slug ? '' : slug);
    router.push(`/civic/services${slug ? `?category=${slug}` : ''}`, undefined, { shallow: true });
  };

  if (loading) return <div className="p-8 text-center">Loading services...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <Link href="/civic" className="hover:text-blue-600">Civic Home</Link>
            <span>›</span>
            <span className="text-gray-800">Services</span>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Government Services</h1>
          
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => handleCategoryClick('')}
              style={`px-4 py-2 rounded-full text-sm font-medium transition ${
                !activeCategory ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.slug)}
                style={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  activeCategory === cat.slug ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {services.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No services found matching your criteria.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((svc) => (
              <Link
                key={svc.id}
                href={`/civic/service/${svc.slug}`}
                className="bg-white p-5 rounded-lg shadow hover:shadow-md transition border-l-4 border-blue-500 group"
              >
                <h3 className="font-semibold text-gray-800 mb-2 group-hover:text-blue-600 transition">{svc.name}</h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-3">{svc.description}</p>
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span className="bg-gray-100 px-2 py-1 rounded">{svc.ministry}</span>
                  <span>
                    {svc.fees?.amount > 0 ? `KES ${svc.fees.amount}` : 'Free'}
                  </span>
                </div>
                <div className="mt-3 text-xs text-gray-400">
                  ⏱️ {svc.processing_time || 'Processing time varies'}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
