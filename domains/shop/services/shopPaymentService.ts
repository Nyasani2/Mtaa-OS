// @ts-nocheck
// domains/shop/services/shopPaymentService.ts
// MTAA Shop Payment — Wallet-to-shop with escrow
// Reuses existing wallet-service.ts + auth pinEngine — NO duplicates

import { supabase } from '@/lib/supabase/client';
import {
  getWalletAccountByUserId,
  createWalletTransaction,
  ensureWallet,
} from '@/lib/services/wallet-service';

export interface PaymentResult {
  success: boolean;
  orderId?: string;
  transactionId?: string;
  escrowId?: string;
  message: string;
}

export interface CheckoutPayload {
  shopId: string;
  customerId: string;
  items: Array<{
    product_id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
  subtotal: number;
  taxAmount: number;
  deliveryFee: number;
  discountAmount: number;
  totalAmount: number;
  paymentMethod: 'wallet' | 'cash' | 'card' | 'escrow';
  deliveryType?: 'pickup' | 'delivery' | 'shipping';
  deliveryAddress?: string;
  deliveryNotes?: string;
  posSessionId?: string;
  affiliateId?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
}

export class ShopPaymentService {
  /**
   * Process a wallet payment for a shop order.
   * 1. Verify buyer has sufficient balance
   * 2. Deduct from buyer wallet
   * 3. Create shop_order record
   * 4. If escrow enabled → hold funds in escrow
   * 5. If direct → credit shop owner wallet
   */
  async processWalletPayment(payload: CheckoutPayload): Promise<PaymentResult> {
    const { shopId, customerId, totalAmount, paymentMethod } = payload;

    if (totalAmount <= 0) {
      return { success: false, message: 'Invalid order amount' };
    }

    // Ensure buyer has a wallet
    const buyerWallet = await ensureWallet(customerId);
    if (!buyerWallet) {
      return { success: false, message: 'Buyer wallet not found' };
    }

    if ((buyerWallet.balance || 0) < totalAmount) {
      return { success: false, message: 'Insufficient wallet balance' };
    }

    // Get shop details for owner_id and escrow setting
    const { data: shop } = await supabase
      .from('shops')
      .select('owner_id, settings, name')
      .eq('id', shopId)
      .single();

    if (!shop) {
      return { success: false, message: 'Shop not found' };
    }

    const settings = shop.settings || {};
    const escrowEnabled = settings.escrow_enabled === true;

    // Generate order number
    const orderNumber = await this.generateOrderNumber(shopId);

    // Create the order
    const { data: order, error: orderError } = await supabase
      .from('shop_orders')
      .insert({
        shop_id: shopId,
        customer_id: customerId,
        order_number: orderNumber,
        status: 'pending',
        customer_name: payload.customerName,
        customer_phone: payload.customerPhone,
        customer_email: payload.customerEmail,
        delivery_address: payload.deliveryAddress,
        delivery_notes: payload.deliveryNotes,
        subtotal: payload.subtotal,
        tax_amount: payload.taxAmount,
        delivery_fee: payload.deliveryFee,
        discount_amount: payload.discountAmount,
        total_amount: payload.totalAmount,
        payment_status: 'pending',
        payment_method: paymentMethod,
        escrow_enabled: escrowEnabled,
        delivery_type: payload.deliveryType || 'pickup',
        pos_session_id: payload.posSessionId || null,
        is_pos_order: !!payload.posSessionId,
        affiliate_id: payload.affiliateId || null,
      })
      .select()
      .single();

    if (orderError || !order) {
      return { success: false, message: orderError?.message || 'Failed to create order' };
    }

    // Insert order items
    const orderItems = payload.items.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price,
    }));

    const { error: itemsError } = await supabase.from('shop_order_items').insert(orderItems);
    if (itemsError) {
      // Rollback: delete the order
      await supabase.from('shop_orders').delete().eq('id', order.id);
      return { success: false, message: itemsError.message };
    }

    // Deduct from buyer wallet
    const { error: buyerTxError } = await supabase
      .from('wallet_transactions')
      .insert({
        user_id: customerId,
        wallet_id: buyerWallet.id,
        amount: -totalAmount,
        type: 'payment',
        status: 'completed',
        description: `Payment to ${shop.name} — Order #${orderNumber}`,
        reference_id: order.id,
        reference_type: 'shop_order',
        currency: settings.currency || 'KES',
      });

    if (buyerTxError) {
      // Rollback
      await supabase.from('shop_order_items').delete().eq('order_id', order.id);
      await supabase.from('shop_orders').delete().eq('id', order.id);
      return { success: false, message: buyerTxError.message };
    }

    // Update buyer wallet balance
    await supabase
      .from('wallet_accounts')
      .update({ balance: (buyerWallet.balance || 0) - totalAmount })
      .eq('id', buyerWallet.id);

    let escrowId: string | undefined;

    if (escrowEnabled) {
      // Create escrow record — funds held, not yet credited to shop
      const { data: escrow } = await supabase
        .from('escrow_accounts')
        .insert({
          order_id: order.id,
          amount: totalAmount,
          status: 'funded',
          seller_id: shop.owner_id,
          buyer_id: customerId,
        })
        .select()
        .single();

      if (escrow) {
        escrowId = escrow.id;
        // Update order with escrow reference
        await supabase
          .from('shop_orders')
          .update({ escrow_account_id: escrow.id, payment_status: 'paid' })
          .eq('id', order.id);
      }
    } else {
      // Direct payment — credit shop owner wallet immediately
      const shopOwnerWallet = await ensureWallet(shop.owner_id);
      if (shopOwnerWallet) {
        await supabase
          .from('wallet_transactions')
          .insert({
            user_id: shop.owner_id,
            wallet_id: shopOwnerWallet.id,
            amount: totalAmount,
            type: 'credit',
            status: 'completed',
            description: `Sale from ${shop.name} — Order #${orderNumber}`,
            reference_id: order.id,
            reference_type: 'shop_order',
            currency: settings.currency || 'KES',
          });

        await supabase
          .from('wallet_accounts')
          .update({ balance: (shopOwnerWallet.balance || 0) + totalAmount })
          .eq('id', shopOwnerWallet.id);
      }

      // Mark order as paid
      await supabase
        .from('shop_orders')
        .update({ payment_status: 'paid' })
        .eq('id', order.id);
    }

    // Update shop totals
    await supabase.rpc('increment_shop_sales', {
      p_shop_id: shopId,
      p_amount: totalAmount,
    });

    // Decrement stock for each item
    for (const item of payload.items) {
      if (item.product_id) {
        await supabase.rpc('decrement_stock', {
          p_product_id: item.product_id,
          p_quantity: item.quantity,
        });
      }
    }

    // Update POS session if applicable
    if (payload.posSessionId) {
      await supabase.rpc('increment_pos_sales', {
        p_session_id: payload.posSessionId,
        p_amount: totalAmount,
      });
    }

    return {
      success: true,
      orderId: order.id,
      escrowId,
      message: escrowEnabled
        ? `Order placed. Funds held in escrow until delivery.`
        : `Payment successful. Order #${orderNumber} confirmed.`,
    };
  }

  /**
   * Release escrow funds to shop owner after delivery confirmation.
   */
  async releaseEscrow(orderId: string): Promise<PaymentResult> {
    const { data: order } = await supabase
      .from('shop_orders')
      .select('*, shops!inner(owner_id, name)')
      .eq('id', orderId)
      .single();

    if (!order) return { success: false, message: 'Order not found' };
    if (!order.escrow_enabled || !order.escrow_account_id) {
      return { success: false, message: 'No escrow on this order' };
    }

    const { data: escrow } = await supabase
      .from('escrow_accounts')
      .select('*')
      .eq('id', order.escrow_account_id)
      .single();

    if (!escrow || escrow.status !== 'funded') {
      return { success: false, message: 'Escrow not available for release' };
    }

    // Credit shop owner
    const shopOwnerWallet = await ensureWallet(order.shops.owner_id);
    if (shopOwnerWallet) {
      await supabase.from('wallet_transactions').insert({
        user_id: order.shops.owner_id,
        wallet_id: shopOwnerWallet.id,
        amount: order.total_amount,
        type: 'credit',
        status: 'completed',
        description: `Escrow released — Order #${order.order_number}`,
        reference_id: order.id,
        reference_type: 'shop_order',
      });

      await supabase
        .from('wallet_accounts')
        .update({ balance: (shopOwnerWallet.balance || 0) + order.total_amount })
        .eq('id', shopOwnerWallet.id);
    }

    // Update escrow status
    await supabase
      .from('escrow_accounts')
      .update({ status: 'released', released_at: new Date().toISOString() })
      .eq('id', order.escrow_account_id);

    // Update order
    await supabase
      .from('shop_orders')
      .update({ escrow_released_at: new Date().toISOString() })
      .eq('id', orderId);

    return { success: true, message: 'Escrow released to merchant' };
  }

  /**
   * Generate unique order number per shop.
   */
  private async generateOrderNumber(shopId: string): Promise<string> {
    const prefix = 'ORD';
    const shopPrefix = shopId.slice(0, 4).toUpperCase();
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).slice(2, 5).toUpperCase();
    return `${prefix}-${shopPrefix}-${timestamp}-${random}`;
  }
}

export const shopPaymentService = new ShopPaymentService();
export default shopPaymentService;
