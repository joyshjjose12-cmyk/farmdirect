import { Clock, Check, X, Gavel } from 'lucide-react';
import type { Bid } from '@/types';

interface BidFeedProps {
  bids: Bid[];
}

const statusStyles = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  accepted: 'bg-green-50 text-green-700 border-green-200',
  declined: 'bg-red-50 text-red-700 border-red-200',
};

const statusIcons = {
  pending: Clock,
  accepted: Check,
  declined: X,
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function BidFeed({ bids }: BidFeedProps) {
  if (bids.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-6 text-center">
        <Gavel className="mx-auto mb-2 text-gray-300" size={28} />
        <p className="text-sm text-gray-500">No bids placed yet.</p>
      </div>
    );
  }

  const sorted = [...bids].sort(
    (a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime()
  );

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wide text-gray-500">
          Live Bid Feed
        </h3>
        <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700">
          {bids.length} active
        </span>
      </div>

      <ul className="space-y-3">
        {sorted.map((bid) => {
          const StatusIcon = statusIcons[bid.status];
          return (
            <li
              key={bid.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-gray-50 bg-gray-50/60 p-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-800">
                  {bid.buyerName}
                </p>
                <p className="text-xs text-gray-400">
                  {bid.quantity} units · {formatTime(bid.placedAt)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-gray-900">
                  ₹{bid.amountPerUnit}
                </span>
                <span
                  className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${statusStyles[bid.status]}`}
                >
                  <StatusIcon size={11} />
                  {bid.status}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
