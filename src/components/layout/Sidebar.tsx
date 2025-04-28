'use client';

import { useState, useEffect } from 'react';
import SidebarHeader from './SidebarHeader';
import SidebarContent from './SidebarContent';

const Sidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isPinned, setIsPinned] = useState(false);

  // حفظ حالة السايدبار في التخزين المحلي
  useEffect(() => {
    // استرجاع حالة الطي
    const savedCollapseState = localStorage.getItem('sidebarCollapsed');
    if (savedCollapseState) {
      setIsCollapsed(savedCollapseState === 'true');
    }

    // استرجاع حالة التثبيت
    const savedPinState = localStorage.getItem('sidebarPinned');
    if (savedPinState) {
      setIsPinned(savedPinState === 'true');
    }
  }, []);

  // تحديث التخزين المحلي عند تغيير حالة طي السايدبار
  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', String(newState));

    // إرسال حدث مخصص لإعلام المكونات الأخرى بتغيير حالة السايدبار
    const event = new CustomEvent('sidebarStateChange', {
      detail: { collapsed: newState }
    });
    window.dispatchEvent(event);
  };

  // تحديث التخزين المحلي عند تغيير حالة تثبيت السايدبار
  const togglePin = () => {
    const newState = !isPinned;
    setIsPinned(newState);
    localStorage.setItem('sidebarPinned', String(newState));

    // إرسال حدث مخصص لإعلام المكونات الأخرى بتغيير حالة تثبيت السايدبار
    const event = new CustomEvent('sidebarPinChange', {
      detail: { pinned: newState }
    });
    window.dispatchEvent(event);
  };

  return (
    <div
      className={`h-screen bg-gradient-to-b from-blue-900 to-blue-dark text-white transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      } fixed top-0 right-0 z-40 shadow-xl ${
        isPinned ? 'sidebar-pinned' : ''
      } border-l border-blue-800/30 overflow-y-auto overflow-x-hidden no-scrollbar`}
      onMouseEnter={() => !isPinned && isCollapsed && setIsCollapsed(false)}
      onMouseLeave={() => !isPinned && !isCollapsed && setIsCollapsed(true)}
    >
      <SidebarHeader
        isCollapsed={isCollapsed}
        toggleSidebar={toggleSidebar}
        isPinned={isPinned}
        togglePin={togglePin}
      />
      <SidebarContent isCollapsed={isCollapsed} />

      {/* زر تبديل حالة السايدبار عند الطي */}
      {isCollapsed && (
        <div
          className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-blue-800 hover:bg-blue-700 p-1 rounded-r-md cursor-pointer transition-all duration-300 hover:shadow-md"
          onClick={toggleSidebar}
          title="توسيع القائمة"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
