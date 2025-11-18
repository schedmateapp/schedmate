import { supabase } from "./supabase.js";
import { showConfirmDialog } from "./app.js";

let currentUserId = null;
let clients = [];
let bookingId = null;

const form = document.getElementById("editBookingForm");
const clientSelect = document.getElementById("clientSelect");
const serviceInput = document.getElementById("serviceInput");
const dateInput = document.getElementById("dateInput");
const timeInput = document.getElementById("timeInput");
const notesInput = document.getElementById("notesInput");
const statusSelect = document.getElementById("statusSelect");
const errorEl = document.getElementById("editBookingError");
const deleteBtn = document.getElementById("deleteBookingBtn");
const updateBtn = document.getElementById("updateBookingBtn");

function getBookingIdFromUrl() {
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

async function loadClients() {
  if (!clientSelect) return;
  clientSelect.innerHTML = `<option value="">Loading clients…</option>`;
  try {
    const { data, error } = await supabase
      .from("clients")
      .select("id, name, service_type")
      .eq("user_id", currentUserId)
      .order("name", { ascending: true });

    if (error) {
      console.error("Error loading clients", error);
      clientSelect.innerHTML =
        '<option value="">Unable to load clients</option>';
      return;
    }

    clients = data || [];
    if (!clients.length) {
      clientSelect.innerHTML =
        '<option value="">No clients yet — add a client first</option>';
      return;
    }

    clientSelect.innerHTML = "";
    for (const c of clients) {
      const opt = document.createElement("option");
      opt.value = c.id;
      opt.textContent = c.name || "Unnamed client";
      clientSelect.appendChild(opt);
    }
  } catch (err) {
    console.error("Unexpected error loading clients", err);
    clientSelect.innerHTML =
      '<option value="">Unable to load clients</option>';
  }
}

async function loadBooking() {
  if (!bookingId) return;
  try {
    const { data, error } = await supabase
      .from("bookings")
      .select("id, client_id, service_type, booking_date, booking_time, notes, status, user_id")
      .eq("id", bookingId)
      .single();

    if (error) {
      console.error("Error loading booking", error);
      if (errorEl) {
        errorEl.textContent = error.message || "Unable to load booking.";
      }
      return;
    }

    if (data.user_id && data.user_id !== currentUserId) {
      console.warn("Booking does not belong to the current user.");
      window.location.href = "/app/bookings.html";
      return;
    }

    if (clientSelect) {
      clientSelect.value = data.client_id || "";
    }
    if (serviceInput) serviceInput.value = data.service_type || "";
    if (dateInput) dateInput.value = data.booking_date || "";
    if (timeHourInput && timeMinuteInput && timeAmPmSelect && data.booking_time) {
      const parts = from24HourToParts(data.booking_time);
      if (parts) {
        timeHourInput.value = String(parts.hour);
        timeMinuteInput.value = String(parts.minute).padStart(2, "0");
        timeAmPmSelect.value = parts.ampm;
      }
    }
    if (notesInput) notesInput.value = data.notes || "";
    if (statusSelect) statusSelect.value = data.status || "Scheduled";
  } catch (err) {
    console.error("Unexpected error loading booking", err);
    if (errorEl) {
      errorEl.textContent = err.message || "Unable to load booking.";
    }
  }
}

async function handleSubmit(event) {
  event.preventDefault();
  if (!bookingId) return;
  if (!form || !clientSelect || !serviceInput || !dateInput || !timeHourInput || !timeMinuteInput || !timeAmPmSelect) return;
  if (!errorEl || !updateBtn) return;

  errorEl.textContent = "";

  const client_id = clientSelect.value;
  const service_type = serviceInput.value.trim();
  const booking_date = dateInput.value;
  const booking_time = to24HourString(timeHourInput, timeMinuteInput, timeAmPmSelect);
  const notes = (notesInput?.value || "").trim();
  const status = statusSelect?.value || "Scheduled";

  if (!client_id) {
    errorEl.textContent = "Please select a client.";
    return;
  }
  if (!service_type) {
    errorEl.textContent = "Please enter a service.";
    return;
  }
  if (!booking_date) {
    errorEl.textContent = "Please select a date.";
    return;
  }
  if (!booking_time) {
    errorEl.textContent = "Please enter a valid time (e.g. 2:30 PM).";
    return;
  }

  updateBtn.disabled = true;
  updateBtn.textContent = "Saving…";

  try {
    const { error } = await supabase
      .from("bookings")
      .update({
        client_id,
        service_type,
        booking_date,
        booking_time,
        notes,
        status,
      })
      .eq("id", bookingId)
      .eq("user_id", currentUserId);

    if (error) {
      console.error("Error updating booking", error);
      errorEl.textContent = error.message || "Error updating booking.";
      updateBtn.disabled = false;
      updateBtn.textContent = "Save changes";
      return;
    }

    window.location.href = "/app/bookings.html";
  } catch (err) {
    console.error("Unexpected error updating booking", err);
    errorEl.textContent = err.message || "Error updating booking.";
    updateBtn.disabled = false;
    updateBtn.textContent = "Save changes";
  }
}

async function handleDelete() {
  if (!bookingId) return;
  const confirmed = await showConfirmDialog({
    title: "Delete booking",
    subtitle: "This action cannot be undone.",
    message: "This booking will be permanently removed from your calendar.",
    confirmLabel: "Delete booking"
  });
  if (!confirmed) return;

  try {
    const { error } = await supabase
      .from("bookings")
      .delete()
      .eq("id", bookingId)
      .eq("user_id", currentUserId);

    if (error) {
      console.error("Error deleting booking", error);
      if (errorEl) {
        errorEl.textContent = error.message || "Error deleting booking.";
      }
      return;
    }

    window.location.href = "/app/bookings.html";
  } catch (err) {
    console.error("Unexpected error deleting booking", err);
    if (errorEl) {
      errorEl.textContent = err.message || "Error deleting booking.";
    }
  }
}

async function setup() {
  bookingId = getBookingIdFromUrl();
  if (!bookingId) {
    window.location.href = "/app/bookings.html";
    return;
  }

  const user = await fetchSessionUser();
  if (!user) return;
  currentUserId = user.id;

  await loadClients();
  await loadBooking();

  form?.addEventListener("submit", handleSubmit);
  deleteBtn?.addEventListener("click", handleDelete);
}

setup();
