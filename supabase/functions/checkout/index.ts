import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CheckoutItem {
  product_id: string
  seller_id: string
  quantity: number
  unit_price: number
  currency: string
}

interface CheckoutRequest {
  buyer_id: string
  items: CheckoutItem[]
  shipping_address: any
  payment_method: string
  currency: string
  notes?: string
  totals: {
    subtotal: number
    platformFee: number
    shippingTotal: number
    total: number
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { buyer_id, items, shipping_address, payment_method, currency, notes, totals }: CheckoutRequest = await req.json()

    // ─── VALIDATION ───
    if (!buyer_id || !items?.length || !shipping_address || !totals) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields', code: 'INVALID_REQUEST' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ─── VERIFY BUYER WALLET ───
    const { data: wallet, error: walletError } = await supabaseClient
      .from('wallets')
      .select('id, balance, status')
      .eq('user_id', buyer_id)
      .eq('currency', currency)
      .single()

    if (walletError || !wallet) {
      return new Response(
        JSON.stringify({ error: 'Wallet not found', code: 'WALLET_MISSING' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (wallet.status !== 'active') {
      return new Response(
        JSON.stringify({ error: 'Wallet frozen', code: 'WALLET_FROZEN' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (wallet.balance < totals.total) {
      return new Response(
        JSON.stringify({ error: 'Insufficient balance', code: 'INSUFFICIENT_FUNDS', balance: wallet.balance, required: totals.total }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ─── VERIFY STOCK FOR ALL ITEMS ───
    for (const item of items) {
      const { data: stock } = await supabaseClient
        .from('marketplace_inventory')
        .select('quantity')
        .eq('listing_id', item.product_id)
        .single()

      if (!stock || stock.quantity < item.quantity) {
        return new Response(
          JSON.stringify({ error: `Insufficient stock for product ${item.product_id}`, code: 'INSUFFICIENT_STOCK' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // ─── CREATE ORDER PER SELLER (group items by seller) ───
    const sellerGroups = new Map<string, CheckoutItem[]>()
    for (const item of items) {
      const group = sellerGroups.get(item.seller_id) || []
      group.push(item)
      sellerGroups.set(item.seller_id, group)
    }

    const createdOrders: string[] = []
    const orderIds: string[] = []

    for (const [sellerId, sellerItems] of sellerGroups) {
      const orderId = crypto.randomUUID()
      const sellerSubtotal = sellerItems.reduce((sum, item) => sum + item.unit_price * item.quantity, 0)
      const sellerFee = Math.round(sellerSubtotal * 0.025 * 100) / 100
      const sellerTotal = sellerSubtotal + sellerFee

      // Create order
      const { error: orderError } = await supabaseClient
        .from('orders')
        .insert({
          id: orderId,
          buyer_id: buyer_id,
          seller_id: sellerId,
          status: 'pending',
          total_amount: sellerTotal,
          platform_fee: sellerFee,
          currency: currency,
          shipping_address: shipping_address,
          payment_method: payment_method,
          notes: notes,
          created_at: new Date().toISOString(),
        })

      if (orderError) throw new Error(`Order creation failed: ${orderError.message}`)

      // Create order items
      const orderItems = sellerItems.map(item => ({
        order_id: orderId,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.unit_price * item.quantity,
        currency: item.currency,
      }))

      const { error: itemsError } = await supabaseClient
        .from('order_items')
        .insert(orderItems)

      if (itemsError) throw new Error(`Order items creation failed: ${itemsError.message}`)

      // Reserve funds in escrow
      const { error: escrowError } = await supabaseClient.rpc('reserve_marketplace_funds', {
        p_wallet_id: wallet.id,
        p_amount: sellerTotal,
        p_order_id: orderId,
        p_buyer_id: buyer_id,
        p_seller_id: sellerId,
      })

      if (escrowError) {
        // Rollback: delete order and items
        await supabaseClient.from('order_items').delete().eq('order_id', orderId)
        await supabaseClient.from('orders').delete().eq('id', orderId)
        throw new Error(`Escrow reservation failed: ${escrowError.message}`)
      }

      // Decrement inventory
      for (const item of sellerItems) {
        await supabaseClient.rpc('decrement_inventory', {
          p_listing_id: item.product_id,
          p_quantity: item.quantity,
        })
      }

      orderIds.push(orderId)
      createdOrders.push(orderId)
    }

    // ─── CREATE TRANSACTION RECORD ───
    const transactionId = crypto.randomUUID()
    await supabaseClient.from('transactions').insert({
      id: transactionId,
      user_id: buyer_id,
      wallet_id: wallet.id,
      type: 'marketplace_purchase',
      amount: totals.total,
      currency: currency,
      fee: totals.platformFee,
      net_amount: totals.subtotal,
      status: 'completed',
      metadata: {
        order_ids: orderIds,
        item_count: items.length,
        seller_count: sellerGroups.size,
        shipping_address: shipping_address,
      },
      description: `Marketplace purchase — ${items.length} item(s) from ${sellerGroups.size} seller(s)`,
    })

    // ─── AUDIT LOG ───
    await supabaseClient.from('audit_logs').insert({
      user_id: buyer_id,
      action: 'marketplace_checkout',
      entity_type: 'order',
      entity_id: orderIds[0],
      details: {
        order_ids: orderIds,
        total: totals.total,
        fee: totals.platformFee,
        currency,
        item_count: items.length,
      },
    })

    return new Response(
      JSON.stringify({
        success: true,
        order_ids: orderIds,
        total: totals.total,
        fee: totals.platformFee,
        status: 'pending',
        transaction_id: transactionId,
        message: `Order placed successfully. ${orderIds.length} order(s) created.`,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message, code: 'INTERNAL_ERROR' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
