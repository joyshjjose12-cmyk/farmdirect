import { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Leaf,
  Map as MapIcon,
  MapPin,
  PackageCheck,
  Phone,
  Truck,
  UserRound,
} from 'lucide-react';
import DeliveryMap from '@/components/DeliveryMap';
import DeliveryStepper from '@/components/DeliveryStepper';
import { useDeliveryOrders } from '@/hooks/useDeliveryOrders';
import { formatDateTime } from '@/lib/delivery';
import { useCourierPosition } from '@/hooks/useCourierLocation';
import type { DeliveryOrder } from '@/types';

type Tab = 'active' | 'delivered';

function ReachedBadge({ order }: { order: DeliveryOrder }) {
  if (order.stage === 'delivered')
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
        <CheckCircle2 size={12} /> Reached buyer
      </span>
    );
  if (order.stage === 'out_for_delivery')
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
        <Truck size={12} /> On the way
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
      <Clock size={12} /> Not delivered yet
    </span>
  );
}

function DeliveryRow({ order }: { order: DeliveryOrder }) {
  const [showMap, setShowMap] = useState(false);
  const courierPos = useCourierPosition(order.id, showMap && order.stage === 'out_for_delivery');
  const pickup =
    order.pickupLat != null && order.pickupLng != null
      ? { lat: order.pickupLat, lng: order.pickupLng, label: order.farmName || 'Your farm' }
      : null;
  const drop =
    order.dropLat != null && order.dropLng != null
      ? { lat: order.dropLat, lng: order.dropLng, label: order.buyerName }
      : null;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-4">
        {order.image ? (
          <img src={order.image} alt={order.cropName} className="h-14 w-14 flex-shrink-0 rounded-xl object-cover" />
        ) : (
          <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-300">
            <Leaf size={22} />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="font-bold text-gray-900">{order.cropName}</h3>
              <p className="text-sm text-gray-500">
                {order.quantity} {order.unit} · ₹{order.total.toLocaleString('en-IN')} · for{' '}
                <span className="font-medium text-gray-700">{order.buyerName}</span>
              </p>
            </div>
            <ReachedBadge order={order} />
          </div>
        </div>
      </div>

      <div className="mt-4">
        <DeliveryStepper stage={order.stage} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
        <div className="rounded-xl bg-gray-50 p-3.5">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
            <MapPin size={12} /> Buyer's address
          </p>
          {order.address ? (
            <>
              <p className="mt-1 text-gray-800">{order.address}</p>
              {order.buyerPhone && (
                <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
                  <Phone size={12} /> {order.buyerPhone}
                </p>
              )}
              {order.notes && <p className="mt-1 text-xs text-gray-500">Note: {order.notes}</p>}
            </>
          ) : (
            <p className="mt-1 text-amber-700">The buyer hasn't added an address yet.</p>
          )}
        </div>

        <div className="rounded-xl bg-gray-50 p-3.5">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
            <UserRound size={12} /> Delivery partner
          </p>
          {order.courierId ? (
            <>
              <p className="mt-1 font-medium text-gray-800">{order.courierName || 'Assigned'}</p>
              {order.courierPhone && (
                <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
                  <Phone size={12} /> {order.courierPhone}
                </p>
              )}
              {order.pickedUpAt && (
                <p className="mt-1 text-xs text-gray-500">Picked up {formatDateTime(order.pickedUpAt)}</p>
              )}
            </>
          ) : (
            <p className="mt-1 text-gray-500">Not assigned yet.</p>
          )}
          {order.deliveredAt && (
            <p className="mt-1 text-xs font-medium text-green-700">
              Delivered {formatDateTime(order.deliveredAt)}
            </p>
          )}
        </div>
      </div>

      {(pickup || drop) && (
        <div className="mt-3">
          <button
            onClick={() => setShowMap((v) => !v)}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-green-700 hover:underline"
          >
            <MapIcon size={14} /> {showMap ? 'Hide map' : 'Show route map'}
          </button>
          {showMap && (
            <div className="mt-2">
              <DeliveryMap pickup={pickup} drop={drop} courier={courierPos} heightClass="h-64" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Farmer dashboard section: every accepted order, its delivery status, and whether it reached the buyer. */
export default function FarmerDeliveries() {
  const { orders, loading, error } = useDeliveryOrders('farmer');
  const [tab, setTab] = useState<Tab>('active');

  const active = useMemo(() => orders.filter((o) => o.stage !== 'delivered'), [orders]);
  const delivered = useMemo(() => orders.filter((o) => o.stage === 'delivered'), [orders]);
  const visible = tab === 'active' ? active : delivered;

  return (
    <div className="mt-6 rounded-2xl border border-gray-100 bg-gray-50/60 p-4 sm:p-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <PackageCheck size={20} className="text-green-600" />
          <h2 className="text-lg font-bold text-gray-900">Deliveries</h2>
        </div>
        <div className="flex gap-2">
          {(
            [
              ['active', 'In progress', active.length],
              ['delivered', 'Delivered', delivered.length],
            ] as const
          ).map(([key, label, n]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                tab === key
                  ? 'border-green-600 bg-green-600 text-white'
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {label}
              <span className={`ml-1.5 text-xs ${tab === key ? 'text-green-100' : 'text-gray-400'}`}>{n}</span>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Couldn't load deliveries: {error}
        </div>
      )}

      {loading ? (
        <p className="py-8 text-center text-sm text-gray-400">Loading deliveries…</p>
      ) : visible.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400">
          {tab === 'active'
            ? 'No deliveries in progress. Accept a bid and it will show up here.'
            : 'Nothing delivered yet.'}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {visible.map((o) => (
            <DeliveryRow key={o.id} order={o} />
          ))}
        </div>
      )}
    </div>
  );
}
