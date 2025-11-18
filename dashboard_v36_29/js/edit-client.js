import { supabase } from "./supabase.js";

function getClientIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

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

async function loadClient(user, clientId) {
  try {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("id", clientId)
      .eq("user_id", user.id)
      .single();

    if (error) {
      console.error("Error loading client", error);
      const errorEl = document.getElementById("clientError");
      if (errorEl) {
        errorEl.textContent = error.message || "Unable to load client details.";
      }
      return null;
    }

    return data;
  } catch (err) {
    console.error("Unexpected error loading client", err);
    const errorEl = document.getElementById("clientError");
    if (errorEl) {
      errorEl.textContent = err.message || "Unexpected error loading client.";
    }
    return null;
  }
}

async function setup() {
  const clientId = getClientIdFromUrl();
  if (!clientId) {
    window.location.href = "/app/clients.html";
    return;
  }

  const user = await fetchSessionUser();
  if (!user) return;

  const form = document.getElementById("clientForm");
  const errorEl = document.getElementById("clientError");
  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("email");
  const phoneInput = document.getElementById("phone");
  const serviceSelect = document.getElementById("serviceType");
  const customWrapper = document.getElementById("customServiceTypeWrapper");
  const customInput = document.getElementById("customServiceType");
  const notesInput = document.getElementById("notes");
  const statusSelect = document.getElementById("status");
  const saveBtn = document.getElementById("saveChangesBtn");

  if (!form || !nameInput) return;

  // Show/hide custom service input based on selection
  if (serviceSelect && customWrapper && customInput) {
    serviceSelect.addEventListener("change", () => {
      if (serviceSelect.value === "Custom") {
        customWrapper.style.display = "block";
        customInput.focus();
      } else {
        customWrapper.style.display = "none";
        customInput.value = "";
      }
    });
  }

  // Load client data into form
  const client = await loadClient(user, clientId);
  if (!client) return;

  nameInput.value = client.name || "";
  if (emailInput) emailInput.value = client.email || "";
  if (phoneInput) phoneInput.value = client.phone || "";
  if (notesInput) notesInput.value = client.notes || "";

  if (serviceSelect) {
    if (
      client.service_type === "Cleaning" ||
      client.service_type === "Aircon maintenance" ||
      client.service_type === "Electrical" ||
      client.service_type === "Plumbing"
    ) {
      serviceSelect.value = client.service_type;
    } else if (client.service_type) {
      serviceSelect.value = "Custom";
      if (customWrapper && customInput) {
        customWrapper.style.display = "block";
        customInput.value = client.service_type;
      }
    } else {
      serviceSelect.value = "";
    }
  }

  if (statusSelect && client.status) {
    statusSelect.value = client.status;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (errorEl) errorEl.textContent = "";

    const name = nameInput.value.trim();
    const email = emailInput ? emailInput.value.trim() : "";
    const phone = phoneInput ? phoneInput.value.trim() : "";
    const notes = notesInput ? notesInput.value.trim() : "";
    const status = statusSelect ? statusSelect.value || "Active" : "Active";

    let serviceType = serviceSelect ? serviceSelect.value : "";
    let customServiceType = customInput ? customInput.value.trim() : "";
    let finalService = serviceType;

    if (!name) {
      if (errorEl) errorEl.textContent = "Client name is required.";
      return;
    }

    if (serviceType === "Custom") {
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
        .update({
          name,
          email,
          phone,
          notes,
          service_type: finalService || null,
          status
        })
        .eq("id", clientId)
        .eq("user_id", user.id);

      if (error) {
        console.error("Error updating client", error);
        if (errorEl) {
          errorEl.textContent = error.message || "Error updating client.";
        } else {
          alert(error.message || "Error updating client.");
        }
        return;
      }

      window.location.href = "/app/clients.html";
    } catch (err) {
      console.error("Unexpected error updating client", err);
      if (errorEl) {
        errorEl.textContent = err.message || "Unexpected error — please try again.";
      } else {
        alert("Unexpected error — please try again.");
      }
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = "Save changes";
      }
    }
  });
}

setup();
