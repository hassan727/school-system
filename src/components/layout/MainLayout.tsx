'use client';

import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import SupabaseStatus from '@/components/ui/SupabaseStatus';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // استرجاع حالة السايدبار من التخزين المحلي
  useEffect(() => {
    // استرجاع حالة الطي
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState) {
      setIsSidebarCollapsed(savedState === 'true');
    }

    // إضافة مستمع للتغييرات في التخزين المحلي
    const handleStorageChange = () => {
      const currentState = localStorage.getItem('sidebarCollapsed');
      setIsSidebarCollapsed(currentState === 'true');
    };

    // إضافة مستمع للحدث المخصص من مكون السايدبار
    const handleSidebarStateChange = (event: any) => {
      setIsSidebarCollapsed(event.detail.collapsed);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('sidebarStateChange', handleSidebarStateChange);

    // تنظيف المستمعات عند إزالة المكون
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('sidebarStateChange', handleSidebarStateChange);
    };
  }, []);

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />

      <main className={`flex-1 transition-all duration-300 ${isSidebarCollapsed ? 'mr-20' : 'mr-64'} overflow-y-auto overflow-x-hidden no-scrollbar`}>
        <div className="p-3 min-h-screen">
          <div className="mb-4 flex justify-end">
            <SupabaseStatus />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
