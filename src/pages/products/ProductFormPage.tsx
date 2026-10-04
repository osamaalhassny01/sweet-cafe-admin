import React, { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { Plus, Trash2, Upload, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { getAssetUrl, toStorageAmount, toYemeniRial } from '../../lib/formatters';

interface ProductFormData {
  categoryId: string;
  nameAr: string;
  nameEn: string;
  description: string;
  price: number;
  oldPrice?: number;
  imageUrl: string;
  isActive: boolean;
  isAvailable: boolean;
  isFeatured: boolean;
  isBestSeller: boolean;
  sortOrder: number;
  sizes: { name: string; price: number; isDefault: boolean }[];
  addons: { nameAr: string; nameEn: string; price: number; isActive: boolean }[];
}

export default function ProductFormPage() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = React.useState(false);
  const [previewUrl, setPreviewUrl] = React.useState('');

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await api.get('/categories')).data,
  });

  const { data: product, isLoading: isLoadingProduct } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => (await api.get(`/admin/products/${id}`)).data,
    enabled: isEditing,
  });

  const { register, control, handleSubmit, watch, setValue, reset } = useForm<ProductFormData>({
    defaultValues: {
      categoryId: '',
      nameAr: '',
      nameEn: '',
      description: '',
      price: 0,
      oldPrice: undefined,
      imageUrl: '',
      isActive: true,
      isAvailable: true,
      isFeatured: false,
      isBestSeller: false,
      sortOrder: 0,
      sizes: [],
      addons: [],
    }
  });

  useEffect(() => {
    if (product) {
      reset({
        ...product,
        price: toYemeniRial(product.price),
        oldPrice: Number(product.oldPrice) > 0 ? toYemeniRial(product.oldPrice) : undefined,
        sizes: product.sizes?.map((size: ProductFormData['sizes'][number]) => ({
          ...size,
          price: toYemeniRial(size.price),
        })) || [],
        addons: product.addons?.map((addon: ProductFormData['addons'][number]) => ({
          ...addon,
          price: toYemeniRial(addon.price),
        })) || [],
      });
      if (product.imageUrl) {
        setPreviewUrl(getAssetUrl(product.imageUrl));
      }
    }
  }, [product, reset]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/admin/uploads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const imageUrl = res.data.url || `/uploads/products/${res.data.fileName}`;
      setValue('imageUrl', imageUrl);
      setPreviewUrl(getAssetUrl(imageUrl));
      toast.success('تم رفع الصورة بنجاح');
    } catch (err) {
      toast.error('فشل رفع الصورة');
    } finally {
      setUploading(false);
    }
  };

  const { fields: sizeFields, append: appendSize, remove: removeSize } = useFieldArray({
    control,
    name: 'sizes',
  });

  const { fields: addonFields, append: appendAddon, remove: removeAddon } = useFieldArray({
    control,
    name: 'addons',
  });

  const mutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const payload = {
        ...data,
        price: toStorageAmount(data.price),
        oldPrice: Number.isFinite(data.oldPrice) ? toStorageAmount(data.oldPrice) : undefined,
        sizes: data.sizes.map((size) => ({
          ...size,
          price: toStorageAmount(size.price),
        })),
        addons: data.addons.map((addon) => ({
          ...addon,
          price: toStorageAmount(addon.price),
        })),
      };

      if (isEditing) {
        return await api.patch(`/admin/products/${id}`, payload);
      } else {
        return await api.post('/admin/products', payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('تم حفظ المنتج بنجاح');
      navigate('/products');
    },
    onError: () => {
      toast.error('حدث خطأ أثناء حفظ المنتج');
    }
  });

  const onSubmit = (data: ProductFormData) => {
    mutation.mutate(data);
  };

  if (isEditing && isLoadingProduct) return <div className="p-8 dir-rtl">جاري التحميل...</div>;

  const inputClass = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6" dir="rtl">
      <h2 className="text-2xl font-bold">{isEditing ? 'تعديل المنتج' : 'إضافة منتج جديد'}</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 bg-white p-6 rounded-xl shadow-sm border text-right">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">الاسم بالعربية</label>
            <input {...register('nameAr', { required: true })} className={inputClass} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">الاسم بالإنجليزية</label>
            <input {...register('nameEn', { required: true })} dir="ltr" className={inputClass} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">التصنيف</label>
            <select 
              value={watch('categoryId')} 
              onChange={(e) => setValue('categoryId', e.target.value)}
              className={inputClass}
            >
              <option value="">اختر تصنيفاً</option>
              {categories?.map((cat: any) => (
                <option key={cat.id} value={cat.id}>{cat.nameAr}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">السعر الأساسي (ريال يمني)</label>
            <input type="number" min="0" step="100" {...register('price', { required: true, valueAsNumber: true })} className={inputClass} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">السعر قبل الخصم (ريال يمني)</label>
            <input
              type="number"
              min="0"
              step="100"
              placeholder="اختياري"
              {...register('oldPrice', { valueAsNumber: true })}
              className={inputClass}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">صورة المنتج</label>
            <div className="flex gap-4 items-center">
              <div className="relative w-24 h-24 border-2 border-dashed rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                )}
                {uploading && (
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageUpload} 
                  className="hidden" 
                  id="image-upload" 
                />
                <label 
                  htmlFor="image-upload"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md cursor-pointer transition-colors text-sm font-medium"
                >
                  <Upload className="w-4 h-4" />
                  {previewUrl ? 'تغيير الصورة' : 'رفع صورة'}
                </label>
                <p className="text-[10px] text-gray-500">يفضل استخدام صور مربعة (1:1) وبحجم أقل من 2MB</p>
                <input {...register('imageUrl', { required: true })} type="hidden" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">ترتيب العرض</label>
            <input type="number" {...register('sortOrder', { valueAsNumber: true })} className={inputClass} />
          </div>
          <div className="col-span-1 md:col-span-2 space-y-2">
            <label className="text-sm font-medium">الوصف</label>
            <textarea {...register('description', { required: true })} className={`${inputClass} h-24`} />
          </div>
        </div>

        <div className="flex flex-wrap gap-6 border p-4 rounded-lg bg-gray-50">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={watch('isActive')} onChange={(e) => setValue('isActive', e.target.checked)} className="h-4 w-4" />
            <span className="text-sm">نشط</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={watch('isAvailable')} onChange={(e) => setValue('isAvailable', e.target.checked)} className="h-4 w-4" />
            <span className="text-sm">متوفر</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={watch('isFeatured')} onChange={(e) => setValue('isFeatured', e.target.checked)} className="h-4 w-4" />
            <span className="text-sm">مميز</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={watch('isBestSeller')} onChange={(e) => setValue('isBestSeller', e.target.checked)} className="h-4 w-4" />
            <span className="text-sm">الأكثر مبيعاً</span>
          </label>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center border-b pb-2">
            <h3 className="text-lg font-bold">الأحجام (اختياري)</h3>
            <button type="button" onClick={() => appendSize({ name: '', price: 0, isDefault: false })} className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium border border-input bg-background hover:bg-accent h-9 px-3">
              <Plus className="w-4 h-4 ml-2" /> إضافة حجم
            </button>
          </div>
          {sizeFields.map((field, index) => (
            <div key={field.id} className="flex gap-4 items-end bg-gray-50 p-4 rounded-lg border">
              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium">الاسم</label>
                <input {...register(`sizes.${index}.name` as const, { required: true })} className={inputClass} />
              </div>
              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium">السعر (ريال يمني)</label>
                <input type="number" min="0" step="100" {...register(`sizes.${index}.price` as const, { required: true, valueAsNumber: true })} className={inputClass} />
              </div>
              <label className="flex items-center gap-2 pb-2">
                <input type="checkbox" checked={watch(`sizes.${index}.isDefault`)} onChange={(e) => setValue(`sizes.${index}.isDefault`, e.target.checked)} className="h-4 w-4" />
                <span className="text-sm">افتراضي</span>
              </label>
              <button type="button" onClick={() => removeSize(index)} className="inline-flex items-center justify-center rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 h-10 w-10 p-2">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center border-b pb-2">
            <h3 className="text-lg font-bold">الإضافات (اختياري)</h3>
            <button type="button" onClick={() => appendAddon({ nameAr: '', nameEn: '', price: 0, isActive: true })} className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium border border-input bg-background hover:bg-accent h-9 px-3">
              <Plus className="w-4 h-4 ml-2" /> إضافة خيار
            </button>
          </div>
          {addonFields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-gray-50 p-4 rounded-lg border">
              <div className="space-y-2">
                <label className="text-sm font-medium">الاسم (عربي)</label>
                <input {...register(`addons.${index}.nameAr` as const, { required: true })} className={inputClass} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">الاسم (إنجليزي)</label>
                <input {...register(`addons.${index}.nameEn` as const, { required: true })} dir="ltr" className={inputClass} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">السعر (ريال يمني)</label>
                <input type="number" min="0" step="100" {...register(`addons.${index}.price` as const, { required: true, valueAsNumber: true })} className={inputClass} />
              </div>
              <div className="flex justify-between items-center gap-4 pb-2">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={watch(`addons.${index}.isActive`)} onChange={(e) => setValue(`addons.${index}.isActive`, e.target.checked)} className="h-4 w-4" />
                  <span className="text-sm">نشط</span>
                </label>
                <button type="button" onClick={() => removeAddon(index)} className="inline-flex items-center justify-center rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 h-10 w-10 p-2">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-4 pt-4 border-t">
          <button type="button" onClick={() => navigate('/products')} className="inline-flex items-center justify-center rounded-md border border-input bg-background hover:bg-accent h-10 px-4">إلغاء</button>
          <button 
            type="submit" 
            disabled={mutation.isPending}
            className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-8"
          >
            {mutation.isPending ? 'جاري الحفظ...' : 'حفظ المنتج'}
          </button>
        </div>
      </form>
    </div>
  );
}
