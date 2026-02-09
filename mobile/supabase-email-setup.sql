-- ALIGN Sports - Email Team Setup Instructions
--
-- To enable the "Email Team" feature, you need to set up a Supabase Edge Function.
-- Follow these steps:
--
-- STEP 1: Install Supabase CLI (if not already installed)
-- Run this in your terminal:
--   npm install -g supabase
--
-- STEP 2: Login to Supabase
--   supabase login
--
-- STEP 3: Link your project
--   supabase link --project-ref YOUR_PROJECT_REF
--   (Find your project ref in your Supabase dashboard URL)
--
-- STEP 4: Create the Edge Function
-- Create a folder: supabase/functions/send-team-email/
-- Create a file: supabase/functions/send-team-email/index.ts
-- With the following code:
--
-- ========================================
-- EDGE FUNCTION CODE (save as index.ts):
-- ========================================
/*
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    })
  }

  try {
    const { to, subject, body, teamName } = await req.json()

    if (!to || !subject || !body) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, subject, body' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Send email using Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'ALIGN Sports <noreply@alignsports.com>',
        to: to,
        subject: `[${teamName}] ${subject}`,
        text: body,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #0891b2; margin-bottom: 8px;">${teamName}</h2>
            <h3 style="color: #1e293b; margin-top: 0;">${subject}</h3>
            <div style="color: #334155; line-height: 1.6; white-space: pre-wrap;">${body}</div>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
            <p style="color: #94a3b8; font-size: 12px;">
              Sent via ALIGN Sports
            </p>
          </div>
        `,
      }),
    })

    if (!res.ok) {
      const error = await res.text()
      console.error('Resend error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to send email' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const data = await res.json()
    return new Response(
      JSON.stringify({ success: true, id: data.id }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
*/
-- ========================================
--
-- STEP 5: Set up Resend for email delivery
-- 1. Go to https://resend.com and create an account
-- 2. Add and verify your domain (alignsports.com)
-- 3. Get your API key from the Resend dashboard
--
-- STEP 6: Add the secret to Supabase
--   supabase secrets set RESEND_API_KEY=your_resend_api_key
--
-- STEP 7: Deploy the function
--   supabase functions deploy send-team-email
--
-- That's it! The "Email Team" feature should now work.
