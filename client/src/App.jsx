import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { QuickDemoBar } from './components/QuickDemoBar';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

// Pages
import { LandingPage } from './pages/LandingPage';
import { OperationsDashboard } from './pages/OperationsDashboard';
import { AmbulanceOperatorPanel } from './pages/AmbulanceOperatorPanel';
import { TrafficControlPanel } from './pages/TrafficControlPanel';
import { HospitalDashboard } from './pages/HospitalDashboard';
import { GreenCorridorSimulator } from './pages/GreenCorridorSimulator';
import { AdminPanel } from './pages/AdminPanel';
import { LoginPage } from './pages/LoginPage';

export function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <div className="min-h-screen flex flex-col bg-navy-950 text-slate-100">
            {/* Top Persistent Demo Control HUD */}
            <QuickDemoBar />

            {/* Main Navigation Bar */}
            <Navbar />

            {/* Application Views */}
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/dashboard" element={<OperationsDashboard />} />
                <Route path="/operator" element={<AmbulanceOperatorPanel />} />
                <Route path="/traffic-control" element={<TrafficControlPanel />} />
                <Route path="/hospital" element={<HospitalDashboard />} />
                <Route path="/green-corridor" element={<GreenCorridorSimulator />} />
                <Route path="/admin" element={<AdminPanel />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>

            {/* Footer */}
            <Footer />
          </div>
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
