
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import LandingPage from './components/LandingPage';
import { TelemetryPoint, Incident, View } from './types';
import { datadog } from './services/datadogBridge';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentView, setView] = useState<View>(View.DASHBOARD);
  const [telemetry, setTelemetry] = useState<TelemetryPoint[]>(datadog.getTelemetry());
  const [incidents, setIncidents] = useState<Incident[]>(datadog.getIncidents());

  useEffect(() => {
    const unsubscribe = datadog.subscribe(() => {
      setTelemetry(datadog.getTelemetry());
      setIncidents(datadog.getIncidents());
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) {
    return <LandingPage onStart={() => setIsLoggedIn(true)} />;
  }

  return (
    <div className="flex min-h-screen bg-[#0d0e12] animate-in fade-in duration-1000">
      <Sidebar currentView={currentView} setView={setView} onLogout={handleLogout} />
      
      <main className="flex-1 ml-64 p-8 overflow-y-auto h-screen scroll-smooth">
        <div className="max-w-7xl mx-auto pb-12">
          <Dashboard data={telemetry} incidents={incidents} />
        </div>
      </main>

      {incidents.some(i => i.status === 'open' && i.severity === 'critical') && (
        <div className="fixed top-6 right-6 z-[60] animate-in fade-in slide-in-from-right duration-500">
            <div className="bg-red-600/90 backdrop-blur-md text-white px-6 py-3 rounded-2xl shadow-[0_0_30px_rgba(220,38,38,0.5)] flex items-center gap-3 border border-red-400/30">
                <div className="w-2.5 h-2.5 bg-white rounded-full animate-ping"></div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest">SLO Breach Active</p>
                  <p className="text-[10px] opacity-80">Telemetry exceeds safe operational bounds</p>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default App;
