
import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, Zap, Loader2, BookOpen, Fingerprint } from 'lucide-react';
import { Incident } from '../types';
import { datadog } from '../services/datadogBridge';
import { analyzeRootCause } from '../services/geminiService';

interface IncidentsProps {
  incidents: Incident[];
}

const Incidents: React.FC<IncidentsProps> = ({ incidents }) => {
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  const handleAnalyze = async (inc: Incident) => {
    setAnalyzingId(inc.id);
    const analysis = await analyzeRootCause(inc.title, inc.metrics_context || "No context available");
    datadog.updateIncidentAIFields(inc.id, analysis.rootCause, analysis.runbook);
    setAnalyzingId(null);
  };

  if (incidents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 opacity-30 grayscale">
        <CheckCircle2 size={40} className="text-green-500 mb-2" />
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Systems Nominal</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {incidents.map((inc) => (
        <div key={inc.id} className={`p-4 rounded-xl border transition-all ${inc.status === 'resolved' ? 'border-gray-900 bg-gray-900/20 opacity-50' : (inc.severity === 'critical' ? 'border-red-900/50 bg-red-900/5 shadow-lg shadow-red-900/5' : 'border-orange-900/50 bg-orange-900/5')}`}>
          <div className="flex justify-between items-start gap-3 mb-3">
            <div className="flex gap-3">
              <AlertCircle size={16} className={inc.severity === 'critical' ? 'text-red-500' : 'text-orange-500'} />
              <div>
                <h4 className="text-xs font-bold text-white leading-tight mb-1">{inc.title}</h4>
                <p className="text-[9px] text-gray-500 font-mono">{new Date(inc.timestamp).toLocaleTimeString()}</p>
              </div>
            </div>
            {inc.status === 'open' && (
              <button 
                onClick={() => datadog.resolveIncident(inc.id)}
                className="text-[8px] font-black text-gray-500 hover:text-white uppercase tracking-widest border border-gray-800 px-2 py-1 rounded-lg bg-black/40"
              >
                Resolve
              </button>
            )}
          </div>

          <div className="space-y-3">
            <div className="bg-black/40 p-2.5 rounded-lg border border-gray-800/50">
              <div className="flex items-center gap-2 mb-1.5 opacity-60">
                <Fingerprint size={10} className="text-blue-400" />
                <span className="text-[8px] font-black uppercase tracking-widest text-blue-400">Signal Context</span>
              </div>
              <p className="text-[10px] text-gray-400 leading-relaxed italic">{inc.signal_data || inc.metrics_context}</p>
            </div>

            {inc.root_cause && (
              <div className="bg-purple-900/10 p-3 rounded-lg border border-purple-500/20 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-2 mb-2">
                  <Zap size={10} className="text-purple-400" />
                  <span className="text-[8px] font-black uppercase tracking-widest text-purple-400">Root Cause Analysis</span>
                </div>
                <p className="text-[10px] text-gray-200 leading-relaxed font-medium mb-3">{inc.root_cause}</p>
                
                {inc.runbook && (
                  <div className="pt-2 border-t border-purple-500/10">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen size={10} className="text-emerald-400" />
                      <span className="text-[8px] font-black uppercase tracking-widest text-emerald-400">Recommended Runbook</span>
                    </div>
                    <div className="space-y-1.5">
                      {inc.runbook.split('\n').map((step, i) => (
                        <div key={i} className="flex gap-2 items-start">
                          <span className="text-[9px] text-emerald-500 font-black">{i+1}.</span>
                          <p className="text-[9px] text-gray-400 leading-tight font-medium">{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!inc.root_cause && inc.status === 'open' && (
              <button 
                onClick={() => handleAnalyze(inc)}
                disabled={!!analyzingId}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest bg-purple-600 text-white hover:bg-purple-500 transition-all shadow-lg shadow-purple-600/20 disabled:opacity-50"
              >
                {analyzingId === inc.id ? <Loader2 className="animate-spin" size={12} /> : <Zap size={12} />}
                Generate SRE Insights
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Incidents;
