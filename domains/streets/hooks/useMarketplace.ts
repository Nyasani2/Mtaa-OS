import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { marketplaceService } from '../services/marketplaceService';
import type { MarketplaceListing, ListingFilter, OfferInput } from '../types';

export function useMarketplace() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<ListingFilter>({});
  const [searchQuery, setSearchQuery] = useState('');

  const { data: listings, isLoading } = useQuery({
    queryKey: ['streets', 'marketplace', 'listings', filters, searchQuery],
    queryFn: () => marketplaceService.getListings({ ...filters, search: searchQuery }),
  });

  const { data: myListings } = useQuery({
    queryKey: ['streets', 'marketplace', 'my-listings'],
    queryFn: () => marketplaceService.getMyListings(),
  });

  const { data: savedListings } = useQuery({
    queryKey: ['streets', 'marketplace', 'saved'],
    queryFn: () => marketplaceService.getSavedListings(),
  });

  const createListing = useMutation({
    mutationFn: (listing: Omit<MarketplaceListing, 'id' | 'createdAt'>) =>
      marketplaceService.createListing(listing),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streets', 'marketplace'] });
    },
  });

  const makeOffer = useMutation({
    mutationFn: ({ listingId, offer }: { listingId: string; offer: OfferInput }) =>
      marketplaceService.makeOffer(listingId, offer),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streets', 'marketplace'] });
    },
  });

  const saveListing = useMutation({
    mutationFn: (listingId: string) => marketplaceService.saveListing(listingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streets', 'marketplace', 'saved'] });
    },
  });

  const markSold = useMutation({
    mutationFn: (listingId: string) => marketplaceService.markAsSold(listingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streets', 'marketplace'] });
    },
  });

  return {
    listings,
    myListings,
    savedListings,
    isLoading,
    filters,
    setFilters,
    searchQuery,
    setSearchQuery,
    createListing,
    makeOffer,
    saveListing,
    markSold,
  };
}
