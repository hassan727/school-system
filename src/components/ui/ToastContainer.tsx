'use client';

import React, { useState, useEffect } from 'react';
import Toast from './Toast';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastData {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContainerProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

// إنشاء متغير عالمي لتخزين الدالة التي تضيف الإشعارات
let addToastFunction: ((toast: Omit<ToastData, 'id'>) => void) | null = null;

// دالة عامة لإضافة إشعار جديد
export const showToast = (message: string, type: ToastType = 'info', duration: number = 5000) => {
  if (addToastFunction) {
    addToastFunction({ message, type, duration });
  } else {
    console.warn('Toast container not initialized yet');
  }
};

const ToastContainer: React.FC<ToastContainerProps> = ({ position = 'top-center' }) => {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  // تحديد موضع الإشعارات
  const getPositionClasses = () => {
    switch (position) {
      case 'top-right':
        return 'top-4 right-4';
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-center':
        return 'bottom-4 left-1/2 transform -translate-x-1/2';
      case 'top-center':
      default:
        return 'top-4 left-1/2 transform -translate-x-1/2';
    }
  };

  // دالة لإضافة إشعار جديد
  const addToast = (toast: Omit<ToastData, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prevToasts => [...prevToasts, { ...toast, id }]);
  };

  // دالة لإزالة إشعار
  const removeToast = (id: string) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  };

  // تسجيل دالة إضافة الإشعارات عند تحميل المكون
  useEffect(() => {
    addToastFunction = addToast;
    return () => {
      addToastFunction = null;
    };
  }, []);

  return (
    <div className={`fixed z-50 flex flex-col items-center space-y-6 ${getPositionClasses()}`}>
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};

export default ToastContainer;
