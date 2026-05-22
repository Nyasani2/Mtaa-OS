import { supabase } from '@/lib/supabase';

export async function syncMarketplaceListing(productId: string, action: 'create' | 'update' | 'delete') {
  const { data: product, error } = await supabase.from('shop_products')
    .select('*, shops(*)')
    .eq('id', productId)
    .single();

  if (error) throw error;

  if (action === 'delete') {
    await supabase.from('marketplace_listings').delete().eq('product_id', productId);
    return { success: true };
  }

  const listingData = {
    product_id: productId,
    shop_id: product.shop_id,
    name: product.name,
    description: product.description,
    price: product.price,
    category: product.category,
    images: product.images,
    location: product.shops?.location,
    is_active: product.is_listed,
    updated_at: new Date().toISOString()
  };

  if (action === 'create') {
    const { error: insertError } = await supabase.from('marketplace_listings').insert(listingData);
    if (insertError) throw insertError;
  } else {
    const { error: updateError } = await supabase.from('marketplace_listings')
      .update(listingData)
      .eq('product_id', productId);
    if (updateError) throw updateError;
  }

  return { success: true };
}
