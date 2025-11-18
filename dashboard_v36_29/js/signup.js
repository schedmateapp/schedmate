// js/signup.js
import { supabase } from "./supabase.js";

const form = document.getElementById("signup-form");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const submitBtn = document.getElementById("create-account-btn");
const errorEl = document.getElementById("signup-error");

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (errorEl) errorEl.textContent = "";

    if (!email || !password) {
      if (errorEl) {
        errorEl.textContent = "Please enter a valid email and password.";
      } else {
        alert("Please enter a valid email and password.");
      }
      return;
    }

    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Creating account...";
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        console.error("Sign up error:", error);
        if (errorEl) {
          errorEl.textContent = error.message || "Unable to create your account.";
        } else {
          alert(error.message || "Unable to create your account.");
        }
        return;
      }

      // If email confirmation is enabled in Supabase, the user will need to
      // confirm their email before they can log in.
      // Redirect to a simple thank-you page so they understand what to do next.
      window.location.href = "/thank-you.html";
    } catch (err) {
      console.error("Unexpected sign up error:", err);
      if (errorEl) {
        errorEl.textContent = err.message || "Unexpected error — please try again.";
      } else {
        alert("Unexpected error — please try again.");
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Create account";
      }
    }
  });
}
