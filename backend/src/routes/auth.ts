import { Hono } from "hono";

const authRouter = new Hono();

/**
 * DELETE /api/auth/delete-user
 * Deletes a single user from Supabase Auth using the service role key.
 * Called by "Delete Account" flow.
 * Body: { email: string }
 */
authRouter.post("/delete-user", async (c) => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return c.json({ error: "Supabase admin not configured" }, 503);
  }

  let email: string | undefined;
  try {
    const body = await c.req.json();
    email = body.email;
  } catch {
    return c.json({ error: "Invalid request body" }, 400);
  }

  if (!email) {
    return c.json({ error: "email is required" }, 400);
  }

  try {
    // Look up the user by email via Admin API
    const listRes = await fetch(
      `${supabaseUrl}/auth/v1/admin/users?email=${encodeURIComponent(email)}`,
      {
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          apikey: serviceRoleKey,
        },
      }
    );

    if (!listRes.ok) {
      const err = await listRes.text();
      console.error("delete-user: list users error:", err);
      return c.json({ error: "Failed to look up user" }, 500);
    }

    const listData = await listRes.json() as { users?: any[] };
    const users = listData.users || [];
    const user = users.find((u: any) => u.email?.toLowerCase() === email!.toLowerCase());

    if (!user) {
      // User not found in auth — treat as success (already deleted or never created)
      return c.json({ success: true, message: "User not found in auth (already deleted)" });
    }

    // Delete the user
    const deleteRes = await fetch(
      `${supabaseUrl}/auth/v1/admin/users/${user.id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          apikey: serviceRoleKey,
        },
      }
    );

    if (!deleteRes.ok) {
      const err = await deleteRes.text();
      console.error("delete-user: delete error:", err);
      return c.json({ error: "Failed to delete user from auth" }, 500);
    }

    console.log(`delete-user: deleted auth user ${user.id} (${email})`);
    return c.json({ success: true });
  } catch (err) {
    console.error("delete-user: unexpected error:", err);
    return c.json({ error: "Unexpected error" }, 500);
  }
});

/**
 * POST /api/auth/delete-users
 * Deletes multiple users from Supabase Auth using the service role key.
 * Called by "Delete Team" nuclear option.
 * Body: { emails: string[] }
 */
authRouter.post("/delete-users", async (c) => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return c.json({ error: "Supabase admin not configured" }, 503);
  }

  let emails: string[] = [];
  try {
    const body = await c.req.json();
    emails = body.emails || [];
  } catch {
    return c.json({ error: "Invalid request body" }, 400);
  }

  if (!emails.length) {
    return c.json({ success: true, deleted: 0 });
  }

  try {
    // Fetch all auth users (paginated, up to 1000)
    const listRes = await fetch(
      `${supabaseUrl}/auth/v1/admin/users?per_page=1000`,
      {
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          apikey: serviceRoleKey,
        },
      }
    );

    if (!listRes.ok) {
      const err = await listRes.text();
      console.error("delete-users: list error:", err);
      return c.json({ error: "Failed to list users" }, 500);
    }

    const listData = await listRes.json() as { users?: any[] };
    const allUsers: any[] = listData.users || [];

    const emailsLower = emails.map((e) => e.toLowerCase());
    const toDelete = allUsers.filter((u) =>
      u.email && emailsLower.includes(u.email.toLowerCase())
    );

    let deleted = 0;
    const errors: string[] = [];

    for (const user of toDelete) {
      const deleteRes = await fetch(
        `${supabaseUrl}/auth/v1/admin/users/${user.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${serviceRoleKey}`,
            apikey: serviceRoleKey,
          },
        }
      );

      if (deleteRes.ok) {
        deleted++;
        console.log(`delete-users: deleted auth user ${user.id} (${user.email})`);
      } else {
        const err = await deleteRes.text();
        console.error(`delete-users: failed to delete ${user.email}:`, err);
        errors.push(user.email);
      }
    }

    return c.json({ success: true, deleted, errors });
  } catch (err) {
    console.error("delete-users: unexpected error:", err);
    return c.json({ error: "Unexpected error" }, 500);
  }
});

export { authRouter };
