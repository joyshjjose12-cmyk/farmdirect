import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  accent?: 'green' | 'amber' | 'blue';
  sublabel?: string;
}

const accentStyles = {
  green: 'bg-green-50 text-green-600',
  amber: 'bg-amber-50 text-amber-600',
  blue: 'bg-blue-50 text-blue-600',
};

export default function StatCard({
  label,
  value,
  icon,
  accent = 'green',
  sublabel,
}: StatCardProps) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            {label}
          </p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
          {sublabel && (
            <p className="mt-1 text-xs text-gray-400">{sublabel}</p>
          )}
        </div>
        <span
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${accentStyles[accent]}`}
        >
          {icon}
        </span>
      </div>
    </div>
  );
}
