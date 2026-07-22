// API base URL — set VITE_API_URL at build time in production (Vite inlines
// env vars into the static bundle). Falls back to the local dev API.
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
