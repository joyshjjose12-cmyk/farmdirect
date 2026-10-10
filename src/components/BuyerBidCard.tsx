import { Link } from 'react-router-dom';
import { Check, Clock, Leaf, MapPin, Trash2, X } from 'lucide-react';
import { JOURNEY, type BuyerBid } from '@/hooks/useBuyerDashboard';
import BuyerDeliveryBlock from '@/components/BuyerDeliveryBlock';
import type { DeliveryOrder } from '@/types';

interface BuyerBidCardProps {
  bid: BuyerBid;
  onWithdraw: (bid: BuyerBid) => void;
  /** the order created when the farmer accepted this bid (holds address + delivery status) */
  delivery?: DeliveryOrder;
  onDeliveryChanged?: () => void;
}

const statusStyles = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  accepted: 'bg-green-50 text-green-700 border-green-200',
  declined: 'bg-red-50 text-red-700 border-red-200',
};
const statusIcons = { pending: Clock, accepted: Check, declined: X };

function caption(bid: BuyerBid): string {
  if (bid.status === 'declined') return `${bid.farmerName} passed on this one. Try a higher offer or another farm.`;
  switch (bid.step) {
    case 0: return `Waiting for ${bid.farmerName} to respond…`;
    case 1: return `${bid.farmerName} accepted your offer. Add your delivery address below so it can be dispatched.`;
    case 2: return 'A delivery partner is assigned and will collect it from the farm.';
    case 3: return 'On its way to you.';
    default: return 'Delivered. Enjoy the freshness!';
  }
}

/** The "negotiation meter": your offer vs the farmer's asking price. */
function PriceMeter({ offer, asking, unit }: { offer: number; asking: number; unit: string }) {
  const MAX = 1.25; // track represents 0 – 125% of asking
  const ratio = asking > 0 ? offer / asking : 1;
  const fill = Math.min(ratio, MAX) / MAX;
  const diff = Math.round(Math.abs(1 - ratio) * 100);
  const below = ratio < 0.995;
  const above = ratio > 1.005;

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between text-xs">
        <span className="font-semibold text-gray-900">
          You offered ₹{offer}/{unit}
        </span>
        <span className={below ? 'text-amber-600' : 'text-green-600'}>
          {below ? `${diff}% below asking` : above ? `${diff}% above asking` : 'At asking price'}
        </span>
      </div>
      <div className="relative h-2 rounded-full bg-gray-100">
        <div
          className={`h-2 rounded-full ${below ? 'bg-amber-400' : 'bg-green-500'}`}
          style={{ width: `${fill * 100}%` }}
        />
        {/* asking-price tick */}
        <span
          className="absolute -top-1 h-4 w-0.5 rounded bg-gray-400"
          style={{ left: `${(1 / MAX) * 100}%` }}
        />
      </div>
      <p
        className="mt-1 text-[11px] text-gray-400"
        style={{ marginLeft: `calc(${(1 / MAX) * 100}% - 40px)` }}
      >
        Asking ₹{asking}
      </p>
    </div>
  );
}

/** Harvest-to-doorstep tracker. */
function Journey({ step }: { step: number }) {
  return (
    <ol className="flex items-center">
      {JOURNEY.map((s, i) => {
        const done = i <= step;
        return (
          <li key={s.stage} className="flex flex-1 items-center last:flex-none">
            <span
              title={s.label}
              className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${
                done ? 'bg-green-600 text-white' : 'border-2 border-gray-200 bg-white'
              }`}
            >
              {done && <Check size={12} />}
            </span>
            {i < JOURNEY.length - 1 && (
              <span className={`h-0.5 flex-1 ${i < step ? 'bg-green-500' : 'bg-gray-100'}`} />
            )}
          </li>
        );
      })}
    </ol>
  );
}

export default function BuyerBidCard({ bid, onWithdraw, delivery, onDeliveryChanged }: BuyerBidCardProps) {
  const StatusIcon = statusIcons[bid.status];
  const total = bid.finalPrice * bid.quantity;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-start gap-4">
        {bid.image ? (
          <img src={bid.image} alt={bid.cropName} className="h-16 w-16 flex-shrink-0 rounded-xl object-cover" />
        ) : (
          <span className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-300">
            <Leaf size={26} />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-base font-bold text-gray-900">{bid.cropName}</h3>
              <p className="truncate text-sm text-gray-500">{bid.farmName || bid.farmerName}</p>
              {bid.location && (
                <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-gray-400">
                  <MapPin size={11} />
                  {bid.location}
                </p>
              )}
            </div>
            <span
              className={`flex flex-shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${statusStyles[bid.status]}`}
            >
              <StatusIcon size={12} />
              {bid.status}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-5">
        <PriceMeter offer={bid.offer} asking={bid.askingPrice} unit={bid.unit} />

        {bid.status !== 'declined' && <Journey step={bid.step} />}
        <p className="text-sm text-gray-600">{caption(bid)}</p>
      </div>

      {bid.status === 'accepted' && delivery && (
        <BuyerDeliveryBlock order={delivery} onChanged={onDeliveryChanged ?? (() => {})} />
      )}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-gray-50 pt-4">
        <p className="text-sm text-gray-500">
          {bid.quantity} {bid.unit} ·{' '}
          <span className="font-bold text-gray-900">₹{total.toLocaleString('en-IN')}</span>
        </p>
        <div className="flex items-center gap-2">
          {bid.status === 'pending' && (
            <button
              onClick={() => onWithdraw(bid)}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 size={14} />
              Withdraw
            </button>
          )}
          <Link
            to={`/listing/${bid.listingId}`}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50"
          >
            View listing
          </Link>
        </div>
      </div>
    </div>
  );
}