'use client';
import { useAppointments, useUpdateAppointmentStatus } from '../hooks/useAppointments';
import { HealthAppointment } from '../types';
import { Calendar, Clock, Video, MapPin, XCircle, Play } from 'lucide-react';

export function AppointmentList({ userId, role }: { userId: string; role: 'patient' | 'provider' }) {
  const { data: appointments, isLoading } = useAppointments(userId, role);
  const updateStatus = useUpdateAppointmentStatus();
  if (isLoading) return <div className="space-y-3">{Array(4).fill(0).map((_, i) => <div key={i} className="h-20 bg-gray-100 animate-pulse rounded-xl" />)}</div>;
  const getStatusColor = (status: HealthAppointment['status']) => {
    const colors: Record<string, string> = { scheduled: 'bg-blue-50 text-blue-700', confirmed: 'bg-emerald-50 text-emerald-700', in_progress: 'bg-purple-50 text-purple-700', completed: 'bg-gray-50 text-gray-700', cancelled: 'bg-red-50 text-red-700', no_show: 'bg-amber-50 text-amber-700' };
    return colors[status] || 'bg-gray-50 text-gray-700';
  };
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="divide-y divide-gray-100">
        {appointments?.map((apt) => (
          <div key={apt.id} className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${apt.appointment_type === 'telemedicine' ? 'bg-purple-50' : 'bg-emerald-50'}`}>
                  {apt.appointment_type === 'telemedicine' ? <Video className="w-5 h-5 text-purple-600" /> : <Calendar className="w-5 h-5 text-emerald-600" />}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{role === 'patient' ? `Dr. ${apt.health_providers?.full_name}` : apt.health_patients?.full_name}</p>
                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(apt.scheduled_at).toLocaleString()}</span>
                    {apt.health_providers?.facility_name && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {apt.health_providers.facility_name}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(apt.status)}`}>{apt.status}</span>
                {role === 'provider' && apt.status === 'confirmed' && <button onClick={() => updateStatus.mutate({ id: apt.id, status: 'in_progress' })} className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100"><Play className="w-4 h-4" /></button>}
                {apt.status === 'scheduled' && <button onClick={() => updateStatus.mutate({ id: apt.id, status: 'cancelled' })} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><XCircle className="w-4 h-4" /></button>}
              </div>
            </div>
            {apt.symptoms && <p className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">Symptoms: {apt.symptoms}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
