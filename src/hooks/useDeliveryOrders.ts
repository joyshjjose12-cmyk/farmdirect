import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import type { DeliveryOrder, DeliveryStage } from '@/types';

/**
 * Who is asking:
 *  - 'buyer'    -> only the buyer's own orders
 *  - 'farmer'   -> orders on the farmer's own listings
 *  - 'delivery' -> every accepted order (delivery partners run the job board)
 */
export type DeliveryScope = 'buyer' | 'farmer' | 'delivery';

interface OrderRow {
  id: string;
  bid_id: string | null;
  listing_id: string;
  buyer_id: string;
  stage: string;
  quantity: number;
  agreed_price_per_unit: number | null;
  total_price: number | null;
  placed_at: string | null;
  delivery_address: string | null;
  delivery_lat: number | null;
  delivery_lng: number | null;
  delivery_phone: string | null;
  delivery_notes: string | null;
  delivery_person_id: string | null;
  claimed_at: string | null;
  picked_up_at: string | null;
  delivered_at: string | null;
  buyer: { name: string; phone: string | null } | null;
  courier: { name: string; phone: string | null } | null;
  listings: {
    unit: string;
    image_url: string | null;
    location_text: string | null;
    latitude: number | null;
    longitude: number | null;
    crops: { name: string } | null;
    profiles: { name: string; farm_name: string | null; phone: string | null } | null;
  } | null;
}

const STAGES: DeliveryStage[] = ['bid_accepted', 'harvest_scheduled', 'out_for_delivery', 'delivered'];

export function useDeliveryOrders(scope: DeliveryScope) {
  const { user } = useAuth();
  const userId = user?.id;
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;

    const { data, error } = await api.get<OrderRow[]>(`/orders?scope=${scope}`);
    if (error) {
      setError(error);
      setLoading(false);
      return;
    }
    setError(null);
    const rows = data ?? [];

    setOrders(
      rows.map((r): DeliveryOrder => {
        const stage = (STAGES.includes(r.stage as DeliveryStage) ? r.stage : 'bid_accepted') as DeliveryStage;
        const qty = Number(r.quantity);
        const price = Number(r.agreed_price_per_unit ?? 0);
        const buyer = r.buyer;
        return {
          id: r.id,
          bidId: r.bid_id,
          listingId: r.listing_id,
          stage,
          placedAt: r.placed_at ?? '',
          cropName: r.listings?.crops?.name ?? 'Crop',
          image: r.listings?.image_url ?? '',
          quantity: qty,
          unit: r.listings?.unit ?? 'kg',
          pricePerUnit: price,
          total: Number(r.total_price ?? price * qty),
          farmerName: r.listings?.profiles?.name ?? 'Farmer',
          farmName: r.listings?.profiles?.farm_name ?? '',
          farmerPhone: r.listings?.profiles?.phone ?? '',
          pickupText: r.listings?.location_text ?? '',
          pickupLat: r.listings?.latitude ?? null,
          pickupLng: r.listings?.longitude ?? null,
          buyerId: r.buyer_id,
          buyerName: buyer?.name ?? 'Buyer',
          address: r.delivery_address ?? '',
          dropLat: r.delivery_lat,
          dropLng: r.delivery_lng,
          buyerPhone: r.delivery_phone ?? buyer?.phone ?? '',
          notes: r.delivery_notes ?? '',
          courierId: r.delivery_person_id,
          courierName: r.courier?.name ?? '',
          courierPhone: r.courier?.phone ?? '',
          claimedAt: r.claimed_at,
          pickedUpAt: r.picked_up_at,
          deliveredAt: r.delivered_at,
        };
      })
    );
    setLoading(false);
  }, [scope, userId]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  // Pick up changes made by the other people on the order (farmer, buyer, courier)
  useEffect(() => {
    if (!userId) return;
    const poll = setInterval(load, 10000);
    return () => clearInterval(poll);
  }, [userId, load]);

  return { orders, loading, error, reload: load };
}
