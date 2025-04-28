'use client';

import { XMarkIcon, Bars3Icon } from '@heroicons/react/24/outline';
import { PinIcon } from '@/components/ui/icons/PinIcon';
import { PinFilledIcon } from '@/components/ui/icons/PinFilledIcon';
import Image from 'next/image';

interface SidebarHeaderProps {
  isCollapsed: boolean;
  toggleSidebar: () => void;
  isPinned?: boolean;
  togglePin?: () => void;
}

const SidebarHeader: React.FC<SidebarHeaderProps> = ({
  isCollapsed,
  toggleSidebar,
  isPinned = false,
  togglePin = () => {}
}) => {
  return (
    <div className="flex items-center justify-between p-4 border-b border-blue-800 bg-blue-900/50">
      <div className={`transition-all duration-300 flex items-center ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'}`}>
        {/* تم إزالة شعار المدرسة */}
        <h1 className="font-bold text-lg">
          مدرسة الجيل الواعد
        </h1>
      </div>
      <div className="flex items-center space-x-1 space-x-reverse">
        {!isCollapsed && (
          <button
            className="p-1.5 rounded-full hover:bg-blue-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 hover:scale-110"
            onClick={togglePin}
            title={isPinned ? "إلغاء تثبيت القائمة" : "تثبيت القائمة"}
          >
            {isPinned ? (
              <PinFilledIcon className="w-5 h-5 text-gold" />
            ) : (
              <PinIcon className="w-5 h-5" />
            )}
          </button>
        )}
        <button
          className="p-2 rounded-full hover:bg-blue-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 hover:scale-110"
          onClick={toggleSidebar}
          title={isCollapsed ? "توسيع القائمة" : "طي القائمة"}
        >
          {isCollapsed ? <Bars3Icon className="w-6 h-6" /> : <XMarkIcon className="w-6 h-6" />}
        </button>
      </div>
    </div>
  );
};

export default SidebarHeader;
