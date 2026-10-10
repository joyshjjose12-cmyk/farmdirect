import { Star } from 'lucide-react';

interface QualitySelectorProps {
  value: number;
  onChange: (value: number) => void;
}

export default function QualitySelector({ value, onChange }: QualitySelectorProps) {
  return (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="transition-transform hover:scale-110"
          aria-label={`Rate ${star} stars`}
        >
          <Star
            size={28}
            className={
              star <= value
                ? 'fill-amber-400 text-amber-400'
                : 'fill-gray-100 text-gray-300'
            }
          />
        </button>
      ))}
      <span className="ml-2 text-sm font-medium text-gray-600">
        {value > 0 ? `${value}.0` : 'Unrated'}
      </span>
    </div>
  );
}
