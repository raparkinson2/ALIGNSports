import { Hono } from "hono";
import { createClient } from "@supabase/supabase-js";

const notificationsRouter = new Hono();

// Service-role Supabase client - bypasses RLS to read push tokens
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: "default" | null;
  badge?: number;
  priority?: "default" | "normal" | "high";
}

/**
 * Send push notifications via Expo's push notification service
 */
async function sendExpoPushNotifications(messages: ExpoPushMessage[]): Promise<void> {
  const chunks = [];
  for (let i = 0; i < messages.length; i += 100) {
    chunks.push(messages.slice(i, i + 100));
  }

  for (const chunk of chunks) {
    try {
      const res = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(chunk),
      });
      if (!res.ok) {
        const text = await res.text();
        console.error("Expo push error:", text);
      } else {
        const responseData = await res.json() as { data: Array<{ status: string; id?: string; message?: string; details?: any }> };
        // Log per-ticket results to spot invalid/expired tokens
        if (responseData?.data) {
          responseData.data.forEach((ticket: any, i: number) => {
            if (ticket.status === 'error') {
              console.error(`[push] Token error for message ${i} (to: ${chunk[i]?.to}): ${ticket.message} - details: ${JSON.stringify(ticket.details)}`);
            } else {
              console.log(`[push] Ticket ${i}: ${ticket.status} id=${ticket.id}`);
            }
          });
        } else {
          console.log("Expo push response:", JSON.stringify(responseData).slice(0, 300));
        }
      }
    } catch (err) {
      console.error("Failed to send push notifications:", err);
    }
  }
}

/**
 * POST /api/notifications/send-push
 * Send a push notification to a list of Expo push tokens.
 * Body: { tokens: string[], title: string, body: string, data?: object }
 */
notificationsRouter.post("/send-push", async (c) => {
  let tokens: string[] = [];
  let title: string = "";
  let body: string = "";
  let data: Record<string, any> = {};

  try {
    const req = await c.req.json();
    tokens = req.tokens || [];
    title = req.title || "";
    body = req.body || "";
    data = req.data || {};
  } catch {
    return c.json({ error: "Invalid request body" }, 400);
  }

  console.log(`[push] Received request - tokens: ${tokens.length}, title: "${title}"`);

  if (!tokens.length || !title || !body) {
    console.log(`[push] Missing required fields - tokens: ${tokens.length}, title: "${title}", body length: ${body.length}`);
    return c.json({ error: "tokens, title, and body are required" }, 400);
  }

  // Filter to only valid Expo push tokens
  const validTokens = tokens.filter(
    (t) => typeof t === "string" && (t.startsWith("ExponentPushToken[") || t.startsWith("ExpoPushToken["))
  );

  console.log(`[push] Valid tokens: ${validTokens.length}/${tokens.length} - tokens: ${JSON.stringify(validTokens)}`);

  if (validTokens.length === 0) {
    console.log(`[push] No valid tokens. Raw tokens: ${JSON.stringify(tokens)}`);
    return c.json({ success: true, sent: 0, message: "No valid Expo push tokens" });
  }

  const messages: ExpoPushMessage[] = validTokens.map((token) => ({
    to: token,
    title,
    body,
    data,
    sound: "default",
    priority: "high",
  }));

  await sendExpoPushNotifications(messages);

  return c.json({ success: true, sent: validTokens.length });
});

/**
 * POST /api/notifications/send-to-players
 * Look up push tokens for given player IDs using the service-role key (bypasses RLS),
 * then send push notifications. Falls back to email/phone cross-team lookup.
 * Body: { playerIds: string[], title: string, body: string, data?: object }
 */
notificationsRouter.post("/send-to-players", async (c) => {
  let playerIds: string[] = [];
  let title: string = "";
  let body: string = "";
  let data: Record<string, any> = {};

  try {
    const req = await c.req.json();
    playerIds = req.playerIds || [];
    title = req.title || "";
    body = req.body || "";
    data = req.data || {};
  } catch {
    return c.json({ error: "Invalid request body" }, 400);
  }

  if (!playerIds.length || !title || !body) {
    return c.json({ error: "playerIds, title, and body are required" }, 400);
  }

  console.log(`[push] send-to-players: ${playerIds.length} player IDs, title: "${title}"`);

  // Fetch push tokens by player ID using service role (bypasses RLS)
  const { data: rows, error } = await supabaseAdmin
    .from("players")
    .select("id, email, phone, push_token")
    .in("id", playerIds);

  if (error) {
    console.error("[push] send-to-players: supabase error:", error.message);
  }

  const tokenMap: Record<string, string> = {};
  for (const row of rows || []) {
    if (row.push_token) tokenMap[row.id] = row.push_token;
  }

  // For players missing tokens, try cross-team lookup by email/phone
  const missingIds = playerIds.filter((id) => !tokenMap[id]);
  if (missingIds.length > 0) {
    const missingPlayers = (rows || []).filter((r: any) => missingIds.includes(r.id));
    const emails = missingPlayers.map((p: any) => p.email?.toLowerCase()).filter(Boolean);
    const phones = missingPlayers.map((p: any) => p.phone?.replace(/\D/g, '')).filter(Boolean);

    if (emails.length > 0 || phones.length > 0) {
      const { data: altRows } = await supabaseAdmin
        .from("players")
        .select("email, phone, push_token")
        .not("push_token", "is", null);

      for (const altRow of altRows || []) {
        if (!altRow.push_token) continue;
        const altEmail = altRow.email?.toLowerCase();
        const altPhone = altRow.phone?.replace(/\D/g, '');

        for (const missingPlayer of missingPlayers) {
          const id = missingPlayer.id;
          if (tokenMap[id]) continue;
          const mpEmail = missingPlayer.email?.toLowerCase();
          const mpPhone = missingPlayer.phone?.replace(/\D/g, '');
          if (
            (altEmail && mpEmail && altEmail === mpEmail) ||
            (altPhone && mpPhone && altPhone === mpPhone)
          ) {
            tokenMap[id] = altRow.push_token;
            console.log(`[push] send-to-players: found token for ${id} via email/phone fallback`);
          }
        }
      }
    }
  }

  const tokens = Object.values(tokenMap).filter(
    (t) => t && (t.startsWith("ExponentPushToken[") || t.startsWith("ExpoPushToken["))
  );

  console.log(`[push] send-to-players: ${playerIds.length} players → ${tokens.length} valid tokens`);

  if (tokens.length === 0) {
    return c.json({ success: true, sent: 0, message: "No valid push tokens found for given player IDs" });
  }

  const messages: ExpoPushMessage[] = tokens.map((token) => ({
    to: token,
    title,
    body,
    data,
    sound: "default",
    priority: "high",
  }));

  await sendExpoPushNotifications(messages);

  return c.json({ success: true, sent: tokens.length });
});

export { notificationsRouter };
