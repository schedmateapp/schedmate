import { supabase } from "./supabase.js";

let currentUserId = null;
let allBookings = [];
let clientsById = new Map();
let currentView = "list";
let currentMonth = new Date();

const listEl = document.getElementById("bookingsList");
const emptyStateEl = document.getElementById("bookingsEmptyState");
const searchInput = document.getElementById("bookingsSearch");
const dateFilterInput = document.getElementById("bookingsDateFilter");
const metaEl = document.getElementById("bookingsMeta");
const viewToggleButtons = document.querySelectorAll(".bookings-view-toggle .view-toggle-btn");

const listViewEl = document.getElementById("bookingsListView");
const calendarViewEl = document.getElementById("bookingsCalendarView");
const calendarDaysContainer = document.getElementById("calendarDays");
const calendarMonthLabel = document.getElementById("calendarMonthLabel");
const prevMonthBtn = document.getElementById("prevMonthBtn");
const nextMonthBtn = document.getElementById("nextMonthBtn");

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatTime12(timeStr) {
  if (!timeStr) return "";
  const parts = timeStr.split(":");
  if (parts.length < 2) return timeStr;
  let h = parseInt(parts[0], 10);
  const m = String(parts[1]).padStart(2, "0");
  if (Number.isNaN(h)) return timeStr;
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m} ${ampm}`;
}

function getClientName(clientId) {
  if (!clientId) return "";
  const c = clientsById.get(clientId);
  return c ? c.name || "" : "";
}

function renderMeta() {
  if (!metaEl) return;
  const total = allBookings.length;
  if (!total) {
    metaEl.textContent = "";
    return;
  }
  metaEl.textContent = `${total} booking${total === 1 ? "" : "s"} total`;
}

function renderList(filtered) {
  if (!listEl || !emptyStateEl) return;
  listEl.innerHTML = "";

  const items = filtered ?? allBookings.slice().sort((a, b) => {
    const aKey = (a.booking_date || "") + " " + (a.booking_time || "");
    const bKey = (b.booking_date || "") + " " + (b.booking_time || "");
    return aKey.localeCompare(bKey);
  });

  if (!items.length) {
    emptyStateEl.style.display = "block";
    return;
  }
  emptyStateEl.style.display = "none";

  for (const booking of items) {
    const clientName = getClientName(booking.client_id) || "No client";
    const dateLabel = formatDate(booking.booking_date);
    const timeLabel = formatTime12(booking.booking_time);
    const status = booking.status || "Scheduled";

    const card = document.createElement("article");
    card.className = "booking-card";
    card.innerHTML = `
      <div class="booking-main">
        <div class="booking-client">${clientName}</div>
        <div class="booking-meta-row">
          <span class="booking-date">${dateLabel}</span>
          <span class="booking-time">${timeLabel}</span>
          <span class="booking-service">${booking.service_type || ""}</span>
        </div>
        ${booking.notes ? `<p class="booking-notes">${booking.notes}</p>` : ""}
      </div>
      <div class="booking-side">
        <span class="status-pill status-${status.toLowerCase()}">${status}</span>
        <button class="link-btn" data-edit-booking="\${booking.id}">Edit</button>
      </div>
    `;
    listEl.appendChild(card);
  }
}

function applyFilterAndRender() {
  const term = (searchInput?.value || "").toLowerCase().trim();
  const dateFilter = dateFilterInput?.value || "";

  let filtered = allBookings;

  if (term) {
    filtered = filtered.filter((b) => {
      const clientName = getClientName(b.client_id);
      const hay = [
        clientName || "",
        b.service_type || "",
        b.notes || "",
        b.status || "",
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(term);
    });
  }

  if (dateFilter) {
    filtered = filtered.filter((b) => b.booking_date === dateFilter);
  }

  if (currentView === "list") {
    renderList(filtered);
  } else {
    renderCalendar(filtered);
  }
}

function setView(view) {
  currentView = view;
  if (viewToggleButtons && viewToggleButtons.length) {
    viewToggleButtons.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.view === view);
    });
  }
  if (listViewEl && calendarViewEl) {
    if (view === "list") {
      listViewEl.style.display = "";
      calendarViewEl.style.display = "none";
    } else {
      listViewEl.style.display = "none";
      calendarViewEl.style.display = "";
    }
  }
  applyFilterAndRender();
}


function buildMonthGrid(bookings) {
  const daysContainer = calendarDaysContainer;
  if (!daysContainer) return;
  daysContainer.innerHTML = "";

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth(); // 0-based

  const firstDay = new Date(year, month, 1);
  const firstWeekday = (firstDay.getDay() + 6) % 7; // 0=Mon, 6=Sun
  const numDays = new Date(year, month + 1, 0).getDate();

  if (calendarMonthLabel) {
    const labelDate = new Date(year, month, 1);
    calendarMonthLabel.textContent = labelDate.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
    });
  }

  const countsByDay = new Map();
  for (const b of bookings) {
    if (!b.booking_date) continue;
    const d = new Date(b.booking_date + "T00:00:00");
    if (Number.isNaN(d.getTime())) continue;
    if (d.getMonth() !== month || d.getFullYear() !== year) continue;
    const dayNum = d.getDate();
    countsByDay.set(dayNum, (countsByDay.get(dayNum) || 0) + 1);
  }

  const today = new Date();
  const todayY = today.getFullYear();
  const todayM = today.getMonth();
  const todayD = today.getDate();

  for (let i = 0; i < firstWeekday; i++) {
    const filler = document.createElement("div");
    filler.className = "day-cell day-cell-empty";
    daysContainer.appendChild(filler);
  }

  for (let day = 1; day <= numDays; day++) {
    const cell = document.createElement("div");
    cell.className = "day-cell";
    if (year === todayY && month === todayM && day === todayD) {
      cell.classList.add("day-today");
    }

    const displayDate = new Date(year, month, day);
    const isoDate = displayDate.toISOString().slice(0, 10);

    const count = countsByDay.get(day) || 0;
    cell.innerHTML = `
      <div class="day-number">${day}</div>
      ${
        count
          ? `<div class="day-bookings">
              <span class="dot"></span>
              <span class="count">${count}</span>
            </div>`
          : ""
      }
    `;

    cell.dataset.date = isoDate;
    cell.addEventListener("click", () => {
      window.location.href = `/app/add-booking.html?date=${encodeURIComponent(isoDate)}`;
    });

    daysContainer.appendChild(cell);
  }
}

function renderCalendarfunction renderCalendar(filtered) {
  const bookingsForMonth = filtered ?? allBookings;
  buildMonthGrid(bookingsForMonth);
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
  try {
    const { data, error } = await supabase
      .from("clients")
      .select("id, name")
      .eq("user_id", currentUserId)
      .order("name", { ascending: true });

    if (error) {
      console.error("Error loading clients for bookings", error);
      return;
    }

    clientsById.clear();
    for (const c of data || []) {
      if (c.id) clientsById.set(c.id, c);
    }
  } catch (err) {
    console.error("Unexpected error loading clients", err);
  }
}

async function loadBookings() {
  if (!currentUserId) return;
  try {
    const { data, error } = await supabase
      .from("bookings")
      .select("id, client_id, service_type, booking_date, booking_time, notes, status")
      .eq("user_id", currentUserId)
      .order("booking_date", { ascending: true })
      .order("booking_time", { ascending: true });

    if (error) {
      console.error("Error loading bookings", error);
      return;
    }

    allBookings = data || [];
    renderMeta();
    applyFilterAndRender();
  } catch (err) {
    console.error("Unexpected error loading bookings", err);
  }
}

async function setup() {
  const user = await fetchSessionUser();
  if (!user) return;
  currentUserId = user.id;

  await loadClients();
  await loadBookings();

  searchInput?.addEventListener("input", () => applyFilterAndRender());
  dateFilterInput?.addEventListener("change", () => applyFilterAndRender());

  if (viewToggleButtons && viewToggleButtons.length) {
    viewToggleButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const view = btn.dataset.view || "list";
        setView(view);
      });
    });
  }

  prevMonthBtn?.addEventListener("click", () => {
    currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    applyFilterAndRender();
  });
  nextMonthBtn?.addEventListener("click", () => {
    currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    applyFilterAndRender();
  });

  if (listEl) {
    listEl.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (target.matches("[data-edit-booking]")) {
        const id = target.getAttribute("data-edit-booking");
        if (!id) return;
        window.location.href = `/app/edit-booking.html?id=${encodeURIComponent(id)}`;
      }
    });
  }

  setView("list");
}

setup();
