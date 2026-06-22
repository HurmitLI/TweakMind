export function isTauriRuntime() {
  return "__TAURI_INTERNALS__" in window;
}

export function nowTimestamp() {
  return Math.floor(Date.now() / 1000).toString();
}
