import { supabase } from "./supabase.js";

let currentUserId = null;
let clients = [];

const form = document.getElementById("addBookingForm");
const clientSelect = document.getElementById("clientSelect");
const serviceInput = document.getElementById("serviceInput");
const dateInput = document.getElementById("dateInput");
const timeHourInput = document.getElementById("timeHour");
const timeMinuteInput = document.getElementById("timeMinute");
const timeAmPmSelect = document.getElementById("timeAmPm");
const notesInput = document.getElementById("notesInput");
const statusSelect = document.getElementById("statusSelect");
const errorEl = document.getElementById("addBookingError");
const saveBtn = document.getElementById("saveBookingBtn");

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

function to24HourString(hourInput, minuteInput, ampmSelect) {
  if (!hourInput || !minuteInput || !ampmSelect) return "";
  let h = parseInt(hourInput.value, 10);
  let m = parseInt(minuteInput.value, 10);
  const ampm = ampmSelect.value === "PM" ? "PM" : "AM";
  if (Number.isNaN(h) || Number.isNaN(m)) return "";
  if (h < 1 || h > 12) return "";
  if (m < 0 || m > 59) return "";
  if (ampm === "PM" && h !== 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  const hh = String(h).padStart(2, "0");
  const mm = String(m).padStart(2, "0");
  return `${hh}:${mm}`;
}
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

    clientSelect.innerHTML = '<option value="">Select client…</option>';
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

function prefillServiceFromClient() {
  if (!clientSelect || !serviceInput) return;
  const id = clientSelect.value;
  if (!id) return;
  const client = clients.find((c) => c.id === id);
  if (!client) return;
  if (client.service_type && !serviceInput.value) {
    serviceInput.value = client.service_type;
  }
}

async function handleSubmit(event) {
  event.preventDefault();
  if (!form || !clientSelect || !serviceInput || !dateInput || !timeHourInput || !timeMinuteInput || !timeAmPmSelect) return;
  if (!errorEl || !saveBtn) return;

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

  saveBtn.disabled = true;
  saveBtn.textContent = "Saving…";

  try {
    const { error } = await supabase.from("bookings").insert({
      user_id: currentUserId,
      client_id,
      service_type,
      booking_date,
      booking_time,
      notes,
      status,
    });

    if (error) {
      console.error("Error creating booking", error);
      errorEl.textContent = error.message || "Error creating booking.";
      saveBtn.disabled = false;
      saveBtn.textContent = "Save booking";
      return;
    }

    window.location.href = "/app/bookings.html";
  } catch (err) {
    console.error("Unexpected error creating booking", err);
    errorEl.textContent = err.message || "Error creating booking.";
    saveBtn.disabled = false;
    saveBtn.textContent = "Save booking";
  }
}

async function setup() {
  const user = await fetchSessionUser();
  if (!user) return;
  currentUserId = user.id;

  await loadClients();

  // Prefill date from URL ?date=YYYY-MM-DD if present
  const params = new URLSearchParams(window.location.search);
  const urlDate = params.get("date");
  if (urlDate && !dateInput.value) {
    dateInput.value = urlDate;
  }

  clientSelect?.addEventListener("change", prefillServiceFromClient);
  form?.addEventListener("submit", handleSubmit);
}

setup();
