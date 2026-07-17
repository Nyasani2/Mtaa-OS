"""
ASIS AI v3 — Semantic Memory Graph
Relational memory with TF-IDF semantic search, consolidation, and source tracking.
"""
import json
import time
import os
import math
import re
from typing import Dict, List, Any, Optional, Set, Tuple
from dataclasses import dataclass, field, asdict
from collections import defaultdict


@dataclass
class MemoryEntry:
    id: str
    content: str
    source: str
    importance: float = 0.5
    tags: List[str] = field(default_factory=list)
    related_ids: List[str] = field(default_factory=list)
    created_at: float = field(default_factory=time.time)
    last_accessed: float = field(default_factory=time.time)
    access_count: int = 0
    # v3: Source attribution
    sources: List[Dict[str, str]] = field(default_factory=list)
    # v3: Memory type
    memory_type: str = "episodic"  # episodic | semantic | procedural
    # v3: Consolidation level
    consolidation_level: int = 0  # 0=raw, 1=summarized, 2=abstracted

    def relevance_score(self, query_tags: List[str]) -> float:
        if not self.tags or not query_tags:
            return 0.0
        overlap = len(set(self.tags) & set(query_tags))
        return overlap / max(len(self.tags), len(query_tags))


class SemanticMemoryIndex:
    """TF-IDF based semantic search — no external dependencies."""

    STOPWORDS = {
        "the", "and", "for", "are", "but", "not", "you", "all", "can", "had", "her", "was", "one",
        "our", "out", "day", "get", "has", "him", "his", "how", "its", "may", "new", "now", "old",
        "see", "two", "who", "boy", "did", "she", "use", "way", "many", "oil", "sit", "set", "run",
        "eat", "far", "sea", "eye", "ago", "off", "too", "any", "say", "man", "try", "ask", "end",
        "why", "let", "put", "too", "old", "tell", "very", "when", "much", "would", "there", "their",
        "what", "said", "each", "which", "will", "about", "could", "other", "after", "first", "never",
        "these", "think", "where", "being", "every", "great", "might", "shall", "still", "those", "while",
        "this", "that", "with", "have", "from", "they", "know", "want", "been", "good", "some", "time",
        "come", "here", "just", "like", "long", "make", "over", "such", "take", "than", "them", "well",
        "were", "also", "then", "only", "most", "even", "back", "work", "life", "without", "between",
        "into", "through", "during", "before", "after", "above", "below", "from", "down", "off", "over",
        "under", "again", "further", "once", "here", "there", "when", "where", "why", "how", "all",
        "any", "both", "each", "few", "more", "most", "other", "some", "such", "no", "nor", "not",
        "only", "own", "same", "so", "than", "too", "very", "can", "will", "just", "should", "now"
    }

    def __init__(self):
        self.documents: Dict[str, str] = {}
        self.term_freq: Dict[str, Dict[str, int]] = defaultdict(lambda: defaultdict(int))
        self.doc_freq: Dict[str, int] = defaultdict(int)
        self.idf: Dict[str, float] = {}
        self._dirty = True

    def _tokenize(self, text: str) -> List[str]:
        text = text.lower()
        text = re.sub(r"[^\w\s]", " ", text)
        return [t for t in text.split() if len(t) > 2 and t not in self.STOPWORDS]

    def add(self, doc_id: str, text: str):
        self.documents[doc_id] = text
        tokens = self._tokenize(text)
        token_set = set(tokens)
        for token in tokens:
            self.term_freq[doc_id][token] += 1
        for token in token_set:
            self.doc_freq[token] += 1
        self._dirty = True

    def remove(self, doc_id: str):
        if doc_id not in self.documents:
            return
        tokens = set(self._tokenize(self.documents[doc_id]))
        for token in tokens:
            self.doc_freq[token] -= 1
            if self.doc_freq[token] <= 0:
                del self.doc_freq[token]
        del self.term_freq[doc_id]
        del self.documents[doc_id]
        self._dirty = True

    def _compute_idf(self):
        if not self._dirty:
            return
        n_docs = max(1, len(self.documents))
        for term, freq in list(self.doc_freq.items()):
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
            doc_len = max(1, len(doc_tokens))
            for token in query_tokens:
                tf = self.term_freq[doc_id].get(token, 0)
                idf = self.idf.get(token, 0)
                score += (tf / doc_len) * idf
            if score > 0:
                scores[doc_id] = score

        return sorted(scores.items(), key=lambda x: x[1], reverse=True)[:top_k]


class MemoryGraph:
    """
    v3 Semantic Memory Graph:
    - TF-IDF semantic search (not just string matching)
    - Source attribution for every memory
    - Memory consolidation (old memories summarized)
    - Episodic vs Semantic distinction
    """

    def __init__(self, storage_path: str = "knowledge_base/memory.json"):
        self.storage_path = storage_path
        self.memories: Dict[str, MemoryEntry] = {}
        self.tag_index: Dict[str, Set[str]] = {}
        self.semantic_index = SemanticMemoryIndex()
        self.load()

    def add(self, content: str, source: str = "user", importance: float = 0.5,
            tags: List[str] = None, sources: List[Dict[str, str]] = None,
            memory_type: str = "episodic") -> MemoryEntry:
        entry_id = f"mem_{int(time.time() * 1000)}_{hash(content) & 0xFFFF:04x}"
        entry = MemoryEntry(
            id=entry_id,
            content=content,
            source=source,
            importance=importance,
            tags=tags or [],
            sources=sources or [],
            memory_type=memory_type
        )
        self.memories[entry_id] = entry
        self.semantic_index.add(entry_id, content)

        for tag in entry.tags:
            if tag not in self.tag_index:
                self.tag_index[tag] = set()
            self.tag_index[tag].add(entry_id)

        self.save()
        return entry

    def search(self, query: str, tags: List[str] = None, top_k: int = 5) -> List[MemoryEntry]:
        """Semantic + tag-based search."""
        query_lower = query.lower()
        query_tags = tags or []

        # Semantic search
        semantic_results = self.semantic_index.search(query, top_k=top_k * 2)
        semantic_ids = {doc_id for doc_id, _ in semantic_results}

        # Tag search
        tag_matches = set()
        if query_tags:
            for tag in query_tags:
                tag_lower = tag.lower()
                for indexed_tag, ids in self.tag_index.items():
                    if tag_lower in indexed_tag.lower() or indexed_tag.lower() in tag_lower:
                        tag_matches.update(ids)

        # Combine and score
        scored = []
        candidates = set(self.memories.keys())
        if semantic_ids:
            candidates = candidates & semantic_ids
        if tag_matches:
            candidates = candidates & tag_matches

        for entry_id in candidates:
            entry = self.memories[entry_id]
            content_score = 0.7 if query_lower in entry.content.lower() else 0.0
            # Semantic boost
            semantic_score = next((score for doc_id, score in semantic_results if doc_id == entry_id), 0)
            tag_score = entry.relevance_score(query_tags)
            importance_boost = entry.importance * 0.2
            age_hours = (time.time() - entry.created_at) / 3600
            recency_boost = max(0, 0.1 - age_hours * 0.001)
            consolidation_penalty = entry.consolidation_level * 0.05  # Older summaries score slightly lower
            total_score = content_score + semantic_score * 0.5 + tag_score + importance_boost + recency_boost - consolidation_penalty
            if total_score > 0:
                scored.append((entry, total_score))

        scored.sort(key=lambda x: x[1], reverse=True)
        for entry, _ in scored[:top_k]:
            entry.access_count += 1
            entry.last_accessed = time.time()

        return [entry for entry, _ in scored[:top_k]]

    def get_context(self, query: str, max_entries: int = 3) -> str:
        memories = self.search(query, top_k=max_entries)
        if not memories:
            return ""
        lines = []
        for m in memories:
            source_str = ""
            if m.sources:
                source_names = [s.get("name", "unknown") for s in m.sources[:2]]
                source_str = f" [Sources: {', '.join(source_names)}]"
            lines.append(f"[{m.source}]{source_str} {m.content}")
        return "\n".join(lines)

    # ═══════════════════════════════════════════════════════════════════════
    # v3: MEMORY CONSOLIDATION
    # ═══════════════════════════════════════════════════════════════════════

    def consolidate(self, max_age_hours: float = 168, min_entries: int = 5):
        """
        Summarize old episodic memories into semantic memories.
        Run periodically to prevent memory bloat.
        """
        cutoff = time.time() - (max_age_hours * 3600)
        old_memories = [m for m in self.memories.values()
                       if m.created_at < cutoff and m.memory_type == "episodic" and m.consolidation_level == 0]

        if len(old_memories) < min_entries:
            return 0

        # Group by tags
        tag_groups: Dict[str, List[MemoryEntry]] = defaultdict(list)
        for mem in old_memories:
            for tag in mem.tags:
                tag_groups[tag].append(mem)

        consolidated = 0
        for tag, entries in tag_groups.items():
            if len(entries) < 3:
                continue

            # Create summary
            summary = f"Summary of {len(entries)} memories about '{tag}': "
            summary += "; ".join([e.content[:100] for e in entries[:5]])
            if len(entries) > 5:
                summary += f" and {len(entries) - 5} more."

            # Mark old entries as consolidated
            for e in entries:
                e.consolidation_level = 1
                e.importance *= 0.5  # Reduce importance of raw memories

            # Add semantic memory
            all_sources = []
            for e in entries:
                all_sources.extend(e.sources)

            self.add(
                content=summary,
                source="consolidation",
                importance=0.7,
                tags=[tag, "consolidated"],
                sources=all_sources[:5],
                memory_type="semantic"
            )
            consolidated += len(entries)

        self.save()
        return consolidated

    def save(self):
        os.makedirs(os.path.dirname(self.storage_path) or ".", exist_ok=True)
        data = {
            "memories": {mid: asdict(mem) for mid, mem in self.memories.items()},
            "tag_index": {tag: list(ids) for tag, ids in self.tag_index.items()}
        }
        with open(self.storage_path, 'w') as f:
            json.dump(data, f, indent=2)

    def load(self):
        if not os.path.exists(self.storage_path):
            return
        try:
            with open(self.storage_path, 'r') as f:
                data = json.load(f)
            self.memories = {mid: MemoryEntry(**mem_data) for mid, mem_data in data.get("memories", {}).items()}
            self.tag_index = {tag: set(ids) for tag, ids in data.get("tag_index", {}).items()}
            # Rebuild semantic index
            for mid, mem in self.memories.items():
                self.semantic_index.add(mid, mem.content)
        except Exception:
            pass

    def stats(self) -> Dict[str, Any]:
        total = len(self.memories)
        if total == 0:
            return {"total_memories": 0, "total_tags": 0, "avg_importance": 0}
        episodic = sum(1 for m in self.memories.values() if m.memory_type == "episodic")
        semantic = sum(1 for m in self.memories.values() if m.memory_type == "semantic")
        return {
            "total_memories": total,
            "episodic": episodic,
            "semantic": semantic,
            "total_tags": len(self.tag_index),
            "avg_importance": sum(m.importance for m in self.memories.values()) / total,
            "consolidated": sum(1 for m in self.memories.values() if m.consolidation_level > 0),
        }
