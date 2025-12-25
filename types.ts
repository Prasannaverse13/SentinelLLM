
export interface TelemetryPoint {
  timestamp: number;
  tokens_used: number;
  prompt_length: number; 
  latency_ms: number;
  trace_duration_ms: number;
  cost_usd: number;
  hallucination_score: number;
  prompt_failure: boolean;
  safety_blocked: boolean;
  model: string;
}

export interface Incident {
  id: string;
  title: string;
  status: 'open' | 'resolved';
  severity: 'critical' | 'warning' | 'info';
  timestamp: number;
  root_cause?: string;
  runbook?: string;
  metrics_context?: string;
  signal_data?: string;
}

export interface SLOData {
  name: string;
  current: number;
  target: number;
  status: 'healthy' | 'warning' | 'breached';
  description: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export enum View {
  DASHBOARD = 'dashboard',
  INCIDENTS = 'incidents',
  TRAFFIC_GEN = 'traffic_gen'
}
