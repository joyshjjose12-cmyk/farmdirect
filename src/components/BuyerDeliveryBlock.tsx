import { useState } from 'react';
import { CheckCircle2, MapPin, Map as MapIcon, Pencil, Phone, Truck, UserRound } from 'lucide-react';
import DeliveryAddressForm from '@/components/DeliveryAddressForm';
import DeliveryMap from '@/components/DeliveryMap';
import DeliveryStepper from '@/components/DeliveryStepper';
import { formatDateTime } from '@/lib/delivery';
import { useCourierPosition } from '@/hooks/useCourierLocation';
import type { DeliveryOrder } from '@/types';

/** Delivery section of an accepted bid, on the buyer's dashboard. */
export default function BuyerDeliveryBlock({
  order,
  onChanged,
}: {
  order: DeliveryOrder;
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const courierPos = useCourierPosition(order.id, showMap && order.stage === 'out_for_delivery');
  const canEdit = order.stage === 'bid_accepted' || order.stage === 'harvest_scheduled';
  const hasAddress = Boolean(order.address);
  const pickup =
    order.pickupLat != null && order.pickupLng != null
      ? { lat: order.pickupLat, lng: order.pickupLng, label: order.farmName || order.farmerName }
      : null;
  const drop =
    order.dropLat != null && order.dropLng != null
      ? { lat: order.dropLat, lng: order.dropLng, label: 'Your address' }
      : null;

  if (!hasAddress || editing) {
    return (
      <div className="mt-4 space-y-3 border-t border-gray-50 pt-4">
        {!hasAddress && (
          <p className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            <MapPin size={16} className="mt-0.5 flex-shrink-0" />
            <span>
              <strong>Where should we deliver this?</strong> Add your address so a delivery partner can pick it up.
            </span>
          </p>
        )}
        <DeliveryAddressForm
          order={order}
          onSaved={() => {
            setEditing(false);
            onChanged();
          }}
          onCancel={hasAddress ? () => setEditing(false) : undefined}
        />
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-4 border-t border-gray-50 pt-4">
      <DeliveryStepper stage={order.stage} />

      <div className="rounded-xl bg-gray-50 p-3.5 text-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
              <MapPin size={12} /> Delivering to
            </p>
            <p className="mt-1 text-gray-800">{order.address}</p>
            {order.buyerPhone && (
              <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
                <Phone size={12} /> {order.buyerPhone}
              </p>
            )}
          </div>
          {canEdit && (
            <button
              onClick={() => setEditing(true)}
              className="flex flex-shrink-0 items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
            >
              <Pencil size={12} /> Edit
            </button>
          )}
        </div>
      </div>

      <div className="flex items-start gap-2 text-sm text-gray-600">
        {order.stage === 'delivered' ? (
          <>
            <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0 text-green-600" />
            <span>
              Delivered{order.deliveredAt && ` on ${formatDateTime(order.deliveredAt)}`}
              {order.courierName && ` by ${order.courierName}`}.
            </span>
          </>
        ) : order.courierId ? (
          <>
            <UserRound size={16} className="mt-0.5 flex-shrink-0 text-green-600" />
            <span>
              <strong className="text-gray-800">{order.courierName || 'Your delivery partner'}</strong>{' '}
              {order.stage === 'out_for_delivery' ? 'is on the way' : 'will pick this up from the farm'}
              {order.courierPhone && <> · {order.courierPhone}</>}
            </span>
          </>
        ) : (
          <>
            <Truck size={16} className="mt-0.5 flex-shrink-0 text-amber-500" />
            <span>Waiting for a delivery partner to accept this order.</span>
          </>
        )}
      </div>

      {(pickup || drop) && (
        <div>
          <button
            onClick={() => setShowMap((v) => !v)}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-green-700 hover:underline"
          >
            <MapIcon size={14} /> {showMap ? 'Hide map' : 'Show route map'}
          </button>
          {showMap && (
            <div className="mt-2">
              <DeliveryMap pickup={pickup} drop={drop} courier={courierPos} heightClass="h-64" />
              {courierPos && (
                <p className="mt-1 text-xs text-gray-400">
                  Delivery partner last seen {formatDateTime(courierPos.at)}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
