import {
  CheckCircle,
  Package,
  Truck,
  Home,
  Clock,
} from 'lucide-react';
import type { TrackingEvent, TrackingStage } from '@/types';

interface OrderTimelineProps {
  events: TrackingEvent[];
}

const stageIcons: Record<TrackingStage, typeof CheckCircle> = {
  confirmed: CheckCircle,
  picked_up: Package,
  in_transit: Truck,
  delivered: Home,
};

function formatTime(iso: string): string {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function OrderTimeline({ events }: OrderTimelineProps) {
  const currentIdx = events.findIndex((e) => !e.complete);
  const highlightedIdx = currentIdx === -1 ? events.length - 1 : currentIdx - 1;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <h3 className="mb-5 text-sm font-bold uppercase tracking-wide text-gray-500">
        Delivery Status
      </h3>

      <ol className="relative">
        {events.map((event, idx) => {
          const Icon = stageIcons[event.stage];
          const isHighlighted = idx === highlightedIdx && !event.complete;
          const isLast = idx === events.length - 1;

          return (
            <li key={event.stage} className="relative flex gap-4 pb-8 last:pb-0">
              {!isLast && (
                <span
                  className={`absolute left-[19px] top-10 h-[calc(100%-1.5rem)] w-0.5 ${
                    event.complete ? 'bg-green-500' : 'bg-gray-100'
                  }`}
                />
              )}

              <div className="relative z-10 flex-shrink-0">
                {event.complete ? (
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-green-600 text-white shadow-sm">
                    <Icon size={20} />
                  </span>
                ) : isHighlighted ? (
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-green-500 bg-green-50 text-green-600 shadow-sm ring-4 ring-green-100/50">
                    <Icon size={20} />
                  </span>
                ) : (
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-gray-200 bg-white text-gray-300">
                    <Icon size={20} />
                  </span>
                )}
              </div>

              <div className={`flex flex-col pt-1.5 ${isHighlighted ? '' : ''}`}>
                <span
                  className={`text-sm font-semibold ${
                    event.complete
                      ? 'text-gray-900'
                      : isHighlighted
                        ? 'text-green-700'
                        : 'text-gray-400'
                  }`}
                >
                  {event.label}
                </span>
                {event.timestamp ? (
                  <span className="mt-0.5 flex items-center gap-1 text-xs text-gray-400">
                    <Clock size={11} />
                    {formatTime(event.timestamp)}
                  </span>
                ) : isHighlighted ? (
                  <span className="mt-0.5 text-xs font-medium text-green-500">
                    In progress
                  </span>
                ) : (
                  <span className="mt-0.5 text-xs text-gray-300">Pending</span>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
