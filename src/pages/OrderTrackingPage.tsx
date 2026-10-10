import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Package,
  CheckCircle,
  FileText,
  Download,
} from 'lucide-react';
import OrderSummaryCard from '@/components/OrderSummaryCard';
import OrderTimeline from '@/components/OrderTimeline';
import TransportReadoutCard from '@/components/TransportReadoutCard';
import { mockOrders } from '@/data/mockData';
import type { Order, TrackingEvent } from '@/types';

export default function OrderTrackingPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | undefined>(
    mockOrders.find((o) => o.id === id)
  );
  const [toast, setToast] = useState('');

  if (!order) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
        <Package className="mx-auto mb-4 text-gray-300" size={48} />
        <h1 className="text-2xl font-bold text-gray-900">Order not found</h1>
        <p className="mt-2 text-gray-500">
          The order you're looking for doesn't exist or may have been removed.
        </p>
        <Link
          to="/dashboard"
          className="mt-6 inline-block rounded-xl bg-green-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-700"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const inTransit = order.timeline.some(
    (e) => e.stage === 'in_transit' && e.complete
  );
  const delivered = order.timeline.some(
    (e) => e.stage === 'delivered' && e.complete
  );

  const handleConfirmDelivery = () => {
    const updatedTimeline: TrackingEvent[] = order.timeline.map((e) =>
      e.stage === 'delivered'
        ? {
            ...e,
            complete: true,
            timestamp: new Date().toISOString(),
          }
        : e
    );
    setOrder({ ...order, timeline: updatedTimeline });
    setToast('Delivery confirmed! Thank you.');
    setTimeout(() => setToast(''), 4000);
  };

  const handleInvoice = () => {
    setToast('Invoice download would start here (mock).');
    setTimeout(() => setToast(''), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition-colors hover:text-green-700"
        >
          <ArrowLeft size={18} />
          Back
        </button>

        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-600 text-white shadow-sm">
            <Package size={22} />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Track Order</h1>
            <p className="text-sm text-gray-500">
              Real-time delivery status and transport conditions
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left column */}
          <div className="space-y-6 lg:col-span-2">
            <OrderSummaryCard order={order} />
            <OrderTimeline events={order.timeline} />

            {/* Actions */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={handleConfirmDelivery}
                disabled={!inTransit || delivered}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-green-700 hover:shadow-md disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
              >
                <CheckCircle size={18} />
                {delivered ? 'Delivery Confirmed' : 'Confirm Delivery'}
              </button>
              <button
                onClick={handleInvoice}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:bg-gray-50"
              >
                <FileText size={18} />
                View Invoice
              </button>
              <button
                onClick={handleInvoice}
                className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:bg-gray-50"
              >
                <Download size={18} />
              </button>
            </div>

            {!inTransit && !delivered && (
              <p className="text-center text-xs text-gray-400">
                Delivery confirmation will be available once the order is in transit.
              </p>
            )}
          </div>

          {/* Right column */}
          <div className="space-y-6">
            <TransportReadoutCard readout={order.transport} />

            {/* Quick info */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-500">
                Order Details
              </h3>
              <dl className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-400">Order placed</dt>
                  <dd className="font-medium text-gray-700">
                    {new Date(order.placedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-400">Unit price</dt>
                  <dd className="font-medium text-gray-700">
                    ₹{order.agreedPricePerUnit}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-400">Quantity</dt>
                  <dd className="font-medium text-gray-700">
                    {order.quantity} {order.unit}
                  </dd>
                </div>
                <div className="flex justify-between border-t border-gray-50 pt-2.5">
                  <dt className="font-semibold text-gray-600">Total</dt>
                  <dd className="font-bold text-green-700">
                    ₹{order.totalPrice}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-gray-900 px-5 py-3 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
