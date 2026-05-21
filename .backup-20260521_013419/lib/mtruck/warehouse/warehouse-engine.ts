import { supabase } from "../../supabase";

export interface WarehouseInventory {
  warehouse_id: string;

  item_name: string;

  quantity: number;

  unit_type: string;
}

export async function addWarehouseInventory(
  item: WarehouseInventory
) {

  const { data, error } = await supabase
    .from("mtruck_warehouse_inventory")
    .insert({
      warehouse_id:
        item.warehouse_id,

      item_name:
        item.item_name,

      quantity:
        item.quantity,

      unit_type:
        item.unit_type,
    })
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function getWarehouseInventory(
  warehouseId: string
) {

  const { data, error } = await supabase
    .from("mtruck_warehouse_inventory")
    .select("*")
    .eq("warehouse_id", warehouseId);

  if (error) throw error;

  return data || [];
}
