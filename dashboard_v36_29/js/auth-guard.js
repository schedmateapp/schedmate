// js/auth-guard.js
import { supabase } from "./supabase.js";

// Redirect to login if not authenticated
export async function requireAuth() {
  const { data, error } = await supabase.auth.getSession();

  if (error || !data || !data.session || !data.session.user) {
    window.location.href = "/login.html";
    return null;
  }

  return data.session;
}

// Logout helper
export async function logout() {
  await supabase.auth.signOut();
  window.localStorage.removeItem("sb_session");
  window.location.href = "/login.html";
}
