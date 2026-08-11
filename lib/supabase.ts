const restSuffix = /\/rest\/v1\/?$/;

export function getSupabaseConfig() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(restSuffix, "") || "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || process.env.SUPABASE_SECRET_KEY?.trim() || "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || "";
  const key = serviceKey || anonKey;

  return {
    url: rawUrl,
    restUrl: rawUrl ? `${rawUrl}/rest/v1` : "",
    storageUrl: rawUrl ? `${rawUrl}/storage/v1` : "",
    key,
    serviceKey,
    anonKey,
    enabled: Boolean(rawUrl && key),
    canWrite: Boolean(rawUrl && serviceKey)
  };
}

type QueryOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  query?: string;
  body?: unknown;
  prefer?: string;
};

export async function supabaseRest<T>(table: string, options: QueryOptions = {}): Promise<T> {
  const config = getSupabaseConfig();
  if (!config.enabled) {
    throw new Error("Supabase is not configured.");
  }

  const response = await fetch(`${config.restUrl}/${table}${options.query || ""}`, {
    method: options.method || "GET",
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
      "Content-Type": "application/json",
      ...(options.prefer ? { Prefer: options.prefer } : {})
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    cache: "no-store"
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Supabase ${table} request failed: ${response.status} ${detail}`);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export async function uploadToSupabaseStorage(bucket: string, objectPath: string, file: File) {
  const config = getSupabaseConfig();
  if (!config.canWrite) {
    throw new Error("Supabase Storage upload requires SUPABASE_SERVICE_ROLE_KEY.");
  }

  const response = await fetch(`${config.storageUrl}/object/${bucket}/${objectPath}`, {
    method: "POST",
    headers: {
      apikey: config.serviceKey,
      Authorization: `Bearer ${config.serviceKey}`,
      "Content-Type": file.type || "application/octet-stream",
      "x-upsert": "true"
    },
    body: Buffer.from(await file.arrayBuffer())
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Supabase Storage upload failed: ${response.status} ${detail}`);
  }

  return `${config.storageUrl}/object/public/${bucket}/${objectPath}`;
}
