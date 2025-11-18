import { supabase } from "./supabase.js";

async function fetchSessionUser() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error("Error getting session", error);
    return null;
  }
  if (!data.session) {
    window.location.href = "/login.html";
    return null;
  }
  return data.session.user;
}

async function setup() {
  const user = await fetchSessionUser();
  if (!user) return;

  const emailSlot = document.querySelector("[data-user-email]");
  if (emailSlot && user.email) {
    emailSlot.textContent = user.email;
  }

  const form = document.getElementById("clientForm");
  const errorEl = document.getElementById("clientError");
  const serviceSelect = document.getElementById("serviceType");
  const customWrapper = document.getElementById("customServiceTypeWrapper");
  const customInput = document.getElementById("customServiceType");
  const saveBtn = document.getElementById("saveClientBtn");

  if (serviceSelect && customWrapper && customInput) {
    serviceSelect.addEventListener("change", () => {
      if (serviceSelect.value === "custom") {
        customWrapper.style.display = "block";
        customInput.focus();
      } else {
        customWrapper.style.display = "none";
        customInput.value = "";
      }
    });
  }

  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (errorEl) errorEl.textContent = "";

    const formData = new FormData(form);
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const notes = String(formData.get("notes") || "").trim();
    const serviceType = String(formData.get("serviceType") || "").trim();
    const customServiceType = String(formData.get("customServiceType") || "").trim();

    if (!name) {
      if (errorEl) errorEl.textContent = "Client name is required.";
      return;
    }

    let finalService = serviceType;
    if (serviceType === "custom") {
      if (!customServiceType) {
        if (errorEl) errorEl.textContent = "Please enter a custom service type.";
        return;
      }
      finalService = customServiceType;
    }

    try {
      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = "Saving...";
      }

      const { error } = await supabase
        .from("clients")
        .insert({
          user_id: user.id,
          name,
          email,
          phone,
          notes,
          service_type: finalService || null,
          status: "Active"
        });

      if (error) {
        console.error("Error saving client", error);
        if (errorEl) {
          errorEl.textContent = error.message || "Error saving client.";
        } else {
          alert(error.message || "Error saving client.");
        }
        return;
      }

      // Go back to client list
      window.location.href = "/app/clients.html";
    } catch (err) {
      console.error("Unexpected error saving client", err);
      if (errorEl) {
        errorEl.textContent = err.message || "Unexpected error — please try again.";
      } else {
        alert("Unexpected error — please try again.");
      }
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = "Save client";
      }
    }
  });
}

setup();
