'use client';

import React, { useState, useEffect } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  onClose?: () => void;
}

const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  duration = 5000,
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isEntering, setIsEntering] = useState(true);

  // تأثير الظهور
  useEffect(() => {
    // إزالة تأثير الظهور بعد 300 مللي ثانية
    const enterTimer = setTimeout(() => {
      setIsEntering(false);
    }, 300);

    return () => clearTimeout(enterTimer);
  }, []);

  // تأثير الاختفاء والإزالة
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLeaving(true);
      // إضافة تأخير للانتقال قبل إزالة الإشعار
      setTimeout(() => {
        setIsVisible(false);
        if (onClose) onClose();
      }, 500); // مدة الانتقال
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-100 border-green-500 text-green-800 dark:bg-green-900/30 dark:border-green-600 dark:text-green-300';
      case 'error':
        return 'bg-red-100 border-red-500 text-red-800 dark:bg-red-900/30 dark:border-red-600 dark:text-red-300';
      case 'warning':
        return 'bg-amber-100 border-amber-500 text-amber-800 dark:bg-amber-900/30 dark:border-amber-600 dark:text-amber-300';
      case 'info':
      default:
        return 'bg-blue-100 border-blue-500 text-blue-800 dark:bg-blue-900/30 dark:border-blue-600 dark:text-blue-300';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'error':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case 'warning':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'info':
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  if (!isVisible) return null;

  return (
    <div
      className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 flex items-center p-4 mb-4 border-r-4 rounded-md shadow-lg ${getTypeStyles()}
      transition-all duration-500 ease-in-out min-w-[350px] max-w-[500px] w-auto
      ${isLeaving ? 'opacity-0 translate-y-[-20px]' : isEntering ? 'opacity-0 translate-y-[20px]' : 'opacity-100 translate-y-0'}`}
    >
      <div className="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 ml-3">
        {getIcon()}
      </div>
      <div className="text-base font-medium px-3 flex-grow">{message}</div>
      <button
        type="button"
        className="mr-2 bg-transparent text-gray-500 rounded-lg p-1.5 inline-flex h-8 w-8 hover:bg-gray-200 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-white"
        onClick={() => {
          setIsLeaving(true);
          setTimeout(() => {
            setIsVisible(false);
            if (onClose) onClose();
          }, 500);
        }}
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
        </svg>
      </button>
    </div>
  );
};

export default Toast;
