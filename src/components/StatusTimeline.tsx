import { Check } from 'lucide-react';
import type { StatusEvent } from '@/types';

interface StatusTimelineProps {
  events: StatusEvent[];
}

export default function StatusTimeline({ events }: StatusTimelineProps) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <h3 className="mb-5 text-sm font-bold uppercase tracking-wide text-gray-500">
        Order Status
      </h3>

      <ol className="relative">
        {events.map((event, idx) => {
          const isLast = idx === events.length - 1;
          return (
            <li key={event.stage} className="flex gap-4 pb-6 last:pb-0">
              {!isLast && (
                <span
                  className={`absolute left-[15px] mt-8 h-[calc(100%-2rem)] w-0.5 ${
                    event.complete ? 'bg-green-500' : 'bg-gray-100'
                  }`}
                  style={{ top: `${idx * 0}px` }}
                />
              )}

              <div className="relative z-10 flex-shrink-0">
                {event.complete ? (
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600 text-white shadow-sm">
                    <Check size={16} />
                  </span>
                ) : (
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-200 bg-white" />
                )}
              </div>

              <div className="flex flex-col pt-0.5">
                <span
                  className={`text-sm font-semibold ${
                    event.complete ? 'text-gray-900' : 'text-gray-400'
                  }`}
                >
                  {event.label}
                </span>
                {event.timestamp && (
                  <span className="text-xs text-gray-400">
                    {new Date(event.timestamp).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </span>
                )}
                {!event.complete && !event.timestamp && (
                  <span className="text-xs text-gray-300">Pending</span>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
