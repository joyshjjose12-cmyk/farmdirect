import { useState } from 'react';
import { X, SlidersHorizontal } from 'lucide-react';
import type { CropType, FilterState } from '@/types';

interface FilterModalProps {
  open: boolean;
  filters: FilterState;
  onClose: () => void;
  onApply: (filters: FilterState) => void;
}

// Defaults: no practical limit on distance or price, so every listing shows up.
export const MAX_DISTANCE_KM = 1000;
export const defaultFilters: FilterState = {
  cropTypes: [],
  maxDistanceKm: MAX_DISTANCE_KM,
  minPrice: 0,
  maxPrice: 100000,
  organicOnly: false,
};

const allCropTypes: CropType[] = [
  'Vegetables',
  'Fruits',
  'Grains',
  'Leafy Greens',
  'Root Crops',
  'Berries',
  'Dairy',
  'Honey',
];

export default function FilterModal({
  open,
  filters,
  onClose,
  onApply,
}: FilterModalProps) {
  const [draft, setDraft] = useState<FilterState>(filters);

  if (!open) return null;

  const toggleCrop = (type: CropType) => {
    setDraft((d) => ({
      ...d,
      cropTypes: d.cropTypes.includes(type)
        ? d.cropTypes.filter((t) => t !== type)
        : [...d.cropTypes, type],
    }));
  };

  const reset = () => setDraft(defaultFilters);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-lg rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={18} className="text-green-600" />
            <h2 className="text-lg font-bold text-gray-900">Filter Listings</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close filters"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Crop Type
            </label>
            <div className="flex flex-wrap gap-2">
              {allCropTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => toggleCrop(type)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                    draft.cropTypes.includes(type)
                      ? 'border-green-600 bg-green-600 text-white'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Max Distance: {draft.maxDistanceKm >= MAX_DISTANCE_KM ? 'Any' : `${draft.maxDistanceKm} km`}
            </label>
            <input
              type="range"
              min={1}
              max={MAX_DISTANCE_KM}
              value={draft.maxDistanceKm}
              onChange={(e) =>
                setDraft({ ...draft, maxDistanceKm: Number(e.target.value) })
              }
              className="w-full accent-green-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Min Price ($)
              </label>
              <input
                type="number"
                min={0}
                value={draft.minPrice}
                onChange={(e) =>
                  setDraft({ ...draft, minPrice: Number(e.target.value) })
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Max Price (₹)
              </label>
              <input
                type="number"
                min={0}
                value={draft.maxPrice}
                onChange={(e) =>
                  setDraft({ ...draft, maxPrice: Number(e.target.value) })
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={draft.organicOnly}
              onChange={(e) =>
                setDraft({ ...draft, organicOnly: e.target.checked })
              }
              className="h-5 w-5 rounded accent-green-600"
            />
            <span className="text-sm font-medium text-gray-700">
              Organic only
            </span>
          </label>
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            onClick={reset}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100"
          >
            Reset
          </button>
          <button
            onClick={() => {
              onApply(draft);
              onClose();
            }}
            className="rounded-lg bg-green-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-green-700"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}