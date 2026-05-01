-- ==========================================
-- LATEST SUPABASE SCHEMA (COMBINED)
-- ==========================================
-- Run this script in your Supabase SQL Editor

-- 1. USER PROFILES (For Maker-Checker Roles)
CREATE TABLE IF NOT EXISTS user_profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text NOT NULL,
    role text CHECK (role IN ('maker', 'checker', 'admin')) DEFAULT 'maker',
    full_name text,
    created_at timestamptz DEFAULT now()
);

-- 2. MERCHANT APPLICATIONS TABLE (ENHANCED)
CREATE TABLE IF NOT EXISTS merchant_applications (
    id text PRIMARY KEY,
    onboard_by text,
    applicant_email text,
    merchant_phone_no text,
    title text,
    title_mm text,
    last_name text,
    last_name_mm text,
    dob date,
    father_name text,
    gender text,
    marital_status text DEFAULT 'Single',
    contact_number text,
    nrc_no text,
    nrc_tsp text,
    nrc_type text,
    nrc_number text,
    nrc_full text,
    owner_region text,
    owner_township text,
    owner_district text,
    owner_city_en text,
    owner_city_mm text,
    owner_postal_code text,
    owner_house_no text,
    owner_street text,
    owner_house_no_mm text,
    owner_street_mm text,
    owner_full_address text,
    merchant_label_en text,
    merchant_label_mm text,
    company_name_en text,
    company_name_mm text,
    company_short_name_en text,
    company_short_name_mm text,
    business_name_en text,
    business_name_mm text,
    mcc_group text,
    mcc_name text,
    mcc_code text,
    dica_grn_rcdc text,
    merchant_region text,
    merchant_township text,
    merchant_district text,
    merchant_city_en text,
    merchant_city_mm text,
    merchant_postal_code text,
    merchant_house_no_en text,
    merchant_street_en text,
    merchant_house_no_mm text,
    merchant_street_mm text,
    merchant_full_address text,
    latitude text,
    longitude text,
    open_24_7 boolean DEFAULT true,
    status text DEFAULT 'pending', -- pending, review_requested, approved, rejected
    submitted_at timestamptz DEFAULT now(),
    
    -- Maker-Checker Workflow Fields
    maker_id uuid REFERENCES auth.users(id),
    checker_id uuid REFERENCES auth.users(id),
    workflow_status text DEFAULT 'draft', -- draft, submitted, pending_review, completed
    
    -- Admin Review Fields
    reviewed_by uuid REFERENCES auth.users(id),
    approved_at timestamptz,
    rejected_at timestamptz,
    
    -- File paths
    doc_business_doc text,
    doc_agreement text,
    doc_shop_photo text,
    doc_nrc_front text,
    doc_nrc_back text,
    doc_signature text
);

-- 3. EMAIL LOGS TABLE
CREATE TABLE IF NOT EXISTS email_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    app_id text REFERENCES merchant_applications(id) ON DELETE CASCADE,
    recipient text NOT NULL,
    subject text NOT NULL,
    body text NOT NULL,
    status text DEFAULT 'sent',
    created_at timestamptz DEFAULT now()
);

-- 4. APPLICATION TIMELINE TABLE
CREATE TABLE IF NOT EXISTS application_timeline (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    app_id text REFERENCES merchant_applications(id) ON DELETE CASCADE,
    action text NOT NULL,
    note text,
    performed_by uuid REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now()
);

-- 5. ENABLE RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- 6. POLICIES
-- Profiles: Users can read all profiles, but only update their own
CREATE POLICY "Public Read Profiles" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "Users Update Own Profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins Update All Profiles" ON user_profiles FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Applications: Public Insert, Authenticated Full Access
CREATE POLICY "Public Insert Apps" ON merchant_applications FOR INSERT WITH CHECK (true);
CREATE POLICY "Auth Full Access Apps" ON merchant_applications FOR ALL TO authenticated USING (true);

-- Timeline: Public Insert, Authenticated Full Access
CREATE POLICY "Public Insert Timeline" ON application_timeline FOR INSERT WITH CHECK (true);
CREATE POLICY "Auth Full Access Timeline" ON application_timeline FOR ALL TO authenticated USING (true);

-- Email Logs: Authenticated Read
CREATE POLICY "Auth Read Email Logs" ON email_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "System Insert Email Logs" ON email_logs FOR INSERT WITH CHECK (true);

-- 7. STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public) VALUES ('merchant-docs', 'merchant-docs', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('merchant-photos', 'merchant-photos', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id IN ('merchant-docs', 'merchant-photos'));
CREATE POLICY "Public View" ON storage.objects FOR SELECT WITH CHECK (bucket_id IN ('merchant-docs', 'merchant-photos'));

-- 6. SEED INITIAL ADMIN (Optional)
-- You can create an admin user in the Supabase Auth dashboard.
-- Once created, that user will have full access to the Admin Portal.
