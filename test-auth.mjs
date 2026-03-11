import { createClient } from "@supabase/supabase-js";
import 'dotenv/config';

async function testAuth() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const testEmail = `test_${Date.now()}@example.com`;
  const testPassword = "Password123!";

  console.log("1. Signing up...");
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
  });

  if (signUpError) {
    console.error("Signup error:", signUpError.message);
    return;
  }

  console.log("Signup success! User ID:", signUpData.user?.id);
  console.log("Session after signup:", !!signUpData.session);

  console.log("2. Attempting to log in immediately...");
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });

  if (signInError) {
    console.error("Login error:", signInError.message);
  } else {
    console.log("Login success! Session active.");
  }
}

testAuth();
