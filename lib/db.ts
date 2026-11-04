import { createClient } from "@supabase/supabase-js";

// Server-only client (service role). Never import this in a "use client" file.
const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

if (!url) throw new Error("Missing SUPABASE_URL in .env.local (restart `npm run dev` after editing it).");
if (!key) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY in .env.local. Use the SECRET key (sb_secret_...), not the publishable one.");

export const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });