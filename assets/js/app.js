const STORE_KEY = "linkme-crm-state";
const stages = ["New Lead", "Contacted", "Interested", "Negotiating", "Won", "Lost"];

const seedState = {
  customers: [
    { id: "c1", name: "Nala Boutique", phone: "+256 701 245 900", whatsapp: "256701245900", email: "hello@nalaboutique.ug", segment: "Retail", address: "Kisementi, Kampala", notes: "Prefers WhatsApp follow-ups in the morning.", lastContact: "Today" },
    { id: "c2", name: "Glow & Go Salon", phone: "+256 772 881 310", whatsapp: "256772881310", email: "bookings@glowgo.ug", segment: "Salon", address: "Ntinda, Kampala", notes: "Interested in monthly stock reminders.", lastContact: "Yesterday" },
    { id: "c3", name: "Kato Advisory", phone: "+256 750 442 188", whatsapp: "256750442188", email: "info@katoadvisory.com", segment: "Consulting", address: "Kololo, Kampala", notes: "Needs a quote before Friday.", lastContact: "2 days ago" },
    { id: "c4", name: "Blue Crane Studio", phone: "+256 705 110 045", whatsapp: "256705110045", email: "studio@bluecrane.africa", segment: "Agency", address: "Bugolobi, Kampala", notes: "High-value client. Keep sales owner updated.", lastContact: "Last week" }
  ],
  leads: [
    { id: "l1", name: "Mirembe Foods", phone: "+256 700 111 900", value: 1800000, stage: "New Lead", notes: "Asked about delivery tracking." },
    { id: "l2", name: "Urban Cuts", phone: "+256 782 445 220", value: 950000, stage: "Contacted", notes: "Call back after weekend." },
    { id: "l3", name: "Prime Events", phone: "+256 759 001 412", value: 4200000, stage: "Interested", notes: "Wants team access." },
    { id: "l4", name: "Amani Traders", phone: "+256 701 778 661", value: 2600000, stage: "Negotiating", notes: "Discount requested for annual plan." },
    { id: "l5", name: "Safi Organics", phone: "+256 775 809 777", value: 3200000, stage: "Won", notes: "Ready for onboarding." }
  ],
  tasks: [
    { id: "t1", title: "Send quote to Kato Advisory", customerId: "c3", due: today(0), notes: "Include setup and training line items.", done: false },
    { id: "t2", title: "WhatsApp Glow & Go Salon", customerId: "c2", due: today(1), notes: "Share retail stock reminder sample.", done: false },
    { id: "t3", title: "Confirm Nala Boutique order", customerId: "c1", due: today(-1), notes: "Ask for final delivery date.", done: true }
  ],
  activities: [
    "Nala Boutique opened a WhatsApp follow-up",
    "Prime Events moved to Interested",
    "Kato Advisory requested a quote",
    "Glow & Go Salon completed a call"
  ],
  revenue: [2.8, 3.4, 3.1, 4.7, 5.2, 6.1],
  notes: ""
};

function today(offset) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}

function loadState() {
  const saved = localStorage.getItem(STORE_KEY);
  if (!saved) {
    localStorage.setItem(STORE_KEY, JSON.stringify(seedState));
    return structuredClone(seedState);
  }
  return JSON.parse(saved);
}

function saveState(nextState = state) {
  localStorage.setItem(STORE_KEY, JSON.stringify(nextState));
}

let state = loadState();

document.addEventListener("DOMContentLoaded", () => {
  setupShell();
  setupPage();
  refreshIcons();
});

function setupShell() {
  document.querySelectorAll("[data-icon]").forEach((link) => {
    const icon = document.createElement("i");
    icon.setAttribute("data-lucide", link.dataset.icon);
    link.prepend(icon);
  });

  document.querySelector("[data-sidebar-toggle]")?.addEventListener("click", () => {
    document.body.classList.toggle("sidebar-open");
  });
}

function setupPage() {
  const page = document.body.dataset.page;
  if (page === "dashboard") renderDashboard();
  if (page === "customers") setupCustomers();
  if (page === "customer") renderCustomerProfile();
  if (page === "leads") setupLeads();
  if (page === "tasks") setupTasks();
  if (page === "reports") renderReports();
  if (page === "whatsapp") setupWhatsapp();
  if (page === "notes") setupNotes();
  if (page === "settings") document.querySelector("#saveSettings")?.addEventListener("click", () => toast("Settings saved"));
}

function refreshIcons() {
  if (window.lucide) window.lucide.createIcons();
}

function money(value) {
  return `UGX ${Number(value).toLocaleString("en-UG")}`;
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
}

function renderDashboard() {
  const openTasks = state.tasks.filter((task) => !task.done).length;
  const openLeads = state.leads.filter((lead) => !["Won", "Lost"].includes(lead.stage));
  const hotLeads = state.leads.filter((lead) => ["Interested", "Negotiating"].includes(lead.stage));
  const dueToday = state.tasks.filter((task) => !task.done && daysFromToday(task.due) <= 0);
  const dueSoon = state.tasks.filter((task) => !task.done && daysFromToday(task.due) <= 2);
  const wonRevenue = state.leads.filter((lead) => lead.stage === "Won").reduce((sum, lead) => sum + Number(lead.value), 0);
  const pipelineValue = openLeads.reduce((sum, lead) => sum + Number(lead.value), 0);

  renderKpis("#dashboardKpis", [
    ["Customers", state.customers.length, "+12% this month", "users"],
    ["Pipeline", money(pipelineValue), `${openLeads.length} open leads`, "chart-no-axes-combined"],
    ["Due Today", dueToday.length, `${openTasks} open tasks`, "list-checks"],
    ["Revenue", money(wonRevenue), "Closed deals", "banknote"]
  ]);

  renderDashboardSummary(dueToday, hotLeads, pipelineValue);
  setupDashboardControls();
  renderRevenueRange(6);
  renderConversion("#conversionChart");
  renderNotifications(dueSoon, hotLeads);

  document.querySelector("#activityFeed").innerHTML = state.activities.map((item) => `
    <div class="activity-item"><span class="activity-dot"></span><span>${escapeHtml(item)}</span></div>
  `).join("");

  document.querySelector("#dueTasks").innerHTML = dueSoon.slice(0, 4).map((task) => `
    <div class="task-mini">
      <div><strong>${escapeHtml(task.title)}</strong><span>${customerName(task.customerId)} · ${formatDue(task.due)}</span></div>
      <span class="chip ${daysFromToday(task.due) < 0 ? "chip-danger" : ""}">${daysFromToday(task.due) < 0 ? "Late" : "Open"}</span>
    </div>
  `).join("") || `<div class="empty-state">No follow-ups due soon.</div>`;

  document.querySelector("#todayFocus").innerHTML = [
    focusCard("Call first", dueToday[0]?.title || "No urgent task", dueToday[0] ? customerName(dueToday[0].customerId) : "Your day is clear", "phone-call", "tasks.html"),
    focusCard("Warm lead", hotLeads[0]?.name || "No warm lead", hotLeads[0] ? money(hotLeads[0].value) : "Pipeline is calm", "flame", "leads.html"),
    focusCard("Customer care", state.customers[0]?.name || "Add a customer", state.customers[0]?.notes || "Start building your customer list", "heart-handshake", "customers.html")
  ].join("");
  refreshIcons();
}

function renderDashboardSummary(dueToday, hotLeads, pipelineValue) {
  const date = new Intl.DateTimeFormat("en-UG", { weekday: "long", day: "numeric", month: "short" }).format(new Date());
  document.querySelector("#dashboardDate").textContent = date;
  document.querySelector("#welcomeHeadline").textContent = dueToday.length ? `${dueToday.length} follow-up${dueToday.length === 1 ? "" : "s"} need attention` : "Your follow-ups are under control";
  document.querySelector("#welcomeSummary").textContent = `${hotLeads.length} warm lead${hotLeads.length === 1 ? "" : "s"} in motion with ${money(pipelineValue)} still open in the pipeline.`;
  document.querySelector("#dashboardInsights").innerHTML = [
    `<span><i data-lucide="clock-3"></i>${dueToday.length} due today</span>`,
    `<span><i data-lucide="flame"></i>${hotLeads.length} warm leads</span>`,
    `<span><i data-lucide="wallet"></i>${money(pipelineValue)} pipeline</span>`
  ].join("");
}

function setupDashboardControls() {
  document.querySelectorAll("[data-range]").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-range]").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      renderRevenueRange(Number(button.dataset.range));
    });
  });

  const toggle = document.querySelector("#notificationToggle");
  const panel = document.querySelector("#notificationPanel");
  toggle?.addEventListener("click", () => {
    panel.hidden = !panel.hidden;
  });
}

function renderRevenueRange(monthCount) {
  const labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  renderBars("#revenueChart", state.revenue.slice(-monthCount), labels.slice(-monthCount));
}

function renderNotifications(dueSoon, hotLeads) {
  const notices = [
    ...dueSoon.map((task) => ({ title: task.title, meta: `${customerName(task.customerId)} · ${formatDue(task.due)}`, icon: "calendar-clock" })),
    ...hotLeads.slice(0, 2).map((lead) => ({ title: `${lead.name} is ${lead.stage.toLowerCase()}`, meta: money(lead.value), icon: "chart-no-axes-combined" }))
  ];
  document.querySelector("#notificationCount").textContent = notices.length;
  document.querySelector("#notificationList").innerHTML = notices.map((notice) => `
    <div class="notification-item">
      <i data-lucide="${notice.icon}"></i>
      <div><strong>${escapeHtml(notice.title)}</strong><span>${escapeHtml(notice.meta)}</span></div>
    </div>
  `).join("") || `<div class="empty-state">No new alerts.</div>`;
}

function focusCard(label, title, meta, icon, href) {
  return `
    <a class="focus-card" href="${href}">
      <i data-lucide="${icon}"></i>
      <div>
        <span>${label}</span>
        <strong>${escapeHtml(title)}</strong>
        <p>${escapeHtml(meta)}</p>
      </div>
    </a>
  `;
}

function renderKpis(selector, items) {
  document.querySelector(selector).innerHTML = items.map(([label, value, meta, icon]) => `
    <article class="kpi-card">
      <div class="kpi-top"><span>${label}</span><i data-lucide="${icon}"></i></div>
      <strong>${value}</strong>
      <span>${meta}</span>
    </article>
  `).join("");
  refreshIcons();
}

function renderBars(selector, values, labels) {
  const max = Math.max(...values);
  document.querySelector(selector).innerHTML = values.map((value, index) => `
    <div class="bar-wrap">
      <div class="bar" style="height:${Math.max(18, (value / max) * 190)}px"></div>
      <span>${labels[index]}</span>
    </div>
  `).join("");
}

function daysFromToday(dateText) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const due = new Date(dateText);
  due.setHours(0, 0, 0, 0);
  return Math.round((due - start) / 86400000);
}

function formatDue(dateText) {
  const days = daysFromToday(dateText);
  if (days < 0) return "Overdue";
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `In ${days} days`;
}

function renderConversion(selector) {
  const total = Math.max(1, state.leads.length);
  document.querySelector(selector).innerHTML = stages.map((stage) => {
    const count = state.leads.filter((lead) => lead.stage === stage).length;
    const percent = Math.round((count / total) * 100);
    return `
      <div class="conversion-row">
        <div class="conversion-meta"><strong>${stage}</strong><span>${count} · ${percent}%</span></div>
        <div class="progress-track"><span style="width:${percent}%"></span></div>
      </div>
    `;
  }).join("");
}

function setupCustomers() {
  const search = document.querySelector("#customerSearch");
  const filter = document.querySelector("#customerFilter");
  const form = document.querySelector("#customerForm");

  const render = () => {
    const query = search.value.trim().toLowerCase();
    const segment = filter.value;
    const customers = state.customers.filter((customer) => {
      const matchesQuery = [customer.name, customer.phone, customer.email].join(" ").toLowerCase().includes(query);
      const matchesSegment = segment === "all" || customer.segment === segment;
      return matchesQuery && matchesSegment;
    });

    document.querySelector("#customerRows").innerHTML = customers.map((customer) => `
      <tr>
        <td><strong>${escapeHtml(customer.name)}</strong><div class="text-muted small">${escapeHtml(customer.email)}</div></td>
        <td>${escapeHtml(customer.phone)}</td>
        <td><span class="chip">${escapeHtml(customer.segment)}</span></td>
        <td>${escapeHtml(customer.lastContact)}</td>
        <td>
          <div class="row-actions">
            <a class="btn btn-sm btn-outline-primary" href="customer.html?id=${customer.id}"><i data-lucide="eye"></i></a>
            <a class="btn btn-sm btn-outline-primary" href="${whatsappUrl(customer)}" target="_blank" rel="noreferrer"><i data-lucide="message-circle"></i></a>
            <button class="btn btn-sm btn-light" data-delete-customer="${customer.id}"><i data-lucide="trash-2"></i></button>
          </div>
        </td>
      </tr>
    `).join("");
    refreshIcons();
  };

  search.addEventListener("input", render);
  filter.addEventListener("change", render);
  document.querySelector("#customerRows").addEventListener("click", (event) => {
    const button = event.target.closest("[data-delete-customer]");
    if (!button) return;
    state.customers = state.customers.filter((customer) => customer.id !== button.dataset.deleteCustomer);
    saveState();
    render();
    toast("Customer removed");
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    state.customers.unshift({
      id: crypto.randomUUID(),
      name: value("#customerName"),
      phone: value("#customerPhone"),
      whatsapp: value("#customerWhatsapp") || value("#customerPhone").replace(/\D/g, ""),
      email: value("#customerEmail"),
      segment: value("#customerSegment"),
      address: value("#customerAddress"),
      notes: value("#customerNotes"),
      lastContact: "Today"
    });
    saveState();
    form.reset();
    bootstrap.Modal.getInstance(document.querySelector("#customerModal")).hide();
    render();
    toast("Customer added");
  });

  if (new URLSearchParams(location.search).get("action") === "new") {
    bootstrap.Modal.getOrCreateInstance(document.querySelector("#customerModal")).show();
  }

  render();
}

function renderCustomerProfile() {
  const id = new URLSearchParams(location.search).get("id") || state.customers[0]?.id;
  const customer = state.customers.find((item) => item.id === id);
  const container = document.querySelector("#customerProfile");
  if (!customer) {
    container.innerHTML = `<section class="panel"><h2>Customer not found</h2></section>`;
    return;
  }

  document.querySelector("#profileTitle").textContent = customer.name;
  const relatedTasks = state.tasks.filter((task) => task.customerId === customer.id);

  container.innerHTML = `
    <section class="profile-card">
      <h2>${escapeHtml(customer.name)}</h2>
      <span class="chip">${escapeHtml(customer.segment)}</span>
      <dl>
        <div><dt>Phone</dt><dd>${escapeHtml(customer.phone)}</dd></div>
        <div><dt>WhatsApp</dt><dd>${escapeHtml(customer.whatsapp)}</dd></div>
        <div><dt>Email</dt><dd>${escapeHtml(customer.email)}</dd></div>
        <div><dt>Address</dt><dd>${escapeHtml(customer.address)}</dd></div>
      </dl>
      <a class="btn btn-primary w-100 mt-4" href="${whatsappUrl(customer)}" target="_blank" rel="noreferrer"><i data-lucide="message-circle"></i>Message</a>
    </section>
    <section class="panel">
      <div class="panel-header"><div><p class="eyebrow">Timeline</p><h2>Notes and activity</h2></div></div>
      <div class="timeline">
        <div class="timeline-item"><strong>Customer notes</strong><p>${escapeHtml(customer.notes)}</p></div>
        ${relatedTasks.map((task) => `<div class="timeline-item"><strong>${escapeHtml(task.title)}</strong><p>${task.due} · ${task.done ? "Done" : "Open"}</p></div>`).join("")}
        <div class="timeline-item"><strong>Purchase history</strong><p>${money(450000 + relatedTasks.length * 120000)} lifetime value</p></div>
      </div>
    </section>
  `;
  refreshIcons();
}

function setupLeads() {
  const stageSelect = document.querySelector("#leadStage");
  stageSelect.innerHTML = stages.map((stage) => `<option>${stage}</option>`).join("");

  document.querySelector("#leadForm").addEventListener("submit", (event) => {
    event.preventDefault();
    state.leads.unshift({
      id: crypto.randomUUID(),
      name: value("#leadName"),
      phone: value("#leadPhone"),
      value: Number(value("#leadValue")),
      stage: value("#leadStage"),
      notes: value("#leadNotes")
    });
    saveState();
    event.target.reset();
    bootstrap.Modal.getInstance(document.querySelector("#leadModal")).hide();
    renderLeads();
    toast("Lead added");
  });

  if (new URLSearchParams(location.search).get("action") === "new") {
    bootstrap.Modal.getOrCreateInstance(document.querySelector("#leadModal")).show();
  }
  renderLeads();
}

function renderLeads() {
  document.querySelector("#leadBoard").innerHTML = stages.map((stage) => {
    const leads = state.leads.filter((lead) => lead.stage === stage);
    return `
      <section class="kanban-column" data-stage="${stage}">
        <div class="kanban-head"><span>${stage}</span><span class="chip">${leads.length}</span></div>
        ${leads.map((lead) => `
          <article class="lead-card" draggable="true" data-lead-id="${lead.id}">
            <strong>${escapeHtml(lead.name)}</strong>
            <p>${escapeHtml(lead.phone)}</p>
            <p class="lead-value">${money(lead.value)}</p>
            <p>${escapeHtml(lead.notes)}</p>
          </article>
        `).join("")}
      </section>
    `;
  }).join("");

  document.querySelectorAll(".lead-card").forEach((card) => {
    card.addEventListener("dragstart", (event) => event.dataTransfer.setData("text/plain", card.dataset.leadId));
  });
  document.querySelectorAll(".kanban-column").forEach((column) => {
    column.addEventListener("dragover", (event) => event.preventDefault());
    column.addEventListener("drop", (event) => {
      event.preventDefault();
      const lead = state.leads.find((item) => item.id === event.dataTransfer.getData("text/plain"));
      if (!lead) return;
      lead.stage = column.dataset.stage;
      state.activities.unshift(`${lead.name} moved to ${lead.stage}`);
      saveState();
      renderLeads();
      toast("Lead updated");
    });
  });
}

function setupTasks() {
  const customerSelect = document.querySelector("#taskCustomer");
  const filterButtons = document.querySelectorAll("[data-task-filter]");
  customerSelect.innerHTML = state.customers.map((customer) => `<option value="${customer.id}">${escapeHtml(customer.name)}</option>`).join("");

  let currentFilter = "all";
  filterButtons.forEach((button) => button.addEventListener("click", () => {
    filterButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    currentFilter = button.dataset.taskFilter;
    renderTasks(currentFilter);
  }));

  document.querySelector("#taskForm").addEventListener("submit", (event) => {
    event.preventDefault();
    state.tasks.unshift({
      id: crypto.randomUUID(),
      title: value("#taskTitle"),
      customerId: value("#taskCustomer"),
      due: value("#taskDue"),
      notes: value("#taskNotes"),
      done: false
    });
    saveState();
    event.target.reset();
    bootstrap.Modal.getInstance(document.querySelector("#taskModal")).hide();
    renderTasks(currentFilter);
    toast("Task added");
  });

  document.querySelector("#taskList").addEventListener("change", (event) => {
    const checkbox = event.target.closest("[data-task-toggle]");
    if (!checkbox) return;
    const task = state.tasks.find((item) => item.id === checkbox.dataset.taskToggle);
    task.done = checkbox.checked;
    saveState();
    renderTasks(currentFilter);
  });

  renderTasks(currentFilter);
}

function renderTasks(filter = "all") {
  const tasks = state.tasks.filter((task) => filter === "all" || (filter === "done" ? task.done : !task.done));
  document.querySelector("#taskList").innerHTML = tasks.map((task) => `
    <article class="task-item ${task.done ? "done" : ""}">
      <input class="form-check-input" type="checkbox" ${task.done ? "checked" : ""} data-task-toggle="${task.id}" aria-label="Complete task">
      <div><strong>${escapeHtml(task.title)}</strong><p>${customerName(task.customerId)} · Due ${task.due}</p><p>${escapeHtml(task.notes)}</p></div>
      <span class="chip">${task.done ? "Done" : "Open"}</span>
    </article>
  `).join("");
}

function renderReports() {
  const won = state.leads.filter((lead) => lead.stage === "Won").reduce((sum, lead) => sum + Number(lead.value), 0);
  renderKpis("#reportKpis", [
    ["Sales", money(won), "Closed revenue", "banknote"],
    ["Conversion", `${Math.round((state.leads.filter((lead) => lead.stage === "Won").length / Math.max(1, state.leads.length)) * 100)}%`, "Won leads", "target"],
    ["Customers", state.customers.length, "Active records", "users"],
    ["Follow-ups", state.tasks.filter((task) => !task.done).length, "Open tasks", "list-checks"]
  ]);
  renderBars("#reportRevenue", state.revenue, ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]);
  document.querySelector("#growthChart").innerHTML = [2, 3, 4, 5, 7, state.customers.length].map((value) => `<span class="line-point" style="height:${value * 24}px"></span>`).join("");
  renderConversion("#stageSummary");
  document.querySelector("#exportReport")?.addEventListener("click", () => toast("Report exported"));
}

function setupWhatsapp() {
  const input = document.querySelector("#whatsappSearch");
  const render = () => {
    const query = input.value.trim().toLowerCase();
    const customers = state.customers.filter((customer) => [customer.name, customer.phone, customer.segment].join(" ").toLowerCase().includes(query));
    document.querySelector("#whatsappList").innerHTML = customers.map((customer) => `
      <article class="contact-card">
        <strong>${escapeHtml(customer.name)}</strong>
        <p>${escapeHtml(customer.phone)}</p>
        <p>${escapeHtml(customer.notes)}</p>
        <a class="btn btn-primary" href="${whatsappUrl(customer)}" target="_blank" rel="noreferrer"><i data-lucide="message-circle"></i>Message</a>
      </article>
    `).join("");
    refreshIcons();
  };
  input.addEventListener("input", render);
  render();
}

function setupNotes() {
  const area = document.querySelector("#notesArea");
  area.value = state.notes || "";
  document.querySelector("#saveNote").addEventListener("click", () => {
    state.notes = area.value;
    saveState();
    toast("Notes saved");
  });
}

function customerName(id) {
  return state.customers.find((customer) => customer.id === id)?.name || "No customer";
}

function whatsappUrl(customer) {
  const phone = (customer.whatsapp || customer.phone || "").replace(/\D/g, "");
  return `https://wa.me/${phone}?text=${encodeURIComponent(`Hello ${customer.name}, following up from LinkMe CRM.`)}`;
}

function value(selector) {
  return document.querySelector(selector).value.trim();
}

function toast(message) {
  document.querySelector(".toast-lite")?.remove();
  const element = document.createElement("div");
  element.className = "toast-lite";
  element.textContent = message;
  document.body.appendChild(element);
  setTimeout(() => element.remove(), 2200);
}
