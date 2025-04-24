# 2. إدارة الطلاب

## الصفحات والمكونات
- قائمة الطلاب (جدول مع خيارات التصفية والفرز)
- صفحة إضافة طالب جديد
- صفحة تفاصيل الطالب (البيانات الشخصية، السجل الأكاديمي، السجل المالي)
- نموذج تعديل بيانات الطالب

## معلومات الطالب الأساسية
- الاسم الرباعي (الأول والثاني والثالث والأخير)
- تاريخ الميلاد (حقل إدخال تاريخ)
- الرقم القومي (مع التحقق من صحة التنسيق)
- الديانة (الإسلام، المسيحية)
- العنوان الكامل
- النوع (ذكر/أنثى)
- حالة الطالب في المدرسة (مقيد، منقول، راسب، متفوق، غائب) مع إمكانية اختيار أكثر من حالة
- صورة شخصية للطالب

## معلومات الاتصال
- رقمان للهاتف خاصين بولي الأمر
- البريد الإلكتروني لولي الأمر
- صلة القرابة بالطالب

## المعلومات الأكاديمية
- المرحلة الدراسية (من الصف الأول الابتدائي إلى الصف الثالث الثانوي)
- الفصل (يتغير ديناميكياً بناءً على المرحلة المختارة)
- تاريخ الالتحاق

## البيانات المالية
- الرسوم الدراسية (تظهر تلقائياً بناءً على المرحلة المختارة)
- الخصومات (قيمة ثابتة وسبب الخصم)
- الإجمالي بعد الخصم
- طريقة السداد (كامل، أقساط)
- تفاصيل الأقساط (في حالة اختيار الدفع بالأقساط)
- سجل المدفوعات

## الوظائف
- إضافة طالب جديد مع التحقق من البيانات المدخلة
- تعديل بيانات الطلاب
- حذف طالب (مع تأكيد)
- البحث عن طالب (بالاسم، رقم الهوية، الصف)
- تصفية الطلاب حسب الصف، القسم، الحالة
- استيراد بيانات الطلاب من ملف Excel
- تصدير بيانات الطلاب إلى Excel أو PDF
- عرض الرسوم المدفوعة والمتبقية لكل طالب

## التقارير
- تقرير بيانات الطلاب
- إحصائيات الطلاب حسب الصف والقسم
- قائمة الطلاب المتفوقين
- قائمة الطلاب المتأخرين في سداد الرسوم

## هيكل قاعدة البيانات
```sql
-- جدول الطلاب
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    second_name VARCHAR(50) NOT NULL,
    third_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    birth_date DATE NOT NULL,
    national_id VARCHAR(14) NOT NULL UNIQUE,
    religion VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    gender VARCHAR(10) NOT NULL,
    status VARCHAR(100)[] NOT NULL,
    profile_image_url TEXT,
    enrollment_date DATE NOT NULL,
    grade_id INTEGER NOT NULL REFERENCES grades(id),
    classroom_id INTEGER NOT NULL REFERENCES classrooms(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- جدول أولياء الأمور
CREATE TABLE guardians (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id),
    relation_type VARCHAR(50) NOT NULL,
    phone_number1 VARCHAR(20) NOT NULL,
    phone_number2 VARCHAR(20),
    email VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- جدول المراحل الدراسية
CREATE TABLE grades (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    level INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- جدول الفصول
CREATE TABLE classrooms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    grade_id INTEGER NOT NULL REFERENCES grades(id),
    capacity INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- جدول حالات الطلاب
CREATE TABLE student_statuses (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id),
    status VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);
```
