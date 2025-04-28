'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronDownIcon, ChevronLeftIcon } from '@heroicons/react/24/outline';

interface SidebarItemProps {
  title: string;
  icon: React.ReactNode;
  href?: string;
  children?: React.ReactNode;
  isActive?: boolean;
  isCollapsed?: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({
  title,
  icon,
  href,
  children,
  isActive,
  isCollapsed = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = Boolean(children);

  // فتح القائمة تلقائيًا إذا كان أحد العناصر الفرعية نشطًا
  useEffect(() => {
    if (isActive && hasChildren) {
      setIsOpen(true);
    }
  }, [isActive, hasChildren]);

  // إذا كان السايدبار مطويًا، نعرض فقط الأيقونة مع تلميح عند التحويم
  if (isCollapsed) {
    return (
      <div className="mb-2 relative group">
        {href ? (
          <Link href={href}>
            <div
              className={`flex items-center justify-center p-3 rounded-lg transition-all duration-300 ${
                isActive
                  ? 'bg-blue-dark text-white shadow-md'
                  : 'text-gray-100 hover:bg-blue-800/60'
              }`}
            >
              <span className="w-6 h-6">{icon}</span>
              {isActive && (
                <span className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-gold rounded-full"></span>
              )}
            </div>
          </Link>
        ) : (
          <button
            className={`w-full flex items-center justify-center p-3 rounded-lg transition-all duration-300 ${
              isOpen || isActive
                ? 'bg-blue-dark text-white shadow-md'
                : 'text-gray-100 hover:bg-blue-800/60'
            }`}
            onClick={() => setIsOpen(!isOpen)}
          >
            <span className="w-6 h-6">{icon}</span>
            {(isOpen || isActive) && (
              <span className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-gold rounded-full"></span>
            )}
          </button>
        )}

        {/* تلميح عند التحويم */}
        <div className="absolute right-full top-0 mr-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
          <div className="bg-blue-dark text-white py-2 px-3 rounded-md shadow-lg whitespace-nowrap">
            {title}
            {hasChildren && <span className="mr-1 text-xs text-gold"> (انقر للتوسيع)</span>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-2">
      {href && !hasChildren ? (
        <Link href={href}>
          <div
            className={`flex items-center p-3 rounded-lg transition-all duration-300 ${
              isActive
                ? 'bg-blue-dark text-white shadow-md'
                : 'text-gray-100 hover:bg-blue-800/60 hover:translate-x-1'
            }`}
          >
            <span className="w-6 h-6 ml-3 flex-shrink-0">{icon}</span>
            <span className="flex-1 font-medium">{title}</span>
            {isActive && (
              <span className="w-1.5 h-8 bg-gold rounded-full ml-2"></span>
            )}
          </div>
        </Link>
      ) : (
        <>
          <button
            className={`w-full flex items-center justify-between p-3 rounded-lg transition-all duration-300 ${
              isOpen || isActive
                ? 'bg-blue-dark text-white shadow-md'
                : 'text-gray-100 hover:bg-blue-800/60 hover:translate-x-1'
            }`}
            onClick={() => setIsOpen(!isOpen)}
          >
            <div className="flex items-center">
              <span className="w-6 h-6 ml-3 flex-shrink-0">{icon}</span>
              <span className="font-medium">{title}</span>
            </div>
            {hasChildren && (
              <span className="w-5 h-5 transition-transform duration-300 bg-blue-800/40 rounded-full flex items-center justify-center" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }}>
                {isOpen ? <ChevronDownIcon className="w-4 h-4" /> : <ChevronLeftIcon className="w-4 h-4" />}
              </span>
            )}
          </button>
          {hasChildren && (
            <div
              className={`overflow-hidden transition-all duration-300 ${
                isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="pr-4 mr-3 mt-2 border-r-2 border-gold/50">
                {children}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SidebarItem;
