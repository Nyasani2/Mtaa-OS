"""
ASIS AI v3 — Creator Agent
Generates creative content, designs, and novel solutions based on query context.
"""
import time
from typing import Dict, Any
from agents.base_agent import BaseAgent, AgentResult


class CreatorAgent(BaseAgent):
    name = "creator"
    description = "Creative generation, design, and novel solution crafting"
    capabilities = ["generation", "design", "innovation", "synthesis", "architecture"]
    domains = ["software", "business", "education", "science"]

    def can_handle(self, intent: str, query: str) -> float:
        scores = {
            "creation": 0.95,
            "improvement": 0.85,
            "problem_solving": 0.75,
            "analysis": 0.60
        }
        return scores.get(intent, 0.3)

    def execute(self, task_input: Dict[str, Any]) -> AgentResult:
        start = time.time()
        query = task_input.get("query", "")
        context = task_input.get("context", "")

        creation = self._create(query, context)

        output = "**Creative Solution:**" + chr(10) + chr(10) + creation
        confidence = 0.75

        self._update_stats(True, confidence, int((time.time() - start) * 1000))

        return AgentResult(
            agent_name=self.name,
            output=output,
            confidence=confidence,
            reasoning="Synthesized novel approach from relational patterns and domain knowledge",
            metadata={"novelty_score": 0.8, "domain": self._detect_domain(query)},
            execution_time_ms=int((time.time() - start) * 1000),
            sources=[]
        )

    def _detect_domain(self, query: str) -> str:
        q = query.lower()
        if any(w in q for w in ["app", "software", "code", "system", "platform", "api"]):
            return "software"
        elif any(w in q for w in ["business", "market", "revenue", "profit", "company"]):
            return "business"
        elif any(w in q for w in ["education", "learn", "teach", "student", "school", "course"]):
            return "education"
        elif any(w in q for w in ["science", "research", "experiment", "theory", "hypothesis"]):
            return "science"
        return "general"

    def _create(self, query: str, context: str) -> str:
        domain = self._detect_domain(query)

        creations = {
            "software": f"""I have designed a software architecture based on KAMOS relational principles:

**System Design for: {query[:50]}...**

1. **Core Entities**: Identify the fundamental objects and their relationships
2. **Interaction Patterns**: Define how entities communicate (events, APIs, state)
3. **Growth Hooks**: Design extension points for future features
4. **Adaptive Layers**: Build configuration-driven behavior, not hardcoded logic
5. **Observation Points**: Add logging, metrics, and feedback loops

**KAMOS Integration:**
- Growth: Modular architecture allows feature addition without core changes
- Replication: Micro-service patterns enable scaling
- Interaction: Event-driven architecture ensures loose coupling
- Observation: Full telemetry for continuous improvement

**Implementation Path:**
1. Define interfaces and contracts first
2. Build the simplest working version
3. Add observability before optimization
4. Iterate based on real usage data""",

            "business": f"""I have crafted a business strategy using KAMOS proliferative thinking:

**Business Model for: {query[:50]}...**

1. **Value Proposition**: What unique capability do you bring?
2. **Growth Engine**: How does each customer bring more customers?
3. **Replication Model**: What can be automated, templated, or franchised?
4. **Interaction Design**: How do stakeholders (customers, partners, employees) reinforce each other?
5. **Observation Metrics**: What signals indicate health or danger?

**KAMOS Principles Applied:**
- 1x1 = 1 + f(growth): Every transaction should increase network value
- Replication: Build once, sell infinitely (software, content, systems)
- Interaction: Platform effects > linear effects
- Observation: Data-driven decisions, not intuition""",

            "education": f"""I have designed a learning system based on KAMOS adaptive principles:

**Educational Design for: {query[:50]}...**

1. **Conceptual Foundation**: Start with the core truth (the "1")
2. **Growth Path**: Scaffolded challenges that build complexity gradually
3. **Replication**: Students teach others (Feynman technique)
4. **Interaction**: Peer learning, discussion, collaborative problem-solving
5. **Observation**: Self-assessment, metacognition, learning analytics

**KAMOS Learning Model:**
- Growth: Knowledge compounds -- each concept enables 10 more
- Replication: Create artifacts (notes, videos, projects) that persist
- Interaction: Learning is social -- discourse reveals gaps
- Observation: Track understanding, not just completion""",

            "science": f"""I have structured a research approach using KAMOS methodology:

**Research Framework for: {query[:50]}...**

1. **Observation**: Systematic data collection with minimal bias
2. **Pattern Recognition**: Identify regularities and anomalies
3. **Hypothesis Generation**: Explanations that predict and can be falsified
4. **Experimental Design**: Controls, variables, reproducibility
5. **Synthesis**: Integrate findings into broader theoretical framework

**KAMOS Scientific Method:**
- Growth: Each experiment informs the next -- iterative refinement
- Replication: Results must be reproducible by independent researchers
- Interaction: Cross-disciplinary insights often solve hard problems
- Observation: The foundation -- without good data, all reasoning is fantasy""",

            "general": f"""I have synthesized a novel approach based on KAMOS relational principles:

**Solution Framework for: {query[:50]}...**

1. **Pattern Recognition**: Identify recurring structures in the problem space
2. **Relational Mapping**: Connect seemingly unrelated concepts through shared attributes
3. **Emergent Synthesis**: Allow new solutions to emerge from interaction of existing patterns
4. **Adaptive Refinement**: Continuously adjust based on feedback and outcomes

**KAMOS Insight:**
Systems are proliferative and context-aware. The solution grows organically from the problem's relational structure rather than being forced from outside. Start with the core truth (1), then let growth, replication, interaction, and observation amplify it."""
        }

        return creations.get(domain, creations["general"])
