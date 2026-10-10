import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import DashboardPage from '@/pages/DashboardPage';
import ProtectedRoute from '@/components/ProtectedRoute';
import LandingPage from '@/pages/LandingPage';
import MarketplacePage from '@/pages/MarketplacePage';
import ListingDetailPage from '@/pages/ListingDetailPage';
import FarmerDashboardPage from '@/pages/FarmerDashboardPage';
import CreateEditListingPage from '@/pages/CreateEditListingPage';
import OrderTrackingPage from '@/pages/OrderTrackingPage';
import AuthPage from '@/pages/AuthPage';
import DeliveryDashboardPage from '@/pages/DeliveryDashboardPage';
import { AuthProvider } from '@/context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="flex min-h-screen flex-col">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/marketplace" element={<MarketplacePage />} />
              <Route path="/listing/:id" element={<ListingDetailPage />} />
              <Route path="/order/:id" element={<OrderTrackingPage />} />

              {/* Dashboard */}
              <Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <DashboardPage />
    </ProtectedRoute>
  }
/>
              <Route
                path="/delivery"
                element={
                  <ProtectedRoute role="delivery">
                    <DeliveryDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/listing/new"
                element={
                  <ProtectedRoute role="farmer">
                    <CreateEditListingPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/listing/:id/edit"
                element={
                  <ProtectedRoute role="farmer">
                    <CreateEditListingPage />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;