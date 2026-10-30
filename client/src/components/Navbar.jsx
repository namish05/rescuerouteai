import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { 
  Ambulance, 
  Activity, 
  ShieldAlert, 
  Building2, 
  Sparkles, 
  LayoutDashboard, 
  Bell, 
  Menu, 
  X, 
  LogOut, 
  UserCircle, 
  Settings 
} from 'lucide-react';

export const Navbar = () => {
  const { user, role, logout } = useAuth();
  const { lastNotification, clearNotification } = useSocket();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);

  const navLinks = [
    { name: 'Command Center', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Ambulance Panel', path: '/operator', icon: Ambulance },
    { name: 'Traffic Control', path: '/traffic-control', icon: ShieldAlert },
    { name: 'Hospital ER', path: '/hospital', icon: Building2 },
    { name: 'Green Corridor AI', path: '/green-corridor', icon: Sparkles },
    { name: 'Admin Fleet', path: '/admin', icon: Settings },
  ];

  return (
    <nav className="border-b border-slate-800 bg-navy-900/80 backdrop-blur-xl sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Tagline */}
          <div className="flex items-center space-x-3">
            <Link to="/" className="flex items-center space-x-2.5 group">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 via-rose-500 to-emerald-500 p-0.5 shadow-lg shadow-red-500/20 group-hover:scale-105 transition">
                  <div className="w-full h-full bg-navy-900 rounded-[10px] flex items-center justify-center">
                    <Ambulance className="w-5 h-5 text-red-500 group-hover:rotate-6 transition" />
                  </div>
                </div>
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-navy-900 animate-pulse"></span>
              </div>

              <div>
                <span className="text-lg font-display font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-cyan-400 bg-clip-text text-transparent">
                  RescueRoute <span className="text-cyan-400">AI</span>
                </span>
                <p className="text-[10px] text-emerald-400 tracking-wider font-semibold uppercase -mt-1 hidden sm:block">
                  Every Second Saves a Life
                </p>
              </div>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center space-x-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                    isActive
                      ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-sm shadow-cyan-500/10'
                      : 'text-slate-300 hover:text-white hover:bg-navy-800'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Right Action Icons: Notifications & User Profile */}
          <div className="flex items-center space-x-3">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotificationPopup(!showNotificationPopup)}
                className="p-2 rounded-lg bg-navy-800/80 border border-slate-700/60 hover:border-cyan-500/40 text-slate-300 hover:text-white transition relative"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {lastNotification && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotificationPopup && (
                <div className="absolute right-0 mt-2 w-80 bg-navy-900 border border-slate-700 rounded-xl shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-xs font-bold text-slate-200">Incident Broadcasts</span>
                    {lastNotification && (
                      <button
                        onClick={clearNotification}
                        className="text-[10px] text-cyan-400 hover:underline"
                      >
                        Dismiss
                      </button>
                    )}
                  </div>
                  <div className="py-2">
                    {lastNotification ? (
                      <div className="p-2.5 rounded-lg bg-navy-800 border border-cyan-500/20 text-xs">
                        <p className="font-bold text-cyan-300">{lastNotification.title}</p>
                        <p className="text-slate-300 text-[11px] mt-1">{lastNotification.message}</p>
                        <span className="text-[9px] text-slate-500 mt-2 block">
                          {new Date(lastNotification.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    ) : (
                      <p className="text-slate-400 text-xs py-3 text-center">No active priority alerts.</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Role & User Status */}
            <div className="hidden sm:flex items-center space-x-2 bg-navy-800/70 border border-slate-700/60 rounded-lg px-2.5 py-1">
              <UserCircle className="w-4 h-4 text-cyan-400" />
              <div className="text-left text-xs leading-none">
                <span className="font-semibold text-slate-200 block text-[11px] truncate max-w-[120px]">
                  {user?.name || 'Operator'}
                </span>
                <span className="text-[9px] text-emerald-400 uppercase font-mono font-bold tracking-wider">
                  {role?.replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg bg-navy-800 text-slate-300 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-800 py-3 space-y-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm text-slate-300 hover:bg-navy-800 hover:text-white"
                >
                  <Icon className="w-4 h-4 text-cyan-400" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </nav>
  );
};
