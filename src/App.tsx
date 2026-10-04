import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster, toast } from 'sonner';
import { useAuthStore } from './stores/authStore';
import Sidebar from './components/layout/Sidebar';
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import OrdersPage from './pages/orders/OrdersPage';
import OrderDetailsPage from './pages/orders/OrderDetailsPage';
import ProductsPage from './pages/products/ProductsPage';
import ProductFormPage from './pages/products/ProductFormPage';
import CategoriesPage from './pages/categories/CategoriesPage';
import OffersPage from './pages/offers/OffersPage';
import DeliveryZonesPage from './pages/delivery-zones/DeliveryZonesPage';
import AdminUsersPage from './pages/users/AdminUsersPage';
import { connectSocket, disconnectSocket, onNewOrder, onOrderStatusChanged } from './services/socket';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, ORDER_STATUS_LABELS } from './lib/formatters';
import { AdminRole, hasAccess } from './lib/permissions';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: AdminRole[] }) {
  const { token, apiKey, user } = useAuthStore();
  const authKey = apiKey || token;
  const navigate = useNavigate();

  useEffect(() => {
    if (authKey) {
      connectSocket(authKey, apiKey ? 'apiKey' : 'token');

      onNewOrder((order) => {
        toast.success(`طلب جديد وارد! #${order.orderNumber}`, {
          description: `العميل: ${order.customerName} - المبلغ: ${formatCurrency(order.totalAmount)}`,
          duration: 10000,
          action: {
            label: 'عرض',
            onClick: () => navigate(`/orders/${order.id}`)
          }
        });
        // Play notification sound
        new Audio('/notification.mp3').play().catch(() => {});
        // Invalidate orders list
        queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
        queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
        queryClient.invalidateQueries({ queryKey: ['revenue-timeline'] });
        queryClient.invalidateQueries({ queryKey: ['orders-timeline'] });
      });

      onOrderStatusChanged((order) => {
        queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
        queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
        queryClient.invalidateQueries({ queryKey: ['revenue-timeline'] });
        queryClient.invalidateQueries({ queryKey: ['orders-timeline'] });

        const label = ORDER_STATUS_LABELS[order.status];
        if (label) {
          toast.info(`تحديث الطلب #${order.orderNumber}: ${label}`, {
            duration: 5000,
          });
        }
      });
    }
    return () => {
      disconnectSocket();
    };
  }, [authKey, navigate]);

  if (!token && !apiKey) return <Navigate to="/login" replace />;
  if (!hasAccess(user?.role, roles)) return <Navigate to="/" replace />;

  return (
    <div className="flex min-h-screen bg-gray-50" dir="rtl">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster richColors position="top-left" dir="rtl" />
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute roles={['ORDERS_STAFF']}><OrdersPage /></ProtectedRoute>} />
          <Route path="/orders/:id" element={<ProtectedRoute roles={['ORDERS_STAFF']}><OrderDetailsPage /></ProtectedRoute>} />
          <Route path="/products" element={<ProtectedRoute roles={['PRODUCTS_STAFF']}><ProductsPage /></ProtectedRoute>} />
          <Route path="/products/new" element={<ProtectedRoute roles={['PRODUCTS_STAFF']}><ProductFormPage /></ProtectedRoute>} />
          <Route path="/products/edit/:id" element={<ProtectedRoute roles={['PRODUCTS_STAFF']}><ProductFormPage /></ProtectedRoute>} />
          <Route path="/categories" element={<ProtectedRoute roles={['PRODUCTS_STAFF']}><CategoriesPage /></ProtectedRoute>} />
          <Route path="/offers" element={<ProtectedRoute roles={['PRODUCTS_STAFF']}><OffersPage /></ProtectedRoute>} />
          <Route path="/zones" element={<ProtectedRoute roles={['ADMIN']}><DeliveryZonesPage /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute roles={['ADMIN']}><AdminUsersPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
