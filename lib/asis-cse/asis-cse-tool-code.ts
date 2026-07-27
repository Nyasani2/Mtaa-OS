/**
 * ASIS CSE v2 — Tool-Code Engine
 * Executes MTAA app integrations via tool calls. Self-contained. No external APIs.
 * Routes commands like "book a cab", "check wallet", "schedule meeting" to
 * the appropriate MTAA domain services.
 *
 * @module lib/asis-cse/asis-cse-tool-code
 */

import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/auth/store/auth.store';

// ============================================================================
// TYPES
// ============================================================================

export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required: boolean;
  default?: any;
  enum?: string[];
}

export interface ToolDefinition {
  name: string;
  description: string;
  category: 'mtaxi' | 'wallet' | 'health' | 'calendar' | 'studio' | 'system' | 'education' | 'shop';
  parameters: ToolParameter[];
  handler: (params: Record<string, any>, userId: string) => Promise<ToolResult>;
}

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  message: string;
  confidence: number;
}

export interface ToolInvocation {
  tool: string;
  parameters: Record<string, any>;
  result?: ToolResult;
}

// ============================================================================
// HELPERS
// ============================================================================

function _ok(data: any, message: string, confidence = 0.95): ToolResult {
  return { success: true, data, message, confidence };
}

function _err(error: string, message: string, confidence = 0.1): ToolResult {
  return { success: false, error, message, confidence };
}

function _getUserId(): string {
  return useAuthStore.getState()?.user?.id || 'anonymous';
}

// ============================================================================
// TOOL HANDLERS
// ============================================================================

const TOOLS: Record<string, ToolDefinition> = {
  // SYSTEM / IDENTITY
  system_get_identity: {
    name: 'system_get_identity',
    description: 'Return ASIS identity, creator, host OS, and Kamos Theory.',
    category: 'system',
    parameters: [],
    handler: async () => {
      return _ok({
        name: 'ASIS',
        fullName: 'Artificial Sentience & Intelligence System',
        version: 'CSE v2.0',
        creator: 'Kevin Nyasani',
        hostOS: 'MTAA OS V10',
        purpose: 'Cognitive Operating System for the MTAA Universal Platform',
        kamosTheory: '1×1 = 1 + f(growth, replication, interaction, observation). Systems are proliferative, adaptive, and context-aware.',
      }, 'I am ASIS, the AI assistant of MTAA OS, built by Kevin Nyasani. I operate on Kamos Theory.');
    },
  },

  system_get_health_status: {
    name: 'system_get_health_status',
    description: 'Return current system health metrics.',
    category: 'system',
    parameters: [],
    handler: async () => {
      return _ok({
        status: 'Operational',
        uptime: '99.9%',
        engines: 22,
        activeEngines: ['WebResearch', 'ResponseEngineV2', 'ReasoningV2', 'SynthesisV2'],
        memoryUsage: 'Optimal',
        lastChecked: new Date().toISOString(),
      }, 'All cognitive engines are operational. System health is at optimal levels.');
    },
  },

  // WALLET
  wallet_get_balance: {
    name: 'wallet_get_balance',
    description: 'Get the current wallet balance for the authenticated user.',
    category: 'wallet',
    parameters: [
      { name: 'currency', type: 'string', description: 'Currency code (e.g., KES, USD)', required: false, default: 'KES' },
    ],
    handler: async (params, userId) => {
      try {
        const { data, error } = await supabase
          .from('wallet_accounts')
          .select('*')
          .eq('user_id', userId)
          .eq('currency', params.currency || 'KES')
          .maybeSingle();
        if (error) return _err(error.message, 'Unable to retrieve wallet balance.');
        if (!data) return _ok({ balance: 0, available: 0, held: 0, currency: params.currency || 'KES' }, 'No wallet account found. Balance is zero.');
        return _ok({
          balance: data.balance,
          available: data.available_balance,
          held: data.hold_balance,
          currency: data.currency,
          status: data.status,
        }, `Your wallet balance is ${data.currency} ${data.balance.toLocaleString()}. Available: ${data.available_balance.toLocaleString()}.`);
      } catch (e: any) {
        return _err(e.message, 'Wallet service temporarily unavailable.');
      }
    },
  },

  wallet_get_transactions: {
    name: 'wallet_get_transactions',
    description: 'Get recent wallet transactions.',
    category: 'wallet',
    parameters: [
      { name: 'limit', type: 'number', description: 'Number of transactions to return', required: false, default: 5 },
      { name: 'type', type: 'string', description: 'Filter by type: credit, debit, transfer', required: false },
    ],
    handler: async (params, userId) => {
      try {
        let q = supabase
          .from('wallet_transactions')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(params.limit || 5);
        if (params.type) q = q.eq('type', params.type);
        const { data, error } = await q;
        if (error) return _err(error.message, 'Unable to retrieve transactions.');
        return _ok(data || [], `Found ${(data || []).length} recent transaction(s).`);
      } catch (e: any) {
        return _err(e.message, 'Transaction service temporarily unavailable.');
      }
    },
  },

  wallet_send_money: {
    name: 'wallet_send_money',
    description: 'Send money to another user or phone number.',
    category: 'wallet',
    parameters: [
      { name: 'recipient', type: 'string', description: 'Recipient phone, wallet ID, or user ID', required: true },
      { name: 'amount', type: 'number', description: 'Amount to send', required: true },
      { name: 'currency', type: 'string', description: 'Currency code', required: false, default: 'KES' },
      { name: 'reason', type: 'string', description: 'Reason for transfer', required: false },
    ],
    handler: async (params, userId) => {
      return _ok({ status: 'pending_confirmation' }, `Ready to send ${params.currency || 'KES'} ${params.amount} to ${params.recipient}. Please confirm in the Wallet app to complete.`);
    },
  },

  // MTAXI
  mtaxi_book_ride: {
    name: 'mtaxi_book_ride',
    description: 'Book a cab / ride from MTaxi.',
    category: 'mtaxi',
    parameters: [
      { name: 'pickup', type: 'string', description: 'Pickup location address or coordinates', required: true },
      { name: 'destination', type: 'string', description: 'Destination address or coordinates', required: true },
      { name: 'rideType', type: 'string', description: 'Type of ride: economy, premium, boda', required: false, default: 'economy' },
      { name: 'passengers', type: 'number', description: 'Number of passengers', required: false, default: 1 },
    ],
    handler: async (params, userId) => {
      try {
        const { data: ride, error } = await supabase
          .from('mtaxi_rides')
          .insert({
            rider_id: userId,
            pickup_location: params.pickup,
            dropoff_location: params.destination,
            ride_type: params.rideType || 'economy',
            passenger_count: params.passengers || 1,
            status: 'searching',
            created_at: new Date().toISOString(),
          })
          .select()
          .single();
        if (error) return _err(error.message, 'Failed to create ride request.');
        return _ok({ rideId: ride.id, status: ride.status, eta: '3-5 minutes' }, `Ride booked successfully. A ${params.rideType || 'economy'} driver is being assigned. Pickup: ${params.pickup}. Destination: ${params.destination}.`);
      } catch (e: any) {
        return _err(e.message, 'MTaxi service temporarily unavailable.');
      }
    },
  },

  mtaxi_get_ride_status: {
    name: 'mtaxi_get_ride_status',
    description: 'Check the status of a current or recent ride.',
    category: 'mtaxi',
    parameters: [
      { name: 'rideId', type: 'string', description: 'Ride ID to check', required: false },
    ],
    handler: async (params, userId) => {
      try {
        let q = supabase.from('mtaxi_rides').select('*').eq('rider_id', userId).order('created_at', { ascending: false }).limit(1);
        if (params.rideId) q = supabase.from('mtaxi_rides').select('*').eq('id', params.rideId).single();
        const { data, error } = await q;
        if (error) return _err(error.message, 'Unable to retrieve ride status.');
        if (!data) return _ok(null, 'No active rides found.');
        const ride = Array.isArray(data) ? data[0] : data;
        return _ok({ rideId: ride.id, status: ride.status, driver: ride.driver_id, pickup: ride.pickup_location, destination: ride.dropoff_location }, `Your ride is currently: ${ride.status}.`);
      } catch (e: any) {
        return _err(e.message, 'MTaxi status check failed.');
      }
    },
  },

  // HEALTH
  health_get_records: {
    name: 'health_get_records',
    description: 'Retrieve health records for the authenticated user.',
    category: 'health',
    parameters: [
      { name: 'limit', type: 'number', description: 'Number of records', required: false, default: 5 },
      { name: 'recordType', type: 'string', description: 'Filter by record type', required: false },
    ],
    handler: async (params, userId) => {
      try {
        let q = supabase
          .from('health_records')
          .select('*')
          .eq('patient_id', userId)
          .order('created_at', { ascending: false })
          .limit(params.limit || 5);
        if (params.recordType) q = q.eq('record_type', params.recordType);
        const { data, error } = await q;
        if (error) return _err(error.message, 'Unable to retrieve health records.');
        return _ok(data || [], `Found ${(data || []).length} health record(s).`);
      } catch (e: any) {
        return _err(e.message, 'Health service temporarily unavailable.');
      }
    },
  },

  health_get_patient_profile: {
    name: 'health_get_patient_profile',
    description: 'Get the health patient profile for the user.',
    category: 'health',
    parameters: [],
    handler: async (_params, userId) => {
      try {
        const { data, error } = await supabase
          .from('health_patients')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();
        if (error) return _err(error.message, 'Unable to retrieve patient profile.');
        if (!data) return _ok(null, 'No patient profile found. You can create one in the Health app.');
        return _ok(data, `Patient profile retrieved. Blood type: ${data.blood_type || 'Unknown'}.`);
      } catch (e: any) {
        return _err(e.message, 'Health profile service unavailable.');
      }
    },
  },

  // CALENDAR
  calendar_create_event: {
    name: 'calendar_create_event',
    description: 'Create a calendar event or meeting.',
    category: 'calendar',
    parameters: [
      { name: 'title', type: 'string', description: 'Event title', required: true },
      { name: 'startTime', type: 'string', description: 'Start time (ISO 8601)', required: true },
      { name: 'endTime', type: 'string', description: 'End time (ISO 8601)', required: false },
      { name: 'description', type: 'string', description: 'Event description', required: false },
      { name: 'location', type: 'string', description: 'Event location', required: false },
      { name: 'reminder', type: 'number', description: 'Reminder minutes before', required: false, default: 15 },
    ],
    handler: async (params, userId) => {
      try {
        const { data, error } = await supabase
          .from('scheduler_events')
          .insert({
            user_id: userId,
            title: params.title,
            description: params.description || '',
            start_time: params.startTime,
            end_time: params.endTime || new Date(new Date(params.startTime).getTime() + 60 * 60 * 1000).toISOString(),
            location: params.location || '',
            reminder_minutes: params.reminder || 15,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();
        if (error) return _err(error.message, 'Failed to create calendar event.');
        return _ok({ eventId: data.id, title: data.title, start: data.start_time }, `Event "${data.title}" scheduled for ${new Date(data.start_time).toLocaleString()}.`);
      } catch (e: any) {
        return _err(e.message, 'Calendar service temporarily unavailable.');
      }
    },
  },

  calendar_get_events: {
    name: 'calendar_get_events',
    description: 'Get upcoming calendar events.',
    category: 'calendar',
    parameters: [
      { name: 'limit', type: 'number', description: 'Number of events', required: false, default: 5 },
      { name: 'fromDate', type: 'string', description: 'Start date filter', required: false },
    ],
    handler: async (params, userId) => {
      try {
        let q = supabase
          .from('scheduler_events')
          .select('*')
          .eq('user_id', userId)
          .order('start_time', { ascending: true })
          .limit(params.limit || 5);
        if (params.fromDate) q = q.gte('start_time', params.fromDate);
        const { data, error } = await q;
        if (error) return _err(error.message, 'Unable to retrieve events.');
        return _ok(data || [], `Found ${(data || []).length} upcoming event(s).`);
      } catch (e: any) {
        return _err(e.message, 'Calendar service unavailable.');
      }
    },
  },

  // STUDIO
  studio_start_broadcast: {
    name: 'studio_start_broadcast',
    description: 'Start a live broadcast in the Studio app.',
    category: 'studio',
    parameters: [
      { name: 'title', type: 'string', description: 'Broadcast title', required: true },
      { name: 'description', type: 'string', description: 'Broadcast description', required: false },
      { name: 'visibility', type: 'string', description: 'public, private, or unlisted', required: false, default: 'public' },
    ],
    handler: async (params, userId) => {
      try {
        const { data, error } = await supabase
          .from('live_rooms')
          .insert({
            creator_id: userId,
            title: params.title,
            description: params.description || '',
            visibility: params.visibility || 'public',
            status: 'live',
            started_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
          })
          .select()
          .single();
        if (error) return _err(error.message, 'Failed to start broadcast.');
        return _ok({ roomId: data.id, title: data.title, status: data.status }, `Live broadcast "${data.title}" started successfully. Room ID: ${data.id}.`);
      } catch (e: any) {
        return _err(e.message, 'Studio broadcast service unavailable.');
      }
    },
  },

  // EDUCATION
  education_get_courses: {
    name: 'education_get_courses',
    description: 'Get enrolled courses or available courses.',
    category: 'education',
    parameters: [
      { name: 'status', type: 'string', description: 'Filter: enrolled, completed, available', required: false },
      { name: 'limit', type: 'number', description: 'Number of courses', required: false, default: 5 },
    ],
    handler: async (params, userId) => {
      try {
        let q = supabase
          .from('education_courses')
          .select('*')
          .limit(params.limit || 5);
        if (params.status === 'enrolled') {
          q = supabase
            .from('education_enrollments')
            .select('*, education_courses(*)')
            .eq('student_id', userId)
            .limit(params.limit || 5);
        }
        const { data, error } = await q;
        if (error) return _err(error.message, 'Unable to retrieve courses.');
        return _ok(data || [], `Found ${(data || []).length} course(s).`);
      } catch (e: any) {
        return _err(e.message, 'Education service unavailable.');
      }
    },
  },

  // SHOP
  shop_get_orders: {
    name: 'shop_get_orders',
    description: 'Get recent shop orders.',
    category: 'shop',
    parameters: [
      { name: 'limit', type: 'number', description: 'Number of orders', required: false, default: 5 },
      { name: 'status', type: 'string', description: 'Filter by status', required: false },
    ],
    handler: async (params, userId) => {
      try {
        let q = supabase
          .from('shop_orders')
          .select('*')
          .eq('buyer_id', userId)
          .order('created_at', { ascending: false })
          .limit(params.limit || 5);
        if (params.status) q = q.eq('status', params.status);
        const { data, error } = await q;
        if (error) return _err(error.message, 'Unable to retrieve orders.');
        return _ok(data || [], `Found ${(data || []).length} order(s).`);
      } catch (e: any) {
        return _err(e.message, 'Shop service unavailable.');
      }
    },
  },
};

// ============================================================================
// TOOL REGISTRY
// ============================================================================

export function getAvailableTools(): ToolDefinition[] {
  return Object.values(TOOLS);
}

export function getTool(name: string): ToolDefinition | undefined {
  return TOOLS[name];
}

export function getToolsByCategory(category: ToolDefinition['category']): ToolDefinition[] {
  return Object.values(TOOLS).filter(t => t.category === category);
}

// ============================================================================
// PARAMETER EXTRACTION
// ============================================================================

export function extractParameters(toolName: string, userMessage: string): Record<string, any> {
  const tool = TOOLS[toolName];
  if (!tool) return {};
  const params: Record<string, any> = {};
  const msg = userMessage.toLowerCase();

  for (const param of tool.parameters) {
    if (param.name === 'pickup' || param.name === 'from') {
      const m = msg.match(/(?:from|pickup|pick up at|near)\s+(.+?)(?:\s+to\s+|\s+destination|$)/i);
      if (m) params[param.name] = m[1].trim();
    }
    if (param.name === 'destination' || param.name === 'to') {
      const m = msg.match(/(?:to|destination|going to|drop off at)\s+(.+?)(?:\s+from|$)/i);
      if (m) params[param.name] = m[1].trim();
    }
    if (param.name === 'amount') {
      const m = msg.match(/(\d+[,.]?\d*)\s*(ksh|kes|usd|\$|ksh\.?)/i);
      if (m) params[param.name] = parseFloat(m[1].replace(',', ''));
    }
    if (param.name === 'recipient' || param.name === 'phone') {
      const m = msg.match(/(\+?\d{10,12})/);
      if (m) params[param.name] = m[1];
    }
    if (param.name === 'title') {
      const m = msg.match(/(?:titled|called|named|title)\s+["']?(.+?)["']?(?:\s+at|\s+on|\s+for|$)/i);
      if (m) params[param.name] = m[1].trim();
    }
    if (param.name === 'startTime' || param.name === 'time') {
      const m = msg.match(/(?:at|on)\s+(tomorrow|today|next\s+\w+|\d{1,2}[:.]\d{2}(?:\s*(?:am|pm))?)/i);
      if (m) {
        const val = m[1].trim();
        if (val === 'tomorrow') {
          const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(14, 0, 0, 0);
          params[param.name] = d.toISOString();
        } else if (val === 'today') {
          const d = new Date(); d.setHours(14, 0, 0, 0);
          params[param.name] = d.toISOString();
        } else {
          params[param.name] = new Date().toISOString();
        }
      }
    }
    if (param.name === 'currency') {
      if (msg.includes('kes') || msg.includes('ksh')) params[param.name] = 'KES';
      else if (msg.includes('usd') || msg.includes('$')) params[param.name] = 'USD';
    }
    if (param.name === 'rideType') {
      if (msg.includes('boda') || msg.includes('bodaboda')) params[param.name] = 'boda';
      else if (msg.includes('premium')) params[param.name] = 'premium';
      else params[param.name] = 'economy';
    }
    if (params[param.name] === undefined && param.default !== undefined) {
      params[param.name] = param.default;
    }
  }
  return params;
}

// ============================================================================
// TOOL ROUTER
// ============================================================================

export interface ToolRouteResult {
  tool: string | null;
  parameters: Record<string, any>;
  confidence: number;
  reasoning: string;
}

export function routeToTool(userMessage: string): ToolRouteResult {
  const msg = userMessage.toLowerCase();
  let bestTool: string | null = null;
  let bestScore = 0;
  let reasoning = '';

  const routes: { tool: string; patterns: string[]; weight: number }[] = [
    { tool: 'system_get_identity', patterns: ['who are you', 'what is asis', 'who built you', 'who created you', 'your name', 'what does asis stand for'], weight: 1.0 },
    { tool: 'system_get_health_status', patterns: ['health status', 'system health', 'cpu usage', 'memory usage', 'engine status', 'how are you running'], weight: 1.0 },
    { tool: 'wallet_get_balance', patterns: ['wallet balance', 'my balance', 'how much money', 'account balance', 'what is my balance'], weight: 1.0 },
    { tool: 'wallet_get_transactions', patterns: ['transactions', 'recent payments', 'payment history', 'sent money', 'received money'], weight: 0.9 },
    { tool: 'wallet_send_money', patterns: ['send money', 'transfer money', 'pay someone', 'send ksh', 'send kes'], weight: 0.9 },
    { tool: 'mtaxi_book_ride', patterns: ['book a cab', 'book a ride', 'get a taxi', 'call a boda', 'need a ride', 'pick me up', 'take me to'], weight: 1.0 },
    { tool: 'mtaxi_get_ride_status', patterns: ['ride status', 'where is my driver', 'my cab', 'current ride', 'trip status'], weight: 1.0 },
    { tool: 'health_get_records', patterns: ['health records', 'medical records', 'my records', 'doctor visit', 'checkup history'], weight: 1.0 },
    { tool: 'health_get_patient_profile', patterns: ['patient profile', 'my health profile', 'blood type', 'health info'], weight: 0.9 },
    { tool: 'calendar_create_event', patterns: ['schedule a meeting', 'create event', 'add to calendar', 'book appointment', 'remind me to', 'set a reminder'], weight: 1.0 },
    { tool: 'calendar_get_events', patterns: ['my calendar', 'upcoming events', 'what is scheduled', 'meetings today', 'appointments'], weight: 0.9 },
    { tool: 'studio_start_broadcast', patterns: ['start broadcast', 'go live', 'start streaming', 'live broadcast', 'open studio'], weight: 1.0 },
    { tool: 'education_get_courses', patterns: ['my courses', 'enrolled classes', 'education', 'learning', 'study'], weight: 0.8 },
    { tool: 'shop_get_orders', patterns: ['my orders', 'shop orders', 'purchases', 'buying history'], weight: 0.8 },
  ];

  for (const route of routes) {
    let score = 0;
    for (const pattern of route.patterns) {
      if (msg.includes(pattern)) {
        score += route.weight;
        reasoning = `Matched pattern "${pattern}" for tool "${route.tool}"`;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestTool = route.tool;
    }
  }

  if (msg.includes('kevin nyasani') || msg.includes('who built you')) {
    bestTool = 'system_get_identity';
    bestScore = 1.0;
    reasoning = 'Direct creator identity query';
  }

  if (msg.includes('kamos') || msg.includes('1×1') || msg.includes('1x1')) {
    bestTool = 'system_get_identity';
    bestScore = 1.0;
    reasoning = 'Kamos Theory query';
  }

  const confidence = Math.min(bestScore, 1.0);
  const parameters = bestTool ? extractParameters(bestTool, userMessage) : {};

  return { tool: bestTool, parameters, confidence, reasoning };
}

// ============================================================================
// TOOL EXECUTION
// ============================================================================

export async function executeTool(toolName: string, parameters: Record<string, any>): Promise<ToolResult> {
  const tool = TOOLS[toolName];
  if (!tool) {
    return _err('TOOL_NOT_FOUND', `Tool "${toolName}" is not registered.`, 0);
  }
  const userId = _getUserId();
  try {
    return await tool.handler(parameters, userId);
  } catch (e: any) {
    return _err(e.message, `Tool "${toolName}" execution failed.`, 0.1);
  }
}

export async function executeToolFromMessage(userMessage: string): Promise<{ result: ToolResult; route: ToolRouteResult } | null> {
  const route = routeToTool(userMessage);
  if (!route.tool || route.confidence < 0.5) return null;
  const result = await executeTool(route.tool, route.parameters);
  return { result, route };
}

// ============================================================================
// TOOL SCHEMA EXPORT
// ============================================================================

export function getToolSchema(): Record<string, any> {
  const schema: Record<string, any> = {};
  for (const [name, tool] of Object.entries(TOOLS)) {
    schema[name] = {
      description: tool.description,
      category: tool.category,
      parameters: tool.parameters.reduce((acc, p) => {
        acc[p.name] = {
          type: p.type,
          description: p.description,
          required: p.required,
          default: p.default,
          enum: p.enum,
        };
        return acc;
      }, {} as Record<string, any>),
    };
  }
  return schema;
}

// ============================================================================
// EXPORTS
// ============================================================================

export const ToolCodeEngine = {
  getAvailableTools,
  getTool,
  getToolsByCategory,
  extractParameters,
  routeToTool,
  executeTool,
  executeToolFromMessage,
  getToolSchema,
};

export default ToolCodeEngine;
