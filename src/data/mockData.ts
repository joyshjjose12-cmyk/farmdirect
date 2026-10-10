import type {
  Bid,
  DashboardListing,
  DashboardStats,
  Farmer,
  Listing,
  ListingFormData,
  Order,
  StatusEvent,
} from '@/types';

export const farmers: Farmer[] = [
  {
    id: 'f1',
    name: 'Eleanor Whitfield',
    farmName: 'Whitfield Family Farm',
    avatar:
      'https://images.pexels.com/photos/4975357/pexels-photo-4975357.jpeg?auto=compress&cs=tinysrgb&h=200&w=200',
    rating: 4.9,
    totalListings: 12,
    verified: true,
  },
  {
    id: 'f2',
    name: 'Marcus Okafor',
    farmName: 'Green Valley Acres',
    avatar:
      'https://images.pexels.com/photos/4894584/pexels-photo-4894584.jpeg?auto=compress&cs=tinysrgb&h=200&w=200',
    rating: 4.7,
    totalListings: 8,
    verified: true,
  },
  {
    id: 'f3',
    name: 'Sofia Marchetti',
    farmName: 'Sunrise Orchards',
    avatar:
      'https://images.pexels.com/photos/27177517/pexels-photo-27177517.jpeg?auto=compress&cs=tinysrgb&h=200&w=200',
    rating: 4.8,
    totalListings: 15,
    verified: true,
  },
  {
    id: 'f4',
    name: 'Daniel Hartman',
    farmName: 'Hartman Homestead',
    avatar:
      'https://images.pexels.com/photos/7658789/pexels-photo-7658789.jpeg?auto=compress&cs=tinysrgb&h=200&w=200',
    rating: 4.5,
    totalListings: 6,
    verified: false,
  },
  {
    id: 'f5',
    name: 'Priya Nair',
    farmName: 'Golden Grain Co-op',
    avatar:
      'https://images.pexels.com/photos/4894618/pexels-photo-4894618.jpeg?auto=compress&cs=tinysrgb&h=200&w=200',
    rating: 4.6,
    totalListings: 9,
    verified: true,
  },
  {
    id: 'f6',
    name: 'Jasper Bell',
    farmName: 'Bell & Sons Apiary',
    avatar:
      'https://images.pexels.com/photos/5503187/pexels-photo-5503187.jpeg?auto=compress&cs=tinysrgb&h=200&w=200',
    rating: 5.0,
    totalListings: 4,
    verified: true,
  },
];

const tomatoGallery = [
  'https://images.pexels.com/photos/18759607/pexels-photo-18759607.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/33984954/pexels-photo-33984954.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/36317349/pexels-photo-36317349.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/32873342/pexels-photo-32873342.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
];

export const listings: Listing[] = [
  {
    id: 'l1',
    cropName: 'Heirloom Tomatoes',
    cropType: 'Vegetables',
    image: tomatoGallery[0],
    gallery: tomatoGallery,
    pricePerUnit: 45,
    unit: 'kg',
    quantityAvailable: 240,
    farmer: farmers[0],
    location: 'Nashik, Maharashtra',
    distanceKm: 4.2,
    qualityRating: 4.9,
    harvestDate: '2026-09-15',
    organic: true,
    description:
      'Vine-ripened heirloom tomatoes grown without synthetic inputs. Sweet, tangy, perfect for fresh eating or sauces.',
  },
  {
    id: 'l2',
    cropName: 'Crisp Lettuce Mix',
    cropType: 'Leafy Greens',
    image:
      'https://images.pexels.com/photos/28991058/pexels-photo-28991058.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    pricePerUnit: 35,
    unit: 'kg',
    quantityAvailable: 180,
    farmer: farmers[1],
    location: 'Pune, Maharashtra',
    distanceKm: 7.8,
    qualityRating: 4.6,
    harvestDate: '2026-09-17',
    organic: true,
    description:
      'A blend of butterhead, romaine, and red leaf lettuce picked at peak freshness each morning.',
  },
  {
    id: 'l3',
    cropName: 'Red Apples',
    cropType: 'Fruits',
    image:
      'https://images.pexels.com/photos/9075844/pexels-photo-9075844.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    pricePerUnit: 60,
    unit: 'kg',
    quantityAvailable: 520,
    farmer: farmers[2],
    location: 'Kotgarh, Himachal Pradesh',
    distanceKm: 12.4,
    qualityRating: 4.8,
    harvestDate: '2026-09-10',
    organic: false,
    description:
      'Hand-picked red apples from century-old orchard trees. Crisp texture with balanced sweetness.',
  },
  {
    id: 'l4',
    cropName: 'Hard Red Wheat',
    cropType: 'Grains',
    image:
      'https://images.pexels.com/photos/27778136/pexels-photo-27778136.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    pricePerUnit: 28,
    unit: 'kg',
    quantityAvailable: 4000,
    farmer: farmers[4],
    location: 'Karnal, Haryana',
    distanceKm: 21.6,
    qualityRating: 4.5,
    harvestDate: '2026-08-28',
    organic: false,
    description:
      'Premium hard red winter wheat, cleaned and ready for milling. High protein content ideal for bread flour.',
  },
  {
    id: 'l5',
    cropName: 'Sweet Corn',
    cropType: 'Vegetables',
    image:
      'https://images.pexels.com/photos/7543105/pexels-photo-7543105.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    pricePerUnit: 22,
    unit: 'kg',
    quantityAvailable: 800,
    farmer: farmers[3],
    location: 'Bhopal, Madhya Pradesh',
    distanceKm: 3.1,
    qualityRating: 4.4,
    harvestDate: '2026-09-16',
    organic: false,
    description:
      'Fresh-picked sweet corn with tender kernels. Picked daily and sold within 48 hours for maximum sweetness.',
  },
  {
    id: 'l6',
    cropName: 'Organic Carrots',
    cropType: 'Root Crops',
    image:
      'https://images.pexels.com/photos/3889959/pexels-photo-3889959.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    pricePerUnit: 40,
    unit: 'kg',
    quantityAvailable: 320,
    farmer: farmers[0],
    location: 'Nashik, Maharashtra',
    distanceKm: 4.2,
    qualityRating: 4.9,
    harvestDate: '2026-09-14',
    organic: true,
    description:
      'Sweet, crunchy organic carrots grown in mineral-rich sandy loam. Washed and bunched, ready for market.',
  },
  {
    id: 'l7',
    cropName: 'Fresh Strawberries',
    cropType: 'Berries',
    image:
      'https://images.pexels.com/photos/1125122/pexels-photo-1125122.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    pricePerUnit: 80,
    unit: 'kg',
    quantityAvailable: 140,
    farmer: farmers[2],
    location: 'Mahabaleshwar, Maharashtra',
    distanceKm: 12.4,
    qualityRating: 4.7,
    harvestDate: '2026-09-18',
    organic: true,
    description:
      'June-bearing strawberries picked at full ripeness. Fragrant, juicy, and naturally sweet with no pesticides.',
  },
  {
    id: 'l8',
    cropName: 'Russet Potatoes',
    cropType: 'Root Crops',
    image:
      'https://images.pexels.com/photos/144248/potatoes-vegetables-erdfrucht-bio-144248.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    pricePerUnit: 25,
    unit: 'kg',
    quantityAvailable: 1500,
    farmer: farmers[3],
    location: 'Agra, Uttar Pradesh',
    distanceKm: 3.1,
    qualityRating: 4.3,
    harvestDate: '2026-09-05',
    organic: false,
    description:
      'Classic russet potatoes with fluffy texture. Cured and stored in cool conditions for long shelf life.',
  },
  {
    id: 'l9',
    cropName: 'Raw Wildflower Honey',
    cropType: 'Honey',
    image:
      'https://images.pexels.com/photos/5634211/pexels-photo-5634211.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    pricePerUnit: 350,
    unit: 'kg',
    quantityAvailable: 60,
    farmer: farmers[5],
    location: 'Coorg, Karnataka',
    distanceKm: 15.9,
    qualityRating: 5.0,
    harvestDate: '2026-09-01',
    organic: true,
    description:
      'Unfiltered, unpasteurized wildflower honey from hives foraging on native meadow blooms. 500g glass jar.',
  },
  {
    id: 'l10',
    cropName: 'Jasmine Rice',
    cropType: 'Grains',
    image:
      'https://images.pexels.com/photos/5167396/pexels-photo-5167396.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    pricePerUnit: 55,
    unit: 'kg',
    quantityAvailable: 900,
    farmer: farmers[4],
    location: 'Karnal, Haryana',
    distanceKm: 21.6,
    qualityRating: 4.6,
    harvestDate: '2026-08-20',
    organic: false,
    description:
      'Fragrant jasmine rice milled and polished to export grade. Soft, slightly sticky texture when cooked.',
  },
];

export const bids: Bid[] = [
  {
    id: 'b1',
    listingId: 'l1',
    buyerName: 'Green Spoon Bistro',
    amountPerUnit: 44,
    quantity: 100,
    placedAt: '2026-09-17T09:12:00Z',
    status: 'pending',
  },
  {
    id: 'b2',
    listingId: 'l1',
    buyerName: 'Maria K.',
    amountPerUnit: 42,
    quantity: 40,
    placedAt: '2026-09-17T11:30:00Z',
    status: 'pending',
  },
  {
    id: 'b3',
    listingId: 'l1',
    buyerName: 'Co-op Kitchen',
    amountPerUnit: 46,
    quantity: 200,
    placedAt: '2026-09-18T08:00:00Z',
    status: 'accepted',
  },
  {
    id: 'b4',
    listingId: 'l3',
    buyerName: 'Orchard Press Co.',
    amountPerUnit: 58,
    quantity: 300,
    placedAt: '2026-09-16T14:20:00Z',
    status: 'pending',
  },
  {
    id: 'b5',
    listingId: 'l7',
    buyerName: 'Berry Bliss Bakery',
    amountPerUnit: 78,
    quantity: 50,
    placedAt: '2026-09-18T10:45:00Z',
    status: 'pending',
  },
];

export interface MaskedBid {
  id: string;
  listingId: string;
  maskedBuyer: string;
  amountPerUnit: number;
  quantity: number;
  placedAt: string;
}

export const maskedBids: MaskedBid[] = [
  {
    id: 'mb1',
    listingId: 'l1',
    maskedBuyer: 'Buyer ***42',
    amountPerUnit: 48,
    quantity: 80,
    placedAt: '2026-09-18T07:30:00Z',
  },
  {
    id: 'mb2',
    listingId: 'l1',
    maskedBuyer: 'Buyer ***17',
    amountPerUnit: 46,
    quantity: 200,
    placedAt: '2026-09-18T05:15:00Z',
  },
  {
    id: 'mb3',
    listingId: 'l1',
    maskedBuyer: 'Buyer ***91',
    amountPerUnit: 44,
    quantity: 100,
    placedAt: '2026-09-17T14:20:00Z',
  },
  {
    id: 'mb4',
    listingId: 'l1',
    maskedBuyer: 'Buyer ***63',
    amountPerUnit: 42,
    quantity: 50,
    placedAt: '2026-09-17T09:12:00Z',
  },
  {
    id: 'mb5',
    listingId: 'l1',
    maskedBuyer: 'Buyer ***28',
    amountPerUnit: 40,
    quantity: 120,
    placedAt: '2026-09-16T18:45:00Z',
  },
];

export const orderTimeline: StatusEvent[] = [
  {
    stage: 'bid_placed',
    label: 'Bid Placed',
    timestamp: '2026-09-18T08:00:00Z',
    complete: true,
  },
  {
    stage: 'bid_accepted',
    label: 'Bid Accepted by Farmer',
    timestamp: '2026-09-18T12:30:00Z',
    complete: true,
  },
  {
    stage: 'harvest_scheduled',
    label: 'Harvest Scheduled',
    timestamp: '2026-09-19T06:00:00Z',
    complete: false,
  },
  {
    stage: 'out_for_delivery',
    label: 'Out for Delivery',
    timestamp: '',
    complete: false,
  },
  {
    stage: 'delivered',
    label: 'Delivered',
    timestamp: '',
    complete: false,
  },
];

export const dashboardStats: DashboardStats = {
  activeListings: 5,
  pendingBids: 12,
  completedSales: 38,
  totalRevenue: 842000,
};

export const dashboardListings: DashboardListing[] = [
  {
    id: 'd1',
    cropName: 'Heirloom Tomatoes',
    cropType: 'Vegetables',
    image:
      'https://images.pexels.com/photos/18759607/pexels-photo-18759607.jpeg?auto=compress&cs=tinysrgb&h=200&w=200',
    quantityAvailable: 240,
    unit: 'kg',
    pricePerUnit: 45,
    status: 'Active',
    bidsCount: 5,
    listedDate: '2026-09-15',
  },
  {
    id: 'd2',
    cropName: 'Organic Carrots',
    cropType: 'Root Crops',
    image:
      'https://images.pexels.com/photos/3889959/pexels-photo-3889959.jpeg?auto=compress&cs=tinysrgb&h=200&w=200',
    quantityAvailable: 320,
    unit: 'kg',
    pricePerUnit: 40,
    status: 'Active',
    bidsCount: 3,
    listedDate: '2026-09-14',
  },
  {
    id: 'd3',
    cropName: 'Sweet Corn',
    cropType: 'Vegetables',
    image:
      'https://images.pexels.com/photos/7543105/pexels-photo-7543105.jpeg?auto=compress&cs=tinysrgb&h=200&w=200',
    quantityAvailable: 0,
    unit: 'kg',
    pricePerUnit: 22,
    status: 'Sold',
    bidsCount: 8,
    listedDate: '2026-09-01',
  },
  {
    id: 'd4',
    cropName: 'Russet Potatoes',
    cropType: 'Root Crops',
    image:
      'https://images.pexels.com/photos/144248/potatoes-vegetables-erdfrucht-bio-144248.jpeg?auto=compress&cs=tinysrgb&h=200&w=200',
    quantityAvailable: 1500,
    unit: 'kg',
    pricePerUnit: 25,
    status: 'Active',
    bidsCount: 2,
    listedDate: '2026-09-05',
  },
  {
    id: 'd5',
    cropName: 'Summer Squash',
    cropType: 'Vegetables',
    image:
      'https://images.pexels.com/photos/8540212/pexels-photo-8540212.jpeg?auto=compress&cs=tinysrgb&h=200&w=200',
    quantityAvailable: 0,
    unit: 'kg',
    pricePerUnit: 30,
    status: 'Expired',
    bidsCount: 0,
    listedDate: '2026-08-10',
  },
  {
    id: 'd6',
    cropName: 'Fresh Basil Bunches',
    cropType: 'Leafy Greens',
    image:
      'https://images.pexels.com/photos/12955498/pexels-photo-12955498.jpeg?auto=compress&cs=tinysrgb&h=200&w=200',
    quantityAvailable: 0,
    unit: 'kg',
    pricePerUnit: 50,
    status: 'Sold',
    bidsCount: 4,
    listedDate: '2026-08-20',
  },
  {
    id: 'd7',
    cropName: 'Crisp Lettuce Mix',
    cropType: 'Leafy Greens',
    image:
      'https://images.pexels.com/photos/28991058/pexels-photo-28991058.jpeg?auto=compress&cs=tinysrgb&h=200&w=200',
    quantityAvailable: 180,
    unit: 'kg',
    pricePerUnit: 35,
    status: 'Active',
    bidsCount: 2,
    listedDate: '2026-09-17',
  },
];

export const cropOptions: { value: string; label: string }[] = [
  { value: 'Heirloom Tomatoes', label: 'Heirloom Tomatoes' },
  { value: 'Red Apples', label: 'Red Apples' },
  { value: 'Sweet Corn', label: 'Sweet Corn' },
  { value: 'Organic Carrots', label: 'Organic Carrots' },
  { value: 'Russet Potatoes', label: 'Russet Potatoes' },
  { value: 'Fresh Strawberries', label: 'Fresh Strawberries' },
  { value: 'Crisp Lettuce Mix', label: 'Crisp Lettuce Mix' },
  { value: 'Hard Red Wheat', label: 'Hard Red Wheat' },
  { value: 'Jasmine Rice', label: 'Jasmine Rice' },
  { value: 'Raw Wildflower Honey', label: 'Raw Wildflower Honey' },
  { value: 'Summer Squash', label: 'Summer Squash' },
  { value: 'Fresh Basil Bunches', label: 'Fresh Basil Bunches' },
];

export const quantityUnits: { value: string; label: string }[] = [
  { value: 'kg', label: 'kg' },
  { value: 'quintal', label: 'quintal (100 kg)' },
  { value: 'ton', label: 'ton (1,000 kg)' },
];

export const editListingMock: ListingFormData = {
  cropName: 'Heirloom Tomatoes',
  cropType: 'Vegetables',
  quantity: 240,
  unit: 'kg',
  pricePerUnit: 45,
  qualityRating: 4,
  description:
    'Vine-ripened heirloom tomatoes grown without synthetic inputs. Sweet, tangy, perfect for fresh eating or sauces.',
  location: 'Nashik, Maharashtra',
  latitude: '20.0°N',
  longitude: '73.8°E',
  organic: true,
  harvestDate: '',
};

export const mockOrders: Order[] = [
  {
    id: 'o1',
    cropName: 'Heirloom Tomatoes',
    cropImage:
      'https://images.pexels.com/photos/18759607/pexels-photo-18759607.jpeg?auto=compress&cs=tinysrgb&h=300&w=400',
    quantity: 200,
    unit: 'kg',
    buyerName: 'Green Spoon Bistro',
    farmerName: 'Eleanor Whitfield',
    farmerFarm: 'Whitfield Family Farm',
    agreedPricePerUnit: 48,
    totalPrice: 9600,
    placedAt: '2026-09-18T08:00:00Z',
    timeline: [
      {
        stage: 'confirmed',
        label: 'Order Confirmed',
        timestamp: '2026-09-18T08:30:00Z',
        complete: true,
      },
      {
        stage: 'picked_up',
        label: 'Picked Up from Farm',
        timestamp: '2026-09-19T06:15:00Z',
        complete: true,
      },
      {
        stage: 'in_transit',
        label: 'In Transit',
        timestamp: '2026-09-19T09:00:00Z',
        complete: true,
      },
      {
        stage: 'delivered',
        label: 'Delivered',
        timestamp: '',
        complete: false,
      },
    ],
    transport: {
      temperatureC: 14.2,
      humidityPct: 68,
      lastLocation: 'NH-48, 18 km from destination',
      lastUpdated: '2026-09-19T11:42:00Z',
    },
  },
  {
    id: 'o2',
    cropName: 'Red Apples',
    cropImage:
      'https://images.pexels.com/photos/9075844/pexels-photo-9075844.jpeg?auto=compress&cs=tinysrgb&h=300&w=400',
    quantity: 300,
    unit: 'kg',
    buyerName: 'Orchard Press Co.',
    farmerName: 'Sofia Marchetti',
    farmerFarm: 'Sunrise Orchards',
    agreedPricePerUnit: 62,
    totalPrice: 18600,
    placedAt: '2026-09-16T14:20:00Z',
    timeline: [
      {
        stage: 'confirmed',
        label: 'Order Confirmed',
        timestamp: '2026-09-16T15:00:00Z',
        complete: true,
      },
      {
        stage: 'picked_up',
        label: 'Picked Up from Farm',
        timestamp: '2026-09-17T07:00:00Z',
        complete: true,
      },
      {
        stage: 'in_transit',
        label: 'In Transit',
        timestamp: '2026-09-17T10:30:00Z',
        complete: true,
      },
      {
        stage: 'delivered',
        label: 'Delivered',
        timestamp: '2026-09-17T16:45:00Z',
        complete: true,
      },
    ],
    transport: {
      temperatureC: 8.5,
      humidityPct: 72,
      lastLocation: 'Delivered — Orchard Press Co. godown',
      lastUpdated: '2026-09-17T16:45:00Z',
    },
  },
];
