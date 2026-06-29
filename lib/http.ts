// HTTP helper dung chung: timeout (chong treo khi upstream cham), User-Agent,
// va loi sach (thong diep ro thay vi treo hoac 500 trong). Moi endpoint goi nguon
// ngoai nen di qua day de co do tin cay dong nhat.
const DEFAULT_UA = "booAPI/1.0 (+https://booapi-tempo.vercel.app)";

export type FetchOpts = {
  timeoutMs?: number;
  method?: string;
  headers?: Record<string, string>;
  body?: string;
};

// Goi fetch co timeout. Tra ve Response. Throw loi sach neu timeout/loi mang.
export async function fetchWithTimeout(url: string, opts: FetchOpts = {}): Promise<Response> {
  const timeoutMs = opts.timeoutMs ?? 6000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: opts.method,
      headers: { "User-Agent": DEFAULT_UA, ...(opts.headers || {}) },
      body: opts.body,
      cache: "no-store",
      signal: controller.signal,
    });
    return res;
  } catch (err: any) {
    if (err?.name === "AbortError") {
      throw new Error("upstream timeout after " + timeoutMs + "ms: " + hostOf(url));
    }
    throw new Error("upstream fetch failed: " + hostOf(url) + " (" + (err?.message || "network error") + ")");
  } finally {
    clearTimeout(timer);
  }
}

// Goi + parse JSON, kiem status, loi sach. Dung cho hau het endpoint.
export async function fetchJson<T = any>(url: string, opts: FetchOpts = {}): Promise<T> {
  const res = await fetchWithTimeout(url, opts);
  if (!res.ok) {
    throw new Error("upstream HTTP " + res.status + " from " + hostOf(url));
  }
  try {
    return (await res.json()) as T;
  } catch {
    throw new Error("upstream returned invalid JSON from " + hostOf(url));
  }
}

// Bien the "khong throw": tra ve null neu loi (cho cac nguon phu, fail mem).
export async function fetchJsonSafe<T = any>(url: string, opts: FetchOpts = {}): Promise<T | null> {
  try {
    return await fetchJson<T>(url, opts);
  } catch {
    return null;
  }
}

function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url.slice(0, 40);
  }
}
