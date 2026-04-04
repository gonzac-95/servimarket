-- ============================================================
-- SERVIMARKET - Supabase Schema
-- ============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis"; -- optional, for geo queries

-- ============================================================
-- USERS (extends Supabase auth.users)
-- ============================================================
CREATE TABLE public.users (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role         TEXT NOT NULL CHECK (role IN ('client', 'provider', 'admin')) DEFAULT 'client',
  name         TEXT NOT NULL,
  email        TEXT NOT NULL UNIQUE,
  phone        TEXT,
  avatar_url   TEXT,
  lat          DOUBLE PRECISION,
  lng          DOUBLE PRECISION,
  city         TEXT,
  province     TEXT DEFAULT 'Buenos Aires',
  country      TEXT DEFAULT 'AR',
  is_blocked   BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PROVIDERS
-- ============================================================
CREATE TABLE public.providers (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  categories          TEXT[] NOT NULL DEFAULT '{}',
  bio                 TEXT,
  price_list          JSONB DEFAULT '[]',   -- [{service, price, unit}]
  photos              TEXT[] DEFAULT '{}',
  service_radius_km   INTEGER DEFAULT 10,
  service_zones       TEXT[] DEFAULT '{}',  -- barrios/zonas
  documents_verified  BOOLEAN DEFAULT FALSE,
  cuit_cuil           TEXT,
  rating_avg          NUMERIC(3,2) DEFAULT 0,
  reviews_count       INTEGER DEFAULT 0,
  is_available        BOOLEAN DEFAULT TRUE,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- JOBS
-- ============================================================
CREATE TYPE job_status AS ENUM (
  'pending', 'accepted', 'in_progress', 'completed', 'cancelled'
);

CREATE TABLE public.jobs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id     UUID NOT NULL REFERENCES public.users(id),
  provider_id   UUID REFERENCES public.providers(id),
  category      TEXT NOT NULL,
  description   TEXT NOT NULL,
  price         NUMERIC(10,2),
  status        job_status DEFAULT 'pending',
  scheduled_at  TIMESTAMPTZ,
  address       TEXT NOT NULL,
  lat           DOUBLE PRECISION,
  lng           DOUBLE PRECISION,
  photos        TEXT[] DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- MESSAGES
-- ============================================================
CREATE TABLE public.messages (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id      UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  sender_id   UUID NOT NULL REFERENCES public.users(id),
  text        TEXT NOT NULL,
  read        BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- REVIEWS
-- ============================================================
CREATE TABLE public.reviews (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id       UUID NOT NULL UNIQUE REFERENCES public.jobs(id),
  client_id    UUID NOT NULL REFERENCES public.users(id),
  provider_id  UUID NOT NULL REFERENCES public.providers(id),
  rating       INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment      TEXT,
  reply        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PAYMENTS
-- ============================================================
CREATE TYPE payment_status AS ENUM (
  'pending', 'approved', 'rejected', 'refunded'
);

CREATE TABLE public.payments (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id              UUID NOT NULL REFERENCES public.jobs(id),
  amount              NUMERIC(10,2) NOT NULL,
  provider_share      NUMERIC(10,2),   -- 80% por defecto
  platform_fee        NUMERIC(10,2),   -- 20% por defecto
  status              payment_status DEFAULT 'pending',
  payment_provider    TEXT CHECK (payment_provider IN ('mercadopago', 'stripe')),
  provider_payment_id TEXT,            -- ID de MP o Stripe
  preference_id       TEXT,            -- MP preference_id
  checkout_url        TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE public.notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  type        TEXT,  -- 'job_new', 'job_accepted', 'payment', 'review', etc.
  data        JSONB DEFAULT '{}',
  read        BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update updated_at on jobs
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-update provider rating after review insert
CREATE OR REPLACE FUNCTION update_provider_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.providers
  SET
    rating_avg    = (SELECT AVG(rating) FROM public.reviews WHERE provider_id = NEW.provider_id),
    reviews_count = (SELECT COUNT(*) FROM public.reviews WHERE provider_id = NEW.provider_id)
  WHERE id = NEW.provider_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reviews_update_rating
  AFTER INSERT OR UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION update_provider_rating();

-- Create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Usuario'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'client')
  );
  -- If provider role, also create provider profile
  IF NEW.raw_user_meta_data->>'role' = 'provider' THEN
    INSERT INTO public.providers (user_id, categories)
    VALUES (NEW.id, ARRAY[]::TEXT[]);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users: can read all, only update own
CREATE POLICY "Users read all"    ON public.users FOR SELECT USING (true);
CREATE POLICY "Users update own"  ON public.users FOR UPDATE USING (auth.uid() = id);

-- Providers: public read, only own user can update
CREATE POLICY "Providers read all"    ON public.providers FOR SELECT USING (true);
CREATE POLICY "Providers update own"  ON public.providers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Providers insert own"  ON public.providers FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Jobs: client or provider of the job can see it
CREATE POLICY "Jobs select own"
  ON public.jobs FOR SELECT
  USING (
    auth.uid() = client_id OR
    auth.uid() = (SELECT user_id FROM public.providers WHERE id = provider_id) OR
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );
CREATE POLICY "Jobs insert client"  ON public.jobs FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Jobs update parties"
  ON public.jobs FOR UPDATE
  USING (
    auth.uid() = client_id OR
    auth.uid() = (SELECT user_id FROM public.providers WHERE id = provider_id)
  );

-- Messages: only job participants
CREATE POLICY "Messages select parties"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = job_id AND (
        j.client_id = auth.uid() OR
        (SELECT user_id FROM public.providers WHERE id = j.provider_id) = auth.uid()
      )
    )
  );
CREATE POLICY "Messages insert parties"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = job_id AND (
        j.client_id = auth.uid() OR
        (SELECT user_id FROM public.providers WHERE id = j.provider_id) = auth.uid()
      )
    )
  );

-- Reviews: public read, client inserts after job completion
CREATE POLICY "Reviews read all"    ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Reviews insert client"
  ON public.reviews FOR INSERT
  WITH CHECK (
    auth.uid() = client_id AND
    EXISTS (SELECT 1 FROM public.jobs WHERE id = job_id AND status = 'completed' AND client_id = auth.uid())
  );
CREATE POLICY "Reviews update provider reply"
  ON public.reviews FOR UPDATE
  USING (auth.uid() = (SELECT user_id FROM public.providers WHERE id = provider_id));

-- Payments: only job parties
CREATE POLICY "Payments select parties"
  ON public.payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = job_id AND (
        j.client_id = auth.uid() OR
        auth.uid() = (SELECT user_id FROM public.providers WHERE id = j.provider_id)
      )
    ) OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );

-- Notifications: own only
CREATE POLICY "Notifications own"  ON public.notifications FOR SELECT  USING (auth.uid() = user_id);
CREATE POLICY "Notifications update own" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_providers_categories ON public.providers USING GIN (categories);
CREATE INDEX idx_jobs_client    ON public.jobs(client_id);
CREATE INDEX idx_jobs_provider  ON public.jobs(provider_id);
CREATE INDEX idx_jobs_status    ON public.jobs(status);
CREATE INDEX idx_messages_job   ON public.messages(job_id);
CREATE INDEX idx_reviews_provider ON public.reviews(provider_id);
CREATE INDEX idx_notifications_user ON public.notifications(user_id, read);
