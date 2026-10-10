import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import type { DashboardListing, DashboardStats, ListingStatus } from '@/types';

interface BidRow {
  id: string;
  status: 'pending' | 'accepted' | 'declined';
}

interface OrderRow {
  id: string;
  total_price: number;
  stage: string;
}

interface ListingRow {
  id: string;
  image_url: string | null;
  price_per_unit: number;
  unit: string;
  quantity_available: number;
  status: ListingStatus;
  created_at: string;
  crops: { name: string; crop_type: string } | null;
  bids: BidRow[] | null;
  orders: OrderRow[] | null;
}

function mapRow(row: ListingRow): DashboardListing {
  return {
    id: row.id,
    cropName: row.crops?.name ?? 'Unknown crop',
    cropType: (row.crops?.crop_type ?? 'Vegetables') as DashboardListing['cropType'],
    image: row.image_url ?? '',
    quantityAvailable: row.quantity_available,
    unit: row.unit,
    pricePerUnit: row.price_per_unit,
    status: row.status,
    bidsCount: row.bids?.length ?? 0,
    pendingBidsCount: row.bids?.filter((b) => b.status === 'pending').length ?? 0,
    listedDate: row.created_at,
  };
}

export function useDashboardListings() {
  const { user } = useAuth();
  const [listings, setListings] = useState<DashboardListing[]>([]);
  const [rows, setRows] = useState<ListingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchListings = useCallback(async (silent = false) => {
    if (!user) {
      setListings([]);
      setRows([]);
      setLoading(false);
      return;
    }

    if (!silent) setLoading(true);
    setError(null);

    const { data, error } = await api.get<ListingRow[]>('/listings/mine');

    if (error) {
      setError(error);
      setListings([]);
      setRows([]);
    } else {
      const typedRows = data ?? [];
      setRows(typedRows);
      setListings(typedRows.map(mapRow));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const markSold = useCallback(async (listingId: string) => {
    const { error } = await api.patch(`/listings/${listingId}/sold`);

    if (error) return { error };

    setListings((prev) =>
      prev.map((l) =>
        l.id === listingId ? { ...l, status: 'Sold', quantityAvailable: 0 } : l
      )
    );
    return { error: null };
  }, []);

  const stats: DashboardStats = {
    activeListings: listings.filter((l) => l.status === 'Active').length,
    pendingBids: rows.reduce(
      (sum, row) => sum + (row.bids?.filter((b) => b.status === 'pending').length ?? 0),
      0
    ),
    completedSales: rows.reduce(
      (sum, row) => sum + (row.orders?.filter((o) => o.stage === 'delivered').length ?? 0),
      0
    ),
    totalRevenue: rows.reduce(
      (sum, row) =>
        sum +
        (row.orders
          ?.filter((o) => o.stage === 'delivered')
          .reduce((s, o) => s + o.total_price, 0) ?? 0),
      0
    ),
  };

  return { listings, stats, loading, error, markSold, refetch: fetchListings };
}