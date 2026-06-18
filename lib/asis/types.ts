// ASIS v3 — M-Theory Knowledge Network Types
// 1 × 1 = 1 + f(growth, replication, interaction, observation)
// Intelligence emerges from network topology, not model weights

// ═══════════════════════════════════════════════════════════════
// CORE M-THEORY TYPES
// ═══════════════════════════════════════════════════════════════

export interface GrowthFactor {
  base: number;
  constitutional: number;
  interaction: number;
  observation: number;
  computed: number;
  immune: number;
  final: number;
}

export interface GrowthEvent {
  id: string;
  entityA: string;
  entityB: string;
  context: string;
  domain: AsisDomain;
  factor: GrowthFactor;
  spawned: SpawnedCapability[];
  timestamp: string;
  userId: string;
}

export interface SpawnedCapability {
  type: 'insight' | 'workflow' | 'notification' | 'memory' | 'action' | 'alert' | 'node' | 'edge';
  targetModule: string;
  description: string;
  payload?: Record<string, any>;
  requiresConfirmation: boolean;
}

export interface ProliferationResult {
  input: AsisRequest;
  output: AsisResponse;
  growthFactor: GrowthFactor;
  spawned: SpawnedCapability[];
  immuneIntervention: boolean;
  auditLog: GrowthEvent;
}

export interface ConstitutionalWeights {
  domain: AsisDomain;
  humanDignity: number;
  fairness: number;
  transparency: number;
  sovereignty: number;
  nonHarm: number;
  consent: number;
}

// ═══════════════════════════════════════════════════════════════
// KNOWLEDGE NETWORK TYPES
// ═══════════════════════════════════════════════════════════════

export type NodeType = 
  | 'user'
  | 'business'
  | 'service'
  | 'location'
  | 'transaction'
  | 'event'
  | 'skill'
  | 'problem'
  | 'solution'
  | 'outcome'
  | 'vehicle'
  | 'part'
  | 'fault_code'
  | 'symptom'
  | 'language'
  | 'word'
  | 'phrase'
  | 'grammar_rule'
  | 'code_pattern'
  | 'file'
  | 'function'
  | 'error'
  | 'fix'
  | 'cad_model'
  | 'dimension'
  | 'material'
  | 'mtaa_feature'
  | 'mtaa_app';

export type EdgeType = 
  | 'transacted_with'
  | 'visited'
  | 'serves'
  | 'located_at'
  | 'causes'
  | 'solves'
  | 'affects'
  | 'has_skill'
  | 'similar_to'
  | 'requires'
  | 'produces'
  | 'owns'
  | 'connected_to'
  | 'translates_to'
  | 'follows_rule'
  | 'contains'
  | 'imports'
  | 'calls'
  | 'fixes'
  | 'causes_error'
  | 'made_of'
  | 'has_dimension'
  | 'implements'
  | 'depends_on'
  | 'replaces';

export interface KnowledgeNode {
  id: string;
  type: NodeType;
  domain: AsisDomain;
  label: string;
  properties: Record<string, any>;
  confidence: number;
  createdAt: string;
  updatedAt: string;
  accessCount: number;
  source: 'seed' | 'user' | 'inference' | 'interaction';
}

export interface KnowledgeEdge {
  id: string;
  from: string;
  to: string;
  type: EdgeType;
  domain: AsisDomain;
  weight: number;
  properties: Record<string, any>;
  evidence: Evidence[];
  createdAt: string;
  updatedAt: string;
  accessCount: number;
}

export interface Evidence {
  type: 'user_report' | 'inferred' | 'documented' | 'observed';
  description: string;
  timestamp: string;
  confidence: number;
  source?: string;
}

export interface NetworkQuery {
  nodeTypes?: NodeType[];
  edgeTypes?: EdgeType[];
  domains?: AsisDomain[];
  properties?: Record<string, any>;
  confidenceThreshold?: number;
  maxDepth?: number;
  maxResults?: number;
}

export interface NetworkPath {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
  score: number;
  confidence: number;
}

export interface SimilarityResult {
  node: KnowledgeNode;
  score: number;
  matchedProperties: string[];
  path: NetworkPath;
}

export interface Prediction {
  outcome: KnowledgeNode;
  probability: number;
  evidence: NetworkPath[];
  confidence: number;
}

// ═══════════════════════════════════════════════════════════════
// COGNITIVE ENGINE TYPES
// ═══════════════════════════════════════════════════════════════

export interface QueryResult {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
  paths: NetworkPath[];
  query: string;
  processingTime: number;
}

export interface PatternMatch {
  pattern: KnowledgeNode;
  matches: SimilarityResult[];
  confidence: number;
  domain: AsisDomain;
}

export interface CrossPollination {
  fromDomain: AsisDomain;
  toDomain: AsisDomain;
  insight: string;
  confidence: number;
  connectingNodes: KnowledgeNode[];
}

export interface GeneratedResponse {
  message: string;
  actions: AsisAction[];
  insights: AsisInsight[];
  confidence: number;
  sources: NetworkPath[];
  growthEvent: GrowthEvent;
}

// ═══════════════════════════════════════════════════════════════
// CONNECTOR TYPES
// ═══════════════════════════════════════════════════════════════

export interface BluetoothDevice {
  id: string;
  name: string;
  type: 'obd2' | 'ble_sensor' | 'unknown';
  rssi: number;
  connected: boolean;
  lastSeen: string;
}

export interface OBD2Reading {
  timestamp: string;
  pid: string;
  name: string;
  value: number;
  unit: string;
  status: 'normal' | 'warning' | 'critical';
}

export interface DiagnosticResult {
  faultCodes: FaultCode[];
  liveData: OBD2Reading[];
  symptoms: string[];
  probableCauses: NetworkPath[];
  recommendedActions: AsisAction[];
  confidence: number;
}

export interface FaultCode {
  code: string;
  description: string;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  probableCauses: string[];
  relatedNodes: string[];
}

export interface FileSystemAccess {
  path: string;
  allowed: boolean;
  contents?: string;
  type: 'file' | 'directory';
}

// ═══════════════════════════════════════════════════════════════
// LANGUAGE TYPES
// ═══════════════════════════════════════════════════════════════

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  family: string;
  region: string;
  speakers: number;
  hasBibleTranslation: boolean;
  bibleVersion?: string;
  grammarRules: GrammarRule[];
  commonPhrases: Phrase[];
}

export interface GrammarRule {
  id: string;
  type: 'noun_class' | 'verb_conjugation' | 'tone' | 'agreement' | 'word_order';
  description: string;
  examples: string[];
  exceptions?: string[];
}

export interface Phrase {
  id: string;
  category: 'greeting' | 'farewell' | 'question' | 'response' | 'emergency' | 'business' | 'prayer';
  text: string;
  translation: string;
  context?: string;
  pronunciation?: string;
}

export interface TranslationRequest {
  text: string;
  fromLanguage: string;
  toLanguage: string;
  context?: string;
}

export interface TranslationResult {
  original: string;
  translated: string;
  fromLanguage: string;
  toLanguage: string;
  confidence: number;
  alternatives?: string[];
  grammarNotes?: string;
}

// ═══════════════════════════════════════════════════════════════
// CAD TYPES
// ═══════════════════════════════════════════════════════════════

export interface CADModel {
  id: string;
  name: string;
  type: 'part' | 'assembly' | 'drawing';
  format: 'step' | 'gltf' | 'obj' | 'stl';
  dimensions: Dimension[];
  materials: Material[];
  features: CADFeature[];
  nodes: string[]; // Links to knowledge network
}

export interface Dimension {
  name: string;
  value: number;
  unit: 'mm' | 'cm' | 'm' | 'inch';
  tolerance?: number;
}

export interface Material {
  name: string;
  type: string;
  properties: Record<string, number>;
}

export interface CADFeature {
  type: 'extrude' | 'revolve' | 'hole' | 'fillet' | 'chamfer' | 'pattern';
  parameters: Record<string, number>;
  description: string;
}

// ═══════════════════════════════════════════════════════════════
// LEGACY TYPES (preserved for compatibility)
// ═══════════════════════════════════════════════════════════════

export type AsisDomain = 
  | 'wallet'
  | 'transport'
  | 'health'
  | 'jobs'
  | 'tribes'
  | 'civic'
  | 'streets'
  | 'marketplace'
  | 'education'
  | 'appstore'
  | 'general'
  | 'vehicle'
  | 'language'
  | 'code'
  | 'cad';

export interface AsisContext {
  userId: string;
  userName: string;
  language: string;
  region: string;
  timezone: string;
  currentApp: string;
  sessionId: string;
  timestamp: string;
}

export interface AsisRequest {
  message: string;
  context: AsisContext;
  domain: string;
  history: AsisMessage[];
  attachments?: AsisAttachment[];
}

export interface AsisResponse {
  message: string;
  actions?: AsisAction[];
  insights?: AsisInsight[];
  confidence: number;
  domain: string;
  processingTime: number;
  model: string;
  _mtheory?: {
    growthFactor: number;
    spawned: number;
    immuneIntervention: boolean;
  };
}

export interface AsisMessage {
  role: 'user' | 'asis' | 'system';
  content: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface AsisAction {
  type: 'navigate' | 'trigger' | 'suggest' | 'warn' | 'explain' | 'connect_bluetooth' | 'read_obd2' | 'generate_cad' | 'translate';
  target: string;
  payload?: Record<string, any>;
  description: string;
  requiresConfirmation: boolean;
}

export interface AsisInsight {
  type: 'pattern' | 'anomaly' | 'opportunity' | 'risk' | 'recommendation';
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  data?: Record<string, any>;
}

export interface AsisAttachment {
  type: 'image' | 'document' | 'audio' | 'location' | 'obd2_data' | 'cad_file';
  url: string;
  mimeType: string;
  size: number;
}

export interface AsisConfig {
  provider: 'mtheory' | 'kimi' | 'openai' | 'claude' | 'local';
  model: string;
  maxTokens: number;
  temperature: number;
  rateLimitPerMinute: number;
  contextWindow: number;
  streaming: boolean;
  safetyEnabled: boolean;
  memoryEnabled: boolean;
  knowledgeNetworkEnabled: boolean;
}
