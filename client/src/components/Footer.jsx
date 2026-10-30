import React from 'react';
import { HeartPulse, ShieldAlert, Cpu, Radio, Github } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="border-t border-slate-800 bg-navy-950/90 text-slate-400 text-xs py-8 px-4 mt-auto">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        {/* Col 1 */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded bg-red-600 flex items-center justify-center text-white">
              <HeartPulse className="w-4 h-4" />
            </div>
            <span className="font-display font-bold text-base text-white">RescueRoute AI</span>
          </div>
          <p className="text-slate-400 leading-relaxed text-[11px]">
            AI-powered emergency ambulance traffic management system designed to eliminate avoidable delays in the Golden Hour.
          </p>
          <div className="inline-block px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/30 text-emerald-400 font-semibold text-[10px]">
            “Every Second Saves a Life.”
          </div>
        </div>

        {/* Col 2: System Capabilities */}
        <div className="space-y-2">
          <h4 className="text-slate-200 font-bold uppercase tracking-wider text-[11px]">Capabilities</h4>
          <ul className="space-y-1.5 text-[11px]">
            <li className="flex items-center space-x-1.5 hover:text-cyan-300">
              <span className="text-emerald-400">✓</span>
              <span>Dynamic Green Corridor Synchronization</span>
            </li>
            <li className="flex items-center space-x-1.5 hover:text-cyan-300">
              <span className="text-emerald-400">✓</span>
              <span>Real-Time Traffic Police Desks</span>
            </li>
            <li className="flex items-center space-x-1.5 hover:text-cyan-300">
              <span className="text-emerald-400">✓</span>
              <span>Hospital ER Trauma Bay Pre-Alerts</span>
            </li>
            <li className="flex items-center space-x-1.5 hover:text-cyan-300">
              <span className="text-emerald-400">✓</span>
              <span>AI Multi-Route Delay Minimization</span>
            </li>
          </ul>
        </div>

        {/* Col 3: Architecture */}
        <div className="space-y-2">
          <h4 className="text-slate-200 font-bold uppercase tracking-wider text-[11px]">Architecture Stack</h4>
          <p className="text-[11px] leading-relaxed">
            Frontend: React 18, Vite, Tailwind CSS, Leaflet Maps, Web Audio API.<br/>
            Backend: Node.js, Express, MongoDB Atlas Mongoose, Socket.IO WebSockets.
          </p>
          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="bg-navy-800 px-2 py-0.5 rounded border border-slate-700 text-[10px]">OSRM</span>
            <span className="bg-navy-800 px-2 py-0.5 rounded border border-slate-700 text-[10px]">Leaflet</span>
            <span className="bg-navy-800 px-2 py-0.5 rounded border border-slate-700 text-[10px]">Socket.IO</span>
            <span className="bg-navy-800 px-2 py-0.5 rounded border border-slate-700 text-[10px]">JWT Role Auth</span>
          </div>
        </div>

        {/* Col 4: Safety Notice */}
        <div className="space-y-2">
          <h4 className="text-amber-400 font-bold uppercase tracking-wider text-[11px] flex items-center space-x-1">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Safety Notice</span>
          </h4>
          <p className="text-[10px] text-slate-400 leading-relaxed bg-navy-900/60 p-2.5 rounded-lg border border-slate-800">
            RescueRoute AI simulates traffic signal synchronization and lets authorized personnel coordinate traffic clearance. The prototype does not independently override municipal physical signals without official authorization.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
        <p>© 2025 RescueRoute AI — Built for Emergency Response Innovation.</p>
        <p className="font-mono text-cyan-500/80">Live Prototype v2.4 | All telemetry simulated for demonstration</p>
      </div>
    </footer>
  );
};
