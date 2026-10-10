import { useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Listing } from '@/types';

interface ListingsMapProps {
  listings: Listing[];
  userPos: { lat: number; lng: number } | null;
  onSelect: (listing: Listing) => void;
}

const CROP_EMOJI: [RegExp, string][] = [
  [/tomato/i, '🍅'],
  [/strawberr/i, '🍓'],
  [/carrot/i, '🥕'],
  [/apple/i, '🍎'],
  [/corn/i, '🌽'],
  [/potato/i, '🥔'],
  [/lettuce|basil|spinach|greens/i, '🥬'],
  [/wheat/i, '🌾'],
  [/rice/i, '🍚'],
  [/honey/i, '🍯'],
  [/squash|pumpkin/i, '🎃'],
  [/mango/i, '🥭'],
  [/banana/i, '🍌'],
  [/onion/i, '🧅'],
  [/chilli|chili|pepper/i, '🌶️'],
  [/coconut/i, '🥥'],
  [/grape/i, '🍇'],
  [/orange|lemon|lime/i, '🍊'],
];

function emojiFor(l: Listing) {
  const hit = CROP_EMOJI.find(([re]) => re.test(l.cropName));
  if (hit) return hit[1];
  switch (l.cropType) {
    case 'Fruits': return '🍑';
    case 'Berries': return '🫐';
    case 'Grains': return '🌾';
    case 'Vegetables': return '🥦';
    case 'Leafy Greens': return '🥬';
    case 'Root Crops': return '🥕';
    case 'Dairy': return '🥛';
    case 'Honey': return '🍯';
    default: return '🌱';
  }
}

function esc(v: string) {
  return v.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

function pinIcon(l: Listing) {
  const price = `₹${l.pricePerUnit}/${esc(l.unit)}`;
  return L.divIcon({
    className: 'fd-pin-wrapper',
    html: `
      <div class="fd-pin">
        <span class="fd-pin-pulse"></span>
        <span class="fd-pin-body"><span class="fd-pin-emoji">${emojiFor(l)}</span></span>
        <span class="fd-pin-price">${price}</span>
      </div>`,
    iconSize: [48, 74],
    iconAnchor: [24, 52], // tip of the pin
    tooltipAnchor: [0, -52],
  });
}

const userIcon = L.divIcon({
  className: 'fd-pin-wrapper',
  html: '<div class="fd-you"><span class="fd-you-pulse"></span><span class="fd-you-dot"></span></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

export default function ListingsMap({ listings, userPos, onSelect }: ListingsMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  // Only listings that actually have a saved location can be pinned
  const pinned = useMemo(
    () => listings.filter((l) => l.latitude != null && l.longitude != null),
    [listings]
  );
  const missing = listings.length - pinned.length;

  // Create the map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: [22.5, 79], // India
      zoom: 5,
      zoomControl: true,
      scrollWheelZoom: true,
        });
    L.tileLayer(
      `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=${import.meta.env.VITE_CARTO_KEY}`,
      {
        maxZoom: 19,
        subdomains: 'abcd',
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      }
    ).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  // Redraw pins whenever the (filtered) listings or the user's position change
  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();

    const points: L.LatLngTuple[] = [];

    pinned.forEach((l) => {
      const pos: L.LatLngTuple = [l.latitude as number, l.longitude as number];
      points.push(pos);
      const marker = L.marker(pos, { icon: pinIcon(l), riseOnHover: true, title: l.cropName });

      const tip = document.createElement('div');
      tip.className = 'fd-tip';
      const name = document.createElement('strong');
      name.textContent = l.cropName;
      const sub = document.createElement('span');
      sub.textContent = [l.farmer.farmName || l.farmer.name, l.location].filter(Boolean).join(' · ');
      tip.append(name, sub);
      marker.bindTooltip(tip, { direction: 'top', offset: [0, -4], opacity: 1 });

      marker.on('click', () => onSelectRef.current(l));
      marker.addTo(layer);
    });

    if (userPos) {
      L.marker([userPos.lat, userPos.lng], { icon: userIcon, interactive: false, zIndexOffset: -500 })
        .addTo(layer);
      points.push([userPos.lat, userPos.lng]);
    }

    if (points.length === 1) {
      map.setView(points[0], 12);
    } else if (points.length > 1) {
      map.fitBounds(L.latLngBounds(points), { padding: [60, 60], maxZoom: 13 });
    }
  }, [pinned, userPos]);

  return (
    <div className="relative isolate z-0 overflow-hidden rounded-2xl border border-gray-100 shadow-sm">
      <div ref={containerRef} className="h-[560px] w-full" />

      {pinned.length === 0 && (
        <div className="pointer-events-none absolute inset-0 z-[500] flex items-center justify-center bg-white/60">
          <p className="rounded-xl bg-white px-4 py-3 text-sm font-medium text-gray-600 shadow">
            No listings with a map location to show.
          </p>
        </div>
      )}

      {missing > 0 && pinned.length > 0 && (
        <div className="absolute bottom-6 left-3 z-[500] rounded-lg bg-white/95 px-3 py-1.5 text-xs text-gray-500 shadow">
          {missing} listing{missing > 1 ? 's' : ''} without a saved location not shown
        </div>
      )}
    </div>
  );
}
