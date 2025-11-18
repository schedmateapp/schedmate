// js/forgot-password.js
// Password reset using Supabase auth

import { supabase } from "./supabase.js";

const form = document.querySelector("form");
const emailInput = document.querySelector("#email");
const errorEl = document.querySelector("#error");
const msgEl = document.querySelector("#message");

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!emailInput || !errorEl || !msgEl) return;

    errorEl.textContent = "";
    msgEl.textContent = "";

    const email = emailInput.value.trim();
    if (!email) {
      errorEl.textContent = "Please enter your email.";
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) {
        console.error(error);
        errorEl.textContent = error.message || "Unable to send reset link. Please try again.";
        return;
      }
      msgEl.textContent = "Reset link sent! Please check your inbox.";
    } catch (err) {
      console.error(err);
      errorEl.textContent = err.message || "Unable to send reset link. Please try again.";
    }
  });
}
