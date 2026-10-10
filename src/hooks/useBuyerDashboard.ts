import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export type BidStatus = 'pending' | 'accepted' | 'declined';

export interface BuyerBid {
  id: string;
  listingId: string;
  cropName: string;
  image: string;
  farmerName: string;
  farmName: string;
  location: string;
  unit: string;
  askingPrice: number;
  offer: number;
  quantity: number;
  status: BidStatus;
  placedAt: string;
  /** 0 = bid placed … 4 = delivered, -1 = declined */
  step: number;
  orderId: string | null;
  /** price actually agreed (from the order) or the offer */
  finalPrice: number;
}

export interface BuyerStats {
  active: number;
  accepted: number;
  delivered: number;
  saved: number;
}

interface BidRow {
  id: string;
  listing_id: string;
  amount_per_unit: number;
  quantity: number;
  status: string;
  placed_at: string;
  listings: {
    price_per_unit: number;
    unit: string;
    image_url: string | null;
    location_text: string | null;
    crops: { name: string } | null;
    profiles: { name: string; farm_name: string | null } | null;
  } | null;
}

interface OrderRow {
  id: string;
  bid_id: string | null;
  stage: string;
  agreed_price_per_unit: number | null;
}

export const JOURNEY = [
  { stage: 'bid_placed', label: 'Bid placed' },
  { stage: 'bid_accepted', label: 'Accepted' },
  { stage: 'harvest_scheduled', label: 'Harvest' },
  { stage: 'out_for_delivery', label: 'On the way' },
  { stage: 'delivered', label: 'Delivered' },
] as const;

export function useBuyerDashboard() {
  const { user } = useAuth();
  const [bids, setBids] = useState<BuyerBid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const res = await api.get<{ bids: BidRow[]; orders: OrderRow[] }>('/bids/mine');

    if (res.error || !res.data) {
      setError(res.error ?? 'Could not load your bids.');
      setBids([]);
      setLoading(false);
      return;
    }
    setError(null);

    const orders = res.data.orders;
    const orderByBid = new Map(orders.filter((o) => o.bid_id).map((o) => [o.bid_id as string, o]));

    const rows = res.data.bids;
    setBids(
      rows.map((r) => {
        const status = (['pending', 'accepted', 'declined'].includes(r.status)
          ? r.status
          : 'pending') as BidStatus;
        const order = orderByBid.get(r.id) ?? null;

        let step = 0;
        if (status === 'declined') step = -1;
        else {
          if (status === 'accepted') step = 1;
          if (order) {
            const i = JOURNEY.findIndex((j) => j.stage === order.stage);
            if (i > step) step = i;
          }
        }

        const offer = Number(r.amount_per_unit);
        return {
          id: r.id,
          listingId: r.listing_id,
          cropName: r.listings?.crops?.name ?? 'Unknown crop',
          image: r.listings?.image_url ?? '',
          farmerName: r.listings?.profiles?.name ?? 'the farmer',
          farmName: r.listings?.profiles?.farm_name ?? '',
          location: r.listings?.location_text ?? '',
          unit: r.listings?.unit ?? 'kg',
          askingPrice: Number(r.listings?.price_per_unit ?? offer),
          offer,
          quantity: Number(r.quantity),
          status,
          placedAt: r.placed_at,
          step,
          orderId: order?.id ?? null,
          finalPrice: Number(order?.agreed_price_per_unit ?? offer),
        };
      })
    );
    setLoading(false);
  }, [user]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  // Keep the progress bar in step with what the delivery partner does
  useEffect(() => {
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [load]);

  async function withdrawBid(bidId: string): Promise<{ error: string | null }> {
    if (!user) return { error: 'Not signed in.' };
    const { error } = await api.del(`/bids/${bidId}`);
    if (error) return { error };
    await load();
    return { error: null };
  }

  const accepted = bids.filter((b) => b.status === 'accepted');
  const stats: BuyerStats = {
    active: bids.filter((b) => b.status === 'pending').length,
    accepted: accepted.length,
    delivered: bids.filter((b) => b.step === JOURNEY.length - 1).length,
    saved: Math.round(
      accepted.reduce(
        (sum, b) => sum + Math.max(0, b.askingPrice - b.finalPrice) * b.quantity,
        0
      )
    ),
  };

  return { bids, stats, loading, error, withdrawBid, reload: load };
}