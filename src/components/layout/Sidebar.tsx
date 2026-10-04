import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Tags, 
  Gift, 
  MapPin, 
  LogOut,
  Users,
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { AdminRole, hasAccess } from '../../lib/permissions';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { name: 'لوحة القيادة', path: '/', icon: LayoutDashboard },
  { name: 'الطلبات', path: '/orders', icon: ShoppingCart, roles: ['ORDERS_STAFF'] as AdminRole[] },
  { name: 'المنتجات', path: '/products', icon: Package, roles: ['PRODUCTS_STAFF'] as AdminRole[] },
  { name: 'التصنيفات', path: '/categories', icon: Tags, roles: ['PRODUCTS_STAFF'] as AdminRole[] },
  { name: 'العروض', path: '/offers', icon: Gift, roles: ['PRODUCTS_STAFF'] as AdminRole[] },
  { name: 'مناطق التوصيل', path: '/zones', icon: MapPin, roles: ['ADMIN'] as AdminRole[] },
  { name: 'الموظفون', path: '/users', icon: Users, roles: ['ADMIN'] as AdminRole[] },
];

export default function Sidebar() {
  const location = useLocation();
  const logout = useAuthStore(state => state.logout);
  const role = useAuthStore(state => state.user?.role);

  return (
    <div className="flex h-screen w-64 flex-col bg-slate-900 text-white border-l border-slate-800" dir="rtl">
      <div className="flex h-16 items-center justify-center border-b border-slate-800 px-6">
        <h1 className="text-xl font-bold tracking-wider">Kafi Bun</h1>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-3">
          {navItems.filter((item) => hasAccess(role, item.roles)).map((item) => {
            const isActive = location.pathname === item.path || 
                             (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-colors mb-1',
                  isActive 
                    ? 'bg-slate-800 text-white' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                )}
              >
                <item.icon className={cn("ml-3 h-5 w-5 flex-shrink-0", isActive ? "text-amber-500" : "text-slate-400")} />
                {item.name}
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-slate-800 p-4">
        <button
          onClick={logout}
          className="flex w-full items-center rounded-md px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-red-500/10 hover:text-red-500"
        >
          <LogOut className="ml-3 h-5 w-5 flex-shrink-0" />
          تسجيل الخروج
        </button>
      </div>
    </div>
  );
}
