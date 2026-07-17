"""
ASIS AI v3 — Base Agent Class
Every agent produces output with source attribution and confidence scoring.
"""
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field
import time


@dataclass
class AgentResult:
    agent_name: str
    output: str
    confidence: float
    reasoning: str
    metadata: Dict[str, Any]
    execution_time_ms: int
    # v3: Source attribution — every claim traced
    sources: List[Dict[str, str]] = field(default_factory=list)
    # v3: Sub-task results for complex queries
    sub_results: List[Dict[str, Any]] = field(default_factory=list)


class BaseAgent(ABC):
    name: str = "base"
    description: str = "Base agent"
    capabilities: List[str] = []

    # v3: Agent specialization domains
    domains: List[str] = []

    def __init__(self, engine=None, memory=None):
        self.engine = engine
        self.memory = memory
        self.stats = {
            "calls": 0,
            "successes": 0,
            "failures": 0,
            "avg_confidence": 0.0,
            "avg_execution_ms": 0
        }

    @abstractmethod
    def execute(self, task_input: Dict[str, Any]) -> AgentResult:
        pass

    def can_handle(self, intent: str, query: str) -> float:
        return 0.0

    def _update_stats(self, success: bool, confidence: float, execution_ms: int):
        self.stats["calls"] += 1
        if success:
            self.stats["successes"] += 1
        else:
            self.stats["failures"] += 1
        n = self.stats["calls"]
        self.stats["avg_confidence"] = (self.stats["avg_confidence"] * (n - 1) + confidence) / n
        self.stats["avg_execution_ms"] = (self.stats["avg_execution_ms"] * (n - 1) + execution_ms) / n

    def get_stats(self) -> Dict[str, Any]:
        return {
            **self.stats,
            "success_rate": self.stats["successes"] / max(1, self.stats["calls"]),
            "name": self.name,
            "description": self.description,
            "capabilities": self.capabilities,
            "domains": self.domains
        }

    # v3: Utility for source formatting
    def _format_sources(self, sources: List[Dict[str, str]]) -> str:
        if not sources:
            return ""
        lines = ["\n**Sources:**"]
        for i, src in enumerate(sources[:5], 1):
            name = src.get("name", "Unknown")
            url = src.get("url", "")
            trust = src.get("trust", 0.5)
            trust_str = "█" * int(trust * 10) + "░" * (10 - int(trust * 10))
            if url:
                lines.append(f"  {i}. [{name}]({url}) — Trust: {trust_str} ({trust:.0%})")
            else:
                lines.append(f"  {i}. {name} — Trust: {trust_str} ({trust:.0%})")
        return "\n".join(lines)
