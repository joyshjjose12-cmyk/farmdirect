import type { ListingStatus } from '@/types';

interface StatusBadgeProps {
  status: ListingStatus;
}

const styles: Record<ListingStatus, string> = {
  Active: 'bg-green-50 text-green-700 border-green-200',
  Sold: 'bg-blue-50 text-blue-700 border-blue-200',
  Expired: 'bg-gray-100 text-gray-500 border-gray-200',
};

const dotColor: Record<ListingStatus, string> = {
  Active: 'bg-green-500',
  Sold: 'bg-blue-500',
  Expired: 'bg-gray-400',
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${styles[status]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotColor[status]}`} />
      {status}
    </span>
  );
}
