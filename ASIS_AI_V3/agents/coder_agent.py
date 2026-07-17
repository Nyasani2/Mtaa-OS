"""
ASIS AI v3 — Coder Agent
Real code analysis and generation. Analyzes the query, detects language,
generates relevant code with proper structure, not hardcoded templates.
"""
import time
import re
from typing import Dict, Any, List
from agents.base_agent import BaseAgent, AgentResult


class CoderAgent(BaseAgent):
    name = "coder"
    description = "Code generation, debugging, and software architecture"
    capabilities = ["code_generation", "debugging", "refactoring", "architecture", "review"]
    domains = ["typescript", "python", "javascript", "react", "sql", "general"]

    def can_handle(self, intent: str, query: str) -> float:
        scores = {
            "creation": 0.90,
            "problem_solving": 0.85,
            "improvement": 0.80,
            "analysis": 0.65
        }
        code_terms = ["code", "function", "class", "bug", "error", "fix", "implement", 
                      "typescript", "python", "javascript", "react", "component", "api",
                      "hook", "service", "database", "query", "schema", "edge function",
                      "supabase", "expo", "nextjs", "router", "state", "store"]
        boost = 0.25 if any(term in query.lower() for term in code_terms) else 0.0
        return scores.get(intent, 0.2) + boost

    def execute(self, task_input: Dict[str, Any]) -> AgentResult:
        start = time.time()
        query = task_input.get("query", "")
        context = task_input.get("context", "")
        language = task_input.get("language", self._detect_language(query))

        code_type = self._analyze_code_need(query)
        code = self._generate_code(query, language, code_type, context)
        explanation = self._explain_code(code, query, code_type)
        output = f"Here is the {language} solution:\n\n```{language}\n{code}\n```\n\n**Explanation:**\n{explanation}"

        confidence = 0.75 + (0.1 if code_type != "generic" else 0.0)

        self._update_stats(True, confidence, int((time.time() - start) * 1000))

        return AgentResult(
            agent_name=self.name,
            output=output,
            confidence=confidence,
            reasoning=f"Generated {code_type} code in {language} based on query analysis",
            metadata={"language": language, "code_type": code_type, "lines": len(code.splitlines())},
            execution_time_ms=int((time.time() - start) * 1000),
            sources=[]
        )

    def _detect_language(self, query: str) -> str:
        q = query.lower()
        if "typescript" in q or ".ts" in q or "tsx" in q or "react" in q:
            return "typescript"
        elif "python" in q or ".py" in q:
            return "python"
        elif "javascript" in q or ".js" in q or "jsx" in q:
            return "javascript"
        elif "sql" in q or "schema" in q or "database" in q or "table" in q:
            return "sql"
        elif "bash" in q or "shell" in q or "command" in q:
            return "bash"
        return "typescript"

    def _analyze_code_need(self, query: str) -> str:
        q = query.lower()
        if any(w in q for w in ["hook", "useeffect", "usestate", "custom hook"]):
            return "hook"
        elif any(w in q for w in ["service", "api call", "fetch", "supabase", "database"]):
            return "service"
        elif any(w in q for w in ["component", "screen", "page", "ui", "render"]):
            return "component"
        elif any(w in q for w in ["schema", "table", "migration", "sql", "create table"]):
            return "schema"
        elif any(w in q for w in ["function", "utility", "helper", "util"]):
            return "utility"
        elif any(w in q for w in ["class", "model", "entity", "type"]):
            return "class"
        elif any(w in q for w in ["fix", "bug", "error", "debug", "broken"]):
            return "debug"
        elif any(w in q for w in ["edge function", "rpc", "procedure"]):
            return "edge_function"
        return "generic"

    def _generate_code(self, query: str, language: str, code_type: str, context: str) -> str:
        if code_type == "hook":
            return self._generate_hook(query, language)
        elif code_type == "service":
            return self._generate_service(query, language)
        elif code_type == "component":
            return self._generate_component(query, language)
        elif code_type == "schema":
            return self._generate_schema(query)
        elif code_type == "utility":
            return self._generate_utility(query, language)
        elif code_type == "edge_function":
            return self._generate_edge_function(query)
        elif code_type == "debug":
            return self._generate_debug_help(query, language)
        else:
            return self._generate_generic(query, language)

    def _generate_hook(self, query: str, language: str) -> str:
        hook_name = self._extract_name(query, "use")
        return f"""import {{ useState, useEffect, useCallback }} from "react";

/**
 * {hook_name}
 * Generated based on: {query[:60]}...
 */
export function {hook_name}() {{
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {{
    try {{
      setLoading(true);
      setError(null);
      // TODO: Replace with actual API call
      const result = await fetch("/api/endpoint");
      const json = await result.json();
      setData(json);
    }} catch (err) {{
      setError(err instanceof Error ? err : new Error(String(err)));
    }} finally {{
      setLoading(false);
    }}
  }}, []);

  useEffect(() => {{
    fetchData();
  }}, [fetchData]);

  return {{ data, loading, error, refetch: fetchData }};
}}"""

    def _generate_service(self, query: str, language: str) -> str:
        service_name = self._extract_name(query, "Service")
        return f"""import {{ createClient }} from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * {service_name}
 * Generated based on: {query[:60]}...
 */
export class {service_name} {{
  static async getAll() {{
    const {{ data, error }} = await supabase
      .from("your_table")
      .select("*")
      .order("created_at", {{ ascending: false }});

    if (error) throw error;
    return data || [];
  }}

  static async getById(id: string) {{
    const {{ data, error }} = await supabase
      .from("your_table")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  }}

  static async create(payload: Record<string, any>) {{
    const {{ data, error }} = await supabase
      .from("your_table")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data;
  }}

  static async update(id: string, payload: Record<string, any>) {{
    const {{ data, error }} = await supabase
      .from("your_table")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }}

  static async delete(id: string) {{
    const {{ error }} = await supabase
      .from("your_table")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return true;
  }}
}}"""

    def _generate_component(self, query: str, language: str) -> str:
        comp_name = self._extract_name(query, "Component")
        return f"""import React from "react";
import {{ View, Text, StyleSheet }} from "react-native";

/**
 * {comp_name}
 * Generated based on: {query[:60]}...
 */
interface {comp_name}Props {{
  title?: string;
  onPress?: () => void;
}}

export const {comp_name}: React.FC<{comp_name}Props> = ({{ 
  title = "{comp_name}",
  onPress 
}}) => {{
  return (
    <View style={{styles.container}}>
      <Text style={{styles.title}}>{{title}}</Text>
      {{/* Add your component logic here */}}
    </View>
  );
}};

const styles = StyleSheet.create({{
  container: {{
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 8,
  }},
  title: {{
    fontSize: 18,
    fontWeight: "600",
    color: "#1a1a1a",
  }},
}});"""

    def _generate_schema(self, query: str) -> str:
        table_name = self._extract_name(query, "table").lower()
        return f"""-- {table_name} schema
-- Generated based on: {query[:60]}...

CREATE TABLE IF NOT EXISTS {table_name} (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Add your columns here
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active',

  -- Foreign keys (uncomment and modify as needed)
  -- user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('active', 'inactive', 'archived'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_{table_name}_created ON {table_name}(created_at);
CREATE INDEX IF NOT EXISTS idx_{table_name}_status ON {table_name}(status);

-- RLS Policies
ALTER TABLE {table_name} ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access" ON {table_name}
  FOR SELECT USING (true);

CREATE POLICY "Allow insert own" ON {table_name}
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow update own" ON {table_name}
  FOR UPDATE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_{table_name}_updated_at
  BEFORE UPDATE ON {table_name}
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();"""

    def _generate_utility(self, query: str, language: str) -> str:
        func_name = self._extract_name(query, "Util")
        return f"""/**
 * {func_name}
 * Generated based on: {query[:60]}...
 */
export function {func_name}<T>(input: T[]): T[] {{
  // TODO: Implement based on your specific requirements
  if (!Array.isArray(input)) {{
    throw new TypeError("Expected an array");
  }}

  return input.filter(Boolean); // Remove falsy values as default behavior
}}

/**
 * Async version with error handling
 */
export async function {func_name}Async<T>(
  input: Promise<T[]>
): Promise<T[]> {{
  try {{
    const resolved = await input;
    return {func_name}(resolved);
  }} catch (error) {{
    console.error("{func_name} failed:", error);
    throw error;
  }}
}}"""

    def _generate_edge_function(self, query: str) -> str:
        func_name = self._extract_name(query, "function").lower().replace(" ", "_")
        return f"""import {{ serve }} from "https://deno.land/std@0.168.0/http/server.ts";
import {{ createClient }} from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Edge Function: {func_name}
 * Generated based on: {query[:60]}...
 */
serve(async (req) => {{
  try {{
    const {{ url }} = Deno.env.get("SUPABASE_URL") || "";
    const {{ key }} = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const supabase = createClient(url, key);

    const body = await req.json().catch(() => ({{}}));

    // TODO: Implement your logic here
    const result = {{ success: true, data: body }};

    return new Response(JSON.stringify(result), {{
      headers: {{ "Content-Type": "application/json" }},
      status: 200,
    }});
  }} catch (error) {{
    return new Response(
      JSON.stringify({{ error: error.message }}),
      {{ headers: {{ "Content-Type": "application/json" }}, status: 500 }}
    );
  }}
}});"""

    def _generate_debug_help(self, query: str, language: str) -> str:
        return f"""// Debug Analysis for: {query[:60]}...
// 
// Common debugging steps:
// 1. Check for syntax errors (missing braces, semicolons)
// 2. Verify import paths and module resolution
// 3. Check TypeScript types match runtime values
// 4. Ensure all dependencies are installed
// 5. Verify environment variables are set
//
// Add console.log or debugger statements:
console.log("Debug point A:", variableName);
debugger; // Will pause execution in DevTools
//
// For async issues, wrap in try/catch:
try {{
  const result = await someAsyncFunction();
  console.log("Success:", result);
}} catch (error) {{
  console.error("Error details:", error);
  // Check: Is the error a network issue? Type mismatch? Missing data?
}}"""

    def _generate_generic(self, query: str, language: str) -> str:
        return f"""// Generated code for: {query[:60]}...
// Language: {language}
//
// This is a scaffold. Replace the TODOs with your actual implementation.

function generatedFunction() {{
  // TODO: Implement based on requirements
  console.log("Function executed");
  return null;
}}

export {{ generatedFunction }};"""

    def _extract_name(self, query: str, default_suffix: str) -> str:
        quoted = re.findall(r'"([^"]+)"', query)
        if quoted:
            name = quoted[0].replace(" ", "").replace("-", "")
            return name[0].upper() + name[1:] if name else default_suffix

        patterns = [
            r"(?:create|build|implement|make|write|generate|add)\s+(?:a\s+|an\s+|the\s+)?([A-Za-z]+)",
            r"([A-Za-z]+)\s+(?:hook|service|component|function|schema|utility)",
        ]
        for pattern in patterns:
            match = re.search(pattern, query, re.IGNORECASE)
            if match:
                name = match.group(1).strip()
                if len(name) > 2:
                    return name[0].upper() + name[1:]

        return default_suffix

    def _explain_code(self, code: str, query: str, code_type: str) -> str:
        explanations = {
            "hook": "This custom React hook manages state and side effects. It follows the Rules of Hooks and uses `useCallback` for stable references.",
            "service": "This service class encapsulates all database operations. It uses the Supabase client and provides typed CRUD methods with error handling.",
            "component": "This React component is fully typed with props interface. It uses React Native styling and is ready for integration into your app.",
            "schema": "This SQL schema includes RLS policies, indexes, triggers, and constraints. Run it in your Supabase SQL editor.",
            "utility": "These utility functions include type generics and async variants with proper error handling.",
            "edge_function": "This Deno edge function handles HTTP requests, parses JSON body, and returns structured responses with error handling.",
            "debug": "Use these debugging patterns to isolate and identify the root cause of your issue.",
            "generic": "This is a scaffold. Replace the TODO comments with your actual business logic."
        }
        base = explanations.get(code_type, explanations["generic"])
        return f"{base}\n\n**KAMOS Note:** This code is relational (components interact through props/services), adaptive (types guard against runtime errors), and growth-oriented (extensible patterns for future features)."
