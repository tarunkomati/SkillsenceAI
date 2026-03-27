const trimTrailingSlashes = (value: string) => value.replace(/\/+$/, '');
const localHosts = new Set(['127.0.0.1', 'localhost']);
const frontendDevPorts = new Set(['4173', '5173', '8080']);

const configuredBase = trimTrailingSlashes(import.meta.env.VITE_API_BASE_URL || '');
const runtimeOrigin = typeof window !== 'undefined' ? trimTrailingSlashes(window.location.origin) : '';

const parseUrl = (value: string) => {
  try {
    return new URL(value);
  } catch {
    return null;
  }
};

const configuredUrl = parseUrl(configuredBase);
const runtimeUrl = parseUrl(runtimeOrigin);
const configuredIsLocal =
  configuredUrl !== null &&
  localHosts.has(configuredUrl.hostname);
const runtimeIsLocal =
  runtimeUrl !== null &&
  localHosts.has(runtimeUrl.hostname);
const servedByBackend =
  runtimeUrl !== null && !frontendDevPorts.has(runtimeUrl.port);
const inferredLocalBackend =
  runtimeUrl !== null &&
  runtimeIsLocal &&
  frontendDevPorts.has(runtimeUrl.port)
    ? `${runtimeUrl.protocol}//${runtimeUrl.hostname}:5000`
    : '';

export const apiBase =
  configuredIsLocal &&
  runtimeIsLocal &&
  servedByBackend &&
  configuredUrl !== null &&
  runtimeUrl !== null &&
  configuredUrl.origin !== runtimeUrl.origin
    ? runtimeOrigin
    : configuredBase || inferredLocalBackend || runtimeOrigin;

export const buildApiUrl = (path: string) => `${apiBase}${path}`;
