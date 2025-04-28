# 1. لوحة التحكم (الداشبورد)

## الصفحات والمكونات
- عرض الإحصائيات الأساسية (عدد الطلاب، المعلمين، الإيرادات، المصروفات)
- رسوم بيانية للإيرادات والمصروفات (خطية، دائرية، شريطية)
- قائمة التنبيهات (الفواتير المتأخرة، المواعيد القادمة)
- مؤشرات الأداء الرئيسية (KPIs)

## المتطلبات الأساسية
- جميع البيانات المعروضة يجب أن تكون حقيقية من قاعدة البيانات
- دعم كامل للعمليات الحسابية في أقسام المالية والحسابات
- تصميم جذاب مع تأثيرات حركية (أنيميشن) وتفاعلات hover
- دعم استيراد وتصدير البيانات من/إلى Excel وPDF
- لا صفحات فارغة ولا روابط معطلة

## الوظائف
- جلب الإحصائيات الحقيقية من قاعدة البيانات عبر استعلامات SQL
- تحديث الرسوم البيانية لحظياً عند تغير البيانات
- إمكانية تصفية البيانات حسب الفترة الزمنية (اليوم، الأسبوع، الشهر، العام)
- روابط سريعة للانتقال إلى الأقسام ذات الصلة
- تصدير التقارير والإحصائيات إلى Excel أو PDF
- عرض تنبيهات للفواتير المتأخرة والمواعيد القادمة
- تحديث تلقائي للبيانات بشكل دوري

## هيكل قاعدة البيانات
```sql
-- جدول الإحصائيات
CREATE TABLE dashboard_statistics (
    id SERIAL PRIMARY KEY,
    statistic_name VARCHAR(100) NOT NULL,
    statistic_value NUMERIC NOT NULL,
    category VARCHAR(50) NOT NULL,
    date_recorded TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- جدول التنبيهات
CREATE TABLE dashboard_alerts (
    id SERIAL PRIMARY KEY,
    alert_title VARCHAR(200) NOT NULL,
    alert_description TEXT,
    alert_type VARCHAR(50) NOT NULL,
    priority VARCHAR(20) NOT NULL,
    related_module VARCHAR(50),
    related_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_read BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE
);

-- جدول مؤشرات الأداء
CREATE TABLE performance_indicators (
    id SERIAL PRIMARY KEY,
    indicator_name VARCHAR(100) NOT NULL,
    indicator_value NUMERIC NOT NULL,
    target_value NUMERIC,
    unit VARCHAR(20),
    category VARCHAR(50),
    period VARCHAR(20),
    date_recorded TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);
```

## واجهة المستخدم
- تصميم لوحة تحكم حديثة مع بطاقات للإحصائيات
- رسوم بيانية تفاعلية مع إمكانية التكبير والتصغير
- قائمة تنبيهات قابلة للتصفية حسب الأهمية والنوع
- عرض مؤشرات الأداء مع مقارنة بالقيم المستهدفة
- شريط تصفية زمني في أعلى الصفحة
