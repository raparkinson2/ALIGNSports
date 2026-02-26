-- =============================================================================
-- PUSH TOKENS TABLE MIGRATION
-- Separate table for push tokens so player/profile sync can never wipe them.
-- Uses player_id (TEXT) to match the app's own player ID system (not auth.users).
-- Run this in your Supabase SQL Editor.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.push_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id   TEXT NOT NULL,
  token       TEXT NOT NULL,
  platform    TEXT,
  app_build   TEXT,
  last_seen   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (token)
);

CREATE INDEX IF NOT EXISTS push_tokens_player_id_idx ON public.push_tokens (player_id);

-- RLS: fully open (same policy as all other tables in this app)
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Open push_tokens" ON public.push_tokens FOR ALL USING (true) WITH CHECK (true);

-- Realtime (optional — not strictly needed for push tokens)
ALTER TABLE public.push_tokens REPLICA IDENTITY FULL;
