import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Gavel, CheckCircle, PiggyBank, LayoutDashboard, ShoppingBasket, Sprout } from 'lucide-react';
import StatCard from '@/components/StatCard';
import BuyerBidCard from '@/components/BuyerBidCard';
import { useBuyerDashboard, type BidStatus, type BuyerBid } from '@/hooks/useBuyerDashboard';
import { useDeliveryOrders } from '@/hooks/useDeliveryOrders';
import { useAuth } from '@/context/AuthContext';
import { useMemo } from 'react';

type Filter = 'all' | BidStatus;

export default function BuyerDashboardPage() {
  const { profile } = useAuth();
  const { bids, stats, loading, error, withdrawBid, reload: reloadBids } = useBuyerDashboard();
  const { orders: deliveries, reload: reloadDeliveries } = useDeliveryOrders('buyer');
  const deliveryByBid = useMemo(
    () => new Map(deliveries.filter((d) => d.bidId).map((d) => [d.bidId as string, d])),
    [deliveries]
  );
  const [filter, setFilter] = useState<Filter>('all');
  const [toast, setToast] = useState('');

  const firstName = profile?.name?.split(' ')[0] ?? 'there';
  const visible = filter === 'all' ? bids : bids.filter((b) => b.status === filter);

  const count = (f: Filter) => (f === 'all' ? bids.length : bids.filter((b) => b.status === f).length);
  const tabs: { key: Filter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'accepted', label: 'Accepted' },
    { key: 'declined', label: 'Declined' },
  ];

  const handleWithdraw = async (bid: BuyerBid) => {
    const { error } = await withdrawBid(bid.id);
    setToast(error ? error : `Bid on ${bid.cropName} withdrawn.`);
    setTimeout(() => setToast(''), 3500);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-600 text-white shadow-sm">
              <LayoutDashboard size={22} />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Buyer Dashboard</h1>
              <p className="text-sm text-gray-500">
                Welcome back, {firstName}. Here's what's ripening for you.
              </p>
            </div>
          </div>
          <Link
            to="/marketplace"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-green-700 hover:shadow-md"
          >
            <ShoppingBasket size={18} />
            Browse Market
          </Link>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Couldn't load your bids: {error}
          </div>
        )}

        {/* Stats */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label="Active Bids"
            value={stats.active}
            sublabel="Waiting for a farmer's reply"
            icon={<Gavel size={20} />}
            accent="amber"
          />
          <StatCard
            label="Accepted"
            value={stats.accepted}
            sublabel={`${stats.delivered} delivered so far`}
            icon={<CheckCircle size={20} />}
            accent="green"
          />
          <StatCard
            label="Saved vs Asking"
            value={`₹${stats.saved.toLocaleString('en-IN')}`}
            sublabel="Thanks to your negotiating"
            icon={<PiggyBank size={20} />}
            accent="blue"
          />
        </div>

        {/* Bids */}
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-bold text-gray-900">My Bids</h2>
            <div className="flex flex-wrap gap-2">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setFilter(t.key)}
                  className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                    filter === t.key
                      ? 'border-green-600 bg-green-600 text-white'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {t.label}
                  <span className={`ml-1.5 text-xs ${filter === t.key ? 'text-green-100' : 'text-gray-400'}`}>
                    {count(t.key)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <p className="py-10 text-center text-sm text-gray-400">Loading your bids…</p>
          ) : visible.length === 0 ? (
            <div className="py-12 text-center">
              <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 text-green-500">
                <Sprout size={28} />
              </span>
              <p className="font-semibold text-gray-900">
                {bids.length === 0 ? 'No bids yet' : `No ${filter} bids`}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                {bids.length === 0
                  ? 'Find fresh produce near you and make your first offer.'
                  : 'Try another tab.'}
              </p>
              {bids.length === 0 && (
                <Link
                  to="/marketplace"
                  className="mt-5 inline-block rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700"
                >
                  Explore the marketplace
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {visible.map((bid) => (
                <BuyerBidCard
                  key={bid.id}
                  bid={bid}
                  onWithdraw={handleWithdraw}
                  delivery={deliveryByBid.get(bid.id)}
                  onDeliveryChanged={() => {
                    reloadDeliveries();
                    reloadBids();
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-xl bg-gray-900 px-5 py-3 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}