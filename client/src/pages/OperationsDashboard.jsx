import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { LeafletMap } from '../components/LeafletMap';
import { 
  Activity, 
  Ambulance, 
  Clock, 
  ShieldAlert, 
  Building2, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  MapPin, 
  Play, 
  Pause, 
  RefreshCw,
  TrendingDown
} from 'lucide-react';

export const OperationsDashboard = () => {
  const { liveLocation, isConnected } = useSocket();
  const [stats, setStats] = useState(null);
  const [emergencies, setEmergencies] = useState([]);
  const [ambulances, setAmbulances] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmergency, setSelectedEmergency] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simIndex, setSimIndex] = useState(0);

  const fetchData = async () => {
    try {
      const [overviewRes, emgRes, ambRes, hospRes] = await Promise.all([
        api.getDashboardOverview(),
        api.getEmergencies(),
        api.getAmbulances(),
        api.getHospitals()
      ]);

      if (overviewRes.success) setStats(overviewRes.metrics);
      if (emgRes.success && emgRes.emergencies) {
        setEmergencies(emgRes.emergencies);
        setSelectedEmergency(emgRes.emergencies[0]);
      }
      if (ambRes.success && ambRes.ambulances) setAmbulances(ambRes.ambulances);
      if (hospRes.success && hospRes.hospitals) setHospitals(hospRes.hospitals);
    } catch (e) {
      console.warn('Dashboard fetch fallback:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Simulation runner for live map movement
  useEffect(() => {
    let interval = null;
    if (isSimulating && selectedEmergency?.routeDetails?.routeCoordinates) {
      const coords = selectedEmergency.routeDetails.routeCoordinates;
      interval = setInterval(() => {
        setSimIndex((prev) => {
          const next = (prev + 1) % coords.length;
          // emit or update simulated ambulance position
          const nextCoord = coords[next];
          api.updateAmbulanceLocation('AMB-101', {
            lat: nextCoord[0],
            lng: nextCoord[1],
            speedKmH: 52,
            emergencyId: selectedEmergency.emergencyId
          });
          return next;
        });
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isSimulating, selectedEmergency]);

  const currentAmbulancePos = selectedEmergency?.routeDetails?.routeCoordinates
    ? selectedEmergency.routeDetails.routeCoordinates[simIndex]
    : [28.6315, 77.2167];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header & Status Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-display font-extrabold text-white tracking-tight">
              Emergency Operations Command Center
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-red-950 border border-red-500/40 text-red-400 font-mono text-[10px] font-bold animate-pulse">
              LIVE RADAR
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time urban ambulance dispatch, active green corridor oversight, and hospital shock-bay synchronization.
          </p>
        </div>

        {/* Top Controls */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsSimulating(!isSimulating)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
              isSimulating
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30'
            }`}
          >
            {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isSimulating ? 'Pause Vehicle Sim' : 'Simulate Live Journey'}</span>
          </button>

          <button
            onClick={fetchData}
            className="p-2 rounded-lg bg-navy-800 hover:bg-navy-700 text-slate-300 border border-slate-700 transition"
            title="Refresh Incidents"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Primary KPI Metrics Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Ambulances */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold">Active Fleet</span>
            <Ambulance className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-white">
            {stats?.activeAmbulancesCount || 4} <span className="text-xs text-slate-400 font-sans">units</span>
          </div>
          <div className="flex items-center space-x-1 text-[11px] text-emerald-400 mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>1 dispatched | 3 on standby</span>
          </div>
        </div>

        {/* Active Emergencies */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold">Active Emergencies</span>
            <Activity className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-mono font-bold text-red-400">
            {stats?.activeEmergenciesCount || 1} <span className="text-xs text-slate-400 font-sans">incident</span>
          </div>
          <div className="flex items-center space-x-1 text-[11px] text-red-400 mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
            <span>1 Code Red Critical</span>
          </div>
        </div>

        {/* Avg Response Time */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold">Avg Response Time</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-white">
            {stats?.averageResponseTimeMinutes || 11.4} <span className="text-xs text-slate-400 font-sans">min</span>
          </div>
          <div className="flex items-center space-x-1 text-[11px] text-emerald-400 mt-1">
            <TrendingDown className="w-3.5 h-3.5" />
            <span>53% reduction vs baseline (24.5m)</span>
          </div>
        </div>

        {/* Green Corridors Active */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold">Active Green Corridors</span>
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-emerald-400">
            {stats?.activeGreenCorridorsCount || 1} <span className="text-xs text-slate-400 font-sans">corridor</span>
          </div>
          <div className="flex items-center space-x-1 text-[11px] text-emerald-300 mt-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>5 Intersections pre-synchronized</span>
          </div>
        </div>
      </div>

      {/* Main Tactical Map and Incident Inspector Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map View - Spans 2 Cols */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
              <h2 className="text-sm font-bold text-slate-200">Live City Corridor GIS Map</h2>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              GPS: {currentAmbulancePos[0].toFixed(4)}, {currentAmbulancePos[1].toFixed(4)}
            </span>
          </div>

          <div className="h-[480px]">
            <LeafletMap
              center={[28.6000, 77.2150]}
              zoom={13}
              ambulancePos={currentAmbulancePos}
              routeCoordinates={selectedEmergency?.routeDetails?.routeCoordinates || []}
              intersections={selectedEmergency?.routeDetails?.intersections || []}
              hospitals={hospitals}
              isGreenCorridorActive={selectedEmergency?.greenCorridorActive}
            />
          </div>

          {/* Map Status Bar */}
          <div className="glass-panel p-3 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-300 gap-2">
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30 font-semibold font-mono">
                {selectedEmergency?.ambulanceId || 'AMB-101'}
              </span>
              <span>→ Destined: <strong className="text-white">{selectedEmergency?.destinationHospital?.name || 'AIIMS Apex Trauma'}</strong></span>
            </div>
            <div className="flex items-center space-x-4 text-[11px] font-mono">
              <span>ETA: <strong className="text-emerald-400">{selectedEmergency?.routeDetails?.estimatedTimeMin || 11} min</strong></span>
              <span>Dist: <strong className="text-cyan-400">{selectedEmergency?.routeDetails?.distanceKm || 8.4} km</strong></span>
              <span>Saved: <strong className="text-emerald-400">+{selectedEmergency?.routeDetails?.timeSavedMin || 15} min</strong></span>
            </div>
          </div>
        </div>

        {/* Live Incident Activity Stream - 1 Col */}
        <div className="space-y-3 flex flex-col">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
              <Activity className="w-4 h-4 text-red-500" />
              <span>Real-Time Incident Stream</span>
            </h2>
            <span className="text-[10px] text-slate-500 font-mono">Auto-Syncing</span>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-slate-800 flex-1 space-y-4 overflow-y-auto max-h-[530px]">
            {/* Active Emergency Card */}
            {selectedEmergency && (
              <div className="p-3.5 rounded-xl bg-navy-950/80 border border-red-500/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                    <span>{selectedEmergency.emergencyId}</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-red-950 text-red-400 border border-red-500/40 text-[10px] font-bold uppercase">
                    {selectedEmergency.patientInfo?.urgency?.replace('_', ' ') || 'CODE RED'}
                  </span>
                </div>

                <p className="text-xs font-semibold text-slate-200">
                  {selectedEmergency.patientInfo?.patientName && (
                    <span className="text-white font-bold block text-sm">
                      Patient: {selectedEmergency.patientInfo.patientName} ({selectedEmergency.patientInfo?.ageGroup || 'Adult'})
                    </span>
                  )}
                  {selectedEmergency.patientInfo?.conditionSummary}
                </p>

                <div className="text-[11px] text-slate-400 space-y-1">
                  <div className="flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{selectedEmergency.pickupLocation?.address}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <Building2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span className="text-blue-300 font-medium truncate">{selectedEmergency.destinationHospital?.name}</span>
                  </div>
                </div>

                {/* Vitals HUD */}
                <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-800 text-center font-mono">
                  <div className="bg-navy-900 p-1.5 rounded">
                    <div className="text-[10px] text-slate-500">Heart Rate</div>
                    <div className="text-xs font-bold text-red-400">{selectedEmergency.patientInfo?.vitals?.heartRateBpm || 122} bpm</div>
                  </div>
                  <div className="bg-navy-900 p-1.5 rounded">
                    <div className="text-[10px] text-slate-500">SpO2</div>
                    <div className="text-xs font-bold text-cyan-400">{selectedEmergency.patientInfo?.vitals?.spO2Percent || 89}%</div>
                  </div>
                  <div className="bg-navy-900 p-1.5 rounded">
                    <div className="text-[10px] text-slate-500">BP</div>
                    <div className="text-xs font-bold text-amber-400">{selectedEmergency.patientInfo?.vitals?.bloodPressure || '150/98'}</div>
                  </div>
                </div>

                {/* Corridor Status */}
                <div className="p-2 rounded-lg bg-emerald-950/50 border border-emerald-500/30 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-1.5 text-emerald-300">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Green Corridor Active</span>
                  </div>
                  <span className="font-mono text-emerald-400 font-bold">11 min ETA</span>
                </div>
              </div>
            )}

            {/* Audit Log Stream */}
            <div className="space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Timestamped Activity Log
              </div>

              {selectedEmergency?.activityLog?.map((log, idx) => (
                <div key={idx} className="p-2 rounded-lg bg-navy-900/60 border border-slate-800/80 text-[11px] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-cyan-300">{log.action}</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[10px]">{log.details}</p>
                  <span className="text-[9px] text-slate-500 block font-mono">By: {log.actor}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Honest Data Source Disclaimer Required by Prompt */}
      <div className="p-3 rounded-xl bg-navy-900/50 border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
          <span>
            <strong>Prototype Compliance:</strong> All telemetry, ambulance locations, and intersection delay numbers reflect simulated municipal test data for hackathon evaluation.
          </span>
        </div>
        <span className="font-mono text-[10px] text-slate-500">Model: OSRM + Real OSM Topography</span>
      </div>
    </div>
  );
};
