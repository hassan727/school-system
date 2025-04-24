# 8. بوابة أولياء الأمور

## الصفحات والمكونات
- لوحة معلومات ولي الأمر
- عرض بيانات الأبناء (الحضور، الدرجات، الرسوم)
- نظام التواصل مع إدارة المدرسة والمعلمين

## الوظائف
- تسجيل دخول أولياء الأمور
- عرض حالة الحضور والغياب
- عرض الدرجات والتقديرات
- عرض الرسوم المدفوعة والمستحقة
- إرسال واستقبال الرسائل مع المعلمين والإدارة
- استلام إشعارات المدرسة

## هيكل قاعدة البيانات
```sql
-- جدول حسابات أولياء الأمور
CREATE TABLE parent_accounts (
    id SERIAL PRIMARY KEY,
    guardian_id INTEGER NOT NULL REFERENCES guardians(id),
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- جدول رسائل أولياء الأمور
CREATE TABLE parent_messages (
    id SERIAL PRIMARY KEY,
    sender_type VARCHAR(20) NOT NULL,
    sender_id INTEGER NOT NULL,
    receiver_type VARCHAR(20) NOT NULL,
    receiver_id INTEGER NOT NULL,
    subject VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE NOT NULL,
    read_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) NOT NULL,
    parent_message_id INTEGER REFERENCES parent_messages(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- جدول إشعارات أولياء الأمور
CREATE TABLE parent_notifications (
    id SERIAL PRIMARY KEY,
    parent_account_id INTEGER NOT NULL REFERENCES parent_accounts(id),
    notification_type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    related_entity_type VARCHAR(50),
    related_entity_id INTEGER,
    sent_at TIMESTAMP WITH TIME ZONE NOT NULL,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- جدول سجل دخول أولياء الأمور
CREATE TABLE parent_login_history (
    id SERIAL PRIMARY KEY,
    parent_account_id INTEGER NOT NULL REFERENCES parent_accounts(id),
    login_time TIMESTAMP WITH TIME ZONE NOT NULL,
    logout_time TIMESTAMP WITH TIME ZONE,
    ip_address VARCHAR(50) NOT NULL,
    device_info TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- جدول تفضيلات أولياء الأمور
CREATE TABLE parent_preferences (
    id SERIAL PRIMARY KEY,
    parent_account_id INTEGER NOT NULL REFERENCES parent_accounts(id),
    notification_email BOOLEAN DEFAULT TRUE,
    notification_sms BOOLEAN DEFAULT TRUE,
    notification_app BOOLEAN DEFAULT TRUE,
    language VARCHAR(10) DEFAULT 'ar',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);
```
