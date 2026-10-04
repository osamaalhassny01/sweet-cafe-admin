import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { Plus, Pencil, Trash2, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useAuthStore } from '../../stores/authStore';
import { isAdmin } from '../../lib/permissions';

interface Offer {
  id: string;
  titleAr: string;
  titleEn: string;
  description: string;
  imageUrl: string;
  discountPercent: number;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
}

export default function OffersPage() {
  const queryClient = useQueryClient();
  const role = useAuthStore((state) => state.user?.role);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);

  const { data: offers, isLoading } = useQuery<Offer[]>({
    queryKey: ['offers'],
    queryFn: async () => {
      const res = await api.get('/admin/offers');
      return res.data as Offer[];
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingOffer) {
        return await api.patch(`/admin/offers/${editingOffer.id}`, data);
      }
      return await api.post('/admin/offers', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offers'] });
      setIsModalOpen(false);
      setEditingOffer(null);
      toast.success('تم حفظ العرض بنجاح');
    },
    onError: () => {
      toast.error('فشل حفظ العرض');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => await api.delete(`/admin/offers/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['offers'] }),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      titleAr: formData.get('titleAr'),
      titleEn: formData.get('titleEn'),
      description: formData.get('description'),
      imageUrl: formData.get('imageUrl'),
      discountPercent: parseInt(formData.get('discountPercent') as string, 10),
      startsAt: new Date(formData.get('startsAt') as string).toISOString(),
      endsAt: new Date(formData.get('endsAt') as string).toISOString(),
      isActive: formData.get('isActive') === 'on',
    };
    upsertMutation.mutate(data);
  };

  return (
    <div className="p-8 space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">العروض</h2>
        <button
          onClick={() => { setEditingOffer(null); setIsModalOpen(true); }}
          className="inline-flex items-center gap-2 rounded-md bg-primary text-white hover:bg-primary/90 h-10 px-4 text-sm font-medium"
          style={{ backgroundColor: '#7C5C3C' }}
        >
          <Plus className="w-4 h-4" /> إضافة عرض
        </button>
      </div>

      <div className="rounded-md border bg-white shadow-sm overflow-hidden">
        <table className="w-full text-right text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 font-medium">العنوان</th>
              <th className="px-4 py-3 font-medium">الخصم</th>
              <th className="px-4 py-3 font-medium">الفترة</th>
              <th className="px-4 py-3 font-medium">الحالة</th>
              <th className="px-4 py-3 font-medium">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr><td colSpan={5} className="text-center py-10">جاري التحميل...</td></tr>
            ) : offers?.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-10">لا توجد عروض</td></tr>
            ) : offers?.map((offer) => (
              <tr key={offer.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-medium">{offer.titleAr}</div>
                  <div className="text-xs text-muted-foreground">{offer.titleEn}</div>
                </td>
                <td className="px-4 py-3 font-bold text-red-600">{offer.discountPercent}%</td>
                <td className="px-4 py-3 text-muted-foreground">
                  <div className="flex items-center gap-1 text-xs">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(offer.startsAt), 'yyyy-MM-dd')} إلى {format(new Date(offer.endsAt), 'yyyy-MM-dd')}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {offer.isActive ? (
                    <span className="px-2 py-0.5 rounded text-xs bg-green-100 text-green-700">نشط</span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700">غير نشط</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingOffer(offer); setIsModalOpen(true); }}
                      className="p-1.5 rounded hover:bg-gray-100 text-gray-600">
                      <Pencil className="w-4 h-4" />
                    </button>
                    {isAdmin(role) && (
                      <button onClick={() => { if (confirm('هل أنت متأكد من حذف هذا العرض؟')) deleteMutation.mutate(offer.id); }}
                        className="p-1.5 rounded hover:bg-red-50 text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b">
              <h3 className="text-xl font-bold">{editingOffer ? 'تعديل عرض' : 'إضافة عرض جديد'}</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">العنوان (بالعربية)</label>
                  <input name="titleAr" defaultValue={editingOffer?.titleAr} required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">العنوان (بالانجليزية)</label>
                  <input name="titleEn" defaultValue={editingOffer?.titleEn} required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">الوصف</label>
                <textarea name="description" defaultValue={editingOffer?.description} rows={2} className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">رابط الصورة</label>
                <input name="imageUrl" defaultValue={editingOffer?.imageUrl} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">نسبة الخصم (%)</label>
                  <input name="discountPercent" type="number" min="0" max="100" defaultValue={editingOffer?.discountPercent || 0} required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                </div>
                <div className="flex items-center gap-2 pt-8">
                  <input name="isActive" type="checkbox" defaultChecked={editingOffer?.isActive ?? true} id="isActive" className="h-4 w-4 rounded border-gray-300" />
                  <label htmlFor="isActive" className="text-sm font-medium">نشط</label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">تاريخ البدء</label>
                  <input name="startsAt" type="datetime-local" defaultValue={editingOffer ? format(new Date(editingOffer.startsAt), "yyyy-MM-dd'T'HH:mm") : ''} required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">تاريخ الانتهاء</label>
                  <input name="endsAt" type="datetime-local" defaultValue={editingOffer ? format(new Date(editingOffer.endsAt), "yyyy-MM-dd'T'HH:mm") : ''} required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                </div>
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
