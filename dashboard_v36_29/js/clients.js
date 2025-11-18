
import { supabase } from "./supabase.js";
import { showConfirmDialog } from "./app.js";

let currentUserId = null;
let allClients = [];

const tableBody = document.querySelector("#clientsList");
const tableEl = document.querySelector("#clientsTable");
const cardsEl = document.querySelector("#clientsCards");
const emptyState = document.querySelector("#clientsEmptyState");
const countEl = document.querySelector("#clientsCount");
const searchInput = document.querySelector("#clientsSearch");
const addClientBtn = document.querySelector("#addClientBtn");
const addClientEmptyBtn = document.querySelector("#addClientEmptyBtn");
const modal = document.querySelector("#clientModal");
const modalForm = document.querySelector("#clientForm");
const modalCloseBtn = document.querySelector("#clientModalClose");
const modalError = document.querySelector("#clientError");
const viewToggleButtons = document.querySelectorAll(".view-toggle-btn");
const serviceSelect = document.querySelector('select[name="serviceType"]');
const customServiceWrapper = document.getElementById("customServiceTypeWrapper");
const customServiceInput = document.querySelector('input[name="customServiceType"]');

function openModal() {
  if (!modal) return;
  modal.classList.add("open");
}

function closeModal() {
  if (!modal || !modalForm || !modalError) return;
  modal.classList.remove("open");
  modalForm.reset();
  modalError.textContent = "";
  if (customServiceWrapper) customServiceWrapper.style.display = "none";
}

function normalisePhone(phone) {
  return (phone || "").trim();
}

function renderClients(clients) {
  if (!tableBody || !cardsEl) return;

  tableBody.innerHTML = "";
  cardsEl.innerHTML = "";

  if (!clients || clients.length === 0) {
    if (emptyState) {
      emptyState.style.display = "block";
    }
    if (tableEl) tableEl.style.display = "none";
    if (cardsEl) cardsEl.hidden = true;
    if (countEl) countEl.textContent = "";
    return;
  }

  if (emptyState) {
    emptyState.style.display = "none";
  }

  if (countEl) {
    countEl.textContent = clients.length === 1
      ? "1 client"
      : `${clients.length} clients`;
  }

  for (const client of clients) {
    const phone = normalisePhone(client.phone);
    const phoneHtml = phone
      ? `<a href="tel:${phone.replace(/\s+/g,'')}">${phone}</a>`
      : "";

    // Table row
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${client.name || ""}</td>
      <td>${client.service_type || ""}</td>
      <td>${client.email || ""}</td>
      <td>${phoneHtml}</td>
      <td>
        <button class="link-btn" data-edit-client="${client.id}">Edit</button>
        <button class="link-btn danger" data-delete-client="${client.id}">Delete</button>
      </td>
    `;
    tableBody.appendChild(tr);

    // Card view
    const card = document.createElement("article");
    card.className = "client-card";
    card.innerHTML = `
      <div class="client-card-header">
        <h3>${client.name || "Unnamed client"}</h3>
        <div class="client-card-service">${client.service_type || "No service type set"}</div>
      </div>
      <div class="client-card-body">
        ${client.email ? `<div>${client.email}</div>` : ""}
        ${phoneHtml ? `<div>${phoneHtml}</div>` : ""}
        ${client.notes ? `<div>${client.notes}</div>` : ""}
      </div>
      <div class="client-card-footer">
        <button class="link-btn" data-edit-client="${client.id}">Edit</button>
        <button class="link-btn danger" data-delete-client="${client.id}">Delete</button>
      </div>
    `;
    cardsEl.appendChild(card);
  }

  if (tableEl && currentView === "table") {
    tableEl.style.display = "table";
    cardsEl.hidden = true;
  } else if (cardsEl && currentView === "cards") {
    tableEl.style.display = "none";
    cardsEl.hidden = false;
  }
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
  if (!currentUserId) return;
  try {
    const { data, error } = await supabase
      .from("clients")
      .select("id, name, email, phone, notes, service_type, status")
      .eq("user_id", currentUserId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading clients", error);
      if (modalError) {
        modalError.textContent = error.message || "Error loading clients.";
      }
      return;
    }

    allClients = (data || []).filter(c => c.status !== "Inactive");
    applyFilterAndRender();
  } catch (err) {
    console.error(err);
    if (modalError) {
      modalError.textContent = err.message || "Error loading clients.";
    }
  }
}

function applyFilterAndRender() {
  const term = (searchInput && searchInput.value || "").toLowerCase();
  if (!term) {
    renderClients(allClients);
    return;
  }
  const filtered = allClients.filter(c => {
    const hay = [
      c.name || "",
      c.email || "",
      c.phone || "",
      c.service_type || ""
    ].join(" ").toLowerCase();
    return hay.includes(term);
  });
  renderClients(filtered);
}

let currentView = "table";

function setView(view) {
  currentView = view;
  if (viewToggleButtons && viewToggleButtons.length) {
    viewToggleButtons.forEach(btn => {
      btn.classList.toggle("active", btn.dataset.view === view);
    });
  }
  // re-render with current set to ensure visibility toggles
  applyFilterAndRender();
}

async function setup() {
  const user = await fetchSessionUser();
  if (!user) return;
  currentUserId = user.id;

  const emailSlot = document.querySelector("[data-user-email]");
  if (emailSlot && user.email) {
    emailSlot.textContent = user.email;
  }

  if (addClientBtn) {
    addClientBtn.addEventListener("click", () => openModal());
  }
  if (addClientEmptyBtn) {
    addClientEmptyBtn.addEventListener("click", () => openModal());
  }
  if (modalCloseBtn) {
    modalCloseBtn.addEventListener("click", () => closeModal());
  }
  if (modal && modal === document.activeElement) {
    modal.addEventListener("click", (event) => {
      if (event.target === modal) {
        closeModal();
      }
    });
  }
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      applyFilterAndRender();
    });
  }
  if (viewToggleButtons && viewToggleButtons.length) {
    viewToggleButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        const view = btn.dataset.view || "table";
        setView(view);
      });
    });
  }
  if (serviceSelect) {
    serviceSelect.addEventListener("change", () => {
      if (!customServiceWrapper || !customServiceInput) return;
      if (serviceSelect.value === "custom") {
        customServiceWrapper.style.display = "block";
        customServiceInput.focus();
      } else {
        customServiceWrapper.style.display = "none";
        customServiceInput.value = "";
      }
    });
  }

  if (modalForm) {
    modalForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!currentUserId) return;
      if (!modalError) return;
      modalError.textContent = "";

      const formData = new FormData(modalForm);
      const name = String(formData.get("name") || "").trim();
      const email = String(formData.get("email") || "").trim();
      const phone = String(formData.get("phone") || "").trim();
      const notes = String(formData.get("notes") || "").trim();
      const serviceType = String(formData.get("serviceType") || "").trim();
      const customServiceType = String(formData.get("customServiceType") || "").trim();

      if (!name) {
        modalError.textContent = "Client name is required.";
        return;
      }

      let finalService = serviceType;
      if (serviceType === "custom") {
        if (!customServiceType) {
          modalError.textContent = "Please enter a custom service type.";
          return;
        }
        finalService = customServiceType;
      }

      try {
        const { error } = await supabase
          .from("clients")
          .insert({
            user_id: currentUserId,
            name,
            email,
            phone,
            notes,
            service_type: finalService || null,
            status: "Active"
          });

        if (error) {
          console.error("Error saving client", error);
          modalError.textContent = error.message || "Error saving client.";
          return;
        }

        closeModal();
        await loadClients();
      } catch (err) {
        console.error(err);
        modalError.textContent = err.message || "Error saving client.";
      }
    });
  }

  if (tableBody) {
    tableBody.addEventListener("click", async (event) => {
      const target = event.target;

      // Edit client
      if (target && target.matches("[data-edit-client]")) {
        const id = target.getAttribute("data-edit-client");
        if (!id) return;
        window.location.href = `/app/edit-client.html?id=${encodeURIComponent(id)}`;
        return;
      }

      // Delete client (soft delete)
      if (target && target.matches("[data-delete-client]")) {
        const id = target.dataset.deleteClient || target.getAttribute("data-delete-client");
        if (!id) return;
        const client = allClients.find(c => String(c.id) === String(id));
        const name = client?.name || "this client";
        const confirmed = await showConfirmDialog({
          title: `Delete client — ${name}`,
          subtitle: "This action cannot be undone.",
          message: "The client record will be permanently removed from your workspace.",
          confirmLabel: "Delete client"
        });
        if (!confirmed) return;
        try {
          const { error } = await supabase
            .from("clients")
            .update({ status: "Inactive" })
            .eq("id", id)
            .eq("user_id", currentUserId);
          if (error) {
            console.error("Error deleting client", error);
            alert(error.message || "Error deleting client.");
            return;
          }
          await loadClients();
        } catch (err) {
          console.error(err);
          alert(err.message || "Error deleting client.");
        }
      }
    });
  }

  if (cardsEl) {
    cardsEl.addEventListener("click", async (event) => {
      const target = event.target;

      // Edit client from card
      if (target && target.matches("[data-edit-client]")) {
        const id = target.getAttribute("data-edit-client");
        if (!id) return;
        window.location.href = `/app/edit-client.html?id=${encodeURIComponent(id)}`;
        return;
      }

      // Delete client (soft delete) from card
      if (target && target.matches("[data-delete-client]")) {
        const id = target.dataset.deleteClient || target.getAttribute("data-delete-client");
        if (!id) return;
        const client = allClients.find(c => String(c.id) === String(id));
        const name = client?.name || "this client";
        const confirmed = await showConfirmDialog({
          title: `Delete client — ${name}`,
          subtitle: "This action cannot be undone.",
          message: "The client record will be permanently removed from your workspace.",
          confirmLabel: "Delete client"
        });
        if (!confirmed) return;
        try {
          const { error } = await supabase
            .from("clients")
            .update({ status: "Inactive" })
            .eq("id", id)
            .eq("user_id", currentUserId);
          if (error) {
            console.error("Error deleting client", error);
            alert(error.message || "Error deleting client.");
            return;
          }
          await loadClients();
        } catch (err) {
          console.error(err);
          alert(err.message || "Error deleting client.");
        }
      }
    });
  }

  // default view
  setView("table");
  await loadClients();
}

setup();
