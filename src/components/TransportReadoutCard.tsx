import { Thermometer, Droplets, MapPin } from 'lucide-react';
import type { TransportReadout } from '@/types';

interface TransportReadoutCardProps {
  readout: TransportReadout;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return `${Math.floor(hrs / 24)} days ago`;
}

export default function TransportReadoutCard({ readout }: TransportReadoutCardProps) {
  const stats = [
    {
      icon: Thermometer,
      label: 'Temperature',
      value: `${readout.temperatureC.toFixed(1)}°C`,
      color: 'text-red-500',
      bg: 'bg-red-50',
    },
    {
      icon: Droplets,
      label: 'Humidity',
      value: `${readout.humidityPct}%`,
      color: 'text-blue-500',
      bg: 'bg-blue-50',
    },
    {
      icon: MapPin,
      label: 'Last Location',
      value: readout.lastLocation,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
  ];

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wide text-gray-500">
          Transport Conditions
        </h3>
        <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700">
          Live
        </span>
      </div>

      <div className="space-y-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="flex items-center gap-3 rounded-xl border border-gray-50 bg-gray-50/60 p-3"
            >
              <span
                className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${stat.bg} ${stat.color}`}
              >
                <Icon size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  {stat.label}
                </p>
                <p className="truncate text-sm font-semibold text-gray-800">
                  {stat.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-3 border-t border-gray-50 pt-3 text-xs text-gray-400">
        Last updated {timeAgo(readout.lastUpdated)}
      </p>
    </div>
  );
}
