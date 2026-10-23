-- 04_add_faculty_profile_fields.sql
-- Complete Faculty Profile, Academic Information & Workload Management Schema

-- 1. Extend faculties table with personal, academic, retention, workload and research fields
ALTER TABLE faculties
ADD COLUMN IF NOT EXISTS employment_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS pan VARCHAR(20),
ADD COLUMN IF NOT EXISTS aicte_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS rgpv_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS highest_qualification VARCHAR(100),
ADD COLUMN IF NOT EXISTS has_phd BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS phd_university VARCHAR(150),
ADD COLUMN IF NOT EXISTS phd_award_date DATE,
ADD COLUMN IF NOT EXISTS pg_detail VARCHAR(150),
ADD COLUMN IF NOT EXISTS pg_specialization VARCHAR(150),
ADD COLUMN IF NOT EXISTS pg_university VARCHAR(150),
ADD COLUMN IF NOT EXISTS pg_year INTEGER,
ADD COLUMN IF NOT EXISTS ug_detail VARCHAR(150),
ADD COLUMN IF NOT EXISTS ug_specialization VARCHAR(150),
ADD COLUMN IF NOT EXISTS ug_university VARCHAR(150),
ADD COLUMN IF NOT EXISTS ug_year INTEGER,
ADD COLUMN IF NOT EXISTS remarks TEXT,
ADD COLUMN IF NOT EXISTS teaching_experience_years DOUBLE PRECISION DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS industry_experience_years DOUBLE PRECISION DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS aitr_service_years DOUBLE PRECISION DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS current_designation_since DATE,
ADD COLUMN IF NOT EXISTS previous_institute VARCHAR(200),
ADD COLUMN IF NOT EXISTS retention_category VARCHAR(10),
ADD COLUMN IF NOT EXISTS sci_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS scopus_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ugc_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS books_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS book_chapters_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS patents_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS projects_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS consultancy_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS google_scholar_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS orcid_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS scopus_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS theory_load_hours INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS lab_load_hours INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS project_guide_details TEXT,
ADD COLUMN IF NOT EXISTS mentoring_details TEXT,
ADD COLUMN IF NOT EXISTS admin_duties TEXT,
ADD COLUMN IF NOT EXISTS faculty_documents JSONB;

-- 2. Create faculty_promotions table
CREATE TABLE IF NOT EXISTS faculty_promotions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    faculty_id UUID NOT NULL REFERENCES faculties(user_id) ON DELETE CASCADE,
    designation VARCHAR(100) NOT NULL,
    promotion_date DATE,
    is_professor BOOLEAN DEFAULT FALSE,
    is_associate BOOLEAN DEFAULT FALSE,
    is_assistant BOOLEAN DEFAULT FALSE,
    order_number VARCHAR(100),
    document_url VARCHAR(500),
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create faculty_research_contributions table
CREATE TABLE IF NOT EXISTS faculty_research_contributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    faculty_id UUID NOT NULL REFERENCES faculties(user_id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    journal_or_publisher_or_agency VARCHAR(255),
    publication_date VARCHAR(50),
    issn_or_isbn_or_patent_no VARCHAR(100),
    url VARCHAR(500),
    document_url VARCHAR(500),
    amount VARCHAR(50),
    status VARCHAR(50),
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create faculty_resource_persons table
CREATE TABLE IF NOT EXISTS faculty_resource_persons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    faculty_id UUID NOT NULL REFERENCES faculties(user_id) ON DELETE CASCADE,
    resource_name VARCHAR(150) NOT NULL,
    org_type VARCHAR(100),
    course VARCHAR(150),
    hours INTEGER,
    academic_year VARCHAR(50),
    document_url VARCHAR(500),
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Create class_strengths table
CREATE TABLE IF NOT EXISTS class_strengths (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    semester_id UUID REFERENCES semesters(id) ON DELETE SET NULL,
    academic_year_id UUID REFERENCES academic_years(id) ON DELETE SET NULL,
    sanctioned_intake INTEGER DEFAULT 60,
    lateral_entry_count INTEGER DEFAULT 0,
    supernumerary_count INTEGER DEFAULT 0,
    detained_count INTEGER DEFAULT 0,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_class_semester_ay UNIQUE (class_id, semester_id, academic_year_id)
);
