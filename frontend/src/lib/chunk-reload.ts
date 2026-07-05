const CHUNK_RELOAD_KEY = "nejah-chunk-reload";

function isChunkLoadError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("failed to fetch dynamically imported module") ||
    lower.includes("importing a module script failed") ||
    lower.includes("error loading dynamically imported module")
  );
}

function tryReloadOnce(): void {
  try {
    if (sessionStorage.getItem(CHUNK_RELOAD_KEY)) return;
    sessionStorage.setItem(CHUNK_RELOAD_KEY, "1");
  } catch {
    // sessionStorage may be unavailable; still attempt reload
  }
  window.location.reload();
}

/** Recover from stale chunk hashes after deploy (often caused by aggressive SW caching). */
export function setupChunkLoadRecovery(): void {
  if (typeof window === "undefined") return;

  try {
    sessionStorage.removeItem(CHUNK_RELOAD_KEY);
  } catch {
    // ignore
  }

  window.addEventListener("error", (event) => {
    if (event.message && isChunkLoadError(event.message)) {
      tryReloadOnce();
    }
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    const message =
      typeof reason === "string"
        ? reason
        : reason instanceof Error
          ? reason.message
          : "";
    if (message && isChunkLoadError(message)) {
      event.preventDefault();
      tryReloadOnce();
    }
  });
}
