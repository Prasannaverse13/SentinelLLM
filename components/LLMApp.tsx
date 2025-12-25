
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Activity, Terminal, ShieldCheck, Zap, DollarSign, Bug } from 'lucide-react';
import { generateLLMResponse, checkHallucination } from '../services/geminiService';
import { datadog } from '../services/datadogBridge';
import { ChatMessage } from '../types';

const WELCOME_MESSAGE = `Sentinel Kernel v3.0.3 Online. 

Fleet Observability established. Here is how I monitor your AI Production Stack:

• Cost Control: Real-time token tracking and USD expenditure forecasting.
• Quality Assurance: Automatic hallucination detection and drift scoring (0.0 - 1.0).
• Performance SRE: Latency monitoring (SLA/SLO tracking) and throughput analysis.
• Incident RCA: Automated root cause analysis for model failures or safety blocks.

How can I assist with your LLM Fleet operations today?`;

const LLMApp: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: WELCOME_MESSAGE }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMsgRaw = input.trim();
    const traceStart = performance.now();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsgRaw }]);
    setIsLoading(true);

    try {
      const result = await generateLLMResponse(userMsgRaw);
      const text = result.text || "[EMPTY RESPONSE]";
      const hallucination = await checkHallucination(userMsgRaw, text);
      
      const telemetryPoint = {
        timestamp: Date.now(),
        tokens_used: result.tokens,
        prompt_length: result.promptLength,
        latency_ms: result.latency,
        trace_duration_ms: Math.round(performance.now() - traceStart),
        cost_usd: result.tokens * 0.000002,
        hallucination_score: hallucination.score,
        prompt_failure: false,
        safety_blocked: result.safetyBlocked,
        model: result.model
      };

      datadog.pushTelemetry(telemetryPoint);
      setMessages(prev => [...prev, { role: 'assistant', content: text }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "System Error: Connection to LLM Fleet interrupted. Check SRE Tunnel Bridge status." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative z-10 flex flex-col h-[600px] bg-[#1a1b23] rounded-[2.5rem] border-2 border-purple-500/30 overflow-hidden shadow-2xl w-full transition-all backdrop-blur-xl">
      <div className="p-6 border-b border-gray-800 bg-[#111218] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-600 rounded-xl shadow-lg shadow-purple-600/20">
                <Terminal size={20} className="text-white" />
            </div>
            <div>
                <h3 className="font-black text-white text-base tracking-tight leading-none mb-1">Sentinel SRE Console</h3>
                <p className="text-[9px] text-gray-500 uppercase font-black tracking-[0.2em]">Enterprise Fleet Interface</p>
            </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-green-500 bg-green-500/10 px-4 py-1.5 rounded-full border border-green-500/20 font-black uppercase tracking-[0.1em]">
            <Activity size={12} className="animate-pulse" />
            Active Observability
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm scroll-smooth bg-[#1a1b23]/30 custom-scrollbar">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-4 animate-in slide-in-from-bottom-4 duration-500 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg border border-white/5 ${m.role === 'assistant' ? 'bg-purple-600' : 'bg-indigo-600'}`}>
              {m.role === 'assistant' ? <Bot size={20} className="text-white" /> : <User size={20} className="text-white" />}
            </div>
            <div className={`max-w-[85%] p-5 rounded-2xl leading-relaxed text-sm shadow-md font-medium whitespace-pre-wrap ${m.role === 'assistant' ? 'bg-gray-800/90 text-gray-100 border border-gray-700/50' : 'bg-purple-600 text-white border border-purple-400/30'}`}>
                {m.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-4">
             <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-600 animate-pulse shadow-lg">
                <Loader2 className="animate-spin text-white" size={20} />
             </div>
             <div className="p-5 rounded-2xl bg-gray-800/40 italic text-gray-400 border border-gray-800/50 text-sm flex items-center gap-4">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce delay-75"></span>
                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce delay-150"></span>
                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce delay-300"></span>
                </div>
                Synthesizing fleet telemetry...
             </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      <div className="p-6 border-t border-gray-800 bg-[#111218] shrink-0">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Query fleet status or prompt model..."
            className="flex-1 bg-gray-950/80 border border-gray-800 rounded-xl px-5 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all font-medium"
            autoComplete="off"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white px-6 rounded-xl transition-all shadow-lg flex items-center justify-center group"
          >
            <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default LLMApp;
