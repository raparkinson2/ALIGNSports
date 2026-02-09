# SMS Password Reset Setup with Twilio

This guide helps you set up the SMS-based OTP password reset system using Supabase Edge Functions and Twilio.

## Prerequisites

1. A Twilio account (twilio.com)
2. A Twilio phone number that can send SMS
3. Your Twilio Account SID and Auth Token

## Step 1: Get Your Twilio Credentials

1. Go to [Twilio Console](https://console.twilio.com/)
2. Copy your **Account SID** (starts with `AC`)
3. Copy your **Auth Token**
4. Go to Phone Numbers > Manage > Active Numbers
5. Copy your Twilio phone number (e.g., `+15551234567`)

## Step 2: Create the Database Table

Run this SQL in your Supabase SQL Editor (Dashboard > SQL Editor):

```sql
-- Create password reset codes table
CREATE TABLE IF NOT EXISTS password_reset_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  reset_token TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_password_reset_codes_phone ON password_reset_codes(phone);
CREATE INDEX IF NOT EXISTS idx_password_reset_codes_expires ON password_reset_codes(expires_at);

-- Enable RLS
ALTER TABLE password_reset_codes ENABLE ROW LEVEL SECURITY;
```

## Step 3: Create Edge Function - send-reset-sms

In Supabase Dashboard, go to **Edge Functions** and create a new function called `send-reset-sms`.

Paste this code:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID')
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN')
const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

function formatPhoneForTwilio(phone: string): string {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '')
  // Add +1 for US numbers if not already present
  if (digits.length === 10) {
    return `+1${digits}`
  }
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`
  }
  // Already has country code
  if (!phone.startsWith('+')) {
    return `+${digits}`
  }
  return phone
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { phone } = await req.json()

    if (!phone) {
      return new Response(
        JSON.stringify({ error: 'Phone number is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

    // Normalize phone number for storage (just digits)
    const normalizedPhone = phone.replace(/\D/g, '')

    // Generate 6-digit OTP
    const code = generateOTP()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

    // Invalidate any existing codes for this phone
    await supabase
      .from('password_reset_codes')
      .update({ used: true })
      .eq('phone', normalizedPhone)
      .eq('used', false)

    // Store the new code
    const { error: insertError } = await supabase
      .from('password_reset_codes')
      .insert({
        phone: normalizedPhone,
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

    // Format phone for Twilio
    const twilioPhone = formatPhoneForTwilio(phone)

    // Send SMS via Twilio
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`
    const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)

    const res = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${auth}`,
      },
      body: new URLSearchParams({
        To: twilioPhone,
        From: TWILIO_PHONE_NUMBER!,
        Body: `Your ALIGN Sports password reset code is: ${code}. This code expires in 15 minutes.`,
      }),
    })

    if (!res.ok) {
      const error = await res.text()
      console.error('Twilio error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to send SMS. Please try again.' }),
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

## Step 4: Create Edge Function - verify-reset-code

Create another Edge Function called `verify-reset-code`:

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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { phone, code } = await req.json()

    if (!phone || !code) {
      return new Response(
        JSON.stringify({ error: 'Phone and code are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

    // Normalize phone number
    const normalizedPhone = phone.replace(/\D/g, '')

    // Find the reset code
    const { data: resetCodes, error: fetchError } = await supabase
      .from('password_reset_codes')
      .select('*')
      .eq('phone', normalizedPhone)
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

    // Generate a one-time reset token
    const resetToken = generateResetToken()

    // Update the code record with the reset token
    await supabase
      .from('password_reset_codes')
      .update({
        reset_token: resetToken,
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString()
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

## Step 5: Create Edge Function - update-password

Create the final Edge Function called `update-password`:

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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { phone, newPassword, resetToken } = await req.json()

    if (!phone || !newPassword || !resetToken) {
      return new Response(
        JSON.stringify({ error: 'Phone, new password, and reset token are required' }),
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

    // Normalize phone number
    const normalizedPhone = phone.replace(/\D/g, '')

    // Verify the reset token
    const { data: resetCodes, error: fetchError } = await supabase
      .from('password_reset_codes')
      .select('*')
      .eq('phone', normalizedPhone)
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

    // Find the user by phone number in auth.users
    // Note: This requires users to have phone stored. If using email auth,
    // you may need to look up the email from your players/users table
    const { data: users, error: userError } = await supabase.auth.admin.listUsers()

    // Try to find user by phone metadata or by looking up in your app's user table
    let user = users?.users?.find(u => u.phone === normalizedPhone || u.phone === `+1${normalizedPhone}`)

    if (!user) {
      // If not found by phone in auth, you might need to look up email from your players table
      // and then find the auth user by email
      return new Response(
        JSON.stringify({ error: 'User not found. Please contact support.' }),
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

## Step 6: Set Up Secrets

In your Supabase Dashboard, go to **Edge Functions > Secrets** and add:

- `TWILIO_ACCOUNT_SID` - Your Twilio Account SID (starts with AC)
- `TWILIO_AUTH_TOKEN` - Your Twilio Auth Token
- `TWILIO_PHONE_NUMBER` - Your Twilio phone number (format: +15551234567)

Or via CLI:
```bash
supabase secrets set TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
supabase secrets set TWILIO_AUTH_TOKEN=your_auth_token_here
supabase secrets set TWILIO_PHONE_NUMBER=+15551234567
```

## Step 7: Deploy Functions

Deploy each function with no JWT verification (since users aren't logged in during password reset):

```bash
supabase functions deploy send-reset-sms --no-verify-jwt
supabase functions deploy verify-reset-code --no-verify-jwt
supabase functions deploy update-password --no-verify-jwt
```

## Testing

1. Open the app and tap "Forgot Password?"
2. Enter your phone number
3. You should receive a text with a 6-digit code within seconds
4. Enter the code and your new password
5. Sign in with your new password

## Troubleshooting

- **No SMS received**: Check your Twilio phone number is active and has SMS capabilities
- **Invalid code error**: Codes expire after 15 minutes. Request a new one.
- **"User not found" error**: Make sure the phone number in auth matches what's being entered
- **Twilio error 21211**: The phone number format is invalid. Ensure it includes country code.

## Twilio Pricing

Twilio charges per SMS sent. Current rates (as of 2024):
- US/Canada: ~$0.0079 per SMS
- Check [Twilio SMS Pricing](https://www.twilio.com/sms/pricing) for other countries

For testing, Twilio provides trial credit when you sign up.
