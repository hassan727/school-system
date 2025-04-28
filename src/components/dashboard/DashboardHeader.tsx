'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';

interface DashboardHeaderProps {
  title: string;
  subtitle: string;
  actions?: {
    label: string;
    href: string;
    variant: 'primary' | 'outline' | 'secondary';
  }[];
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ title, subtitle, actions = [] }) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">{title}</h1>
        <p className="text-gray-600 dark:text-gray-400">
          {subtitle}
        </p>
      </div>
      {actions.length > 0 && (
        <div className="mt-4 md:mt-0 flex space-x-2 space-x-reverse">
          {actions.map((action, index) => (
            <Link key={index} href={action.href}>
              <Button variant={action.variant} size="sm">
                {action.label}
              </Button>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardHeader;
