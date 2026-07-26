import { supabase } from '@/lib/supabase';

export async function shopCreateOrder(orderData: {
  shop_id: string;
  customer_id: string;
  items: Array<{ product_id: string; quantity: number; price: number }>;
  total_amount: number;
  delivery_address?: string;
  affiliate_id?: string;
}) {
  const { data: order, error: orderError } = await supabase.from('shop_orders').insert({
    shop_id: orderData.shop_id,
    customer_id: orderData.customer_id,
    total_amount: orderData.total_amount,
    delivery_address: orderData.delivery_address,
    affiliate_id: orderData.affiliate_id,
    status: 'pending',
    created_at: new Date().toISOString()
  }).select().single();

  if (orderError) throw orderError;

  const orderItems = orderData.items.map(item => ({
    order_id: order.id,
    product_id: item.product_id,
    quantity: item.quantity,
    unit_price: item.price
  }));

  const { error: itemsError } = await supabase.from('shop_order_items').insert(orderItems);
  if (itemsError) throw itemsError;

  for (const item of orderData.items) {
    await supabase.rpc('decrement_stock', {
      p_product_id: item.product_id,
      p_quantity: item.quantity
    });
  }

  return order;
}
