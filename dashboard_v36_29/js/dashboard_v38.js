// =============================
// SchedMate Dashboard v38
// =============================

const supa = window.supabaseClient;

// ------- GLOBAL STATE -------
let clients = [];
let bookings = [];

// ------- VIEW HANDLING -------
function setView(view) {
  // Sidebar active state
  document.querySelectorAll(".sidebar-link").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.view === view);
  });

  // Show the correct section
  document.querySelectorAll(".view").forEach((v) => {
    v.classList.toggle("active", v.id === view + "View");
  });

  const title = document.getElementById("viewTitle");
  const subtitle = document.getElementById("viewSubtitle");
  if (!title || !subtitle) return;

  if (view === "overview") {
    title.textContent = "Overview";
    subtitle.textContent = "See your bookings for today.";
  } else if (view === "clients") {
    title.textContent = "Clients";
    subtitle.textContent = "Manage your client list.";
  } else if (view === "bookings") {
    title.textContent = "Bookings";
    subtitle.textContent = "All upcoming and past bookings.";
  }
}

// ------- MODAL HELPERS -------
function openModal(id) {
  document.querySelectorAll(".modal-backdrop").forEach((el) => {
    el.hidden = true;
  });
  const el = document.getElementById(id);
  if (el) el.hidden = false;
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.hidden = true;
}

function getHiddenId(form) {
  const input = form.querySelector('input[name="id"]');
  return input && input.value ? input.value : null;
}

function setHiddenId(form, value) {
  const input = form.querySelector('input[name="id"]');
  if (input) input.value = value || "";
}

// ------- RENDERING -------
function renderClients() {
  const tbody = document.getElementById("clientsTableBody");
  if (!tbody) return;

  if (!clients.length) {
    tbody.innerHTML =
      '<tr><td colspan="4">No clients yet. Click "New client" to add one.</td></tr>';
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
          <button type="button" class="ghost-btn btn-xs" data-action="editClient">Edit</button>
          <button type="button" class="ghost-btn btn-xs" data-action="deleteClient">Delete</button>
        </td>
      </tr>`
    )
    .join("");
}

function renderBookings() {
  const tbody = document.getElementById("bookingsTableBody");
  if (!tbody) return;

  if (!bookings.length) {
    tbody.innerHTML =
      '<tr><td colspan="5">No bookings yet. Click "New booking" to add one.</td></tr>';
    return;
  }

  tbody.innerHTML = bookings
    .map(
      (b) => `
      <tr data-id="${b.id}">
        <td>${b.date ?? ""}</td>
        <td>${b.time ?? ""}</td>
        <td>${b.client_name ?? ""}</td>
        <td>${b.service ?? ""}</td>
        <td>
          <button type="button" class="ghost-btn btn-xs" data-action="editBooking">Edit</button>
          <button type="button" class="ghost-btn btn-xs" data-action="deleteBooking">Delete</button>
        </td>
      </tr>`
    )
    .join("");
}

// ------- STATS -------
function updateStats() {
  const statTodayEl = document.getElementById("statTodayBookings");
  const statClientsEl = document.getElementById("statClients");
  const statWeekEl = document.getElementById("statWeekBookings");

  const today = new Date().toISOString().split("T")[0];
  const todayCount = bookings.filter((b) => b.date === today).length;

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay()); // Sunday
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  const weekCount = bookings.filter((b) => {
    if (!b.date) return false;
    const d = new Date(b.date);
    return d >= weekStart && d < weekEnd;
  }).length;

  if (statTodayEl) statTodayEl.textContent = String(todayCount);
  if (statClientsEl) statClientsEl.textContent = String(clients.length);
  if (statWeekEl) statWeekEl.textContent = String(weekCount);
}

// ------- CLIENT AUTOCOMPLETE FOR BOOKINGS -------
function refreshClientNameDatalist() {
  const datalist = document.getElementById("bookingClientList");
  if (!datalist) return;

  datalist.innerHTML = clients
    .map((c) => {
      const safeName = (c.name || "").replace(/"/g, "&quot;");
      return `<option value="${safeName}"></option>`;
    })
    .join("");
}

// ------- LOAD DATA -------
async function loadClients() {
  const { data, error } = await supa
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error loading clients", error);
    return;
  }

  clients = data || [];
  renderClients();
  refreshClientNameDatalist();
  updateStats();
}

async function loadBookings() {
  const { data, error } = await supa
    .from("client_bookings")
    .select("*")
    .order("date", { ascending: true });

  if (error) {
    console.error("Error loading bookings", error);
    return;
  }

  bookings = data || [];
  renderBookings();
  updateStats();
}

// ------- CLIENT CRUD -------
async function saveClientFromForm(e) {
  e.preventDefault();
  const form = e.currentTarget;
  const errorEl = document.getElementById("clientFormError");
  if (errorEl) errorEl.textContent = "";

  const id = getHiddenId(form);
  const payload = {
    name: form.name.value.trim(),
    phone: form.phone.value.trim(),
    notes: form.notes.value.trim(),
  };

  if (!payload.name) {
    if (errorEl) errorEl.textContent = "Name is required.";
    return;
  }

  let error = null;
  if (id) {
    const { error: updError } = await supa
      .from("clients")
      .update(payload)
      .eq("id", id);
    error = updError;
  } else {
    const { error: insError } = await supa.from("clients").insert(payload);
    error = insError;
  }

  if (error) {
    console.error("Error saving client", error);
    if (errorEl) errorEl.textContent = error.message || "Unable to save client.";
    return;
  }

  await loadClients();

  closeModal("clientModalBackdrop");
  form.reset();
  setHiddenId(form, "");
}

async function deleteClientById(id) {
  const { error } = await supa.from("clients").delete().eq("id", id);
  if (error) {
    console.error("Error deleting client", error);
    alert("Could not delete client. Please check console.");
    return;
  }

  await loadClients();
  await loadBookings();
}

// ------- BOOKING CRUD -------
async function saveBookingFromForm(e) {
  e.preventDefault();
  const form = e.currentTarget;
  const errorEl = document.getElementById("bookingFormError");
  if (errorEl) errorEl.textContent = "";

  const id = getHiddenId(form);

  const payload = {
    date: form.date.value,
    time: form.time.value,
    client_name: form.client_name.value.trim(),
    service: form.service.value.trim(),
  };

  // Try to attach client_id if name matches
  const matchedClient = clients.find(
    (c) => (c.name || "").toLowerCase() === payload.client_name.toLowerCase()
  );
  if (matchedClient) {
    payload.client_id = matchedClient.id;
  }

  if (!payload.date || !payload.time || !payload.client_name || !payload.service) {
    if (errorEl) errorEl.textContent = "All fields are required.";
    return;
  }

  let error = null;
  if (id) {
    const { error: updError } = await supa
      .from("client_bookings")
      .update(payload)
      .eq("id", id);
    error = updError;
  } else {
    const { error: insError } = await supa
      .from("client_bookings")
      .insert(payload);
    error = insError;
  }

  if (error) {
    console.error("Error saving booking", error);
    if (errorEl) errorEl.textContent = error.message || "Unable to save booking.";
    return;
  }

  await loadBookings();

  closeModal("bookingModalBackdrop");
  form.reset();
  setHiddenId(form, "");
}

async function deleteBookingById(id) {
  const { error } = await supa.from("client_bookings").delete().eq("id", id);
  if (error) {
    console.error("Error deleting booking", error);
    alert("Could not delete booking. Please check console.");
    return;
  }
  await loadBookings();
}

// ------- INIT -------
document.addEventListener("DOMContentLoaded", async () => {
  // 1) Ensure logged in
  const { data, error } = await supa.auth.getSession();
  if (error || !data.session) {
    window.location.href = "./login.html";
    return;
  }

  // ELEMENTS
  const logoutBtn = document.getElementById("logoutBtn");
  const addClientBtn = document.getElementById("addClientBtn");
  const addBookingBtn = document.getElementById("addBookingBtn");
  const cancelClientModalBtn = document.getElementById("cancelClientModal");
  const cancelBookingModalBtn = document.getElementById("cancelBookingModal");
  const clientForm = document.getElementById("clientForm");
  const bookingForm = document.getElementById("bookingForm");
  const clientsTableBody = document.getElementById("clientsTableBody");
  const bookingsTableBody = document.getElementById("bookingsTableBody");

  // Sidebar navigation
  document.querySelectorAll(".sidebar-link").forEach((btn) => {
    btn.addEventListener("click", () => setView(btn.dataset.view));
  });

  // Logout
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await supa.auth.signOut();
      window.location.href = "./login.html";
    });
  }

  // Global buttons: New client / New booking
  if (addClientBtn && clientForm) {
    addClientBtn.addEventListener("click", () => {
      clientForm.reset();
      setHiddenId(clientForm, "");
      document.getElementById("clientModalTitle").textContent = "Add client";
      openModal("clientModalBackdrop");
    });
  }

  if (addBookingBtn && bookingForm) {
    addBookingBtn.addEventListener("click", () => {
      bookingForm.reset();
      setHiddenId(bookingForm, "");
      document.getElementById("bookingModalTitle").textContent = "Add booking";
      openModal("bookingModalBackdrop");
    });
  }

  // Cancel buttons
  if (cancelClientModalBtn && clientForm) {
    cancelClientModalBtn.addEventListener("click", () => {
      clientForm.reset();
      setHiddenId(clientForm, "");
      closeModal("clientModalBackdrop");
    });
  }

  if (cancelBookingModalBtn && bookingForm) {
    cancelBookingModalBtn.addEventListener("click", () => {
      bookingForm.reset();
      setHiddenId(bookingForm, "");
      closeModal("bookingModalBackdrop");
    });
  }

  // Form submits
  if (clientForm) clientForm.addEventListener("submit", saveClientFromForm);
  if (bookingForm) bookingForm.addEventListener("submit", saveBookingFromForm);

  // Row actions: Clients table
  if (clientsTableBody && clientForm) {
    clientsTableBody.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-action]");
      if (!btn) return;

      const tr = btn.closest("tr");
      if (!tr) return;

      const id = tr.dataset.id;
      const client = clients.find((c) => c.id === id);
      if (!client) return;

      if (btn.dataset.action === "editClient") {
        clientForm.reset();
        setHiddenId(clientForm, client.id);
        clientForm.name.value = client.name || "";
        clientForm.phone.value = client.phone || "";
        clientForm.notes.value = client.notes || "";
        document.getElementById("clientModalTitle").textContent = "Edit client";
        openModal("clientModalBackdrop");
      } else if (btn.dataset.action === "deleteClient") {
        if (confirm("Delete this client? Bookings linked to this client will remain.")) {
          deleteClientById(client.id);
        }
      }
    });
  }

  // Row actions: Bookings table
  if (bookingsTableBody && bookingForm) {
    bookingsTableBody.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-action]");
      if (!btn) return;

      const tr = btn.closest("tr");
      if (!tr) return;

      const id = tr.dataset.id;
      const booking = bookings.find((b) => b.id === id);
      if (!booking) return;

      if (btn.dataset.action === "editBooking") {
        bookingForm.reset();
        setHiddenId(bookingForm, booking.id);
        bookingForm.date.value = booking.date || "";
        bookingForm.time.value = booking.time || "";
        bookingForm.client_name.value = booking.client_name || "";
        bookingForm.service.value = booking.service || "";
        document.getElementById("bookingModalTitle").textContent = "Edit booking";
        openModal("bookingModalBackdrop");
      } else if (btn.dataset.action === "deleteBooking") {
        if (confirm("Delete this booking?")) {
          deleteBookingById(booking.id);
        }
      }
    });
  }

  // Initial data load
  await Promise.all([loadClients(), loadBookings()]);
  setView("overview");
});
