import { Crown } from 'lucide-react';
import type { MaskedBid } from '@/data/mockData';

interface CurrentBidsProps {
  bids: MaskedBid[];
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function CurrentBids({ bids }: CurrentBidsProps) {
  if (bids.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm">
        <p className="text-sm text-gray-500">No bids placed yet.</p>
      </div>
    );
  }

  const sorted = [...bids].sort((a, b) => b.amountPerUnit - a.amountPerUnit);
  const highest = sorted[0].amountPerUnit;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wide text-gray-500">
          Current Bids
        </h3>
        <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700">
          {bids.length} bids
        </span>
      </div>

      <ul className="space-y-2.5">
        {sorted.map((bid, idx) => {
          const isTop = bid.amountPerUnit === highest;
          return (
            <li
              key={bid.id}
              className={`flex items-center justify-between gap-3 rounded-xl border p-3.5 transition-all ${
                isTop
                  ? 'border-green-300 bg-green-50/80 ring-1 ring-green-200'
                  : 'border-gray-50 bg-gray-50/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-center">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                      isTop
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {idx + 1}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-gray-800">
                      {bid.maskedBuyer}
                    </p>
                    {isTop && (
                      <span className="flex items-center gap-1 rounded-full bg-green-600 px-2 py-0.5 text-xs font-semibold text-white">
                        <Crown size={10} />
                        Top Bid
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">
                    {bid.quantity} units · {formatTime(bid.placedAt)}
                  </p>
                </div>
              </div>
              <span
                className={`text-base font-bold ${
                  isTop ? 'text-green-700' : 'text-gray-900'
                }`}
              >
                ₹{bid.amountPerUnit}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
