import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { LeafletMap } from '../components/LeafletMap';
import { SosModal } from '../components/SosModal';
import { soundEffects } from '../services/soundEffects';
import { 
  Ambulance, 
  MapPin, 
  Building2, 
  Sparkles, 
  Siren, 
  Navigation, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Activity, 
  Radio, 
  Heart, 
  ArrowRight,
  ShieldCheck,
  Send,
  User,
  Phone,
  Thermometer,
  RotateCcw,
  PlusCircle,
  Stethoscope,
  FileText,
  Sliders,
  Crosshair,
  CheckSquare
} from 'lucide-react';

const DELHI_LOCATION_PRESETS = [
  { name: 'Connaught Place Inner Circle', address: 'Inner Circle Block B, Connaught Place, New Delhi', lat: 28.6315, lng: 77.2167 },
  { name: 'Karol Bagh Metro Gate', address: 'Arya Samaj Road, Karol Bagh, New Delhi', lat: 28.6517, lng: 77.1906 },
  { name: 'Lajpat Nagar Central Market', address: 'Ring Road, Lajpat Nagar II, New Delhi', lat: 28.5700, lng: 77.2400 },
  { name: 'Saket City Center', address: 'Press Enclave Marg, Saket District Centre, New Delhi', lat: 28.5284, lng: 77.2185 },
  { name: 'Rohini Sector 14 Crossing', address: 'Sector 14, Rohini, New Delhi', lat: 28.7180, lng: 77.1150 }
];

const EMERGENCY_CONDITION_PRESETS = [
  'Acute Myocardial Infarction (STEMI Suspicion)',
  'Severe Polytrauma with Major Hemorrhage',
  'Acute Stroke Code (Onset < 2 hours)',
  'Severe Respiratory Distress / Hypoxia',
  'High-Speed Road Traffic Collision',
  'Critical Burn Injury (> 40% TBSA)',
  'Complicated Pregnancy Labor Emergency'
];

export const AmbulanceOperatorPanel = () => {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();

  // Master State
  const [hospitals, setHospitals] = useState([]);
  const [activeEmergency, setActiveEmergency] = useState(null);
  const [isGpsSharing, setIsGpsSharing] = useState(false);
  const [gpsWatchId, setGpsWatchId] = useState(null);
  const [currentCoord, setCurrentCoord] = useState([28.6315, 77.2167]);
  const [isSosOpen, setIsSosOpen] = useState(false);
  const [routesComparison, setRoutesComparison] = useState(null);
  const [selectedRouteId, setSelectedRouteId] = useState('route-ai-corridor');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // ----------------------------------------------------------------------
  // FULL USER-INPUT FORM STATE (All fields completely editable by user)
  // ----------------------------------------------------------------------
  // 1. Vehicle & Paramedic Crew Details
  const [ambulanceId, setAmbulanceId] = useState('AMB-101');
  const [ambulanceNumberPlate, setAmbulanceNumberPlate] = useState('DL 1C AA 4421');
  const [paramedicName, setParamedicName] = useState(user?.name || 'Vikram Sethi');
  const [paramedicPhone, setParamedicPhone] = useState('+91 98112 34567');

  // 2. Patient Demographics & Condition
  const [patientName, setPatientName] = useState('Rahul Verma');
  const [patientAge, setPatientAge] = useState('52');
  const [patientGender, setPatientGender] = useState('Male');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [urgency, setUrgency] = useState('critical_red');
  const [conditionSummary, setConditionSummary] = useState('Acute Myocardial Infarction (STEMI Suspicion)');
  const [triageNotes, setTriageNotes] = useState('Patient exhibits severe retrosternal pain radiating to left arm. Cath-lab ready recommended.');

  // 3. Vitals Telemetry (Real numbers)
  const [heartRate, setHeartRate] = useState(122);
  const [bloodPressure, setBloodPressure] = useState('150/98');
  const [spO2, setSpO2] = useState(89);
  const [temperatureC, setTemperatureC] = useState(37.2);
  const [respiratoryRate, setRespiratoryRate] = useState(24);
  const [bloodSugarMgDl, setBloodSugarMgDl] = useState(135);

  // 4. Equipment Checkboxes
  const [selectedEquipment, setSelectedEquipment] = useState([
    'Ventilator',
    'Defibrillator',
    'Oxygen Tank'
  ]);

  // 5. Pickup Location
  const [pickupAddress, setPickupAddress] = useState('Inner Circle Block B, Connaught Place, New Delhi');
  const [pickupLat, setPickupLat] = useState(28.6315);
  const [pickupLng, setPickupLng] = useState(77.2167);

  // 6. Destination Hospital (Preset or Custom)
  const [useCustomHospital, setUseCustomHospital] = useState(false);
  const [selectedHospitalId, setSelectedHospitalId] = useState('');
  const [customHospitalName, setCustomHospitalName] = useState('AIIMS Apex Trauma Center & Hospital');
  const [customHospitalAddress, setCustomHospitalAddress] = useState('Sri Aurobindo Marg, Ansari Nagar East, New Delhi');
  const [customHospitalLat, setCustomHospitalLat] = useState(28.5672);
  const [customHospitalLng, setCustomHospitalLng] = useState(77.2100);

  // In-Transit Live Vitals Update Sub-Form
  const [liveHr, setLiveHr] = useState(122);
  const [liveBp, setLiveBp] = useState('150/98');
  const [liveSpo2, setLiveSpo2] = useState(89);
  const [liveVitalsUpdating, setLiveVitalsUpdating] = useState(false);

  // Load initial hospitals & emergencies
  useEffect(() => {
    const init = async () => {
      try {
        const hospRes = await api.getHospitals();
        if (hospRes.success && hospRes.hospitals) {
          setHospitals(hospRes.hospitals);
          if (hospRes.hospitals.length > 0) {
            setSelectedHospitalId(hospRes.hospitals[0]._id);
          }
        }

        const emgRes = await api.getEmergencies();
        if (emgRes.success && emgRes.emergencies && emgRes.emergencies.length > 0) {
          const current = emgRes.emergencies.find(e => e.status !== 'completed');
          if (current) {
            setActiveEmergency(current);
            setLiveHr(current.patientInfo?.vitals?.heartRateBpm || 122);
            setLiveBp(current.patientInfo?.vitals?.bloodPressure || '150/98');
            setLiveSpo2(current.patientInfo?.vitals?.spO2Percent || 89);
          }
        }

        const routeRes = await api.analyzeRoutes();
        if (routeRes.success) {
          setRoutesComparison(routeRes.routes);
        }
      } catch (err) {
        console.warn('Operator panel load fallback:', err);
      }
    };
    init();
  }, []);

  // Listen to socket updates for active emergency
  useEffect(() => {
    if (!socket) return;

    const handleTrafficAck = (data) => {
      if (activeEmergency && activeEmergency.emergencyId === data.emergencyId) {
        setActiveEmergency(prev => ({
          ...prev,
          trafficControlAcknowledgement: {
            status: 'corridor_active',
            operatorName: data.officerName,
            controlRoomName: data.controlDesk,
            acknowledgedAt: new Date()
          },
          greenCorridorActive: true
        }));
      }
    };

    const handleHospitalReady = (data) => {
      if (activeEmergency && activeEmergency.emergencyId === data.emergencyId) {
        setActiveEmergency(prev => ({
          ...prev,
          hospitalReadiness: {
            status: data.status,
            bayAssigned: data.bayAssigned,
            leadDoctor: data.leadDoctor,
            confirmedAt: new Date()
          }
        }));
      }
    };

    const handleIntersectionCleared = (data) => {
      if (activeEmergency && activeEmergency.emergencyId === data.emergencyId) {
        setActiveEmergency(prev => {
          const updatedIntersections = prev.routeDetails?.intersections?.map(int => {
            if (int.id === data.intersectionId) {
              return { ...int, status: data.status, clearedBy: data.clearedBy };
            }
            return int;
          });
          return {
            ...prev,
            routeDetails: { ...prev.routeDetails, intersections: updatedIntersections }
          };
        });
      }
    };

    const handleVitalsUpdate = (data) => {
      if (activeEmergency && activeEmergency.emergencyId === data.emergencyId) {
        setActiveEmergency(prev => ({
          ...prev,
          patientInfo: {
            ...prev.patientInfo,
            vitals: data.vitals,
            triageNotes: data.triageNotes || prev.patientInfo?.triageNotes
          }
        }));
      }
    };

    socket.on('traffic_ack_received', handleTrafficAck);
    socket.on('hospital_bay_ready', handleHospitalReady);
    socket.on('intersection_updated', handleIntersectionCleared);
    socket.on('vitals_updated', handleVitalsUpdate);

    return () => {
      socket.off('traffic_ack_received', handleTrafficAck);
      socket.off('hospital_bay_ready', handleHospitalReady);
      socket.off('intersection_updated', handleIntersectionCleared);
      socket.off('vitals_updated', handleVitalsUpdate);
    };
  }, [socket, activeEmergency]);

  // GPS Sharing Handler (Browser Geolocation or Simulation Fallback)
  const toggleGpsSharing = () => {
    if (isGpsSharing) {
      if (gpsWatchId) navigator.geolocation.clearWatch(gpsWatchId);
      setIsGpsSharing(false);
    } else {
      if ('geolocation' in navigator) {
        const id = navigator.geolocation.watchPosition(
          (pos) => {
            const newCoord = [pos.coords.latitude, pos.coords.longitude];
            setCurrentCoord(newCoord);
            api.updateAmbulanceLocation(ambulanceId || 'AMB-101', {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              speedKmH: Math.round(pos.coords.speed ? pos.coords.speed * 3.6 : 52),
              emergencyId: activeEmergency?.emergencyId
            });
          },
          (err) => {
            console.warn('Geolocation not permitted, using simulated GPS stream.');
            const simCoords = activeEmergency?.routeDetails?.routeCoordinates || [[pickupLat, pickupLng]];
            let idx = 0;
            const timer = setInterval(() => {
              idx = (idx + 1) % simCoords.length;
              setCurrentCoord(simCoords[idx]);
              api.updateAmbulanceLocation(ambulanceId || 'AMB-101', {
                lat: simCoords[idx][0],
                lng: simCoords[idx][1],
                speedKmH: 54,
                emergencyId: activeEmergency?.emergencyId
              });
            }, 2000);
            setGpsWatchId(timer);
          },
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
        setGpsWatchId(id);
      }
      setIsGpsSharing(true);
      soundEffects.playRadioBeep();
    }
  };

  // Detect current location to fill pickup
  const handleDetectDeviceGps = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = parseFloat(pos.coords.latitude.toFixed(5));
          const lng = parseFloat(pos.coords.longitude.toFixed(5));
          setPickupLat(lat);
          setPickupLng(lng);
          setCurrentCoord([lat, lng]);
          setPickupAddress(`Current GPS Location (${lat}, ${lng})`);
          soundEffects.playSuccessChime();
        },
        () => {
          alert('GPS permission was denied. You can manually enter your address or coordinates.');
        }
      );
    }
  };

  // Quick Preset Selection Helper
  const handleSelectPreset = (preset) => {
    setPickupAddress(preset.address);
    setPickupLat(preset.lat);
    setPickupLng(preset.lng);
    setCurrentCoord([preset.lat, preset.lng]);
    soundEffects.playRadioBeep();
  };

  // Reset to Blank Form
  const handleClearForm = () => {
    setPatientName('');
    setPatientAge('');
    setConditionSummary('');
    setTriageNotes('');
    setPickupAddress('');
    setHeartRate(80);
    setBloodPressure('120/80');
    setSpO2(98);
    setTemperatureC(37.0);
    setRespiratoryRate(18);
    setBloodSugarMgDl(100);
    setSelectedEquipment([]);
    soundEffects.playRadioBeep();
  };

  // Populate realistic sample test values
  const handleLoadSamplePreset = () => {
    setAmbulanceId('AMB-101');
    setAmbulanceNumberPlate('DL 1C AA 4421');
    setParamedicName('Vikram Sethi');
    setParamedicPhone('+91 98112 34567');
    setPatientName('Rahul Verma');
    setPatientAge('54');
    setPatientGender('Male');
    setBloodGroup('O+');
    setUrgency('critical_red');
    setConditionSummary('Acute Myocardial Infarction (STEMI Suspicion)');
    setHeartRate(124);
    setBloodPressure('154/98');
    setSpO2(88);
    setTemperatureC(37.3);
    setRespiratoryRate(26);
    setBloodSugarMgDl(142);
    setPickupAddress('Inner Circle Block B, Connaught Place, New Delhi');
    setPickupLat(28.6315);
    setPickupLng(77.2167);
    setSelectedEquipment(['Ventilator', 'Defibrillator', 'Oxygen Tank']);
    setTriageNotes('Patient conscious but in severe acute chest pain radiating to left jaw. Oxygen at 4L/min active.');
    soundEffects.playRadioBeep();
  };

  // Start new dispatch / clear active emergency
  const handleStartNewDispatch = () => {
    setActiveEmergency(null);
    setSuccessMessage('Ready to configure and dispatch a new emergency.');
    setTimeout(() => setSuccessMessage(''), 4000);
    soundEffects.playRadioBeep();
  };

  // Handle Equipment Checkbox Toggle
  const toggleEquipment = (item) => {
    setSelectedEquipment(prev => 
      prev.includes(item) ? prev.filter(x => x !== item) : [...prev, item]
    );
  };

  // Create Emergency Trip with Full User Inputs
  const handleCreateEmergency = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const targetHosp = useCustomHospital
      ? {
          name: customHospitalName,
          lat: Number(customHospitalLat) || 28.5672,
          lng: Number(customHospitalLng) || 77.2100,
          address: customHospitalAddress
        }
      : hospitals.find(h => h._id === selectedHospitalId) || hospitals[0] || {
          name: 'AIIMS Apex Trauma Center & Hospital',
          lat: 28.5672,
          lng: 77.2100,
          address: 'Sri Aurobindo Marg, New Delhi'
        };

    const payload = {
      ambulanceId: ambulanceId || 'AMB-101',
      paramedicName: paramedicName || 'Vikram Sethi',
      paramedicPhone: paramedicPhone || '+91 98112 34567',
      ambulanceNumberPlate: ambulanceNumberPlate || 'DL 1C AA 4421',
      equipment: selectedEquipment,
      pickupLocation: {
        lat: Number(pickupLat) || 28.6315,
        lng: Number(pickupLng) || 77.2167,
        address: pickupAddress || 'Connaught Place, New Delhi'
      },
      destinationHospital: {
        hospitalId: targetHosp._id || undefined,
        name: targetHosp.name,
        lat: targetHosp.location?.lat || targetHosp.lat || 28.5672,
        lng: targetHosp.location?.lng || targetHosp.lng || 77.2100,
        address: targetHosp.location?.address || targetHosp.address || 'Delhi Trauma Center'
      },
      patientInfo: {
        urgency,
        patientName: patientName || 'Emergency Patient',
        gender: patientGender,
        ageGroup: `${patientAge || '45'} yrs`,
        bloodGroup,
        conditionSummary: conditionSummary || 'Severe Medical Emergency',
        vitals: {
          heartRateBpm: Number(heartRate) || 110,
          spO2Percent: Number(spO2) || 94,
          bloodPressure: bloodPressure || '130/85',
          temperatureC: Number(temperatureC) || 37.1,
          respiratoryRate: Number(respiratoryRate) || 20,
          bloodSugarMgDl: Number(bloodSugarMgDl) || 115
        },
        triageNotes: triageNotes || 'Priority Green Corridor requested via Ambulance Operator HUD.'
      },
      estimatedTimeMin: 11,
      baselineTimeMin: 26,
      distanceKm: 8.4
    };

    try {
      const res = await api.createEmergency(payload);
      if (res.success && res.emergency) {
        setActiveEmergency(res.emergency);
        setLiveHr(payload.patientInfo.vitals.heartRateBpm);
        setLiveBp(payload.patientInfo.vitals.bloodPressure);
        setLiveSpo2(payload.patientInfo.vitals.spO2Percent);
        soundEffects.playSuccessChime();
        soundEffects.playSiren(1500);
      }
    } catch (err) {
      console.warn('Create emergency error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Broadcast Live Vitals to Hospital ER
  const handleUpdateLiveVitals = async () => {
    if (!activeEmergency) return;
    setLiveVitalsUpdating(true);
    try {
      const updatedVitals = {
        heartRateBpm: Number(liveHr),
        bloodPressure: liveBp,
        spO2Percent: Number(liveSpo2)
      };
      const res = await api.updateVitals(activeEmergency.emergencyId, updatedVitals, 'Live in-transit vitals refresh by paramedic');
      if (res.success && res.emergency) {
        setActiveEmergency(res.emergency);
        soundEffects.playSuccessChime();
        setSuccessMessage('Vitals broadcast live to Hospital Shock Bay!');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      console.warn('Live vitals update error:', err);
    } finally {
      setLiveVitalsUpdating(false);
    }
  };

  // Trigger Green Corridor Request
  const handleRequestCorridor = async () => {
    if (!activeEmergency) return;
    try {
      const res = await api.requestGreenCorridor(activeEmergency.emergencyId);
      if (res.success && res.emergency) {
        setActiveEmergency(res.emergency);
        soundEffects.playRadioBeep();
      }
    } catch (err) {
      console.warn('Corridor request error:', err);
    }
  };

  // Trigger SOS Panic
  const handleSosConfirm = async (reason) => {
    if (!activeEmergency) return;
    try {
      const res = await api.triggerSos(activeEmergency.emergencyId, reason);
      if (res.success && res.emergency) {
        setActiveEmergency(res.emergency);
      }
    } catch (err) {
      console.warn('SOS trigger error:', err);
    }
  };

  // Complete Trip
  const handleCompleteTrip = async () => {
    if (!activeEmergency) return;
    try {
      const res = await api.completeEmergency(activeEmergency.emergencyId);
      if (res.success && res.emergency) {
        setActiveEmergency(res.emergency);
        soundEffects.playSuccessChime();
      }
    } catch (err) {
      console.warn('Complete trip error:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner / Operator Identity */}
      <div className="glass-panel p-4 rounded-2xl border border-red-500/30 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-red-600/20 border border-red-500 flex items-center justify-center text-red-500">
            <Ambulance className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-display font-extrabold text-white">
                Ambulance Dispatch Terminal
              </h1>
              <span className="px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-500/30 text-[10px] font-mono font-bold">
                UNIT: {ambulanceId || 'AMB-101'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Paramedic: <strong className="text-slate-200">{paramedicName || 'Vikram Sethi'}</strong> | Plate: <span className="font-mono text-cyan-300">{ambulanceNumberPlate || 'DL 1C AA 4421'}</span> | Status: <strong className="text-emerald-400">Full User Input Enabled</strong>
            </p>
          </div>
        </div>

        {/* SOS Button & GPS Toggle & New Dispatch */}
        <div className="flex flex-wrap items-center gap-2">
          {activeEmergency && (
            <button
              onClick={handleStartNewDispatch}
              className="px-3 py-2 rounded-xl bg-navy-800 hover:bg-navy-700 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition flex items-center space-x-1.5 shadow"
              title="Clear active trip to fill and dispatch a new emergency"
            >
              <PlusCircle className="w-4 h-4 text-cyan-400" />
              <span>New Dispatch Form</span>
            </button>
          )}

          <button
            onClick={toggleGpsSharing}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
              isGpsSharing
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'bg-navy-800 text-slate-300 hover:bg-navy-700 border border-slate-700'
            }`}
          >
            <Navigation className={`w-4 h-4 ${isGpsSharing ? 'animate-spin' : ''}`} />
            <span>{isGpsSharing ? 'Live GPS Active' : 'Broadcast GPS'}</span>
          </button>

          <button
            onClick={() => setIsSosOpen(true)}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-red-600/40 animate-pulse flex items-center space-x-2"
          >
            <Siren className="w-4 h-4" />
            <span>SOS PANIC</span>
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-semibold flex items-center space-x-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Main Grid: Left Column (Full User Input Form) - Right Column (Live Map & Action Status) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Dispatcher Configuration Form (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
            
            {/* Header with Quick Presets / Clear Form Buttons */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h2 className="text-sm font-bold text-white flex items-center space-x-2">
                <Activity className="w-4 h-4 text-red-500" />
                <span>Emergency Dispatch Form</span>
              </h2>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleLoadSamplePreset}
                  className="px-2 py-1 text-[10px] rounded bg-navy-800 hover:bg-navy-700 text-cyan-300 border border-cyan-500/30 transition font-medium"
                  title="Prefill sample values to test quickly"
                >
                  Load Sample
                </button>
                <button
                  type="button"
                  onClick={handleClearForm}
                  className="px-2 py-1 text-[10px] rounded bg-navy-800 hover:bg-navy-700 text-slate-400 hover:text-white border border-slate-700 transition font-medium"
                  title="Clear all fields to type completely from scratch"
                >
                  Clear Form
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateEmergency} className="space-y-4">
              
              {/* SECTION 1: Ambulance & Paramedic Crew */}
              <div className="bg-navy-950/70 p-3 rounded-xl border border-slate-800/80 space-y-2.5">
                <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider flex items-center justify-between">
                  <span>1. Ambulance & Paramedic Unit</span>
                  <span className="text-[9px] text-slate-400 font-normal">Editable</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400">Unit ID</label>
                    <input
                      type="text"
                      value={ambulanceId}
                      onChange={(e) => setAmbulanceId(e.target.value)}
                      placeholder="e.g. AMB-101"
                      className="w-full bg-navy-900 border border-slate-700 rounded p-1.5 text-xs text-white font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">Plate Number</label>
                    <input
                      type="text"
                      value={ambulanceNumberPlate}
                      onChange={(e) => setAmbulanceNumberPlate(e.target.value)}
                      placeholder="e.g. DL 1C AA 4421"
                      className="w-full bg-navy-900 border border-slate-700 rounded p-1.5 text-xs text-white font-mono"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400">Paramedic In-Charge</label>
                    <input
                      type="text"
                      value={paramedicName}
                      onChange={(e) => setParamedicName(e.target.value)}
                      placeholder="Full Name"
                      className="w-full bg-navy-900 border border-slate-700 rounded p-1.5 text-xs text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">Paramedic Contact Phone</label>
                    <input
                      type="text"
                      value={paramedicPhone}
                      onChange={(e) => setParamedicPhone(e.target.value)}
                      placeholder="+91 98..."
                      className="w-full bg-navy-900 border border-slate-700 rounded p-1.5 text-xs text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: Patient Demographics & Condition */}
              <div className="bg-navy-950/70 p-3 rounded-xl border border-slate-800/80 space-y-2.5">
                <div className="text-[11px] font-bold text-red-400 uppercase tracking-wider flex items-center justify-between">
                  <span>2. Patient Information</span>
                  <span className="text-[9px] text-slate-400 font-normal">Triage Data</span>
                </div>
                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-6">
                    <label className="text-[10px] text-slate-400">Patient Full Name</label>
                    <input
                      type="text"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      placeholder="e.g. Rahul Verma"
                      className="w-full bg-navy-900 border border-slate-700 rounded p-1.5 text-xs text-white"
                      required
                    />
                  </div>
                  <div className="col-span-3">
                    <label className="text-[10px] text-slate-400">Age</label>
                    <input
                      type="number"
                      value={patientAge}
                      onChange={(e) => setPatientAge(e.target.value)}
                      placeholder="52"
                      className="w-full bg-navy-900 border border-slate-700 rounded p-1.5 text-xs text-white font-mono"
                    />
                  </div>
                  <div className="col-span-3">
                    <label className="text-[10px] text-slate-400">Blood</label>
                    <select
                      value={bloodGroup}
                      onChange={(e) => setBloodGroup(e.target.value)}
                      className="w-full bg-navy-900 border border-slate-700 rounded p-1.5 text-xs text-white"
                    >
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="Unknown">Unknown</option>
                    </select>
                  </div>
                </div>

                {/* Emergency Condition & Suggestions */}
                <div>
                  <label className="text-[10px] text-slate-400">Emergency Condition / Chief Complaint</label>
                  <input
                    type="text"
                    value={conditionSummary}
                    onChange={(e) => setConditionSummary(e.target.value)}
                    placeholder="Type condition or select below"
                    className="w-full bg-navy-900 border border-slate-700 rounded p-1.5 text-xs text-white mb-1.5"
                    required
                  />
                  {/* Quick condition chips */}
                  <div className="flex flex-wrap gap-1">
                    {EMERGENCY_CONDITION_PRESETS.slice(0, 4).map((cond, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setConditionSummary(cond)}
                        className="text-[9px] px-2 py-0.5 rounded bg-navy-900 text-slate-400 hover:text-cyan-300 hover:border-cyan-500/40 border border-slate-800 transition text-left truncate max-w-[200px]"
                      >
                        {cond}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Patient Urgency / Triage Level */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setUrgency('critical_red')}
                    className={`py-2 px-1 rounded-lg text-xs font-bold transition flex flex-col items-center ${
                      urgency === 'critical_red'
                        ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                        : 'bg-navy-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    <span>Code Red</span>
                    <span className="text-[9px] font-normal opacity-80">Cardiac/Trauma</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUrgency('serious_yellow')}
                    className={`py-2 px-1 rounded-lg text-xs font-bold transition flex flex-col items-center ${
                      urgency === 'serious_yellow'
                        ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                        : 'bg-navy-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    <span>Code Yellow</span>
                    <span className="text-[9px] font-normal opacity-80">Severe Injury</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUrgency('moderate_green')}
                    className={`py-2 px-1 rounded-lg text-xs font-bold transition flex flex-col items-center ${
                      urgency === 'moderate_green'
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                        : 'bg-navy-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    <span>Code Green</span>
                    <span className="text-[9px] font-normal opacity-80">Stable Transit</span>
                  </button>
                </div>
              </div>

              {/* SECTION 3: Vitals Telemetry Inputs */}
              <div className="bg-navy-950/70 p-3 rounded-xl border border-slate-800/80 space-y-2">
                <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center justify-between">
                  <span>3. Patient Vitals (Input Numbers)</span>
                  <span className="text-[9px] text-slate-400 font-normal">Transmitted to ER</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400">Heart Rate (BPM)</label>
                    <input
                      type="number"
                      value={heartRate}
                      onChange={(e) => setHeartRate(e.target.value)}
                      className="w-full bg-navy-900 border border-slate-700 rounded p-1.5 text-xs text-red-400 font-mono font-bold"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">SpO2 % (Oxygen)</label>
                    <input
                      type="number"
                      value={spO2}
                      onChange={(e) => setSpO2(e.target.value)}
                      className="w-full bg-navy-900 border border-slate-700 rounded p-1.5 text-xs text-cyan-400 font-mono font-bold"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">BP (mmHg)</label>
                    <input
                      type="text"
                      value={bloodPressure}
                      onChange={(e) => setBloodPressure(e.target.value)}
                      placeholder="120/80"
                      className="w-full bg-navy-900 border border-slate-700 rounded p-1.5 text-xs text-amber-400 font-mono font-bold"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div>
                    <label className="text-[10px] text-slate-400">Temp (°C)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={temperatureC}
                      onChange={(e) => setTemperatureC(e.target.value)}
                      className="w-full bg-navy-900 border border-slate-700 rounded p-1.5 text-xs text-emerald-400 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">Resp Rate (/min)</label>
                    <input
                      type="number"
                      value={respiratoryRate}
                      onChange={(e) => setRespiratoryRate(e.target.value)}
                      className="w-full bg-navy-900 border border-slate-700 rounded p-1.5 text-xs text-purple-400 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">Blood Sugar</label>
                    <input
                      type="number"
                      value={bloodSugarMgDl}
                      onChange={(e) => setBloodSugarMgDl(e.target.value)}
                      className="w-full bg-navy-900 border border-slate-700 rounded p-1.5 text-xs text-yellow-400 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 4: Pickup Location with GPS button & Presets */}
              <div className="bg-navy-950/70 p-3 rounded-xl border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                    4. Incident Pickup Location
                  </span>
                  <button
                    type="button"
                    onClick={handleDetectDeviceGps}
                    className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-[10px] hover:bg-emerald-900 transition flex items-center space-x-1"
                  >
                    <Crosshair className="w-3 h-3 text-emerald-400" />
                    <span>Get Device GPS</span>
                  </button>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400">Pickup Address / Landmark</label>
                  <input
                    type="text"
                    value={pickupAddress}
                    onChange={(e) => setPickupAddress(e.target.value)}
                    placeholder="Enter pickup address or landmark..."
                    className="w-full bg-navy-900 border border-slate-700 rounded p-1.5 text-xs text-white"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400">Pickup Latitude</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={pickupLat}
                      onChange={(e) => setPickupLat(e.target.value)}
                      className="w-full bg-navy-900 border border-slate-700 rounded p-1 text-xs text-slate-300 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">Pickup Longitude</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={pickupLng}
                      onChange={(e) => setPickupLng(e.target.value)}
                      className="w-full bg-navy-900 border border-slate-700 rounded p-1 text-xs text-slate-300 font-mono"
                    />
                  </div>
                </div>

                {/* Popular Delhi Landmarks Quick Presets */}
                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">Quick Presets:</span>
                  <div className="flex flex-wrap gap-1">
                    {DELHI_LOCATION_PRESETS.map((loc, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSelectPreset(loc)}
                        className="text-[9px] px-2 py-0.5 rounded bg-navy-900 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-600 transition"
                      >
                        {loc.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* SECTION 5: Destination Hospital (Dropdown OR Custom Hospital Entry) */}
              <div className="bg-navy-950/70 p-3 rounded-xl border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">
                    5. Destination Hospital ER
                  </span>
                  <label className="flex items-center space-x-1.5 cursor-pointer text-[10px] text-slate-300">
                    <input
                      type="checkbox"
                      checked={useCustomHospital}
                      onChange={(e) => setUseCustomHospital(e.target.checked)}
                      className="rounded bg-navy-900 border-slate-700 text-blue-600 focus:ring-0"
                    />
                    <span>Enter Custom Hospital</span>
                  </label>
                </div>

                {!useCustomHospital ? (
                  <div>
                    <select
                      value={selectedHospitalId}
                      onChange={(e) => setSelectedHospitalId(e.target.value)}
                      className="w-full bg-navy-900 border border-slate-700 rounded p-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    >
                      {hospitals.map((hosp) => (
                        <option key={hosp._id} value={hosp._id}>
                          {hosp.name} ({hosp.capacity?.traumaBedsAvailable || 3} Trauma Beds Free)
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={customHospitalName}
                      onChange={(e) => setCustomHospitalName(e.target.value)}
                      placeholder="Hospital Name (e.g. Max Smart Super Speciality)"
                      className="w-full bg-navy-900 border border-slate-700 rounded p-1.5 text-xs text-white"
                      required
                    />
                    <input
                      type="text"
                      value={customHospitalAddress}
                      onChange={(e) => setCustomHospitalAddress(e.target.value)}
                      placeholder="Hospital Address"
                      className="w-full bg-navy-900 border border-slate-700 rounded p-1.5 text-xs text-white"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        step="0.0001"
                        value={customHospitalLat}
                        onChange={(e) => setCustomHospitalLat(e.target.value)}
                        placeholder="Latitude"
                        className="w-full bg-navy-900 border border-slate-700 rounded p-1 text-xs text-slate-300 font-mono"
                      />
                      <input
                        type="number"
                        step="0.0001"
                        value={customHospitalLng}
                        onChange={(e) => setCustomHospitalLng(e.target.value)}
                        placeholder="Longitude"
                        className="w-full bg-navy-900 border border-slate-700 rounded p-1 text-xs text-slate-300 font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 6: Life Support Equipment Checkboxes */}
              <div className="bg-navy-950/70 p-3 rounded-xl border border-slate-800/80 space-y-1.5">
                <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider block">
                  6. Active Onboard Life Support Equipment
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {['Ventilator', 'Defibrillator', 'Oxygen Tank', 'CPR Board', 'Trauma Splint', 'Pediatric Kit'].map((item) => {
                    const isChecked = selectedEquipment.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggleEquipment(item)}
                        className={`px-2 py-1.5 rounded text-[10px] font-medium border text-left flex items-center space-x-1.5 transition ${
                          isChecked
                            ? 'bg-purple-950/80 border-purple-500 text-purple-300'
                            : 'bg-navy-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <span className={`w-2.5 h-2.5 rounded-sm border flex items-center justify-center ${isChecked ? 'bg-purple-500 border-purple-400' : 'border-slate-600'}`}>
                          {isChecked && '✓'}
                        </span>
                        <span>{item}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 7: Dispatch Notes */}
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Triage Notes / Dispatch Instructions</label>
                <textarea
                  rows="2"
                  value={triageNotes}
                  onChange={(e) => setTriageNotes(e.target.value)}
                  placeholder="Notes for ER team and traffic control..."
                  className="w-full bg-navy-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                ></textarea>
              </div>

              {/* Dispatch Action Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-red-600/40 transition flex items-center justify-center space-x-2 active:scale-[0.99]"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'DISPATCHING EMERGENCY REQUEST...' : 'DISPATCH EMERGENCY REQUEST'}</span>
              </button>
            </form>
          </div>

          {/* AI Multi-Route Comparison Card */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800">
              <h3 className="text-xs font-bold text-slate-200 flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>AI Multi-Route Comparative Analysis</span>
              </h3>
              <span className="text-[10px] text-purple-300 font-mono">Dynamic Dispatch v2.4</span>
            </div>

            <div className="space-y-2.5 pt-1">
              {routesComparison?.map((route) => {
                const isSelected = selectedRouteId === route.id;
                return (
                  <div
                    key={route.id}
                    onClick={() => setSelectedRouteId(route.id)}
                    className={`p-3 rounded-xl cursor-pointer border transition ${
                      isSelected
                        ? 'bg-navy-900/90 border-emerald-500/70 shadow-lg shadow-emerald-500/10'
                        : 'bg-navy-950/50 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-white">{route.name}</span>
                      <span
                        className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider"
                        style={{
                          backgroundColor: `${route.colorHex}22`,
                          color: route.colorHex,
                          border: `1px solid ${route.colorHex}55`
                        }}
                      >
                        {route.badge}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-[11px] font-mono py-1.5 text-slate-300">
                      <div>
                        <span className="text-slate-500 text-[10px] block font-sans">Travel Time</span>
                        <strong className="text-emerald-400 text-xs">{route.clearedEtaMin} min</strong>
                        <span className="text-[9px] text-slate-500 block">({route.baselineEtaMin}m normal)</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block font-sans">Distance</span>
                        <strong className="text-slate-200 text-xs">{route.distanceKm} km</strong>
                        <span className="text-[9px] text-slate-500 block">{route.intersectionsCount} signals</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block font-sans">Time Saved</span>
                        <strong className="text-emerald-400 text-xs">+{route.timeSavedMin} min</strong>
                        <span className="text-[9px] text-emerald-400/80 block">Saved in transit</span>
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-400 leading-snug pt-1 border-t border-slate-800/80">
                      {route.reason}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: Map & Live In-Transit Coordination Actions (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Active Trip Telemetry Bar */}
          {activeEmergency && (
            <div className="glass-panel p-4 rounded-2xl border border-emerald-500/30 bg-navy-900/90 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold">
                      {activeEmergency.emergencyId}
                    </span>
                    <span className="text-xs font-bold text-white">
                      Patient: {activeEmergency.patientInfo?.patientName || 'Rahul Verma'} ({activeEmergency.patientInfo?.ageGroup || 'Adult'})
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Destined for: <strong className="text-cyan-300">{activeEmergency.destinationHospital?.name}</strong> | Status: <strong className="text-emerald-400 capitalize">{activeEmergency.status?.replace(/_/g, ' ')}</strong>
                  </p>
                </div>

                {/* Primary Action Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  {!activeEmergency.greenCorridorActive ? (
                    <button
                      onClick={handleRequestCorridor}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/30 transition flex items-center space-x-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Request Green Corridor</span>
                    </button>
                  ) : (
                    <div className="px-3 py-1.5 rounded-xl bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center space-x-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Corridor Active</span>
                    </div>
                  )}

                  {activeEmergency.status !== 'completed' && (
                    <button
                      onClick={handleCompleteTrip}
                      className="px-3 py-2 rounded-xl bg-navy-800 hover:bg-navy-700 text-slate-200 border border-slate-700 font-bold text-xs transition"
                    >
                      Mark Arrived
                    </button>
                  )}
                </div>
              </div>

              {/* Paramedic Live In-Transit Vitals Update Bar */}
              <div className="bg-navy-950/80 p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-200 flex items-center space-x-1">
                    <Activity className="w-3.5 h-3.5 text-red-400" />
                    <span>In-Transit Paramedic Vitals Broadcast</span>
                  </span>
                  <span className="text-[10px] text-cyan-400 font-mono">Live Sync to ER</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="text-[9px] text-slate-400">Heart Rate</label>
                    <input
                      type="number"
                      value={liveHr}
                      onChange={(e) => setLiveHr(e.target.value)}
                      className="w-full bg-navy-900 border border-slate-700 rounded p-1 text-xs text-red-400 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400">Blood Pressure</label>
                    <input
                      type="text"
                      value={liveBp}
                      onChange={(e) => setLiveBp(e.target.value)}
                      className="w-full bg-navy-900 border border-slate-700 rounded p-1 text-xs text-amber-400 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400">SpO2 %</label>
                    <input
                      type="number"
                      value={liveSpo2}
                      onChange={(e) => setLiveSpo2(e.target.value)}
                      className="w-full bg-navy-900 border border-slate-700 rounded p-1 text-xs text-cyan-400 font-mono font-bold"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      disabled={liveVitalsUpdating}
                      onClick={handleUpdateLiveVitals}
                      className="w-full py-1.5 px-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-[11px] font-bold transition flex items-center justify-center space-x-1"
                    >
                      <span>{liveVitalsUpdating ? 'Syncing...' : 'Push to ER'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Interactive Tactical Map */}
          <div className="h-[460px]">
            <LeafletMap
              center={currentCoord}
              zoom={13}
              ambulancePos={currentCoord}
              routeCoordinates={activeEmergency?.routeDetails?.routeCoordinates || []}
              intersections={activeEmergency?.routeDetails?.intersections || []}
              hospitals={hospitals}
              isGreenCorridorActive={activeEmergency?.greenCorridorActive}
            />
          </div>

          {/* Real-Time Live Status Feedback Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Traffic Police Desk Acknowledgment Status */}
            <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-400" />
                  <span>Traffic Police Desk</span>
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  activeEmergency?.trafficControlAcknowledgement?.status === 'corridor_active'
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                    : 'bg-amber-950 text-amber-400 border border-amber-500/40'
                }`}>
                  {activeEmergency?.trafficControlAcknowledgement?.status || 'Pending'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Authorized By: <strong className="text-slate-200">{activeEmergency?.trafficControlAcknowledgement?.operatorName || 'Inspector Rajesh Verma (Desk 4)'}</strong>
              </p>
              <p className="text-[11px] text-slate-500 font-mono">
                {activeEmergency?.trafficControlAcknowledgement?.controlRoomName || 'Central Traffic Command Bureau'}
              </p>
            </div>

            {/* Hospital Shock Bay Status */}
            <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 flex items-center space-x-1.5">
                  <Building2 className="w-4 h-4 text-emerald-400" />
                  <span>Hospital ER Shock Bay</span>
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  activeEmergency?.hospitalReadiness?.status === 'trauma_bay_ready'
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                    : 'bg-amber-950 text-amber-400 border border-amber-500/40'
                }`}>
                  {activeEmergency?.hospitalReadiness?.status === 'trauma_bay_ready' ? 'Bay Cleared' : 'Alert Sent'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Assigned: <strong className="text-slate-200">{activeEmergency?.hospitalReadiness?.bayAssigned || 'Resuscitation Bay #1'}</strong>
              </p>
              <p className="text-[11px] text-slate-500 font-mono">
                Lead: {activeEmergency?.hospitalReadiness?.leadDoctor || 'Dr. Priya Sharma (Chief Trauma)'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SOS Modal */}
      <SosModal
        isOpen={isSosOpen}
        onClose={() => setIsSosOpen(false)}
        onConfirm={handleSosConfirm}
        ambulanceId={ambulanceId || 'AMB-101'}
      />
    </div>
  );
};

export default AmbulanceOperatorPanel;