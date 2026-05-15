import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

// ============================================
// INTERFACES
// ============================================
interface Drone {
  id: string;
  drone_id: string;
  model: string;
  status: 'standby' | 'charging' | 'mission' | 'maintenance' | 'offline' | 'crashed';
  battery_pct: number;
  current_lat: number | null;
  current_lng: number | null;
  home_base_lat: number;
  home_base_lng: number;
  total_missions: number;
  total_flight_hours: number;
  last_mission_at: string | null;
  firmware_version: string;
  max_flight_time: number;
  payload_capacity: number;
}

interface Mission {
  id: string;
  drone_id: string;
  project_id: string | null;
  mission_type: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'aborted' | 'failed';
  scheduled_at: string;
  completed_at: string | null;
  ai_recommendation: string | null;
  area_covered_sqm: number | null;
  findings_summary: string | null;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface MissionLog {
  id: string;
  mission_id: string;
  timestamp: string;
  event_type: string;
  description: string;
  lat: number | null;
  lng: number | null;
}

// ============================================
// TOOLTIP COMPONENT (Self-Explaining UI)
// ============================================
function TooltipCard({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  const [show, setShow] = useState(false);
  
  return (
    <div 
      className={`relative ${className}`}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onTouchStart={() => setShow(true)}
      onTouchEnd={() => setShow(false)}
    >
      {children}
      {show && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 bg-slate-800 text-white text-sm rounded-lg shadow-xl p-4 pointer-events-none">
          <div className="font-semibold mb-2 text-yellow-400">{title}</div>
          <div className="space-y-1 text-slate-300 text-xs">
            {children}
          </div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-800" />
        </div>
      )}
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function DroneFleet() {
  const [drones, setDrones] = useState<Drone[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [logs, setLogs] = useState<MissionLog[]>([]);
  const [selectedDrone, setSelectedDrone] = useState<string | null>(null);
  const [selectedMission, setSelectedMission] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [{ data: droneData }, { data: missionData }] = await Promise.all([
        supabase.from('civic_drone_fleet').select('*').order('drone_id'),
        supabase.from('civic_drone_missions').select('*').in('status', ['in_progress', 'scheduled']).order('scheduled_at', { ascending: false })
      ]);
      
      setDrones(droneData || []);
      setMissions(missionData || []);
    } catch (err) {
      console.error('Drone fleet fetch error:', err);
    }
    setLoading(false);
  };

  const fetchMissionLogs = async (missionId: string) => {
    const { data } = await supabase
      .from('civic_drone_logs')
      .select('*')
      .eq('mission_id', missionId)
      .order('timestamp', { ascending: false })
      .limit(20);
    setLogs(data || []);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      standby: 'bg-green-100 text-green-800',
      charging: 'bg-yellow-100 text-yellow-800',
      mission: 'bg-blue-100 text-blue-800',
      maintenance: 'bg-orange-100 text-orange-800',
      offline: 'bg-gray-100 text-gray-800',
      crashed: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getMissionStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      scheduled: 'bg-gray-100 text-gray-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      aborted: 'bg-orange-100 text-orange-800',
      failed: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getBatteryColor = (pct: number) => {
    if (pct >= 60) return 'bg-green-500';
    if (pct >= 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getPriorityColor = (p: string) => {
    const colors: Record<string, string> = {
      low: 'bg-gray-100 text-gray-600',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };
    return colors[p] || 'bg-gray-100 text-gray-600';
  };

  const filteredDrones = filterStatus === 'all' 
    ? drones 
    : drones.filter(d => d.status === filterStatus);

  const selectedDroneData = drones.find(d => d.id === selectedDrone);
  const selectedMissionData = missions.find(m => m.id === selectedMission);
  const droneMissions = missions.filter(m => m.drone_id === selectedDrone);

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4 animate-pulse">🚁</div>
        <div className="text-gray-600">Loading drone fleet...</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-slate-900 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-4">
            <Link href="/civic" className="hover:text-white transition">Civic Home</Link>
            <span>›</span>
            <span className="text-white">Drone Fleet</span>
          </div>
          
          <h1 className="text-4xl font-bold mb-2">Drone Fleet</h1>
          <p className="text-slate-400 mb-6">Autonomous verification & inspection units</p>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <TooltipCard title="Total Drones" className="w-full">
              <div className="bg-white/10 backdrop-blur rounded-lg p-4 cursor-help">
                <div className="text-2xl font-bold">{drones.length}</div>
                <div className="text-sm text-slate-300">Total Drones</div>
              </div>
              <div className="hidden">
                <p>All registered UAV units in the national fleet</p>
                <p>Includes operational, maintenance, and offline units</p>
              </div>
            </TooltipCard>
            
            <TooltipCard title="On Mission" className="w-full">
              <div className="bg-white/10 backdrop-blur rounded-lg p-4 cursor-help">
                <div className="text-2xl font-bold text-blue-400">
                  {drones.filter(d => d.status === 'mission').length}
                </div>
                <div className="text-sm text-slate-300">On Mission</div>
              </div>
              <div className="hidden">
                <p>Drones currently executing inspection missions</p>
                <p>Real-time telemetry active</p>
              </div>
            </TooltipCard>
            
            <TooltipCard title="Total Missions" className="w-full">
              <div className="bg-white/10 backdrop-blur rounded-lg p-4 cursor-help">
                <div className="text-2xl font-bold">
                  {drones.reduce((sum, d) => sum + d.total_missions, 0)}
                </div>
                <div className="text-sm text-slate-300">Total Missions</div>
              </div>
              <div className="hidden">
                <p>Cumulative mission count across entire fleet</p>
                <p>Since system inception</p>
              </div>
            </TooltipCard>
            
            <TooltipCard title="Offline/Crashed" className="w-full">
              <div className="bg-white/10 backdrop-blur rounded-lg p-4 cursor-help">
                <div className="text-2xl font-bold text-red-400">
                  {drones.filter(d => d.status === 'offline' || d.status === 'crashed').length}
                </div>
                <div className="text-sm text-slate-300">Offline/Crashed</div>
              </div>
              <div className="hidden">
                <p>Units requiring maintenance or recovery</p>
                <p>Click for diagnostic details</p>
              </div>
            </TooltipCard>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex gap-2 flex-wrap">
          {[
            { key: 'all', label: 'All Units' },
            { key: 'standby', label: 'Standby' },
            { key: 'mission', label: 'On Mission' },
            { key: 'charging', label: 'Charging' },
            { key: 'maintenance', label: 'Maintenance' },
            { key: 'offline', label: 'Offline' }
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilterStatus(f.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                filterStatus === f.key 
                  ? 'bg-slate-800 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-100 shadow'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Drone List */}
          <div className="lg:col-span-1 space-y-3">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Fleet Status</h2>
            {filteredDrones.length === 0 ? (
              <div className="text-center py-8 text-gray-500 bg-white rounded-lg shadow">
                No drones match current filter
              </div>
            ) : (
              filteredDrones.map((d) => (
                <TooltipCard 
                  key={d.id} 
                  title={`${d.drone_id} — ${d.model}`}
                  className="w-full"
                >
                  <button
                    onClick={() => {
                      setSelectedDrone(d.id);
                      setSelectedMission(null);
                      setLogs([]);
                    }}
                    className={`w-full text-left p-4 rounded-lg transition ${
                      selectedDrone === d.id 
                        ? 'bg-blue-50 border-2 border-blue-500' 
                        : 'bg-white shadow hover:shadow-md'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-semibold text-gray-800">{d.drone_id}</div>
                        <div className="text-xs text-gray-500">{d.model}</div>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(d.status)}`}>
                        {d.status}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getBatteryColor(d.battery_pct)} rounded-full transition-all`}
                          style={{ width: `${d.battery_pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{d.battery_pct}%</span>
                    </div>
                    
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>{d.total_missions} missions</span>
                      <span>{d.total_flight_hours?.toFixed(1)}h flight</span>
                    </div>
                  </button>
                  <div className="hidden">
                    <p><strong>Status:</strong> {d.status}</p>
                    <p><strong>Battery:</strong> {d.battery_pct}% remaining</p>
                    <p><strong>Flight Time:</strong> {d.total_flight_hours?.toFixed(1)} hours total</p>
                    <p><strong>Missions:</strong> {d.total_missions} completed</p>
                    <p><strong>Firmware:</strong> {d.firmware_version || 'N/A'}</p>
                    <p><strong>Max Flight:</strong> {d.max_flight_time || 'N/A'} min</p>
                    <p><strong>Payload:</strong> {d.payload_capacity || 'N/A'} kg</p>
                    {d.last_mission_at && (
                      <p><strong>Last Active:</strong> {new Date(d.last_mission_at).toLocaleString()}</p>
                    )}
                  </div>
                </TooltipCard>
              ))
            )}
          </div>

          {/* Detail Panel */}
          <div className="lg:col-span-2 space-y-6">
            {selectedDroneData ? (
              <>
                {/* Drone Overview */}
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-800">
                        {selectedDroneData.drone_id}
                      </h2>
                      <p className="text-gray-500">{selectedDroneData.model}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedDroneData.status)}`}>
                      {selectedDroneData.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm text-gray-500">Battery</div>
                      <div className="font-medium flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedDroneData.battery_pct >= 60 ? '#22c55e' : selectedDroneData.battery_pct >= 30 ? '#eab308' : '#ef4444' }} />
                        {selectedDroneData.battery_pct}%
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm text-gray-500">Total Missions</div>
                      <div className="font-medium">{selectedDroneData.total_missions}</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm text-gray-500">Flight Hours</div>
                      <div className="font-medium">{selectedDroneData.total_flight_hours?.toFixed(1)}h</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm text-gray-500">Firmware</div>
                      <div className="font-medium">{selectedDroneData.firmware_version || 'N/A'}</div>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="text-sm text-blue-600 font-medium mb-1">Current Position</div>
                      <div className="text-sm text-gray-600">
                        {selectedDroneData.current_lat && selectedDroneData.current_lng ? (
                          <span className="font-mono">
                            {selectedDroneData.current_lat.toFixed(6)}, {selectedDroneData.current_lng.toFixed(6)}
                          </span>
                        ) : (
                          'Not currently tracked'
                        )}
                      </div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="text-sm text-green-600 font-medium mb-1">Home Base</div>
                      <div className="text-sm text-gray-600 font-mono">
                        {selectedDroneData.home_base_lat?.toFixed(6)}, {selectedDroneData.home_base_lng?.toFixed(6)}
                      </div>
                    </div>
                  </div>

                  {selectedDroneData.last_mission_at && (
                    <div className="mt-4 text-sm text-gray-500 border-t pt-3">
                      Last mission: {new Date(selectedDroneData.last_mission_at).toLocaleString()}
                    </div>
                  )}
                </div>

                {/* Missions */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="font-semibold text-gray-800 mb-4">
                    Mission History ({droneMissions.length})
                  </h3>
                  
                  {droneMissions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                      <div className="text-3xl mb-2">📋</div>
                      <p>No active or scheduled missions</p>
                      <p className="text-sm text-gray-400 mt-1">This drone is available for assignment</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {droneMissions.map((m) => (
                        <TooltipCard 
                          key={m.id} 
                          title={`Mission: ${m.mission_type}`}
                          className="w-full"
                        >
                          <button
                            onClick={() => {
                              setSelectedMission(m.id);
                              fetchMissionLogs(m.id);
                            }}
                            className={`w-full text-left p-4 rounded-lg border-2 transition ${
                              selectedMission === m.id 
                                ? 'border-blue-500 bg-blue-50' 
                                : 'border-gray-100 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <div className="font-medium text-gray-800 capitalize">{m.mission_type}</div>
                                <div className="text-xs text-gray-500">
                                  {new Date(m.scheduled_at).toLocaleString()}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <span className={`text-xs px-2 py-0.5 rounded-full ${getMissionStatusColor(m.status)}`}>
                                  {m.status.replace('_', ' ')}
                                </span>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityColor(m.priority)}`}>
                                  {m.priority}
                                </span>
                              </div>
                            </div>
                            
                            {m.ai_recommendation && (
                              <div className="text-xs text-purple-600 bg-purple-50 p-2 rounded mt-2">
                                🤖 AI: {m.ai_recommendation}
                              </div>
                            )}
                            
                            {m.area_covered_sqm && (
                              <div className="text-xs text-gray-500 mt-2">
                                Area covered: {(m.area_covered_sqm / 10000).toFixed(2)} hectares
                              </div>
                            )}
                          </button>
                          <div className="hidden">
                            <p><strong>Type:</strong> {m.mission_type}</p>
                            <p><strong>Status:</strong> {m.status}</p>
                            <p><strong>Priority:</strong> {m.priority}</p>
                            <p><strong>Scheduled:</strong> {new Date(m.scheduled_at).toLocaleString()}</p>
                            {m.completed_at && <p><strong>Completed:</strong> {new Date(m.completed_at).toLocaleString()}</p>}
                            {m.area_covered_sqm && <p><strong>Area:</strong> {(m.area_covered_sqm / 10000).toFixed(2)} ha</p>}
                            {m.findings_summary && <p><strong>Findings:</strong> {m.findings_summary}</p>}
                            {m.ai_recommendation && <p><strong>AI Rec:</strong> {m.ai_recommendation}</p>}
                          </div>
                        </TooltipCard>
                      ))}
                    </div>
                  )}
                </div>

                {/* Mission Logs */}
                {selectedMissionData && logs.length > 0 && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="font-semibold text-gray-800 mb-4">
                      Mission Telemetry: {selectedMissionData.mission_type}
                    </h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {logs.map((log) => (
                        <div key={log.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg text-sm">
                          <div className="text-xs text-gray-400 font-mono whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-800 capitalize">{log.event_type}</div>
                            <div className="text-gray-600">{log.description}</div>
                            {log.lat && log.lng && (
                              <div className="text-xs text-blue-600 font-mono mt-1">
                                📍 {log.lat.toFixed(6)}, {log.lng.toFixed(6)}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <div className="text-6xl mb-4">🚁</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Select a Drone</h3>
                <p className="text-gray-500">Click any drone from the fleet list to view detailed telemetry, mission history, and real-time status.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
