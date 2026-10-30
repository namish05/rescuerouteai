import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { LeafletMap } from '../components/LeafletMap';
import { soundEffects } from '../services/soundEffects';
import { 
  ShieldAlert, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  Radio, 
  Sparkles, 
  Clock, 
  MapPin, 
  Building2, 
  Check, 
  RefreshCw,
  Siren,
  SlidersHorizontal,
  Flame,
  User,
  Shield,
  Send,
  XCircle,
  AlertOctagon,
  RotateCcw
} from 'lucide-react';

export const TrafficControlPanel = () => {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [emergencies, setEmergencies] = useState([]);
  const [selectedEmergency, setSelectedEmergency] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successToast, setSuccessToast] = useState('');

  // -------------------------------------------------------------
  // USER-INPUT POLICE DESK CONFIGURATION
  // -------------------------------------------------------------
  const [officerName, setOfficerName] = useState(user?.name || 'Inspector Rajesh Verma');
  const [badgeId, setBadgeId] = useState('TP-HQ-089');
  const [controlDesk, setControlDesk] = useState('Central Traffic Police Command Bureau');
  const [overrideDuration, setOverrideDuration] = useState(120);
  const [trafficNotes, setTrafficNotes] = useState('Corridor cleared. Cross-traffic held at Janpath & Tolstoy intersections.');

  // Road Obstruction Modal State
  const [showObstructionModal, setShowObstructionModal] = useState(false);
  const [obstructionLandmark, setObstructionLandmark] = useState('Prithviraj Road Crossing');
  const [obstructionType, setObstructionType] = useState('Severe Road Gridlock / Heavy Flow');
  const [obstructionDetour, setObstructionDetour] = useState('Reroute via Akbar Road bypass to Safdarjung');

  const fetchTrafficData = async () => {
    try {
      const [emgRes, hospRes] = await Promise.all([
        api.getEmergencies(),
        api.getHospitals()
      ]);

      if (emgRes.success && emgRes.emergencies) {
        setEmergencies(emgRes.emergencies);
        if (emgRes.emergencies.length > 0) {
          const current = selectedEmergency 
            ? emgRes.emergencies.find(e => e.emergencyId === selectedEmergency.emergencyId) || emgRes.emergencies[0]
            : emgRes.emergencies[0];
          setSelectedEmergency(current);
        }
      }
      if (hospRes.success && hospRes.hospitals) {
        setHospitals(hospRes.hospitals);
      }
    } catch (err) {
      console.warn('Traffic panel fetch error:', err);
    }
  };

  useEffect(() => {
    fetchTrafficData();
  }, []);

  // Socket listener for new emergency or SOS
  useEffect(() => {
    if (!socket) return;

    const handleNewEmergency = (data) => {
      soundEffects.playSiren(3000);
      setEmergencies(prev => [data, ...prev]);
      setSelectedEmergency(data);
    };

    const handleCorridorRequest = (data) => {
      soundEffects.playRadioBeep();
      setSelectedEmergency(prev => {
        if (prev && prev.emergencyId === data.emergencyId) {
          return { ...prev, greenCorridorActive: true };
        }
        return prev;
      });
    };

    const handleIntersectionChange = (data) => {
      setSelectedEmergency(prev => {
        if (!prev) return prev;
        const updated = prev.routeDetails?.intersections?.map(i => {
          if (i.id === data.intersectionId) {
            return { ...i, status: data.status, clearedBy: data.clearedBy };
          }
          return i;
        });
        return {
          ...prev,
          routeDetails: { ...prev.routeDetails, intersections: updated }
        };
      });
    };

    socket.on('new_emergency_created', handleNewEmergency);
    socket.on('green_corridor_activated', handleCorridorRequest);
    socket.on('intersection_updated', handleIntersectionChange);

    return () => {
      socket.off('new_emergency_created', handleNewEmergency);
      socket.off('green_corridor_activated', handleCorridorRequest);
      socket.off('intersection_updated', handleIntersectionChange);
    };
  }, [socket]);

  // Acknowledge priority clearance and clear all signals with custom inputs
  const handleAcknowledgeClearance = async () => {
    if (!selectedEmergency) return;
    setIsProcessing(true);
    try {
      const res = await api.acknowledgeTrafficClearance(
        selectedEmergency.emergencyId, 
        `${officerName} (${badgeId})`, 
        controlDesk, 
        overrideDuration, 
        trafficNotes
      );
      if (res.success && res.emergency) {
        setSelectedEmergency(res.emergency);
        soundEffects.playSuccessChime();

        // Also turn each intersection signal green
        if (res.emergency.routeDetails?.intersections) {
          for (const item of res.emergency.routeDetails.intersections) {
            await api.clearIntersectionSignal(selectedEmergency.emergencyId, item.id, 'cleared_green');
          }
        }
        setSuccessToast(`Green Wave Authorized by ${officerName} for ${overrideDuration} seconds!`);
        setTimeout(() => setSuccessToast(''), 4000);
      }
    } catch (e) {
      console.warn('Clearance error:', e);
    } finally {
      setIsProcessing(false);
      fetchTrafficData();
    }
  };

  // Turn all signals RED (Restore Normal Cycle)
  const handleResetAllSignals = async () => {
    if (!selectedEmergency) return;
    try {
      if (selectedEmergency.routeDetails?.intersections) {
        for (const item of selectedEmergency.routeDetails.intersections) {
          await api.clearIntersectionSignal(selectedEmergency.emergencyId, item.id, 'normal_red');
        }
      }
      soundEffects.playRadioBeep();
      fetchTrafficData();
      setSuccessToast('All signals reset to standard red cycle.');
      setTimeout(() => setSuccessToast(''), 3000);
    } catch (e) {
      console.warn('Reset error:', e);
    }
  };

  // Toggle individual intersection status
  const handleSetIntersectionStatus = async (intersectionId, newStatus) => {
    if (!selectedEmergency) return;
    try {
      const res = await api.clearIntersectionSignal(selectedEmergency.emergencyId, intersectionId, newStatus);
      if (res.success && res.emergency) {
        setSelectedEmergency(res.emergency);
        if (newStatus === 'cleared_green') soundEffects.playRadioBeep();
      }
    } catch (e) {
      console.warn('Intersection status change error:', e);
    }
  };

  // Submit Road Hazard / Obstruction Report
  const handleSubmitObstruction = (e) => {
    e.preventDefault();
    soundEffects.playRadioBeep();
    setSuccessToast(`Obstruction logged at ${obstructionLandmark}. Detour broadcast active!`);
    setShowObstructionModal(false);
    setTimeout(() => setSuccessToast(''), 4000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Police Desk Header */}
      <div className="glass-panel p-4 rounded-2xl border border-blue-500/30 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500 flex items-center justify-center text-blue-400">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-display font-extrabold text-white">
                Central Traffic Police Corridor Control
              </h1>
              <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-500/40 text-[10px] font-mono font-bold">
                CORRIDOR DESK
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Officer On-Duty: <strong className="text-slate-200">{officerName}</strong> ({badgeId}) | Sector: <span className="text-cyan-300">{controlDesk}</span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowObstructionModal(true)}
            className="px-3 py-1.5 rounded-lg bg-amber-950/80 border border-amber-500/40 text-amber-300 hover:bg-amber-900/60 font-semibold text-xs flex items-center space-x-1.5 transition"
          >
            <AlertOctagon className="w-3.5 h-3.5 text-amber-400" />
            <span>Report Road Obstruction</span>
          </button>

          <button
            onClick={() => soundEffects.playSiren(3000)}
            className="px-3 py-1.5 rounded-lg bg-red-950/70 border border-red-500/40 text-red-300 hover:bg-red-900/60 font-semibold text-xs flex items-center space-x-1.5 transition"
          >
            <Siren className="w-3.5 h-3.5 animate-pulse text-red-400" />
            <span>Siren Audio</span>
          </button>

          <button
            onClick={fetchTrafficData}
            className="p-2 rounded-lg bg-navy-800 hover:bg-navy-700 text-slate-300 border border-slate-700 transition"
            title="Refresh Traffic Grid"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {successToast && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-semibold flex items-center space-x-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Main Grid: Priority Emergency Requests + Tactical Control Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Priority Requests Queue & Officer Input Form (4 Cols) */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* USER INPUT: Officer On-Duty Configuration Card */}
          <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800">
              <span className="text-xs font-bold text-cyan-300 flex items-center space-x-1.5">
                <Shield className="w-3.5 h-3.5 text-cyan-400" />
                <span>Traffic Police Officer Inputs</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Custom Input</span>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <label className="text-[10px] text-slate-400">Officer Name</label>
                <input
                  type="text"
                  value={officerName}
                  onChange={(e) => setOfficerName(e.target.value)}
                  placeholder="e.g. Inspector Rajesh Verma"
                  className="w-full bg-navy-950 border border-slate-700 rounded p-1.5 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400">Badge ID</label>
                  <input
                    type="text"
                    value={badgeId}
                    onChange={(e) => setBadgeId(e.target.value)}
                    placeholder="e.g. TP-HQ-089"
                    className="w-full bg-navy-950 border border-slate-700 rounded p-1.5 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400">Override Duration</label>
                  <select
                    value={overrideDuration}
                    onChange={(e) => setOverrideDuration(Number(e.target.value))}
                    className="w-full bg-navy-950 border border-slate-700 rounded p-1.5 text-xs text-white"
                  >
                    <option value={60}>60 Seconds</option>
                    <option value={90}>90 Seconds</option>
                    <option value={120}>120 Seconds (2 min)</option>
                    <option value={180}>180 Seconds (3 min)</option>
                    <option value={300}>300 Seconds (5 min)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400">Control Room Name</label>
                <input
                  type="text"
                  value={controlDesk}
                  onChange={(e) => setControlDesk(e.target.value)}
                  placeholder="e.g. Central Command Bureau"
                  className="w-full bg-navy-950 border border-slate-700 rounded p-1.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400">Police Radio Advisory Note</label>
                <textarea
                  rows="2"
                  value={trafficNotes}
                  onChange={(e) => setTrafficNotes(e.target.value)}
                  placeholder="Notes for corridor units..."
                  className="w-full bg-navy-950 border border-slate-700 rounded p-1.5 text-xs text-slate-200"
                ></textarea>
              </div>
            </div>
          </div>

          {/* Priority Clearance Queue List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
                <Activity className="w-4 h-4 text-red-500" />
                <span>Incoming Emergency Queue</span>
              </h2>
              <span className="text-xs text-slate-500 font-mono">{emergencies.length} active</span>
            </div>

            <div className="space-y-2.5 max-h-[420px] overflow-y-auto">
              {emergencies.map((emg) => {
                const isSelected = selectedEmergency?.emergencyId === emg.emergencyId;
                const isCritical = emg.patientInfo?.urgency === 'critical_red';
                return (
                  <div
                    key={emg.emergencyId}
                    onClick={() => setSelectedEmergency(emg)}
                    className={`p-3 rounded-xl cursor-pointer border transition ${
                      isSelected
                        ? 'bg-navy-900/90 border-blue-500 shadow-xl shadow-blue-500/10'
                        : 'bg-navy-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-mono font-bold text-white flex items-center space-x-1.5">
                        <span className={`w-2 h-2 rounded-full ${isCritical ? 'bg-red-500 animate-ping' : 'bg-amber-400'}`}></span>
                        <span>{emg.emergencyId}</span>
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                        isCritical ? 'bg-red-950 text-red-400 border border-red-500/40' : 'bg-amber-950 text-amber-400 border border-amber-500/40'
                      }`}>
                        {emg.patientInfo?.urgency?.replace('_', ' ') || 'CODE RED'}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-slate-200 mb-1">
                      {emg.patientInfo?.patientName ? `${emg.patientInfo.patientName}: ` : ''}{emg.patientInfo?.conditionSummary}
                    </p>

                    <div className="text-[11px] text-slate-400 space-y-0.5 mb-2">
                      <div className="flex items-center space-x-1.5 truncate">
                        <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                        <span className="truncate">{emg.pickupLocation?.address}</span>
                      </div>
                      <div className="flex items-center space-x-1.5 truncate">
                        <Building2 className="w-3 h-3 text-blue-400 shrink-0" />
                        <span className="text-blue-300 font-medium truncate">{emg.destinationHospital?.name}</span>
                      </div>
                    </div>

                    {/* Status & Clearance Pill */}
                    <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/80 text-[10px]">
                      <span className="text-slate-400">
                        Ambulance: <strong className="text-slate-200">{emg.ambulanceId}</strong>
                      </span>
                      <span className={`font-semibold ${
                        emg.greenCorridorActive ? 'text-emerald-400' : 'text-amber-400'
                      }`}>
                        {emg.greenCorridorActive ? '🟢 Cleared Wave' : '🟡 Clearance Pending'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: Tactical Clearance Deck & Signal Controls (8 Cols) */}
        <div className="lg:col-span-8 space-y-5">
          {selectedEmergency ? (
            <>
              {/* Emergency Header Bar & Clearance Master Trigger */}
              <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-white">
                      Approaching: {selectedEmergency.ambulanceId}
                    </span>
                    <span className="text-xs text-slate-400">|</span>
                    <span className="text-xs text-cyan-400 font-mono font-semibold">
                      ETA: {selectedEmergency.routeDetails?.estimatedTimeMin || 11} min
                    </span>
                    <span className="text-xs text-slate-400">|</span>
                    <span className="text-xs text-emerald-400 font-mono">
                      Distance: {selectedEmergency.routeDetails?.distanceKm || 8.4} km
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Patient: <strong className="text-slate-200">{selectedEmergency.patientInfo?.patientName || 'Emergency Patient'}</strong> destined for <strong className="text-cyan-300">{selectedEmergency.destinationHospital?.name}</strong>
                  </p>
                </div>

                {/* Master Acknowledge & Reset Buttons */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleAcknowledgeClearance}
                    disabled={isProcessing}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold text-xs uppercase tracking-wider shadow-xl shadow-emerald-600/30 transition flex items-center space-x-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isProcessing ? 'SYNCHRONIZING...' : 'AUTHORIZE GREEN WAVE'}</span>
                  </button>

                  <button
                    onClick={handleResetAllSignals}
                    className="px-3 py-2.5 rounded-xl bg-navy-800 hover:bg-navy-700 text-slate-300 border border-slate-700 text-xs font-semibold transition"
                    title="Reset all signals to normal red cycles"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Tactical Leaflet Map */}
              <div className="h-[380px]">
                <LeafletMap
                  center={[28.6000, 77.2150]}
                  zoom={13}
                  ambulancePos={selectedEmergency.routeDetails?.routeCoordinates ? selectedEmergency.routeDetails.routeCoordinates[0] : [28.6315, 77.2167]}
                  routeCoordinates={selectedEmergency.routeDetails?.routeCoordinates || []}
                  intersections={selectedEmergency.routeDetails?.intersections || []}
                  hospitals={hospitals}
                  isGreenCorridorActive={selectedEmergency.greenCorridorActive}
                  onIntersectionClick={(item) => handleSetIntersectionStatus(item.id, item.status === 'cleared_green' ? 'normal_red' : 'cleared_green')}
                />
              </div>

              {/* Individual Intersection Signal Control Deck with Direct User Buttons */}
              <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <h3 className="text-xs font-bold text-slate-200 flex items-center space-x-1.5">
                    <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
                    <span>Interactive Intersection Signal Matrix (Manual Override Controls)</span>
                  </h3>
                  <span className="text-[10px] text-slate-400 font-mono">5 Arterial Nodes</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {selectedEmergency.routeDetails?.intersections?.map((item) => {
                    const isGreen = item.status === 'cleared_green';
                    const isPending = item.status === 'pending_clearance';

                    return (
                      <div
                        key={item.id}
                        className={`p-3 rounded-xl border transition flex flex-col justify-between ${
                          isGreen
                            ? 'bg-emerald-950/60 border-emerald-500/60'
                            : isPending
                            ? 'bg-amber-950/60 border-amber-500/50'
                            : 'bg-navy-950/70 border-red-500/40'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-mono text-xs font-bold text-white">{item.id}</span>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                              isGreen ? 'bg-emerald-900 text-emerald-300' : isPending ? 'bg-amber-900 text-amber-300' : 'bg-red-900 text-red-300'
                            }`}>
                              {isGreen ? '🟢 Green Wave' : isPending ? '🟡 Pending' : '🔴 Red Light'}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-slate-200 leading-tight mb-2">
                            {item.name}
                          </p>
                          <div className="text-[10px] text-slate-400 mb-2 font-mono">
                            By: {item.clearedBy || 'Standard Timer'}
                          </div>
                        </div>

                        {/* Direct User Input Action Buttons for this Signal */}
                        <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-800/80">
                          <button
                            type="button"
                            onClick={() => handleSetIntersectionStatus(item.id, 'cleared_green')}
                            className={`py-1 px-2 rounded text-[10px] font-bold transition flex items-center justify-center space-x-1 ${
                              isGreen
                                ? 'bg-emerald-600 text-white'
                                : 'bg-navy-900 text-emerald-400 hover:bg-emerald-950 border border-emerald-500/30'
                            }`}
                          >
                            <span>🟢 Set Green</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSetIntersectionStatus(item.id, 'normal_red')}
                            className={`py-1 px-2 rounded text-[10px] font-bold transition flex items-center justify-center space-x-1 ${
                              !isGreen && !isPending
                                ? 'bg-red-600 text-white'
                                : 'bg-navy-900 text-red-400 hover:bg-red-950 border border-red-500/30'
                            }`}
                          >
                            <span>🔴 Set Red</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="glass-panel p-12 text-center text-slate-400">
              Select an emergency incident to manage traffic signal corridor.
            </div>
          )}
        </div>
      </div>

      {/* Road Obstruction Modal */}
      {showObstructionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md bg-navy-900 border border-amber-500/40 rounded-2xl p-6 text-slate-100 shadow-2xl">
            <h3 className="text-base font-bold text-amber-400 mb-2 flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <span>Report Road Obstruction & Detour</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Enter roadblock or traffic impediment details. The system recalculates ambulance routes accordingly.
            </p>

            <form onSubmit={handleSubmitObstruction} className="space-y-3.5">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Landmark / Arterial Location</label>
                <input
                  type="text"
                  value={obstructionLandmark}
                  onChange={(e) => setObstructionLandmark(e.target.value)}
                  className="w-full bg-navy-950 border border-slate-700 rounded p-2 text-xs text-white"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Obstruction Type</label>
                <select
                  value={obstructionType}
                  onChange={(e) => setObstructionType(e.target.value)}
                  className="w-full bg-navy-950 border border-slate-700 rounded p-2 text-xs text-white"
                >
                  <option value="Severe Road Gridlock / Heavy Flow">Severe Road Gridlock / Heavy Flow</option>
                  <option value="Traffic Accident Blocking Lanes">Traffic Accident Blocking Lanes</option>
                  <option value="Waterlogging / Flooded Underpass">Waterlogging / Flooded Underpass</option>
                  <option value="VIP Motorcade / Convoy Movement">VIP Motorcade / Convoy Movement</option>
                  <option value="Emergency Road Repair Construction">Emergency Road Repair Construction</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Recommended Detour Advice</label>
                <textarea
                  rows="2"
                  value={obstructionDetour}
                  onChange={(e) => setObstructionDetour(e.target.value)}
                  className="w-full bg-navy-950 border border-slate-700 rounded p-2 text-xs text-white"
                  required
                ></textarea>
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowObstructionModal(false)}
                  className="flex-1 py-2 bg-navy-800 text-slate-300 rounded-xl text-xs font-semibold hover:bg-navy-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Broadcast Alert</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrafficControlPanel;