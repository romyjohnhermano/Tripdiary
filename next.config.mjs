const supabaseHost = process.env.SUPABASE_URL ? new URL(process.env.SUPABASE_URL).hostname : "*.supabase.co";
/** @type {import('next').NextConfig} */
export default {
  images: { remotePatterns: [{ protocol: "https", hostname: supabaseHost }] },
  experimental: { serverActions: { bodySizeLimit: "6mb" } },
};
