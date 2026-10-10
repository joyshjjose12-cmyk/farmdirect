import { useEffect, useRef, useState } from 'react';
import { MapPin, Crosshair, Loader2 } from 'lucide-react';

interface Suggestion {
  label: string;
  lat: number;
  lng: number;
}

// Photon = free autocomplete search on OpenStreetMap data (no API key needed)
function buildLabel(p: Record<string, string | undefined>) {
  const parts = [
    p.name,
    p.district || p.city || p.county,
    p.state,
    p.country,
  ].filter(Boolean) as string[];
  return parts.filter((v, i) => parts.indexOf(v) === i).join(', ');
}

interface LocationInputProps {
  latitude: string;
  longitude: string;
  locationName: string;
  onChange: (field: 'latitude' | 'longitude' | 'locationName', value: string) => void;
}

export default function LocationInput({
  latitude,
  longitude,
  locationName,
  onChange,
}: LocationInputProps) {
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const skipNextSearch = useRef(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Search for places as the user types (debounced)
  useEffect(() => {
    if (skipNextSearch.current) {
      skipNextSearch.current = false;
      return;
    }
    const q = locationName.trim();
    if (q.length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        // lat/lon gently bias results toward India; remove them to search worldwide equally
        const url =
          `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}` +
          `&limit=6&lang=en&lat=22.5&lon=79&location_bias_scale=0.3`;
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error('Search failed');
        const data = await res.json();
        const items: Suggestion[] = (data.features ?? []).map(
          (f: { properties: Record<string, string | undefined>; geometry: { coordinates: [number, number] } }) => ({
            label: buildLabel(f.properties),
            lat: f.geometry.coordinates[1],
            lng: f.geometry.coordinates[0],
          })
        );
        setSuggestions(items);
        setActive(-1);
        setOpen(items.length > 0);
      } catch (e) {
        if ((e as Error).name !== 'AbortError') setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [locationName]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const pickSuggestion = (sug: Suggestion) => {
    skipNextSearch.current = true;
    onChange('locationName', sug.label);
    onChange('latitude', sug.lat.toFixed(6));
    onChange('longitude', sug.lng.toFixed(6));
    setOpen(false);
    setSuggestions([]);
    setError('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => (i + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === 'Enter' && active >= 0) {
      e.preventDefault();
      pickSuggestion(suggestions[active]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const useMyLocation = () => {
    setError('');

    if (!('geolocation' in navigator)) {
      setError('Your browser does not support location access.');
      return;
    }

    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        onChange('latitude', lat.toFixed(6));
        onChange('longitude', lng.toFixed(6));

        // Turn the coordinates into a readable place name (OpenStreetMap Nominatim)
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=14&accept-language=en&lat=${lat}&lon=${lng}`
          );
          if (!res.ok) throw new Error('Reverse geocoding failed');
          const data = await res.json();
          const a = data.address ?? {};
          const place = a.village || a.town || a.city || a.suburb || a.hamlet || a.county;
          const district = a.state_district || a.county;
          const parts = [place, district !== place ? district : null, a.state].filter(Boolean);
          skipNextSearch.current = true;
          onChange('locationName', parts.join(', ') || data.display_name || '');
        } catch {
          // Coordinates are already filled in; the user can type the name manually
          setError('Got your coordinates, but could not look up the place name. Please type it in.');
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        setLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setError('Location permission was denied. Allow it in your browser settings and try again.');
        } else if (err.code === err.TIMEOUT) {
          setError('Timed out while getting your location. Please try again.');
        } else {
          setError('Could not determine your location.');
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-gray-700">
          Location name
        </label>
        <div className="relative" ref={wrapperRef}>
          <MapPin
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={locationName}
            onChange={(e) => onChange('locationName', e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => suggestions.length > 0 && setOpen(true)}
            placeholder="Start typing a village, town or city…"
            autoComplete="off"
            className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-9 text-sm text-gray-800 placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          />
          {searching && (
            <Loader2
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gray-400"
            />
          )}
          {open && suggestions.length > 0 && (
            <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
              {suggestions.map((sug, i) => (
                <li key={`${sug.label}-${i}`}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pickSuggestion(sug)}
                    className={`flex w-full items-start gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-green-50 ${
                      i === active ? 'bg-green-50' : ''
                    }`}
                  >
                    <MapPin size={14} className="mt-0.5 shrink-0 text-green-600" />
                    <span>{sug.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-700">
            Latitude
          </label>
          <input
            type="text"
            value={latitude}
            onChange={(e) => onChange('latitude', e.target.value)}
            placeholder="e.g. 10.8505"
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-700">
            Longitude
          </label>
          <input
            type="text"
            value={longitude}
            onChange={(e) => onChange('longitude', e.target.value)}
            placeholder="e.g. 76.2711"
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={useMyLocation}
        disabled={locating}
        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50 disabled:opacity-60"
      >
        <Crosshair size={15} className={locating ? 'animate-spin' : ''} />
        {locating ? 'Locating…' : 'Use my location'}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}