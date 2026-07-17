"""
ASIS AI v3 — Multi-Agent Orchestrator
Coordinates all agents using KAMOS-driven decision making.
Features: Task decomposition, agent debate, dynamic scaling, source synthesis.
"""
import time
from typing import Dict, Any, List, Optional
from concurrent.futures import ThreadPoolExecutor, as_completed
from kamos_engine import KamosEngine, KamosQuery, get_engine
from memory_graph import MemoryGraph
from agents import (
    ReasonerAgent, CoderAgent, CriticAgent,
    ResearcherAgent, CreatorAgent, MetaAgent
)


class MultiAgentOrchestrator:
    def __init__(self, config: Optional[Dict] = None):
        self.config = config or {}
        self.engine = get_engine(config)
        self.memory = MemoryGraph(
            storage_path=self.config.get("memory_path", "knowledge_base/memory.json")
        )
        self.agents = {
            "reasoner": ReasonerAgent(self.engine, self.memory),
            "coder": CoderAgent(self.engine, self.memory),
            "critic": CriticAgent(self.engine, self.memory),
            "researcher": ResearcherAgent(self.engine, self.memory),
            "creator": CreatorAgent(self.engine, self.memory),
            "meta": MetaAgent(self.engine, self.memory),
        }
        self.base_workers = self.config.get("max_workers", 3)
        self.max_workers = self.config.get("absolute_max_workers", 6)

    def process(self, user_input: str, context: Optional[Dict] = None) -> Dict[str, Any]:
        start_time = time.time()

        query = self.engine.parse_query(user_input, context)
        decision = self.engine.reason(query)

        if decision.needs_research and "researcher" not in query.required_agents:
            query.required_agents.append("researcher")

        selected_agents = self._select_agents(query, decision)
        workers = min(self.max_workers, max(2, len(selected_agents)))

        if len(query.subqueries) > 1:
            agent_results = self._execute_with_subtasks(selected_agents, query, context, workers)
        else:
            agent_results = self._execute_agents(selected_agents, query, context, workers)

        agent_results = self._agent_debate(agent_results, query)
        final_response = self._synthesize(agent_results, query, decision)

        if decision.confidence < 50:
            critique = self.agents["critic"].execute({
                "query": user_input,
                "target": final_response
            })
            final_response = final_response + "\n\n**Self-Correction:**\n" + critique.output

        agent_names = [r.agent_name for r in agent_results]
        task_success = decision.confidence >= 50 and len(agent_results) > 0

        all_sources = []
        for r in agent_results:
            all_sources.extend(r.sources)

        self.engine.learn_from_interaction(query, final_response, agent_names, 
                                          feedback=None, task_success=task_success)
        self.memory.add(
            content="Q: " + user_input + " | A: " + final_response[:200],
            source="orchestrator",
            importance=decision.composite,
            tags=query.entities + [query.intent] + agent_names,
            sources=all_sources[:5]
        )

        reasoning = {
            "intent": query.intent,
            "agents_deployed": agent_names,
            "kamos_score": decision.composite,
            "confidence": decision.confidence,
            "value": decision.value_score,
            "risk": decision.risk_score,
            "trust": decision.trust_score,
            "source_confidence": decision.source_confidence,
            "needs_research": decision.needs_research,
            "subqueries": query.subqueries,
            "cognitive_load": query.cognitive_load,
        }

        return {
            "response": final_response,
            "reasoning": reasoning,
            "sources": self._format_sources(all_sources),
            "agent_results": [
                {
                    "agent": r.agent_name,
                    "confidence": r.confidence,
                    "time_ms": r.execution_time_ms,
                    "output_preview": r.output[:100],
                    "sources": len(r.sources)
                }
                for r in agent_results
            ],
            "response_time_ms": int((time.time() - start_time) * 1000),
        }

    def _select_agents(self, query: KamosQuery, decision) -> List[str]:
        candidates = []
        for agent_name in query.required_agents:
            if agent_name in self.agents:
                agent = self.agents[agent_name]
                competence = agent.can_handle(query.intent, query.raw)
                kamos_boost = decision.agent_scores.get(agent_name, 0.5)
                learned_weight = self.engine.agent_weights.get(agent_name, 1.0)
                score = competence * 0.4 + kamos_boost * 0.3 + learned_weight * 0.3
                candidates.append((agent_name, score))

        candidates.sort(key=lambda x: x[1], reverse=True)

        if query.intent == "improvement" and "critic" not in [c[0] for c in candidates]:
            candidates.append(("critic", 0.7))

        if query.cognitive_load > 0.7 and "meta" not in [c[0] for c in candidates]:
            candidates.append(("meta", 0.6))

        return [name for name, _ in candidates[:4]]

    def _execute_agents(self, agent_names: List[str], query: KamosQuery, 
                        context, workers: int) -> List:
        results = []
        with ThreadPoolExecutor(max_workers=workers) as executor:
            futures = {}
            for name in agent_names:
                agent = self.agents[name]
                task = {
                    "query": query.raw,
                    "context": context,
                    "subqueries": query.subqueries if name == "reasoner" else [],
                    "all_agents": list(self.agents.values()) if name == "meta" else []
                }
                future = executor.submit(agent.execute, task)
                futures[future] = name

            for future in as_completed(futures):
                agent_name = futures[future]
                try:
                    result = future.result(timeout=15)
                    results.append(result)
                except Exception as e:
                    print(f"[Error] Agent {agent_name} failed: {str(e)}")
                    try:
                        retry_result = self.agents[agent_name].execute({
                            "query": query.raw,
                            "context": None
                        })
                        results.append(retry_result)
                    except Exception as e2:
                        print(f"[Error] Agent {agent_name} retry failed: {str(e2)}")

        return results

    def _execute_with_subtasks(self, agent_names: List[str], query: KamosQuery,
                               context, workers: int) -> List:
        all_results = []
        for subquery in query.subqueries:
            sub_results = self._execute_agents(agent_names, 
                KamosQuery(raw=subquery, intent=query.intent, subqueries=[subquery]),
                context, workers)
            all_results.extend(sub_results)
        return all_results

    def _agent_debate(self, results: List, query: KamosQuery) -> List:
        if not results or query.intent in ["information", "research"]:
            return results

        critic_result = next((r for r in results if r.agent_name == "critic"), None)
        if not critic_result and len(results) > 1:
            combined = "\n\n".join([f"{r.agent_name}: {r.output[:200]}" for r in results])
            critic_result = self.agents["critic"].execute({
                "query": query.raw,
                "target": combined
            })
            results.append(critic_result)

        return results

    def _synthesize(self, results: List, query: KamosQuery, decision) -> str:
        if not results:
            return "I apologize, but I was unable to process your request. Please try rephrasing."

        results.sort(key=lambda r: r.confidence, reverse=True)
        parts = []

        if query.intent in ["creation", "problem_solving"]:
            coder_result = next((r for r in results if r.agent_name == "coder"), None)
            if coder_result:
                parts.append(coder_result.output)
                if coder_result.sources:
                    parts.append(self._format_sources(coder_result.sources))
            critic_result = next((r for r in results if r.agent_name == "critic"), None)
            if critic_result:
                parts.append("\n\n**Code Review:**\n" + critic_result.output)

        elif query.intent == "explanation":
            reasoner_result = next((r for r in results if r.agent_name == "reasoner"), None)
            if reasoner_result:
                parts.append(reasoner_result.output)
            researcher_result = next((r for r in results if r.agent_name == "researcher"), None)
            if researcher_result:
                parts.append("\n\n**Supporting Research:**\n" + researcher_result.output)
                if researcher_result.sources:
                    parts.append(self._format_sources(researcher_result.sources))

        elif query.intent in ["research", "information"]:
            researcher_result = next((r for r in results if r.agent_name == "researcher"), None)
            if researcher_result:
                parts.append(researcher_result.output)
                if researcher_result.sources:
                    parts.append(self._format_sources(researcher_result.sources))
            reasoner_result = next((r for r in results if r.agent_name == "reasoner"), None)
            if reasoner_result:
                parts.append("\n\n**Analysis:**\n" + reasoner_result.output)

        elif query.intent == "improvement":
            meta_result = next((r for r in results if r.agent_name == "meta"), None)
            if meta_result:
                parts.append(meta_result.output)
            critic_result = next((r for r in results if r.agent_name == "critic"), None)
            if critic_result:
                parts.append("\n\n**Quality Assessment:**\n" + critic_result.output)

        elif query.intent == "comparison":
            reasoner_result = next((r for r in results if r.agent_name == "reasoner"), None)
            if reasoner_result:
                parts.append(reasoner_result.output)
            researcher_result = next((r for r in results if r.agent_name == "researcher"), None)
            if researcher_result:
                parts.append("\n\n**Data:**\n" + researcher_result.output)
                if researcher_result.sources:
                    parts.append(self._format_sources(researcher_result.sources))

        else:
            for result in results:
                parts.append(f"**[{result.agent_name.upper()}]**\n{result.output}")
                if result.sources:
                    parts.append(self._format_sources(result.sources))

        return "\n\n".join(parts)

    def _format_sources(self, sources: List[Dict[str, str]]) -> str:
        if not sources:
            return ""

        unique_sources = []
        seen = set()
        for s in sources:
            key = s.get("url", s.get("name", ""))
            if key and key not in seen:
                seen.add(key)
                unique_sources.append(s)

        lines = ["\n**Sources:**"]
        for i, src in enumerate(unique_sources[:5], 1):
            name = src.get("name", "Unknown")
            url = src.get("url", "")
            trust = float(src.get("trust", "0.5"))
            trust_bar = "█" * int(trust * 10) + "░" * (10 - int(trust * 10))
            if url:
                lines.append(f"  {i}. [{name}]({url}) — Trust: {trust_bar} ({trust:.0%})")
            else:
                lines.append(f"  {i}. {name} — Trust: {trust_bar} ({trust:.0%})")

        return "\n".join(lines)

    def get_system_stats(self) -> Dict[str, Any]:
        return {name: agent.get_stats() for name, agent in self.agents.items()}
