import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { logCourierLocation } from '@/lib/delivery';

export interface CourierPos {
  lat: number;
  lng: number;
  at: string;
}

/** Buyer / farmer side: the delivery partner's latest logged position (refreshes every 20s). */
export function useCourierPosition(orderId: string, enabled: boolean) {
  const [pos, setPos] = useState<CourierPos | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const load = async () => {
      const { data: r } = await api.get<{ latitude: number; longitude: number; logged_at: string } | null>(
        `/orders/${orderId}/location`
      );
      if (!cancelled && r)
        setPos({ lat: Number(r.latitude), lng: Number(r.longitude), at: r.logged_at as string });
    };
    load();
    const t = setInterval(load, 20000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [orderId, enabled]);

  return pos;
}

/** Delivery-partner side: while `active`, send this device's GPS position about every 20s. */
export function useShareLocation(orderId: string, active: boolean) {
  const [sharing, setSharing] = useState<'idle' | 'on' | 'denied'>('idle');
  const lastSent = useRef(0);

  useEffect(() => {
    if (!active || !('geolocation' in navigator)) {
      setSharing('idle');
      return;
    }
    lastSent.current = 0;
    const id = navigator.geolocation.watchPosition(
      (p) => {
        setSharing('on');
        const now = Date.now();
        if (now - lastSent.current < 20000) return;
        lastSent.current = now;
        logCourierLocation(orderId, p.coords.latitude, p.coords.longitude);
      },
      (err) => setSharing(err.code === err.PERMISSION_DENIED ? 'denied' : 'idle'),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [orderId, active]);

  return sharing;
}
