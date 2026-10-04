import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Shield, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../services/api';
import { AdminRole, ROLE_LABELS } from '../../lib/permissions';
import { formatDateTime } from '../../lib/formatters';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  isActive: boolean;
  createdAt: string;
}

const defaultForm = {
  name: '',
  email: '',
  password: '',
  role: 'ORDERS_STAFF' as AdminRole,
  isActive: true,
};

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);

  const { data: users, isLoading } = useQuery<AdminUser[]>({
    queryKey: ['admin-users'],
    queryFn: async () => (await api.get('/admin/auth/users')).data as AdminUser[],
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof defaultForm) => {
      const payload = {
        ...data,
        password: data.password || undefined,
      };

      if (editingUser) {
        return api.patch(`/admin/auth/users/${editingUser.id}`, payload);
      }
      return api.post('/admin/auth/register', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setIsModalOpen(false);
      setEditingUser(null);
      toast.success('تم حفظ الموظف بنجاح');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'فشل حفظ الموظف');
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/admin/auth/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('تم تعطيل الحساب');
    },
  });

  const openCreate = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const openEdit = (user: AdminUser) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  return (
    <div className="p-8 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">الموظفون والصلاحيات</h2>
          <p className="text-sm text-gray-500">حدد من يدير الطلبات ومن يدير المنتجات ومن يملك صلاحيات المدير.</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-white hover:bg-primary/90"
          style={{ backgroundColor: '#7C5C3C' }}
        >
          <Plus className="h-4 w-4" />
          إضافة موظف
        </button>
      </div>

      <div className="overflow-hidden rounded-md border bg-white shadow-sm">
        <table className="w-full text-right text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-4 py-3 font-medium">الموظف</th>
              <th className="px-4 py-3 font-medium">الدور</th>
              <th className="px-4 py-3 font-medium">الحالة</th>
              <th className="px-4 py-3 font-medium">تاريخ الإضافة</th>
              <th className="px-4 py-3 font-medium">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="py-10 text-center">جاري التحميل...</td>
              </tr>
            ) : users?.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-10 text-center">لا يوجد موظفون</td>
              </tr>
            ) : (
              users?.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-bold">{user.name}</div>
                    <div className="text-xs text-gray-500">{user.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-700">
                      <Shield className="h-3 w-3" />
                      {ROLE_LABELS[user.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded px-2 py-0.5 text-xs font-bold ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {user.isActive ? 'نشط' : 'معطل'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{formatDateTime(user.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(user)} className="rounded p-1.5 text-gray-600 hover:bg-gray-100">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('هل تريد تعطيل هذا الحساب؟')) deactivateMutation.mutate(user.id);
                        }}
                        className="rounded p-1.5 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <AdminUserModal
          user={editingUser}
          isSaving={saveMutation.isPending}
          onClose={() => setIsModalOpen(false)}
          onSubmit={(data) => saveMutation.mutate(data)}
        />
      )}
    </div>
  );
}

function AdminUserModal({
  user,
  isSaving,
  onClose,
  onSubmit,
}: {
  user: AdminUser | null;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (data: typeof defaultForm) => void;
}) {
  const [form, setForm] = useState({
    ...defaultForm,
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    role: user?.role || defaultForm.role,
    isActive: user?.isActive ?? true,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="border-b p-6">
          <h3 className="text-xl font-bold">{user ? 'تعديل موظف' : 'إضافة موظف'}</h3>
        </div>
        <form
          className="space-y-4 p-6"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit(form);
          }}
        >
          <div className="space-y-2">
            <label className="text-sm font-medium">الاسم</label>
            <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required className={inputClass} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">البريد الإلكتروني</label>
            <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required className={inputClass} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">كلمة السر {user ? '(اتركها فارغة بدون تغيير)' : ''}</label>
            <input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required={!user} minLength={6} className={inputClass} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">الدور</label>
            <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as AdminRole })} className={inputClass}>
              {Object.entries(ROLE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} />
            <span className="text-sm font-medium">نشط</span>
          </label>
          <div className="flex justify-end gap-3 border-t pt-5">
            <button type="button" onClick={onClose} className="inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-medium hover:bg-gray-100">
              إلغاء
            </button>
            <button type="submit" disabled={isSaving} className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-white disabled:opacity-60" style={{ backgroundColor: '#7C5C3C' }}>
              {isSaving ? 'جاري الحفظ...' : 'حفظ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputClass =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
