'use client';

import { useState, useEffect } from 'react';
import { checkSupabaseConnection } from '@/lib/supabase';

interface SupabaseStatusProps {
  className?: string;
}

const SupabaseStatus: React.FC<SupabaseStatusProps> = ({ className }) => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkConnection = async () => {
      setIsChecking(true);
      try {
        const connected = await checkSupabaseConnection();
        setIsConnected(connected);
      } catch (error) {
        console.error('Error checking Supabase connection:', error);
        setIsConnected(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkConnection();
  }, []);

  if (isChecking) {
    return (
      <div className={`flex items-center space-x-1 space-x-reverse ${className}`}>
        <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse"></div>
        <span className="text-xs text-gray-500">جاري التحقق من الاتصال...</span>
      </div>
    );
  }

  if (isConnected) {
    return (
      <div className={`flex items-center space-x-1 space-x-reverse ${className}`}>
        <div className="w-2 h-2 rounded-full bg-green-500"></div>
        <span className="text-xs text-green-600 dark:text-green-400">متصل بقاعدة البيانات</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-1 space-x-reverse ${className}`}>
      <div className="w-2 h-2 rounded-full bg-red-500"></div>
      <span className="text-xs text-red-600 dark:text-red-400">غير متصل بقاعدة البيانات</span>
    </div>
  );
};

export default SupabaseStatus;
