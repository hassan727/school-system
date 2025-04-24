# متطلبات التصميم

## السايدبار
- سايدبار مرن قابل للطي والتوسيع بتصميم عصري وأنيق
- يمكن للمستخدم التحكم في عرضه (توسعة/طي/تثبيت) حسب الحاجة
- يحتوي على كافة الأقسام المذكورة مع تنظيمها بشكل متسلسل
- سهم انسيابي بجانب كل قسم رئيسي يظهر قائمة منسدلة بالصفحات الفرعية
- متجاوب مع جميع أحجام الشاشات (حاسوب، لوحي، جوال)
- تأثيرات انتقالية أنيقة عند طي وتوسعة السايدبار وعند فتح القوائم الفرعية

## الأيقونات والتفاعلات
- استخدام أيقونات معبرة لكل وظيفة (إضافة، تعديل، حذف، عرض)
- كل أيقونة تنفذ وظيفة محددة وتظهر تأكيد عند الحاجة
- تأثيرات hover جذابة عند تمرير المؤشر فوق العناصر
- أنيميشن سلس للانتقالات والتفاعلات

## الألوان والتنسيقات
تدرجات من الأزرق مع لمسات من الذهبي/البرتقالي ألوان مقترحة:

- أزرق داكن: #1E3A8A
- أزرق متوسط: #2563EB
- أزرق فاتح: #93C5FD
- ذهبي/برتقالي: #F59E0B
- رمادي فاتح: #F3F4F6
- أبيض: #FFFFFF
- أسود/رمادي داكن: #111827

### تطبيق الألوان
- استخدام الأزرق الداكن للعناصر الرئيسية (الهيدر، السايدبار)
- استخدام الأزرق المتوسط للأزرار الرئيسية والروابط
- استخدام الأزرق الفاتح للخلفيات الثانوية والتظليل
- استخدام الذهبي/البرتقالي للعناصر التي تحتاج لإبراز (مؤشرات، تنبيهات)
- استخدام الرمادي الفاتح للخلفيات البديلة والفواصل
- استخدام الأبيض للخلفيات الرئيسية والنصوص على الخلفيات الداكنة
- استخدام الأسود/الرمادي الداكن للنصوص الرئيسية

### الخطوط
- استخدام خط Cairo للعناوين والنصوص البارزة
- استخدام خط Tajawal للنصوص العادية
- حجم الخط للعناوين الرئيسية: 24px
- حجم الخط للعناوين الفرعية: 18px
- حجم الخط للنصوص العادية: 14px
- حجم الخط للنصوص الصغيرة: 12px
- ضبط اتجاه النص من اليمين إلى اليسار (RTL) في جميع أجزاء النظام

### تناسق التصميم
- استخدام نفس نمط الزوايا المستديرة في جميع العناصر (8px للعناصر الكبيرة، 4px للعناصر الصغيرة)
- استخدام نفس أسلوب الظلال للبطاقات والعناصر البارزة
- الحفاظ على مسافات متناسقة بين العناصر (8px، 16px، 24px، 32px)
- استخدام نفس أسلوب الحدود للجداول والنماذج
- تطبيق نفس أسلوب التفاعل (hover، focus، active) على جميع العناصر التفاعلية

## الجداول والنماذج
- جداول متجاوبة مع خيارات الفرز والتصفية والبحث
- نماذج ذات تحقق فوري للإدخالات
- رسائل تأكيد وإشعارات واضحة
- استخدام modals للتفاعلات القصيرة
- زخارف ولمسات إسلامية بسيطة في التصميم (اختياري)

## تنفيذ التصميم باستخدام Tailwind CSS
```typescript
// مثال لتنفيذ السايدبار باستخدام Tailwind CSS
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { 
  ChevronDownIcon, 
  ChevronRightIcon, 
  MenuIcon, 
  XIcon 
} from '@heroicons/react/outline';

interface SidebarItemProps {
  title: string;
  icon: React.ReactNode;
  href?: string;
  children?: React.ReactNode;
  isActive?: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ 
  title, 
  icon, 
  href, 
  children, 
  isActive 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = Boolean(children);

  return (
    <div className="mb-1">
      {href && !hasChildren ? (
        <Link href={href}>
          <a 
            className={`flex items-center p-3 rounded-md transition-all duration-200 ${
              isActive 
                ? 'bg-blue-700 text-white' 
                : 'text-gray-100 hover:bg-blue-700/50'
            }`}
          >
            <span className="w-6 h-6 mr-3">{icon}</span>
            <span className="flex-1">{title}</span>
          </a>
        </Link>
      ) : (
        <>
          <button
            className={`w-full flex items-center justify-between p-3 rounded-md transition-all duration-200 ${
              isOpen || isActive 
                ? 'bg-blue-700 text-white' 
                : 'text-gray-100 hover:bg-blue-700/50'
            }`}
            onClick={() => setIsOpen(!isOpen)}
          >
            <div className="flex items-center">
              <span className="w-6 h-6 mr-3">{icon}</span>
              <span>{title}</span>
            </div>
            {hasChildren && (
              <span className="w-5 h-5 transition-transform duration-200" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }}>
                {isOpen ? <ChevronDownIcon /> : <ChevronRightIcon />}
              </span>
            )}
          </button>
          {hasChildren && (
            <div 
              className={`overflow-hidden transition-all duration-300 ${
                isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="pr-3 mr-3 mt-1 border-r-2 border-blue-500">
                {children}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const Sidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const router = useRouter();

  return (
    <div 
      className={`h-screen bg-blue-900 text-white transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      } fixed top-0 right-0 z-40 shadow-lg`}
    >
      <div className="flex items-center justify-between p-4 border-b border-blue-800">
        <h1 className={`font-bold text-xl transition-opacity duration-200 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
          مدرسة الجيل الواعد
        </h1>
        <button 
          className="p-1 rounded-full hover:bg-blue-800 transition-colors duration-200"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? <MenuIcon className="w-6 h-6" /> : <XIcon className="w-6 h-6" />}
        </button>
      </div>

      <div className="p-4 overflow-y-auto h-[calc(100vh-64px)]">
        {/* هنا يتم إضافة عناصر السايدبار */}
      </div>
    </div>
  );
};

export default Sidebar;
```
