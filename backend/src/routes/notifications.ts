import { Hono } from "hono";
import { createClient } from "@supabase/supabase-js";

const notificationsRouter = new Hono();

// Service-role Supabase client - bypasses RLS to read/write push tokens
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface PushTokenEntry {
  token: string;
  platform: string;
  lastSeen: string; // ISO date string
}

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

function isValidExpoToken(t: string): boolean {
  return (
    typeof t === "string" &&
    (t.startsWith("ExponentPushToken[") || t.startsWith("ExpoPushToken["))
  );
}

/**
 * Send push notifications via Expo's push notification service.
 * Returns a map of token -> ticket for receipt processing.
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
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(chunk),
      });
      if (!res.ok) {
        const text = await res.text();
        console.error("[push] Expo API error:", text);
        // Mark all as error
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
              console.error(
                `[push] Token error (to: ${token}): ${ticket.message} - ${JSON.stringify(ticket.details)}`
              );
            } else {
              console.log(`[push] Ticket ok id=${ticket.id} to=${token}`);
            }
          });
        }
      }
    } catch (err) {
      console.error("[push] Failed to send push notifications:", err);
      chunk.forEach((msg) =>
        results.push({ token: msg.to, ticket: { status: "error", message: String(err) } })
      );
    }
  }

  return results;
}

/**
 * Remove stale/invalid tokens from a player's notification_preferences.pushTokens array.
 * Also clears push_token column if it matches a stale token.
 */
async function removeStaleTokens(
  playerId: string,
  staleTokens: string[]
): Promise<void> {
  if (staleTokens.length === 0) return;

  const { data: rows } = await supabaseAdmin
    .from("players")
    .select("id, push_token, notification_preferences")
    .eq("id", playerId)
    .single();

  if (!rows) return;

  const prefs = (rows.notification_preferences as any) || {};
  const existingEntries: PushTokenEntry[] = Array.isArray(prefs.pushTokens)
    ? prefs.pushTokens
    : [];

  const filtered = existingEntries.filter(
    (e) => !staleTokens.includes(e.token)
  );

  const newPushToken = staleTokens.includes(rows.push_token)
    ? (filtered[0]?.token ?? null)
    : rows.push_token;

  await supabaseAdmin
    .from("players")
    .update({
      push_token: newPushToken,
      notification_preferences: {
        ...prefs,
        pushTokens: filtered,
        pushToken: newPushToken ?? prefs.pushToken,
      },
    })
    .eq("id", playerId);

  console.log(
    `[push] Removed ${staleTokens.length} stale token(s) for player ${playerId}`
  );
}

/**
 * POST /api/notifications/save-token
 * Saves a push token for a player using the service-role key (bypasses RLS).
 * Stores multiple tokens per player in notification_preferences.pushTokens array.
 * Body: { playerId: string, pushToken: string, platform?: string }
 */
notificationsRouter.post("/save-token", async (c) => {
  let playerId = "";
  let pushToken = "";
  let platform = "ios";
  try {
    const req = await c.req.json();
    playerId = req.playerId || "";
    pushToken = req.pushToken || "";
    platform = req.platform || "ios";
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

  // Read current prefs to merge token into array
  const { data: existing } = await supabaseAdmin
    .from("players")
    .select("id, notification_preferences")
    .eq("id", playerId)
    .single();

  const prefs = (existing?.notification_preferences as any) || {};
  const existingEntries: PushTokenEntry[] = Array.isArray(prefs.pushTokens)
    ? prefs.pushTokens
    : [];

  // Upsert: update lastSeen if token exists, otherwise add new entry
  const now = new Date().toISOString();
  const idx = existingEntries.findIndex((e) => e.token === pushToken);
  if (idx >= 0 && existingEntries[idx]) {
    existingEntries[idx].lastSeen = now;
    existingEntries[idx].platform = platform;
    console.log(`[push] save-token: updated existing token entry for player ${playerId}`);
  } else {
    existingEntries.push({ token: pushToken, platform, lastSeen: now });
    console.log(`[push] save-token: added new token for player ${playerId} (total: ${existingEntries.length})`);
  }

  // Keep only the 5 most recently seen tokens per player to avoid stale buildup
  existingEntries.sort(
    (a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime()
  );
  const trimmed = existingEntries.slice(0, 5);

  const { data, error } = await supabaseAdmin
    .from("players")
    .update({
      push_token: pushToken, // keep single column in sync for legacy reads
      notification_preferences: {
        ...prefs,
        pushToken: pushToken,
        pushTokens: trimmed,
      },
    })
    .eq("id", playerId)
    .select("id");

  if (error) {
    console.error("[push] save-token error:", error.message);
    return c.json({ error: error.message }, 500);
  }

  const rowsUpdated = data?.length ?? 0;
  console.log(`[push] save-token: updated ${rowsUpdated} rows for player ${playerId}`);

  if (rowsUpdated === 0) {
    const { error: upsertError } = await supabaseAdmin
      .from("players")
      .upsert(
        {
          id: playerId,
          push_token: pushToken,
          notification_preferences: {
            pushToken: pushToken,
            pushTokens: trimmed,
          },
        },
        { onConflict: "id" }
      );
    if (upsertError) {
      console.error("[push] save-token upsert error:", upsertError.message);
      return c.json({ error: upsertError.message }, 500);
    }
    console.log(`[push] save-token: upserted player ${playerId}`);
  }

  return c.json({ success: true, rowsUpdated, tokenCount: trimmed.length });
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

  console.log(`[push] send-push received - tokens: ${tokens.length}, title: "${title}"`);

  if (!tokens.length || !title || !body) {
    return c.json({ error: "tokens, title, and body are required" }, 400);
  }

  const validTokens = tokens.filter(isValidExpoToken);
  console.log(`[push] send-push valid tokens: ${validTokens.length}/${tokens.length}`);

  if (validTokens.length === 0) {
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
 * Look up ALL push tokens for given player IDs (service-role, bypasses RLS),
 * send to every device, and clean up DeviceNotRegistered tokens.
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

  // Fetch all token data by player ID using service role (bypasses RLS)
  const { data: rows, error } = await supabaseAdmin
    .from("players")
    .select("id, email, phone, push_token, notification_preferences")
    .in("id", playerIds);

  if (error) {
    console.error("[push] send-to-players: supabase error:", error.message);
  }

  console.log(
    `[push] send-to-players: DB returned ${rows?.length ?? 0} rows for ${playerIds.length} IDs`
  );

  // Collect all tokens per player (multi-device support)
  // token -> playerId mapping for cleanup after send
  const tokenToPlayer: Record<string, string> = {};
  const allTokens = new Set<string>();

  for (const row of rows || []) {
    const prefs = (row.notification_preferences as any) || {};
    const tokenEntries: PushTokenEntry[] = Array.isArray(prefs.pushTokens)
      ? prefs.pushTokens
      : [];

    const playerTokens: string[] = [];

    // Collect from pushTokens array first (multi-device)
    for (const entry of tokenEntries) {
      if (isValidExpoToken(entry.token)) {
        playerTokens.push(entry.token);
      }
    }

    // Also check legacy single-token columns
    const legacyToken = row.push_token || prefs.pushToken;
    if (legacyToken && isValidExpoToken(legacyToken) && !playerTokens.includes(legacyToken)) {
      playerTokens.push(legacyToken);
    }

    if (playerTokens.length > 0) {
      console.log(`[push] player ${row.id}: ${playerTokens.length} token(s)`);
      for (const t of playerTokens) {
        allTokens.add(t);
        tokenToPlayer[t] = row.id;
      }
    } else {
      console.log(`[push] player ${row.id}: NO tokens`);
    }
  }

  // For players with no tokens, try cross-team email/phone lookup
  const foundPlayerIds = new Set((rows || []).map((r: any) => r.id));
  const missingIds = playerIds.filter((id) => {
    if (!foundPlayerIds.has(id)) return true; // not found by ID at all
    const row = (rows || []).find((r: any) => r.id === id);
    if (!row) return true;
    const prefs = (row.notification_preferences as any) || {};
    const hasTokens =
      (Array.isArray(prefs.pushTokens) && prefs.pushTokens.length > 0) ||
      row.push_token ||
      prefs.pushToken;
    return !hasTokens;
  });

  if (missingIds.length > 0) {
    const missingPlayers = (rows || []).filter((r: any) => missingIds.includes(r.id));
    const emails = missingPlayers
      .map((p: any) => p.email?.toLowerCase())
      .filter(Boolean);
    const phones = missingPlayers
      .map((p: any) => p.phone?.replace(/\D/g, ""))
      .filter(Boolean);

    console.log(
      `[push] send-to-players: ${missingIds.length} players missing tokens, trying email/phone fallback`
    );

    if (emails.length > 0 || phones.length > 0) {
      const { data: altRows } = await supabaseAdmin
        .from("players")
        .select("id, email, phone, push_token, notification_preferences")
        .or("push_token.not.is.null,notification_preferences->>pushToken.not.is.null");

      for (const altRow of altRows || []) {
        const altPrefs = (altRow.notification_preferences as any) || {};
        const altTokenEntries: PushTokenEntry[] = Array.isArray(altPrefs.pushTokens)
          ? altPrefs.pushTokens
          : [];
        const altTokenList = [
          ...altTokenEntries.map((e) => e.token),
          altRow.push_token,
          altPrefs.pushToken,
        ].filter((t): t is string => !!t && isValidExpoToken(t));

        if (altTokenList.length === 0) continue;

        const altEmail = altRow.email?.toLowerCase();
        const altPhone = altRow.phone?.replace(/\D/g, "");

        for (const missingPlayer of missingPlayers) {
          const id = missingPlayer.id;
          const mpEmail = missingPlayer.email?.toLowerCase();
          const mpPhone = missingPlayer.phone?.replace(/\D/g, "");

          if (
            (altEmail && mpEmail && altEmail === mpEmail) ||
            (altPhone && mpPhone && altPhone === mpPhone)
          ) {
            for (const t of altTokenList) {
              if (!allTokens.has(t)) {
                allTokens.add(t);
                tokenToPlayer[t] = id;
                console.log(`[push] found token for ${id} via email/phone fallback`);
              }
            }
          }
        }
      }
    }
  }

  const tokenList = Array.from(allTokens);
  console.log(
    `[push] send-to-players: ${playerIds.length} players → ${tokenList.length} total tokens`
  );

  if (tokenList.length === 0) {
    return c.json({
      success: true,
      sent: 0,
      message: "No valid push tokens found for given player IDs",
    });
  }

  const messages: ExpoPushMessage[] = tokenList.map((token) => ({
    to: token,
    title,
    body,
    data,
    sound: "default",
    priority: "high",
  }));

  const results = await sendExpoPushNotifications(messages);

  // Clean up DeviceNotRegistered tokens
  const staleByPlayer: Record<string, string[]> = {};
  for (const { token, ticket } of results) {
    if (
      ticket.status === "error" &&
      ticket.details?.error === "DeviceNotRegistered"
    ) {
      const pid = tokenToPlayer[token];
      if (pid) {
        if (!staleByPlayer[pid]) staleByPlayer[pid] = [];
        staleByPlayer[pid].push(token);
      }
    }
  }

  for (const [pid, staleTokens] of Object.entries(staleByPlayer)) {
    await removeStaleTokens(pid, staleTokens);
  }

  const sent = results.filter((r) => r.ticket.status === "ok").length;
  return c.json({ success: true, sent, total_tokens: tokenList.length });
});

/**
 * GET /api/notifications/debug-tokens?teamId=xxx
 * Returns push token status for all players on a team (for debugging).
 */
notificationsRouter.get("/debug-tokens", async (c) => {
  const teamId = c.req.query("teamId");
  if (!teamId) return c.json({ error: "teamId required" }, 400);

  const { data: rows, error } = await supabaseAdmin
    .from("players")
    .select("id, first_name, last_name, email, push_token, notification_preferences")
    .eq("team_id", teamId);

  if (error) return c.json({ error: error.message }, 500);

  const result = (rows || []).map((r: any) => {
    const prefs = (r.notification_preferences as any) || {};
    const tokenEntries: PushTokenEntry[] = Array.isArray(prefs.pushTokens)
      ? prefs.pushTokens
      : [];
    return {
      id: r.id,
      name: `${r.first_name} ${r.last_name}`,
      email: r.email,
      push_token: r.push_token ?? null,
      push_tokens: tokenEntries,
      token_count: tokenEntries.length,
      has_token: !!(
        r.push_token ||
        prefs.pushToken ||
        tokenEntries.length > 0
      ),
    };
  });

  return c.json({
    players: result,
    count: result.length,
    with_token: result.filter((r: any) => r.has_token).length,
  });
});

export { notificationsRouter };
