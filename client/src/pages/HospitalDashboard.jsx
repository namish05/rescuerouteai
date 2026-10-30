import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { soundEffects } from '../services/soundEffects';
import { 
  Building2, 
  Activity, 
  Clock, 
  Bed, 
  UserCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Heart, 
  RefreshCw, 
  Sparkles, 
  Ambulance, 
  ShieldCheck, 
  Stethoscope,
  Plus,
  Minus,
  CheckSquare,
  FileText,
  User,
  HeartPulse
} from 'lucide-react';

export const HospitalDashboard = () => {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [hospitals, setHospitals] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [emergencies, setEmergencies] = useState([]);
  const [activeEmergency, setActiveEmergency] = useState(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [readinessConfirmed, setReadinessConfirmed] = useState(false);
  const [successToast, setSuccessToast] = useState('');

  // -------------------------------------------------------------
  // USER-INPUT DOCTOR & ER CONFIGURATION
  // -------------------------------------------------------------
  const [leadDoctor, setLeadDoctor] = useState(user?.name || 'Dr. Priya Sharma');
  const [department, setDepartment] = useState('Emergency Medicine & Critical Care');
  const [assignedBay, setAssignedBay] = useState('Resuscitation Trauma Bay #1');
  const [doctorNotes, setDoctorNotes] = useState('Defibrillator, IV line access, and shock team stationed at Bay #1. Cath-lab alerted.');
  
  // Checklist State
  const [checklist, setChecklist] = useState({
    bayPrepped: true,
    ventilatorReady: true,
    bloodBankAlerted: true,
    cathLabStandby: false,
    specialistOnCall: true
  });

  // Capacity states (editable by user)
  const [traumaBeds, setTraumaBeds] = useState(4);
  const [icuBeds, setIcuBeds] = useState(6);
  const [doctorsOnDuty, setDoctorsOnDuty] = useState(8);

  const fetchData = async () => {
    try {
      const [hospRes, emgRes] = await Promise.all([
        api.getHospitals(),
        api.getEmergencies()
      ]);

      if (hospRes.success && hospRes.hospitals) {
        setHospitals(hospRes.hospitals);
        const aiims = hospRes.hospitals.find(h => h.name.includes('AIIMS')) || hospRes.hospitals[0];
        setSelectedHospital(aiims);
        if (aiims?.capacity) {
          setTraumaBeds(aiims.capacity.traumaBedsAvailable ?? 4);
          setIcuBeds(aiims.capacity.icuBedsAvailable ?? 6);
          setDoctorsOnDuty(aiims.capacity.doctorsOnDuty ?? 8);
        }
      }

      if (emgRes.success && emgRes.emergencies) {
        setEmergencies(emgRes.emergencies);
        const incoming = emgRes.emergencies.find(e => e.status !== 'completed') || emgRes.emergencies[0];
        setActiveEmergency(incoming);
        if (incoming?.hospitalReadiness?.status === 'trauma_bay_ready') {
          setReadinessConfirmed(true);
        }
      }
    } catch (err) {
      console.warn('Hospital dashboard fetch error:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Socket listener for new emergency incoming or vitals updates
  useEffect(() => {
    if (!socket) return;

    const handleIncoming = (data) => {
      soundEffects.playRadioBeep();
      soundEffects.playSiren(2000);
      setActiveEmergency(data);
      setReadinessConfirmed(false);
      setSuccessToast(`🚨 Alert: Ambulance ${data.ambulanceId} inbound with ${data.patientInfo?.urgency || 'emergency'}!`);
      setTimeout(() => setSuccessToast(''), 5000);
    };

    const handleVitalsUpdate = (data) => {
      setActiveEmergency(prev => {
        if (prev && prev.emergencyId === data.emergencyId) {
          soundEffects.playRadioBeep();
          return {
            ...prev,
            patientInfo: {
              ...prev.patientInfo,
              vitals: data.vitals,
              triageNotes: data.triageNotes || prev.patientInfo?.triageNotes
            }
          };
        }
        return prev;
      });
    };

    const handleCompleted = () => {
      fetchData();
    };

    socket.on('hospital_incoming_ambulance', handleIncoming);
    socket.on('vitals_updated', handleVitalsUpdate);
    socket.on('emergency_completed', handleCompleted);

    return () => {
      socket.off('hospital_incoming_ambulance', handleIncoming);
      socket.off('vitals_updated', handleVitalsUpdate);
      socket.off('emergency_completed', handleCompleted);
    };
  }, [socket]);

  // Confirm Bay Readiness with user-entered Doctor inputs
  const handleConfirmReadiness = async () => {
    if (!activeEmergency) return;
    setIsConfirming(true);
    try {
      const res = await api.acknowledgeHospitalReady(activeEmergency.emergencyId, {
        bayAssigned,
        leadDoctor,
        department,
        checklist: Object.keys(checklist).filter(k => checklist[k]),
        doctorNotes,
        status: 'trauma_bay_ready'
      });
      if (res.success && res.emergency) {
        setActiveEmergency(res.emergency);
        setReadinessConfirmed(true);
        soundEffects.playSuccessChime();
        setSuccessToast(`Shock Bay Confirmed! ${leadDoctor} assigned to ${bayAssigned}.`);
        setTimeout(() => setSuccessToast(''), 4000);
      }
    } catch (err) {
      console.warn('Confirm error:', err);
    } finally {
      setIsConfirming(false);
    }
  };

  // Update Hospital Capacity
  const handleSaveCapacity = async () => {
    if (!selectedHospital) return;
    try {
      const res = await api.updateHospitalCapacity(selectedHospital._id, {
        capacity: {
          traumaBedsAvailable: Number(traumaBeds),
          icuBedsAvailable: Number(icuBeds),
          doctorsOnDuty: Number(doctorsOnDuty)
        }
      });
      if (res.success) {
        soundEffects.playRadioBeep();
        setSuccessToast('Hospital bed capacity updated live across network.');
        setTimeout(() => setSuccessToast(''), 3000);
      }
    } catch (err) {
      console.warn('Save capacity error:', err);
    }
  };

  const toggleChecklistItem = (key) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner / Hospital Identity */}
      <div className="glass-panel p-4 rounded-2xl border border-emerald-500/30 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-600/20 border border-emerald-500 flex items-center justify-center text-emerald-400">
            <Building2 className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-display font-extrabold text-white">
                {selectedHospital?.name || 'AIIMS Apex Emergency & Trauma Center'}
              </h1>
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold">
                LEVEL 1 TRAUMA HUB
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Chief ER Physician: <strong className="text-slate-200">{leadDoctor}</strong> ({department}) | Ready for Shock Bay Intake
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchData}
            className="p-2 rounded-lg bg-navy-800 hover:bg-navy-700 text-slate-300 border border-slate-700 transition"
            title="Refresh Inbound Queue"
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

      {/* Grid: Left Column (Inbound Ambulance Radar & Triage) - Right Column (Bay Reservation & Capacity) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Inbound Ambulance Radar & Clinical Telemetry (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          {activeEmergency ? (
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5 relative overflow-hidden">
              {/* Radar Glow Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2.5">
                  <span className="w-3 h-3 rounded-full bg-red-500 animate-ping"></span>
                  <h2 className="text-sm font-bold text-white tracking-wide">
                    Live Inbound Emergency Ambulance Radar
                  </h2>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-red-950 text-red-400 border border-red-500/40 text-xs font-mono font-bold uppercase">
                  {activeEmergency.patientInfo?.urgency?.replace('_', ' ') || 'CRITICAL CODE RED'}
                </span>
              </div>

              {/* Big ETA Countdown Visual */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-navy-900 to-navy-950 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 rounded-2xl bg-red-600/20 border border-red-500 flex items-center justify-center text-red-400">
                    <Ambulance className="w-7 h-7 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block font-mono">Incoming Vehicle</span>
                    <strong className="text-lg font-bold text-white">{activeEmergency.ambulanceId}</strong>
                    <span className="text-[11px] text-slate-400 block">
                      Paramedic: <strong className="text-slate-200">{activeEmergency.paramedicName || 'Vikram Sethi'}</strong>
                    </span>
                  </div>
                </div>

                <div className="text-center sm:text-right font-mono">
                  <span className="text-xs text-slate-400 uppercase tracking-wider block font-sans">Estimated Arrival</span>
                  <div className="text-3xl font-extrabold text-emerald-400">
                    {activeEmergency.routeDetails?.estimatedTimeMin || 11} <span className="text-sm text-slate-400 font-sans">min</span>
                  </div>
                  <span className="text-[11px] text-cyan-400">
                    {activeEmergency.greenCorridorActive ? '🟢 Green Corridor Synchronized' : '🟡 Awaiting Police Clearance'}
                  </span>
                </div>
              </div>

              {/* Clinical Triage Briefing & Live Vitals */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                    <HeartPulse className="w-3.5 h-3.5 text-red-400" />
                    <span>Real-Time Patient Telemetry & Vitals</span>
                  </h3>
                  <span className="text-[10px] text-cyan-400 font-mono">Streamed from Ambulance</span>
                </div>

                <div className="p-4 rounded-xl bg-navy-950/80 border border-slate-800 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase">Patient Identity</span>
                      <p className="text-sm font-bold text-white">
                        {activeEmergency.patientInfo?.patientName || 'Rahul Verma'} ({activeEmergency.patientInfo?.gender || 'Male'}, {activeEmergency.patientInfo?.ageGroup || '52 yrs'})
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase">Blood Group</span>
                      <span className="px-2 py-0.5 rounded bg-red-950 text-red-300 font-mono text-xs font-bold border border-red-500/30">
                        {activeEmergency.patientInfo?.bloodGroup || 'O+'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Reported Medical Condition</span>
                    <p className="text-sm font-bold text-red-400">
                      {activeEmergency.patientInfo?.conditionSummary}
                    </p>
                  </div>

                  {/* Vitals Grid with 6 Metrics */}
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-2 border-t border-slate-800 text-center font-mono text-xs">
                    <div className="bg-navy-900 p-2 rounded-lg border border-slate-800">
                      <span className="text-[9px] text-slate-400 block font-sans">Heart Rate</span>
                      <strong className="text-red-400 text-sm">{activeEmergency.patientInfo?.vitals?.heartRateBpm || 122}</strong>
                      <span className="text-[9px] text-slate-500 block">bpm</span>
                    </div>

                    <div className="bg-navy-900 p-2 rounded-lg border border-slate-800">
                      <span className="text-[9px] text-slate-400 block font-sans">SpO2</span>
                      <strong className="text-cyan-400 text-sm">{activeEmergency.patientInfo?.vitals?.spO2Percent || 89}%</strong>
                      <span className="text-[9px] text-slate-500 block">oxygen</span>
                    </div>

                    <div className="bg-navy-900 p-2 rounded-lg border border-slate-800">
                      <span className="text-[9px] text-slate-400 block font-sans">Blood Press</span>
                      <strong className="text-amber-400 text-xs sm:text-sm">{activeEmergency.patientInfo?.vitals?.bloodPressure || '150/98'}</strong>
                      <span className="text-[9px] text-slate-500 block">mmHg</span>
                    </div>

                    <div className="bg-navy-900 p-2 rounded-lg border border-slate-800">
                      <span className="text-[9px] text-slate-400 block font-sans">Temp</span>
                      <strong className="text-slate-300 text-sm">{activeEmergency.patientInfo?.vitals?.temperatureC || 37.1}°C</strong>
                      <span className="text-[9px] text-slate-500 block">Celsius</span>
                    </div>

                    <div className="bg-navy-900 p-2 rounded-lg border border-slate-800">
                      <span className="text-[9px] text-slate-400 block font-sans">Resp Rate</span>
                      <strong className="text-purple-400 text-sm">{activeEmergency.patientInfo?.vitals?.respiratoryRate || 24}</strong>
                      <span className="text-[9px] text-slate-500 block">/min</span>
                    </div>

                    <div className="bg-navy-900 p-2 rounded-lg border border-slate-800">
                      <span className="text-[9px] text-slate-400 block font-sans">Sugar</span>
                      <strong className="text-yellow-400 text-sm">{activeEmergency.patientInfo?.vitals?.bloodSugarMgDl || 135}</strong>
                      <span className="text-[9px] text-slate-500 block">mg/dL</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-navy-900 text-xs text-slate-300 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-red-400 block">Paramedic Field Notes:</span>
                    <p>{activeEmergency.patientInfo?.triageNotes || 'Priority route requested. Cath-lab recommended on arrival.'}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-panel p-12 text-center text-slate-400">
              No inbound ambulances currently headed to this hospital.
            </div>
          )}
        </div>

        {/* Right Side: Trauma Bay Readiness & Doctor Inputs (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* USER INPUT: Bay Reservation & Attending Physician Form */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h2 className="text-sm font-bold text-white flex items-center space-x-2">
                <Stethoscope className="w-4 h-4 text-emerald-400" />
                <span>Trauma Bay Readiness (Doctor Input)</span>
              </h2>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                readinessConfirmed ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40' : 'bg-amber-950 text-amber-400 border border-amber-500/40'
              }`}>
                {readinessConfirmed ? 'Bay Reserved & Standing By' : 'Action Required'}
              </span>
            </div>

            <div className="space-y-3">
              {/* Doctor Name */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-300 mb-1">
                  Attending Lead Doctor Name
                </label>
                <input
                  type="text"
                  value={leadDoctor}
                  onChange={(e) => setLeadDoctor(e.target.value)}
                  placeholder="e.g. Dr. Priya Sharma"
                  className="w-full bg-navy-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Department */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-300 mb-1">
                  Clinical Department / Specialty
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Interventional Cardiology / Trauma"
                  className="w-full bg-navy-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Assign Shock Bay */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-300 mb-1">
                  Assigned Emergency Shock Bay / Room
                </label>
                <select
                  value={assignedBay}
                  onChange={(e) => setAssignedBay(e.target.value)}
                  className="w-full bg-navy-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="Resuscitation Trauma Bay #1">Resuscitation Trauma Bay #1 (Defib + Ventilator)</option>
                  <option value="Cardiac Cath-Lab Suite #2">Cardiac Cath-Lab Suite #2 (Interventional)</option>
                  <option value="Neurotrauma ER Shock Room #3">Neurotrauma ER Shock Room #3</option>
                  <option value="Pediatric Critical Care Bay #4">Pediatric Critical Care Bay #4</option>
                  <option value="Emergency OT Suite #1">Emergency OT Suite #1 (General Surgery)</option>
                </select>
              </div>

              {/* Clinical Prep Checklist */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-semibold text-slate-400 block uppercase">
                  Shock Room Preparation Checklist
                </span>
                {[
                  { key: 'bayPrepped', label: 'Resuscitation bay sanitized & cleared' },
                  { key: 'ventilatorReady', label: 'Mechanical ventilator pre-calibrated' },
                  { key: 'bloodBankAlerted', label: 'Blood bank cross-matched 2 units O-neg' },
                  { key: 'cathLabStandby', label: 'Cath-lab / CT Scanner kept on priority hold' },
                  { key: 'specialistOnCall', label: 'On-call senior surgical specialist notified' }
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => toggleChecklistItem(item.key)}
                    className="w-full flex items-center space-x-2 text-left text-xs text-slate-300 py-1 px-2 rounded bg-navy-950 hover:bg-navy-900 border border-slate-800 transition"
                  >
                    <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center text-[10px] ${
                      checklist[item.key] ? 'bg-emerald-600 border-emerald-500 text-white font-bold' : 'border-slate-700'
                    }`}>
                      {checklist[item.key] ? '✓' : ''}
                    </span>
                    <span className="text-[11px]">{item.label}</span>
                  </button>
                ))}
              </div>

              {/* Doctor Clinical Notes */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-300 mb-1">
                  Doctor Reception Notes to Paramedic
                </label>
                <textarea
                  rows="2"
                  value={doctorNotes}
                  onChange={(e) => setDoctorNotes(e.target.value)}
                  placeholder="Notes for incoming crew..."
                  className="w-full bg-navy-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200"
                ></textarea>
              </div>

              {/* Confirmation Action Button */}
              <button
                onClick={handleConfirmReadiness}
                disabled={isConfirming || readinessConfirmed}
                className={`w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition flex items-center justify-center space-x-2 ${
                  readinessConfirmed
                    ? 'bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 cursor-default'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {readinessConfirmed
                    ? 'BAY RESERVED & TRAUMA TEAM WAITING'
                    : isConfirming
                    ? 'TRANSMITTING CONFIRMATION...'
                    : 'CONFIRM ER SHOCK BAY TO AMBULANCE'}
                </span>
              </button>
            </div>
          </div>

          {/* Hospital Bed Capacity Monitor with Instant +/- Increments */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h2 className="text-sm font-bold text-white flex items-center space-x-2">
                <Bed className="w-4 h-4 text-cyan-400" />
                <span>Live Hospital Bed Capacity Controls</span>
              </h2>
              <button
                onClick={handleSaveCapacity}
                className="text-[10px] px-2.5 py-1 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-900 transition font-semibold"
              >
                Save Live Counts
              </button>
            </div>

            <div className="space-y-2.5 font-mono">
              {/* Trauma Beds */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-navy-950/70 border border-slate-800">
                <span className="text-xs text-slate-300 font-sans">Trauma Beds Free</span>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setTraumaBeds(prev => Math.max(0, prev - 1))}
                    className="w-6 h-6 rounded bg-navy-900 hover:bg-navy-800 text-slate-300 flex items-center justify-center font-bold"
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-bold text-emerald-400 text-sm">{traumaBeds}</span>
                  <button
                    type="button"
                    onClick={() => setTraumaBeds(prev => prev + 1)}
                    className="w-6 h-6 rounded bg-navy-900 hover:bg-navy-800 text-slate-300 flex items-center justify-center font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* ICU Beds */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-navy-950/70 border border-slate-800">
                <span className="text-xs text-slate-300 font-sans">ICU Beds Free</span>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setIcuBeds(prev => Math.max(0, prev - 1))}
                    className="w-6 h-6 rounded bg-navy-900 hover:bg-navy-800 text-slate-300 flex items-center justify-center font-bold"
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-bold text-cyan-400 text-sm">{icuBeds}</span>
                  <button
                    type="button"
                    onClick={() => setIcuBeds(prev => prev + 1)}
                    className="w-6 h-6 rounded bg-navy-900 hover:bg-navy-800 text-slate-300 flex items-center justify-center font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Doctors on Duty */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-navy-950/70 border border-slate-800">
                <span className="text-xs text-slate-300 font-sans">Emergency Doctors on Duty</span>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setDoctorsOnDuty(prev => Math.max(1, prev - 1))}
                    className="w-6 h-6 rounded bg-navy-900 hover:bg-navy-800 text-slate-300 flex items-center justify-center font-bold"
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-bold text-amber-400 text-sm">{doctorsOnDuty}</span>
                  <button
                    type="button"
                    onClick={() => setDoctorsOnDuty(prev => prev + 1)}
                    className="w-6 h-6 rounded bg-navy-900 hover:bg-navy-800 text-slate-300 flex items-center justify-center font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HospitalDashboard;