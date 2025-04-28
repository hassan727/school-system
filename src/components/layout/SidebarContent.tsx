'use client';

import { usePathname } from 'next/navigation';
import SidebarItem from './SidebarItem';
import {
  HomeIcon,
  UserGroupIcon,
  BanknotesIcon,
  UserIcon,
  ClipboardDocumentCheckIcon,
  CalendarIcon,
  DocumentTextIcon,
  UsersIcon,
  ArchiveBoxIcon,
  BookOpenIcon,
  TruckIcon,
  EnvelopeIcon,
  TicketIcon,
  HeartIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ChevronRightIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';

interface SidebarContentProps {
  isCollapsed: boolean;
}

const SidebarContent: React.FC<SidebarContentProps> = ({ isCollapsed }) => {
  const pathname = usePathname();

  return (
    <div className="p-3 overflow-y-auto h-[calc(100vh-64px)] no-scrollbar space-y-1">
      {/* 1. لوحة التحكم (الداشبورد) */}
      <SidebarItem
        title="لوحة التحكم"
        icon={<HomeIcon />}
        href="/dashboard"
        isActive={pathname === '/dashboard'}
        isCollapsed={isCollapsed}
      />

      {/* 2. إدارة الطلاب */}
      <SidebarItem
        title="إدارة الطلاب"
        icon={<UserGroupIcon />}
        isActive={pathname.startsWith('/students')}
        isCollapsed={isCollapsed}
      >
        <SidebarItem
          title="قائمة الطلاب"
          icon={<ChevronRightIcon className="w-5 h-5" />}
          href="/students"
          isActive={pathname === '/students'}
        />
        <SidebarItem
          title="إضافة طالب"
          icon={<ChevronRightIcon className="w-5 h-5" />}
          href="/students/add"
          isActive={pathname === '/students/add'}
        />
        <SidebarItem
          title="بحث متقدم"
          icon={<ChevronRightIcon className="w-5 h-5" />}
          href="/students/search"
          isActive={pathname === '/students/search'}
        />
        <SidebarItem
          title="استيراد وتصدير"
          icon={<ChevronRightIcon className="w-5 h-5" />}
          href="/students/import-export"
          isActive={pathname === '/students/import-export'}
        />
        <SidebarItem
          title="استيراد ديناميكي"
          icon={<ChevronRightIcon className="w-5 h-5" />}
          href="/students/dynamic-import"
          isActive={pathname === '/students/dynamic-import'}
        />
        <SidebarItem
          title="تقارير الطلاب"
          icon={<ChevronRightIcon className="w-5 h-5" />}
          href="/students/reports"
          isActive={pathname === '/students/reports'}
        />
      </SidebarItem>



      {/* 3. إدارة المالية والرسوم المدرسية */}
      <SidebarItem
        title="إدارة المالية"
        icon={<BanknotesIcon />}
        isActive={pathname.startsWith('/finance')}
        isCollapsed={isCollapsed}
      >
        <SidebarItem
          title="لوحة التحكم المالية"
          icon={<ChevronRightIcon className="w-5 h-5" />}
          href="/finance/dashboard"
          isActive={pathname === '/finance/dashboard'}
        />
        <SidebarItem
          title="الرسوم الدراسية"
          icon={<ChevronRightIcon className="w-5 h-5" />}
          href="/finance/fees"
          isActive={pathname === '/finance/fees'}
        />
        <SidebarItem
          title="المدفوعات"
          icon={<ChevronRightIcon className="w-5 h-5" />}
          href="/finance/payments"
          isActive={pathname === '/finance/payments'}
        />
        <SidebarItem
          title="المصروفات"
          icon={<ChevronRightIcon className="w-5 h-5" />}
          href="/finance/expenses"
          isActive={pathname === '/finance/expenses'}
        />
        <SidebarItem
          title="سندات القبض والصرف"
          icon={<ChevronRightIcon className="w-5 h-5" />}
          href="/finance/receipts"
          isActive={pathname === '/finance/receipts'}
        />
        <SidebarItem
          title="التقارير المالية"
          icon={<ChevronRightIcon className="w-5 h-5" />}
          href="/finance/reports"
          isActive={pathname === '/finance/reports'}
        />
      </SidebarItem>

      {/* 4. إدارة المعلمين والموظفين */}
      <SidebarItem
        title="إدارة المعلمين"
        icon={<UserIcon />}
        isActive={pathname.startsWith('/staff')}
        isCollapsed={isCollapsed}
      >
        <SidebarItem
          title="قائمة المعلمين"
          icon={<ChevronRightIcon className="w-5 h-5" />}
          href="/staff"
          isActive={pathname === '/staff'}
        />
        <SidebarItem
          title="إضافة معلم"
          icon={<ChevronRightIcon className="w-5 h-5" />}
          href="/staff/add"
          isActive={pathname === '/staff/add'}
        />
        <SidebarItem
          title="الرواتب والحوافز"
          icon={<ChevronRightIcon className="w-5 h-5" />}
          href="/staff/salaries"
          isActive={pathname === '/staff/salaries'}
        />
        <SidebarItem
          title="تقييم الأداء"
          icon={<ChevronRightIcon className="w-5 h-5" />}
          href="/staff/evaluation"
          isActive={pathname === '/staff/evaluation'}
        />
      </SidebarItem>

      {/* 5. إدارة الحضور والغياب */}
      <SidebarItem
        title="الحضور والغياب"
        icon={<ClipboardDocumentCheckIcon />}
        isActive={pathname.startsWith('/attendance')}
        isCollapsed={isCollapsed}
      >
        <SidebarItem
          title="تسجيل الحضور"
          icon={<ChevronRightIcon className="w-5 h-5" />}
          href="/attendance/record"
          isActive={pathname === '/attendance/record'}
        />
        <SidebarItem
          title="تقارير الحضور"
          icon={<ChevronRightIcon className="w-5 h-5" />}
          href="/attendance/reports"
          isActive={pathname === '/attendance/reports'}
        />
        <SidebarItem
          title="الإجازات والاستئذان"
          icon={<ChevronRightIcon className="w-5 h-5" />}
          href="/attendance/leaves"
          isActive={pathname === '/attendance/leaves'}
        />
      </SidebarItem>

      {/* 6. إدارة الجدول الدراسي */}
      <SidebarItem
        title="الجدول الدراسي"
        icon={<CalendarIcon />}
        isActive={pathname.startsWith('/schedule')}
        isCollapsed={isCollapsed}
      >
        <SidebarItem
          title="جدول الفصول"
          icon={<ChevronRightIcon className="w-5 h-5" />}
          href="/schedule/classes"
          isActive={pathname === '/schedule/classes'}
        />
        <SidebarItem
          title="جدول المعلمين"
          icon={<ChevronRightIcon className="w-5 h-5" />}
          href="/schedule/teachers"
          isActive={pathname === '/schedule/teachers'}
        />
        <SidebarItem
          title="إدارة الحصص"
          icon={<ChevronRightIcon className="w-5 h-5" />}
          href="/schedule/periods"
          isActive={pathname === '/schedule/periods'}
        />
      </SidebarItem>

      {/* 7. إدارة الاختبارات والدرجات */}
      <SidebarItem
        title="الاختبارات والدرجات"
        icon={<DocumentTextIcon />}
        isActive={pathname.startsWith('/exams')}
        isCollapsed={isCollapsed}
      >
        <SidebarItem
          title="جدول الاختبارات"
          icon={<ChevronRightIcon className="w-5 h-5" />}
          href="/exams/schedule"
          isActive={pathname === '/exams/schedule'}
        />
        <SidebarItem
          title="تسجيل الدرجات"
          icon={<ChevronRightIcon className="w-5 h-5" />}
          href="/exams/grades"
          isActive={pathname === '/exams/grades'}
        />
        <SidebarItem
          title="كشوف الدرجات"
          icon={<ChevronRightIcon className="w-5 h-5" />}
          href="/exams/reports"
          isActive={pathname === '/exams/reports'}
        />
        <SidebarItem
          title="تحليل النتائج"
          icon={<ChevronRightIcon className="w-5 h-5" />}
          href="/exams/analysis"
          isActive={pathname === '/exams/analysis'}
        />
      </SidebarItem>

      {/* 8. بوابة أولياء الأمور */}
      <SidebarItem
        title="بوابة أولياء الأمور"
        icon={<UsersIcon />}
        isActive={pathname.startsWith('/parents')}
        isCollapsed={isCollapsed}
      >
        <SidebarItem
          title="قائمة أولياء الأمور"
          icon={<ChevronRightIcon className="w-5 h-5" />}
          href="/parents"
          isActive={pathname === '/parents'}
        />
        <SidebarItem
          title="التواصل مع الأهالي"
          icon={<ChevronRightIcon className="w-5 h-5" />}
          href="/parents/communication"
          isActive={pathname === '/parents/communication'}
        />
        <SidebarItem
          title="إدارة الحسابات"
          icon={<ChevronRightIcon className="w-5 h-5" />}
          href="/parents/accounts"
          isActive={pathname === '/parents/accounts'}
        />
      </SidebarItem>

      {/* 9. إدارة المخزون والأصول */}
      <SidebarItem
        title="المخزون والأصول"
        icon={<ArchiveBoxIcon />}
        isActive={pathname.startsWith('/inventory')}
        isCollapsed={isCollapsed}
      >
        <SidebarItem
          title="المخزون"
          icon={<ChevronRightIcon className="w-5 h-5" />}
          href="/inventory/stock"
          isActive={pathname === '/inventory/stock'}
        />
        <SidebarItem
          title="الأصول"
          icon={<ChevronRightIcon className="w-5 h-5" />}
          href="/inventory/assets"
          isActive={pathname === '/inventory/assets'}
        />
        <SidebarItem
          title="المشتريات"
          icon={<ChevronRightIcon className="w-5 h-5" />}
          href="/inventory/purchases"
          isActive={pathname === '/inventory/purchases'}
        />
      </SidebarItem>

      {/* 10. إدارة المكتبة المدرسية */}
      <SidebarItem
        title="المكتبة المدرسية"
        icon={<BookOpenIcon />}
        isActive={pathname.startsWith('/library')}
        isCollapsed={isCollapsed}
      >
        <SidebarItem
          title="قائمة الكتب"
          icon={<ChevronRightIcon className="w-5 h-5" />}
          href="/library/books"
          isActive={pathname === '/library/books'}
        />
        <SidebarItem
          title="الاستعارة والإرجاع"
          icon={<ChevronRightIcon className="w-5 h-5" />}
          href="/library/borrowing"
          isActive={pathname === '/library/borrowing'}
        />
        <SidebarItem
          title="أعضاء المكتبة"
          icon={<ChevronRightIcon className="w-5 h-5" />}
          href="/library/members"
          isActive={pathname === '/library/members'}
        />
      </SidebarItem>

      {/* 11. إدارة النقل المدرسي */}
      <SidebarItem
        title="النقل المدرسي"
        icon={<TruckIcon />}
        isActive={pathname.startsWith('/transportation')}
        isCollapsed={isCollapsed}
      >
        <SidebarItem
          title="الحافلات"
          icon={<ChevronRightIcon className="w-5 h-5" />}
          href="/transportation/buses"
          isActive={pathname === '/transportation/buses'}
        />
        <SidebarItem
          title="المسارات"
          icon={<ChevronRightIcon className="w-5 h-5" />}
          href="/transportation/routes"
          isActive={pathname === '/transportation/routes'}
        />
        <SidebarItem
          title="السائقين"
          icon={<ChevronRightIcon className="w-5 h-5" />}
          href="/transportation/drivers"
          isActive={pathname === '/transportation/drivers'}
        />
        <SidebarItem
          title="الطلاب المشتركين"
          icon={<ChevronRightIcon className="w-5 h-5" />}
          href="/transportation/students"
          isActive={pathname === '/transportation/students'}
        />
      </SidebarItem>

      {/* 12. نظام المراسلات والإشعارات */}
      <SidebarItem
        title="المراسلات والإشعارات"
        icon={<EnvelopeIcon />}
        isActive={pathname.startsWith('/notifications')}
        isCollapsed={isCollapsed}
      >
        <SidebarItem
          title="الرسائل"
          icon={<ChevronRightIcon className="w-5 h-5" />}
          href="/notifications/messages"
          isActive={pathname === '/notifications/messages'}
        />
        <SidebarItem
          title="الإشعارات"
          icon={<ChevronRightIcon className="w-5 h-5" />}
          href="/notifications/alerts"
          isActive={pathname === '/notifications/alerts'}
        />
        <SidebarItem
          title="إرسال جماعي"
          icon={<ChevronRightIcon className="w-5 h-5" />}
          href="/notifications/bulk"
          isActive={pathname === '/notifications/bulk'}
        />
      </SidebarItem>

      {/* 13. إدارة الأنشطة المدرسية */}
      <SidebarItem
        title="الأنشطة المدرسية"
        icon={<TicketIcon />}
        isActive={pathname.startsWith('/activities')}
        isCollapsed={isCollapsed}
      >
        <SidebarItem
          title="قائمة الأنشطة"
          icon={<ChevronRightIcon className="w-5 h-5" />}
          href="/activities"
          isActive={pathname === '/activities'}
        />
        <SidebarItem
          title="إضافة نشاط"
          icon={<ChevronRightIcon className="w-5 h-5" />}
          href="/activities/add"
          isActive={pathname === '/activities/add'}
        />
        <SidebarItem
          title="المشاركين"
          icon={<ChevronRightIcon className="w-5 h-5" />}
          href="/activities/participants"
          isActive={pathname === '/activities/participants'}
        />
      </SidebarItem>

      {/* 14. إدارة الصحة المدرسية */}
      <SidebarItem
        title="الصحة المدرسية"
        icon={<HeartIcon />}
        isActive={pathname.startsWith('/health')}
        isCollapsed={isCollapsed}
      >
        <SidebarItem
          title="السجلات الصحية"
          icon={<ChevronRightIcon className="w-5 h-5" />}
          href="/health/records"
          isActive={pathname === '/health/records'}
        />
        <SidebarItem
          title="زيارات العيادة"
          icon={<ChevronRightIcon className="w-5 h-5" />}
          href="/health/visits"
          isActive={pathname === '/health/visits'}
        />
        <SidebarItem
          title="التطعيمات"
          icon={<ChevronRightIcon className="w-5 h-5" />}
          href="/health/vaccinations"
          isActive={pathname === '/health/vaccinations'}
        />
      </SidebarItem>

      {/* 15. التقارير والإحصائيات */}
      <SidebarItem
        title="التقارير والإحصائيات"
        icon={<ChartBarIcon />}
        isActive={pathname.startsWith('/reports')}
        isCollapsed={isCollapsed}
      >
        <SidebarItem
          title="تقارير الطلاب"
          icon={<ChevronRightIcon className="w-5 h-5" />}
          href="/reports/students"
          isActive={pathname === '/reports/students'}
        />
        <SidebarItem
          title="تقارير مالية"
          icon={<ChevronRightIcon className="w-5 h-5" />}
          href="/reports/financial"
          isActive={pathname === '/reports/financial'}
        />
        <SidebarItem
          title="تقارير أكاديمية"
          icon={<ChevronRightIcon className="w-5 h-5" />}
          href="/reports/academic"
          isActive={pathname === '/reports/academic'}
        />
        <SidebarItem
          title="تقارير إدارية"
          icon={<ChevronRightIcon className="w-5 h-5" />}
          href="/reports/administrative"
          isActive={pathname === '/reports/administrative'}
        />
        <SidebarItem
          title="إنشاء تقرير مخصص"
          icon={<ChevronRightIcon className="w-5 h-5" />}
          href="/reports/custom"
          isActive={pathname === '/reports/custom'}
        />
      </SidebarItem>

      {/* 16. الإعدادات والتكوين */}
      <SidebarItem
        title="الإعدادات"
        icon={<Cog6ToothIcon />}
        isActive={pathname.startsWith('/settings')}
        isCollapsed={isCollapsed}
      >
        <SidebarItem
          title="إعدادات المدرسة"
          icon={<ChevronRightIcon className="w-5 h-5" />}
          href="/settings/school"
          isActive={pathname === '/settings/school'}
        />
        <SidebarItem
          title="إعدادات النظام"
          icon={<ChevronRightIcon className="w-5 h-5" />}
          href="/settings/system"
          isActive={pathname === '/settings/system'}
        />
        <SidebarItem
          title="إدارة المستخدمين"
          icon={<ChevronRightIcon className="w-5 h-5" />}
          href="/settings/users"
          isActive={pathname === '/settings/users'}
        />
        <SidebarItem
          title="الصلاحيات والأدوار"
          icon={<ChevronRightIcon className="w-5 h-5" />}
          href="/settings/roles"
          isActive={pathname === '/settings/roles'}
        />
        <SidebarItem
          title="النسخ الاحتياطي"
          icon={<ChevronRightIcon className="w-5 h-5" />}
          href="/settings/backup"
          isActive={pathname === '/settings/backup'}
        />
      </SidebarItem>
    </div>
  );
};

export default SidebarContent;
