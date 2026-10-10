import { useState, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import LocationInput from '@/components/LocationInput';
import { saveDeliveryAddress } from '@/lib/delivery';
import type { DeliveryOrder } from '@/types';

interface Props {
  order: DeliveryOrder;
  onSaved: () => void;
  onCancel?: () => void;
}

const field =
  'w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500';

/** Buyer enters where the order should be delivered. */
export default function DeliveryAddressForm({ order, onSaved, onCancel }: Props) {
  const editing = Boolean(order.address);
  const [details, setDetails] = useState(editing ? order.address : '');
  const [place, setPlace] = useState('');
  const [lat, setLat] = useState(order.dropLat != null ? String(order.dropLat) : '');
  const [lng, setLng] = useState(order.dropLng != null ? String(order.dropLng) : '');
  const [phone, setPhone] = useState(order.buyerPhone);
  const [notes, setNotes] = useState(order.notes);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const onLocation = (f: 'latitude' | 'longitude' | 'locationName', v: string) => {
    if (f === 'latitude') setLat(v);
    else if (f === 'longitude') setLng(v);
    else setPlace(v);
  };

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    const la = parseFloat(lat);
    const ln = parseFloat(lng);
    if (!details.trim()) return setError('Enter your door / street details.');
    if (isNaN(la) || isNaN(ln) || la < -90 || la > 90 || ln < -180 || ln > 180)
      return setError('Pick your area from the suggestions or tap "Use my location" so the delivery partner gets a map pin.');
    if (!/^[+\d][\d\s-]{7,}$/.test(phone.trim()))
      return setError('Enter a phone number the delivery partner can call.');

    // door/street details first, then the area picked on the map
    const full = place.trim() && !details.includes(place.trim()) ? `${details.trim()}, ${place.trim()}` : details.trim();

    setBusy(true);
    const { error } = await saveDeliveryAddress({
      orderId: order.id,
      address: full,
      lat: la,
      lng: ln,
      phone: phone.trim(),
      notes,
    });
    setBusy(false);
    if (error) return setError(error);
    onSaved();
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border border-green-100 bg-green-50/50 p-4">
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-gray-700">
          House / street / landmark
        </label>
        <textarea
          rows={2}
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="e.g. 12, Gandhi Street, near the temple"
          className={field}
        />
      </div>

      <LocationInput latitude={lat} longitude={lng} locationName={place} onChange={onLocation} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-700">Phone</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 98765 43210"
            className={field}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-700">
            Note for delivery <span className="font-normal text-gray-400">(optional)</span>
          </label>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Call before arriving"
            className={field}
          />
        </div>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <div className="flex items-center justify-end gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-700 disabled:opacity-60"
        >
          {busy && <Loader2 size={14} className="animate-spin" />}
          {editing ? 'Update address' : 'Save address'}
        </button>
      </div>
    </form>
  );
}
