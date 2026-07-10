import { supabase } from "../../supabase";

export async function updateHeatmap(
  lat: number,
  lng: number
) {

  const gridSize = 0.01;

  const grid_lat = Math.floor(lat / gridSize);
  const grid_lng = Math.floor(lng / gridSize);

  const { data } =
    await supabase
      .from("// STUB_REMOVED: "hookup_activity_heatmap"")
      .upsert({
        grid_lat,
        grid_lng,
        activity_score: 1,
        updated_at: new Date(),
      });

  return data;
}
