import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Gavel, AlertCircle } from 'lucide-react';
import BidFeed from '@/components/BidFeed';
import StatusTimeline from '@/components/StatusTimeline';
import { useAuth } from '@/context/AuthContext';
import { buildTimeline, useBids, useMyOrder } from '@/hooks/useBids';
import type { Listing } from '@/types';

export default function BidPanel({ listing }: { listing: Listing }) {
  const { user, profile } = useAuth();
  const { bids, loading, error: loadError, placeBid } = useBids(listing.id);

  const myBid = user ? bids.find((b) => b.buyerId === user.id) : undefined;
  const myOrder = useMyOrder(myBid?.id);
  const timeline = buildTimeline(myBid, myOrder);

  const [amount, setAmount] = useState('');
  const [qty, setQty] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const isBuyer = profile?.role === 'buyer';
  const topBid = bids.reduce((m, b) => Math.max(m, b.amountPerUnit), 0);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setDone(false);
    const a = parseFloat(amount);
    const q = parseFloat(qty);
    if (!user) return setError('Please log in first.');
    if (isNaN(a) || a <= 0) return setError('Enter a valid price per ' + listing.unit + '.');
    if (isNaN(q) || q <= 0) return setError('Enter a valid quantity.');
    if (q > listing.quantityAvailable)
      return setError(`Only ${listing.quantityAvailable} ${listing.unit} available.`);

    setBusy(true);
    const { error } = await placeBid({ buyerId: user.id, amountPerUnit: a, quantity: q });
    setBusy(false);
    if (error) return setError(error);
    setError('');
    setDone(true);
    setAmount('');
    setQty('');
  }

  return (
    <>
      {/* Bid feed */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <Gavel size={16} className="text-green-600" />
          <h3 className="text-sm font-bold text-gray-900">Bids on this listing</h3>
        </div>
        {loadError && (
          <p className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{loadError}</p>
        )}
        {loading ? (
          <p className="text-sm text-gray-400">Loading bids…</p>
        ) : (
          <BidFeed bids={bids} />
        )}
      </div>

      {/* Place a bid */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h3 className="mb-1 text-sm font-bold uppercase tracking-wide text-gray-500">
          Place a Bid
        </h3>
        {!user ? (
          <p className="text-sm text-gray-500">
            <Link to="/auth" className="font-semibold text-green-700 hover:underline">
              Log in as a buyer
            </Link>{' '}
            to place a bid.
          </p>
        ) : !isBuyer ? (
          <p className="text-sm text-gray-500">Only buyer accounts can place bids.</p>
        ) : myBid ? (
          <p className="text-sm text-gray-500">
            You already bid ₹{myBid.amountPerUnit}/{listing.unit} for {myBid.quantity}{' '}
            {listing.unit} ({myBid.status}).
          </p>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <p className="text-xs text-gray-400">
              Listed at ₹{listing.pricePerUnit}/{listing.unit}
              {topBid > 0 && <> · top bid ₹{topBid}</>}
            </p>
            <div className="flex gap-3">
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={`₹ per ${listing.unit}`}
                className="w-1/2 rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
              <input
                type="number"
                step="0.01"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                placeholder={`Qty (${listing.unit})`}
                className="w-1/2 rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>
            {error && (
              <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {done && (
              <p className="rounded-lg bg-green-50 px-3 py-2 text-xs text-green-700">
                Bid placed. The farmer can now accept or decline it.
              </p>
            )}
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-green-700 disabled:opacity-60"
            >
              {busy ? 'Placing…' : 'Place Bid'}
            </button>
          </form>
        )}
      </div>

      {/* Order status: only if THIS user has a real bid on this listing */}
      {timeline && <StatusTimeline events={timeline} />}
    </>
  );
}