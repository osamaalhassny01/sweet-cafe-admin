import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { Plus, Pencil, Trash2, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency, toStorageAmount, toYemeniRial } from '../../lib/formatters';

interface DeliveryZone {
  id: string;
  nameAr: string;
  nameEn: string;
  description: string;
  deliveryFee: number;
  estimatedMinutes: number;
  minOrderAmount: number;
  isActive: boolean;
}

export default function DeliveryZonesPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null);

  const { data: zones, isLoading } = useQuery<DeliveryZone[]>({
    queryKey: ['delivery-zones'],
    queryFn: async () => {
      const res = await api.get('/admin/delivery-zones');
      return res.data;
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingZone) {
        return await api.patch(`/admin/delivery-zones/${editingZone.id}`, data);
      }
      return await api.post('/admin/delivery-zones', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-zones'] });
      setIsModalOpen(false);
      setEditingZone(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => await api.delete(`/admin/delivery-zones/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['delivery-zones'] }),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      nameAr: formData.get('nameAr'),
      nameEn: formData.get('nameEn'),
      description: formData.get('description'),
      deliveryFee: toStorageAmount(formData.get('deliveryFee')),
      estimatedMinutes: parseInt(formData.get('estimatedMinutes') as string, 10),
      minOrderAmount: toStorageAmount(formData.get('minOrderAmount')),
      isActive: formData.get('isActive') === 'on',
      polygon: [], // For now, just empty array since we don't have a map editor
    };
    upsertMutation.mutate(data);
  };

  return (
    <div className="p-8 space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">مناطق التوصيل</h2>
        <button
          onClick={() => { setEditingZone(null); setIsModalOpen(true); }}
          className="inline-flex items-center gap-2 rounded-md bg-primary text-white hover:bg-primary/90 h-10 px-4 text-sm font-medium"
          style={{ backgroundColor: '#7C5C3C' }}
        >
          <Plus className="w-4 h-4" /> إضافة منطقة
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full text-center py-10">جاري التحميل...</div>
        ) : zones?.length === 0 ? (
          <div className="col-span-full text-center py-10">لا توجد مناطق توصيل</div>
        ) : zones?.map((zone) => (
          <div key={zone.id} className="rounded-xl border bg-white shadow-sm p-6 space-y-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{zone.nameAr}</h3>
                  <p className="text-sm text-gray-500">{zone.nameEn}</p>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded text-xs font-bold ${zone.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                {zone.isActive ? 'نشط' : 'غير نشط'}
              </span>
            </div>
            
            <p className="text-sm text-gray-600 line-clamp-2">{zone.description}</p>
            
            <div className="grid grid-cols-3 gap-2 pt-2 border-t">
              <div className="text-center">
                <p className="text-[10px] text-gray-500 uppercase">الرسوم</p>
                <p className="font-bold text-sm">{formatCurrency(zone.deliveryFee)}</p>
              </div>
              <div className="text-center border-x">
                <p className="text-[10px] text-gray-500 uppercase">الوقت</p>
                <p className="font-bold text-sm">{zone.estimatedMinutes} د</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-gray-500 uppercase">الحد الأدنى</p>
                <p className="font-bold text-sm">{formatCurrency(zone.minOrderAmount)}</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => { setEditingZone(zone); setIsModalOpen(true); }}
                className="p-2 rounded hover:bg-gray-100 text-gray-600">
                <Pencil className="w-4 h-4" />
              </button>
              <button onClick={() => { if (confirm('هل أنت متأكد من حذف هذه المنطقة؟')) deleteMutation.mutate(zone.id); }}
                className="p-2 rounded hover:bg-red-50 text-red-600">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b">
              <h3 className="text-xl font-bold">{editingZone ? 'تعديل منطقة' : 'إضافة منطقة جديدة'}</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">الاسم (بالعربية)</label>
                  <input name="nameAr" defaultValue={editingZone?.nameAr} required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">الاسم (بالانجليزية)</label>
                  <input name="nameEn" defaultValue={editingZone?.nameEn} required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">الوصف</label>
                <textarea name="description" defaultValue={editingZone?.description} rows={2} className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">رسوم التوصيل (ريال يمني)</label>
                  <input name="deliveryFee" type="number" min="0" step="100" defaultValue={toYemeniRial(editingZone?.deliveryFee || 0)} required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">الوقت المتوقع (د)</label>
                  <input name="estimatedMinutes" type="number" defaultValue={editingZone?.estimatedMinutes || 30} required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">الحد الأدنى للطلب (ريال يمني)</label>
                  <input name="minOrderAmount" type="number" min="0" step="100" defaultValue={toYemeniRial(editingZone?.minOrderAmount ?? 10)} required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input name="isActive" type="checkbox" defaultChecked={editingZone?.isActive ?? true} id="isActive" className="h-4 w-4 rounded border-gray-300" />
                <label htmlFor="isActive" className="text-sm font-medium">نشط</label>
              </div>
              <div className="flex justify-end gap-3 pt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="inline-flex items-center justify-center rounded-md border h-10 px-4 text-sm font-medium hover:bg-gray-100"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={upsertMutation.isPending}
                  className="inline-flex items-center justify-center rounded-md bg-primary text-white h-10 px-6 text-sm font-medium"
                  style={{ backgroundColor: '#7C5C3C' }}
                >
                  {upsertMutation.isPending ? 'جاري الحفظ...' : 'حفظ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
