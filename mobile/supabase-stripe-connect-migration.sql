-- =============================================
-- STRIPE CONNECT MIGRATION
-- Run this in your Supabase SQL Editor
-- =============================================

-- Add stripe_account_id to teams table
ALTER TABLE teams
  ADD COLUMN IF NOT EXISTS stripe_account_id TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS stripe_onboarding_complete BOOLEAN DEFAULT FALSE;
