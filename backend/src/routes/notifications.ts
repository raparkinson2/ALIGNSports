import { Hono } from "hono";
import { createClient } from "@supabase/supabase-js";

const notificationsRouter = new Hono();

// Service-role Supabase client - bypasses RLS to read/write push tokens
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

interface ExpoPushTicket {
  status: "ok" | "error";
  id?: string;
  message?: string;
  details?: { error?: string };
}

function isValidExpoToken(t: unknown): t is string {
  return (
    typeof t === "string" &&
    (t.startsWith("ExponentPushToken[") || t.startsWith("ExpoPushToken["))
  );
}

/**
 * Send push notifications via Expo's push notification service.
 * Returns per-token results so callers can handle DeviceNotRegistered cleanup.
 */
async function sendExpoPushNotifications(
  messages: ExpoPushMessage[]
): Promise<Array<{ token: string; ticket: ExpoPushTicket }>> {
  const results: Array<{ token: string; ticket: ExpoPushTicket }> = [];
  const chunks: ExpoPushMessage[][] = [];
  for (let i = 0; i < messages.length; i += 100) {
    chunks.push(messages.slice(i, i + 100));
  }

  for (const chunk of chunks) {
    try {
      const res = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(chunk),
      });
      if (!res.ok) {
        const text = await res.text();
        console.error("[push] Expo API HTTP error:", text);
        chunk.forEach((msg) =>
          results.push({ token: msg.to, ticket: { status: "error", message: text } })
        );
      } else {
        const responseData = (await res.json()) as { data: ExpoPushTicket[] };
        if (responseData?.data) {
          responseData.data.forEach((ticket, i) => {
            const token = chunk[i]?.to ?? "";
            results.push({ token, ticket });
            if (ticket.status === "error") {
              console.error(`[push] Token error (to: ${token}): ${ticket.message} - ${JSON.stringify(ticket.details)}`);
            } else {
              console.log(`[push] Ticket ok id=${ticket.id} to=${token}`);
            }
          });
        }
      }
    } catch (err) {
      console.error("[push] Failed to reach Expo push API:", err);
      chunk.forEach((msg) =>
        results.push({ token: msg.to, ticket: { status: "error", message: String(err) } })
      );
    }
  }

  return results;
}

/**
 * Delete stale (DeviceNotRegistered) tokens from the push_tokens table.
 */
async function removeStaleTokens(staleTokens: string[]): Promise<void> {
  if (staleTokens.length === 0) return;
  const { error } = await supabaseAdmin
    .from("push_tokens")
    .delete()
    .in("token", staleTokens);
  if (error) {
    console.error("[push] Failed to remove stale tokens:", error.message);
  } else {
    console.log(`[push] Removed ${staleTokens.length} stale token(s)`);
  }
}

/**
 * POST /api/notifications/save-token
 * Upserts a push token into the dedicated push_tokens table.
 * Uses the token column as the unique conflict key so reinstalls don't create duplicates.
 * Body: { playerId: string, pushToken: string, platform?: string, appBuild?: string }
 */
notificationsRouter.post("/save-token", async (c) => {
  let playerId = "";
  let pushToken = "";
  let platform = "ios";
  let appBuild: string | null = null;
  try {
    const req = await c.req.json();
    playerId = req.playerId || "";
    pushToken = req.pushToken || "";
    platform = req.platform || "ios";
    appBuild = req.appBuild || null;
  } catch {
    return c.json({ error: "Invalid request body" }, 400);
  }

  if (!playerId || !pushToken) {
    return c.json({ error: "playerId and pushToken required" }, 400);
  }

  if (!isValidExpoToken(pushToken)) {
    console.log(`[push] save-token: invalid token format for player ${playerId}: ${pushToken}`);
    return c.json({ error: "Invalid Expo push token format" }, 400);
  }

  console.log(`[push] save-token: player=${playerId} platform=${platform} token=${pushToken}`);

  const { error } = await supabaseAdmin
    .from("push_tokens")
    .upsert(
      {
        player_id: playerId,
        token: pushToken,
        platform,
        app_build: appBuild,
        last_seen: new Date().toISOString(),
      },
      { onConflict: "token" } // token is unique — upsert updates last_seen on reinstall
    );

  if (error) {
    console.error("[push] save-token error:", error.message);
    return c.json({ error: error.message }, 500);
  }

  console.log(`[push] save-token: upserted token for player ${playerId}`);
  return c.json({ success: true });
});

/**
 * POST /api/notifications/send-push
 * Send a push notification to an explicit list of Expo push tokens.
 * Body: { tokens: string[], title: string, body: string, data?: object }
 */
notificationsRouter.post("/send-push", async (c) => {
  let tokens: string[] = [];
  let title = "";
  let body = "";
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

  if (!tokens.length || !title || !body) {
    return c.json({ error: "tokens, title, and body are required" }, 400);
  }

  const validTokens = tokens.filter(isValidExpoToken);
  console.log(`[push] send-push: ${validTokens.length}/${tokens.length} valid tokens`);

  if (validTokens.length === 0) {
    return c.json({ success: true, sent: 0, message: "No valid Expo push tokens" });
  }

  const messages: ExpoPushMessage[] = validTokens.map((token) => ({
    to: token, title, body, data, sound: "default", priority: "high",
  }));

  const results = await sendExpoPushNotifications(messages);
  const stale = results.filter(r => r.ticket.details?.error === "DeviceNotRegistered").map(r => r.token);
  await removeStaleTokens(stale);

  const sent = results.filter(r => r.ticket.status === "ok").length;
  return c.json({ success: true, sent });
});

/**
 * POST /api/notifications/send-to-players
 * Looks up ALL push tokens for the given player IDs from the push_tokens table,
 * sends to every registered device, and cleans up DeviceNotRegistered tokens.
 * Falls back to email/phone cross-match for players whose IDs may have changed.
 * Body: { playerIds: string[], title: string, body: string, data?: object }
 */
notificationsRouter.post("/send-to-players", async (c) => {
  let playerIds: string[] = [];
  let title = "";
  let body = "";
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

  console.log(`[push] send-to-players: ${playerIds.length} players, title: "${title}"`);

  // Primary: fetch tokens from push_tokens table by player_id
  const { data: tokenRows, error: tokenError } = await supabaseAdmin
    .from("push_tokens")
    .select("player_id, token, platform")
    .in("player_id", playerIds);

  if (tokenError) {
    console.error("[push] send-to-players: push_tokens fetch error:", tokenError.message);
  }

  const allTokens = new Set<string>();
  const tokenToPlayer: Record<string, string> = {};
  const playersWithTokens = new Set<string>();

  for (const row of tokenRows || []) {
    if (isValidExpoToken(row.token)) {
      allTokens.add(row.token);
      tokenToPlayer[row.token] = row.player_id;
      playersWithTokens.add(row.player_id);
      console.log(`[push] player ${row.player_id}: token via push_tokens table (${row.platform})`);
    }
  }

  // Fallback: for players with no token in push_tokens, check the legacy push_token column
  // and notification_preferences.pushToken in the players table (handles existing data)
  const missingIds = playerIds.filter((id) => !playersWithTokens.has(id));
  if (missingIds.length > 0) {
    console.log(`[push] ${missingIds.length} players not in push_tokens, checking legacy columns`);

    const { data: playerRows, error: playerError } = await supabaseAdmin
      .from("players")
      .select("id, email, phone, push_token, notification_preferences")
      .in("id", missingIds);

    if (playerError) {
      console.error("[push] send-to-players: players fetch error:", playerError.message);
    }

    const playersMissingEverywhere: typeof playerRows = [];

    for (const row of playerRows || []) {
      const prefs = (row.notification_preferences as any) || {};
      const legacyToken = row.push_token || prefs.pushToken;
      const prefTokens: string[] = Array.isArray(prefs.pushTokens)
        ? prefs.pushTokens.map((e: any) => e.token || e).filter(isValidExpoToken)
        : [];

      const candidates = [...new Set([legacyToken, ...prefTokens].filter(isValidExpoToken))];
      if (candidates.length > 0) {
        for (const t of candidates) {
          allTokens.add(t);
          tokenToPlayer[t] = row.id;
        }
        console.log(`[push] player ${row.id}: ${candidates.length} token(s) via legacy columns`);
      } else {
        console.log(`[push] player ${row.id}: NO tokens anywhere`);
        playersMissingEverywhere.push(row);
      }
    }

    // Cross-team email/phone fallback for players whose ID may have changed
    const emails = (playersMissingEverywhere || []).map((p: any) => p.email?.toLowerCase()).filter(Boolean);
    const phones = (playersMissingEverywhere || []).map((p: any) => p.phone?.replace(/\D/g, "")).filter(Boolean);

    if (emails.length > 0 || phones.length > 0) {
      // Check push_tokens table by matching email/phone via players join
      const { data: altPlayerRows } = await supabaseAdmin
        .from("players")
        .select("id, email, phone")
        .or(
          [
            ...emails.map((e: string) => `email.ilike.${e}`),
            ...phones.map((p: string) => `phone.eq.${p}`),
          ].join(",")
        );

      if (altPlayerRows && altPlayerRows.length > 0) {
        const altIds = altPlayerRows.map((r: any) => r.id);
        const { data: altTokenRows } = await supabaseAdmin
          .from("push_tokens")
          .select("player_id, token")
          .in("player_id", altIds);

        for (const altTok of altTokenRows || []) {
          if (isValidExpoToken(altTok.token) && !allTokens.has(altTok.token)) {
            // Map it back to the original player ID via email/phone match
            const altPlayer = altPlayerRows.find((r: any) => r.id === altTok.player_id);
            const origPlayer = (playersMissingEverywhere || []).find((p: any) => {
              const e = p.email?.toLowerCase();
              const ph = p.phone?.replace(/\D/g, "");
              return (e && e === altPlayer?.email?.toLowerCase()) ||
                     (ph && ph === altPlayer?.phone?.replace(/\D/g, ""));
            });
            if (origPlayer) {
              allTokens.add(altTok.token);
              tokenToPlayer[altTok.token] = origPlayer.id;
              console.log(`[push] player ${origPlayer.id}: found token via email/phone cross-match`);
            }
          }
        }
      }
    }
  }

  const tokenList = Array.from(allTokens);
  console.log(`[push] send-to-players: ${playerIds.length} players → ${tokenList.length} tokens`);

  if (tokenList.length === 0) {
    return c.json({ success: true, sent: 0, message: "No push tokens found for given player IDs" });
  }

  const messages: ExpoPushMessage[] = tokenList.map((token) => ({
    to: token, title, body, data, sound: "default", priority: "high",
  }));

  const results = await sendExpoPushNotifications(messages);

  // Clean up DeviceNotRegistered tokens
  const staleTokens = results
    .filter(r => r.ticket.status === "error" && r.ticket.details?.error === "DeviceNotRegistered")
    .map(r => r.token);
  await removeStaleTokens(staleTokens);

  const sent = results.filter(r => r.ticket.status === "ok").length;
  return c.json({ success: true, sent, total_tokens: tokenList.length });
});

/**
 * GET /api/notifications/debug-tokens?teamId=xxx
 * Returns push token status for all players on a team.
 */
notificationsRouter.get("/debug-tokens", async (c) => {
  const teamId = c.req.query("teamId");
  if (!teamId) return c.json({ error: "teamId required" }, 400);

  // Fetch all players on the team
  const { data: players, error: playersError } = await supabaseAdmin
    .from("players")
    .select("id, first_name, last_name, email")
    .eq("team_id", teamId);

  if (playersError) return c.json({ error: playersError.message }, 500);

  const playerIds = (players || []).map((p: any) => p.id);

  // Fetch all tokens for those players from push_tokens table
  const { data: tokenRows } = await supabaseAdmin
    .from("push_tokens")
    .select("player_id, token, platform, last_seen")
    .in("player_id", playerIds);

  // Group tokens by player
  const tokensByPlayer: Record<string, Array<{ token: string; platform: string; last_seen: string }>> = {};
  for (const row of tokenRows || []) {
    if (!tokensByPlayer[row.player_id]) tokensByPlayer[row.player_id] = [];
    tokensByPlayer[row.player_id]!.push({
      token: row.token,
      platform: row.platform,
      last_seen: row.last_seen,
    });
  }

  const result = (players || []).map((p: any) => {
    const tokens = tokensByPlayer[p.id] || [];
    return {
      id: p.id,
      name: `${p.first_name} ${p.last_name}`,
      email: p.email,
      token_count: tokens.length,
      has_token: tokens.length > 0,
      push_tokens: tokens,
    };
  });

  return c.json({
    players: result,
    count: result.length,
    with_token: result.filter((r: any) => r.has_token).length,
  });
});

export { notificationsRouter };
