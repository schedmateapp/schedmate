// js/supabaseClient.js
// IMPORTANT: paste your own Supabase anon key below.
// js/supabaseClient.js

const SUPABASE_URL = "https://dhgczaqzsuvcofqojoqv.supabase.co";

const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoZ2N6YXF6c3V2Y29mcW9qb3F2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMjU5NTEsImV4cCI6MjA3ODcwMTk1MX0.UMtWwzHHGJL0nP6AQyxDXUa8SDve_vfak1EYjYPqdXs";

if (!SUPABASE_ANON_KEY || SUPABASE_ANON_KEY.includes("PASTE_")) {
  console.warn("⚠️ Remember to paste your Supabase anon key in js/supabaseClient.js");
}

const { createClient } = window.supabase;
window.supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
