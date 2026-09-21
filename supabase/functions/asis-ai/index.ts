import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const { query, conversationHistory, systemPrompt, userId } = await req.json()

    // CRITICAL: Use the system prompt if provided (contains ASIS identity)
    const finalSystemPrompt = systemPrompt || `You are ASIS, created by Kevin Nyasani in Kenya.`

    // Call Kimi API (or your preferred LLM)
    const KIMI_API_KEY = Deno.env.get('KIMI_API_KEY')
    
    const response = await fetch("https://api.moonshot.cn/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${KIMI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "moonshot-v1-8k",
        messages: [
          { role: "system", content: finalSystemPrompt },
          { role: "user", content: `${conversationHistory}\n\nUser: ${query}` }
        ],
        temperature: 0.7,
      }),
    })

    const data = await response.json()
    const aiResponse = data.choices?.[0]?.message?.content || "I couldn't generate a response."

    return new Response(
      JSON.stringify({
        response: aiResponse,
        sources: ["Kimi API"],
        confidence: 0.9,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (error) {
    console.error("Edge function error:", error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    )
  }
})
