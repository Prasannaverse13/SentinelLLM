
import React from 'react';
import { Target, CheckCircle2, AlertTriangle, ShieldX, Info } from 'lucide-react';
import { SLOData } from '../types';

interface SLOMonitorProps {
  slos: SLOData[];
}

const SLOMonitor: React.FC<SLOMonitorProps> = ({ slos }) => {
  return (
    <div className="bg-[#1a1b23] border border-gray-800 rounded-[2rem] p-6 shadow-xl h-full flex flex-col">
      <div className="flex items-center justify-between mb-6 border-b border-gray-800 pb-4">
        <h3 className="text-white font-bold text-xs flex items-center gap-3 uppercase tracking-widest">
          <Target size={18} className="text-blue-500" /> SLO Status Center
        </h3>
        <div className="bg-blue-500/10 px-3 py-1 rounded-full text-[8px] text-blue-400 font-black uppercase border border-blue-500/20">
          7-Day Window
        </div>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto custom-scrollbar pr-2">
        {slos.map((slo) => (
          <div key={slo.name} className="group">
            <div className="flex justify-between items-center mb-2">
              <div>
                <h4 className="text-xs font-bold text-gray-200 group-hover:text-blue-400 transition-colors">{slo.name}</h4>
                <p className="text-[9px] text-gray-500 font-medium uppercase tracking-tight">{slo.description}</p>
              </div>
              <div className="text-right">
                <span className={`text-[11px] font-black ${slo.status === 'healthy' ? 'text-emerald-400' : slo.status === 'warning' ? 'text-amber-500' : 'text-rose-500'}`}>
                  {slo.current.toFixed(1)}%
                </span>
                <p className="text-[8px] text-gray-600 font-bold uppercase">Target: {slo.target}%</p>
              </div>
            </div>
            
            <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden flex">
              <div 
                className={`h-full transition-all duration-1000 ${slo.status === 'healthy' ? 'bg-emerald-500' : slo.status === 'warning' ? 'bg-amber-500' : 'bg-rose-500'}`} 
                style={{ width: `${slo.current}%` }} 
              />
            </div>

            <div className="mt-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              {slo.status === 'healthy' ? (
                <div className="flex items-center gap-1 text-[8px] text-emerald-500 font-bold uppercase">
                  <CheckCircle2 size={10} /> Compliant
                </div>
              ) : slo.status === 'warning' ? (
                <div className="flex items-center gap-1 text-[8px] text-amber-500 font-bold uppercase">
                  <AlertTriangle size={10} /> Near Breach
                </div>
              ) : (
                <div className="flex items-center gap-1 text-[8px] text-rose-500 font-bold uppercase">
                  <ShieldX size={10} /> SLO Violation
                </div>
              )}
            </div>
          </div>
        ))}

        {slos.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center opacity-30 text-center py-8">
            <Info size={32} className="mb-2" />
            <p className="text-[10px] uppercase font-bold tracking-widest leading-relaxed">
              Synthesizing SLO Window...<br/>Needs more telemetry
            </p>
          </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-800">
        <p className="text-[8px] text-gray-600 font-bold uppercase text-center tracking-[0.15em]">
          Monitored via Datadog Service Level Objectives
        </p>
      </div>
    </div>
  );
};

export default SLOMonitor;
