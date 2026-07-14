import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const { country_code, profile_id } = await req.json();
  const supabase = createClient((globalThis as any).Deno?.env?.get("SUPABASE_URL")!, (globalThis as any).Deno?.env?.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // Get country config
  const { data: config } = await supabase.from("revenue_country_config").select("*").eq("country_code", country_code).single();
  if (!config) return new Response(JSON.stringify({ error: "Country not configured" }), { status: 400 });

  // Generate ID based on format
  let taxpayer_id = "";
  const randomDigits = () => Math.floor(Math.random() * 10);
  const randomLetter = () => String.fromCharCode(65 + Math.floor(Math.random() * 26));

  switch (country_code) {
    case "KE": // A001234567B
      taxpayer_id = randomLetter() + Array.from({length: 9}, randomDigits).join("") + randomLetter();
      break;
    case "UG": // 1234567890
      taxpayer_id = Array.from({length: 10}, randomDigits).join("");
      break;
    case "GH": // GH1234567890
      taxpayer_id = randomLetter() + randomLetter() + Array.from({length: 10}, randomDigits).join("");
      break;
    case "NG": // 1234567890-1
      taxpayer_id = Array.from({length: 10}, randomDigits).join("") + "-" + randomDigits();
      break;
    case "ZA": // 1234567890
      taxpayer_id = Array.from({length: 10}, randomDigits).join("");
      break;
    case "TZ": // 123456789T
      taxpayer_id = Array.from({length: 9}, randomDigits).join("") + randomLetter();
      break;
    case "RW": // 123456789
      taxpayer_id = Array.from({length: 9}, randomDigits).join("");
      break;
    default:
      taxpayer_id = Array.from({length: 10}, randomDigits).join("");
  }

  // Check uniqueness
  const { data: existing } = await supabase.from("revenue_taxpayers").select("id").eq("taxpayer_id", taxpayer_id).maybeSingle();
  if (existing) {
    // Recurse if collision (rare)
    return new Response(JSON.stringify({ error: "ID collision, retry" }), { status: 409 });
  }

  return new Response(JSON.stringify({ taxpayer_id, country_code, format: config.taxpayer_id_format }), { headers: { "Content-Type": "application/json" } });
});
