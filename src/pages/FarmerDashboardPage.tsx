import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Package,
  Gavel,
  CheckCircle,
  Plus,
  LayoutDashboard,
  Trash2,
} from 'lucide-react';
import StatCard from '@/components/StatCard';
import ListingTableRow from '@/components/ListingTableRow';
import BidsDrawer from '@/components/BidsDrawer';
import FarmerDeliveries from '@/components/FarmerDeliveries';
import { useDashboardListings } from '@/hooks/useDashboardListings';
import type { DashboardListing } from '@/types';

export default function FarmerDashboardPage() {
  const { listings, stats, loading, error, markSold, removeListing, refetch } = useDashboardListings();
  const [bidsListingId, setBidsListingId] = useState<string | null>(null);
  const bidsListing = listings.find((l) => l.id === bidsListingId) ?? null;
  const [toast, setToast] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<DashboardListing | null>(null);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  const handleMarkSold = async (listing: DashboardListing) => {
    const { error } = await markSold(listing.id);
    setToast(
      error ? `Couldn't update ${listing.cropName}: ${error}` : `${listing.cropName} marked as sold.`
    );
    setTimeout(() => setToast(''), 3000);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await removeListing(deleteTarget.id);
    setDeleting(false);
    setToast(
      error
        ? `Couldn't delete ${deleteTarget.cropName}: ${error}`
        : `${deleteTarget.cropName} listing deleted.`
    );
    setDeleteTarget(null);
    setTimeout(() => setToast(''), 3500);
  };

  const handleViewBids = (listing: DashboardListing) => {
    setBidsListingId(listing.id);
  };

  const handleEdit = (listing: DashboardListing) => {
    navigate(`/listing/${listing.id}/edit`);
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
              <h1 className="text-2xl font-bold text-gray-900">Farmer Dashboard</h1>
              <p className="text-sm text-gray-500">
                Manage your listings, bids, and sales
              </p>
            </div>
          </div>
          <Link
            to="/listing/new"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-green-700 hover:shadow-md"
          >
            <Plus size={18} />
            New Listing
          </Link>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Couldn't load your listings: {error}
          </div>
        )}

        {/* Stats */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
  label="Active Listings"
  value={stats.activeListings}
  sublabel="Currently accepting bids"
  icon={<Package size={20} />}
  accent="green"
/>
<StatCard
  label="Pending Bids"
  value={stats.pendingBids}
  sublabel="Awaiting your review"
  icon={<Gavel size={20} />}
  accent="amber"
/>
<StatCard
  label="Completed Sales"
  value={stats.completedSales}
  sublabel={`₹${stats.totalRevenue.toLocaleString()} total revenue`}
  icon={<CheckCircle size={20} />}
  accent="blue"
/>
        </div>

        {/* Listings table */}
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">My Listings</h2>
            <span className="text-sm text-gray-400">{listings.length} total</span>
          </div>

          {loading ? (
            <p className="py-8 text-center text-sm text-gray-400">Loading your listings…</p>
          ) : listings.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">
              You haven't listed any crops yet.
            </p>
          ) : (
            <>
              <div className="mb-2 hidden gap-4 px-4 text-xs font-semibold text-gray-400 lg:flex">
                <span className="flex-1">Crop</span>
                <span className="w-28 text-center">Quantity</span>
                <span className="w-24 text-center">Price</span>
                <span className="w-20 text-center">Bids</span>
                <span className="w-28 text-center">Status</span>
                <span className="w-52 text-right">Actions</span>
              </div>
              <div className="flex flex-col gap-3">
                {listings.map((listing) => (
                  <ListingTableRow
                    key={listing.id}
                    listing={listing}
                    onViewBids={handleViewBids}
                    onEdit={handleEdit}
                    onMarkSold={handleMarkSold}
                    onDelete={setDeleteTarget}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
        <FarmerDeliveries />
      </div>

      {bidsListing && (
        <BidsDrawer
          listing={bidsListing}
          onClose={() => setBidsListingId(null)}
          onChanged={() => refetch(true)}
        />
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-600">
              <Trash2 size={20} />
            </span>
            <h3 className="text-lg font-bold text-gray-900">Delete this listing?</h3>
            <p className="mt-1 text-sm text-gray-500">
              <span className="font-semibold text-gray-700">{deleteTarget.cropName}</span> and its{' '}
              {deleteTarget.bidsCount} bid{deleteTarget.bidsCount === 1 ? '' : 's'} will be
              permanently removed. This cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-xl bg-gray-900 px-5 py-3 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}