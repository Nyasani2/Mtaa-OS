/**
 * MTAA OS V10 — useMarketplaceListing Hook
 * Single listing view + buy + reviews
 */
import { useCallback, useEffect, useState } from 'react';
import {
  fetchMarketplaceListingById,
  createMarketplaceOrder,
  fetchMarketplaceReviews,
  createMarketplaceReview,
  MarketplaceListing,
} from '@/lib/services/marketplace-service';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export function useMarketplaceListing(listingId: string) {
  const [listing, setListing] = useState<MarketplaceListing | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userId = useAuthStore((s) => s.session?.user?.id);

  const load = useCallback(async () => {
    if (!listingId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [l, r] = await Promise.all([
        fetchMarketplaceListingById(listingId),
        fetchMarketplaceReviews(listingId),
      ]);
      setListing(l);
      setReviews(r);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [listingId]);

  const buy = useCallback(async (shippingAddress?: any) => {
    if (!userId || !listing) throw new Error('Invalid purchase');
    const order = await createMarketplaceOrder({
      buyer_id: userId,
      seller_id: listing.seller_id,
      listing_id: listing.id,
      amount: listing.price,
      currency: listing.currency,
      status: 'pending',
      shipping_address: shippingAddress ?? null,
    });
    return order;
  }, [userId, listing]);

  const addReview = useCallback(async (rating: number, comment: string) => {
    if (!userId || !listingId) throw new Error('Not authenticated');
    const review = await createMarketplaceReview({
      listing_id: listingId,
      reviewer_id: userId,
      rating,
      comment,
    });
    setReviews((prev) => [review, ...prev]);
    return review;
  }, [userId, listingId]);

  useEffect(() => { load(); }, [load]);

  return { listing, reviews, isLoading, error, refresh: load, buy, addReview };
}
