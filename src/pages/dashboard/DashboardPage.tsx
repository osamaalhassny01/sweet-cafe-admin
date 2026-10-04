import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Activity,
  ArrowLeft,
  Clock3,
  Package,
  RefreshCw,
  ShoppingCart,
  TrendingUp,
} from 'lucide-react';
import { api } from '../../services/api';
import {
  formatCompactCurrency,
  formatCurrency,
  formatPlainNumber,
  formatTime,
  ORDER_STATUS_BADGE_CLASSES,
  ORDER_STATUS_LABELS,
} from '../../lib/formatters';
import { AdminRole, hasAccess } from '../../lib/permissions';
import { useAuthStore } from '../../stores/authStore';

interface RecentOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  totalAmount: number | string;
  status: string;
  createdAt: string;
}

interface StatsResponse {
  totalOrders: number;
  todayOrders: number;
  totalRevenue: number;
  todayRevenue: number;
  totalProducts: number;
  totalCategories: number;
  pendingOrders: number;
  ordersByStatus: Array<{ status: string; count: number }>;
  recentOrders: RecentOrder[];
  topProducts: { name: string; quantity: number; orderCount: number }[];
}

interface RevenueTimelinePoint {
  date: string;
  revenue: number;
}

interface OrdersTimelinePoint {
  date: string;
  count: number;
}

const ACTIVE_STATUSES = ['NEW', 'PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY'];

export default function DashboardPage() {
  const role = useAuthStore((state) => state.user?.role);
  const statsQuery = useQuery<StatsResponse>({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const res = await api.get('/admin/stats');
      return res.data;
    },
    refetchInterval: 30000,
  });

  const revenueTimelineQuery = useQuery<RevenueTimelinePoint[]>({
    queryKey: ['revenue-timeline'],
    queryFn: async () => {
      const res = await api.get('/admin/stats/revenue-timeline?days=7');
      return res.data as RevenueTimelinePoint[];
    },
    refetchInterval: 30000,
  });

  const ordersTimelineQuery = useQuery<OrdersTimelinePoint[]>({
    queryKey: ['orders-timeline'],
    queryFn: async () => {
      const res = await api.get('/admin/stats/orders-timeline?days=7');
      return res.data as OrdersTimelinePoint[];
    },
    refetchInterval: 30000,
  });

  const stats = statsQuery.data;
  const activeOrders = (stats?.ordersByStatus || [])
    .filter((item) => ACTIVE_STATUSES.includes(item.status))
    .reduce((sum, item) => sum + item.count, 0);
  const isRefreshing =
    statsQuery.isFetching || revenueTimelineQuery.isFetching || ordersTimelineQuery.isFetching;

  const refreshDashboard = () => {
    statsQuery.refetch();
    revenueTimelineQuery.refetch();
    ordersTimelineQuery.refetch();
  };

  if (statsQuery.isLoading) {
    return <DashboardSkeleton />;
  }

  if (statsQuery.isError) {
    return (
      <div className="p-8" dir="rtl">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">
          تعذر تحميل بيانات الداشبورد. تأكد من تشغيل الخادم ثم أعد المحاولة.
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6" dir="rtl">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">لوحة التشغيل</h2>
          <p className="text-sm text-muted-foreground">
            متابعة الطلبات والمبيعات والمنتجات من مكان واحد، مع تحديث تلقائي كل 30 ثانية.
          </p>
        </div>
        <button
          type="button"
          onClick={refreshDashboard}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md border bg-white px-4 text-sm font-medium hover:bg-gray-50 disabled:opacity-60"
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          تحديث الآن
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="مبيعات اليوم"
          value={formatCurrency(stats?.todayRevenue)}
          detail={`الإجمالي: ${formatCurrency(stats?.totalRevenue)}`}
          icon={<TrendingUp className="h-5 w-5" />}
          color="text-green-700"
        />
        <StatCard
          title="طلبات اليوم"
          value={formatPlainNumber(stats?.todayOrders)}
          detail={`كل الطلبات: ${formatPlainNumber(stats?.totalOrders)}`}
          icon={<ShoppingCart className="h-5 w-5" />}
          color="text-blue-700"
        />
        <StatCard
          title="طلبات تحتاج متابعة"
          value={formatPlainNumber(activeOrders)}
          detail={`قيد الانتظار: ${formatPlainNumber(stats?.pendingOrders)}`}
          icon={<Activity className="h-5 w-5" />}
          color="text-amber-700"
        />
        <StatCard
          title="المنتجات النشطة"
          value={formatPlainNumber(stats?.totalProducts)}
          detail={`التصنيفات: ${formatPlainNumber(stats?.totalCategories)}`}
          icon={<Package className="h-5 w-5" />}
          color="text-violet-700"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <QuickAction
          title="فتح الطلبات الجديدة"
          detail="تابع الطلبات التي لم يتم تأكيدها"
          to="/orders"
          roles={['ORDERS_STAFF']}
          role={role}
        />
        <QuickAction
          title="إضافة منتج سريع"
          detail="أدخل السعر مباشرة بالريال اليمني"
          to="/products/new"
          roles={['PRODUCTS_STAFF']}
          role={role}
        />
        <QuickAction
          title="إدارة التوصيل"
          detail="رسوم وحد أدنى واضحان بالريال"
          to="/zones"
          roles={['ADMIN']}
          role={role}
        />
        <QuickAction
          title="مراجعة العروض"
          detail="تفعيل أو إيقاف الخصومات الحالية"
          to="/offers"
          roles={['PRODUCTS_STAFF']}
          role={role}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartPanel title="الإيرادات آخر 7 أيام">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueTimelineQuery.data || []}>
              <defs>
                <linearGradient id="dashboardRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7C5C3C" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#7C5C3C" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eeeeee" />
              <XAxis dataKey="date" fontSize={11} tickFormatter={formatChartDate} />
              <YAxis fontSize={11} tickFormatter={formatCompactCurrency} width={54} />
              <Tooltip
                formatter={(value) => [formatCurrency(value), 'الإيراد']}
                labelFormatter={(value) => formatChartDate(String(value))}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#7C5C3C"
                strokeWidth={2}
                fill="url(#dashboardRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title="عدد الطلبات آخر 7 أيام">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ordersTimelineQuery.data || []}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eeeeee" />
              <XAxis dataKey="date" fontSize={11} tickFormatter={formatChartDate} />
              <YAxis fontSize={11} allowDecimals={false} />
              <Tooltip
                formatter={(value) => [formatPlainNumber(value), 'طلب']}
                labelFormatter={(value) => formatChartDate(String(value))}
              />
              <Bar dataKey="count" fill="#7C5C3C" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 rounded-lg border bg-white shadow-sm">
          <div className="flex items-center justify-between border-b p-5">
            <div>
              <h3 className="font-bold">آخر الطلبات</h3>
              <p className="text-xs text-gray-500">تظهر تلقائيا بدون بحث يدوي.</p>
            </div>
            <Link to="/orders" className="inline-flex items-center gap-1 text-sm font-medium text-primary">
              عرض الكل
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="border-b bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3 font-medium">رقم الطلب</th>
                  <th className="px-4 py-3 font-medium">العميل</th>
                  <th className="px-4 py-3 font-medium">الوقت</th>
                  <th className="px-4 py-3 font-medium">المبلغ</th>
                  <th className="px-4 py-3 font-medium">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(stats?.recentOrders || []).map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-bold text-primary">
                      <Link to={`/orders/${order.id}`}>{order.orderNumber}</Link>
                    </td>
                    <td className="px-4 py-3">{order.customerName}</td>
                    <td className="px-4 py-3 text-gray-500">{formatTime(order.createdAt)}</td>
                    <td className="px-4 py-3 font-medium">{formatCurrency(order.totalAmount)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={order.status} />
                    </td>
                  </tr>
                ))}
                {stats?.recentOrders?.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                      لا توجد طلبات حديثة
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border bg-white shadow-sm">
            <div className="border-b p-5">
              <h3 className="font-bold">الطلبات حسب الحالة</h3>
            </div>
            <div className="space-y-3 p-5">
              {(stats?.ordersByStatus || []).map((item) => (
                <div key={item.status} className="flex items-center justify-between gap-3">
                  <StatusBadge status={item.status} />
                  <span className="text-sm font-bold">{formatPlainNumber(item.count)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border bg-white shadow-sm">
            <div className="border-b p-5">
              <h3 className="font-bold">الأكثر مبيعا</h3>
            </div>
            <div className="space-y-4 p-5">
              {(stats?.topProducts || []).map((product, index) => (
                <div key={`${product.name}-${index}`} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-100 text-xs font-bold text-amber-700">
                      {index + 1}
                    </span>
                    <span className="text-sm font-medium">{product.name}</span>
                  </div>
                  <span className="text-xs font-bold text-gray-500">
                    {formatPlainNumber(product.quantity)} قطعة
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Clock3 className="h-4 w-4" />
        يتم التحديث تلقائيا، ويمكنك الضغط على "تحديث الآن" عند الحاجة.
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  detail,
  icon,
  color,
}: {
  title: string;
  value: string;
  detail: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="rounded-lg border bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="mt-2 text-2xl font-bold">{value}</p>
          <p className="mt-1 text-xs text-gray-500">{detail}</p>
        </div>
        <div className={`rounded-md bg-gray-50 p-2 ${color}`}>{icon}</div>
      </div>
    </div>
  );
}

function QuickAction({
  title,
  detail,
  to,
  roles,
  role,
}: {
  title: string;
  detail: string;
  to: string;
  roles: AdminRole[];
  role?: string;
}) {
  if (!hasAccess(role, roles)) return null;

  return (
    <Link
      to={to}
      className="group rounded-lg border bg-white p-4 shadow-sm transition hover:border-[#7C5C3C] hover:bg-[#FAF8F5]"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-bold">{title}</p>
          <p className="mt-1 text-xs text-gray-500">{detail}</p>
        </div>
        <ArrowLeft className="h-4 w-4 text-gray-400 transition group-hover:text-[#7C5C3C]" />
      </div>
    </Link>
  );
}

function ChartPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-white shadow-sm">
      <div className="border-b p-5">
        <h3 className="font-bold">{title}</h3>
      </div>
      <div className="h-[320px] p-5">{children}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${
        ORDER_STATUS_BADGE_CLASSES[status] || 'bg-gray-100 text-gray-700'
      }`}
    >
      {ORDER_STATUS_LABELS[status] || status}
    </span>
  );
}

function DashboardSkeleton() {
  return (
    <div className="p-8 space-y-6" dir="rtl">
      <div className="h-10 w-72 animate-pulse rounded bg-gray-200" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-32 animate-pulse rounded-lg bg-gray-200" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="h-96 animate-pulse rounded-lg bg-gray-200" />
        <div className="h-96 animate-pulse rounded-lg bg-gray-200" />
      </div>
    </div>
  );
}

function formatChartDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('ar-YE', { day: 'numeric', month: 'short' });
}
