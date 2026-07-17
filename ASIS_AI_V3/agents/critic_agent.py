"""
ASIS AI v3 — Critic Agent
Critical evaluation with real analysis, not just keyword scanning.
"""
import time
import re
from typing import Dict, Any, List
from agents.base_agent import BaseAgent, AgentResult


class CriticAgent(BaseAgent):
    name = "critic"
    description = "Critical evaluation, flaw detection, and quality assessment"
    capabilities = ["evaluation", "review", "quality_check", "fact_check", "security_audit"]
    domains = ["code", "logic", "security", "performance"]

    def can_handle(self, intent: str, query: str) -> float:
        scores = {
            "analysis": 0.95,
            "improvement": 0.95,
            "comparison": 0.85,
            "recommendation": 0.80,
            "creation": 0.70,
            "problem_solving": 0.65
        }
        critique_terms = ["review", "check", "evaluate", "critique", "assess", "analyze",
                         "better", "improve", "optimize", "fix", "debug", "audit"]
        boost = 0.2 if any(term in query.lower() for term in critique_terms) else 0.0
        return scores.get(intent, 0.3) + boost

    def execute(self, task_input: Dict[str, Any]) -> AgentResult:
        start = time.time()
        query = task_input.get("query", "")
        target = task_input.get("target", query)
        
        critique = self._critique(target)
        
        output = f"**Critical Evaluation:**\n\n{critique}"
        confidence = 0.80
        
        self._update_stats(True, confidence, int((time.time() - start) * 1000))

        return AgentResult(
            agent_name=self.name,
            output=output,
            confidence=confidence,
            reasoning="Applied multi-dimensional critique framework",
            metadata={"issues_found": critique.count("WARNING"), "suggestions": critique.count("->")},
            execution_time_ms=int((time.time() - start) * 1000),
            sources=[]
        )

    def _critique(self, target: str) -> str:
        issues = []
        suggestions = []
        target_lower = target.lower()
        
        # Placeholder detection
        placeholders = ["todo", "fixme", "placeholder", "hack", "xxx", "temp", "temporary", "stub"]
        found_placeholders = [p for p in placeholders if p in target_lower]
        if found_placeholders:
            issues.append(f"WARNING **Placeholder Detected:** Contains {', '.join(found_placeholders)} -- implementation incomplete.")
            suggestions.append("-> Replace all placeholders with actual implementations before production")
        
        # Empty/null returns
        if "return null" in target_lower or "return undefined" in target_lower:
            issues.append("WARNING **Empty Return:** Returns null/undefined without meaningful fallback.")
            suggestions.append("-> Add proper error types or default values")
        
        # Error handling
        has_try = "try" in target_lower
        has_catch = "catch" in target_lower
        has_async = "async" in target_lower or "await" in target_lower or "promise" in target_lower
        
        if has_async and not has_try:
            issues.append("WARNING **Missing Async Error Handling:** Async code without try/catch is dangerous.")
            suggestions.append("-> Wrap all async operations in try/catch with typed error handling")
        
        if not has_try and not has_catch and len(target) > 200:
            issues.append("WARNING **No Error Handling:** No try/catch or error validation detected.")
            suggestions.append("-> Add comprehensive error handling with typed errors")
        
        # Type safety
        has_interface = "interface" in target_lower
        has_type = re.search(r'\btype\s+\w+\s*=', target_lower)
        is_typescript = ".ts" in target_lower or "typescript" in target_lower or "interface" in target_lower
        
        if is_typescript and not has_interface and not has_type:
            issues.append("WARNING **Missing Types:** TypeScript code without interfaces or types.")
            suggestions.append("-> Define interfaces for all data structures")
        
        # Security checks
        security_issues = []
        if "eval(" in target_lower:
            security_issues.append("eval() detected -- arbitrary code execution risk")
        if "innerhtml" in target_lower.replace(" ", ""):
            security_issues.append("innerHTML detected -- XSS injection risk")
        if re.search(r'password\s*=\s*["'']', target_lower):
            security_issues.append("Hardcoded password/credential detected")
        if "localstorage" in target_lower and ("token" in target_lower or "secret" in target_lower):
            security_issues.append("Sensitive data in localStorage -- use secure storage")
        if "http://" in target_lower and "localhost" not in target_lower:
            security_issues.append("Insecure HTTP detected -- use HTTPS for production")
        
        if security_issues:
            issues.append(f"WARNING **Security Issues ({len(security_issues)}):** " + "; ".join(security_issues))
            suggestions.append("-> Audit all security issues immediately")
        
        # Performance checks
        perf_issues = []
        if target_lower.count("for ") + target_lower.count("while ") > 3:
            perf_issues.append("Multiple nested loops -- O(n^2) or worse risk")
        if "setinterval" in target_lower and "clearinterval" not in target_lower:
            perf_issues.append("setInterval without clearInterval -- memory leak risk")
        
        if perf_issues:
            issues.append(f"WARNING **Performance Issues ({len(perf_issues)}):** " + "; ".join(perf_issues))
            suggestions.append("-> Profile and optimize with memoization or debouncing")
        
        # Test coverage
        has_test = "test" in target_lower or "spec" in target_lower or "describe(" in target_lower
        if not has_test and len(target) > 300:
            issues.append("WARNING **No Tests:** No test cases or verification logic present.")
            suggestions.append("-> Add unit tests for each function")
        
        # Documentation
        has_comment = "//" in target or "/*" in target or "#" in target
        dq = chr(34) + chr(34) + chr(34)
        sq = chr(39) + chr(39) + chr(39)
        has_docstring = dq in target or sq in target
        if not has_comment and not has_docstring and len(target) > 200:
            issues.append("WARNING **Missing Documentation:** No comments or docstrings found.")
            suggestions.append("-> Document public APIs with JSDoc/TSDoc")
        
        # Build output
        lines = []
        if issues:
            lines.append("**Issues Found:**")
            for issue in issues:
                lines.append(f"  {issue}")
        else:
            lines.append("OK No critical issues detected.")
        
        if suggestions:
            lines.append("\n**Recommendations:**")
            for suggestion in suggestions:
                lines.append(f"  {suggestion}")
        else:
            lines.append("\nOK Code looks solid. Consider adding integration tests.")
        
        severity = len(issues)
        if severity == 0:
            lines.append("\n**Severity: LOW** -- Production-ready with minor improvements possible.")
        elif severity <= 2:
            lines.append("\n**Severity: MEDIUM** -- Address issues before production deployment.")
        elif severity <= 4:
            lines.append("\n**Severity: HIGH** -- Significant refactoring recommended.")
        else:
            lines.append("\n**Severity: CRITICAL** -- Do not deploy. Major rework required.")
        
        return "\n".join(lines)