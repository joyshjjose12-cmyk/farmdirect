import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  SlidersHorizontal,
  Map,
  List,
  ChevronDown,
  Sprout,
  X,
  Gavel,
  Check,
} from 'lucide-react';
import ListingCard from '@/components/ListingCard';
import FilterModal, { defaultFilters } from '@/components/FilterModal';
import ListingsMap from '@/components/ListingsMap';
import StarRating from '@/components/StarRating';

import BidPanel from '@/components/BidPanel';


import { useListings } from '@/hooks/useListings';
import type {
  Bid,
  FilterState,
  Listing,
  SortOption,
  ViewMode,
} from '@/types';

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
}

const MAP_PIN_LIMIT = 15;

// Normalise price to rupees per kg so kg / quintal / ton listings compare fairly
function pricePerKg(l: { pricePerUnit: number; unit: string }) {
  const u = l.unit.toLowerCase();
  return l.pricePerUnit / (u === 'ton' ? 1000 : u === 'quintal' ? 100 : 1);
}

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'nearest', label: 'Nearest' },
  { value: 'cheapest', label: 'Cheapest' },
  { value: 'highest-rated', label: 'Highest rated' },
];

export default function MarketplacePage() {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [sort, setSort] = useState<SortOption>('nearest');
  const [view, setView] = useState<ViewMode>('list');
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [selected, setSelected] = useState<Listing | null>(null);
  const [showAllOnMap, setShowAllOnMap] = useState(false);
  const navigate = useNavigate();
  const { listings: rawListings, loading, error } = useListings();
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);

  // Ask the browser for the buyer's real location (used for distance + "Nearest")
  useEffect(() => {
    if (!('geolocation' in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { timeout: 10000 }
    );
  }, []);

  // Fill in each listing's real distance from the user (when both locations are known)
  const listings = useMemo(
    () =>
      rawListings.map((l) =>
        userPos && l.latitude != null && l.longitude != null
          ? {
              ...l,
              distanceKm: Math.round(
                haversineKm(userPos.lat, userPos.lng, l.latitude, l.longitude)
              ),
            }
          : l
      ),
    [rawListings, userPos]
  );

  const activeFilterCount =
    filters.cropTypes.length +
    (filters.organicOnly ? 1 : 0) +
    (filters.maxDistanceKm !== defaultFilters.maxDistanceKm ? 1 : 0) +
    (filters.minPrice !== defaultFilters.minPrice ||
    filters.maxPrice !== defaultFilters.maxPrice
      ? 1
      : 0);

  const filtered = useMemo(() => {
    let result = listings.filter((l) => {
      if (query) {
        const q = query.toLowerCase();
        const match =
          l.cropName.toLowerCase().includes(q) ||
          l.cropType.toLowerCase().includes(q) ||
          l.farmer.name.toLowerCase().includes(q) ||
          l.farmer.farmName.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (filters.cropTypes.length && !filters.cropTypes.includes(l.cropType))
        return false;
      if (l.distanceKm > filters.maxDistanceKm) return false;
      if (l.pricePerUnit < filters.minPrice) return false;
      if (l.pricePerUnit > filters.maxPrice) return false;
      if (filters.organicOnly && !l.organic) return false;
      return true;
    });

    result = [...result].sort((a, b) => {
      switch (sort) {
        case 'nearest':
          return a.distanceKm - b.distanceKm;
        case 'cheapest':
          return pricePerKg(a) - pricePerKg(b);
        case 'highest-rated':
          return b.qualityRating - a.qualityRating;
      }
    });

    return result;
  }, [listings, query, filters, sort]);


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toolbar */}
      <div className="sticky top-16 z-30 border-b border-gray-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            {/* Search */}
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search crops, farmers, or farm names…"
                className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-800 placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Filter */}
              <button
                onClick={() => setFilterOpen(true)}
                className="relative flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50"
              >
                <SlidersHorizontal size={16} className="text-gray-500" />
                <span className="hidden sm:inline">Filter</span>
                {activeFilterCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-green-600 px-1 text-xs font-bold text-white">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {/* Sort */}
              <div className="relative">
                <button
                  onClick={() => setSortOpen((v) => !v)}
                  onBlur={() => setTimeout(() => setSortOpen(false), 150)}
                  className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50"
                >
                  <span className="hidden text-gray-400 sm:inline">Sort:</span>
                  {sortOptions.find((o) => o.value === sort)?.label}
                  <ChevronDown size={16} className="text-gray-400" />
                </button>
                {sortOpen && (
                  <div className="absolute right-0 top-full mt-1 w-44 overflow-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-lg">
                    {sortOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          setSort(opt.value);
                          setSortOpen(false);
                        }}
                        className="flex w-full items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        {opt.label}
                        {sort === opt.value && (
                          <Check size={15} className="text-green-600" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* View toggle */}
              <div className="flex overflow-hidden rounded-xl border border-gray-200">
                <button
                  onClick={() => setView('list')}
                  className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium transition-colors ${
                    view === 'list'
                      ? 'bg-green-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <List size={16} />
                  <span className="hidden sm:inline">List</span>
                </button>
                <button
                  onClick={() => setView('map')}
                  className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium transition-colors ${
                    view === 'map'
                      ? 'bg-green-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Map size={16} />
                  <span className="hidden sm:inline">Map</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            <span className="font-semibold text-gray-900">{filtered.length}</span>{' '}
            listings found
          </p>
        </div>

        {view === 'map' ? (
          <>
            <div className="mb-3 flex items-center justify-between text-sm text-gray-500">
              <span>
                {showAllOnMap || filtered.length <= MAP_PIN_LIMIT
                  ? `Showing all ${filtered.length} on the map`
                  : `Showing the top ${MAP_PIN_LIMIT} by "${
                      sortOptions.find((o) => o.value === sort)?.label
                    }" of ${filtered.length}`}
              </span>
              {filtered.length > MAP_PIN_LIMIT && (
                <button
                  onClick={() => setShowAllOnMap((v) => !v)}
                  className="font-medium text-green-700 hover:underline"
                >
                  {showAllOnMap ? `Show top ${MAP_PIN_LIMIT} only` : 'Show all'}
                </button>
              )}
            </div>
            <ListingsMap
              listings={showAllOnMap ? filtered : filtered.slice(0, MAP_PIN_LIMIT)}
              userPos={userPos}
              onSelect={setSelected}
            />
          </>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((l) => (
              <ListingCard
                key={l.id}
                listing={l}
                onViewDetails={(listing) => navigate(`/listing/${listing.id}`)}
              />
            ))}
          </div>
        )}

        {loading && (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-20 text-center">
            <p className="text-sm font-medium text-gray-500">Loading listings…</p>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-dashed border-red-200 bg-red-50 py-20 text-center">
            <p className="text-sm font-medium text-red-600">
              Couldn't load listings: {error}
            </p>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-20 text-center">
            <Sprout className="mx-auto mb-3 text-gray-300" size={36} />
            <p className="text-sm font-medium text-gray-500">
              No listings match your search.
            </p>
            <button
              onClick={() => {
                setQuery('');
                setFilters(defaultFilters);
              }}
              className="mt-3 text-sm font-semibold text-green-700 hover:underline"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Detail drawer */}
      {selected && (
        <DetailDrawer
          listing={selected}
         
          onClose={() => setSelected(null)}
        />
      )}

      <FilterModal
        open={filterOpen}
        filters={filters}
        onClose={() => setFilterOpen(false)}
        onApply={setFilters}
      />
    </div>
  );
}

/* ----- Detail drawer ----- */
function DetailDrawer({
  listing,
  
  onClose,
}: {
  listing: Listing;
  
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex h-full w-full max-w-md flex-col overflow-y-auto bg-white shadow-2xl sm:max-w-lg">
        <div className="relative h-56 flex-shrink-0">
          <img
            src={listing.image}
            alt={listing.cropName}
            className="h-full w-full object-cover"
          />
          <button
            onClick={onClose}
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-sm backdrop-blur hover:bg-white"
            aria-label="Close details"
          >
            <X size={18} />
          </button>
          <div className="absolute left-4 top-4 flex gap-2">
            <span className="rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-green-700 shadow-sm">
              {listing.cropType}
            </span>
            {listing.organic && (
              <span className="rounded-full bg-green-600 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                Organic
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 space-y-6 p-6">
          <div>
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-2xl font-bold text-gray-900">{listing.cropName}</h2>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-700">
                  ₹{listing.pricePerUnit}
                </p>
                <p className="text-xs text-gray-400">per {listing.unit}</p>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-3">
              <StarRating rating={listing.qualityRating} showValue size={16} />
              <span className="text-sm text-gray-400">·</span>
              <span className="text-sm text-gray-500">
                {listing.quantityAvailable.toLocaleString()} {listing.unit} available
              </span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-gray-600">
              {listing.description}
            </p>
          </div>

          {/* Farmer card */}
          <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
            <div className="flex items-center gap-3">
              <img
                src={listing.farmer.avatar}
                alt={listing.farmer.name}
                className="h-12 w-12 rounded-full object-cover"
              />
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="font-semibold text-gray-900">{listing.farmer.name}</p>
                  {listing.farmer.verified && (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                      Verified
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500">{listing.farmer.farmName}</p>
              </div>
              <div className="text-right">
                <StarRating rating={listing.farmer.rating} size={12} />
                <p className="mt-0.5 text-xs text-gray-400">
                  {listing.farmer.totalListings} listings
                </p>
              </div>
            </div>
          </div>

          {/* Bids, bid form and order status */}
          <BidPanel listing={listing} />

          
        </div>
      </div>
    </div>
  );
}