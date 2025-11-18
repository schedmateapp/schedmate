// ====================
// SCHEDMATE DASHBOARD JS v36.31 (FULL FIX)
// ====================

const supa = window.supabaseClient;

// --------------------
// GLOBAL STATE
// --------------------
let clients = [];
let bookings = [];

// --------------------
// VIEW HANDLING
// --------------------
function setView(view) {
  document.querySelectorAll(".sidebar-link").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.view === view);
  });

  document.querySelectorAll(".view").forEach((v) => {
    v.classList.toggle("active", v.id === view + "View");
  });

  const title = document.getElementById("viewTitle");
  const subtitle = document.getElementById("viewSubtitle");

  if (view === "overview") {
    title.textContent = "Today's overview";
    subtitle.textContent = "See your bookings for today.";
  } else if (view === "clients") {
    title.textContent = "Clients";
    subtitle.textContent = "Manage your client list.";
  } else if (view === "bookings") {
    title.textContent = "Bookings";
    subtitle.textContent = "All upcoming and past bookings.";
  }
}

// --------------------
// MODALS
// --------------------
function openModal(id) {
  document.getElementById(id).hidden = false;
}

function closeModal(id) {
  document.getElementById(id).hidden = true;
}

// --------------------
// RENDERING
// --------------------
function renderClients() {
  const tbody = document.getElementById("clientsTableBody");
  if (!clients.length) {
    tbody.innerHTML = `<tr><td colspan="4">No clients yet. Click "New client" to add one.</td></tr>`;
    return;
  }

  tbody.innerHTML = clients
    .map(
      (c) => `
      <tr data-id="${c.id}">
        <td>${c.name ?? ""}</td>
        <td>${c.phone ?? ""}</td>
        <td>${c.notes ?? ""}</td>
        <td>
          <button class="ghost-btn btn-xs" data-action="editClient">Edit</button>
          <button class="ghost-btn btn-xs" data-action="deleteClient">Delete</button>
        </td>
      </tr>`
    )
    .join("");
}

function renderBookings() {
  const tbody = document.getElementById("bookingsTableBody");

  if (!bookings.length) {
    tbody.innerHTML = `<tr><td colspan="5">No bookings yet. Click "New booking" to add one.</td></tr>`;
    return;
  }

  tbody.innerHTML = bookings
    .map(
      (b) => `
      <tr data-id="${b.id}">
        <td>${b.date}</td>
        <td>${b.time}</td>
        <td>${b.client_name}</td>
        <td>${b.service}</td>
        <td>
          <button class="ghost-btn btn-xs" data-action="editBooking">Edit</button>
          <button class="ghost-btn btn-xs" data-action="deleteBooking">Delete</button>
        </td>
      </tr>`
    )
    .join("");
}

// --------------------
// STATS
// --------------------
function updateStats() {
  const today = new Date().toISOString().split("T")[0];

  document.getElementById("statTodayBookings").textContent =
    bookings.filter((b) => b.date === today).length;

  document.getElementById("statClients").textContent = clients.length;

  document.getElementById("statWeekBookings").textContent = bookings.length;
}

// --------------------
// LOAD DATA
// --------------------
async function loadClients() {
  const { data, error } = await supa
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return console.error(error);

  clients = data;
  renderClients();
  updateStats();
}

async function loadBookings() {
  const { data, error } = await supa
    .from("client_bookings")
    .select("*")
    .order("date", { ascending
