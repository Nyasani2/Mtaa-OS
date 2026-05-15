import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/router';
import Link from 'next/link';

interface Service {
  id: string;
  name: string;
  slug: string;
  requirements: Array<{ label: string }>;
}

export default function ServiceApply() {
  const router = useRouter();
  const { slug } = router.query;
  
  const [service, setService] = useState<Service | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [documents, setDocuments] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (slug) fetchService();
  }, [slug]);

  const fetchService = async () => {
    const { data } = await supabase
      .from('civic_services')
      .select('id, name, slug, requirements')
      .eq('slug', slug)
      .single();
    setService(data);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setDocuments(Array.from(e.target.files));
    }
  };

  const uploadDocuments = async (): Promise<string[]> => {
    const urls: string[] = [];
    for (const file of documents) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `service-docs/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('civic-documents')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('civic-documents')
        .getPublicUrl(filePath);
      
      urls.push(publicUrl);
    }
    return urls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.push('/login?redirect=' + encodeURIComponent(router.asPath));
        return;
      }

      let docUrls: string[] = [];
      if (documents.length > 0) {
        setUploading(true);
        docUrls = await uploadDocuments();
        setUploading(false);
      }

      const { error: insertError } = await supabase
        .from('service_applications')
        .insert({
          user_id: userData.user.id,
          service_id: service!.id,
          status: 'submitted',
          form_data: formData,
          documents: docUrls.map(url => ({ url, name: documents.find(d => url.includes(d.name.split('.')[0]))?.name || 'document' })),
          submitted_at: new Date().toISOString()
        });

      if (insertError) throw insertError;

      setSuccess(true);
      setTimeout(() => {
        router.push('/civic/my-applications');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  if (!service) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <Link href="/civic" className="hover:text-blue-600">Civic Home</Link>
          <span>›</span>
          <Link href={`/civic/service/${service.slug}`} className="hover:text-blue-600">{service.name}</Link>
          <span>›</span>
          <span className="text-gray-800">Apply</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-6">Apply for {service.name}</h1>

        {success ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <div className="text-4xl mb-2">✅</div>
            <h2 className="text-xl font-semibold text-green-800 mb-2">Application Submitted!</h2>
            <p className="text-green-600">Redirecting to your applications...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Dynamic form fields based on requirements */}
            {(service.requirements || []).map((req, idx) => (
              <div key={idx}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {req.label || req}
                </label>
                <input
                  type="text"
                  required
                  value={formData[req.label || `field_${idx}`] || ''}
                  onChange={(e) => handleInputChange(req.label || `field_${idx}`, e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={`Enter ${req.label || 'required information'}`}
                />
              </div>
            ))}

            {/* Document Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Supporting Documents
              </label>
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="w-full px-3 py-2 border rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {documents.length > 0 && (
                <p className="text-sm text-gray-500 mt-1">{documents.length} file(s) selected</p>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || uploading}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : submitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
