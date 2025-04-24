# 15. التقارير والإحصائيات

## الصفحات والمكونات
- تقارير تحليلية عن أداء الطلاب
- تقارير مقارنة بين الصفوف
- تقارير مالية متقدمة
- تقارير إدارية شاملة

## الوظائف
- إنشاء تقارير مخصصة
- تصفية التقارير حسب معايير متعددة
- رسوم بيانية توضيحية
- تصدير التقارير إلى Excel أو PDF
- جدولة التقارير الدورية

## هيكل قاعدة البيانات
```sql
-- جدول أنواع التقارير
CREATE TABLE report_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    query_template TEXT,
    parameters TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- جدول التقارير المحفوظة
CREATE TABLE saved_reports (
    id SERIAL PRIMARY KEY,
    report_type_id INTEGER NOT NULL REFERENCES report_types(id),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    parameters JSONB,
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- جدول التقارير المجدولة
CREATE TABLE scheduled_reports (
    id SERIAL PRIMARY KEY,
    saved_report_id INTEGER NOT NULL REFERENCES saved_reports(id),
    schedule_type VARCHAR(50) NOT NULL,
    frequency VARCHAR(50) NOT NULL,
    day_of_week INTEGER,
    day_of_month INTEGER,
    time_of_day TIME NOT NULL,
    recipients TEXT NOT NULL,
    format VARCHAR(20) NOT NULL,
    last_run TIMESTAMP WITH TIME ZONE,
    next_run TIMESTAMP WITH TIME ZONE,
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- جدول سجل تنفيذ التقارير
CREATE TABLE report_execution_logs (
    id SERIAL PRIMARY KEY,
    report_id INTEGER NOT NULL,
    report_type VARCHAR(50) NOT NULL,
    execution_time TIMESTAMP WITH TIME ZONE NOT NULL,
    duration INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL,
    error_message TEXT,
    parameters JSONB,
    output_format VARCHAR(20),
    output_size INTEGER,
    executed_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- جدول لوحات المعلومات
CREATE TABLE dashboards (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    layout JSONB,
    is_public BOOLEAN DEFAULT FALSE,
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- جدول عناصر لوحات المعلومات
CREATE TABLE dashboard_widgets (
    id SERIAL PRIMARY KEY,
    dashboard_id INTEGER NOT NULL REFERENCES dashboards(id),
    widget_type VARCHAR(50) NOT NULL,
    title VARCHAR(100) NOT NULL,
    data_source VARCHAR(200) NOT NULL,
    query TEXT,
    parameters JSONB,
    position_x INTEGER NOT NULL,
    position_y INTEGER NOT NULL,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    chart_type VARCHAR(50),
    chart_options JSONB,
    refresh_interval INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- جدول مؤشرات الأداء الرئيسية
CREATE TABLE kpi_definitions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    calculation_method TEXT NOT NULL,
    unit VARCHAR(20),
    target_value DECIMAL(10, 2),
    min_threshold DECIMAL(10, 2),
    max_threshold DECIMAL(10, 2),
    comparison_period VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- جدول قيم مؤشرات الأداء
CREATE TABLE kpi_values (
    id SERIAL PRIMARY KEY,
    kpi_id INTEGER NOT NULL REFERENCES kpi_definitions(id),
    period_type VARCHAR(20) NOT NULL,
    period_value VARCHAR(20) NOT NULL,
    value DECIMAL(10, 2) NOT NULL,
    target_value DECIMAL(10, 2),
    variance DECIMAL(10, 2),
    variance_percentage DECIMAL(5, 2),
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);
```
