import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { query, context, identityContext } = await req.json();

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("LLM_API_KEY")}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://mtaa.app",
        "X-Title": "MTAA ASIS",
      },
      body: JSON.stringify({
        model: "qwen/qwen-2.5-72b-instruct",
        messages: [
          { role: "system", content: identityContext },
          { role: "user", content: `Previous context:\n${context}\n\nUser query: ${query}` }
        ],
      }),
    });

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || "I couldn't generate a response.";

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
