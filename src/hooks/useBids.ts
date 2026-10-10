import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Bid, OrderStage, StatusEvent } from '@/types';

export type BidWithBuyer = Bid & { buyerId: string };

interface BidRow {
  id: string;
  listing_id: string;
  buyer_id: string;
  amount_per_unit: number;
  quantity: number;
  status: string;
  placed_at: string;
  profiles: { name: string } | null;
}

interface OrderRow {
  id: string;
  bid_id: string | null;
  stage: string;
  placed_at: string | null;
}

function mapBid(r: BidRow): BidWithBuyer {
  return {
    id: r.id,
    listingId: r.listing_id,
    buyerId: r.buyer_id,
    buyerName: r.profiles?.name ?? 'Buyer',
    amountPerUnit: Number(r.amount_per_unit),
    quantity: Number(r.quantity),
    placedAt: r.placed_at,
    status: (['pending', 'accepted', 'declined'].includes(r.status)
      ? r.status
      : 'pending') as Bid['status'],
  };
}

/** All bids on one listing + a function to place a new one. */
export function useBids(listingId: string | undefined) {
  const [bids, setBids] = useState<BidWithBuyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!listingId) return;
    const { data, error } = await api.get<BidRow[]>(`/listings/${listingId}/bids`);
    if (error) {
      setError(error);
      setBids([]);
    } else {
      setError(null);
      setBids((data ?? []).map(mapBid));
    }
    setLoading(false);
  }, [listingId]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  async function placeBid(params: {
    buyerId: string;
    amountPerUnit: number;
    quantity: number;
  }): Promise<{ error: string | null }> {
    if (!listingId) return { error: 'No listing selected.' };
    // buyerId comes from the login token on the server; it is not sent from the browser
    const { error } = await api.post('/bids', {
      listingId,
      amountPerUnit: params.amountPerUnit,
      quantity: params.quantity,
    });
    if (error) return { error };
    await load();
    return { error: null };
  }

  return { bids, loading, error, placeBid, reload: load };
}

/** The signed-in buyer's order (if any) created from one of their bids. */
export function useMyOrder(bidId: string | undefined) {
  const [order, setOrder] = useState<OrderRow | null>(null);

  useEffect(() => {
    if (!bidId) {
      setOrder(null);
      return;
    }
    let cancelled = false;
    api.get<OrderRow | null>(`/bids/${bidId}/order`).then(({ data }) => {
      if (!cancelled) setOrder(data ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [bidId]);

  return order;
}

const STAGES: { stage: OrderStage; label: string }[] = [
  { stage: 'bid_placed', label: 'Bid Placed' },
  { stage: 'bid_accepted', label: 'Bid Accepted by Farmer' },
  { stage: 'harvest_scheduled', label: 'Harvest Scheduled' },
  { stage: 'out_for_delivery', label: 'Out for Delivery' },
  { stage: 'delivered', label: 'Delivered' },
];

/** Build the timeline from the buyer's real bid/order. Returns null if no bid. */
export function buildTimeline(
  bid: BidWithBuyer | undefined,
  order: OrderRow | null
): StatusEvent[] | null {
  if (!bid) return null;

  if (bid.status === 'declined') {
    return [
      { stage: 'bid_placed', label: 'Bid Placed', timestamp: bid.placedAt, complete: true },
      { stage: 'bid_accepted', label: 'Bid Declined by Farmer', timestamp: '', complete: false },
    ];
  }

  let reached = bid.status === 'accepted' ? 1 : 0;
  if (order) {
    const i = STAGES.findIndex((s) => s.stage === order.stage);
    if (i > reached) reached = i;
  }

  return STAGES.map((s, i) => ({
    stage: s.stage,
    label: s.label,
    timestamp:
      i === 0 ? bid.placedAt : i === 1 && reached >= 1 ? order?.placed_at ?? '' : '',
    complete: i <= reached,
  }));
}