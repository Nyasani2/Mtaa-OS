'use client';
import Link from 'next/link';
import { useAppointments } from '../hooks/useAppointments';
import { Calendar, Clock, MapPin, Video } from 'lucide-react';

export function UpcomingAppointments({ userId, role }: { userId: string; role: 'patient' | 'provider' }) {
  const { data: appointments } = useAppointments(userId, role);
  const upcoming = appointments?.filter(a => ['scheduled', 'confirmed'].includes(a.status)).slice(0, 5);
  if (!upcoming?.length) return null;
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Upcoming Appointments</h3>
        <Link href="/health/appointments" className="text-sm text-emerald-600 hover:text-emerald-700">View all</Link>
      </div>
      <div className="divide-y divide-gray-100">
        {upcoming.map((apt) => (
          <div key={apt.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                {apt.appointment_type === 'telemedicine' ? <Video className="w-5 h-5 text-emerald-600" /> : <Calendar className="w-5 h-5 text-emerald-600" />}
              </div>
              <div>
                <p className="font-medium text-gray-900">{role === 'patient' ? apt.health_providers?.full_name : apt.health_patients?.full_name}</p>
                <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(apt.scheduled_at).toLocaleString()}</span>
                  {apt.appointment_type !== 'telemedicine' && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {apt.health_providers?.facility_name}</span>}
                </div>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${apt.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{apt.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
