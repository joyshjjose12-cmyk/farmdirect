import { MapPin, BadgeCheck } from 'lucide-react';
import type { Farmer } from '@/types';
import StarRating from './StarRating';

interface FarmerProfileCardProps {
  farmer: Farmer;
  location: string;
  onMessage?: () => void;
}

export default function FarmerProfileCard({
  farmer,
  location,
  onMessage,
}: FarmerProfileCardProps) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-500">
        Farmer Profile
      </h3>

      <div className="flex items-center gap-4">
        {farmer.avatar ? (
          <img
            src={farmer.avatar}
            alt={farmer.name}
            className="h-16 w-16 rounded-full object-cover ring-2 ring-gray-100"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-xl font-bold text-green-700 ring-2 ring-gray-100">
            {farmer.name.charAt(0)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate font-bold text-gray-900">{farmer.name}</p>
            {farmer.verified && (
              <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                <BadgeCheck size={12} />
                Verified Farmer
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">{farmer.farmName}</p>
          <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <MapPin size={12} />
              {location}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-gray-50 pt-4">
        <div>
          <StarRating rating={farmer.rating} showValue size={16} />
          <p className="mt-0.5 text-xs text-gray-400">
            {farmer.totalListings} active listings
          </p>
        </div>
        {onMessage && (
          <button
            onClick={onMessage}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50"
          >
            Message Farmer
          </button>
        )}
      </div>
    </div>
  );
}