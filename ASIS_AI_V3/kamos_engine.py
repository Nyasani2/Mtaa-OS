"""
ASIS AI v3 — KAMOS Engine
1×1 = 1 + f(growth, replication, interaction, observation)

The KAMOS Engine is the cognitive core. Every thought, every decision,
every memory is scored through the KAMOS lens.
"""
import math
import time
import json
import hashlib
import threading
import random
from typing import Dict, List, Any, Optional, Tuple, Callable
from dataclasses import dataclass, field, asdict
from concurrent.futures import ThreadPoolExecutor, as_completed
from collections import defaultdict
import re


# ═══════════════════════════════════════════════════════════════════════════════
# KAMOS DATA STRUCTURES
# ═══════════════════════════════════════════════════════════════════════════════

@dataclass
class KamosNode:
    """A single thought, memory, or concept in the KAMOS graph."""
    id: str
    label: str
    type: str
    value: float = 0.0
    trust: float = 0.5
    entropy: float = 1.0
    connections: Dict[str, float] = field(default_factory=dict)
    metadata: Dict[str, Any] = field(default_factory=dict)
    created_at: float = field(default_factory=time.time)
    last_accessed: float = field(default_factory=time.time)
    access_count: int = 0
    agent_origin: str = "system"
    # v3: Source tracking — every node knows where it came from
    sources: List[Dict[str, str]] = field(default_factory=list)
    # v3: Validation chain — who verified this node
    verified_by: List[str] = field(default_factory=list)

    def kamos_score(self) -> float:
        """
        KAMOS Theory: 1×1 = 1 + f(growth, replication, interaction, observation)

        Every node scores higher when it:
        - GROWS: accessed frequently (learning)
        - REPLICATES: connected to many other nodes (network effect)
        - INTERACTS: strong connection weights (relational depth)
        - IS OBSERVED: low entropy (well-understood, stable)
        """
        growth = math.log1p(self.access_count) * 0.15
        replication = math.log1p(len(self.connections)) * 0.10
        interaction = sum(self.connections.values()) * 0.12
        observation = (1.0 / (1.0 + self.entropy)) * 0.18
        source_trust = sum(s.get("trust", 0.5) for s in self.sources) / max(1, len(self.sources)) * 0.10
        verification = len(self.verified_by) * 0.05
        return 1.0 + growth + replication + interaction + observation + source_trust + verification

    def decay(self, rate: float = 0.001):
        """Entropy increases and trust decays with time — forgetting."""
        elapsed = time.time() - self.last_accessed
        self.entropy = min(1.0, self.entropy + rate * elapsed)
        self.trust *= (0.999 ** elapsed)

    def touch(self):
        """Mark node as accessed — strengthens it against decay."""
        self.last_accessed = time.time()
        self.access_count += 1


@dataclass
class KamosQuery:
    """A user query enriched with KAMOS analysis."""
    raw: str
    intent: str = ""
    subqueries: List[str] = field(default_factory=list)  # v3: Task decomposition
    entities: List[str] = field(default_factory=list)
    context_window: List[Dict] = field(default_factory=list)
    complexity: float = 0.5
    urgency: float = 0.0
    emotional_tone: float = 0.5
    required_agents: List[str] = field(default_factory=list)
    # v3: Estimated cognitive load
    cognitive_load: float = 0.5
    # v3: Domain classification
    domain: str = "general"


@dataclass
class KamosDecision:
    """A decision scored across KAMOS dimensions."""
    action: str
    value_score: float = 0.0
    risk_score: float = 0.0
    cost_score: float = 0.0
    trust_score: float = 0.0
    long_term_score: float = 0.0
    agent_scores: Dict[str, float] = field(default_factory=dict)
    # v3: Source confidence — how much we trust our own knowledge
    source_confidence: float = 0.5
    # v3: Whether external research is needed
    needs_research: bool = False

    @property
    def composite(self) -> float:
        return (
            self.value_score * 0.30 -
            self.risk_score * 0.20 -
            self.cost_score * 0.10 +
            self.trust_score * 0.25 +
            self.long_term_score * 0.15
        )

    @property
    def confidence(self) -> int:
        return int(max(0, min(100, self.composite * 100)))


# ═══════════════════════════════════════════════════════════════════════════════
# SEMANTIC SIMILARITY (No external deps — pure Python TF-IDF)
# ═══════════════════════════════════════════════════════════════════════════════

class SemanticIndex:
    """Lightweight semantic search using TF-IDF — no embeddings needed."""

    def __init__(self):
        self.documents: Dict[str, str] = {}
        self.term_freq: Dict[str, Dict[str, int]] = defaultdict(lambda: defaultdict(int))
        self.doc_freq: Dict[str, int] = defaultdict(int)
        self.idf: Dict[str, float] = {}
        self._dirty = True

    def _tokenize(self, text: str) -> List[str]:
        """Simple but effective tokenization."""
        text = text.lower()
        text = re.sub(r"[^\w\s]", " ", text)
        tokens = [t for t in text.split() if len(t) > 2 and t not in self._stopwords()]
        return tokens

    def _stopwords(self) -> set:
        return {"the", "and", "for", "are", "but", "not", "you", "all", "can", "had", "her", "was", "one", "our", "out", "day", "get", "has", "him", "his", "how", "its", "may", "new", "now", "old", "see", "two", "who", "boy", "did", "she", "use", "her", "way", "many", "oil", "sit", "set", "run", "eat", "far", "sea", "eye", "ago", "off", "too", "any", "say", "man", "try", "ask", "end", "why", "let", "put", "say", "she", "try", "way", "own", "say", "too", "old", "tell", "very", "when", "much", "would", "there", "their", "what", "said", "each", "which", "will", "about", "could", "other", "after", "first", "never", "these", "think", "where", "being", "every", "great", "might", "shall", "still", "those", "while", "this", "that", "with", "have", "from", "they", "know", "want", "been", "good", "much", "some", "time", "very", "when", "come", "here", "just", "like", "long", "make", "many", "over", "such", "take", "than", "them", "well", "were"}

    def add(self, doc_id: str, text: str):
        self.documents[doc_id] = text
        tokens = self._tokenize(text)
        token_set = set(tokens)
        for token in tokens:
            self.term_freq[doc_id][token] += 1
        for token in token_set:
            self.doc_freq[token] += 1
        self._dirty = True

    def _compute_idf(self):
        if not self._dirty:
            return
        n_docs = len(self.documents)
        for term, freq in self.doc_freq.items():
            self.idf[term] = math.log((n_docs + 1) / (freq + 1)) + 1
        self._dirty = False

    def search(self, query: str, top_k: int = 5) -> List[Tuple[str, float]]:
        self._compute_idf()
        query_tokens = self._tokenize(query)
        if not query_tokens:
            return []

        scores = {}
        for doc_id, text in self.documents.items():
            score = 0.0
            doc_tokens = self._tokenize(text)
            doc_len = len(doc_tokens)
            if doc_len == 0:
                continue
            for token in query_tokens:
                tf = self.term_freq[doc_id].get(token, 0)
                idf = self.idf.get(token, 0)
                # TF-IDF with length normalization
                score += (tf / doc_len) * idf
            if score > 0:
                scores[doc_id] = score

        sorted_scores = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        return sorted_scores[:top_k]


# ═══════════════════════════════════════════════════════════════════════════════
# KAMOS ENGINE
# ═══════════════════════════════════════════════════════════════════════════════

class KamosEngine:
    def __init__(self, config: Optional[Dict] = None):
        self.config = config or {}
        self.graph: Dict[str, KamosNode] = {}
        self.history: List[Dict] = []
        self.semantic_index = SemanticIndex()
        self.learning_rate = self.config.get("learning_rate", 0.15)
        self.decay_rate = self.config.get("decay_rate", 0.001)
        self.max_history = self.config.get("max_history", 1000)
        self.lock = threading.RLock()

        # v3: Agent performance tracking — real learning
        self.agent_weights: Dict[str, float] = defaultdict(lambda: 1.0)
        self.agent_success_history: Dict[str, List[bool]] = defaultdict(list)

        # v3: Intent pattern registry — evolves over time
        self.intent_patterns: Dict[str, List[str]] = {
            "explanation": ["how", "why", "explain", "what is", "describe", "clarify", "elaborate"],
            "comparison": ["compare", "difference", "vs", "versus", "better", "worse", "similarities"],
            "problem_solving": ["solve", "calculate", "compute", "find", "fix", "debug", "resolve", "troubleshoot"],
            "creation": ["create", "build", "make", "design", "generate", "write code", "implement", "develop"],
            "recommendation": ["should", "recommend", "advice", "best", "choose", "pick", "suggest"],
            "improvement": ["improve", "enhance", "optimize", "upgrade", "better", "refine", "polish"],
            "analysis": ["analyze", "review", "check", "evaluate", "assess", "examine", "inspect"],
            "research": ["search", "find information", "look up", "research", "investigate", "study"],
            "information": []
        }

    def add_node(self, label: str, node_type: str, agent_origin: str = "system",
                 sources: List[Dict[str, str]] = None, **metadata) -> KamosNode:
        with self.lock:
            node_id = hashlib.sha256(f"{label}:{time.time()}:{agent_origin}".encode()).hexdigest()[:16]
            node = KamosNode(
                id=node_id,
                label=label,
                type=node_type,
                agent_origin=agent_origin,
                sources=sources or [],
                metadata=metadata
            )
            self.graph[node_id] = node
            self.semantic_index.add(node_id, label)
            return node

    def connect(self, from_id: str, to_id: str, strength: float = 1.0):
        with self.lock:
            if from_id in self.graph and to_id in self.graph:
                self.graph[from_id].connections[to_id] = strength
                self.graph[to_id].connections[from_id] = strength

    def find_node(self, label: str) -> Optional[KamosNode]:
        """Semantic + exact search."""
        label_lower = label.lower()
        # Exact match first
        for node in self.graph.values():
            if node.label.lower() == label_lower:
                node.touch()
                return node
        # Semantic fallback
        results = self.semantic_index.search(label, top_k=3)
        for node_id, score in results:
            if node_id in self.graph:
                node = self.graph[node_id]
                node.touch()
                return node
        return None

    def get_related(self, node_id: str, depth: int = 1) -> List[Tuple[KamosNode, float]]:
        if node_id not in self.graph:
            return []
        related = []
        visited = {node_id}
        queue = [(node_id, 1.0, 0)]
        while queue:
            current_id, strength, current_depth = queue.pop(0)
            if current_depth >= depth:
                continue
            node = self.graph.get(current_id)
            if not node:
                continue
            for conn_id, conn_strength in node.connections.items():
                if conn_id not in visited:
                    visited.add(conn_id)
                    combined_strength = strength * conn_strength
                    related.append((self.graph[conn_id], combined_strength))
                    queue.append((conn_id, combined_strength, current_depth + 1))
        related.sort(key=lambda x: x[1], reverse=True)
        return related

    # ═══════════════════════════════════════════════════════════════════════
    # v3: TASK DECOMPOSITION
    # ═══════════════════════════════════════════════════════════════════════

    def decompose_query(self, raw_query: str) -> List[str]:
        """Break complex queries into sub-queries for parallel processing."""
        subqueries = [raw_query]  # Default: no decomposition

        # Detect compound queries
        connectors = [" and ", " plus ", " also ", " additionally ", " furthermore ", " moreover "]
        for conn in connectors:
            if conn in raw_query.lower():
                parts = raw_query.lower().split(conn)
                if len(parts) > 1:
                    subqueries = [p.strip().capitalize() + ("?" if not p.strip().endswith("?") else "") for p in parts if len(p.strip()) > 10]
                    break

        # Detect multi-part questions (numbered or bulleted)
        if raw_query.count("?") > 1:
            parts = re.split(r"(?<=\?)(\s+|$)", raw_query)
            subqueries = [p.strip() for p in parts if len(p.strip()) > 10]

        # Detect "compare X and Y" -> decompose to "analyze X" + "analyze Y" + "compare X and Y"
        compare_match = re.search(r"compare\s+(\w+)\s+(?:and|vs|versus)\s+(\w+)", raw_query, re.IGNORECASE)
        if compare_match:
            x, y = compare_match.groups()
            subqueries = [
                f"Analyze {x}",
                f"Analyze {y}",
                f"Compare {x} and {y}"
            ]

        # Detect "how to X and Y" -> decompose
        how_to_match = re.search(r"how\s+(?:to|do|can|should)\s+(.+?)(?:\s+and\s+)(.+?)(?:\?|$)", raw_query, re.IGNORECASE)
        if how_to_match:
            x, y = how_to_match.groups()
            subqueries = [f"How to {x.strip()}", f"How to {y.strip()}"]

        return subqueries if len(subqueries) > 1 else [raw_query]

    # ═══════════════════════════════════════════════════════════════════════
    # v3: ENHANCED QUERY PARSING
    # ═══════════════════════════════════════════════════════════════════════

    def parse_query(self, raw_query: str, context: Optional[Dict] = None) -> KamosQuery:
        query = KamosQuery(raw=raw_query)
        raw_lower = raw_query.lower()

        # Task decomposition
        query.subqueries = self.decompose_query(raw_query)
        query.cognitive_load = min(1.0, len(query.subqueries) * 0.2 + len(raw_query.split()) / 100.0)

        # Intent detection with pattern evolution
        best_intent = "information"
        best_score = 0
        for intent, patterns in self.intent_patterns.items():
            score = sum(1 for p in patterns if p in raw_lower)
            if score > best_score:
                best_score = score
                best_intent = intent
        query.intent = best_intent

        # Agent mapping with weights
        intent_agent_map = {
            "explanation": ["reasoner", "researcher"],
            "comparison": ["reasoner", "critic", "researcher"],
            "problem_solving": ["coder", "reasoner", "critic"],
            "creation": ["creator", "coder", "critic"],
            "recommendation": ["reasoner", "critic", "researcher"],
            "improvement": ["critic", "creator", "reasoner", "meta"],
            "analysis": ["critic", "reasoner", "researcher"],
            "research": ["researcher", "reasoner"],
            "information": ["researcher"]
        }
        query.required_agents = intent_agent_map.get(best_intent, ["researcher"])

        # Domain detection
        domains = {
            "code": ["code", "function", "class", "bug", "error", "typescript", "python", "javascript", "react", "api"],
            "science": ["physics", "chemistry", "biology", "math", "equation", "theorem", "research", "study"],
            "medicine": ["health", "disease", "treatment", "symptom", "doctor", "patient", "drug"],
            "business": ["market", "revenue", "profit", "investment", "stock", "company", "business"],
            "technology": ["ai", "machine learning", "neural", "algorithm", "software", "hardware"]
        }
        for domain, keywords in domains.items():
            if any(k in raw_lower for k in keywords):
                query.domain = domain
                break

        # Entity extraction (improved — proper noun detection)
        words = raw_query.split()
        query.entities = []
        for i, w in enumerate(words):
            clean = re.sub(r"[^\w\s]", "", w)
            if len(clean) > 3:
                if clean[0].isupper():
                    query.entities.append(clean)
                elif i > 0 and words[i-1].lower() in ["the", "a", "an", "about", "on", "in"]:
                    # Likely a key term following an article
                    query.entities.append(clean)
        query.entities = list(set(query.entities))  # Deduplicate

        # Complexity scoring
        query.complexity = min(1.0, len(words) / 50.0 + raw_query.count("?") * 0.1 + query.cognitive_load * 0.3)

        # Emotional tone
        positive = ["good", "great", "excellent", "love", "amazing", "perfect", "thanks", "awesome", "brilliant", "fantastic"]
        negative = ["bad", "terrible", "hate", "awful", "wrong", "stupid", "useless", "broken", "horrible", "disgusting"]
        pos_count = sum(1 for w in positive if w in raw_lower)
        neg_count = sum(1 for w in negative if w in raw_lower)
        if pos_count > neg_count:
            query.emotional_tone = 0.7 + min(0.3, pos_count * 0.1)
        elif neg_count > pos_count:
            query.emotional_tone = 0.3 - min(0.3, neg_count * 0.1)
        else:
            query.emotional_tone = 0.5

        if context:
            query.context_window = context.get("recent_history", [])

        return query

    # ═══════════════════════════════════════════════════════════════════════
    # v3: ENHANCED REASONING WITH SOURCE AWARENESS
    # ═══════════════════════════════════════════════════════════════════════

    def reason(self, query: KamosQuery) -> KamosDecision:
        decision = KamosDecision(action="multi_agent_dispatch")

        # Find relevant knowledge nodes
        relevant_nodes = []
        for entity in query.entities:
            node = self.find_node(entity)
            if node:
                relevant_nodes.append(node)
                related = self.get_related(node.id, depth=2)
                relevant_nodes.extend([n for n, _ in related])

        # Also search semantically for query terms
        if not relevant_nodes:
            semantic_results = self.semantic_index.search(query.raw, top_k=5)
            for node_id, score in semantic_results:
                if node_id in self.graph:
                    relevant_nodes.append(self.graph[node_id])

        knowledge_depth = len(relevant_nodes) / max(1, len(self.graph)) if self.graph else 0
        decision.value_score = min(1.0, knowledge_depth * 2.0 + 0.3)
        decision.risk_score = query.complexity * (1.0 - knowledge_depth)
        decision.cost_score = query.complexity * 0.5 + len(query.raw) / 1000.0

        # Trust based on verified sources
        if relevant_nodes:
            avg_trust = sum(n.trust for n in relevant_nodes) / len(relevant_nodes)
            verified_ratio = sum(1 for n in relevant_nodes if n.verified_by) / len(relevant_nodes)
            decision.trust_score = avg_trust * (1.0 - query.complexity * 0.3) + verified_ratio * 0.2
            decision.source_confidence = avg_trust
        else:
            decision.trust_score = 0.3
            decision.source_confidence = 0.2

        # v3: Decide if external research is needed
        if knowledge_depth < 0.1 or query.intent in ["research", "information"]:
            decision.needs_research = True
        if query.domain in ["science", "technology", "medicine"] and knowledge_depth < 0.3:
            decision.needs_research = True

        decision.long_term_score = 0.5 + query.complexity * 0.3
        if query.intent in ["problem_solving", "creation", "improvement"]:
            decision.long_term_score += 0.2

        # Agent scoring with learned weights
        for agent_name in query.required_agents:
            agent_nodes = [n for n in relevant_nodes if n.agent_origin == agent_name]
            if agent_nodes:
                base_score = sum(n.kamos_score() for n in agent_nodes) / len(agent_nodes)
            else:
                base_score = 0.5
            # Apply learned weight
            learned_weight = self.agent_weights.get(agent_name, 1.0)
            decision.agent_scores[agent_name] = base_score * learned_weight

        if query.emotional_tone < 0.3:
            decision.risk_score += 0.1

        return decision

    # ═══════════════════════════════════════════════════════════════════════
    # v3: LEARNING WITH AGENT WEIGHT EVOLUTION
    # ═══════════════════════════════════════════════════════════════════════

    def learn_from_interaction(self, query: KamosQuery, response: str,
                               agent_origins: List[str], feedback: Optional[str] = None,
                               task_success: bool = True):
        with self.lock:
            # Create query and response nodes
            query_node = self.add_node(
                query.raw, "query", agent_origin="orchestrator",
                intent=query.intent, domain=query.domain
            )
            response_node = self.add_node(
                response[:300], "response", agent_origin="orchestrator",
                intent=query.intent
            )
            self.connect(query_node.id, response_node.id, strength=1.0)

            # Entity nodes
            for entity in query.entities:
                entity_node = self.find_node(entity)
                if not entity_node:
                    entity_node = self.add_node(entity, "entity", agent_origin="orchestrator")
                self.connect(query_node.id, entity_node.id, strength=0.8)
                self.connect(response_node.id, entity_node.id, strength=0.6)

            # Agent nodes with performance tracking
            for agent_name in agent_origins:
                agent_node = self.add_node(f"agent:{agent_name}", "agent", agent_origin=agent_name)
                self.connect(response_node.id, agent_node.id, strength=0.9)

                # v3: Update agent success history
                self.agent_success_history[agent_name].append(task_success)
                # Keep last 50 results
                self.agent_success_history[agent_name] = self.agent_success_history[agent_name][-50:]

                # v3: Evolve agent weights based on success rate
                success_rate = sum(self.agent_success_history[agent_name]) / len(self.agent_success_history[agent_name])
                # Weight = 0.5 + 0.5 * success_rate (range 0.5 to 1.5)
                self.agent_weights[agent_name] = 0.5 + success_rate

            # Feedback processing
            if feedback:
                feedback_lower = feedback.lower()
                if any(w in feedback_lower for w in ["good", "correct", "right", "yes", "perfect", "excellent", "thanks", "great"]):
                    for conn_id in query_node.connections:
                        query_node.connections[conn_id] = min(1.0, query_node.connections[conn_id] + self.learning_rate)
                    response_node.trust = min(1.0, response_node.trust + self.learning_rate)
                    self.learning_rate = min(0.3, self.learning_rate + 0.01)
                    # Verify the response node
                    response_node.verified_by.append("user_feedback")
                elif any(w in feedback_lower for w in ["bad", "wrong", "incorrect", "no", "terrible", "awful", "useless"]):
                    for conn_id in list(query_node.connections.keys()):
                        query_node.connections[conn_id] = max(0.0, query_node.connections[conn_id] - self.learning_rate * 2)
                    response_node.trust = max(0.0, response_node.trust - self.learning_rate * 2)
                    self.learning_rate = max(0.05, self.learning_rate - 0.02)

            # History
            self.history.append({
                "query": query.raw,
                "intent": query.intent,
                "agents": agent_origins,
                "response_preview": response[:100],
                "feedback": feedback,
                "timestamp": time.time(),
                "kamos_score": query_node.kamos_score(),
                "task_success": task_success
            })

            if len(self.history) > self.max_history:
                self.history = self.history[-self.max_history:]

    def decay_all(self):
        with self.lock:
            for node in self.graph.values():
                node.decay(self.decay_rate)

    def save(self, filepath: str):
        with self.lock:
            data = {
                "graph": {nid: asdict(node) for nid, node in self.graph.items()},
                "history": self.history,
                "config": self.config,
                "learning_rate": self.learning_rate,
                "agent_weights": dict(self.agent_weights),
                "agent_success_history": {k: list(v)[-100:] for k, v in self.agent_success_history.items()},
                "intent_patterns": self.intent_patterns
            }
            with open(filepath, 'w') as f:
                json.dump(data, f, indent=2)

    def load(self, filepath: str):
        with self.lock:
            with open(filepath, 'r') as f:
                data = json.load(f)
            self.graph = {}
            for nid, node_data in data.get("graph", {}).items():
                node = KamosNode(**node_data)
                self.graph[nid] = node
                self.semantic_index.add(nid, node.label)
            self.history = data.get("history", [])
            self.config = data.get("config", {})
            self.learning_rate = data.get("learning_rate", 0.15)
            self.agent_weights = defaultdict(lambda: 1.0, data.get("agent_weights", {}))
            self.agent_success_history = defaultdict(list, data.get("agent_success_history", {}))
            self.intent_patterns = data.get("intent_patterns", self.intent_patterns)


# ═══════════════════════════════════════════════════════════════════════════════
# SINGLETON
# ═══════════════════════════════════════════════════════════════════════════════

_kamos_engine: Optional[KamosEngine] = None

def get_engine(config: Optional[Dict] = None) -> KamosEngine:
    global _kamos_engine
    if _kamos_engine is None:
        _kamos_engine = KamosEngine(config)
    return _kamos_engine
