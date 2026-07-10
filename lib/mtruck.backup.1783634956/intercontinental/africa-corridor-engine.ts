import { supabase } from "../../supabase";

export async function generateAfricaTradeCorridors() {

  const corridors = [
    {
      route:
        "Mombasa → Nairobi → Kampala",

      trade_volume: 1200,

      congestion: "MEDIUM",
    },

    {
      route:
        "Lagos → Accra → Abidjan",

      trade_volume: 980,

      congestion: "HIGH",
    },

    {
      route:
        "Johannesburg → Gaborone",

      trade_volume: 700,

      congestion: "LOW",
    },
  ];

  for (const corridor of corridors) {

    await supabase
      .from("mtruck_trade_corridors")
      .insert(corridor);
  }

  return corridors;
}

export async function getTradeCorridors() {

  const { data, error } = await supabase
    .from("mtruck_trade_corridors")
    .select("*");

  if (error) throw error;

  return data || [];
}
