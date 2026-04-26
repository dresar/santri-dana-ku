const API_URL = import.meta.env.VITE_API_URL || "/api";

export async function apiFetch<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("auth_token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  };

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    // Handle Zod flattened errors
    if (json.error && typeof json.error === "object" && json.error.fieldErrors) {
      const fieldErrs = Object.entries(json.error.fieldErrors)
        .map(([field, errs]) => `${field}: ${(errs as string[]).join(", ")}`)
        .join(" | ");
      throw new Error(`Validasi gagal: ${fieldErrs}`);
    }
    
    // Handle generic string errors or messages
    const errMsg = typeof json.error === "string" ? json.error : json.message;
    throw new Error(errMsg || `Request failed with status ${res.status}`);
  }

  // Auto-unwrap Hono standard response: { data, error, message }
  // If response has a "data" key return it, otherwise return full response
  return ("data" in json ? json.data : json) as T;
}

/** POST helper */
export const apiPost = (path: string, body: unknown) =>
  apiFetch(path, { method: "POST", body: JSON.stringify(body) });

/** PATCH helper */
export const apiPatch = (path: string, body: unknown) =>
  apiFetch(path, { method: "PATCH", body: JSON.stringify(body) });

/** DELETE helper */
export const apiDelete = (path: string) =>
  apiFetch(path, { method: "DELETE" });
