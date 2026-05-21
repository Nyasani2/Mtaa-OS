import { supabase } from "../../supabase";

export async function swipeProfile(
  swiper_id: string,
  target_id: string,
  direction: "LIKE" | "PASS" | "SUPERLIKE"
) {

  await supabase
    .from("hookup_swipes")
    .insert({
      swiper_id,
      target_id,
      direction,
    });

  if (
    direction === "LIKE" ||
    direction === "SUPERLIKE"
  ) {

    const { data: reverseSwipe } = await supabase
      .from("hookup_swipes")
      .select("*")
      .eq("swiper_id", target_id)
      .eq("target_id", swiper_id)
      .in("direction", ["LIKE", "SUPERLIKE"])
      .maybeSingle();

    if (reverseSwipe) {

      const compatibility_score =
        Math.floor(Math.random() * 30) + 70;

      await supabase
        .from("hookup_matches")
        .insert({
          user_a: swiper_id,
          user_b: target_id,
          compatibility_score,
        });

      return {
        matched: true,
        compatibility_score,
      };
    }
  }

  return {
    matched: false,
  };
}

export async function getMatches(
  user_id: string
) {

  const { data, error } = await supabase
    .from("hookup_matches")
    .select("*")
    .or(
      `user_a.eq.${user_id},user_b.eq.${user_id}`
    )
    .order("matched_at", {
      ascending: false,
    });

  if (error) throw error;

  return data;
}
