import { useState } from 'react';
import { Gavel, AlertCircle } from 'lucide-react';

interface BidInputProps {
  currentHighest: number;
  unit: string;
  onPlaceBid?: (amount: number) => void;
}

export default function BidInput({
  currentHighest,
  unit,
  onPlaceBid,
}: BidInputProps) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const minBid = currentHighest + 0.01;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(false);

    const amount = parseFloat(value);
    if (!value || isNaN(amount)) {
      setError('Please enter a valid amount.');
      return;
    }
    if (amount <= currentHighest) {
      setError(
        `Your bid must be higher than the current top bid of ₹${currentHighest}.`
      );
      return;
    }

    setError('');
    setSuccess(true);
    onPlaceBid?.(amount);
    setValue('');
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <h3 className="mb-1 text-sm font-bold uppercase tracking-wide text-gray-500">
        Place a Bid
      </h3>
      <p className="mb-4 text-xs text-gray-400">
        Minimum bid: <span className="font-semibold text-gray-600">₹{minBid}</span>{' '}
        per {unit}
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            ₹
          </span>
          <input
            type="number"
            step="0.01"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError('');
              setSuccess(false);
            }}
            placeholder={minBid.toFixed(2)}
            className={`w-full rounded-xl border py-2.5 pl-8 pr-4 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 ${
              error
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-200 focus:border-green-500 focus:ring-green-500'
            }`}
          />
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
            <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-start gap-2 rounded-lg bg-green-50 px-3 py-2 text-xs text-green-700">
            <Gavel size={14} className="mt-0.5 flex-shrink-0" />
            <span>Bid placed successfully! The farmer will be notified.</span>
          </div>
        )}

        <button
          type="submit"
          className="w-full rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-green-700 hover:shadow-md"
        >
          Place Bid
        </button>
      </form>
    </div>
  );
}
