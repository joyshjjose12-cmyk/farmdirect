import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Sprout } from 'lucide-react';
import FormField from '@/components/FormField';
import QualitySelector from '@/components/QualitySelector';
import PhotoUploadArea from '@/components/PhotoUploadArea';
import LocationInput from '@/components/LocationInput';
import { cropOptions, quantityUnits } from '@/data/mockData';
import type { CropType, ListingFormData, QuantityUnit } from '@/types';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

const cropTypeOptions: CropType[] = [
  'Vegetables',
  'Fruits',
  'Grains',
  'Leafy Greens',
  'Root Crops',
  'Berries',
  'Dairy',
  'Honey',
];

const emptyForm: ListingFormData = {
  cropName: '',
  cropType: 'Vegetables',
  quantity: 0,
  unit: 'kg',
  pricePerUnit: 0,
  qualityRating: 0,
  description: '',
  location: '',
  latitude: '',
  longitude: '',
  organic: false,
  harvestDate: '',
};

interface ListingRow {
  image_url: string | null;
  price_per_unit: number;
  unit: string;
  quantity_available: number;
  location_text: string | null;
  latitude: number | null;
  longitude: number | null;
  quality_rating: number | null;
  harvest_date: string | null;
  organic: boolean | null;
  description: string | null;
  crops: { name: string; crop_type: string } | null;
}

export default function CreateEditListingPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const { user, profile } = useAuth();

  const [form, setForm] = useState<ListingFormData>(emptyForm);
  const [loadingListing, setLoadingListing] = useState(isEdit);
  const [existingImage, setExistingImage] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof ListingFormData, string>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  // Edit mode: load the real listing so every field starts as it was saved.
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setLoadingListing(true);
      const { data, error } = await api.get<ListingRow>(`/listings/${id}`);
      if (cancelled) return;
      if (error || !data) {
        setSubmitError(error ?? 'Could not load this listing.');
        setLoadingListing(false);
        return;
      }
      setForm({
        cropName: data.crops?.name ?? '',
        cropType: (data.crops?.crop_type ?? 'Vegetables') as CropType,
        quantity: Number(data.quantity_available) || 0,
        unit: (data.unit || 'kg') as QuantityUnit,
        pricePerUnit: Number(data.price_per_unit) || 0,
        qualityRating: Number(data.quality_rating) || 0,
        description: data.description ?? '',
        location: data.location_text ?? '',
        latitude: data.latitude != null ? String(data.latitude) : '',
        longitude: data.longitude != null ? String(data.longitude) : '',
        organic: Boolean(data.organic),
        harvestDate: data.harvest_date ? String(data.harvest_date).slice(0, 10) : '',
      });
      setExistingImage(data.image_url);
      setLoadingListing(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const update = (field: keyof ListingFormData, value: string | number | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    const e: Partial<Record<keyof ListingFormData, string>> = {};
    if (!form.cropName) e.cropName = 'Please select a crop.';
    if (!form.quantity || form.quantity <= 0)
      e.quantity = 'Quantity must be greater than 0.';
    if (!form.pricePerUnit || form.pricePerUnit <= 0)
      e.pricePerUnit = 'Price must be greater than 0.';
    if (form.qualityRating === 0)
      e.qualityRating = 'Please select a quality rating.';
    if (!form.description.trim()) e.description = 'Description is required.';
    if (!form.location.trim()) e.location = 'Location name is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError(null);

    if (!user || !profile) {
      setSubmitError('You need to be logged in as a farmer to publish a listing.');
      return;
    }
    if (!validate()) return;

    setSubmitting(true);

    // Upload the photo (if one was chosen) to our own server first.
    let imageUrl: string | null = null;
    if (photoFile) {
      const fd = new FormData();
      fd.append('photo', photoFile);
      const up = await api.post<{ url: string }>('/uploads', fd);
      if (up.error || !up.data) {
        setSubmitting(false);
        setSubmitError(`Photo upload failed: ${up.error}`);
        return;
      }
      imageUrl = up.data.url;
    }

    // The server finds or creates the crop and saves the listing in one transaction.
    const payload = {
      cropName: form.cropName.trim(),
      cropType: form.cropType,
      pricePerUnit: form.pricePerUnit,
      unit: form.unit,
      quantity: form.quantity,
      location: form.location,
      latitude: form.latitude,
      longitude: form.longitude,
      qualityRating: form.qualityRating,
      description: form.description,
      organic: form.organic,
      harvestDate: form.harvestDate || null,
      imageUrl,
    };

    const { error } = isEdit
      ? await api.put(`/listings/${id}`, payload)
      : await api.post('/listings', payload);

    setSubmitting(false);

    if (error) {
      setSubmitError(error);
      return;
    }

    setSubmitted(true);
    setTimeout(() => {
      navigate('/dashboard');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition-colors hover:text-green-700"
        >
          <ArrowLeft size={18} />
          Back
        </button>

        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-600 text-white shadow-sm">
            <Sprout size={22} />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEdit ? 'Edit Listing' : 'Create New Listing'}
            </h1>
            <p className="text-sm text-gray-500">
              {isEdit
                ? 'Update your crop details and republish'
                : 'List your produce for buyers to discover and bid on'}
            </p>
          </div>
        </div>

        {submitError && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm font-medium text-red-600">{submitError}</p>
          </div>
        )}

        {submitted && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
            <Check size={20} className="text-green-600" />
            <p className="text-sm font-medium text-green-700">
              {isEdit ? 'Listing updated successfully!' : 'Listing published successfully!'}
              {' '}Redirecting to your dashboard…
            </p>
          </div>
        )}

        {loadingListing && (
          <p className="mb-6 rounded-xl bg-white px-4 py-6 text-center text-sm text-gray-400 shadow-sm">
            Loading your listing…
          </p>
        )}

        <form
          onSubmit={handleSubmit}
          hidden={loadingListing}
          className="space-y-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
        >
          {/* Crop name + type */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <FormField label="Crop name" required error={errors.cropName}>
              <select
                value={form.cropName}
                onChange={(e) => update('cropName', e.target.value)}
                className={`w-full rounded-xl border px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-1 ${
                  errors.cropName
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-200 focus:border-green-500 focus:ring-green-500'
                }`}
              >
                <option value="">Select a crop…</option>
                {form.cropName && !cropOptions.some((o) => o.value === form.cropName) && (
                  <option value={form.cropName}>{form.cropName}</option>
                )}
                {cropOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Crop type" required>
              <select
                value={form.cropType}
                onChange={(e) => update('cropType', e.target.value as CropType)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-800 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              >
                {cropTypeOptions.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          {/* Quantity + unit + price */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <FormField label="Quantity" required error={errors.quantity}>
              <input
                type="number"
                min={0}
                step="any"
                inputMode="decimal"
                value={form.quantity || ''}
                onChange={(e) => update('quantity', Number(e.target.value))}
                placeholder="0"
                className={`w-full rounded-xl border px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 ${
                  errors.quantity
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-200 focus:border-green-500 focus:ring-green-500'
                }`}
              />
            </FormField>

            <FormField label="Unit" required>
              <select
                value={form.unit}
                onChange={(e) => update('unit', e.target.value as QuantityUnit)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-800 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              >
                {quantityUnits.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField
              label="Price per unit (₹)"
              required
              error={errors.pricePerUnit}
            >
              <input
                type="number"
                step="0.01"
                min={0}
                value={form.pricePerUnit || ''}
                onChange={(e) => update('pricePerUnit', Number(e.target.value))}
                placeholder="0.00"
                className={`w-full rounded-xl border px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 ${
                  errors.pricePerUnit
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-200 focus:border-green-500 focus:ring-green-500'
                }`}
              />
            </FormField>
          </div>

          {/* Quality rating */}
          <FormField
            label="Quality rating"
            required
            error={errors.qualityRating}
            hint="Rate the quality of your harvest from 1 to 5 stars"
          >
            <QualitySelector
              value={form.qualityRating}
              onChange={(v) => update('qualityRating', v)}
            />
          </FormField>

          {/* Harvest date */}
          <FormField
            label="Harvest date"
            hint="When was this produce harvested? (optional)"
          >
            <input
              type="date"
              max={new Date().toISOString().split('T')[0]}
              value={form.harvestDate}
              onChange={(e) => update('harvestDate', e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-800 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </FormField>

          {/* Photo upload */}
          <FormField
            label="Crop photo"
            hint="A clear photo helps buyers evaluate your produce"
          >
            <PhotoUploadArea
              key={existingImage ?? 'new'}
              onFileChange={setPhotoFile}
              previewImage={existingImage ?? undefined}
            />
          </FormField>

          {/* Description */}
          <FormField
            label="Description"
            required
            error={errors.description}
            hint="Describe growing conditions, taste, and any special handling"
          >
            <textarea
              rows={4}
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              placeholder="Tell buyers about your produce…"
              className={`w-full rounded-xl border px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 ${
                errors.description
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-200 focus:border-green-500 focus:ring-green-500'
              }`}
            />
          </FormField>

          {/* Location */}
          <FormField
            label="Farm location"
            required
            error={errors.location}
            hint="Enter your farm address or coordinates"
          >
            <LocationInput
              latitude={form.latitude}
              longitude={form.longitude}
              locationName={form.location}
              onChange={(field, value) => update(field === 'locationName' ? 'location' : field, value)}
            />
          </FormField>

          {/* Organic toggle */}
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={form.organic}
              onChange={(e) => update('organic', e.target.checked)}
              className="h-5 w-5 rounded accent-green-600"
            />
            <span className="text-sm font-medium text-gray-700">
              Certified organic produce
            </span>
          </label>

          {/* Actions */}
          <div className="flex flex-col-reverse gap-3 border-t border-gray-50 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitted || submitting}
              className="rounded-xl bg-green-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-green-700 hover:shadow-md disabled:opacity-70"
            >
              {submitting
                ? 'Publishing…'
                : isEdit
                ? 'Update Listing'
                : 'Publish Listing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}