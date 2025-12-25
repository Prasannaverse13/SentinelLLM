
import React, { useMemo, useState, useEffect } from 'react';
import { AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Clock, DollarSign, Bug, Zap, Activity, ShieldAlert, Database, TrendingUp, Info, ListFilter, CheckCircle2, Rocket, Terminal, FileText, Loader2, Sparkles, Download, Layout, PlusCircle, HelpCircle, Eye } from 'lucide-react';
import { TelemetryPoint, Incident, SLOData } from '../types';
import LLMApp from './LLMApp';
import TrafficGenerator from './TrafficGenerator';
import Incidents from './Incidents';
import SLOMonitor from './SLOMonitor';
import { generateRunSummary } from '../services/geminiService';
import { datadog } from '../services/datadogBridge';

interface DashboardProps {
  data: TelemetryPoint[];
  incidents: Incident[];
}

const StatCard = ({ title, value, icon: Icon, color, subtitle }: any) => (
  <div className="bg-[#1a1b23] border border-gray-800 p-6 rounded-2xl shadow-lg transition-all hover:border-gray-700 relative overflow-hidden group">
    <div className={`absolute top-0 right-0 w-32 h-32 bg-${color}-500/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110 pointer-events-none`} />
    <div className="flex items-center gap-4 mb-3">
      <div className={`p-3 rounded-xl bg-${color}-500/10 text-${color}-500 shadow-sm`}>
        <Icon size={24} />
      </div>
      <h3 className="text-gray-500 text-[11px] font-bold uppercase tracking-[0.15em]">{title}</h3>
    </div>
    <div className="flex items-baseline gap-3">
      <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
      {subtitle && <span className="text-[11px] text-gray-500 font-mono font-bold">{subtitle}</span>}
    </div>
  </div>
);

const ExecutiveSummary = ({ data }: { data: TelemetryPoint[] }) => {
  const [summary, setSummary] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (data.length < 3 || isGenerating) return;
    setIsGenerating(true);
    const report = await generateRunSummary(data);
    setSummary(report);
    setIsGenerating(false);
  };

  const healthScore = useMemo(() => {
    if (data.length === 0) return 100;
    const fails = data.filter(d => d.prompt_failure || d.latency_ms > 2000 || d.safety_blocked).length;
    const score = 100 - (fails / data.length * 100);
    return Math.round(score);
  }, [data]);

  return (
    <div className="bg-gradient-to-br from-[#1a1b23] to-[#111218] border border-indigo-500/20 rounded-[2rem] p-6 shadow-2xl relative overflow-hidden h-full flex flex-col">
       <div className="absolute top-0 right-0 p-8 opacity-[0.02] rotate-12 pointer-events-none">
          <FileText size={150} />
       </div>
       
       <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-white font-black text-[11px] uppercase tracking-[0.3em] flex items-center gap-2">
               <Sparkles size={14} className="text-indigo-400" />
               Fleet Report
            </h3>
            <p className="text-[9px] text-gray-500 mt-0.5 font-bold uppercase tracking-widest">AI Synthesis</p>
          </div>
          <div className="text-right">
            <p className="text-[8px] text-gray-500 font-black uppercase tracking-widest">Health Score</p>
            <p className={`text-lg font-black ${healthScore > 80 ? 'text-emerald-400' : healthScore > 50 ? 'text-amber-400' : 'text-rose-500'}`}>{healthScore}%</p>
          </div>
       </div>

       <div className="flex-1 bg-black/40 rounded-2xl border border-gray-800/50 p-5 mb-5 font-medium text-xs leading-relaxed text-gray-300 relative overflow-y-auto custom-scrollbar">
          {!summary && !isGenerating ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-3 opacity-30">
               <FileText size={32} className="text-gray-600" />
               <p className="text-[9px] uppercase tracking-[0.2em] font-black">Awaiting Generation</p>
            </div>
          ) : isGenerating ? (
            <div className="h-full flex flex-col items-center justify-center space-y-3">
               <Loader2 size={24} className="animate-spin text-indigo-500" />
               <p className="text-[8px] uppercase tracking-[0.2em] font-black text-indigo-400 animate-pulse">Processing Stream...</p>
            </div>
          ) : (
            <p className="animate-in fade-in slide-in-from-bottom-2 duration-700 whitespace-pre-wrap">{summary}</p>
          )}
       </div>

       <button 
          onClick={handleGenerate}
          disabled={data.length < 3 || isGenerating}
          className={`w-full py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${data.length < 3 || isGenerating ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/20'}`}
       >
          {isGenerating ? <Loader2 size={12} className="animate-spin" /> : <Rocket size={12} />}
          {isGenerating ? 'Synthesizing...' : 'Generate AI Report'}
       </button>
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ data, incidents }) => {
  const [slos, setSlos] = useState<SLOData[]>(datadog.getSLOs());
  const [showBlueprint, setShowBlueprint] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setSlos(datadog.getSLOs());
    }, 2000);
    return () => clearInterval(timer);
  }, [data]);

  const metrics = useMemo(() => {
    if (data.length === 0) return { latency: '0', cost: '0.0000', hallucination: '0.00', tokens: '0', forecast: '0.00' };
    
    const avgLatency = data.reduce((acc, p) => acc + p.latency_ms, 0) / data.length;
    const totalCost = data.reduce((acc, p) => acc + (p.cost_usd || 0), 0);
    const avgHallucination = data.reduce((acc, p) => acc + p.hallucination_score, 0) / data.length;
    const totalTokens = data.reduce((acc, p) => acc + p.tokens_used, 0);

    const durationSeconds = data.length * 2; 
    const monthlyMultiplier = (30 * 24 * 60 * 60) / (durationSeconds || 1);
    const estimatedMonthlySpend = totalCost * monthlyMultiplier;

    return {
      latency: Math.round(avgLatency).toString(),
      cost: totalCost.toFixed(4),
      hallucination: avgHallucination.toFixed(2),
      tokens: totalTokens.toLocaleString(),
      forecast: estimatedMonthlySpend.toFixed(2)
    };
  }, [data]);

  const chartData = useMemo(() => data.map(d => ({ 
    ...d, 
    time: new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  })), [data]);

  const handleExportConfig = () => {
    const config = {
      monitors: [
        { name: "Sentinel Rule 1: High Latency", query: "avg(last_5m):avg:sentinel.v3.live.latency{service:sentinel-v3} > 2000" },
        { name: "Sentinel Rule 2: Hallucination Spike", query: "avg(last_5m):avg:sentinel.v3.live.hallucination{service:sentinel-v3} > 0.7" },
        { name: "Sentinel Rule 3: Safety Block Rate", query: "avg(last_5m):sum:sentinel.v3.live.safety_block{service:sentinel-v3} > 0.1" }
      ],
      slos: [
        { name: "Inference Performance SLA", threshold: 95, metric: "sentinel.v3.live.latency" },
        { name: "Fleet Content Integrity", threshold: 90, metric: "sentinel.v3.live.hallucination" }
      ]
    };
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'datadog_sentinel_config.json';
    a.click();
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-24">
      {/* Stat Cards Tier */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard title="Avg Latency" value={`${metrics.latency}ms`} icon={Clock} color="purple" />
        <StatCard title="Session Cost" value={`$${metrics.cost}`} icon={DollarSign} color="emerald" />
        <StatCard title="Monthly Forecast" value={`$${metrics.forecast}`} icon={TrendingUp} color="blue" subtitle="EST" />
        <StatCard title="Hallucination" value={metrics.hallucination} icon={Bug} color="orange" />
        <StatCard title="Total Tokens" value={metrics.tokens} icon={Zap} color="indigo" />
      </div>

      {/* Primary Ops Tier */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-stretch">
        <div className="xl:col-span-8 relative group z-10">
           <div className="absolute -inset-4 bg-gradient-to-r from-purple-600/10 to-blue-600/10 rounded-[3rem] blur-3xl opacity-40 group-hover:opacity-60 transition duration-1000 pointer-events-none"></div>
           <LLMApp />
        </div>
        <div className="xl:col-span-4 flex flex-col gap-6 h-full">
           <div className="flex-1"><ExecutiveSummary data={data} /></div>
           <div className="flex-1"><SLOMonitor slos={slos} /></div>
        </div>
      </div>

      {/* Datadog Blueprint Selection Guide */}
      <div className="bg-[#1a1b23] border border-indigo-500/30 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 right-0 p-12 opacity-[0.03] rotate-45 pointer-events-none">
            <Layout size={120} />
          </div>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
               <div className="p-3 bg-indigo-600 rounded-xl shadow-lg">
                 <Layout size={24} className="text-white" />
               </div>
               <div>
                 <h3 className="text-white font-black text-lg tracking-tight">Datadog Dashboard Blueprint</h3>
                 <p className="text-xs text-gray-500 uppercase font-black tracking-widest">Single Pane of Glass Guide</p>
               </div>
            </div>
            <button 
              onClick={() => setShowBlueprint(!showBlueprint)}
              className="px-6 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl text-[10px] font-black uppercase tracking-widest text-white border border-gray-700 transition-all"
            >
              {showBlueprint ? 'Hide Blueprint' : 'Show Blueprint'}
            </button>
          </div>

          {showBlueprint && (
            <div className="space-y-8 animate-in slide-in-from-top-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-5 bg-black/40 rounded-2xl border border-gray-800">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Top Row: Query Value</span>
                  </div>
                  <div className="space-y-4">
                     <div className="space-y-1">
                        <p className="text-[9px] font-bold text-gray-600">Metric 1: Latency</p>
                        <code className="block p-2 bg-black rounded border border-gray-800 text-[10px] text-indigo-400 font-mono break-all leading-tight select-all">{'avg:sentinel.v3.live.latency{service:sentinel-v3}'}</code>
                     </div>
                     <div className="space-y-1">
                        <p className="text-[9px] font-bold text-gray-600">Metric 2: Hallucination</p>
                        <code className="block p-2 bg-black rounded border border-gray-800 text-[10px] text-orange-400 font-mono break-all leading-tight select-all">{'avg:sentinel.v3.live.hallucination{service:sentinel-v3}'}</code>
                     </div>
                  </div>
                </div>

                <div className="p-5 bg-black/40 rounded-2xl border border-gray-800">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Mid Row: Timeseries</span>
                  </div>
                  <div className="space-y-1">
                     <p className="text-[9px] font-bold text-gray-600">Setup Correlation Graph</p>
                     <p className="text-[10px] text-gray-400 leading-snug mb-3">Add two queries to one graph. Set Hallucination to "Right Y-Axis" to see the relationship.</p>
                     <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                        <p className="text-[9px] text-indigo-300 font-bold italic">"This shows how latency spikes often lead to quality drift."</p>
                     </div>
                  </div>
                </div>

                <div className="p-5 bg-black/40 rounded-2xl border border-gray-800">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Monitor Summary Guide</span>
                  </div>
                  <div className="space-y-2">
                     <div className="space-y-1">
                        <p className="text-[9px] font-bold text-gray-600">Step 1: Search Query</p>
                        <code className="block p-2 bg-black rounded border border-gray-800 text-[10px] text-emerald-400 font-mono break-all select-all">service:sentinel-v3</code>
                     </div>
                     <p className="text-[9px] text-gray-500 italic leading-tight">Display: Both (List & Counts). Color: Background. This shows all Sentinel alerts in one box.</p>
                  </div>
                </div>
              </div>

              {/* SLO CREATION GUIDE */}
              <div className="bg-indigo-900/10 border border-indigo-500/30 rounded-3xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-[0.05] pointer-events-none">
                  <HelpCircle size={60} />
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <PlusCircle size={18} className="text-indigo-400" />
                  <h4 className="text-white font-black text-xs uppercase tracking-[0.2em]">Step-by-Step: Fixing "Please select an SLO"</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {[
                    { step: "01", title: "Open SLOs", text: "Go to Datadog Sidebar -> Service Management -> SLOs." },
                    { step: "02", title: "New SLO", text: "Click 'New SLO' and select 'Monitor-Based'." },
                    { step: "03", title: "Link Monitor", text: "Search for 'AI Quality Drift' and set target to 95%." },
                    { step: "04", title: "Add Widget", text: "Return to Dashboard, add SLO widget, and pick your new SLO!" }
                  ].map((s) => (
                    <div key={s.step} className="space-y-2">
                       <span className="text-[9px] font-black text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">{s.step}</span>
                       <h5 className="text-[10px] font-bold text-gray-200">{s.title}</h5>
                       <p className="text-[9px] text-gray-500 leading-tight font-medium">{s.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
      </div>

      {/* Telemetry and Monitoring Tier */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4">
        {/* Charts Column */}
        <div className="lg:col-span-6 space-y-8">
          <div className="bg-[#1a1b23] border border-gray-800 p-8 rounded-3xl shadow-xl">
             <div className="flex items-center justify-between mb-6">
               <h3 className="text-white font-bold text-sm flex items-center gap-3 uppercase tracking-widest">
                 <Activity size={20} className="text-purple-500" /> Latency Live Stream
               </h3>
               <span className="text-[10px] font-mono text-gray-600 uppercase tracking-widest bg-black/30 px-3 py-1 rounded-full">Interval: 2s</span>
             </div>
             <div className="h-[250px] w-full">
               <ResponsiveContainer width="100%" height={250}>
                 <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                   <defs>
                     <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#9333ea" stopOpacity={0.2}/>
                       <stop offset="95%" stopColor="#9333ea" stopOpacity={0}/>
                     </linearGradient>
                   </defs>
                   <CartesianGrid strokeDasharray="3 3" stroke="#2d2e3a" vertical={false} />
                   <XAxis dataKey="time" hide />
                   <YAxis stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} />
                   <Tooltip 
                     contentStyle={{ backgroundColor: '#111218', border: '1px solid #374151', borderRadius: '12px', fontSize: '11px' }}
                     labelStyle={{ color: '#9ca3af', marginBottom: '6px' }}
                   />
                   <Area type="monotone" dataKey="latency_ms" stroke="#9333ea" fillOpacity={1} fill="url(#colorLatency)" strokeWidth={3} isAnimationActive={false} name="Latency (ms)" />
                 </AreaChart>
               </ResponsiveContainer>
             </div>
          </div>

          <div className="bg-[#1a1b23] border border-gray-800 p-8 rounded-3xl shadow-xl">
             <div className="flex items-center justify-between mb-6">
               <h3 className="text-white font-bold text-sm flex items-center gap-3 uppercase tracking-widest">
                 <Zap size={20} className="text-indigo-500" /> Token Velocity
               </h3>
               <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-bold uppercase tracking-wider border border-indigo-500/20">
                 <TrendingUp size={12} /> Live Flow
               </div>
             </div>
             <div className="h-[250px] w-full">
               <ResponsiveContainer width="100%" height={250}>
                 <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                     <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                       <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                     </linearGradient>
                   </defs>
                   <CartesianGrid strokeDasharray="3 3" stroke="#2d2e3a" vertical={false} />
                   <XAxis dataKey="time" hide />
                   <YAxis stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} />
                   <Tooltip 
                      contentStyle={{ backgroundColor: '#111218', border: '1px solid #374151', borderRadius: '12px', fontSize: '11px' }}
                      labelStyle={{ color: '#9ca3af', marginBottom: '6px' }}
                   />
                   <Area type="stepAfter" dataKey="tokens_used" stroke="#6366f1" fillOpacity={1} fill="url(#colorTokens)" strokeWidth={3} isAnimationActive={false} name="Tokens/Req" />
                 </AreaChart>
               </ResponsiveContainer>
             </div>
          </div>
        </div>

        {/* Incidents Column */}
        <div className="lg:col-span-3">
          <div className="bg-[#1a1b23] border border-gray-800 rounded-3xl p-6 shadow-xl h-full flex flex-col">
             <h3 className="text-white font-bold text-xs flex items-center gap-3 uppercase tracking-widest mb-6 border-b border-gray-800 pb-4">
               <ShieldAlert size={18} className="text-red-500" /> Fleet Incident Feed
             </h3>
             <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
               <Incidents incidents={incidents} />
             </div>
          </div>
        </div>

        {/* Load Controller Column */}
        <div className="lg:col-span-3">
          <div className="bg-[#1a1b23] border border-gray-800 rounded-3xl p-6 shadow-xl h-full flex flex-col">
             <h3 className="text-white font-bold text-xs flex items-center gap-3 uppercase tracking-widest mb-6 border-b border-gray-800 pb-4">
               <Database size={18} className="text-emerald-500" /> Load Controller
             </h3>
             <div className="flex-1">
               <TrafficGenerator />
             </div>
             <div className="mt-4 pt-4 border-t border-gray-800">
               <button 
                 onClick={handleExportConfig}
                 className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700 hover:text-white transition-all"
               >
                 <Download size={12} /> Export Datadog JSON
               </button>
             </div>
          </div>
        </div>
      </div>

      {/* Telemetry Registry Footer */}
      <div className="pt-8">
        <div className="bg-[#1a1b23]/40 border border-gray-800/60 rounded-[3rem] p-10 backdrop-blur-sm">
           <div className="flex items-center gap-6 mb-10">
              <div className="p-4 bg-gray-800 rounded-2xl text-indigo-400 shadow-xl">
                 <ListFilter size={28} />
              </div>
              <div>
                <h3 className="text-white font-bold text-xl tracking-tight leading-tight">Telemetry Registry</h3>
                <p className="text-gray-500 text-xs mt-1">Full OTLP schema definitions for the Datadog platform</p>
              </div>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { name: 'sentinel.v3.live.latency', type: 'Gauge', unit: 'ms', desc: 'Inference latency monitoring' },
                { name: 'sentinel.v3.live.cost', type: 'Gauge', unit: 'USD', desc: 'Real-time billing ingestion' },
                { name: 'sentinel.v3.live.hallucination', type: 'Gauge', unit: 'Score', desc: 'Gemini-calculated drift score' },
                { name: 'sentinel.v3.live.safety_block', type: 'Gauge', unit: 'Flag', desc: 'Binary safety filter status' },
              ].map((m) => (
                <div key={m.name} className="p-6 bg-black/30 rounded-2xl border border-gray-800 hover:border-indigo-500/30 transition-all group">
                   <div className="flex justify-between items-center mb-4">
                     <span className="text-[9px] font-black text-indigo-400 font-mono tracking-widest uppercase">{m.type}</span>
                     <div className="px-2 py-0.5 bg-indigo-500/10 rounded-lg text-[9px] text-indigo-500 font-black border border-indigo-500/20">{m.unit}</div>
                   </div>
                   <h4 className="text-xs font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors break-all leading-snug">{m.name}</h4>
                   <p className="text-[10px] text-gray-500 leading-relaxed font-medium">{m.desc}</p>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
