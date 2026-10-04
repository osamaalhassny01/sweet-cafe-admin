import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { Plus, Pencil, Trash2, Package } from 'lucide-react';
import { formatCurrency, getAssetUrl } from '../../lib/formatters';
import { useAuthStore } from '../../stores/authStore';
import { isAdmin } from '../../lib/permissions';

interface Product {
  id: string;
  nameAr: string;
  nameEn: string;
  price: number;
  imageUrl: string;
  isActive: boolean;
  isAvailable: boolean;
  isFeatured: boolean;
  isBestSeller: boolean;
  category?: { id: string; nameAr: string };
}

export default function ProductsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const role = useAuthStore((state) => state.user?.role);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await api.get('/categories')).data,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', page, search, categoryFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });
      if (search) params.append('search', search);
      if (categoryFilter) params.append('categoryId', categoryFilter);
      const res = await api.get(`/admin/products?${params.toString()}`);
      return res.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => await api.delete(`/admin/products/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-products'] }),
  });

  const products: Product[] = data?.data || [];
  const meta = data?.meta || { totalPages: 1 };

  return (
    <div className="p-8 space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">المنتجات</h2>
        <button
          onClick={() => navigate('/products/new')}
          className="inline-flex items-center gap-2 rounded-md bg-primary text-white hover:bg-primary/90 h-10 px-4 text-sm font-medium"
          style={{ backgroundColor: '#7C5C3C' }}
        >
          <Plus className="w-4 h-4" /> إضافة منتج
        </button>
      </div>

      <div className="flex gap-4">
        <input
          placeholder="بحث عن منتج..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="flex h-10 w-64 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <select
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
          className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">كل التصنيفات</option>
          {categories?.map((cat: any) => (
            <option key={cat.id} value={cat.id}>{cat.nameAr}</option>
          ))}
        </select>
      </div>

      <div className="rounded-md border bg-white shadow-sm overflow-hidden">
        <table className="w-full text-right text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 font-medium">الصورة</th>
              <th className="px-4 py-3 font-medium">الاسم</th>
              <th className="px-4 py-3 font-medium">التصنيف</th>
              <th className="px-4 py-3 font-medium">السعر</th>
              <th className="px-4 py-3 font-medium">الحالة</th>
              <th className="px-4 py-3 font-medium">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr><td colSpan={6} className="text-center py-10">جاري التحميل...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-10">لا توجد منتجات</td></tr>
            ) : products.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  {product.imageUrl ? (
                    <img src={getAssetUrl(product.imageUrl)}
                      alt={product.nameAr} className="w-10 h-10 rounded object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-gray-400">
                      <Package className="w-5 h-5" />
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium">{product.nameAr}</div>
                  <div className="text-xs text-muted-foreground">{product.nameEn}</div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{product.category?.nameAr || '—'}</td>
                <td className="px-4 py-3">{formatCurrency(product.price)}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 flex-wrap">
                    {product.isActive ? (
                      <span className="px-1.5 py-0.5 rounded text-xs bg-green-100 text-green-700">نشط</span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-700">غير نشط</span>
                    )}
                    {!product.isAvailable && <span className="px-1.5 py-0.5 rounded text-xs bg-red-100 text-red-700">غير متوفر</span>}
                    {product.isFeatured && <span className="px-1.5 py-0.5 rounded text-xs bg-blue-100 text-blue-700">مميز</span>}
                    {product.isBestSeller && <span className="px-1.5 py-0.5 rounded text-xs bg-amber-100 text-amber-700">الأكثر مبيعاً</span>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => navigate(`/products/edit/${product.id}`)}
                      className="p-1.5 rounded hover:bg-gray-100 text-gray-600">
                      <Pencil className="w-4 h-4" />
                    </button>
                    {isAdmin(role) && (
                      <button onClick={() => { if (confirm('هل أنت متأكد من حذف هذا المنتج؟')) deleteMutation.mutate(product.id); }}
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

      {/* Pagination */}
      <div className="flex items-center justify-end gap-4">
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
          className="inline-flex h-9 px-3 items-center rounded-md border text-sm disabled:opacity-50">السابق</button>
        <span className="text-sm">صفحة {page} من {meta.totalPages}</span>
        <button onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))} disabled={page >= meta.totalPages}
          className="inline-flex h-9 px-3 items-center rounded-md border text-sm disabled:opacity-50">التالي</button>
      </div>
    </div>
  );
}
