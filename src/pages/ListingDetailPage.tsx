import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Leaf, MapPin, MessageCircle, Package } from 'lucide-react';
import PhotoGallery from '@/components/PhotoGallery';
import StarRating from '@/components/StarRating';
import FarmerProfileCard from '@/components/FarmerProfileCard';
import BidPanel from '@/components/BidPanel';
import { useListing } from '@/hooks/useListings';
import { useLanguage } from '@/i18n';
import { useAuth } from '@/context/AuthContext';

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [messageOpen, setMessageOpen] = useState(false);

  const { listing, loading, error } = useListing(id);

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
        <p className="text-sm font-medium text-gray-500">Loading listing…</p>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
        <Package className="mx-auto mb-4 text-gray-300" size={48} />
        <h1 className="text-2xl font-bold text-gray-900">Listing not found</h1>
        <p className="mt-2 text-gray-500">
          The listing you're looking for may have been removed or sold out.
        </p>
        {error && (
          <p className="mt-2 text-sm font-medium text-red-600">
            Couldn't load listing: {error}
          </p>
        )}
        <Link
          to="/marketplace"
          className="mt-6 inline-block rounded-xl bg-green-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-700"
        >
          Back to Marketplace
        </Link>
      </div>
    );
  }

  const isOwnListing = !!user && listing.farmer.id === user.id;

  const gallery = listing.gallery?.length
    ? listing.gallery
    : listing.image
    ? [listing.image]
    : [];
 

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition-colors hover:text-green-700"
        >
          <ArrowLeft size={18} />
          Back to Marketplace
        </button>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left: gallery + info */}
          <div className="space-y-6 lg:col-span-2">
            {gallery.length > 0 ? (
              <PhotoGallery images={gallery} alt={listing.cropName} />
            ) : (
              <div className="flex aspect-[16/10] items-center justify-center rounded-2xl border border-gray-100 bg-green-50 text-green-300 shadow-sm">
                <Leaf size={64} />
              </div>
            )}

            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold text-gray-900">
                      {listing.cropName}
                    </h1>
                    {listing.organic && (
                      <span className="flex items-center gap-1 rounded-full bg-green-600 px-2.5 py-1 text-xs font-semibold text-white">
                        <Leaf size={11} /> Organic
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <MapPin size={14} className="text-gray-400" />
                      {listing.location}
                    </span>
                    <StarRating rating={listing.qualityRating} showValue size={15} />
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-green-700">
                    ₹{listing.pricePerUnit}
                  </p>
                  <p className="text-xs text-gray-400">
                    {t('detail.basePrice')} {t('market.perUnit')} {listing.unit}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-4 border-t border-gray-50 pt-5 sm:grid-cols-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Quantity Available
                  </p>
                  <p className="mt-1 text-lg font-bold text-gray-900">
                    {listing.quantityAvailable.toLocaleString()}{' '}
                    <span className="text-sm font-normal text-gray-400">{listing.unit}</span>
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Harvest Date
                  </p>
                  <p className="mt-1 text-lg font-bold text-gray-900">
                    {listing.harvestDate
                      ? new Date(listing.harvestDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : 'Not specified'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Crop Type
                  </p>
                  <p className="mt-1 text-lg font-bold text-gray-900">{listing.cropType}</p>
                </div>
              </div>

              <div className="mt-5 border-t border-gray-50 pt-5">
                <h3 className="text-sm font-bold text-gray-900">About this produce</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  {listing.description}
                </p>
              </div>
            </div>
          </div>

          {/* Right: sidebar */}
          <div className="space-y-6">
            <FarmerProfileCard
              farmer={listing.farmer}
              location={listing.location}
              onMessage={isOwnListing ? undefined : () => setMessageOpen(true)}
            />

            <BidPanel listing={listing} />

            {!isOwnListing && (
              <button
                onClick={() => setMessageOpen(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:border-gray-300 hover:bg-gray-50"
              >
                <MessageCircle size={18} />
                Message Farmer
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Message modal */}
      {messageOpen && !isOwnListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
            onClick={() => setMessageOpen(false)}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center gap-3">
              {listing.farmer.avatar ? (
                <img
                  src={listing.farmer.avatar}
                  alt={listing.farmer.name}
                  className="h-12 w-12 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-lg font-bold text-green-700">
                  {listing.farmer.name.charAt(0)}
                </div>
              )}
              <div>
                <p className="font-bold text-gray-900">Message {listing.farmer.name}</p>
                <p className="text-xs text-gray-400">{listing.farmer.farmName}</p>
              </div>
            </div>
            <textarea
              rows={4}
              placeholder={`Hi ${listing.farmer.name.split(' ')[0]}, I'm interested in your ${listing.cropName.toLowerCase()}…`}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => setMessageOpen(false)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={() => setMessageOpen(false)}
                className="rounded-lg bg-green-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-green-700"
              >
                Send Message
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}