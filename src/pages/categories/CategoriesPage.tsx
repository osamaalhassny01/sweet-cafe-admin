import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { getAssetUrl } from '../../lib/formatters';
import { useAuthStore } from '../../stores/authStore';
import { isAdmin } from '../../lib/permissions';

interface Category {
  id: string;
  nameAr: string;
  nameEn: string;
  description: string;
  imageUrl: string;
  sortOrder: number;
  isActive: boolean;
}

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const role = useAuthStore((state) => state.user?.role);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/admin/categories');
      return res.data as Category[];
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingCategory) {
        return await api.patch(`/admin/categories/${editingCategory.id}`, data);
      }
      return await api.post('/admin/categories', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsModalOpen(false);
      setEditingCategory(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => await api.delete(`/admin/categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('تم حذف التصنيف بنجاح');
    },
    onError: () => {
      toast.error('فشل حذف التصنيف');
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      nameAr: formData.get('nameAr'),
      nameEn: formData.get('nameEn'),
      description: formData.get('description'),
      imageUrl: formData.get('imageUrl'),
      sortOrder: parseInt(formData.get('sortOrder') as string, 10),
      isActive: formData.get('isActive') === 'on',
    };
    upsertMutation.mutate(data);
  };

  return (
    <div className="p-8 space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">التصنيفات</h2>
        <button
          onClick={() => { setEditingCategory(null); setIsModalOpen(true); }}
          className="inline-flex items-center gap-2 rounded-md bg-primary text-white hover:bg-primary/90 h-10 px-4 text-sm font-medium"
          style={{ backgroundColor: '#7C5C3C' }}
        >
          <Plus className="w-4 h-4" /> إضافة تصنيف
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full text-center py-10">جاري التحميل...</div>
        ) : categories?.length === 0 ? (
          <div className="col-span-full text-center py-10">لا توجد تصنيفات</div>
        ) : categories?.map((cat) => (
          <div key={cat.id} className="rounded-xl border bg-white shadow-sm overflow-hidden flex flex-col">
            <div className="h-40 overflow-hidden relative">
              <img src={getAssetUrl(cat.imageUrl)} 
                alt={cat.nameAr} className="w-full h-full object-cover" />
              {!cat.isActive && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">غير نشط</span>
                </div>
              )}
            </div>
            <div className="p-4 flex-1">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-lg">{cat.nameAr}</h3>
                  <p className="text-sm text-gray-500">{cat.nameEn}</p>
                </div>
                <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium">ترتيب: {cat.sortOrder}</span>
              </div>
              <p className="text-sm text-gray-600 line-clamp-2 mb-4">{cat.description}</p>
              <div className="flex justify-end gap-2 mt-auto">
                <button
                  onClick={() => { setEditingCategory(cat); setIsModalOpen(true); }}
                  className="p-2 rounded hover:bg-gray-100 text-gray-600"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                {isAdmin(role) && (
                  <button
                    onClick={() => { if (confirm('هل أنت متأكد من حذف هذا التصنيف؟')) deleteMutation.mutate(cat.id); }}
                    className="p-2 rounded hover:bg-red-50 text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b">
              <h3 className="text-xl font-bold">{editingCategory ? 'تعديل تصنيف' : 'إضافة تصنيف جديد'}</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">الاسم (بالعربية)</label>
                  <input name="nameAr" defaultValue={editingCategory?.nameAr} required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">الاسم (بالانجليزية)</label>
                  <input name="nameEn" defaultValue={editingCategory?.nameEn} required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">الوصف</label>
                <textarea name="description" defaultValue={editingCategory?.description} rows={3} className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">رابط الصورة</label>
                <input name="imageUrl" defaultValue={editingCategory?.imageUrl} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">الترتيب</label>
                  <input name="sortOrder" type="number" defaultValue={editingCategory?.sortOrder || 0} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                </div>
                <div className="flex items-center gap-2 pt-8">
                  <input name="isActive" type="checkbox" defaultChecked={editingCategory?.isActive ?? true} id="isActive" className="h-4 w-4 rounded border-gray-300" />
                  <label htmlFor="isActive" className="text-sm font-medium">نشط</label>
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

