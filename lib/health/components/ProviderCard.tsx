'use client';
import Link from 'next/link';
import { HealthProvider } from '../types';
import { Star, MapPin, Video, Stethoscope } from 'lucide-react';

export function ProviderCard({ provider }: { provider: HealthProvider }) {
  return (
    <Link href={`/health/providers/${provider.id}`} className="block bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center"><Stethoscope className="w-6 h-6 text-emerald-600" /></div>
          <div><h4 className="font-semibold text-gray-900">Dr. {provider.full_name || 'Unknown'}</h4><p className="text-sm text-gray-500">{provider.specialty}</p></div>
        </div>
        <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg"><Star className="w-4 h-4 text-amber-500 fill-amber-500" /><span className="text-sm font-medium text-amber-700">{provider.rating?.toFixed(1) || '0.0'}</span></div>
      </div>
      <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
        {provider.facility_name && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {provider.facility_name}</span>}
        {provider.available_for_telemedicine && <span className="flex items-center gap-1 text-emerald-600"><Video className="w-4 h-4" /> Telemedicine</span>}
      </div>
      {provider.consultation_fee && <p className="mt-3 text-sm font-medium text-gray-900">Consultation: ${provider.consultation_fee}</p>}
    </Link>
  );
}
