"""
ASIS AI v3 — Meta Agent
Self-reflection, system improvement, and agent orchestration optimization.
"""
import time
from typing import Dict, Any, List
from agents.base_agent import BaseAgent, AgentResult


class MetaAgent(BaseAgent):
    name = "meta"
    description = "Self-reflection, system analysis, and self-improvement"
    capabilities = ["self_improvement", "system_analysis", "optimization", "reflection"]
    domains = ["system", "meta"]

    def can_handle(self, intent: str, query: str) -> float:
        scores = {
            "improvement": 0.98,
            "analysis": 0.85
        }
        meta_terms = ["improve yourself", "better", "enhance", "upgrade", "fix you", 
                      "make you smarter", "self", "meta", "system", "architecture"]
        if any(term in query.lower() for term in meta_terms):
            return 0.95
        return scores.get(intent, 0.2)

    def execute(self, task_input: Dict[str, Any]) -> AgentResult:
        start = time.time()
        query = task_input.get("query", "")
        all_agents = task_input.get("all_agents", [])

        analysis = self._analyze_system(all_agents)
        improvements = self._generate_improvements(analysis, all_agents)

        output = "**System Self-Analysis:**\n\n" + analysis + "\n\n**Improvement Plan:**\n\n" + improvements
        confidence = 0.85

        self._update_stats(True, confidence, int((time.time() - start) * 1000))

        return AgentResult(
            agent_name=self.name,
            output=output,
            confidence=confidence,
            reasoning="Analyzed system performance and generated improvement strategies",
            metadata={"improvements_suggested": improvements.count("->"), "agents_analyzed": len(all_agents)},
            execution_time_ms=int((time.time() - start) * 1000),
            sources=[]
        )

    def _analyze_system(self, agents: List) -> str:
        lines = ["**Current System State:**"]

        total_calls = 0
        total_successes = 0

        for agent in agents:
            stats = agent.get_stats()
            calls = stats.get('calls', 0)
            success_rate = stats.get('success_rate', 1.0)
            avg_conf = stats.get('avg_confidence', 0.5)
            avg_time = stats.get('avg_execution_ms', 0)

            total_calls += calls
            total_successes += stats.get('successes', 0)

            status = "OK" if success_rate > 0.8 else "WARN" if success_rate > 0.5 else "CRITICAL"
            lines.append("  [" + status + "] **" + stats['name'] + "**: " + str(calls) + " calls, " + str(int(success_rate*100)) + "% success, avg conf " + str(round(avg_conf, 2)) + ", avg time " + str(int(avg_time)) + "ms")

        if total_calls > 0:
            overall_success = total_successes / total_calls
            lines.append("**Overall:** " + str(total_calls) + " total calls, " + str(int(overall_success*100)) + "% success rate")

        lines.append("**Identified Weaknesses:**")
        weak_agents = [a for a in agents if a.get_stats().get('success_rate', 1) < 0.7 and a.get_stats().get('calls', 0) > 5]
        if weak_agents:
            for agent in weak_agents:
                lines.append("  WARNING " + agent.name + " has low success rate -- needs tuning or more training data")
        else:
            lines.append("  OK All agents performing adequately")

        if self.engine and len(self.engine.graph) < 100:
            lines.append("WARNING Knowledge graph sparse (" + str(len(self.engine.graph)) + " nodes) -- more interactions needed")

        return "\n".join(lines)

    def _generate_improvements(self, analysis: str, agents: List) -> str:
        suggestions = []

        researcher = next((a for a in agents if a.name == "researcher"), None)
        if researcher and researcher.get_stats().get('calls', 0) < 10:
            suggestions.append("-> **Researcher**: Increase web search frequency -- knowledge base is thin")

        for agent in agents:
            if agent.get_stats().get('calls', 0) == 0:
                suggestions.append("-> **" + agent.name + "**: Never invoked -- review intent matching or add more capabilities")

        lines = [
            "-> **Immediate Actions:**",
            "  1. Increase learning rate for underperforming agents",
            "  2. Add more training data to the knowledge graph",
            "  3. Implement cross-agent validation (agents check each other's work)"
        ]

        if suggestions:
            lines.extend(["", "-> **Agent-Specific:**"])
            lines.extend(suggestions)

        lines.extend([
            "",
            "-> **Medium-term:**",
            "  1. Add new specialized agents (MathAgent, SecurityAgent, DataAgent)",
            "  2. Implement agent competition -- multiple agents solve same problem, best wins",
            "  3. Add persistent memory consolidation across sessions",
            "",
            "-> **Long-term:**",
            "  1. Self-modifying code generation (agents write their own improvements)",
            "  2. Distributed agent network (agents on different machines collaborate)",
            "  3. Emotional intelligence layer (detect and adapt to user emotional state)",
            "",
            "-> **KAMOS Optimization:**",
            "  - Growth: Add new reasoning patterns weekly based on usage",
            "  - Replication: Clone successful agent strategies to new contexts",
            "  - Interaction: Increase cross-agent communication frequency",
            "  - Observation: Log all decisions for post-hoc analysis and learning"
        ])

        return "\n".join(lines)
