import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost:54321";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "public-anon-key";

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  if (process.env.NODE_ENV !== "production") {
    console.warn("⚠️ Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  } else {
    // We log error in prod, but don't throw at root level module evaluation
    // because Next.js sometimes evaluates modules during static generation
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
}

/**
 * Singleton Supabase client for use throughout the frontend app.
 * Automatically synchronizes auth state to HTTP cookies for Next.js SSR.
 * Do NOT import this in Server Components — use createClient in supabase-server.ts.
 */
export const supabase = createBrowserClient(
  supabaseUrl,
  supabaseAnonKey
);
