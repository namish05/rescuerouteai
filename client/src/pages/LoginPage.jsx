import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Ambulance, 
  ShieldAlert, 
  Building2, 
  Settings, 
  Lock, 
  Mail, 
  ArrowRight, 
  Sparkles,
  CheckCircle2
} from 'lucide-react';

export const LoginPage = () => {
  const { login, demoLogin } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('ambulance@rescueroute.ai');
  const [password, setPassword] = useState('Password123!');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const res = await login(email, password);
      if (res.success) {
        navigate('/dashboard');
      } else {
        setError(res.message || 'Invalid credentials');
      }
    } catch (err) {
      setError('Connection timeout; launching demo mode.');
      await demoLogin('ambulance');
      navigate('/dashboard');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickPreset = async (role, presetEmail, targetPath) => {
    setEmail(presetEmail);
    setPassword('Password123!');
    await demoLogin(role);
    navigate(targetPath);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-red-600 to-rose-600 text-white shadow-xl shadow-red-600/30">
            <Ambulance className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-display font-bold text-white tracking-tight">
            RescueRoute AI Terminal Access
          </h1>
          <p className="text-xs text-slate-400">
            Sign in with authorized credentials or select a test role below
          </p>
        </div>

        {/* 1-Click Role Quick Test Buttons */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-2.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 block">
            1-Click Hackathon Judge Presets
          </span>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => handleQuickPreset('ambulance', 'ambulance@rescueroute.ai', '/operator')}
              className="p-2.5 rounded-xl bg-navy-950 hover:bg-navy-900 border border-red-500/30 hover:border-red-500 text-left transition flex items-center space-x-2"
            >
              <Ambulance className="w-4 h-4 text-red-500 shrink-0" />
              <div>
                <strong className="text-white block text-xs">Paramedic</strong>
                <span className="text-[10px] text-slate-400">AMB-101</span>
              </div>
            </button>

            <button
              onClick={() => handleQuickPreset('traffic_police', 'traffic@rescueroute.ai', '/traffic-control')}
              className="p-2.5 rounded-xl bg-navy-950 hover:bg-navy-900 border border-blue-500/30 hover:border-blue-500 text-left transition flex items-center space-x-2"
            >
              <ShieldAlert className="w-4 h-4 text-blue-400 shrink-0" />
              <div>
                <strong className="text-white block text-xs">Traffic Police</strong>
                <span className="text-[10px] text-slate-400">Corridor Desk</span>
              </div>
            </button>

            <button
              onClick={() => handleQuickPreset('hospital', 'hospital@rescueroute.ai', '/hospital')}
              className="p-2.5 rounded-xl bg-navy-950 hover:bg-navy-900 border border-emerald-500/30 hover:border-emerald-500 text-left transition flex items-center space-x-2"
            >
              <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <strong className="text-white block text-xs">Hospital ER</strong>
                <span className="text-[10px] text-slate-400">AIIMS Trauma</span>
              </div>
            </button>

            <button
              onClick={() => handleQuickPreset('admin', 'admin@rescueroute.ai', '/admin')}
              className="p-2.5 rounded-xl bg-navy-950 hover:bg-navy-900 border border-purple-500/30 hover:border-purple-500 text-left transition flex items-center space-x-2"
            >
              <Settings className="w-4 h-4 text-purple-400 shrink-0" />
              <div>
                <strong className="text-white block text-xs">Command Admin</strong>
                <span className="text-[10px] text-slate-400">Fleet Control</span>
              </div>
            </button>
          </div>
        </div>

        {/* Standard Login Form */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-950 border border-red-500/40 text-red-200 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center space-x-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>Email Address</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-navy-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center space-x-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Password</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-navy-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-cyan-600/30 transition flex items-center justify-center space-x-2"
            >
              <span>{isSubmitting ? 'Authenticating...' : 'Sign In with Credentials'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
