# ASIS AI v3 — Multi-Agent Intelligence System

A fully local, self-evolving, multi-agent AI system powered by **Kamos Theory**.
No external AI APIs. No dependencies. Pure Python.

## What is New in v3

| Feature | v2 | v3 |
|---------|-----|-----|
| Web Search | Hardcoded topics | Real DuckDuckGo search |
| Source Citation | None | Every claim with trust score |
| Task Decomposition | None | Complex queries split into subtasks |
| Semantic Memory | String matching | TF-IDF semantic search |
| Agent Learning | Static weights | Evolving weights from success/failure |
| Agent Debate | Isolated | Critic reviews all outputs |
| Memory Consolidation | None | Old memories summarized |
| Code Generation | Hardcoded templates | Context-aware by type |
| Retry Logic | None | Failed agents retry once |
| Dynamic Scaling | Fixed 3 workers | 2-6 based on complexity |

## Architecture

```
User Input
    |
Task Decomposition (Kamos Engine)
    |
Intent Detection + Agent Selection (learned weights)
    |
Parallel Agent Execution (dynamic workers)
    |
Agent Debate (Critic cross-checks)
    |
Synthesis with Source Attribution
    |
Learning Update (weights evolve)
```

## Quick Start

```bash
chmod +x run.sh
./run.sh
```

## Commands

| Command | Description |
|---------|-------------|
| `stats` | Show agent performance with learned weights |
| `agents` | List all active agents |
| `memory` | Show memory stats (episodic/semantic/consolidated) |
| `consolidate` | Run memory consolidation |
| `feedback <text>` | Record feedback for learning |
| `exit` | Save state and quit |

## Kamos Theory

> **1×1 = 1 + f(growth, replication, interaction, observation)**

Every decision is scored across:
- **Value** (30%) — Insight and usefulness
- **Risk** (20%) — Error potential  
- **Cost** (10%) — Complexity
- **Trust** (25%) — Source verification
- **Long-term** (15%) — Growth potential

Agents learn: success -> higher weight -> selected more often -> more success.
Failure -> lower weight -> selected less -> opportunity for other agents.

## Source Trust Levels

| Level | Indicator | Examples |
|-------|-----------|----------|
| 90% | █████████░ | .edu, .gov, Wikipedia, GitHub, official docs |
| 70% | ███████░░░ | .org, Medium, Dev.to, news sites |
| 60% | ██████░░░░ | General websites |
| 40% | ████░░░░░░ | Social media |

## Agents

| Agent | Role | Domains |
|-------|------|---------|
| **Reasoner** | Chain-of-thought analysis | logic, math, philosophy, science |
| **Coder** | Context-aware code generation | TypeScript, Python, SQL, React |
| **Critic** | Security, performance, correctness audit | code, logic, security |
| **Researcher** | Web search with source citation | all domains |
| **Creator** | Novel solutions and creative design | software, business, education, science |
| **Meta** | Self-reflection and system improvement | system |

## No API Keys Needed

ASIS v3 uses:
- DuckDuckGo HTML search (no API key)
- Pure Python standard library
- Local JSON persistence

## License

Kamos Theory — Proliferative, Adaptive, Context-Aware Intelligence
