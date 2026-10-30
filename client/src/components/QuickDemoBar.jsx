import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { soundEffects } from '../services/soundEffects';
import { Siren, Volume2, VolumeX, ShieldAlert, Sparkles, Radio, CheckCircle, Navigation } from 'lucide-react';

export const QuickDemoBar = () => {
  const { role, demoLogin } = useAuth();
  const { isConnected } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const [muted, setMuted] = useState(soundEffects.getIsMuted());

  const handleRoleChange = async (targetRole, targetPath) => {
    await demoLogin(targetRole);
    navigate(targetPath);
  };

  const handleToggleSound = () => {
    const isNowMuted = soundEffects.toggleMute();
    setMuted(isNowMuted);
    if (!isNowMuted) {
      soundEffects.playRadioBeep();
    }
  };

  return (
    <header role="banner" className="bg-navy-900/90 backdrop-blur-md border-b border-cyan-500/20 text-xs px-4 py-2 sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left: Hackathon / System Badge */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 bg-cyan-950/80 text-cyan-300 px-2.5 py-1 rounded-full border border-cyan-500/30">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
            <span className="font-semibold tracking-wide">RESCUEROUTE AI</span>
            <span className="text-slate-400">|</span>
            <span className="text-[10px] text-cyan-200">DEMO CONTROL HUD</span>
          </div>

          <div className="hidden sm:flex items-center space-x-1.5 text-slate-400">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
            <span>{isConnected ? 'Live WebSockets' : 'Connecting...'}</span>
          </div>
        </div>

        {/* Center: 1-Click Role Switcher */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          <span className="text-slate-400 hidden md:inline mr-1 font-medium">Switch Role:</span>

          <button
            onClick={() => handleRoleChange('ambulance', '/operator')}
            className={`px-2.5 py-1 rounded flex items-center space-x-1.5 transition font-medium ${
              role === 'ambulance' && location.pathname === '/operator'
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/30 font-bold'
                : 'bg-navy-800 text-slate-300 hover:bg-navy-700'
            }`}
          >
            <span>🚑</span>
            <span>Ambulance</span>
          </button>

          <button
            onClick={() => handleRoleChange('traffic_police', '/traffic-control')}
            className={`px-2.5 py-1 rounded flex items-center space-x-1.5 transition font-medium ${
              role === 'traffic_police' && location.pathname === '/traffic-control'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-bold'
                : 'bg-navy-800 text-slate-300 hover:bg-navy-700'
            }`}
          >
            <span>🚦</span>
            <span>Traffic Police</span>
          </button>

          <button
            onClick={() => handleRoleChange('hospital', '/hospital')}
            className={`px-2.5 py-1 rounded flex items-center space-x-1.5 transition font-medium ${
              role === 'hospital' && location.pathname === '/hospital'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 font-bold'
                : 'bg-navy-800 text-slate-300 hover:bg-navy-700'
            }`}
          >
            <span>🏥</span>
            <span>Hospital ER</span>
          </button>

          <button
            onClick={() => navigate('/green-corridor')}
            className={`px-2.5 py-1 rounded flex items-center space-x-1.5 transition font-medium ${
              location.pathname === '/green-corridor'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 font-bold'
                : 'bg-navy-800 text-purple-300 hover:bg-navy-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Corridor Simulator</span>
          </button>
        </div>

        {/* Right: Sound FX toggle & Quick Audio Test */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleToggleSound}
            title={muted ? 'Unmute Emergency Audio' : 'Mute Audio'}
            className="p-1.5 rounded bg-navy-800 hover:bg-navy-700 text-slate-300 transition"
          >
            {muted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>

          <button
            onClick={() => soundEffects.playSiren(2500)}
            title="Trigger Paramedic Siren Effect"
            className="px-2 py-1 rounded bg-red-950/70 border border-red-500/40 text-red-300 hover:bg-red-900/60 transition flex items-center space-x-1 font-medium"
          >
            <Siren className="w-3.5 h-3.5 animate-pulse text-red-400" />
            <span className="hidden lg:inline">Siren Sound</span>
          </button>
        </div>
      </div>
    </header>
  );
};
