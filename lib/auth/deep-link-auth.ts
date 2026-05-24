import { supabase } from "@/lib/supabase";

/**
 * MTAA Deep Link Auth Handler
 */

export async function handleAuthDeepLink(
  url?: string
) {
  try {
    if (!url) return;

    console.log("[RAW URL]", url);

    // Supabase sends tokens in #
    const normalized =
      url.replace("#", "?");

    console.log(
      "[NORMALIZED URL]",
      normalized
    );

    const parsed = new URL(normalized);

    const access_token =
      parsed.searchParams.get(
        "access_token"
      );

    const refresh_token =
      parsed.searchParams.get(
        "refresh_token"
      );

    const type =
      parsed.searchParams.get("type");

    console.log("[DEEP LINK TOKENS]", {
      hasAccess: !!access_token,
      hasRefresh: !!refresh_token,
      type,
    });

    if (
      access_token &&
      refresh_token
    ) {
      const { error } =
        await supabase.auth.setSession({
          access_token,
          refresh_token,
        });

      if (error) {
        console.log(
          "[SET SESSION ERROR]",
          error.message
        );
      } else {
        console.log(
          "[SESSION RESTORED]"
        );
      }
    }
  } catch (e: any) {
    console.log(
      "[DEEP LINK FATAL]",
      e?.message
    );
  }
}
