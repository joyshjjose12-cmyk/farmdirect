import { Check } from 'lucide-react';
import { STAGE_INDEX } from '@/lib/delivery';
import type { DeliveryStage } from '@/types';

const STEPS = ['Confirmed', 'Partner assigned', 'On the way', 'Delivered'];

export default function DeliveryStepper({ stage }: { stage: DeliveryStage }) {
  const step = STAGE_INDEX[stage];
  return (
    <ol className="flex items-start">
      {STEPS.map((label, i) => {
        const done = i <= step;
        return (
          <li key={label} className="flex flex-1 flex-col items-center last:flex-none">
            <div className="flex w-full items-center">
              <span
                className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${
                  done ? 'bg-green-600 text-white' : 'border-2 border-gray-200 bg-white'
                }`}
              >
                {done && <Check size={12} />}
              </span>
              {i < STEPS.length - 1 && (
                <span className={`h-0.5 flex-1 ${i < step ? 'bg-green-500' : 'bg-gray-100'}`} />
              )}
            </div>
            <span
              className={`mt-1.5 self-start text-[11px] leading-tight ${
                done ? 'font-semibold text-gray-800' : 'text-gray-400'
              }`}
            >
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
