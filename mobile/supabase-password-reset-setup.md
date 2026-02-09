# Custom OTP Password Reset Setup

This guide helps you set up the custom OTP-based password reset system using Supabase Edge Functions and Resend.

## Overview

The system consists of:
1. A database table to store reset codes
2. Three Edge Functions:
   - `send-reset-code` - Generates and sends OTP via email
   - `verify-reset-code` - Validates the OTP code
   - `update-password` - Updates the user's password after verification

## Step 1: Create the Database Table

Run this SQL in your Supabase SQL Editor:

```sql
-- Create password reset codes table
CREATE TABLE IF NOT EXISTS password_reset_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  reset_token TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_password_reset_codes_email ON password_reset_codes(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_codes_expires ON password_reset_codes(expires_at);

-- Enable RLS (but allow functions to bypass)
ALTER TABLE password_reset_codes ENABLE ROW LEVEL SECURITY;

-- Clean up expired codes automatically (optional - run periodically)
-- DELETE FROM password_reset_codes WHERE expires_at < NOW() OR used = TRUE;
```

## Step 2: Create Edge Function - send-reset-code

Create the folder: `supabase/functions/send-reset-code/`

Create the file: `supabase/functions/send-reset-code/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email } = await req.json()

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase admin client
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

    // Check if user exists in auth
    const { data: users, error: userError } = await supabase.auth.admin.listUsers()
    const userExists = users?.users?.some(u => u.email?.toLowerCase() === email.toLowerCase())

    if (!userExists) {
      return new Response(
        JSON.stringify({ error: 'No user found with this email address.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate 6-digit OTP
    const code = generateOTP()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

    // Invalidate any existing codes for this email
    await supabase
      .from('password_reset_codes')
      .update({ used: true })
      .eq('email', email.toLowerCase())
      .eq('used', false)

    // Store the new code
    const { error: insertError } = await supabase
      .from('password_reset_codes')
      .insert({
        email: email.toLowerCase(),
        code,
        expires_at: expiresAt.toISOString(),
      })

    if (insertError) {
      console.error('Insert error:', insertError)
      return new Response(
        JSON.stringify({ error: 'Failed to generate reset code.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Send email via Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'ALIGN Sports <noreply@alignapps.com>',
        to: email,
        subject: 'Your Password Reset Code',
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="text-align: center; margin-bottom: 32px;">
              <h1 style="color: #0891b2; margin: 0;">ALIGN Sports</h1>
            </div>
            <h2 style="color: #1e293b; text-align: center; margin-bottom: 24px;">Password Reset Code</h2>
            <p style="color: #334155; font-size: 16px; line-height: 1.6; text-align: center;">
              Use the code below to reset your password. This code expires in 15 minutes.
            </p>
            <div style="background: linear-gradient(135deg, #0891b2 0%, #0e7490 100%); border-radius: 12px; padding: 24px; margin: 32px 0; text-align: center;">
              <span style="font-size: 36px; font-weight: bold; color: white; letter-spacing: 8px;">${code}</span>
            </div>
            <p style="color: #64748b; font-size: 14px; text-align: center;">
              If you didn't request this code, you can safely ignore this email.
            </p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;" />
            <p style="color: #94a3b8; font-size: 12px; text-align: center;">
              ALIGN Sports Team Management
            </p>
          </div>
        `,
      }),
    })

    if (!res.ok) {
      const error = await res.text()
      console.error('Resend error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to send email. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

## Step 3: Create Edge Function - verify-reset-code

Create the folder: `supabase/functions/verify-reset-code/`

Create the file: `supabase/functions/verify-reset-code/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function generateResetToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, code } = await req.json()

    if (!email || !code) {
      return new Response(
        JSON.stringify({ error: 'Email and code are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

    // Find the reset code
    const { data: resetCodes, error: fetchError } = await supabase
      .from('password_reset_codes')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('code', code)
      .eq('used', false)
      .order('created_at', { ascending: false })
      .limit(1)

    if (fetchError || !resetCodes || resetCodes.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid code. Please check and try again.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const resetCode = resetCodes[0]

    // Check if expired
    if (new Date(resetCode.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Code has expired. Please request a new one.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate a one-time reset token for the password update
    const resetToken = generateResetToken()

    // Update the code record with the reset token (valid for 5 minutes)
    await supabase
      .from('password_reset_codes')
      .update({
        reset_token: resetToken,
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 more minutes to set password
      })
      .eq('id', resetCode.id)

    return new Response(
      JSON.stringify({ success: true, resetToken }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

## Step 4: Create Edge Function - update-password

Create the folder: `supabase/functions/update-password/`

Create the file: `supabase/functions/update-password/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, newPassword, resetToken } = await req.json()

    if (!email || !newPassword || !resetToken) {
      return new Response(
        JSON.stringify({ error: 'Email, new password, and reset token are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (newPassword.length < 8) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 8 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

    // Verify the reset token
    const { data: resetCodes, error: fetchError } = await supabase
      .from('password_reset_codes')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('reset_token', resetToken)
      .eq('used', false)
      .limit(1)

    if (fetchError || !resetCodes || resetCodes.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired reset token. Please start over.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const resetCode = resetCodes[0]

    // Check if expired
    if (new Date(resetCode.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Reset token has expired. Please start over.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Find the user
    const { data: users, error: userError } = await supabase.auth.admin.listUsers()
    const user = users?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase())

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'User not found.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update the password
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    )

    if (updateError) {
      console.error('Update error:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update password. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Mark the code as used
    await supabase
      .from('password_reset_codes')
      .update({ used: true })
      .eq('id', resetCode.id)

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

## Step 5: Deploy the Edge Functions

Make sure you have the Resend API key set (you should already have this from the team email setup):

```bash
supabase secrets set RESEND_API_KEY=your_resend_api_key
```

Deploy all three functions:

```bash
supabase functions deploy send-reset-code --no-verify-jwt
supabase functions deploy verify-reset-code --no-verify-jwt
supabase functions deploy update-password --no-verify-jwt
```

**Important:** The `--no-verify-jwt` flag is required because these functions are called from the app before the user is authenticated.

## Testing

1. Open the app and go to the login screen
2. Tap "Forgot Password?"
3. Enter your email address
4. Check your email (including spam/junk folder) for the 6-digit code
5. Enter the code and your new password
6. You should be able to log in with your new password

## Troubleshooting

- **No email received**: Check your spam folder. Verify the Resend API key and domain are correct.
- **Invalid code error**: The code expires after 15 minutes. Request a new one.
- **Function not found**: Make sure you deployed the functions and they are showing in the Supabase dashboard under Edge Functions.
