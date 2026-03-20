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

  const explicitFilename = formData.get("filename");
  const rawName =
    (file as File).name ||
    (typeof explicitFilename === "string" ? explicitFilename : null) ||
    `upload_${Date.now()}`;
  const safeName = rawName.replace(/[^a-zA-Z0-9._\-() ]/g, "_");

  // Include a timestamp so every upload produces a unique storage entry even
  // when the same filename is re-uploaded. Format: teamId__<ts>__originalName
  const ts = Date.now();
  const prefixedName = `${teamId}__${ts}__${safeName}`;
  const renamedFile = new File([file], prefixedName, { type: file.type });

  const storageForm = new FormData();
  storageForm.append("file", renamedFile);

  let response: Response;
  try {
    response = await fetch(`${STORAGE_BASE}/files/upload`, {
      method: "POST",
      body: storageForm,
    });
  } catch (fetchErr) {
    console.error("[files] Storage fetch error:", fetchErr);
    return c.json({ error: "Storage service unavailable" }, 500);
  }

  const responseText = await response.text().catch(() => "");

  if (!response.ok) {
    let errMsg = "Upload failed";
    try {
      const err = JSON.parse(responseText);
      if (err?.error) errMsg = err.error;
    } catch {}
    console.error("[files] Storage error response:", response.status, responseText.slice(0, 300));
    return c.json({ error: errMsg }, 500);
  }

  let result: any;
  try {
    result = JSON.parse(responseText);
  } catch {
    console.error("[files] Storage returned non-JSON:", responseText.slice(0, 300));
    return c.json({ error: "Storage service returned unexpected response" }, 500);
  }

  // Storage service may wrap in { file: {...} } or return the object directly
  const raw = result?.file ?? result?.data ?? result;
  console.log("[files] Storage upload result keys:", Object.keys(raw ?? {}));

  if (!raw?.id) {
    console.error("[files] Storage response missing id:", JSON.stringify(result).slice(0, 300));
    return c.json({ error: "Storage returned incomplete file data" }, 500);
  }

  const fileData = {
    ...raw,
    displayName: safeName,
  };
  return c.json({ data: fileData });
});

// List files for a team
filesRouter.get("/:teamId", async (c) => {
  const { teamId } = c.req.param();

  let response: Response;
  try {
    response = await fetch(`${STORAGE_BASE}/files?limit=500`);
  } catch (fetchErr) {
    console.error("[files] Storage list error:", fetchErr);
    return c.json({ error: "Storage service unavailable" }, 500);
  }

  if (!response.ok) {
    return c.json({ error: "Failed to list files" }, 500);
  }

  const result = (await response.json()) as { files: any[] };
  const allFiles = result.files ?? [];
  const prefix = `${teamId}__`;

  // Log to help diagnose which fields the storage service returns
  if (allFiles.length > 0) {
    const sample = allFiles[0];
    console.log(`[files] list: total=${allFiles.length} sample_keys=${Object.keys(sample).join(",")}`);
  } else {
    console.log(`[files] list: storage returned 0 files total`);
  }

  const teamFiles = allFiles
    .filter((f: any) => {
      // Storage service may use originalFilename, filename, or name
      const fname = f.originalFilename ?? f.filename ?? f.name ?? "";
      return fname.startsWith(prefix);
    })
    .map((f: any) => {
      const fname = f.originalFilename ?? f.filename ?? f.name ?? "";
      const withoutTeam = fname.slice(prefix.length);
      const displayName = withoutTeam.replace(/^\d{10,}__/, "");
      // Normalise so the frontend always gets originalFilename
      return { ...f, originalFilename: fname, displayName };
    });

  console.log(`[files] list: teamId=${teamId} matched=${teamFiles.length}`);
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
