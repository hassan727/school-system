# 6. إدارة الجدول الدراسي

## الصفحات والمكونات
- إنشاء الجداول الدراسية
- عرض جدول كل صف
- عرض جدول كل معلم
- جدول الاختبارات

## الوظائف
- إضافة حصص دراسية وتوزيعها على الأيام والفترات
- تعيين المعلمين للحصص
- منع تعارض جداول المعلمين
- طباعة الجداول الدراسية
- إرسال الجداول للمعلمين وأولياء الأمور
- تصدير الجداول إلى Excel أو PDF

## هيكل قاعدة البيانات
```sql
-- جدول الفترات الدراسية
CREATE TABLE periods (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- جدول أيام الأسبوع
CREATE TABLE weekdays (
    id SERIAL PRIMARY KEY,
    name_ar VARCHAR(20) NOT NULL,
    name_en VARCHAR(20) NOT NULL,
    day_order INTEGER NOT NULL,
    is_weekend BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- جدول الجدول الدراسي
CREATE TABLE schedules (
    id SERIAL PRIMARY KEY,
    grade_id INTEGER NOT NULL REFERENCES grades(id),
    classroom_id INTEGER NOT NULL REFERENCES classrooms(id),
    academic_year VARCHAR(20) NOT NULL,
    semester VARCHAR(20) NOT NULL,
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- جدول تفاصيل الجدول الدراسي
CREATE TABLE schedule_details (
    id SERIAL PRIMARY KEY,
    schedule_id INTEGER NOT NULL REFERENCES schedules(id),
    weekday_id INTEGER NOT NULL REFERENCES weekdays(id),
    period_id INTEGER NOT NULL REFERENCES periods(id),
    subject_id INTEGER NOT NULL REFERENCES subjects(id),
    teacher_id INTEGER NOT NULL REFERENCES teachers(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- جدول جدول الاختبارات
CREATE TABLE exam_schedules (
    id SERIAL PRIMARY KEY,
    grade_id INTEGER NOT NULL REFERENCES grades(id),
    classroom_id INTEGER REFERENCES classrooms(id),
    academic_year VARCHAR(20) NOT NULL,
    semester VARCHAR(20) NOT NULL,
    exam_type VARCHAR(50) NOT NULL,
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- جدول تفاصيل جدول الاختبارات
CREATE TABLE exam_schedule_details (
    id SERIAL PRIMARY KEY,
    exam_schedule_id INTEGER NOT NULL REFERENCES exam_schedules(id),
    exam_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    subject_id INTEGER NOT NULL REFERENCES subjects(id),
    location VARCHAR(100),
    supervisor_id INTEGER REFERENCES teachers(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- جدول إشعارات الجدول الدراسي
CREATE TABLE schedule_notifications (
    id SERIAL PRIMARY KEY,
    schedule_id INTEGER NOT NULL REFERENCES schedules(id),
    notification_type VARCHAR(50) NOT NULL,
    recipient_type VARCHAR(50) NOT NULL,
    recipient_id INTEGER NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);
```
