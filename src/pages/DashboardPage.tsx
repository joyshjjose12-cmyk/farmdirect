import { useAuth } from '@/context/AuthContext';
import BuyerDashboardPage from '@/pages/BuyerDashboardPage';
import FarmerDashboardPage from '@/pages/FarmerDashboardPage';
import DeliveryDashboardPage from '@/pages/DeliveryDashboardPage';

/** One /dashboard URL: buyers, farmers and delivery partners each get their own. */
export default function DashboardPage() {
  const { profile } = useAuth();
  if (!profile) return <div className="p-8 text-center text-gray-500">Loading…</div>;
  if (profile.role === 'delivery') return <DeliveryDashboardPage />;
  return profile.role === 'buyer' ? <BuyerDashboardPage /> : <FarmerDashboardPage />;
}
