import { supabase } from '@/lib/supabase';

export type MarketplaceAction = 'checkout' | 'confirm_delivery' | 'seller_payout' | 'escrow_release';

export interface MarketplaceCheckoutParams {
  action: 'checkout';
  buyerId: string;
  items: Array<{ listingId: string; quantity: number; price: number }>;
  shippingAddress: Record<string, any>;
  paymentMethod: 'wallet' | 'mpesa' | 'card';
}

export interface MarketplaceConfirmDeliveryParams {
  action: 'confirm_delivery';
  orderId: string;
  buyerId: string;
  rating?: number;
  review?: string;
}

export interface MarketplaceSellerPayoutParams {
  action: 'seller_payout';
  orderId: string;
  sellerId: string;
  amount: number;
}

export interface MarketplaceEscrowReleaseParams {
  action: 'escrow_release';
  orderId: string;
  releasedBy: 'buyer' | 'system' | 'admin';
  reason?: string;
}

export type MarketplaceParams = 
  | MarketplaceCheckoutParams 
  | MarketplaceConfirmDeliveryParams 
  | MarketplaceSellerPayoutParams 
  | MarketplaceEscrowReleaseParams;

export async function marketplaceOperation(params: MarketplaceParams) {
  const { data, error } = await supabase.functions.invoke('marketplace-operations', {
    body: params,
  });
  if (error) throw error;
  return data;
}

export const checkout = (p: Omit<MarketplaceCheckoutParams, 'action'>) => 
  marketplaceOperation({ action: 'checkout', ...p } as MarketplaceCheckoutParams);

export const confirmDelivery = (p: Omit<MarketplaceConfirmDeliveryParams, 'action'>) => 
  marketplaceOperation({ action: 'confirm_delivery', ...p } as MarketplaceConfirmDeliveryParams);

export const sellerPayout = (p: Omit<MarketplaceSellerPayoutParams, 'action'>) => 
  marketplaceOperation({ action: 'seller_payout', ...p } as MarketplaceSellerPayoutParams);

export const escrowRelease = (p: Omit<MarketplaceEscrowReleaseParams, 'action'>) => 
  marketplaceOperation({ action: 'escrow_release', ...p } as MarketplaceEscrowReleaseParams);
