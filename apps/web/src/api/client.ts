import type { ApiErrorBody, ErrorCode } from '@otl/shared';

/** A failed API call, carrying the error envelope's code (AD-8). */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: ErrorCode | 'NETWORK_ERROR',
    message: string,
  ) {
    super(message);
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, { ...init, headers: { Accept: 'application/json', ...init?.headers } });
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', 'The server cannot be reached.');
  }
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ApiErrorBody | null;
    throw new ApiError(response.status, body?.error.code ?? 'INTERNAL_ERROR', body?.error.message ?? response.statusText);
  }
  return (await response.json()) as T;
}

export const isNotFound = (error: unknown) => error instanceof ApiError && error.status === 404;
