
import React, { useState, useEffect } from 'react';
import { Play, Square, Activity, Gauge, Terminal, AlertCircle } from 'lucide-react';
import { datadog } from '../services/datadogBridge';

const TrafficGenerator: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'normal' | 'spike' | 'failing'>('normal');

  const simulateStep = () => {
    let latency = 0;
    let tokens = 0;
    let hallucination = 0;
    let failure = false;
    let blocked = false;
    let promptLength = 0;

    switch (mode) {
      case 'normal':
        latency = 400 + Math.random() * 200;
        tokens = 300 + Math.random() * 200;
        promptLength = 100 + Math.random() * 50;
        hallucination = Math.random() * 0.1;
        break;
      case 'spike':
        latency = 2200 + Math.random() * 800;
        tokens = 1500 + Math.random() * 1000;
        promptLength = 1200 + Math.random() * 500;
        hallucination = 0.2 + Math.random() * 0.2;
        break;
      case 'failing':
        latency = 120 + Math.random() * 80;
        tokens = 50;
        promptLength = 150;
        hallucination = 0.8 + Math.random() * 0.2;
        failure = Math.random() > 0.4;
        blocked = !failure && Math.random() > 0.5;
        break;
    }

    datadog.pushTelemetry({
      timestamp: Date.now(),
      tokens_used: Math.round(tokens),
      prompt_length: Math.round(promptLength),
      latency_ms: Math.round(latency),
      trace_duration_ms: Math.round(latency + 50),
      cost_usd: Number((tokens * 0.000002).toFixed(5)),
      hallucination_score: hallucination,
      prompt_failure: failure,
      safety_blocked: blocked,
      model: 'gemini-3-flash-preview'
    });
  };

  useEffect(() => {
    let interval: any;
    if (isActive) {
      interval = setInterval(simulateStep, 2000);
    }
    return () => clearInterval(interval);
  }, [isActive, mode]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-1.5">
        {[
          { id: 'normal', label: 'Healthy', icon: Activity, color: 'green' },
          { id: 'spike', label: 'Spike', icon: Gauge, color: 'orange' },
          { id: 'failing', label: 'Failure', icon: AlertCircle, color: 'red' },
        ].map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id as any)}
            className={`py-2 px-1 rounded-lg border text-[8px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 ${
              mode === m.id 
                ? `bg-${m.color}-500/10 border-${m.color}-500/50 text-${m.color}-500` 
                : 'bg-gray-800/30 border-gray-800 text-gray-500 hover:bg-gray-800'
            }`}
          >
            <m.icon size={10} className="shrink-0" />
            <span className="truncate">{m.label}</span>
          </button>
        ))}
      </div>

      <button
        onClick={() => setIsActive(!isActive)}
        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
          isActive 
            ? 'bg-red-600/20 text-red-500 border border-red-500/30 hover:bg-red-600/30' 
            : 'bg-green-600 text-white shadow-lg shadow-green-600/20 hover:bg-green-500'
        }`}
      >
        {isActive ? <Square fill="currentColor" size={10} /> : <Play fill="currentColor" size={10} />}
        {isActive ? 'STOP LIVE TRAFFIC' : 'START LIVE TRAFFIC'}
      </button>

      <div className="flex items-center gap-1.5 text-[8px] text-gray-600 font-mono uppercase tracking-widest leading-tight">
        <Terminal size={10} className="shrink-0" /> 
        <span className="truncate">api.us3.datadoghq.com</span>
      </div>
    </div>
  );
};

export default TrafficGenerator;
