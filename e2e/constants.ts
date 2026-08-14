// Matches vite.config.ts's `base: "/482910375/"` — the dev server serves the
// app at this path, not "/". Kept as an absolute path (rather than relying on
// baseURL's relative-URL resolution rules, which drop the base path for a
// leading "/") so every spec navigates to the same, unambiguous place.
export const APP_PATH = "/482910375/";
