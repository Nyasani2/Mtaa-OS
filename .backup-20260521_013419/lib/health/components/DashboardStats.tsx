'use client';
import { useEffect, useState } from 'react';
import { HealthController } from '../controllers/health.controller';
import { Calendar, FileText, Pill, Syringe, ShoppingBag, Bell } from 'lucide-react';
const icons = { Calendar, FileText, Pill, Syringe, ShoppingBag, Bell };

export function DashboardStats({ userId, role }: { userId: string; role: 'patient' | 'provider' }) {
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  useEffect(() => { HealthController.getDashboardStats(userId, role).then(setStats); }, [userId, role]);
  if (!stats) return <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">{Array(6).fill(0).map((_, i) => <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-xl" />)}</div>;
  const items = role === 'patient'
    ? [
        { label: 'Appointments', value: stats.totalAppointments, icon: 'Calendar', color: 'bg-blue-50 text-blue-600' },
        { label: 'Medical Records', value: stats.totalRecords, icon: 'FileText', color: 'bg-purple-50 text-purple-600' },
        { label: 'Active Prescriptions', value: stats.activePrescriptions, icon: 'Pill', color: 'bg-emerald-50 text-emerald-600' },
        { label: 'Vaccinations', value: stats.vaccinations, icon: 'Syringe', color: 'bg-amber-50 text-amber-600' },
        { label: 'Pending Orders', value: stats.pendingOrders, icon: 'ShoppingBag', color: 'bg-rose-50 text-rose-600' },
        { label: 'Notifications', value: stats.unreadNotifications, icon: 'Bell', color: 'bg-cyan-50 text-cyan-600' },
      ]
    : [
        { label: 'Total Appointments', value: stats.totalAppointments, icon: 'Calendar', color: 'bg-blue-50 text-blue-600' },
        { label: 'Upcoming', value: stats.upcomingAppointments, icon: 'Calendar', color: 'bg-emerald-50 text-emerald-600' },
        { label: 'Active Sessions', value: stats.activeSessions, icon: 'Calendar', color: 'bg-purple-50 text-purple-600' },
        { label: 'Records Created', value: stats.totalRecords, icon: 'FileText', color: 'bg-amber-50 text-amber-600' },
      ];
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item) => {
        const Icon = icons[item.icon as keyof typeof icons];
        return (
          <div key={item.label} className="bg-white p-5 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-gray-500">{item.label}</p><p className="text-2xl font-bold text-gray-900 mt-1">{item.value}</p></div>
              <div className={`p-3 rounded-lg ${item.color}`}><Icon className="w-5 h-5" /></div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
