import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { ArrowRight, Printer, Phone, MapPin, Clock, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency, formatDateTime, ORDER_STATUS_BADGE_CLASSES, ORDER_STATUS_LABELS } from '../../lib/formatters';

const VALID_TRANSITIONS: Record<string, string[]> = {
  NEW: ['CONFIRMED', 'CANCELLED'],
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY', 'CANCELLED'],
  READY: ['OUT_FOR_DELIVERY', 'CANCELLED'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'CANCELLED'],
};

export default function OrderDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: order, isLoading } = useQuery({
    queryKey: ['admin-order', id],
    queryFn: async () => (await api.get(`/admin/orders/${id}`)).data,
  });

  const statusMutation = useMutation({
    mutationFn: async (status: string) => {
      return await api.patch(`/admin/orders/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-order', id] });
      toast.success('تم تحديث حالة الطلب بنجاح');
    },
    onError: () => {
      toast.error('فشل تحديث حالة الطلب');
    }
  });

  if (isLoading) return <div className="p-8 text-center">جاري التحميل...</div>;
  if (!order) return <div className="p-8 text-center">الطلب غير موجود</div>;

  const nextStatuses = VALID_TRANSITIONS[order.status] || [];

  return (
    <div className="p-8 space-y-6" dir="rtl">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full">
          <ArrowRight className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-bold">تفاصيل الطلب #{order.orderNumber}</h2>
        <div className="flex-1" />
        <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-md border h-10 px-4 text-sm font-medium hover:bg-gray-100">
          <Printer className="w-4 h-4" /> طباعة الفاتورة
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          {/* Items Table */}
          <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
            <div className="p-4 border-b bg-gray-50 font-bold">المنتجات</div>
            <table className="w-full text-right text-sm">
              <thead className="bg-gray-50/50 border-b">
                <tr>
                  <th className="px-4 py-3 font-medium">المنتج</th>
                  <th className="px-4 py-3 font-medium">السعر</th>
                  <th className="px-4 py-3 font-medium">الكمية</th>
                  <th className="px-4 py-3 font-medium">الإجمالي</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {order.items.map((item: any) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3">
                      <div className="font-medium">{item.productName}</div>
                      {item.sizeName && <div className="text-xs text-gray-500">الحجم: {item.sizeName}</div>}
                      {item.addons?.length > 0 && (
                        <div className="text-xs text-gray-400">الإضافات: {item.addons.map((a: any) => a.nameAr).join('، ')}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">{formatCurrency(item.unitPrice)}</td>
                    <td className="px-4 py-3">x{item.quantity}</td>
                    <td className="px-4 py-3 font-medium">{formatCurrency(item.totalPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-4 bg-gray-50/50 space-y-2">
              <div className="flex justify-between text-sm">
                <span>المجموع الفرعي:</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>رسوم التوصيل:</span>
                <span>{formatCurrency(order.deliveryFee)}</span>
              </div>
              {Number(order.discount) > 0 && (
                <div className="flex justify-between text-sm text-red-600">
                  <span>الخصم:</span>
                  <span>-{formatCurrency(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>الإجمالي:</span>
                <span className="text-primary" style={{ color: '#7C5C3C' }}>{formatCurrency(order.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="rounded-xl border bg-white shadow-sm p-4">
              <h3 className="font-bold mb-2">ملاحظات العميل:</h3>
              <p className="text-sm text-gray-600">{order.notes}</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Status Update */}
          <div className="rounded-xl border bg-white shadow-sm p-6 space-y-4">
            <h3 className="font-bold border-b pb-2">حالة الطلب</h3>
            <div className="flex items-center justify-between">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${ORDER_STATUS_BADGE_CLASSES[order.status] || 'bg-gray-100 text-gray-700'}`}>
                {ORDER_STATUS_LABELS[order.status] || order.status}
              </span>
              <span className="text-xs text-gray-500">{formatDateTime(order.updatedAt)}</span>
            </div>
            
            {nextStatuses.length > 0 && (
              <div className="pt-4 space-y-2">
                <p className="text-xs text-gray-500 mb-2">تحديث الحالة إلى:</p>
                <div className="flex flex-wrap gap-2">
                  {nextStatuses.map(status => (
                    <button
                      key={status}
                      onClick={() => statusMutation.mutate(status)}
                      disabled={statusMutation.isPending}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        status === 'CANCELLED' ? 'border border-red-200 text-red-600 hover:bg-red-50' :
                        'bg-primary text-white hover:bg-primary/90'
                      }`}
                      style={status !== 'CANCELLED' ? { backgroundColor: '#7C5C3C' } : {}}
                    >
                      {ORDER_STATUS_LABELS[status] || status}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Customer Info */}
          <div className="rounded-xl border bg-white shadow-sm p-6 space-y-4">
            <h3 className="font-bold border-b pb-2">معلومات العميل</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">الاسم والرقم</p>
                  <p className="text-sm font-medium">{order.customerName}</p>
                  <p className="text-sm text-primary font-bold">{order.customerPhone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">العنوان</p>
                  <p className="text-sm">{order.address}</p>
                  {(order.buildingNumber || order.floor) && (
                    <p className="text-xs text-gray-500">بناء: {order.buildingNumber}، طابق: {order.floor}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">تاريخ الطلب</p>
                  <p className="text-sm">{formatDateTime(order.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <CreditCard className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">طريقة الدفع</p>
                  <p className="text-sm font-bold text-green-600">{order.paymentMethod === 'CASH' ? 'نقداً عند الاستلام' : 'بطاقة بنكية'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
