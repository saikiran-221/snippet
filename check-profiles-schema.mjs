import { createClient } from "@supabase/supabase-js";
import 'dotenv/config';
import fs from 'fs';

async function checkProfiles() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost:54321";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "public-anon-key";

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { data, error } = await supabase.from('profiles').select('*').limit(1);

  if (error) {
    console.error("Error fetching profiles:", error);
    process.exit(1);
  }

  if (data && data.length > 0) {
    fs.writeFileSync('out.json', JSON.stringify(data[0], null, 2), 'utf8');
  }
}

checkProfiles();
