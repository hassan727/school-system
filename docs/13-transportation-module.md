# 11. إدارة النقل المدرسي

## الصفحات والمكونات
- قائمة الحافلات والسائقين
- مسارات النقل والمحطات
- سجل الطلاب المشتركين في النقل

## الوظائف
- إضافة حافلات وسائقين
- تحديد مسارات النقل والمحطات
- تسجيل اشتراك الطلاب في النقل
- متابعة حركة الحافلات
- حساب رسوم النقل
- استيراد بيانات النقل من Excel
- تصدير تقارير النقل إلى Excel أو PDF

## هيكل قاعدة البيانات
```sql
-- جدول الحافلات
CREATE TABLE vehicles (
    id SERIAL PRIMARY KEY,
    vehicle_number VARCHAR(50) NOT NULL UNIQUE,
    vehicle_type VARCHAR(50) NOT NULL,
    model VARCHAR(100) NOT NULL,
    capacity INTEGER NOT NULL,
    registration_number VARCHAR(50) NOT NULL,
    license_expiry DATE NOT NULL,
    insurance_expiry DATE NOT NULL,
    status VARCHAR(20) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- جدول السائقين
CREATE TABLE drivers (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id),
    license_number VARCHAR(50) NOT NULL,
    license_type VARCHAR(50) NOT NULL,
    license_expiry DATE NOT NULL,
    experience_years INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- جدول مسارات النقل
CREATE TABLE routes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    start_location VARCHAR(200) NOT NULL,
    end_location VARCHAR(200) NOT NULL,
    distance DECIMAL(10, 2) NOT NULL,
    estimated_time INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- جدول محطات المسارات
CREATE TABLE route_stops (
    id SERIAL PRIMARY KEY,
    route_id INTEGER NOT NULL REFERENCES routes(id),
    stop_name VARCHAR(200) NOT NULL,
    stop_order INTEGER NOT NULL,
    arrival_time TIME,
    departure_time TIME,
    location_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- جدول تعيين الحافلات والسائقين للمسارات
CREATE TABLE route_assignments (
    id SERIAL PRIMARY KEY,
    route_id INTEGER NOT NULL REFERENCES routes(id),
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
    driver_id INTEGER NOT NULL REFERENCES drivers(id),
    assistant_id INTEGER REFERENCES employees(id),
    start_date DATE NOT NULL,
    end_date DATE,
    schedule_type VARCHAR(50) NOT NULL,
    morning_departure_time TIME,
    afternoon_departure_time TIME,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- جدول اشتراكات الطلاب في النقل
CREATE TABLE transportation_subscriptions (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id),
    route_id INTEGER NOT NULL REFERENCES routes(id),
    route_stop_id INTEGER NOT NULL REFERENCES route_stops(id),
    subscription_type VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    pickup_required BOOLEAN NOT NULL,
    dropoff_required BOOLEAN NOT NULL,
    fee_amount DECIMAL(10, 2) NOT NULL,
    payment_status VARCHAR(20) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- جدول سجل حركة الحافلات
CREATE TABLE vehicle_movement_logs (
    id SERIAL PRIMARY KEY,
    route_assignment_id INTEGER NOT NULL REFERENCES route_assignments(id),
    movement_date DATE NOT NULL,
    movement_type VARCHAR(20) NOT NULL,
    departure_time TIME NOT NULL,
    arrival_time TIME,
    odometer_start INTEGER NOT NULL,
    odometer_end INTEGER,
    fuel_consumption DECIMAL(10, 2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- جدول حضور الطلاب في النقل
CREATE TABLE transportation_attendance (
    id SERIAL PRIMARY KEY,
    subscription_id INTEGER NOT NULL REFERENCES transportation_subscriptions(id),
    attendance_date DATE NOT NULL,
    movement_type VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    notes TEXT,
    recorded_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- جدول صيانة الحافلات
CREATE TABLE vehicle_maintenance (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
    maintenance_date DATE NOT NULL,
    maintenance_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    cost DECIMAL(10, 2) NOT NULL,
    performed_by VARCHAR(100) NOT NULL,
    odometer_reading INTEGER NOT NULL,
    next_maintenance_date DATE,
    next_maintenance_odometer INTEGER,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);
```
