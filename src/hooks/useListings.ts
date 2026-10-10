import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Listing } from '@/types';

interface ListingRow {
  id: string;
  image_url: string | null;
  price_per_unit: number;
  unit: string;
  quantity_available: number;
  location_text: string | null;
  latitude: number | null;
  longitude: number | null;
  quality_rating: number;
  harvest_date: string | null;
  organic: boolean;
  description: string | null;
  farmer_id: string;
  crops: { name: string; crop_type: string } | null;
  listing_images: { image_url: string; sort_order: number | null }[] | null;
  profiles: {
    id: string;
    name: string;
    farm_name: string | null;
    avatar_url: string | null;
    rating: number;
    verified: boolean;
  } | null;
}

function mapRowToListing(row: ListingRow): Listing {
  return {
    id: row.id,
    cropName: row.crops?.name ?? 'Unknown crop',
    cropType: (row.crops?.crop_type ?? 'Vegetables') as Listing['cropType'],
    image: row.image_url ?? '',
    gallery: row.listing_images?.length
      ? [...row.listing_images]
          .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
          .map((i) => i.image_url)
      : undefined,
    pricePerUnit: row.price_per_unit,
    unit: row.unit,
    quantityAvailable: row.quantity_available,
    farmer: {
      id: row.profiles?.id ?? row.farmer_id,
      name: row.profiles?.name ?? 'Unknown farmer',
      farmName: row.profiles?.farm_name ?? '',
      avatar: row.profiles?.avatar_url ?? '',
      rating: row.profiles?.rating ?? 0,
      totalListings: 0,
      verified: row.profiles?.verified ?? false,
    },
    location: row.location_text ?? '',
    distanceKm: 0,
    latitude: row.latitude,
    longitude: row.longitude,
    qualityRating: row.quality_rating,
    harvestDate: row.harvest_date ?? '',
    organic: row.organic,
    description: row.description ?? '',
  };
}

export function useListings() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchListings() {
      setLoading(true);
      setError(null);

      const { data, error } = await api.get<ListingRow[]>('/listings');

      if (cancelled) return;

      if (error) {
        setError(error);
        setListings([]);
      } else {
        setListings((data ?? []).map(mapRowToListing));
      }
      setLoading(false);
    }

    fetchListings();
    return () => {
      cancelled = true;
    };
  }, []);

  return { listings, loading, error };
}

export function useListing(id: string | undefined) {
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setListing(null);
      setLoading(false);
      return;
    }

    const listingId: string = id;
    let cancelled = false;

    async function fetchListing() {
      setLoading(true);
      setError(null);

      const { data, error } = await api.get<ListingRow>(`/listings/${listingId}`);

      if (cancelled) return;

      if (error) {
        setError(error);
        setListing(null);
      } else {
        setListing(data ? mapRowToListing(data) : null);
      }
      setLoading(false);
    }

    fetchListing();
    return () => {
      cancelled = true;
    };
  }, [id]);

  return { listing, loading, error };
}