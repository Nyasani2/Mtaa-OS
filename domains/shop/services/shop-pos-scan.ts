// @ts-nocheck
import { supabase } from '@/lib/supabase';

export async function posScanBarcode(shopId: string, barcode: string) {
  const { data: product, error } = await supabase.from('shop_products')
    .select('*')
    .eq('shop_id', shopId)
    .eq('barcode', barcode)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  if (!product) throw new Error('Product not found');

  return product;
}

export async function posCreateSale(sessionId: string, items: Array<{ product_id: string; quantity: number; price: number }>, total: number) {
  const { data: sale, error } = await supabase.from('pos_sales').insert({
    session_id: sessionId,
    total_amount: total,
    created_at: new Date().toISOString()
  }).select().single();

  if (error) throw error;

  const saleItems = items.map((item: any) => ({
    sale_id: sale.id,
    product_id: item.product_id,
    quantity: item.quantity,
    unit_price: item.price
  }));

  await supabase.from('pos_sale_items').insert(saleItems);

  for (const item of items) {
    await supabase.rpc('decrement_stock', {
      p_product_id: item.product_id,
      p_quantity: item.quantity
    });
  }

  return sale;
}
