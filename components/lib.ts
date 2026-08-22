"use client";

export class ApiError extends Error {
  code: string;
  status: number;
  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

async function request<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    credentials: "same-origin",
    ...options,
    headers: {
      ...(options.body && !(options.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
      ...(options.headers ?? {}),
    },
  });
  let data: any = null;
  try {
    data = await res.json();
  } catch {
    /* non-json */
  }
  if (!res.ok) {
    const code = data?.error?.code ?? "ERROR";
    const message = data?.error?.message ?? data?.message ?? "Terjadi kesalahan.";
    throw new ApiError(code, message, res.status);
  }
  return data as T;
}

export const api = {
  get: <T = unknown>(path: string) => request<T>(path),
  post: <T = unknown>(path: string, body?: unknown, isForm = false) =>
    request<T>(path, { method: "POST", body: isForm ? (body as FormData) : body ? JSON.stringify(body) : undefined }),
  patch: <T = unknown>(path: string, body?: unknown) => request<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
  put: <T = unknown>(path: string, body?: unknown) => request<T>(path, { method: "PUT", body: body ? JSON.stringify(body) : undefined }),
  del: <T = unknown>(path: string, body?: unknown) => request<T>(path, { method: "DELETE", body: body ? JSON.stringify(body) : undefined }),
};
