// @ts-nocheck
// Append to lib/asis-cse/asis-cse-types.ts
export interface CognitiveEngine { id: string; name: string; version: string; status: 'active' | 'inactive' | 'error'; capabilities: string[]; confidence: number; lastRun?: string; metadata?: Record<string, any>; }
export interface EngineContext { id: string; sessionId: string; userId?: string; intent?: string; entities: Record<string, any>; history: EngineResult[]; metadata?: Record<string, any>; timestamp: number; }
export interface EngineResult { id: string; engineId: string; contextId: string; output: any; confidence: number; processingTime: number; timestamp: number; metadata?: Record<string, any>; }
export interface KnowledgeGraph { id: string; nodes: KnowledgeNode[]; edges: KnowledgeEdge[]; metadata?: Record<string, any>; }
export interface KnowledgeNode { id: string; label: string; type: string; confidence: { overall: number }; metadata?: Record<string, any>; }
export interface KnowledgeEdge { id: string; source: string; target: string; label: string; confidence: number; metadata?: Record<string, any>; }
export interface MentalModel { id: string; name: string; entities: string[]; relationships: string[]; dynamics: string[]; confidence: number; metadata?: Record<string, any>; }
export interface CausalLink { id: string; cause: string; effect: string; strength: number; confidence: number; metadata?: Record<string, any>; }
export interface Pattern { id: string; type: string; frequency: number; confidence: number; examples: string[]; metadata?: Record<string, any>; }
export interface KAMOSValue { value: number; confidence: number; timestamp: number; context?: Record<string, any>; }
export interface AdaptationPolicy { id: string; name: string; rules: AdaptationRule[]; priority: number; active: boolean; metadata?: Record<string, any>; }
export interface AdaptationRule { condition: string; action: string; weight: number; }
export interface Decision { id: string; contextId: string; options: DecisionOption[]; selectedOption?: string; confidence: number; reasoning: string; timestamp: number; }
export interface DecisionOption { id: string; label: string; value: any; score: number; risks: string[]; benefits: string[]; }
export interface WisdomReport { id: string; contextId: string; insights: string[]; recommendations: string[]; confidence: number; adaptationPolicies: AdaptationPolicy[]; timestamp: number; }
export interface ResearchResult { id: string; query: string; sources: ResearchSource[]; findings: string[]; confidence: number; timestamp: number; }
export interface ResearchSource { id: string; name: string; url?: string; reliability: number; relevance: number; metadata?: Record<string, any>; }
export interface ResponseEngineInput { query: string; context?: EngineContext; options?: Record<string, any>; }
export interface ReasoningChain { id: string; steps: ReasoningStep[]; conclusion: string; confidence: number; timestamp: number; }
export interface ReasoningStep { id: string; premise: string; inference: string; evidence: string[]; confidence: number; }
export interface FeedbackReport { id: string; engineId: string; rating: number; comments?: string; issues: string[]; suggestions: string[]; timestamp: number; }
export interface ReflectionReport { id: string; engineId: string; lessons: Lesson[]; improvements: string[]; confidence: number; timestamp: number; }
export interface Lesson { id: string; type: 'success' | 'failure' | 'reinforcement'; description: string; confidence: number; applicableContexts: string[]; }
export interface Hypothesis { id: string; statement: string; evidence: string[]; confidence: number; testable: boolean; }
export interface Conclusion { id: string; statement: string; evidence: string[]; confidence: number; reasoning: string; }
export interface ConfidenceScore { value: number; factors: string[]; timestamp: number; }
export interface ExecutionPlan { id: string; contextId: string; tasks: Task[]; milestones: Milestone[]; estimatedDuration: number; confidence: number; timestamp: number; }
export interface Task { id: string; label: string; description?: string; status: 'pending' | 'in_progress' | 'completed' | 'failed'; dependencies: string[]; requiredResources: string[]; estimatedDuration: number; assignedTo?: string; metadata?: Record<string, any>; }
export interface Milestone { id: string; label: string; tasks: string[]; criteria: string[]; completed: boolean; completedAt?: string; }
export interface Scenario { id: string; label: string; probability: number; impact: number; children: Scenario[]; metadata?: Record<string, any>; }
export interface ScenarioTree { root: Scenario; depth: number; branchingFactor: number; }
export interface RiskReport { id: string; contextId: string; risks: Risk[]; mitigations: string[]; overallRisk: number; timestamp: number; }
export interface Risk { id: string; label: string; probability: number; impact: number; severity: number; }
export interface Fact { id: string; statement: string; source?: string; confidence: number; verified: boolean; timestamp: number; }
export interface SynthesizedResponse { id: string; text: string; data?: Record<string, any>; sources: string[]; confidence: number; timestamp: number; }
export interface EngineInput { query: string; context?: Record<string, any>; options?: Record<string, any>; }
export interface EntityState { value: number; confidence: number; timestamp: number; metadata?: Record<string, any>; }
export interface ContextVector { dimensions: Record<string, number>; magnitude: number; timestamp: number; }
export interface KamosState { userKnowledgeGraph: KnowledgeGraph; collectivePatterns: Pattern[]; contextVector: ContextVector; newObservation: { query: string; parsedIntent: { category: IntentCategory; confidence: number; entities: any[]; urgency: number; requiresTools: any[]; suggestedActions: any[]; }; toolResults: any[]; timestamp: number; }; }
export type IntentCategory = 'general' | 'technical' | 'creative' | 'analytical' | 'social' | 'urgent';
