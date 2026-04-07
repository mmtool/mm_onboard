-- ─── APPLICATIONS TABLE ───────────────────────────────────────────
CREATE TABLE merchant_applications (
  -- Identity
  id                    TEXT PRIMARY KEY,          -- MOB-XXXXXXX
  submitted_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),
  status                TEXT DEFAULT 'pending'
                        CHECK (status IN ('pending','review','approved','rejected')),
  onboard_by            TEXT,
  applicant_email       TEXT,

  -- Owner Info
  title                 TEXT,
  last_name             TEXT,
  title_mm              TEXT,
  last_name_mm          TEXT,
  dob                   DATE,
  father_name           TEXT,
  gender                TEXT,
  marital_status        TEXT DEFAULT 'Single',
  merchant_phone_no     TEXT,
  contact_number        TEXT,

  -- NRC
  nrc_no                TEXT,
  nrc_tsp               TEXT,
  nrc_type              TEXT,
  nrc_number            TEXT,
  nrc_full              TEXT,

  -- Owner Address
  owner_country         TEXT DEFAULT 'Myanmar',
  owner_region          TEXT,
  owner_township        TEXT,
  owner_district        TEXT,
  owner_city_en         TEXT,
  owner_city_mm         TEXT,
  owner_postal_code     TEXT,
  owner_house_no        TEXT,
  owner_street          TEXT,
  owner_house_no_mm     TEXT,
  owner_street_mm       TEXT,
  owner_full_address    TEXT,

  -- Business
  merchant_label_en     TEXT,
  merchant_label_mm     TEXT,
  company_name_en       TEXT,
  company_name_mm       TEXT,
  company_short_name_en TEXT,
  company_short_name_mm TEXT,
  business_name_en      TEXT,
  business_name_mm      TEXT,
  mcc_group             TEXT,
  mcc_name              TEXT,
  mcc_code              TEXT,
  acquirer              TEXT DEFAULT 'Shwebank',
  offer                 TEXT DEFAULT 'Merchant',
  business_email        TEXT DEFAULT 'merchant@mo.com.mm',
  dica_grn_rcdc         TEXT,

  -- Merchant Address
  merchant_country      TEXT DEFAULT 'Myanmar',
  merchant_region       TEXT,
  merchant_township     TEXT,
  merchant_district     TEXT,
  merchant_city_en      TEXT,
  merchant_city_mm      TEXT,
  merchant_postal_code  TEXT,
  merchant_house_no_en  TEXT,
  merchant_street_en    TEXT,
  merchant_house_no_mm  TEXT,
  merchant_street_mm    TEXT,
  merchant_full_address TEXT,
  latitude              DECIMAL(10,7),
  longitude             DECIMAL(10,7),
  open_24_7             BOOLEAN DEFAULT TRUE,

  -- Documents (Storage paths)
  doc_business_doc      TEXT,
  doc_agreement         TEXT,
  doc_bod               TEXT,
  doc_shop_photo        TEXT,
  doc_nrc_front         TEXT,
  doc_nrc_back          TEXT,
  doc_signature         TEXT,

  -- Admin
  reviewed_by           UUID REFERENCES auth.users(id),
  review_notes          TEXT,
  approved_at           TIMESTAMPTZ,
  rejected_at           TIMESTAMPTZ,
  rejection_reason      TEXT
);

-- ─── TIMELINE / AUDIT LOG ─────────────────────────────────────────
CREATE TABLE application_timeline (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id        TEXT REFERENCES merchant_applications(id) ON DELETE CASCADE,
  action        TEXT NOT NULL,
  performed_by  UUID REFERENCES auth.users(id),
  note          TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── ADMIN ACTIONS LOG ────────────────────────────────────────────
CREATE TABLE admin_actions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id      TEXT REFERENCES merchant_applications(id),
  admin_id    UUID REFERENCES auth.users(id),
  action      TEXT,  -- 'approved', 'rejected', 'downloaded', 'viewed'
  metadata    JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── INDEXES ──────────────────────────────────────────────────────
CREATE INDEX idx_apps_status ON merchant_applications(status);
CREATE INDEX idx_apps_email ON merchant_applications(applicant_email);
CREATE INDEX idx_apps_submitted ON merchant_applications(submitted_at DESC);
CREATE INDEX idx_timeline_app ON application_timeline(app_id, created_at DESC);

-- ─── AUTO-UPDATE updated_at ───────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_apps_updated
  BEFORE UPDATE ON merchant_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── ROW LEVEL SECURITY (RLS) ─────────────────────────────────────
ALTER TABLE merchant_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;

-- Public can INSERT (submit new applications)
CREATE POLICY "public_can_submit"
  ON merchant_applications FOR INSERT
  TO anon WITH CHECK (true);

-- Only authenticated admins can SELECT/UPDATE
CREATE POLICY "admins_can_read"
  ON merchant_applications FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "admins_can_update"
  ON merchant_applications FOR UPDATE
  TO authenticated USING (true);

-- Timeline: authenticated can read/insert
CREATE POLICY "auth_timeline_read"
  ON application_timeline FOR SELECT TO authenticated USING (true);

CREATE POLICY "auth_timeline_insert"
  ON application_timeline FOR INSERT TO authenticated WITH CHECK (true);

-- Public can insert timeline (for submission event)
CREATE POLICY "public_timeline_insert"
  ON application_timeline FOR INSERT TO anon
  WITH CHECK (true);
