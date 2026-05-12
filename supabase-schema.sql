-- ============================================================
-- My-Drive Auto-École — Supabase PostgreSQL Schema
-- Run this in your Supabase SQL Editor to create all tables.
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────────────────────
-- 1. USERS (mirrors Firestore 'users' collection)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
  id            UUID PRIMARY KEY,          -- matches auth.users(id)
  email         TEXT UNIQUE NOT NULL,
  role          TEXT NOT NULL DEFAULT 'student',  -- student | teacher | admin
  "fullName"    TEXT,
  phone         TEXT,
  "licenseType" TEXT,                       -- A | B | C  (student's desired license)
  "teacherId"   UUID,                       -- student → assigned teacher
  "teacherName" TEXT,                       -- denormalized
  "photoURL"    TEXT,
  "workDays"    JSONB,                      -- teacher: { monday: {start, end}, ... }
  "workHours"   JSONB,                      -- teacher: { start: "08:00", end: "17:00" }
  "licenseTypes" JSONB,                     -- teacher: ["A","B","C"]
  payments      JSONB,                      -- student: { code: bool, creneau: bool, circui: bool }
  "testScore"   INTEGER,
  active        BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt"   TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt"   TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- 2. VEHICLES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.vehicles (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  model         TEXT NOT NULL,
  type          TEXT,                       -- car | motorcycle | truck
  "licenseType" TEXT,                       -- A | B | C
  available     BOOLEAN NOT NULL DEFAULT TRUE,
  "imageUrl"    TEXT,
  "plateNumber" TEXT,
  "createdAt"   TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt"   TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- 3. BOOKINGS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bookings (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "studentId"   UUID REFERENCES public.users(id) ON DELETE SET NULL,
  "teacherId"   UUID REFERENCES public.users(id) ON DELETE SET NULL,
  "vehicleId"   UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  "studentName" TEXT,
  "teacherName" TEXT,
  date          DATE NOT NULL,
  time          TEXT NOT NULL,             -- stored as "HH:mm"
  status        TEXT NOT NULL DEFAULT 'pending',  -- pending | approved | rejected
  "licenseType" TEXT,
  "sessionType" TEXT,                      -- code | creneau | circui
  notes         TEXT,
  "createdAt"   TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt"   TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- 4. ARCHIVED BOOKINGS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public."archivedBookings" (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "originalId"  UUID,
  "studentId"   UUID,
  "teacherId"   UUID,
  "studentName" TEXT,
  "teacherName" TEXT,
  date          DATE,
  time          TEXT,
  status        TEXT,
  "licenseType" TEXT,
  "sessionType" TEXT,
  notes         TEXT,
  "archivedAt"  TIMESTAMPTZ DEFAULT NOW(),
  "createdAt"   TIMESTAMPTZ
);

-- ─────────────────────────────────────────────────────────────
-- 5. MESSAGES (chat)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.messages (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "senderId"    UUID REFERENCES public.users(id) ON DELETE SET NULL,
  "receiverId"  UUID,
  "senderName"  TEXT,
  participants  TEXT[],                    -- [senderId, receiverId]
  message       TEXT NOT NULL,
  "chatType"    TEXT DEFAULT 'general',   -- general | booking
  "bookingId"   UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  read          BOOLEAN NOT NULL DEFAULT FALSE,
  "timestamp"   TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- 6. SETTINGS (single row: id = 'school')
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.settings (
  id          TEXT PRIMARY KEY DEFAULT 'school',
  "logoUrl"   TEXT,
  name        JSONB,                       -- { ar: "...", fr: "...", en: "..." }
  contact     JSONB,                       -- { phone, email, address }
  pricing     JSONB,                       -- { code: 0, creneau: 0, circui: 0 }
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings row
INSERT INTO public.settings (id) VALUES ('school') ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- 7. TRAFFIC SIGNS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public."trafficSigns" (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title       JSONB,                       -- { ar, fr, en }
  "imageUrl"  TEXT,
  published   BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- 8. EDUCATIONAL VIDEOS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public."educationalVideos" (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "teacherId"     UUID REFERENCES public.users(id) ON DELETE SET NULL,
  title           TEXT NOT NULL,
  "cloudinaryUrl" TEXT,
  views           INTEGER NOT NULL DEFAULT 0,
  "likeCount"     INTEGER NOT NULL DEFAULT 0,
  "createdAt"     TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- 9. VIDEO COMMENTS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public."videoComments" (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "videoId"   UUID REFERENCES public."educationalVideos"(id) ON DELETE CASCADE,
  "userId"    UUID REFERENCES public.users(id) ON DELETE SET NULL,
  "userName"  TEXT,
  "userPhoto" TEXT,
  text        TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- 10. VIDEO LIKES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public."videoLikes" (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "videoId"  UUID REFERENCES public."educationalVideos"(id) ON DELETE CASCADE,
  "userId"   UUID REFERENCES public.users(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE ("videoId", "userId")
);

-- ─────────────────────────────────────────────────────────────
-- 11. EVALUATIONS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.evaluations (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "studentId" UUID REFERENCES public.users(id) ON DELETE CASCADE,
  "teacherId" UUID REFERENCES public.users(id) ON DELETE SET NULL,
  rating      INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  text        TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- 12. LICENSE CHANGE REQUESTS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public."licenseChangeRequests" (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "userId"              UUID REFERENCES public.users(id) ON DELETE CASCADE,
  "requestedLicenseTypes" TEXT[],
  status                TEXT NOT NULL DEFAULT 'pending',  -- pending | approved | rejected
  "createdAt"           TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- 13. NOTIFICATIONS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "userId"    UUID REFERENCES public.users(id) ON DELETE CASCADE,
  type        TEXT,
  message     TEXT,
  read        BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- REALTIME — enable for tables that need live updates
-- ─────────────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- ─────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY (RLS)
-- Enable but keep permissive for initial setup.
-- Tighten policies before going to production.
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.users               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."archivedBookings"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."trafficSigns"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."educationalVideos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."videoComments"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."videoLikes"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."licenseChangeRequests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications       ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read/write (permissive for dev)
-- Replace with fine-grained policies in production
CREATE POLICY "allow_all_authenticated" ON public.users               FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_authenticated" ON public.vehicles            FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_authenticated" ON public.bookings            FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_authenticated" ON public."archivedBookings"  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_authenticated" ON public.messages            FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_read_settings"     ON public.settings            FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "allow_write_settings"    ON public.settings            FOR ALL   TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_authenticated" ON public."trafficSigns"      FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_read_trafficsigns" ON public."trafficSigns"      FOR SELECT TO anon USING (published = true);
CREATE POLICY "allow_all_authenticated" ON public."educationalVideos" FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_authenticated" ON public."videoComments"     FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_authenticated" ON public."videoLikes"        FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_authenticated" ON public.evaluations         FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_authenticated" ON public."licenseChangeRequests" FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_authenticated" ON public.notifications       FOR ALL TO authenticated USING (true) WITH CHECK (true);
