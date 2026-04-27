function stripTrailingSlashes(value: string): string {
  return value.replace(/\/+$/, '');
}

export function getBackendOrigin(): string {
  const raw = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';
  return stripTrailingSlashes(raw);
}

export function getApiBaseUrl(): string {
  return `${getBackendOrigin()}/api`;
}
