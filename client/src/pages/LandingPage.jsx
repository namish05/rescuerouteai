import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { soundEffects } from '../services/soundEffects';
import { 
  HeartPulse, 
  Ambulance, 
  ShieldAlert, 
  Building2, 
  Sparkles, 
  Clock, 
  Zap, 
  Radio, 
  ArrowRight, 
  CheckCircle2, 
  Activity, 
  AlertTriangle,
  MapPin,
  Compass,
  Phone,
  User,
  Crosshair,
  Send,
  Siren,
  ChevronRight,
  Info
} from 'lucide-react';

export const LandingPage = () => {
  const { demoLogin } = useAuth();
  const navigate = useNavigate();

  // Citizen SOS Request Form State (Full user input)
  const [callerName, setCallerName] = useState('');
  const [callerPhone, setCallerPhone] = useState('');
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [emergencyType, setEmergencyType] = useState('Critical Cardiac Event / Chest Pain');
  const [urgency, setUrgency] = useState('critical_red');
  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupCoords, setPickupCoords] = useState([28.6315, 77.2167]);
  const [isSubmittingSos, setIsSubmittingSos] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);

  const handleLaunchRole = async (targetRole, path) => {
    await demoLogin(targetRole);
    navigate(path);
  };

  // Browser GPS detection for citizen SOS
  const handleDetectLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = parseFloat(pos.coords.latitude.toFixed(5));
          const lng = parseFloat(pos.coords.longitude.toFixed(5));
          setPickupCoords([lat, lng]);
          setPickupAddress(`Detected GPS Location (${lat}, ${lng})`);
          soundEffects.playSuccessChime();
        },
        () => {
          alert('Could not access device GPS. Please type the incident address manually.');
        }
      );
    }
  };

  // Submit Citizen Emergency Request
  const handleCitizenSosSubmit = async (e) => {
    e.preventDefault();
    if (!pickupAddress) {
      alert('Please enter or detect your incident address.');
      return;
    }
    setIsSubmittingSos(true);
    soundEffects.playSiren(2000);

    const payload = {
      ambulanceId: 'AMB-101',
      paramedicName: 'Rapid Response Unit 1',
      pickupLocation: {
        lat: pickupCoords[0],
        lng: pickupCoords[1],
        address: pickupAddress
      },
      destinationHospital: {
        name: 'AIIMS Apex Trauma Center & Hospital',
        lat: 28.5672,
        lng: 77.2100,
        address: 'Sri Aurobindo Marg, Ansari Nagar East, New Delhi'
      },
      patientInfo: {
        urgency,
        patientName: patientName || 'Emergency Patient',
        callerName,
        callerPhone,
        ageGroup: `${patientAge || 'Adult'}`,
        conditionSummary: emergencyType,
        vitals: {
          heartRateBpm: urgency === 'critical_red' ? 128 : 95,
          bloodPressure: '145/95',
          spO2Percent: urgency === 'critical_red' ? 89 : 96,
          temperatureC: 37.1
        },
        triageNotes: `Citizen SOS booking by ${callerName || 'Caller'} (${callerPhone || 'No phone'}). Immediate ambulance dispatched.`
      },
      estimatedTimeMin: 11,
      baselineTimeMin: 25,
      distanceKm: 8.4
    };

    try {
      const res = await api.createEmergency(payload);
      if (res.success && res.emergency) {
        setBookingResult(res.emergency);
        soundEffects.playSuccessChime();
      }
    } catch (err) {
      console.warn('Citizen SOS error:', err);
    } finally {
      setIsSubmittingSos(false);
    }
  };

  return (
    <div className="relative min-h-screen">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-10 left-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-3xl"></div>
        <div className="absolute top-20 right-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl"></div>
        <div className="absolute top-40 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-emerald-600/10 rounded-full blur-3xl"></div>
      </div>

      {/* Hero Section */}
      <section className="pt-16 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        {/* Urgent Live Beacon */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-navy-900 border border-cyan-500/30 text-xs font-semibold text-cyan-300 mb-6 shadow-lg shadow-cyan-500/10 animate-fade-in">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
          <span>Next-Generation Emergency Response Platform</span>
          <span className="text-slate-500">|</span>
          <span className="text-emerald-400 font-bold">Golden Hour Saver</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-display font-extrabold tracking-tight text-white max-w-5xl mx-auto leading-[1.1] mb-6">
          Every Second <br />
          <span className="bg-gradient-to-r from-red-500 via-rose-400 to-emerald-400 bg-clip-text text-transparent">
            Saves a Life.
          </span>
        </h1>

        {/* Subhead / Problem Statement */}
        <p className="text-base sm:text-xl text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed mb-10">
          In medical emergencies, urban traffic congestion causes catastrophic delays. <strong className="text-white font-semibold">RescueRoute AI</strong> dynamically tracks ambulances, recalculates congestion-free paths, coordinates synchronized green corridors with traffic police, and preps hospital trauma bays in real time.
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
          <Link
            to="/operator"
            className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-600 text-white font-bold text-sm tracking-wide shadow-xl shadow-red-600/30 hover:shadow-red-600/50 hover:scale-[1.02] active:scale-[0.98] transition flex items-center space-x-2"
          >
            <Ambulance className="w-4 h-4" />
            <span>Open Ambulance Dispatch Terminal</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>

          <Link
            to="/dashboard"
            className="px-6 py-3.5 rounded-xl bg-navy-800/90 hover:bg-navy-700/90 border border-slate-700 text-cyan-300 font-semibold text-sm tracking-wide shadow-lg hover:border-cyan-500/50 hover:scale-[1.02] active:scale-[0.98] transition flex items-center space-x-2"
          >
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>Command Center Overview</span>
          </Link>
        </div>

        {/* Hero Interactive Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <div className="glass-panel p-4 rounded-xl border border-slate-800 text-left">
            <div className="flex items-center space-x-2 text-red-400 text-xs font-semibold mb-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Response Time</span>
            </div>
            <div className="text-2xl font-bold font-mono text-white">11.4 <span className="text-xs text-slate-400 font-normal">min avg</span></div>
            <p className="text-[11px] text-emerald-400 mt-1">↓ 53% faster vs normal traffic</p>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-slate-800 text-left">
            <div className="flex items-center space-x-2 text-emerald-400 text-xs font-semibold mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Minutes Saved</span>
            </div>
            <div className="text-2xl font-bold font-mono text-white">14.8 <span className="text-xs text-slate-400 font-normal">min/trip</span></div>
            <p className="text-[11px] text-slate-400 mt-1">Via AI Signal Clearing</p>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-slate-800 text-left">
            <div className="flex items-center space-x-2 text-cyan-400 text-xs font-semibold mb-1">
              <Zap className="w-3.5 h-3.5" />
              <span>Smart Signals</span>
            </div>
            <div className="text-2xl font-bold font-mono text-white">18 <span className="text-xs text-slate-400 font-normal">nodes</span></div>
            <p className="text-[11px] text-slate-400 mt-1">Delhi Central Metro Net</p>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-slate-800 text-left">
            <div className="flex items-center space-x-2 text-purple-400 text-xs font-semibold mb-1">
              <Building2 className="w-3.5 h-3.5" />
              <span>Partner Hospitals</span>
            </div>
            <div className="text-2xl font-bold font-mono text-white">4 <span className="text-xs text-slate-400 font-normal">ER Hubs</span></div>
            <p className="text-[11px] text-slate-400 mt-1">Instant Shock-Bay Ready</p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* CITIZEN EMERGENCY SOS & DISPATCH WIDGET (Direct User Input)    */}
      {/* ------------------------------------------------------------- */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border-2 border-red-600/40 shadow-2xl relative overflow-hidden bg-navy-900/90">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 via-rose-500 to-red-600 animate-pulse"></div>

          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-red-600/20 border border-red-500 flex items-center justify-center text-red-500 shadow-lg shadow-red-600/20">
              <Siren className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-display font-extrabold text-white">
                Citizen Emergency SOS & Ambulance Booking
              </h2>
              <p className="text-xs text-slate-400">
                Need immediate emergency transit? Fill details below to dispatch an ambulance with live green corridor coordination.
              </p>
            </div>
          </div>

          {!bookingResult ? (
            <form onSubmit={handleCitizenSosSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 font-semibold mb-1 block">Caller Full Name</label>
                  <input
                    type="text"
                    value={callerName}
                    onChange={(e) => setCallerName(e.target.value)}
                    placeholder="Your Name (e.g. Ananya Roy)"
                    className="w-full bg-navy-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 font-semibold mb-1 block">Caller Phone Number</label>
                  <input
                    type="tel"
                    value={callerPhone}
                    onChange={(e) => setCallerPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-navy-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 font-semibold mb-1 block">Patient Name (Optional)</label>
                  <input
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="Patient Name"
                    className="w-full bg-navy-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 font-semibold mb-1 block">Patient Age / Demographics</label>
                  <input
                    type="text"
                    value={patientAge}
                    onChange={(e) => setPatientAge(e.target.value)}
                    placeholder="e.g. 54 yrs (Male)"
                    className="w-full bg-navy-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold mb-1 block">Emergency Medical Category</label>
                <select
                  value={emergencyType}
                  onChange={(e) => setEmergencyType(e.target.value)}
                  className="w-full bg-navy-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                >
                  <option value="Critical Cardiac Event / Chest Pain">Critical Cardiac Event / Chest Pain (STEMI)</option>
                  <option value="Severe Road Accident / Heavy Hemorrhage">Severe Road Accident / Heavy Hemorrhage</option>
                  <option value="Acute Stroke / Neurological Distress">Acute Stroke / Neurological Distress</option>
                  <option value="Severe Respiratory Failure / Asthma Attack">Severe Respiratory Failure / Asthma Attack</option>
                  <option value="Complicated Pregnancy Labor Emergency">Complicated Pregnancy Labor Emergency</option>
                  <option value="Severe Burn Injury / Electric Shock">Severe Burn Injury / Electric Shock</option>
                  <option value="Other High-Urgency Medical Crisis">Other High-Urgency Medical Crisis</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-slate-300 font-semibold">Incident Pickup Address & Landmark</label>
                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 font-semibold"
                  >
                    <Crosshair className="w-3 h-3" />
                    <span>Detect My GPS</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  placeholder="Street address, colony, nearby landmark in New Delhi..."
                  className="w-full bg-navy-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                  required
                />
              </div>

              {/* Criticality Radio */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setUrgency('critical_red')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition ${
                    urgency === 'critical_red'
                      ? 'bg-red-600 text-white border-red-500 shadow-lg shadow-red-600/30'
                      : 'bg-navy-950 text-slate-400 border-slate-800'
                  }`}
                >
                  🚨 Code Red (Life Threat)
                </button>
                <button
                  type="button"
                  onClick={() => setUrgency('serious_yellow')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition ${
                    urgency === 'serious_yellow'
                      ? 'bg-amber-600 text-white border-amber-500 shadow-lg shadow-amber-600/30'
                      : 'bg-navy-950 text-slate-400 border-slate-800'
                  }`}
                >
                  ⚠️ Code Yellow (Serious)
                </button>
                <button
                  type="button"
                  onClick={() => setUrgency('moderate_green')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition ${
                    urgency === 'moderate_green'
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-600/30'
                      : 'bg-navy-950 text-slate-400 border-slate-800'
                  }`}
                >
                  🟢 Code Green (Stable)
                </button>
              </div>

              <button
                type="submit"
                disabled={isSubmittingSos}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs uppercase tracking-wider shadow-xl shadow-red-600/40 transition flex items-center justify-center space-x-2 active:scale-[0.99]"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmittingSos ? 'DISPATCHING AMBULANCE...' : 'DISPATCH EMERGENCY AMBULANCE NOW'}</span>
              </button>
            </form>
          ) : (
            /* Emergency Dispatched Ticket */
            <div className="p-6 rounded-2xl bg-navy-950 border border-emerald-500/50 space-y-4 animate-fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span className="font-bold text-sm text-white">Emergency Dispatched Successfully!</span>
                </div>
                <span className="px-2.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-bold">
                  {bookingResult.emergencyId}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-navy-900 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Assigned Vehicle</span>
                  <strong className="text-white text-sm font-mono">{bookingResult.ambulanceId}</strong>
                  <span className="text-emerald-400 block text-[10px]">ALS Equipped</span>
                </div>

                <div className="p-3 rounded-xl bg-navy-900 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Destination Hospital</span>
                  <strong className="text-cyan-300 text-xs block truncate">{bookingResult.destinationHospital?.name}</strong>
                  <span className="text-slate-400 block text-[10px]">Shock Bay Reserved</span>
                </div>

                <div className="p-3 rounded-xl bg-navy-900 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Estimated Arrival</span>
                  <strong className="text-emerald-400 text-sm font-mono">{bookingResult.routeDetails?.estimatedTimeMin || 11} Minutes</strong>
                  <span className="text-slate-400 block text-[10px]">Green Corridor Sync</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2">
                <Link
                  to="/operator"
                  className="flex-1 py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs text-center transition shadow-lg shadow-red-600/30"
                >
                  Open Ambulance Terminal
                </Link>
                <Link
                  to="/traffic-control"
                  className="flex-1 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs text-center transition shadow-lg shadow-blue-600/30"
                >
                  Open Traffic Police Desk
                </Link>
                <Link
                  to="/hospital"
                  className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs text-center transition shadow-lg shadow-emerald-600/30"
                >
                  Open Hospital ER Bay
                </Link>
              </div>

              <button
                type="button"
                onClick={() => setBookingResult(null)}
                className="w-full text-center text-xs text-slate-400 hover:text-white pt-1"
              >
                + Book Another Emergency
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 4 OPERATIONAL TERMINALS ROLE CARDS                             */}
      {/* ------------------------------------------------------------- */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-800/80">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <h2 className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-2">Multi-Actor Ecosystem</h2>
          <p className="text-2xl sm:text-3xl font-display font-bold text-white">
            4 Interactive Mission Control Panels
          </p>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Experience the system from every stakeholder's perspective with real-time synchronized WebSockets.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Ambulance Operator */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 hover:border-red-500/50 transition flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-500 mb-3">
                <Ambulance className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">Ambulance Dispatch Terminal</h3>
              <p className="text-slate-400 text-xs mb-3">
                Full user-input dispatch form: enter patient name, condition, vitals, pickup address, choose hospital, and broadcast live GPS.
              </p>
              <ul className="text-[11px] text-slate-300 space-y-1 mb-4">
                <li className="flex items-center space-x-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /><span>Full Patient & Vitals Inputs</span></li>
                <li className="flex items-center space-x-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /><span>1-Click SOS Panic Broadcast</span></li>
              </ul>
            </div>
            <button
              onClick={() => handleLaunchRole('ambulance', '/operator')}
              className="w-full py-2 rounded-xl bg-red-600/80 hover:bg-red-600 text-white font-semibold text-xs transition flex items-center justify-center space-x-1.5"
            >
              <span>Launch Operator Panel</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Traffic Police */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 hover:border-blue-500/50 transition flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 mb-3">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">Traffic Police Desk</h3>
              <p className="text-slate-400 text-xs mb-3">
                Officer inputs, siren audio, manual signal green/red controls, roadblock reports, and synchronized green wave override.
              </p>
              <ul className="text-[11px] text-slate-300 space-y-1 mb-4">
                <li className="flex items-center space-x-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /><span>Manual Signal Green/Red Toggle</span></li>
                <li className="flex items-center space-x-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /><span>Report Road Obstructions</span></li>
              </ul>
            </div>
            <button
              onClick={() => handleLaunchRole('traffic_police', '/traffic-control')}
              className="w-full py-2 rounded-xl bg-blue-600/80 hover:bg-blue-600 text-white font-semibold text-xs transition flex items-center justify-center space-x-1.5"
            >
              <span>Launch Traffic Desk</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Hospital ER */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 hover:border-emerald-500/50 transition flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mb-3">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">Hospital Emergency ER</h3>
              <p className="text-slate-400 text-xs mb-3">
                Inbound ambulance countdown radar, live streamed patient vitals, shock bay reservation, and doctor ready confirmation.
              </p>
              <ul className="text-[11px] text-slate-300 space-y-1 mb-4">
                <li className="flex items-center space-x-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /><span>Live Paramedic Vitals Radar</span></li>
                <li className="flex items-center space-x-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /><span>Trauma Bed Inventory Controls</span></li>
              </ul>
            </div>
            <button
              onClick={() => handleLaunchRole('hospital', '/hospital')}
              className="w-full py-2 rounded-xl bg-emerald-600/80 hover:bg-emerald-600 text-white font-semibold text-xs transition flex items-center justify-center space-x-1.5"
            >
              <span>Launch Hospital ER</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Green Corridor Simulator */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 hover:border-purple-500/50 transition flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400 mb-3">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">Corridor AI Simulator</h3>
              <p className="text-slate-400 text-xs mb-3">
                Configurable simulation lab: tune velocity sliders, traffic density, and step through intersection green wave clearance.
              </p>
              <ul className="text-[11px] text-slate-300 space-y-1 mb-4">
                <li className="flex items-center space-x-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /><span>Tuning Velocity Sliders</span></li>
                <li className="flex items-center space-x-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /><span>Interactive Stepper Controls</span></li>
              </ul>
            </div>
            <Link
              to="/green-corridor"
              className="w-full py-2 rounded-xl bg-purple-600/80 hover:bg-purple-600 text-white font-semibold text-xs transition flex items-center justify-center space-x-1.5"
            >
              <span>Launch Simulator</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* HOW THE WEBSITE WORKS: STEP-BY-STEP WORKFLOW GUIDE SECTION    */}
      {/* ------------------------------------------------------------- */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-800/80">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2">Step-by-Step Architecture</h2>
          <p className="text-2xl sm:text-3xl font-display font-bold text-white">
            How the Entire Website Workflow Operates
          </p>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Follow this step-by-step process to understand how an emergency flows from input to hospital delivery.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
          {/* Step 1 */}
          <div className="glass-panel p-5 rounded-2xl border border-red-500/30 text-left relative">
            <span className="text-2xl font-mono font-bold text-red-500 mb-2 block">STEP 01</span>
            <h4 className="text-sm font-bold text-white mb-1">Fill Emergency Details</h4>
            <p className="text-slate-300 text-xs leading-relaxed">
              Open the <strong>Ambulance Dispatch Panel</strong> (or Citizen SOS above). Fill in patient name, condition (e.g. STEMI), vitals (HR, BP, SpO2), pickup address, and select destination hospital. Click <strong>Dispatch Emergency</strong>.
            </p>
          </div>

          {/* Step 2 */}
          <div className="glass-panel p-5 rounded-2xl border border-blue-500/30 text-left relative">
            <span className="text-2xl font-mono font-bold text-blue-400 mb-2 block">STEP 02</span>
            <h4 className="text-sm font-bold text-white mb-1">Police Clears Corridor</h4>
            <p className="text-slate-300 text-xs leading-relaxed">
              Open the <strong>Traffic Police Desk</strong>. The new emergency instantly appears in the queue with siren audio. Traffic officers input their name and click <strong>Authorize Green Wave</strong>, turning signals green along the route.
            </p>
          </div>

          {/* Step 3 */}
          <div className="glass-panel p-5 rounded-2xl border border-emerald-500/30 text-left relative">
            <span className="text-2xl font-mono font-bold text-emerald-400 mb-2 block">STEP 03</span>
            <h4 className="text-sm font-bold text-white mb-1">Hospital Preps Shock Bay</h4>
            <p className="text-slate-300 text-xs leading-relaxed">
              Open the <strong>Hospital ER Panel</strong>. The radar shows incoming ambulance ETA and live vitals streamed from the paramedic. Doctors assign a Trauma Bay, check the readiness checklist, and confirm readiness back to the crew.
            </p>
          </div>

          {/* Step 4 */}
          <div className="glass-panel p-5 rounded-2xl border border-purple-500/30 text-left relative">
            <span className="text-2xl font-mono font-bold text-purple-400 mb-2 block">STEP 04</span>
            <h4 className="text-sm font-bold text-white mb-1">Live Tracking & Arrival</h4>
            <p className="text-slate-300 text-xs leading-relaxed">
              Watch the ambulance move along the map in the <strong>Command Center</strong>. Paramedic can broadcast live vitals or trigger SOS. On arrival, click <strong>Mark Arrived</strong> to complete the mission, saving up to 15 golden hour minutes!
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;