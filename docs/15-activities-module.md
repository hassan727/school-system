# 13. إدارة الأنشطة المدرسية

## الصفحات والمكونات
- قائمة الأنشطة والفعاليات
- جدول الأنشطة
- تسجيل الطلاب في الأنشطة

## الوظائف
- إضافة أنشطة وفعاليات جديدة
- تسجيل الطلاب في الأنشطة
- تنظيم جداول الأنشطة
- توثيق إنجازات المدرسة والطلاب
- استيراد بيانات الأنشطة من Excel
- تصدير تقارير الأنشطة إلى Excel أو PDF

## هيكل قاعدة البيانات
```sql
-- جدول أنواع الأنشطة
CREATE TABLE activity_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- جدول الأنشطة
CREATE TABLE activities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    activity_type_id INTEGER NOT NULL REFERENCES activity_types(id),
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    location VARCHAR(200),
    coordinator_id INTEGER NOT NULL REFERENCES employees(id),
    max_participants INTEGER,
    fee_amount DECIMAL(10, 2) DEFAULT 0,
    requirements TEXT,
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- جدول جدول الأنشطة
CREATE TABLE activity_schedules (
    id SERIAL PRIMARY KEY,
    activity_id INTEGER NOT NULL REFERENCES activities(id),
    day_of_week INTEGER NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    location VARCHAR(200),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- جدول المشاركين في الأنشطة
CREATE TABLE activity_participants (
    id SERIAL PRIMARY KEY,
    activity_id INTEGER NOT NULL REFERENCES activities(id),
    participant_type VARCHAR(50) NOT NULL,
    participant_id INTEGER NOT NULL,
    registration_date DATE NOT NULL,
    fee_paid DECIMAL(10, 2) DEFAULT 0,
    payment_status VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- جدول حضور الأنشطة
CREATE TABLE activity_attendance (
    id SERIAL PRIMARY KEY,
    activity_id INTEGER NOT NULL REFERENCES activities(id),
    participant_id INTEGER NOT NULL REFERENCES activity_participants(id),
    attendance_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL,
    notes TEXT,
    recorded_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- جدول المسابقات
CREATE TABLE competitions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    competition_type VARCHAR(50) NOT NULL,
    level VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    location VARCHAR(200),
    organizer VARCHAR(200),
    coordinator_id INTEGER NOT NULL REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- جدول المشاركين في المسابقات
CREATE TABLE competition_participants (
    id SERIAL PRIMARY KEY,
    competition_id INTEGER NOT NULL REFERENCES competitions(id),
    participant_type VARCHAR(50) NOT NULL,
    participant_id INTEGER NOT NULL,
    category VARCHAR(100),
    registration_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL,
    result VARCHAR(50),
    position VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- جدول الإنجازات
CREATE TABLE achievements (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    achievement_date DATE NOT NULL,
    achievement_type VARCHAR(50) NOT NULL,
    level VARCHAR(50) NOT NULL,
    achiever_type VARCHAR(50) NOT NULL,
    achiever_id INTEGER NOT NULL,
    competition_id INTEGER REFERENCES competitions(id),
    certificate_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- جدول الرحلات المدرسية
CREATE TABLE school_trips (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    destination VARCHAR(200) NOT NULL,
    trip_date DATE NOT NULL,
    departure_time TIME NOT NULL,
    return_time TIME NOT NULL,
    coordinator_id INTEGER NOT NULL REFERENCES employees(id),
    max_participants INTEGER,
    fee_amount DECIMAL(10, 2) DEFAULT 0,
    requirements TEXT,
    status VARCHAR(20) NOT NULL,
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- جدول المشاركين في الرحلات
CREATE TABLE trip_participants (
    id SERIAL PRIMARY KEY,
    trip_id INTEGER NOT NULL REFERENCES school_trips(id),
    student_id INTEGER NOT NULL REFERENCES students(id),
    registration_date DATE NOT NULL,
    fee_paid DECIMAL(10, 2) DEFAULT 0,
    payment_status VARCHAR(20) NOT NULL,
    parent_consent BOOLEAN NOT NULL,
    status VARCHAR(20) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);
```
