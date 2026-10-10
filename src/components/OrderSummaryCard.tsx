import { Package, User, Truck } from 'lucide-react';
import type { Order } from '@/types';

interface OrderSummaryCardProps {
  order: Order;
}

export default function OrderSummaryCard({ order }: OrderSummaryCardProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center">
        <img
          src={order.cropImage}
          alt={order.cropName}
          className="h-28 w-full flex-shrink-0 rounded-xl object-cover sm:w-40"
        />

        <div className="flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{order.cropName}</h2>
              <p className="mt-0.5 text-sm text-gray-400">
                Order #{order.id.toUpperCase()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-green-700">
                ₹{order.totalPrice}
              </p>
              <p className="text-xs text-gray-400">total</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50 text-green-600">
                <Package size={18} />
              </span>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Quantity
                </p>
                <p className="text-sm font-semibold text-gray-800">
                  {order.quantity} {order.unit}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <User size={18} />
              </span>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Buyer
                </p>
                <p className="text-sm font-semibold text-gray-800">
                  {order.buyerName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Truck size={18} />
              </span>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Farmer
                </p>
                <p className="text-sm font-semibold text-gray-800">
                  {order.farmerName}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-gray-50 pt-3 text-sm">
            <span className="text-gray-500">
              Agreed price:{' '}
              <span className="font-semibold text-gray-700">
                ₹{order.agreedPricePerUnit}/{order.unit}
              </span>
            </span>
            <span className="text-gray-400">
              {order.farmerFarm}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
