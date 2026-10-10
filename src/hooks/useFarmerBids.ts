import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import type { DashboardListing } from '@/types';

export type FarmerBidStatus = 'pending' | 'accepted' | 'declined';

export interface FarmerBid {
  id: string;
  buyerId: string;
  buyerName: string;
  amountPerUnit: number;
  quantity: number;
  status: FarmerBidStatus;
  placedAt: string;
}

interface BidRow {
  id: string;
  buyer_id: string;
  amount_per_unit: number;
  quantity: number;
  status: string;
  placed_at: string;
  profiles: { name: string } | null;
}

/**
 * Everything the farmer needs to act on bids for ONE listing:
 * load (refreshes every few seconds), accept, decline.
 *
 * Accepting a bid is ONE API call (POST /api/bids/:id/accept). The server does the three
 * writes (bid -> accepted, new order, stock minus quantity) inside a single DB transaction.
 */
export function useFarmerBids(listing: DashboardListing | null, onChanged: () => void) {
  const listingId = listing?.id;
  const [bids, setBids] = useState<FarmerBid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // keep the latest onChanged without re-starting the polling timer
  const onChangedRef = useRef(onChanged);
  onChangedRef.current = onChanged;
  const lastSignature = useRef('');

  const load = useCallback(async () => {
    if (!listingId) return;
    const { data, error } = await api.get<BidRow[]>(`/listings/${listingId}/bids`);

    if (error) {
      setError(error);
      setBids([]);
    } else {
      setError(null);
      const rows = data ?? [];
      setBids(
        rows.map((r) => ({
          id: r.id,
          buyerId: r.buyer_id,
          buyerName: r.profiles?.name ?? 'Buyer',
          amountPerUnit: Number(r.amount_per_unit),
          quantity: Number(r.quantity),
          status: (['pending', 'accepted', 'declined'].includes(r.status)
            ? r.status
            : 'pending') as FarmerBidStatus,
          placedAt: r.placed_at,
        }))
      );
      // tell the dashboard when a bid appeared / changed, so its counters update too
      const signature = rows.map((r) => `${r.id}:${r.status}`).join('|');
      if (lastSignature.current && lastSignature.current !== signature) onChangedRef.current();
      lastSignature.current = signature;
    }
    setLoading(false);
  }, [listingId]);

  useEffect(() => {
    lastSignature.current = '';
    setLoading(true);
    load();
  }, [load]);

  // A new bid from a buyer shows up without refreshing the page
  useEffect(() => {
    if (!listingId) return;
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, [listingId, load]);

  async function accept(bid: FarmerBid): Promise<{ error: string | null }> {
    if (!listing) return { error: 'No listing selected.' };
    if (bid.quantity > listing.quantityAvailable) {
      return {
        error: `Only ${listing.quantityAvailable} ${listing.unit} left, this bid needs ${bid.quantity}.`,
      };
    }
    const { error } = await api.post(`/bids/${bid.id}/accept`);
    await load();
    onChanged();
    return { error };
  }

  async function decline(bid: FarmerBid): Promise<{ error: string | null }> {
    const { error } = await api.post(`/bids/${bid.id}/decline`);
    if (error) return { error };
    await load();
    onChanged();
    return { error: null };
  }

  return { bids, loading, error, accept, decline };
}
