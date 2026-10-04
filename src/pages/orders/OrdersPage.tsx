import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { Search, Eye } from 'lucide-react';
import { formatCurrency, formatDateTime, ORDER_STATUS_BADGE_CLASSES, ORDER_STATUS_LABELS } from '../../lib/formatters';

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  totalAmount: string;
  status: string;
  createdAt: string;
}

export default function OrdersPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', page, status, search],
    queryFn: async () => {
      const params = new URLSearchParams({ 
        page: page.toString(), 
        limit: '15',
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
      if (status !== 'ALL') params.append('status', status);
      if (search) params.append('search', search);
      const res = await api.get(`/admin/orders?${params.toString()}`);
      return res.data;
    },
    refetchInterval: 30000,
  });

  const orders: Order[] = data?.data || [];
  const meta = data?.meta || { totalPages: 1 };

  return (
    <div className="p-8 space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">الطلبات</h2>
      </div>

      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px] space-y-2">
          <label className="text-sm font-medium">بحث</label>
          <div className="relative">
            <Search className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
            <input
              placeholder="رقم الطلب، اسم العميل، الهاتف..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="flex h-10 w-full rounded-md border border-input bg-background pr-10 pl-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>
        <div className="w-48 space-y-2">
          <label className="text-sm font-medium">تصفية حسب الحالة</label>
          <select 
            value={status} 
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="ALL">الكل</option>
            {Object.entries(ORDER_STATUS_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-md border bg-white shadow-sm overflow-hidden">
        <table className="w-full text-right text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 font-medium">رقم الطلب</th>
              <th className="px-4 py-3 font-medium">العميل</th>
              <th className="px-4 py-3 font-medium">الهاتف</th>
              <th className="px-4 py-3 font-medium">التاريخ</th>
              <th className="px-4 py-3 font-medium">المبلغ</th>
              <th className="px-4 py-3 font-medium">الحالة</th>
              <th className="px-4 py-3 font-medium">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr><td colSpan={7} className="text-center py-10">جاري التحميل...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-10">لا توجد طلبات</td></tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-bold text-primary">{order.orderNumber}</td>
                  <td className="px-4 py-3">{order.customerName}</td>
                  <td className="px-4 py-3">{order.customerPhone}</td>
                  <td className="px-4 py-3">{formatDateTime(order.createdAt)}</td>
                  <td className="px-4 py-3 font-medium">{formatCurrency(order.totalAmount)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${ORDER_STATUS_BADGE_CLASSES[order.status] || 'bg-gray-100 text-gray-700'}`}>
                      {ORDER_STATUS_LABELS[order.status] || order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button 
                      onClick={() => navigate(`/orders/${order.id}`)}
                      className="p-1.5 rounded hover:bg-gray-100 text-gray-600 flex items-center gap-1 text-xs"
                    >
                      <Eye className="w-4 h-4" /> عرض
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-end gap-4">
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
          className="inline-flex items-center justify-center rounded-md border h-9 px-3 text-sm disabled:opacity-50"
        >
          السابق
        </button>
        <div className="text-sm font-medium">صفحة {page} من {meta.totalPages}</div>
        <button
          onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
          disabled={page >= meta.totalPages}
          className="inline-flex items-center justify-center rounded-md border h-9 px-3 text-sm disabled:opacity-50"
        >
          التالي
        </button>
      </div>
    </div>
  );
}
