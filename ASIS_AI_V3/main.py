#!/usr/bin/env python3
"""
ASIS AI v3 — Multi-Agent Intelligence System
Powered by KAMOS Theory: 1×1 = 1 + f(growth, replication, interaction, observation)

No external AI APIs. Pure Python. Self-evolving.
"""
import sys
import os
import json

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from orchestrator import MultiAgentOrchestrator


class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    END = '\033[0m'
    BOLD = '\033[1m'


def load_config() -> dict:
    defaults = {
        "learning_rate": 0.15,
        "decay_rate": 0.001,
        "max_history": 1000,
        "show_reasoning": True,
        "show_sources": True,
        "memory_path": "knowledge_base/memory.json",
        "max_workers": 3,
        "absolute_max_workers": 6,
    }
    if os.path.exists("config.json"):
        try:
            with open("config.json", "r") as f:
                defaults.update(json.load(f))
        except Exception:
            pass
    return defaults


def print_banner():
    c = Colors()
    print(c.HEADER + '='*70 + c.END)
    print(c.CYAN + c.BOLD + '  ASIS AI v3 — Multi-Agent Intelligence System' + c.END)
    print(c.CYAN + '  Powered by KAMOS Theory' + c.END)
    print(c.YELLOW + '  1×1 = 1 + f(growth, replication, interaction, observation)' + c.END)
    print(c.GREEN + '  Agents: Reasoner | Coder | Critic | Researcher | Creator | Meta' + c.END)
    print(c.GREEN + '  Features: Web Search | Source Citation | Task Decomposition | Self-Learning' + c.END)
    print(c.HEADER + '='*70 + c.END)
    print(c.YELLOW + '  Commands: stats | agents | memory | consolidate | feedback <text> | exit' + c.END)
    print("")


def main():
    config = load_config()
    os.makedirs("knowledge_base", exist_ok=True)

    orchestrator = MultiAgentOrchestrator(config)
    print_banner()

    while True:
        try:
            user_input = input(Colors.BLUE + "You: " + Colors.END).strip()
            if not user_input:
                continue

            if user_input.lower() in ["exit", "quit", "bye"]:
                print("")
                print(Colors.GREEN + "ASIS: Saving state and shutting down..." + Colors.END)
                orchestrator.engine.save("knowledge_base/kamos_state.json")
                break

            if user_input.lower() == "stats":
                stats = orchestrator.get_system_stats()
                print("")
                print(Colors.CYAN + "=== Agent Statistics ===" + Colors.END)
                for name, s in stats.items():
                    status = "OK" if s.get('success_rate', 1) > 0.8 else "WARN"
                    print(f"  [{status}] " + Colors.BOLD + name + Colors.END + 
                          f": {s['calls']} calls, {int(s['success_rate']*100)}% success")
                continue

            if user_input.lower() == "agents":
                print("")
                print(Colors.CYAN + "=== Active Agents ===" + Colors.END)
                for name, agent in orchestrator.agents.items():
                    print(f"  • " + Colors.BOLD + name + Colors.END + ": " + agent.description)
                continue

            if user_input.lower() == "memory":
                mem_stats = orchestrator.memory.stats()
                print("")
                print(Colors.CYAN + "=== Memory Stats ===" + Colors.END)
                for k, v in mem_stats.items():
                    print(f"  {k}: {v}")
                continue

            if user_input.lower() == "consolidate":
                print(Colors.YELLOW + "Consolidating memory..." + Colors.END, end="\r")
                count = orchestrator.memory.consolidate(max_age_hours=24)
                print(" " * 30, end="\r")
                print(Colors.GREEN + f"Consolidated {count} memories." + Colors.END)
                continue

            if user_input.lower().startswith("feedback "):
                feedback = user_input[9:]
                print(Colors.GREEN + f"Feedback recorded: {feedback}" + Colors.END)
                continue

            print(Colors.YELLOW + "ASIS is thinking..." + Colors.END, end="\r")
            result = orchestrator.process(user_input)
            print(" " * 30, end="\r")

            print("")
            print(Colors.BOLD + "ASIS:" + Colors.END + " " + result['response'])

            if config.get("show_reasoning", True):
                r = result["reasoning"]
                print("")
                print(Colors.YELLOW + f"[Agents: {', '.join(r['agents_deployed'])} | " +
                      f"Confidence: {r['confidence']}% | KAMOS: {round(r['kamos_score'], 3)} | " +
                      f"Load: {r['cognitive_load']:.2f}]" + Colors.END)

            if config.get("show_sources", True) and result.get("sources"):
                print(result["sources"])

            print(Colors.CYAN + f"[Response time: {result['response_time_ms']}ms]" + Colors.END)

        except KeyboardInterrupt:
            print("")
            print(Colors.YELLOW + "Interrupted. Saving..." + Colors.END)
            orchestrator.engine.save("knowledge_base/kamos_state.json")
            break
        except EOFError:
            break


if __name__ == "__main__":
    main()
