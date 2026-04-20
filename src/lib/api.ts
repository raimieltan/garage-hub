const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

function getToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

async function request<T>(
  method: string,
  url: string,
  body?: unknown
): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${url}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const errorData = (await response.json()) as { error?: string; message?: string };
      message = errorData.error ?? errorData.message ?? message;
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const api = {
  get<T>(url: string): Promise<T> {
    return request<T>("GET", url);
  },
  post<T>(url: string, body?: unknown): Promise<T> {
    return request<T>("POST", url, body);
  },
  put<T>(url: string, body?: unknown): Promise<T> {
    return request<T>("PUT", url, body);
  },
  patch<T>(url: string, body?: unknown): Promise<T> {
    return request<T>("PATCH", url, body);
  },
  delete<T>(url: string): Promise<T> {
    return request<T>("DELETE", url);
  },
};
