-- ============================================================
-- WALAUP — Medical App Schema
-- app_type: medical | Médecin généraliste / Spécialiste
-- Rôles: Médecin→tenant_admin, Secrétaire→tenant_user, Patient→app_end_user
-- ============================================================

-- ── 1. Étendre public.users pour les rôles métier ──────────
-- (Si la table public.users n'a pas encore tenant_id / app_type)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='users' AND column_name='tenant_id'
  ) THEN
    ALTER TABLE public.users ADD COLUMN tenant_id UUID;
    ALTER TABLE public.users ADD COLUMN app_type  TEXT;
  END IF;
END
$$;

-- ── 2. Schema médical ───────────────────────────────────────
CREATE SCHEMA IF NOT EXISTS medical;

-- ── 3. Tenants médicaux (profil cabinet/médecin) ────────────
CREATE TABLE IF NOT EXISTS medical.tenants (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL UNIQUE,
  doctor_name     TEXT NOT NULL,
  specialty       TEXT NOT NULL DEFAULT 'Médecine générale',
  phone           TEXT,
  address         TEXT,
  city            TEXT DEFAULT 'Tunis',
  logo_url        TEXT,
  bio             TEXT,
  -- Feature flags (modules premium)
  module_telemedicine        BOOLEAN DEFAULT FALSE,
  module_ai_engine           BOOLEAN DEFAULT FALSE,
  module_image_analysis      BOOLEAN DEFAULT FALSE,
  module_advanced_analytics  BOOLEAN DEFAULT FALSE,
  module_api_access          BOOLEAN DEFAULT FALSE,
  -- Licence
  license_active             BOOLEAN DEFAULT TRUE,
  license_expires_at         TIMESTAMPTZ,
  support_active             BOOLEAN DEFAULT FALSE,
  support_expires_at         TIMESTAMPTZ,
  -- Working hours
  work_start      TEXT DEFAULT '08:00',
  work_end        TEXT DEFAULT '20:00',
  slot_duration   INTEGER DEFAULT 30,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE medical.tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_own"     ON medical.tenants
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::UUID);
CREATE POLICY "super_admin_all" ON medical.tenants
  USING (auth.jwt() ->> 'role' = 'super_admin');

-- ── 4. Patients ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS medical.patients (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL,
  -- Identité
  first_name        TEXT NOT NULL,
  last_name         TEXT NOT NULL,
  birth_date        DATE,
  gender            TEXT CHECK (gender IN ('homme','femme','autre')),
  blood_type        TEXT CHECK (blood_type IN ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  -- Contact
  phone             TEXT,
  email             TEXT,
  address           TEXT,
  city              TEXT,
  -- Urgence
  emergency_name    TEXT,
  emergency_phone   TEXT,
  emergency_rel     TEXT,
  -- Médical (confidentiel — tenant_admin uniquement)
  allergies         JSONB DEFAULT '[]',   -- [{name, severity: 'CRITIQUE'|'MODERE'|'LEGER'}]
  chronic_cond      JSONB DEFAULT '[]',
  current_meds      JSONB DEFAULT '[]',
  -- Lien compte patient
  user_id           UUID REFERENCES auth.users(id),
  -- Meta
  last_visit        TIMESTAMPTZ,
  created_by        UUID REFERENCES auth.users(id),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE medical.patients ENABLE ROW LEVEL SECURITY;

-- Médecin + secrétaire : lecture & écriture
CREATE POLICY "staff_rw" ON medical.patients
  USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::UUID
    AND auth.jwt() ->> 'role' IN ('tenant_admin', 'tenant_user')
  );
-- Patient : son propre dossier uniquement
CREATE POLICY "end_user_own" ON medical.patients
  FOR SELECT USING (
    user_id = auth.uid()
    AND auth.jwt() ->> 'role' = 'app_end_user'
  );
CREATE POLICY "super_admin_all" ON medical.patients
  USING (auth.jwt() ->> 'role' = 'super_admin');

-- ── 5. Rendez-vous ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS medical.appointments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL,
  patient_id      UUID REFERENCES medical.patients(id) ON DELETE CASCADE,
  scheduled_at    TIMESTAMPTZ NOT NULL,
  duration_min    INTEGER DEFAULT 30,
  type            TEXT DEFAULT 'presentiel' CHECK (type IN ('presentiel','telemedicine')),
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending','confirmed','done','cancelled')),
  reason          TEXT,
  reminder_sent   BOOLEAN DEFAULT FALSE,
  notes           TEXT,                    -- admin only
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE medical.appointments ENABLE ROW LEVEL SECURITY;

-- Secrétaire peut lire + créer les RDV
CREATE POLICY "staff_read" ON medical.appointments
  FOR SELECT USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::UUID
    AND auth.jwt() ->> 'role' IN ('tenant_admin', 'tenant_user')
  );
CREATE POLICY "staff_write" ON medical.appointments
  FOR INSERT WITH CHECK (
    tenant_id = (auth.jwt() ->> 'tenant_id')::UUID
    AND auth.jwt() ->> 'role' IN ('tenant_admin', 'tenant_user')
  );
CREATE POLICY "admin_update" ON medical.appointments
  FOR UPDATE USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::UUID
    AND auth.jwt() ->> 'role' IN ('tenant_admin', 'tenant_user')
  );
-- Patient voit ses propres RDV
CREATE POLICY "end_user_own" ON medical.appointments
  FOR SELECT USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::UUID
    AND patient_id IN (
      SELECT id FROM medical.patients WHERE user_id = auth.uid()
    )
    AND auth.jwt() ->> 'role' = 'app_end_user'
  );
CREATE POLICY "super_admin_all" ON medical.appointments
  USING (auth.jwt() ->> 'role' = 'super_admin');

-- ── 6. Consultations (notes médicales — tenant_admin uniquement) ──
CREATE TABLE IF NOT EXISTS medical.consultations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL,
  patient_id       UUID REFERENCES medical.patients(id),
  appointment_id   UUID REFERENCES medical.appointments(id),
  -- Contenu médical (CONFIDENTIEL)
  motif            TEXT,
  anamnese         TEXT,
  examen_clinique  TEXT,
  diagnostic       TEXT,
  traitement       TEXT,
  prescriptions    JSONB DEFAULT '[]',    -- [{drug, dosage, duration, instructions}]
  ordonnance_url   TEXT,
  notes            TEXT,
  ai_summary       TEXT,                  -- premium
  risk_score       JSONB,                 -- premium
  -- Status
  status           TEXT DEFAULT 'draft' CHECK (status IN ('draft','done')),
  duration_min     INTEGER,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE medical.consultations ENABLE ROW LEVEL SECURITY;

-- CONFIDENTIEL — médecin uniquement
CREATE POLICY "admin_only" ON medical.consultations
  USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::UUID
    AND auth.jwt() ->> 'role' = 'tenant_admin'
  );
CREATE POLICY "super_admin_all" ON medical.consultations
  USING (auth.jwt() ->> 'role' = 'super_admin');

-- ── 7. Messagerie ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS medical.messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL,
  from_uid    UUID REFERENCES auth.users(id) NOT NULL,
  to_uid      UUID REFERENCES auth.users(id) NOT NULL,
  body        TEXT NOT NULL CHECK (char_length(body) < 2000),
  read        BOOLEAN DEFAULT FALSE,
  sent_at     TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE medical.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_messages" ON medical.messages
  USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::UUID
    AND (from_uid = auth.uid() OR to_uid = auth.uid())
  );
CREATE POLICY "super_admin_all" ON medical.messages
  USING (auth.jwt() ->> 'role' = 'super_admin');

-- ── 8. Analytics journaliers ────────────────────────────────
CREATE TABLE IF NOT EXISTS medical.analytics (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL,
  date                DATE NOT NULL,
  appointments_total  INTEGER DEFAULT 0,
  appointments_done   INTEGER DEFAULT 0,
  appointments_cancel INTEGER DEFAULT 0,
  new_patients        INTEGER DEFAULT 0,
  revenue_dt          NUMERIC DEFAULT 0,
  teleconsultations   INTEGER DEFAULT 0,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, date)
);
ALTER TABLE medical.analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_read" ON medical.analytics
  FOR SELECT USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::UUID
    AND auth.jwt() ->> 'role' = 'tenant_admin'
  );
CREATE POLICY "super_admin_all" ON medical.analytics
  USING (auth.jwt() ->> 'role' = 'super_admin');

-- ── 9. Index performance ────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_patients_tenant     ON medical.patients(tenant_id);
CREATE INDEX IF NOT EXISTS idx_appts_tenant_date   ON medical.appointments(tenant_id, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_appts_status        ON medical.appointments(status);
CREATE INDEX IF NOT EXISTS idx_consult_tenant      ON medical.consultations(tenant_id, patient_id);
CREATE INDEX IF NOT EXISTS idx_messages_tenant     ON medical.messages(tenant_id, to_uid);
CREATE INDEX IF NOT EXISTS idx_analytics_date      ON medical.analytics(tenant_id, date);

-- ── 10. Updated_at trigger ──────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_patients_updated_at
  BEFORE UPDATE ON medical.patients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_appointments_updated_at
  BEFORE UPDATE ON medical.appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_consultations_updated_at
  BEFORE UPDATE ON medical.consultations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
