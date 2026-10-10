import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Loader2, Navigation } from 'lucide-react';
import { haversineKm } from '@/lib/delivery';

interface Point {
  lat: number;
  lng: number;
  label: string;
}

interface DeliveryMapProps {
  pickup: Point | null;
  drop: Point | null;
  /** show the viewer's own live position (delivery partner screen) */
  showMe?: boolean;
  /** latest logged position of the delivery partner (truck marker) */
  courier?: { lat: number; lng: number } | null;
  heightClass?: string;
  onRoute?: (info: { km: number; minutes: number | null; estimated: boolean }) => void;
}

const stopIcon = (emoji: string, color: string) =>
  L.divIcon({
    className: 'fd-pin-wrapper',
    html: `<div class="fd-stop" style="--stop:${color}"><span>${emoji}</span></div>`,
    iconSize: [38, 46],
    iconAnchor: [19, 44],
    tooltipAnchor: [0, -40],
  });

const truckIcon = stopIcon('🚚', '#7c3aed');

const meIcon = L.divIcon({
  className: 'fd-pin-wrapper',
  html: '<div class="fd-you"><span class="fd-you-pulse"></span><span class="fd-you-dot"></span></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

export default function DeliveryMap({
  pickup,
  drop,
  showMe = false,
  courier = null,
  heightClass = 'h-72',
  onRoute,
}: DeliveryMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const meRef = useRef<L.Marker | null>(null);
  const truckRef = useRef<L.Marker | null>(null);
  const onRouteRef = useRef(onRoute);
  onRouteRef.current = onRoute;
  const [routing, setRouting] = useState(false);
  const [routeNote, setRouteNote] = useState('');

  // Create the map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { center: [22.5, 79], zoom: 5, scrollWheelZoom: false });
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
      meRef.current = null;
      truckRef.current = null;
    };
  }, []);

  // Pins + route whenever the stops change
  const pLat = pickup?.lat;
  const pLng = pickup?.lng;
  const pLabel = pickup?.label;
  const dLat = drop?.lat;
  const dLng = drop?.lng;
  const dLabel = drop?.label;

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();
    setRouteNote('');

    const pts: [number, number][] = [];
    if (pLat != null && pLng != null) {
      pts.push([pLat, pLng]);
      L.marker([pLat, pLng], { icon: stopIcon('🌾', '#16a34a'), title: 'Pickup' })
        .bindTooltip(`Pickup · ${pLabel ?? 'Farm'}`, { direction: 'top' })
        .addTo(layer);
    }
    if (dLat != null && dLng != null) {
      pts.push([dLat, dLng]);
      L.marker([dLat, dLng], { icon: stopIcon('🏠', '#2563eb'), title: 'Drop-off' })
        .bindTooltip(`Drop-off · ${dLabel ?? 'Buyer'}`, { direction: 'top' })
        .addTo(layer);
    }

    if (pts.length === 1) map.setView(pts[0], 13);
    else if (pts.length === 2) map.fitBounds(L.latLngBounds(pts), { padding: [50, 50] });

    if (pts.length < 2) return;

    // Road route from OSRM's free public server; fall back to a straight dashed line
    const controller = new AbortController();
    const straightKm = haversineKm(pts[0], pts[1]);
    setRouting(true);
    fetch(
      `https://router.project-osrm.org/route/v1/driving/${pts[0][1]},${pts[0][0]};${pts[1][1]},${pts[1][0]}?overview=full&geometries=geojson`,
      { signal: controller.signal }
    )
      .then((r) => {
        if (!r.ok) throw new Error('route failed');
        return r.json();
      })
      .then((data) => {
        const route = data.routes?.[0];
        if (!route) throw new Error('no route');
        const line = (route.geometry.coordinates as [number, number][]).map(
          ([lng, lat]) => [lat, lng] as L.LatLngTuple
        );
        const poly = L.polyline(line, { color: '#16a34a', weight: 5, opacity: 0.85 }).addTo(layer);
        map.fitBounds(poly.getBounds(), { padding: [50, 50] });
        onRouteRef.current?.({
          km: route.distance / 1000,
          minutes: Math.round(route.duration / 60),
          estimated: false,
        });
      })
      .catch((e) => {
        if ((e as Error).name === 'AbortError') return;
        L.polyline(pts, { color: '#16a34a', weight: 4, dashArray: '8 8', opacity: 0.8 }).addTo(layer);
        setRouteNote('Road route unavailable, showing a straight line.');
        onRouteRef.current?.({ km: straightKm, minutes: null, estimated: true });
      })
      .finally(() => setRouting(false));

    return () => controller.abort();
  }, [pLat, pLng, pLabel, dLat, dLng, dLabel]);

  // Delivery partner's last logged position
  const cLat = courier?.lat;
  const cLng = courier?.lng;
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (cLat == null || cLng == null) {
      truckRef.current?.remove();
      truckRef.current = null;
      return;
    }
    if (truckRef.current) truckRef.current.setLatLng([cLat, cLng]);
    else
      truckRef.current = L.marker([cLat, cLng], { icon: truckIcon, zIndexOffset: 900, title: 'Delivery partner' })
        .bindTooltip('Delivery partner', { direction: 'top' })
        .addTo(map);
  }, [cLat, cLng]);

  // Live position of the person holding the phone
  useEffect(() => {
    if (!showMe || !('geolocation' in navigator)) return;
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const map = mapRef.current;
        if (!map) return;
        const ll: L.LatLngTuple = [pos.coords.latitude, pos.coords.longitude];
        if (meRef.current) meRef.current.setLatLng(ll);
        else
          meRef.current = L.marker(ll, { icon: meIcon, interactive: false, zIndexOffset: 1000 }).addTo(map);
      },
      () => {
        /* permission denied: the map still works without it */
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 }
    );
    return () => {
      navigator.geolocation.clearWatch(id);
      meRef.current?.remove();
      meRef.current = null;
    };
  }, [showMe]);

  const noCoords = !pickup && !drop;

  return (
    <div className="relative isolate z-0 overflow-hidden rounded-2xl border border-gray-100 shadow-sm">
      <div ref={containerRef} className={`${heightClass} w-full`} />

      {noCoords && (
        <div className="absolute inset-0 z-[500] flex items-center justify-center bg-white/80 px-6 text-center">
          <p className="rounded-xl bg-white px-4 py-3 text-sm font-medium text-gray-600 shadow">
            No map location saved for this order yet.
          </p>
        </div>
      )}

      <div className="absolute left-3 top-3 z-[500] flex flex-col gap-1.5">
        {routing && (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/95 px-2.5 py-1 text-xs text-gray-600 shadow">
            <Loader2 size={12} className="animate-spin" /> Finding route…
          </span>
        )}
        {routeNote && (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1 text-xs text-amber-700 shadow">
            <Navigation size={12} /> {routeNote}
          </span>
        )}
      </div>

      <div className="absolute bottom-3 left-3 z-[500] flex gap-3 rounded-lg bg-white/95 px-3 py-1.5 text-xs text-gray-600 shadow">
        <span>🌾 Pickup</span>
        <span>🏠 Drop-off</span>
        {showMe && <span>🔵 You</span>}
        {courier && <span>🚚 Partner</span>}
      </div>
    </div>
  );
}
