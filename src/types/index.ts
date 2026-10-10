export type CropType =
  | 'Vegetables'
  | 'Fruits'
  | 'Grains'
  | 'Leafy Greens'
  | 'Root Crops'
  | 'Berries'
  | 'Dairy'
  | 'Honey';

export interface Farmer {
  id: string;
  name: string;
  farmName: string;
  avatar: string;
  rating: number;
  totalListings: number;
  verified: boolean;
}

export interface Listing {
  id: string;
  cropName: string;
  cropType: CropType;
  image: string;
  gallery?: string[];
  pricePerUnit: number;
  unit: string;
  quantityAvailable: number;
  farmer: Farmer;
  location: string;
  distanceKm: number;
  latitude?: number | null;
  longitude?: number | null;
  qualityRating: number;
  harvestDate: string;
  organic: boolean;
  description: string;
}

export interface Bid {
  id: string;
  listingId: string;
  buyerName: string;
  amountPerUnit: number;
  quantity: number;
  placedAt: string;
  status: 'pending' | 'accepted' | 'declined';
}

export type OrderStage =
  | 'bid_placed'
  | 'bid_accepted'
  | 'harvest_scheduled'
  | 'out_for_delivery'
  | 'delivered';

export interface StatusEvent {
  stage: OrderStage;
  label: string;
  timestamp: string;
  complete: boolean;
}

export type TrackingStage = 'confirmed' | 'picked_up' | 'in_transit' | 'delivered';

export interface TrackingEvent {
  stage: TrackingStage;
  label: string;
  timestamp: string;
  complete: boolean;
}

export interface TransportReadout {
  temperatureC: number;
  humidityPct: number;
  lastLocation: string;
  lastUpdated: string;
}

export interface Order {
  id: string;
  cropName: string;
  cropImage: string;
  quantity: number;
  unit: string;
  buyerName: string;
  farmerName: string;
  farmerFarm: string;
  agreedPricePerUnit: number;
  totalPrice: number;
  placedAt: string;
  timeline: TrackingEvent[];
  transport: TransportReadout;
}

export interface FilterState {
  cropTypes: CropType[];
  maxDistanceKm: number;
  minPrice: number;
  maxPrice: number;
  organicOnly: boolean;
}

export type SortOption = 'nearest' | 'cheapest' | 'highest-rated';
export type ViewMode = 'list' | 'map';

export type ListingStatus = 'Active' | 'Sold' | 'Expired';

export type QuantityUnit = 'kg' | 'quintal' | 'ton';

export interface ListingFormData {
  cropName: string;
  cropType: CropType;
  quantity: number;
  unit: QuantityUnit;
  pricePerUnit: number;
  qualityRating: number;
  description: string;
  location: string;
  latitude: string;
  longitude: string;
  organic: boolean;
  harvestDate: string;
}

export interface DashboardListing {
  id: string;
  cropName: string;
  cropType: CropType;
  image: string;
  quantityAvailable: number;
  unit: string;
  pricePerUnit: number;
  status: ListingStatus;
  bidsCount: number;
  pendingBidsCount?: number;
  listedDate: string;
}

export interface DashboardStats {
  activeListings: number;
  pendingBids: number;
  completedSales: number;
  totalRevenue: number;
}

export interface MaskedBid {
  id: string;
  listingId: string;
  maskedBuyer: string;
  amountPerUnit: number;
  quantity: number;
  placedAt: string;
}

/* ---------- Delivery ---------- */

export type DeliveryStage =
  | 'bid_accepted'
  | 'harvest_scheduled'
  | 'out_for_delivery'
  | 'delivered';

export interface DeliveryOrder {
  id: string;
  bidId: string | null;
  listingId: string;
  stage: DeliveryStage;
  placedAt: string;

  cropName: string;
  image: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  total: number;

  /** pickup (farm) */
  farmerName: string;
  farmName: string;
  farmerPhone: string;
  pickupText: string;
  pickupLat: number | null;
  pickupLng: number | null;

  /** drop-off (buyer) */
  buyerId: string;
  buyerName: string;
  address: string;
  dropLat: number | null;
  dropLng: number | null;
  buyerPhone: string;
  notes: string;

  /** delivery partner */
  courierId: string | null;
  courierName: string;
  courierPhone: string;
  claimedAt: string | null;
  pickedUpAt: string | null;
  deliveredAt: string | null;
}
