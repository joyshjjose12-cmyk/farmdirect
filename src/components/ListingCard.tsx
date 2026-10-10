import { MapPin, BadgeCheck, Leaf } from 'lucide-react';
import type { Listing } from '@/types';
import StarRating from './StarRating';

interface ListingCardProps {
  listing: Listing;
  onViewDetails?: (listing: Listing) => void;
}

export default function ListingCard({ listing, onViewDetails }: ListingCardProps) {
  const { farmer } = listing;

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
      <div className="relative aspect-[4/3] overflow-hidden">
        {listing.image ? (
          <img
            src={listing.image}
            alt={listing.cropName}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-green-50 text-green-300">
            <Leaf size={48} />
          </div>
        )}
        <div className="absolute left-3 top-3 flex gap-2">
          <span className="rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-green-700 shadow-sm backdrop-blur">
            {listing.cropType}
          </span>
          {listing.organic && (
            <span className="flex items-center gap-1 rounded-full bg-green-600/95 px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
              <Leaf size={11} /> Organic
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-bold text-gray-900">{listing.cropName}</h3>
          <div className="text-right">
            <p className="text-lg font-bold text-green-700">
              ₹{listing.pricePerUnit}
            </p>
            <p className="text-xs text-gray-400">per {listing.unit}</p>
          </div>
        </div>

        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-gray-500">
          {listing.description}
        </p>

        <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
          {farmer.avatar ? (
            <img
              src={farmer.avatar}
              alt={farmer.name}
              className="h-7 w-7 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700">
              {farmer.name.charAt(0)}
            </div>
          )}
          <span className="font-medium text-gray-700">{farmer.name}</span>
          {farmer.verified && (
            <BadgeCheck size={15} className="text-green-600" />
          )}
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <MapPin size={13} className="text-gray-400" />
            {listing.location}
          </span>
          <span className="font-medium text-gray-600">
            {listing.quantityAvailable.toLocaleString()} {listing.unit} available
          </span>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <StarRating rating={listing.qualityRating} showValue />
        </div>

        <button
          onClick={() => onViewDetails?.(listing)}
          className="mt-4 w-full rounded-xl bg-green-50 px-4 py-2.5 text-sm font-semibold text-green-700 transition-all hover:bg-green-600 hover:text-white"
        >
          View Details
        </button>
      </div>
    </article>
  );
}
