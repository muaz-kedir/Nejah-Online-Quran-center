/** Frontend origin for OAuth redirects and similar browser round-trips. */
export function getFrontendUrl(): string {
  const url =
    process.env.FRONTEND_URL?.trim() ||
    process.env.CORS_ORIGIN?.trim() ||
    'http://localhost:8080';
  return url.replace(/\/$/, '');
}
