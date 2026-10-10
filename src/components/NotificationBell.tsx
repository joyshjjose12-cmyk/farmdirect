import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { api } from '@/lib/api';

interface Notification {
  id: number;
  kind: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

function timeAgo(iso: string): string {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return `${Math.floor(s / 86400)} d ago`;
}

/**
 * The bell in the navbar. Its rows are written by database triggers
 * (new bid, bid accepted/declined, delivery progress, Verified Farmer ...).
 */
export default function NotificationBell() {
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const { data } = await api.get<{ items: Notification[]; unread: number }>('/notifications');
    if (data) {
      setItems(data.items);
      setUnread(data.unread);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) {
      await api.post('/notifications/read');
      setUnread(0);
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={toggle}
        aria-label="Notifications"
        className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50"
      >
        <Bell size={17} />
        {unread > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg">
          <div className="border-b border-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-900">
            Notifications
          </div>
          {items.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-gray-500">Nothing yet.</p>
          ) : (
            <ul className="max-h-96 divide-y divide-gray-50 overflow-y-auto">
              {items.map((n) => {
                const body = (
                  <div className={`px-4 py-3 text-sm ${n.is_read ? 'bg-white' : 'bg-green-50'}`}>
                    <p className="text-gray-800">{n.message}</p>
                    <p className="mt-0.5 text-xs text-gray-400">{timeAgo(n.created_at)}</p>
                  </div>
                );
                return (
                  <li key={n.id}>
                    {n.link ? (
                      <Link to={n.link} onClick={() => setOpen(false)} className="block hover:bg-gray-50">
                        {body}
                      </Link>
                    ) : (
                      body
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
