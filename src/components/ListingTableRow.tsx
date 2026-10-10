import { Eye, Pencil, CheckCircle } from 'lucide-react';
import type { DashboardListing } from '@/types';
import StatusBadge from './StatusBadge';

interface ListingTableRowProps {
  listing: DashboardListing;
  onViewBids?: (listing: DashboardListing) => void;
  onEdit?: (listing: DashboardListing) => void;
  onMarkSold?: (listing: DashboardListing) => void;
}

export default function ListingTableRow({
  listing,
  onViewBids,
  onEdit,
  onMarkSold,
}: ListingTableRowProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:shadow-md lg:flex-row lg:items-center lg:gap-4">
      {/* Thumbnail + name */}
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <img
          src={listing.image}
          alt={listing.cropName}
          className="h-14 w-14 flex-shrink-0 rounded-xl object-cover"
        />
        <div className="min-w-0">
          <p className="truncate font-semibold text-gray-900">{listing.cropName}</p>
          <p className="text-xs text-gray-400">{listing.cropType}</p>
        </div>
      </div>

      {/* Quantity */}
      <div className="flex items-center justify-between gap-2 lg:w-28 lg:justify-center">
        <span className="text-xs font-medium text-gray-400 lg:hidden">Qty</span>
        <span className="text-sm font-medium text-gray-700">
          {listing.quantityAvailable.toLocaleString()} {listing.unit}
        </span>
      </div>

      {/* Price */}
      <div className="flex items-center justify-between gap-2 lg:w-24 lg:justify-center">
        <span className="text-xs font-medium text-gray-400 lg:hidden">Price</span>
        <span className="text-sm font-bold text-green-700">
          ₹{listing.pricePerUnit}
        </span>
      </div>

      {/* Bids count */}
      <div className="flex items-center justify-between gap-2 lg:w-20 lg:justify-center">
        <span className="text-xs font-medium text-gray-400 lg:hidden">Bids</span>
        <span className="text-sm font-medium text-gray-600">{listing.bidsCount}</span>
      </div>

      {/* Status */}
      <div className="flex items-center justify-between gap-2 lg:w-28 lg:justify-center">
        <span className="text-xs font-medium text-gray-400 lg:hidden">Status</span>
        <StatusBadge status={listing.status} />
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2 lg:w-52 lg:justify-end">
        <button
          onClick={() => onViewBids?.(listing)}
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50"
        >
          <Eye size={14} />
          <span className="hidden lg:inline">Bids</span>
          {(listing.pendingBidsCount ?? 0) > 0 && (
            <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-amber-500 px-1.5 text-[11px] font-bold text-white">
              {listing.pendingBidsCount}
            </span>
          )}
        </button>
        <button
          onClick={() => onEdit?.(listing)}
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50"
        >
          <Pencil size={14} />
          <span className="hidden lg:inline">Edit</span>
        </button>
        {listing.status === 'Active' && (
          <button
            onClick={() => onMarkSold?.(listing)}
            className="flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 transition-colors hover:bg-green-600 hover:text-white"
          >
            <CheckCircle size={14} />
            <span className="hidden lg:inline">Sold</span>
          </button>
        )}
      </div>
    </div>
  );
}