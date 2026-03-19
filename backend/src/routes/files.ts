import { Hono } from "hono";

const filesRouter = new Hono();

const STORAGE_BASE = "https://storage.vibecodeapp.com/v1";

// Blocked MIME type prefixes
const BLOCKED_PREFIXES = ["video/", "audio/"];

function isAllowedType(contentType: string): boolean {
  return !BLOCKED_PREFIXES.some((prefix) => contentType.startsWith(prefix));
}

// Upload a file for a team
filesRouter.post("/upload/:teamId", async (c) => {
  const { teamId } = c.req.param();

  let formData: FormData;
  try {
    formData = await c.req.formData();
  } catch {
    return c.json({ error: "Invalid form data" }, 400);
  }

  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return c.json({ error: "No file provided" }, 400);
  }

  if (!isAllowedType(file.type)) {
    return c.json({ error: "Video and audio files are not allowed" }, 400);
  }

  // Prefix filename with teamId so we can filter by team later
  const safeName = file.name.replace(/[^a-zA-Z0-9._\-() ]/g, "_");
  const prefixedName = `${teamId}__${safeName}`;
  const renamedFile = new File([file], prefixedName, { type: file.type });

  const storageForm = new FormData();
  storageForm.append("file", renamedFile);

  const response = await fetch(`${STORAGE_BASE}/files/upload`, {
    method: "POST",
    body: storageForm,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    return c.json({ error: (err as any).error || "Upload failed" }, 500);
  }

  const result = (await response.json()) as { file: any };
  // Strip the teamId prefix from the display name
  const fileData = {
    ...result.file,
    displayName: safeName,
  };
  return c.json({ data: fileData });
});

// List files for a team
filesRouter.get("/:teamId", async (c) => {
  const { teamId } = c.req.param();

  const response = await fetch(`${STORAGE_BASE}/files?limit=500`);

  if (!response.ok) {
    return c.json({ error: "Failed to list files" }, 500);
  }

  const result = (await response.json()) as { files: any[] };
  const prefix = `${teamId}__`;

  const teamFiles = (result.files ?? [])
    .filter((f: any) => f.originalFilename?.startsWith(prefix))
    .map((f: any) => ({
      ...f,
      displayName: f.originalFilename.slice(prefix.length),
    }));

  return c.json({ data: teamFiles });
});

// Delete a file
filesRouter.delete("/delete/:fileId", async (c) => {
  const { fileId } = c.req.param();

  const response = await fetch(`${STORAGE_BASE}/files/${fileId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    return c.json({ error: "Delete failed" }, 500);
  }

  return c.json({ data: { success: true } });
});

export { filesRouter };
