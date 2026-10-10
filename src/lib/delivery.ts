import { api } from '@/lib/api';
import type { DeliveryStage } from '@/types';

type Result = { error: string | null };

async function call(method: 'post' | 'put', path: string, body?: unknown): Promise<Result> {
  const { error } = await api[method](path, body);
  return { error };
}

export const STAGE_INDEX: Record<DeliveryStage, number> = {
  bid_accepted: 0,
  harvest_scheduled: 1,
  out_for_delivery: 2,
  delivered: 3,
};

export const STAGE_LABEL: Record<DeliveryStage, string> = {
  bid_accepted: 'Waiting for a delivery partner',
  harvest_scheduled: 'Partner assigned, pickup pending',
  out_for_delivery: 'On the way to the buyer',
  delivered: 'Delivered',
};

/** Buyer saves or edits the delivery address of an accepted order. */
export function saveDeliveryAddress(params: {
  orderId: string;
  address: string;
  lat: number | null;
  lng: number | null;
  phone: string;
  notes: string;
}): Promise<Result> {
  return call('put', `/orders/${params.orderId}/address`, {
    address: params.address,
    lat: params.lat,
    lng: params.lng,
    phone: params.phone,
    notes: params.notes,
  });
}

/** Delivery partner takes a job. */
export const claimDelivery = (orderId: string) => call('post', `/orders/${orderId}/claim`);

/** Delivery partner gives a job back (before pickup). */
export const releaseDelivery = (orderId: string) => call('post', `/orders/${orderId}/release`);

/** Delivery partner: picked up from the farm / delivered to the buyer. */
export const advanceDelivery = (orderId: string, stage: 'out_for_delivery' | 'delivered') =>
  call('post', `/orders/${orderId}/advance`, { stage });

/* ---------- small helpers ---------- */

export function haversineKm(a: readonly number[], b: readonly number[]): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function googleMapsDirections(
  from: { lat: number; lng: number } | null,
  to: { lat: number; lng: number }
): string {
  const dest = `${to.lat},${to.lng}`;
  const origin = from ? `&origin=${from.lat},${from.lng}` : '';
  return `https://www.google.com/maps/dir/?api=1${origin}&destination=${dest}&travelmode=driving`;
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** Delivery partner pushes their current position (stored in transport_logs). */
export const logCourierLocation = (orderId: string, lat: number, lng: number) =>
  call('post', `/orders/${orderId}/location`, { lat, lng });
