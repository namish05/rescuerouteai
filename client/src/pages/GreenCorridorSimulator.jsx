import React, { useState, useEffect } from 'react';
import { LeafletMap } from '../components/LeafletMap';
import { soundEffects } from '../services/soundEffects';
import { 
  Sparkles, 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle2, 
  ShieldAlert, 
  Clock, 
  ArrowRight, 
  Sliders, 
  TrendingDown,
  AlertTriangle,
  Zap,
  Activity,
  SlidersHorizontal,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';

const BASE_INTERSECTIONS = [
  { id: 'INT-01', name: 'Janpath & Tolstoy Marg Cross', lat: 28.6258, lng: 77.2195, status: 'normal_red', clearedBy: null },
  { id: 'INT-02', name: 'Windsor Place / Ashoka Rd Roundabout', lat: 28.6180, lng: 77.2144, status: 'normal_red', clearedBy: null },
  { id: 'INT-03', name: 'Prithviraj Road Junction', lat: 28.6010, lng: 77.2162, status: 'normal_red', clearedBy: null },
  { id: 'INT-04', name: 'Safdarjung Airport / Ring Rd Flyover', lat: 28.5835, lng: 77.2120, status: 'normal_red', clearedBy: null },
  { id: 'INT-05', name: 'AIIMS Ring Road North Gate Crossing', lat: 28.5695, lng: 77.2085, status: 'normal_red', clearedBy: null }
];

const SIM_STEPS = [
  {
    stepIndex: 0,
    title: 'Incident Dispatched from Connaught Place',
    desc: 'Ambulance departs with critical patient. AI calculates 5 arterial intersections along Janpath towards AIIMS.',
    ambulancePos: [28.6315, 77.2167],
    clearedCount: 0,
    speed: 38,
    elapsedMin: 0
  },
  {
    stepIndex: 1,
    title: 'Intersection 1 Cleared: Janpath & Tolstoy Marg',
    desc: 'Traffic Desk activates green wave. Cross-traffic on Tolstoy halted 45 seconds prior to arrival.',
    ambulancePos: [28.6258, 77.2195],
    clearedCount: 1,
    speed: 52,
    elapsedMin: 2.2
  },
  {
    stepIndex: 2,
    title: 'Intersection 2 Cleared: Windsor Place Roundabout',
    desc: 'Rotary traffic smoothly held. Ambulance maintains high velocity non-stop transit.',
    ambulancePos: [28.6180, 77.2144],
    clearedCount: 2,
    speed: 55,
    elapsedMin: 4.1
  },
  {
    stepIndex: 3,
    title: 'Intersection 3 Cleared: Prithviraj Road Junction',
    desc: 'Lutyens arterial link synchronized. Approaching Safdarjung institutional corridor.',
    ambulancePos: [28.6010, 77.2162],
    clearedCount: 3,
    speed: 58,
    elapsedMin: 6.4
  },
  {
    stepIndex: 4,
    title: 'Intersection 4 Cleared: Safdarjung Flyover Access',
    desc: 'Ring Road bottleneck bypassed smoothly. Hospital ER staff alerted 3 min to arrival.',
    ambulancePos: [28.5835, 77.2120],
    clearedCount: 4,
    speed: 51,
    elapsedMin: 8.8
  },
  {
    stepIndex: 5,
    title: 'Final Gate Cleared: AIIMS North Gate ER Ring Road',
    desc: 'Direct ramp access open. All signals green. Golden Hour achieved with 15 minutes saved.',
    ambulancePos: [28.5672, 77.2100],
    clearedCount: 5,
    speed: 25,
    elapsedMin: 11.0
  }
];

export const GreenCorridorSimulator = () => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeedMs, setPlaybackSpeedMs] = useState(2200);

  // User input settings
  const [simAmbulanceId, setSimAmbulanceId] = useState('AMB-101');
  const [trafficDensity, setTrafficDensity] = useState('Heavy Gridlock (Peak Hour)');
  const [targetCruisingSpeed, setTargetCruisingSpeed] = useState(55);
  const [customIntersections, setCustomIntersections] = useState(BASE_INTERSECTIONS);

  const step = SIM_STEPS[currentStepIndex];

  // Update intersection statuses dynamically per step unless manually overridden
  useEffect(() => {
    setCustomIntersections(prev => 
      prev.map((item, idx) => {
        if (idx < step.clearedCount) {
          return { ...item, status: 'cleared_green', clearedBy: 'Corridor AI Sync' };
        } else if (idx === step.clearedCount && currentStepIndex > 0) {
          return { ...item, status: 'pending_clearance', clearedBy: null };
        } else {
          return { ...item, status: 'normal_red', clearedBy: null };
        }
      })
    );
  }, [currentStepIndex]);

  // Autoplay timer
  useEffect(() => {
    let timer = null;
    if (isPlaying) {
      timer = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev >= SIM_STEPS.length - 1) {
            setIsPlaying(false);
            soundEffects.playSuccessChime();
            return prev;
          }
          soundEffects.playRadioBeep();
          return prev + 1;
        });
      }, playbackSpeedMs);
    }
    return () => clearInterval(timer);
  }, [isPlaying, playbackSpeedMs]);

  const handleNext = () => {
    if (currentStepIndex < SIM_STEPS.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
      soundEffects.playRadioBeep();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
      soundEffects.playRadioBeep();
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStepIndex(0);
    soundEffects.playRadioBeep();
  };

  // Toggle individual signal in simulator
  const toggleSignal = (intId) => {
    setCustomIntersections(prev => 
      prev.map(i => {
        if (i.id === intId) {
          const next = i.status === 'cleared_green' ? 'normal_red' : 'cleared_green';
          return { ...i, status: next, clearedBy: 'Manual User Toggle' };
        }
        return i;
      })
    );
    soundEffects.playRadioBeep();
  };

  // Computed metrics based on traffic density
  const baselineTransitMin = trafficDensity.includes('Heavy') ? 28 : trafficDensity.includes('Moderate') ? 22 : 17;
  const corridorTransitMin = (11 * (55 / targetCruisingSpeed)).toFixed(1);
  const timeSaved = (baselineTransitMin - corridorTransitMin).toFixed(1);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header & Controls */}
      <div className="glass-panel p-5 rounded-2xl border border-purple-500/30 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-display font-extrabold text-white">
              Green Corridor AI Simulation Showcase
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-500/40 text-[10px] font-mono font-bold">
              USER-CONFIGURABLE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Simulate and interact with emergency green corridor wave-length coordination, vehicle velocity, and signal clearance.
          </p>
        </div>

        {/* Simulation Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 shadow-lg ${
              isPlaying
                ? 'bg-amber-600 text-white shadow-amber-600/30'
                : 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white shadow-emerald-600/30'
            }`}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isPlaying ? 'Pause' : 'Auto-Play'}</span>
          </button>

          <button
            onClick={handlePrev}
            disabled={currentStepIndex <= 0}
            className="p-2 rounded-xl bg-navy-800 hover:bg-navy-700 text-slate-200 border border-slate-700 font-semibold text-xs transition disabled:opacity-40"
            title="Step Back"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={handleNext}
            disabled={currentStepIndex >= SIM_STEPS.length - 1}
            className="p-2 rounded-xl bg-navy-800 hover:bg-navy-700 text-slate-200 border border-slate-700 font-semibold text-xs transition disabled:opacity-40"
            title="Step Forward"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={handleReset}
            className="p-2 rounded-xl bg-navy-800 hover:bg-navy-700 text-slate-400 hover:text-white border border-slate-700 transition"
            title="Reset Simulation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* USER INPUT: Simulator Tuning Parameters */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800">
        <div className="text-xs font-bold text-slate-300 mb-3 flex items-center space-x-1.5">
          <SlidersHorizontal className="w-4 h-4 text-purple-400" />
          <span>User Simulator Input Controls</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Ambulance Unit Code</label>
            <input
              type="text"
              value={simAmbulanceId}
              onChange={(e) => setSimAmbulanceId(e.target.value)}
              className="w-full bg-navy-950 border border-slate-700 rounded p-1.5 text-white font-mono"
            />
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Traffic Density Scenario</label>
            <select
              value={trafficDensity}
              onChange={(e) => setTrafficDensity(e.target.value)}
              className="w-full bg-navy-950 border border-slate-700 rounded p-1.5 text-white"
            >
              <option value="Light Traffic / Off-Peak">Light Traffic / Off-Peak</option>
              <option value="Moderate Urban Traffic">Moderate Urban Traffic</option>
              <option value="Heavy Gridlock (Peak Hour)">Heavy Gridlock (Peak Hour)</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-1">
              Target Cruising Speed: <strong className="text-emerald-400">{targetCruisingSpeed} km/h</strong>
            </label>
            <input
              type="range"
              min="35"
              max="75"
              step="5"
              value={targetCruisingSpeed}
              onChange={(e) => setTargetCruisingSpeed(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-1">
              Simulation Playback Speed: <strong className="text-cyan-400">{(playbackSpeedMs / 1000).toFixed(1)}s</strong>
            </label>
            <input
              type="range"
              min="1000"
              max="4000"
              step="400"
              value={playbackSpeedMs}
              onChange={(e) => setPlaybackSpeedMs(Number(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Grid: Map + Timeline Stepper */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Map (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="h-[430px]">
            <LeafletMap
              center={[28.6000, 77.2150]}
              zoom={13}
              ambulancePos={step.ambulancePos}
              routeCoordinates={SIM_STEPS.map(s => s.ambulancePos)}
              intersections={customIntersections}
              isGreenCorridorActive={true}
              onIntersectionClick={(item) => toggleSignal(item.id)}
            />
          </div>

          {/* Real-time Telemetry Gauges */}
          <div className="grid grid-cols-3 gap-3">
            <div className="glass-panel p-3 rounded-xl border border-slate-800 text-center font-mono">
              <span className="text-[10px] text-slate-400 block font-sans">Simulated Velocity</span>
              <strong className="text-emerald-400 text-lg">
                {Math.round((step.speed / 55) * targetCruisingSpeed)} km/h
              </strong>
              <span className="text-[9px] text-slate-500 block">Non-Stop Transit</span>
            </div>

            <div className="glass-panel p-3 rounded-xl border border-slate-800 text-center font-mono">
              <span className="text-[10px] text-slate-400 block font-sans">Signals Pre-Cleared</span>
              <strong className="text-cyan-400 text-lg">{step.clearedCount} / 5</strong>
              <span className="text-[9px] text-slate-500 block">Green Wave Sync</span>
            </div>

            <div className="glass-panel p-3 rounded-xl border border-slate-800 text-center font-mono">
              <span className="text-[10px] text-slate-400 block font-sans">Elapsed Transit Time</span>
              <strong className="text-purple-400 text-lg">{step.elapsedMin} min</strong>
              <span className="text-[9px] text-slate-500 block">ETA Target: {corridorTransitMin}m</span>
            </div>
          </div>

          {/* Interactive Clickable Signals in Simulator */}
          <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Direct Interactive Signal Switches (Click to Toggle Green / Red in Sim)
            </span>
            <div className="grid grid-cols-5 gap-2">
              {customIntersections.map((item, idx) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleSignal(item.id)}
                  className={`p-2 rounded-lg border text-center text-[10px] font-mono font-bold transition ${
                    item.status === 'cleared_green'
                      ? 'bg-emerald-950 border-emerald-500 text-emerald-400'
                      : 'bg-navy-950 border-red-500 text-red-400'
                  }`}
                >
                  <span className="block text-[8px] text-slate-400 font-sans">Node {idx + 1}</span>
                  <span>{item.status === 'cleared_green' ? '🟢 GREEN' : '🔴 RED'}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Step Breakdown & Time Saved Comparison (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Active Step Highlight Card */}
          <div className="glass-panel p-5 rounded-2xl border border-emerald-500/40 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-mono font-bold text-emerald-400">
                PHASE {step.stepIndex + 1} OF 6
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                VEHICLE: {simAmbulanceId}
              </span>
            </div>

            <h3 className="text-base font-bold text-white leading-snug">
              {step.title}
            </h3>

            <p className="text-xs text-slate-300 leading-relaxed">
              {step.desc}
            </p>
          </div>

          {/* Time Saved Comparison Matrix */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
              <TrendingDown className="w-4 h-4 text-emerald-400" />
              <span>Simulated Golden Hour Impact Model</span>
            </h3>

            {/* Standard Traffic */}
            <div className="p-3 rounded-xl bg-navy-950 border border-red-500/30 space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-red-400">Standard Transit ({trafficDensity})</span>
                <span className="font-mono font-bold text-red-400">{baselineTransitMin}.0 min</span>
              </div>
              <p className="text-[11px] text-slate-400">
                5 intersection red-light halts, multiple bottlenecks. High patient transit risk.
              </p>
            </div>

            {/* RescueRoute AI */}
            <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-emerald-300 flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>RescueRoute AI Green Wave Transit</span>
                </span>
                <span className="font-mono font-bold text-emerald-400 text-sm">{corridorTransitMin} min</span>
              </div>
              <p className="text-[11px] text-slate-300">
                Continuous dynamic wave. Zero complete stops. Cruising at {targetCruisingSpeed} km/h.
              </p>
            </div>

            {/* Net Savings Badge */}
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-950 via-teal-950 to-navy-950 border border-emerald-500/50 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-emerald-400 uppercase tracking-wider font-bold block">
                  Net Golden Hour Savings
                </span>
                <strong className="text-xl font-mono text-white">{timeSaved} Minutes Saved</strong>
              </div>
              <div className="text-right font-mono">
                <span className="text-2xl font-bold text-emerald-400">
                  {Math.round(((baselineTransitMin - corridorTransitMin) / baselineTransitMin) * 100)}%
                </span>
                <span className="text-[9px] text-slate-400 block font-sans">Faster Arrival</span>
              </div>
            </div>

            <p className="text-[10px] text-slate-500 italic">
              *Calculated dynamically from user cruising speed ({targetCruisingSpeed} km/h) and scenario density.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GreenCorridorSimulator;