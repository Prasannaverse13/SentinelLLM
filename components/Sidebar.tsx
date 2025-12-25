
import React, { useState, useEffect, useRef } from 'react';
import { LayoutDashboard, ExternalLink, BarChart3, ListTree, Bell, Shield, RefreshCw, CheckCircle2, Terminal, Play, Loader2, Wifi, Zap, LogOut } from 'lucide-react';
import { View } from '../types';
import { datadog } from '../services/datadogBridge';

interface SidebarProps {
  currentView: View;
  setView: (view: View) => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, onLogout }) => {
  const syncStatus = datadog.getSyncStatus();
  const [logs, setLogs] = useState<string[]>(['SNTL-OS v3.0.3 boot complete.', 'Awaiting bridge init...']);
  const [isInitializing, setIsInitializing] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  const ddLinks = [
    { label: 'Metrics Explorer', icon: BarChart3, url: 'https://us3.datadoghq.com/metric/explorer?query=avg%3Asentinel.v3.live.latency%7Bservice%3Asentinel-v3%7D' },
    { label: 'Log Stream', icon: ListTree, url: 'https://us3.datadoghq.com/logs?query=service%3Asentinel-v3' },
    { label: 'SRE Event Feed', icon: Bell, url: 'https://us3.datadoghq.com/event/stream' },
  ];

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  useEffect(() => {
    const unsubscribe = datadog.subscribeLogs((log) => {
      setLogs(prev => [...prev.slice(-50), log]);
    });
    return () => unsubscribe();
  }, []);

  const handleInit = async () => {
    if (isInitializing) return;
    setIsInitializing(true);
    await datadog.runInitialization();
    setIsInitializing(false);
  };

  return (
    <div className="w-64 border-r border-gray-800 bg-[#0d0e12] flex flex-col h-screen fixed left-0 top-0 z-50">
      <div className="p-6 flex items-center gap-3">
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2.5 rounded-xl shadow-lg shadow-indigo-500/20">
          <Shield className="text-white w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white leading-tight">Sentinel</h1>
          <p className="text-[9px] text-indigo-400 font-bold tracking-widest uppercase">V3 Enterprise</p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto custom-scrollbar">
        <p className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em] px-4 mb-2 mt-4">Platform</p>
        <button
          onClick={() => setView(View.DASHBOARD)}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${currentView === View.DASHBOARD ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'text-gray-500 hover:text-gray-300'}`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="font-semibold text-sm">Main Terminal</span>
        </button>

        <div className="pt-8 space-y-1">
          <p className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em] px-4 mb-2">Datadog US3</p>
          {ddLinks.map((link) => (
            <a
              key={link.label}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-gray-500 hover:bg-gray-800/40 hover:text-indigo-400 transition-all group border border-transparent hover:border-gray-700/50"
            >
              <div className="flex items-center gap-3">
                <link.icon className="w-4 h-4" />
                <span className="text-xs font-medium">{link.label}</span>
              </div>
              <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
          ))}
        </div>

        <div className="pt-8 px-4 pb-4">
          <p className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em] flex items-center gap-2 mb-3">
            <Wifi size={10} className="text-indigo-500" /> SRE Tunnel Bridge
          </p>
          <div className="bg-black/90 rounded-xl p-4 border border-gray-800 relative group overflow-hidden h-[240px] flex flex-col font-mono text-[9px]">
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-1.5 leading-tight">
              {logs.map((log, i) => (
                <p key={i} className={`${log.includes('CRITICAL') || log.includes('ERR') ? 'text-rose-500' : log.startsWith('>') ? 'text-indigo-400 font-bold' : log.startsWith('!') ? 'text-amber-500 font-black' : 'text-gray-400'}`}>
                  {log}
                </p>
              ))}
              <div ref={logEndRef} />
            </div>
            
            <button 
              onClick={handleInit}
              disabled={isInitializing}
              className={`mt-4 w-full font-black py-2.5 px-3 rounded-lg text-[10px] flex items-center justify-center gap-2 transition-all shadow-lg uppercase tracking-widest ${isInitializing ? 'bg-gray-800 text-gray-500' : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-600/20'}`}
            >
              {isInitializing ? <Loader2 size={12} className="animate-spin" /> : <Play size={10} fill="white" />}
              {isInitializing ? 'SYNCHRONIZING...' : 'INITIALIZE BRIDGE'}
            </button>
            <div className="absolute inset-0 pointer-events-none opacity-[0.05] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
          </div>
        </div>
      </nav>

      <div className="p-4 border-t border-gray-800 bg-[#0d0e12] space-y-3">
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-all font-bold text-xs"
        >
          <LogOut size={16} />
          End Session
        </button>

        <div className="space-y-4 pt-2 border-t border-gray-800/50">
           <div className="flex justify-between items-center px-1">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Intake Health</p>
              <button onClick={() => window.location.reload()} className="text-gray-600 hover:text-indigo-400 transition-colors">
                <RefreshCw size={12} />
              </button>
           </div>
           <div className="bg-[#111218] rounded-xl p-3 border border-gray-800 space-y-3 shadow-inner max-h-[120px] overflow-y-auto custom-scrollbar">
              {Object.entries(syncStatus).map(([key, info]) => (
                <div key={key} className="space-y-1 border-b border-gray-800/50 last:border-0 pb-2 last:pb-0">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-gray-400 font-bold">{key}</span>
                    <span className={`font-black flex items-center gap-1.5 ${info.status === 'SYNCED' ? 'text-emerald-400' : 'text-amber-500'}`}>
                       {info.status === 'SYNCED' ? <CheckCircle2 size={10} /> : <Zap size={10} />}
                       {info.status}
                    </span>
                  </div>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
