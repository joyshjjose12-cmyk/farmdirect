import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  size?: number;
  showValue?: boolean;
}

export default function StarRating({
  rating,
  size = 14,
  showValue = false,
}: StarRatingProps) {
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.25 && rating - full < 0.75;
  const rounded = rating - full >= 0.75 ? full + 1 : full;
  const empty = 5 - rounded - (hasHalf ? 1 : 0);

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: rounded }).map((_, i) => (
        <Star
          key={`f-${i}`}
          size={size}
          className="fill-amber-400 text-amber-400"
        />
      ))}
      {hasHalf && (
        <div className="relative" style={{ width: size, height: size }}>
          <Star size={size} className="absolute text-amber-400" />
          <div className="absolute overflow-hidden" style={{ width: size / 2, height: size }}>
            <Star size={size} className="fill-amber-400 text-amber-400" />
          </div>
        </div>
      )}
      {Array.from({ length: Math.max(0, empty) }).map((_, i) => (
        <Star key={`e-${i}`} size={size} className="text-gray-300" />
      ))}
      {showValue && (
        <span className="ml-1 text-sm font-medium text-gray-600">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}
