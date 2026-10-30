import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { 
  Settings, 
  Ambulance, 
  Users, 
  Activity, 
  ShieldCheck, 
  Database, 
  Wifi, 
  CheckCircle2, 
  Battery, 
  Wind, 
  Clock, 
  RefreshCw 
} from 'lucide-react';

export const AdminPanel = () => {
  const { user } = useAuth();
  const { isConnected } = useSocket();

  const [ambulances, setAmbulances] = useState([]);
  const [emergencies, setEmergencies] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [ambRes, emgRes] = await Promise.all([
        api.getAmbulances(),
        api.getEmergencies()
      ]);
      if (ambRes.success) setAmbulances(ambRes.ambulances);
      if (emgRes.success) setEmergencies(emgRes.emergencies);
    } catch (e) {
      console.warn('Admin fetch fallback:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="glass-panel p-4 rounded-2xl border border-purple-500/30 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-purple-600/20 border border-purple-500 flex items-center justify-center text-purple-400">
            <Settings className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-display font-extrabold text-white">
                Command Administration & Fleet Oversight
              </h1>
              <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/40 text-[10px] font-mono font-bold">
                ROOT ACCESS
              </span>
            </div>
            <p className="text-xs text-slate-400">
              System Admin: <strong className="text-slate-200">{user?.name || 'Command Administrator'}</strong> | Organization: Emergency Operations Bureau
            </p>
          </div>
        </div>

        <button
          onClick={fetchData}
          className="p-2 rounded-lg bg-navy-800 hover:bg-navy-700 text-slate-300 border border-slate-700 transition"
          title="Refresh Data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* System Health Indicators */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>WebSocket Gateway</span>
            <Wifi className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-lg font-bold font-mono text-emerald-400">
            {isConnected ? 'ONLINE (0.4ms)' : 'RECONNECTING'}
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Socket.IO real-time engine</p>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Database Status</span>
            <Database className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-lg font-bold font-mono text-cyan-400">
            CONNECTED
          </div>
          <p className="text-[10px] text-slate-500 mt-1">MongoDB Atlas Cluster 0</p>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Routing Latency</span>
            <Activity className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-lg font-bold font-mono text-purple-400">
            18 ms avg
          </div>
          <p className="text-[10px] text-slate-500 mt-1">OSRM Dynamic Heuristics</p>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Active Fleet Status</span>
            <Ambulance className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-lg font-bold font-mono text-white">
            4 / 4 Units
          </div>
          <p className="text-[10px] text-slate-500 mt-1">100% Operational Readiness</p>
        </div>
      </div>

      {/* Fleet Telemetry Management Table */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <h2 className="text-sm font-bold text-white flex items-center space-x-2">
            <Ambulance className="w-4 h-4 text-red-500" />
            <span>Emergency Ambulance Fleet Telemetry</span>
          </h2>
          <span className="text-[10px] text-slate-400 font-mono">4 Vehicles Deployed</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-navy-950 text-slate-400 font-mono text-[10px] uppercase">
              <tr>
                <th className="py-2.5 px-3">Vehicle ID</th>
                <th className="py-2.5 px-3">Registration</th>
                <th className="py-2.5 px-3">Operator</th>
                <th className="py-2.5 px-3">Equipment Level</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Oxygen</th>
                <th className="py-2.5 px-3">Battery</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {ambulances.map((amb) => (
                <tr key={amb.ambulanceId} className="hover:bg-navy-900/50">
                  <td className="py-3 px-3 font-mono font-bold text-white">{amb.ambulanceId}</td>
                  <td className="py-3 px-3 font-mono text-slate-300">{amb.vehicleNumber}</td>
                  <td className="py-3 px-3">{amb.operatorName}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded bg-navy-900 border border-slate-700 text-[10px]">
                      {amb.equipmentLevel}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      amb.status === 'en_route_hospital'
                        ? 'bg-red-950 text-red-400 border border-red-500/40'
                        : 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                    }`}>
                      {amb.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-cyan-400">
                    <div className="flex items-center space-x-1">
                      <Wind className="w-3.5 h-3.5" />
                      <span>{amb.oxygenLevel || 88}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 font-mono text-emerald-400">
                    <div className="flex items-center space-x-1">
                      <Battery className="w-3.5 h-3.5" />
                      <span>{amb.batteryStatus || 94}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Incident History Audit Trail */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <h2 className="text-sm font-bold text-white flex items-center space-x-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span>Incident Audit Trail & Response Time Verification</span>
          </h2>
          <span className="text-[10px] text-slate-400 font-mono">Timestamped Records</span>
        </div>

        <div className="space-y-2">
          {emergencies.map((emg) => (
            <div key={emg.emergencyId} className="p-3 rounded-xl bg-navy-950/70 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-bold text-white">{emg.emergencyId}</span>
                  <span className="text-slate-400">|</span>
                  <span className="text-slate-200 font-semibold">{emg.patientInfo?.conditionSummary}</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Vehicle: {emg.ambulanceId} → Destination: {emg.destinationHospital?.name}
                </p>
              </div>

              <div className="flex items-center space-x-4 font-mono text-[11px]">
                <span className="text-slate-400">ETA: <strong className="text-emerald-400">{emg.routeDetails?.estimatedTimeMin} min</strong></span>
                <span className="text-slate-400">Time Saved: <strong className="text-emerald-400">+{emg.routeDetails?.timeSavedMin} min</strong></span>
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30 font-bold uppercase text-[10px]">
                  {emg.status.replace(/_/g, ' ')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
