import { Hono } from "hono";

const notificationsRouter = new Hono();

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
        const data = await res.json();
        console.log("Expo push response:", JSON.stringify(data).slice(0, 200));
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

  if (!tokens.length || !title || !body) {
    return c.json({ error: "tokens, title, and body are required" }, 400);
  }

  // Filter to only valid Expo push tokens
  const validTokens = tokens.filter(
    (t) => typeof t === "string" && (t.startsWith("ExponentPushToken[") || t.startsWith("ExpoPushToken["))
  );

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

export { notificationsRouter };
