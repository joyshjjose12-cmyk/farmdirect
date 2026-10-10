import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bike,
  CheckCircle2,
  ClipboardList,
  Leaf,
  Loader2,
  MapPin,
  Navigation,
  PackageCheck,
  Phone,
  Route,
  Truck,
  Undo2,
} from 'lucide-react';
import StatCard from '@/components/StatCard';
import DeliveryMap from '@/components/DeliveryMap';
import DeliveryStepper from '@/components/DeliveryStepper';
import { useAuth } from '@/context/AuthContext';
import { useDeliveryOrders } from '@/hooks/useDeliveryOrders';
import { useShareLocation } from '@/hooks/useCourierLocation';
import {
  STAGE_LABEL,
  advanceDelivery,
  claimDelivery,
  formatDateTime,
  googleMapsDirections,
  releaseDelivery,
} from '@/lib/delivery';
import type { DeliveryOrder } from '@/types';

type Tab = 'available' | 'mine' | 'done' | 'all';

const stageStyle: Record<DeliveryOrder['stage'], string> = {
  bid_accepted: 'bg-amber-50 text-amber-700 border-amber-200',
  harvest_scheduled: 'bg-blue-50 text-blue-700 border-blue-200',
  out_for_delivery: 'bg-purple-50 text-purple-700 border-purple-200',
  delivered: 'bg-green-50 text-green-700 border-green-200',
};

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;

function JobCard({
  order,
  selected,
  mine,
  onSelect,
}: {
  order: DeliveryOrder;
  selected: boolean;
  mine: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`w-full rounded-2xl border bg-white p-4 text-left shadow-sm transition-all hover:shadow-md ${
        selected ? 'border-green-500 ring-2 ring-green-100' : 'border-gray-100'
      }`}
    >
      <div className="flex items-start gap-3">
        {order.image ? (
          <img src={order.image} alt={order.cropName} className="h-12 w-12 flex-shrink-0 rounded-xl object-cover" />
        ) : (
          <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-300">
            <Leaf size={20} />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate font-bold text-gray-900">
              {order.cropName}{' '}
              <span className="text-sm font-medium text-gray-400">
                · {order.quantity} {order.unit}
              </span>
            </p>
            <span
              className={`flex-shrink-0 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-semibold ${stageStyle[order.stage]}`}
            >
              {order.stage === 'bid_accepted' ? 'New' : order.stage === 'delivered' ? 'Delivered' : mine ? 'Yours' : 'Taken'}
            </span>
          </div>
          <p className="mt-1 flex items-center gap-1 truncate text-xs text-gray-500">
            <span aria-hidden>🌾</span> {order.pickupText || order.farmName || order.farmerName}
          </p>
          <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-gray-500">
            <span aria-hidden>🏠</span>{' '}
            {order.address ? order.address : <span className="text-amber-600">Buyer hasn't added an address yet</span>}
          </p>
        </div>
      </div>
    </button>
  );
}

function Detail({
  order,
  mine,
  onAction,
}: {
  order: DeliveryOrder;
  mine: boolean;
  onAction: (kind: 'claim' | 'release' | 'pickup' | 'deliver', order: DeliveryOrder) => Promise<void>;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmDeliver, setConfirmDeliver] = useState(false);
  const [route, setRoute] = useState<{ km: number; minutes: number | null; estimated: boolean } | null>(null);

  useEffect(() => {
    setRoute(null);
    setConfirmDeliver(false);
  }, [order.id]);

  const pickup =
    order.pickupLat != null && order.pickupLng != null
      ? { lat: order.pickupLat, lng: order.pickupLng, label: order.farmName || order.farmerName }
      : null;
  const drop =
    order.dropLat != null && order.dropLng != null
      ? { lat: order.dropLat, lng: order.dropLng, label: order.buyerName }
      : null;

  const run = async (kind: 'claim' | 'release' | 'pickup' | 'deliver') => {
    setBusy(kind);
    await onAction(kind, order);
    setBusy(null);
    setConfirmDeliver(false);
  };

  const unclaimed = order.stage === 'bid_accepted' && !order.courierId;
  const sharing = useShareLocation(order.id, mine && order.stage === 'out_for_delivery');
  const spinner = (k: string) => busy === k && <Loader2 size={14} className="animate-spin" />;

  return (
    <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            {order.cropName} · {order.quantity} {order.unit}
          </h2>
          <p className="text-sm text-gray-500">
            Order value {inr(order.total)} · accepted {formatDateTime(order.placedAt)}
          </p>
        </div>
        <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${stageStyle[order.stage]}`}>
          {STAGE_LABEL[order.stage]}
        </span>
      </div>

      <DeliveryStepper stage={order.stage} />

      <DeliveryMap
        key={order.id}
        pickup={pickup}
        drop={drop}
        showMe={mine && order.stage !== 'delivered'}
        heightClass="h-72 sm:h-80"
        onRoute={setRoute}
      />

      {mine && order.stage === 'out_for_delivery' && (
        <p
          className={`rounded-xl px-3.5 py-2 text-xs font-medium ${
            sharing === 'denied' ? 'bg-red-50 text-red-700' : 'bg-purple-50 text-purple-700'
          }`}
        >
          {sharing === 'denied'
            ? 'Location is blocked, so the buyer and farmer cannot see you on the map. Allow it in your browser settings.'
            : 'Sharing your live location with the buyer and farmer while you deliver.'}
        </p>
      )}

      {route && (
        <p className="flex items-center gap-2 rounded-xl bg-green-50 px-3.5 py-2 text-sm font-medium text-green-800">
          <Route size={16} />
          {route.km.toFixed(1)} km{route.estimated ? ' (straight line)' : ''}
          {route.minutes != null && ` · about ${route.minutes} min drive`}
          <span className="font-normal text-green-700">(farm → buyer)</span>
        </p>
      )}

      <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
        <div className="rounded-xl bg-gray-50 p-3.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">🌾 Pickup · farm</p>
          <p className="mt-1 font-semibold text-gray-900">{order.farmName || order.farmerName}</p>
          {order.farmName && <p className="text-gray-500">{order.farmerName}</p>}
          <p className="mt-1 text-gray-700">{order.pickupText || 'No address text saved'}</p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {order.farmerPhone && (
              <a
                href={`tel:${order.farmerPhone}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                <Phone size={12} /> {order.farmerPhone}
              </a>
            )}
            {pickup && (
              <a
                href={googleMapsDirections(null, pickup)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                <Navigation size={12} /> Navigate
              </a>
            )}
          </div>
        </div>

        <div className="rounded-xl bg-gray-50 p-3.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">🏠 Drop-off · buyer</p>
          <p className="mt-1 font-semibold text-gray-900">{order.buyerName}</p>
          <p className="mt-1 text-gray-700">
            {order.address || <span className="text-amber-700">Waiting for the buyer to add an address.</span>}
          </p>
          {order.notes && <p className="mt-1 text-xs text-gray-500">Note: {order.notes}</p>}
          <div className="mt-2.5 flex flex-wrap gap-2">
            {order.buyerPhone && (
              <a
                href={`tel:${order.buyerPhone}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                <Phone size={12} /> {order.buyerPhone}
              </a>
            )}
            {drop && (
              <a
                href={googleMapsDirections(null, drop)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                <Navigation size={12} /> Navigate
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="border-t border-gray-50 pt-4">
        {unclaimed && (
          <>
            <button
              onClick={() => run('claim')}
              disabled={!order.address || busy !== null}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
            >
              {spinner('claim') || <Truck size={16} />} Accept this delivery
            </button>
            {!order.address && (
              <p className="mt-2 text-center text-xs text-amber-700">
                You can take this once the buyer adds a delivery address.
              </p>
            )}
          </>
        )}

        {mine && order.stage === 'harvest_scheduled' && (
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              onClick={() => run('pickup')}
              disabled={busy !== null}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-green-700 disabled:opacity-60"
            >
              {spinner('pickup') || <PackageCheck size={16} />} Picked up from farm
            </button>
            <button
              onClick={() => run('release')}
              disabled={busy !== null}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-60"
            >
              {spinner('release') || <Undo2 size={16} />} Give back
            </button>
          </div>
        )}

        {mine && order.stage === 'out_for_delivery' &&
          (confirmDeliver ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-green-50 px-4 py-3">
              <p className="text-sm font-medium text-green-800">Handed over to {order.buyerName}?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmDeliver(false)}
                  disabled={busy !== null}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600"
                >
                  Not yet
                </button>
                <button
                  onClick={() => run('deliver')}
                  disabled={busy !== null}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3.5 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                >
                  {spinner('deliver')} Yes, delivered
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDeliver(true)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-green-700"
            >
              <CheckCircle2 size={16} /> Mark as delivered
            </button>
          ))}

        {order.stage === 'delivered' && (
          <p className="flex items-center justify-center gap-2 text-sm font-medium text-green-700">
            <CheckCircle2 size={16} /> Delivered {formatDateTime(order.deliveredAt)}
          </p>
        )}

        {!unclaimed && !mine && order.stage !== 'delivered' && (
          <p className="text-center text-sm text-gray-500">
            Being handled by {order.courierName || 'another delivery partner'}.
          </p>
        )}
      </div>
    </div>
  );
}

export default function DeliveryDashboardPage() {
  const { user, profile } = useAuth();
  const { orders, loading, error, reload } = useDeliveryOrders('delivery');
  const [tab, setTab] = useState<Tab>('available');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const uid = user?.id;
  const groups = useMemo(
    () => ({
      available: orders.filter((o) => o.stage === 'bid_accepted' && !o.courierId),
      mine: orders.filter((o) => o.courierId === uid && o.stage !== 'delivered'),
      done: orders.filter((o) => o.courierId === uid && o.stage === 'delivered'),
      all: orders,
    }),
    [orders, uid]
  );
  const visible = groups[tab];
  const selected = visible.find((o) => o.id === selectedId) ?? visible[0] ?? null;

  const flash = (text: string, ok: boolean) => {
    setToast({ text, ok });
    setTimeout(() => setToast(null), 3500);
  };

  async function handleAction(kind: 'claim' | 'release' | 'pickup' | 'deliver', order: DeliveryOrder) {
    const res =
      kind === 'claim'
        ? await claimDelivery(order.id)
        : kind === 'release'
          ? await releaseDelivery(order.id)
          : kind === 'pickup'
            ? await advanceDelivery(order.id, 'out_for_delivery')
            : await advanceDelivery(order.id, 'delivered');
    if (res.error) {
      flash(res.error, false);
      await reload();
      return;
    }
    await reload();
    if (kind === 'claim') {
      setTab('mine');
      setSelectedId(order.id);
      flash(`You took the ${order.cropName} delivery.`, true);
    } else if (kind === 'release') {
      setTab('available');
      flash('Delivery released back to the job board.', true);
    } else if (kind === 'pickup') {
      flash('Marked as picked up. Safe travels!', true);
    } else {
      setTab('done');
      setSelectedId(order.id);
      flash('Delivered. The farmer and buyer can see it now.', true);
    }
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'available', label: 'Available' },
    { key: 'mine', label: 'My deliveries' },
    { key: 'done', label: 'Completed' },
    { key: 'all', label: 'All orders' },
  ];

  const firstName = profile?.name?.split(' ')[0] ?? 'there';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-600 text-white shadow-sm">
            <Bike size={22} />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Delivery Dashboard</h1>
            <p className="text-sm text-gray-500">
              Hi {firstName}. Every bid a farmer accepts shows up here.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Couldn't load deliveries: {error}
          </div>
        )}

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label="Available"
            value={groups.available.length}
            sublabel="Waiting for a partner"
            icon={<ClipboardList size={20} />}
            accent="amber"
          />
          <StatCard
            label="In progress"
            value={groups.mine.length}
            sublabel="Assigned to you"
            icon={<Truck size={20} />}
            accent="blue"
          />
          <StatCard
            label="Delivered"
            value={groups.done.length}
            sublabel="Completed by you"
            icon={<CheckCircle2 size={20} />}
            accent="green"
          />
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => {
                setTab(t.key);
                setSelectedId(null);
              }}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                tab === t.key
                  ? 'border-green-600 bg-green-600 text-white'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              {t.label}
              <span className={`ml-1.5 text-xs ${tab === t.key ? 'text-green-100' : 'text-gray-400'}`}>
                {groups[t.key].length}
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <p className="py-16 text-center text-sm text-gray-400">Loading deliveries…</p>
        ) : visible.length === 0 ? (
          <div className="rounded-2xl border border-gray-100 bg-white py-16 text-center shadow-sm">
            <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 text-green-500">
              <MapPin size={26} />
            </span>
            <p className="font-semibold text-gray-900">Nothing here right now</p>
            <p className="mt-1 text-sm text-gray-500">
              {tab === 'available'
                ? 'New jobs appear as soon as a farmer accepts a bid.'
                : 'Check another tab.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
            <div className="space-y-3 lg:col-span-2">
              {visible.map((o) => (
                <JobCard
                  key={o.id}
                  order={o}
                  mine={o.courierId === uid}
                  selected={selected?.id === o.id}
                  onSelect={() => {
                    setSelectedId(o.id);
                    // on phones the detail sits below the list
                    if (window.innerWidth < 1024)
                      setTimeout(() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
                  }}
                />
              ))}
            </div>
            <div ref={panelRef} className="scroll-mt-20 lg:col-span-3">
              {selected && <Detail order={selected} mine={selected.courierId === uid} onAction={handleAction} />}
            </div>
          </div>
        )}
      </div>

      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 z-50 max-w-[90%] -translate-x-1/2 rounded-xl px-5 py-3 text-sm font-medium text-white shadow-lg ${
            toast.ok ? 'bg-gray-900' : 'bg-red-600'
          }`}
        >
          {toast.text}
        </div>
      )}
    </div>
  );
}
