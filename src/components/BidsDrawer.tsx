import { useEffect, useMemo, useState } from 'react';
import {
  X,
  Check,
  Clock,
  Crown,
  Gavel,
  Leaf,
  Loader2,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  PackageCheck,
} from 'lucide-react';
import type { DashboardListing } from '@/types';
import { useFarmerBids, type FarmerBid, type FarmerBidStatus } from '@/hooks/useFarmerBids';

interface BidsDrawerProps {
  listing: DashboardListing;
  onClose: () => void;
  /** Called after any accept/decline so the dashboard stats + stock refresh. */
  onChanged: () => void;
}

type Tab = 'pending' | 'accepted' | 'declined' | 'all';

const statusStyles: Record<FarmerBidStatus, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  accepted: 'bg-green-50 text-green-700 border-green-200',
  declined: 'bg-red-50 text-red-700 border-red-200',
};
const statusIcons = { pending: Clock, accepted: Check, declined: X };

const avatarColors = [
  'bg-green-100 text-green-700',
  'bg-amber-100 text-amber-700',
  'bg-blue-100 text-blue-700',
  'bg-purple-100 text-purple-700',
  'bg-rose-100 text-rose-700',
  'bg-teal-100 text-teal-700',
];

function avatarFor(name: string) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
  return { initials: initials || '?', color: avatarColors[h % avatarColors.length] };
}

function timeAgo(iso: string): string {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;

/** Offer vs asking price, same "negotiation meter" idea the buyer sees. */
function PriceMeter({ offer, asking, unit }: { offer: number; asking: number; unit: string }) {
  const MAX = 1.25;
  const ratio = asking > 0 ? offer / asking : 1;
  const fill = Math.min(ratio, MAX) / MAX;
  const diff = Math.round(Math.abs(1 - ratio) * 100);
  const below = ratio < 0.995;
  const above = ratio > 1.005;
  const Icon = below ? TrendingDown : TrendingUp;

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-lg font-bold text-gray-900">
          {inr(offer)}
          <span className="text-xs font-medium text-gray-400">/{unit}</span>
        </span>
        <span
          className={`flex items-center gap-1 text-xs font-semibold ${
            below ? 'text-amber-600' : 'text-green-600'
          }`}
        >
          {(below || above) && <Icon size={13} />}
          {below ? `${diff}% below your price` : above ? `${diff}% above your price` : 'Matches your price'}
        </span>
      </div>
      <div className="relative h-2 rounded-full bg-gray-100">
        <div
          className={`h-2 rounded-full transition-all ${below ? 'bg-amber-400' : 'bg-green-500'}`}
          style={{ width: `${fill * 100}%` }}
        />
        <span
          title={`Your price ₹${asking}`}
          className="absolute -top-1 h-4 w-0.5 rounded bg-gray-400"
          style={{ left: `${(1 / MAX) * 100}%` }}
        />
      </div>
    </div>
  );
}

export default function BidsDrawer({ listing, onClose, onChanged }: BidsDrawerProps) {
  const { bids, loading, error, accept, decline } = useFarmerBids(listing, onChanged);
  const [tab, setTab] = useState<Tab>('pending');
  const [confirming, setConfirming] = useState<{ id: string; kind: 'accept' | 'decline' } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [flashId, setFlashId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null);

  // Esc to close + lock page scroll while the drawer is open
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const pending = useMemo(
    () => bids.filter((b) => b.status === 'pending').sort((a, b) => b.amountPerUnit - a.amountPerUnit),
    [bids]
  );
  const bestPendingId = pending.length > 1 ? pending[0].id : null;
  const pendingQty = pending.reduce((s, b) => s + b.quantity, 0);
  const bestOffer = pending[0]?.amountPerUnit;

  const count = (t: Tab) => (t === 'all' ? bids.length : bids.filter((b) => b.status === t).length);
  const visible = (tab === 'pending' ? pending : tab === 'all' ? bids : bids.filter((b) => b.status === tab));

  const stock = listing.quantityAvailable;
  const demandRatio = stock > 0 ? Math.min(pendingQty / stock, 1) : pendingQty > 0 ? 1 : 0;
  const oversubscribed = pendingQty > stock;

  const showToast = (text: string, ok: boolean) => {
    setToast({ text, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const run = async (bid: FarmerBid, kind: 'accept' | 'decline') => {
    setBusyId(bid.id);
    const { error } = kind === 'accept' ? await accept(bid) : await decline(bid);
    setBusyId(null);
    setConfirming(null);
    if (error) {
      showToast(error, false);
      return;
    }
    if (kind === 'accept') {
      setFlashId(bid.id);
      setTimeout(() => setFlashId(null), 2400);
      showToast(`Accepted ${bid.buyerName}'s bid. An order has been created.`, true);
    } else {
      showToast(`Declined ${bid.buyerName}'s bid.`, true);
    }
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'pending', label: 'Pending' },
    { key: 'accepted', label: 'Accepted' },
    { key: 'declined', label: 'Declined' },
    { key: 'all', label: 'All' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Bids">
      <div className="fd-backdrop absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={onClose} />

      <aside className="fd-drawer relative flex h-full w-full max-w-lg flex-col bg-gray-50 shadow-2xl">
        {/* Header */}
        <div className="border-b border-gray-100 bg-white px-5 pb-4 pt-5">
          <div className="flex items-start gap-3">
            {listing.image ? (
              <img src={listing.image} alt={listing.cropName} className="h-14 w-14 flex-shrink-0 rounded-xl object-cover" />
            ) : (
              <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-300">
                <Leaf size={24} />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="truncate text-lg font-bold text-gray-900">{listing.cropName}</h2>
                <span className="flex flex-shrink-0 items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-semibold text-green-700">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="fd-live-ring absolute inline-flex h-full w-full rounded-full bg-green-500" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-500" />
                  </span>
                  Live
                </span>
              </div>
              <p className="text-sm text-gray-500">
                Your price <span className="font-semibold text-green-700">{inr(listing.pricePerUnit)}/{listing.unit}</span>
                {' · '}
                {stock.toLocaleString()} {listing.unit} left
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="rounded-lg border border-gray-200 p-2 text-gray-500 transition-colors hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700"
            >
              <X size={16} />
            </button>
          </div>

          {/* Mini stats */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-amber-50 px-3.5 py-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-600">Pending</p>
              <p className="text-xl font-bold text-gray-900">{pending.length}</p>
            </div>
            <div className="rounded-xl bg-green-50 px-3.5 py-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-green-600">Best offer</p>
              <p className="text-xl font-bold text-gray-900">
                {bestOffer ? `${inr(bestOffer)}/${listing.unit}` : '—'}
              </p>
            </div>
          </div>

          {/* Demand meter */}
          {pending.length > 0 && (
            <div className="mt-3">
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-medium text-gray-500">
                  Buyers want {pendingQty} {listing.unit} · you have {stock} {listing.unit}
                </span>
                {oversubscribed && (
                  <span className="flex items-center gap-1 font-semibold text-amber-600">
                    <AlertTriangle size={12} /> Choose wisely
                  </span>
                )}
              </div>
              <div className="h-2 rounded-full bg-gray-100">
                <div
                  className={`h-2 rounded-full transition-all ${oversubscribed ? 'bg-amber-400' : 'bg-green-500'}`}
                  style={{ width: `${demandRatio * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 px-5 pb-1 pt-4">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                tab === t.key
                  ? 'border-green-600 bg-green-600 text-white'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              {t.label}
              <span className={`ml-1.5 text-xs ${tab === t.key ? 'text-green-100' : 'text-gray-400'}`}>
                {count(t.key)}
              </span>
            </button>
          ))}
        </div>

        {/* Bids list */}
        <div className="flex-1 overflow-y-auto px-5 pb-8 pt-4">
          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              Couldn't load bids: {error}
            </div>
          )}

          {loading ? (
            <p className="py-12 text-center text-sm text-gray-400">Loading bids…</p>
          ) : visible.length === 0 ? (
            <div className="py-14 text-center">
              <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 text-green-500">
                <Gavel size={26} />
              </span>
              <p className="font-semibold text-gray-900">
                {bids.length === 0 ? 'No bids yet' : `No ${tab} bids`}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                {bids.length === 0
                  ? 'Buyers will appear here the moment they make an offer.'
                  : 'Try another tab.'}
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {visible.map((bid, i) => {
                const StatusIcon = statusIcons[bid.status];
                const av = avatarFor(bid.buyerName);
                const total = bid.amountPerUnit * bid.quantity;
                const tooMuch = bid.quantity > stock;
                const isBest = bid.id === bestPendingId;
                const isConfirming = confirming?.id === bid.id;
                const busy = busyId === bid.id;

                return (
                  <div
                    key={bid.id}
                    style={{ animationDelay: `${i * 50}ms` }}
                    className={`fd-rise relative rounded-2xl border bg-white p-4 shadow-sm transition-shadow hover:shadow-md ${
                      isBest ? 'border-amber-200 ring-1 ring-amber-100' : 'border-gray-100'
                    } ${flashId === bid.id ? 'fd-flash' : ''}`}
                  >
                    {isBest && (
                      <span className="absolute -top-2.5 left-4 inline-flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-0.5 text-[11px] font-bold text-white shadow-sm">
                        <Crown size={11} /> Best offer
                      </span>
                    )}

                    <div className="flex items-center gap-3">
                      <span className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold ${av.color}`}>
                        {av.initials}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-gray-900">{bid.buyerName}</p>
                        <p className="text-xs text-gray-400">{timeAgo(bid.placedAt)}</p>
                      </div>
                      <span className={`flex flex-shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${statusStyles[bid.status]}`}>
                        <StatusIcon size={12} />
                        {bid.status}
                      </span>
                    </div>

                    <div className="mt-4">
                      <PriceMeter offer={bid.amountPerUnit} asking={listing.pricePerUnit} unit={listing.unit} />
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-gray-50 pt-3">
                      <p className="text-sm text-gray-500">
                        {bid.quantity} {listing.unit} ·{' '}
                        <span className="font-bold text-gray-900">{inr(total)}</span>
                      </p>

                      {bid.status === 'pending' && !isConfirming && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setConfirming({ id: bid.id, kind: 'decline' })}
                            disabled={busy}
                            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600"
                          >
                            <X size={14} /> Decline
                          </button>
                          <button
                            onClick={() => setConfirming({ id: bid.id, kind: 'accept' })}
                            disabled={tooMuch}
                            title={tooMuch ? `Only ${stock} ${listing.unit} left` : undefined}
                            className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-green-700 hover:shadow-md disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none"
                          >
                            <Check size={14} /> Accept
                          </button>
                        </div>
                      )}

                      {bid.status === 'accepted' && (
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-green-700">
                          <PackageCheck size={15} /> Order created
                        </span>
                      )}
                    </div>

                    {bid.status === 'pending' && tooMuch && (
                      <p className="mt-2 flex items-center gap-1.5 text-xs text-amber-600">
                        <AlertTriangle size={12} />
                        Needs {bid.quantity} {listing.unit}, only {stock} {listing.unit} left. Can't accept.
                      </p>
                    )}

                    {/* Inline confirm */}
                    {isConfirming && confirming && (
                      <div
                        className={`fd-rise mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl px-3.5 py-3 ${
                          confirming.kind === 'accept' ? 'bg-green-50' : 'bg-red-50'
                        }`}
                      >
                        <p className={`text-sm font-medium ${confirming.kind === 'accept' ? 'text-green-800' : 'text-red-700'}`}>
                          {confirming.kind === 'accept'
                            ? `Sell ${bid.quantity} ${listing.unit} to ${bid.buyerName} for ${inr(total)}?`
                            : `Decline this bid from ${bid.buyerName}?`}
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setConfirming(null)}
                            disabled={busy}
                            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => run(bid, confirming.kind)}
                            disabled={busy}
                            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm disabled:opacity-60 ${
                              confirming.kind === 'accept' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                            }`}
                          >
                            {busy && <Loader2 size={12} className="animate-spin" />}
                            {confirming.kind === 'accept' ? 'Yes, accept' : 'Yes, decline'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {toast && (
          <div
            className={`fd-rise absolute bottom-6 left-1/2 max-w-[90%] -translate-x-1/2 rounded-xl px-5 py-3 text-sm font-medium text-white shadow-lg ${
              toast.ok ? 'bg-gray-900' : 'bg-red-600'
            }`}
          >
            {toast.text}
          </div>
        )}
      </aside>
    </div>
  );
}