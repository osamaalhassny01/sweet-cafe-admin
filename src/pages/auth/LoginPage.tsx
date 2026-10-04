import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../services/api';
import { Lock, Mail, Key } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authMode, setAuthMode] = useState<'JWT' | 'API_KEY'>('JWT');
  
  const navigate = useNavigate();
  const { login, loginWithApiKey } = useAuthStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (authMode === 'JWT') {
        const res = await api.post('/admin/auth/login', { email, password });
        login(res.data.accessToken, res.data.user);
        toast.success('تم تسجيل الدخول بنجاح');
      } else {
        // Validate API Key by trying an admin endpoint
        await api.get('/admin/orders?page=1&limit=1', { 
          headers: { 'x-admin-key': apiKey } 
        });
        loginWithApiKey(apiKey);
        toast.success('تم تسجيل الدخول بواسطة مفتاح API');
      }
      navigate('/');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل تسجيل الدخول');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4" dir="rtl">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">كافي بن</h1>
          <p className="text-gray-500">لوحة الإدارة والتحكم</p>
        </div>

        <div className="flex p-1 bg-gray-100 rounded-lg">
          <button
            onClick={() => setAuthMode('JWT')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${authMode === 'JWT' ? 'bg-white shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700'}`}
          >
            بريد إلكتروني
          </button>
          <button
            onClick={() => setAuthMode('API_KEY')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${authMode === 'API_KEY' ? 'bg-white shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700'}`}
          >
            مفتاح API
          </button>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {authMode === 'JWT' ? (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">البريد الإلكتروني</label>
                <div className="relative">
                  <Mail className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pr-10 pl-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    placeholder="admin@example.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">كلمة المرور</label>
                <div className="relative">
                  <Lock className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pr-10 pl-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">مفتاح API الخاص بالنظام</label>
              <div className="relative">
                <Key className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  required
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full pr-10 pl-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  placeholder="أدخل مفتاح API هنا"
                />
              </div>
              <p className="text-xs text-gray-400">يستخدم هذا الخيار للمطورين أو كخيار طوارئ.</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary text-white py-3 rounded-lg font-bold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
            style={{ backgroundColor: '#7C5C3C' }}
          >
            {isLoading ? 'جاري التحقق...' : 'دخول اللوحة'}
          </button>
        </form>
      </div>
    </div>
  );
}
