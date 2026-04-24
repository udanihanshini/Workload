// ── DOM References ────────────────────────────────────────
const taskForm      = document.getElementById("taskForm");
const taskList      = document.getElementById("taskList");
const timeline      = document.getElementById("timeline");
const categoryBars  = document.getElementById("categoryBars");
const totalTasksEl  = document.getElementById("totalTasks");
const completedEl   = document.getElementById("completedTasks");
const pendingEl     = document.getElementById("pendingTasks");
const balanceEl     = document.getElementById("balanceStatus");
const searchInput   = document.getElementById("searchInput");
const filterCat     = document.getElementById("filterCategory");
const filterStatus  = document.getElementById("filterStatus");
const clearAllBtn   = document.getElementById("clearAllBtn");
const taskCountEl   = document.getElementById("taskCount");
const clockEl       = document.getElementById("liveClock");

// ── State ─────────────────────────────────────────────────
let tasks = JSON.parse(localStorage.getItem("workloadTasks")) || [];

// ── Live Clock ────────────────────────────────────────────
function updateClock() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, "0");
  const m = String(now.getMinutes()).padStart(2, "0");
  const s = String(now.getSeconds()).padStart(2, "0");
  clockEl.textContent = `${h}:${m}:${s}`;
}
setInterval(updateClock, 1000);
updateClock();

// ── Event Listeners ───────────────────────────────────────
taskForm.addEventListener("submit", function (e) {
  e.preventDefault();

  const newTask = {
    id: Date.now(),
    title:    document.getElementById("title").value.trim(),
    category: document.getElementById("category").value,
    priority: document.getElementById("priority").value,
    date:     document.getElementById("date").value,
    time:     document.getElementById("time").value,
    duration: Number(document.getElementById("duration").value),
    notes:    document.getElementById("notes").value.trim(),
    status:   "Pending"
  };

  tasks.push(newTask);
  saveTasks();
  taskForm.reset();
  document.getElementById("duration").value = 1;
  renderApp();
});

searchInput.addEventListener("input", renderApp);
filterCat.addEventListener("change", renderApp);
filterStatus.addEventListener("change", renderApp);

clearAllBtn.addEventListener("click", function () {
  if (confirm("Are you sure you want to delete all saved activities?")) {
    tasks = [];
    saveTasks();
    renderApp();
  }
});

// ── Save ──────────────────────────────────────────────────
function saveTasks() {
  localStorage.setItem("workloadTasks", JSON.stringify(tasks));
}

// ── Main Render ───────────────────────────────────────────
function renderApp() {
  const filtered = getFilteredTasks();
  renderSummary();
  renderTaskList(filtered);
  renderTimeline(filtered);
  renderCategoryBars();
  if (taskCountEl) taskCountEl.textContent = `${filtered.length} item${filtered.length !== 1 ? "s" : ""}`;
}

function getFilteredTasks() {
  const q   = searchInput.value.toLowerCase();
  const cat = filterCat.value;
  const st  = filterStatus.value;

  return tasks.filter(t => {
    const matchSearch = t.title.toLowerCase().includes(q) ||
                        (t.notes || "").toLowerCase().includes(q) ||
                        t.category.toLowerCase().includes(q);
    const matchCat    = cat === "All" || t.category === cat;
    const matchStatus = st  === "All" || t.status   === st;
    return matchSearch && matchCat && matchStatus;
  });
}

// ── Summary ───────────────────────────────────────────────
function renderSummary() {
  const completed  = tasks.filter(t => t.status === "Completed").length;
  const pending    = tasks.filter(t => t.status === "Pending").length;
  const totalHours = tasks.filter(t => t.status === "Pending")
                          .reduce((s, t) => s + t.duration, 0);

  animateNumber(totalTasksEl, tasks.length);
  animateNumber(completedEl, completed);
  animateNumber(pendingEl, pending);

  if (totalHours <= 10)      balanceEl.textContent = "✦ Good";
  else if (totalHours <= 20) balanceEl.textContent = "⚡ Busy";
  else                       balanceEl.textContent = "🔥 Overloaded";
}

function animateNumber(el, target) {
  const current = parseInt(el.textContent) || 0;
  if (current === target) return;
  const step = target > current ? 1 : -1;
  let val = current;
  const interval = setInterval(() => {
    val += step;
    el.textContent = val;
    if (val === target) clearInterval(interval);
  }, 30);
}

// ── Task List ─────────────────────────────────────────────
function renderTaskList(arr) {
  taskList.innerHTML = "";

  if (arr.length === 0) {
    taskList.innerHTML = `
      <div class="empty-message">
        <div class="empty-icon">📭</div>
        <p>No activities found.</p>
      </div>`;
    return;
  }

  [...arr]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .forEach((task, i) => {
      const item = document.createElement("div");
      item.className = `task-item${task.status === "Completed" ? " completed" : ""}`;
      item.style.animationDelay = `${i * 0.04}s`;

      const catClass = task.category.replaceAll(" ", "-");
      const completedLabel = task.status === "Completed" ? "Mark Pending" : "Mark Done";

      item.innerHTML = `
        <div class="task-top">
          <div>
            <p class="task-title">${escapeHtml(task.title)}</p>
            <div class="badge-row">
              <span class="badge badge-${catClass}">${task.category}</span>
              <span class="badge priority-${task.priority}">${task.priority}</span>
            </div>
          </div>
          <span class="status-pill status-${task.status}">${task.status}</span>
        </div>

        <div class="task-meta">
          <span>📅 ${formatDate(task.date)}${task.time ? " · " + formatTime(task.time) : ""}</span>
          <span>⏱ ${task.duration}h</span>
        </div>

        ${task.notes ? `<p class="task-notes">${escapeHtml(task.notes)}</p>` : ""}

        <div class="task-actions">
          <button class="small-btn complete-btn" onclick="toggleStatus(${task.id})">
            ${task.status === "Completed"
              ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> Mark Pending`
              : `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg> Mark Done`}
          </button>
          <button class="small-btn delete-btn" onclick="deleteTask(${task.id})">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path></svg>
            Delete
          </button>
        </div>
      `;

      taskList.appendChild(item);
    });
}

// ── Timeline ──────────────────────────────────────────────
function renderTimeline(arr) {
  timeline.innerHTML = "";

  if (arr.length === 0) {
    timeline.innerHTML = `
      <div class="empty-message">
        <div class="empty-icon">🗓️</div>
        <p>Timeline is empty.</p>
      </div>`;
    return;
  }

  [...arr]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .forEach((task, i) => {
      const item = document.createElement("div");
      item.className = `timeline-item${task.status === "Completed" ? " tl-completed" : ""}`;
      item.style.animationDelay = `${i * 0.04}s`;

      item.innerHTML = `
        <p class="timeline-date">${formatDate(task.date)}${task.time ? " · " + formatTime(task.time) : ""}</p>
        <p class="timeline-title">${escapeHtml(task.title)}</p>
        <p class="timeline-meta">${task.category} · ${task.duration}h · ${task.status}</p>
      `;

      timeline.appendChild(item);
    });
}

// ── Category Bars ─────────────────────────────────────────
const CATEGORIES = [
  { name: "Academics",        cls: "bar-academics" },
  { name: "Lectures",         cls: "bar-lectures"  },
  { name: "File Management",  cls: "bar-files"     },
  { name: "Leisure",          cls: "bar-leisure"   },
  { name: "External Courses", cls: "bar-external"  },
  { name: "Personal",         cls: "bar-personal"  },
];

function renderCategoryBars() {
  categoryBars.innerHTML = "";
  const totalHours = tasks.reduce((s, t) => s + t.duration, 0) || 1;

  CATEGORIES.forEach(cat => {
    const hrs = tasks
      .filter(t => t.category === cat.name)
      .reduce((s, t) => s + t.duration, 0);
    const pct = Math.round((hrs / totalHours) * 100);

    const row = document.createElement("div");
    row.className = "bar-row";
    row.innerHTML = `
      <span class="bar-label">${cat.name}</span>
      <div class="bar-bg">
        <div class="bar-fill ${cat.cls}" style="width: 0%" data-target="${pct}"></div>
      </div>
      <span class="bar-pct">${pct}%</span>
    `;
    categoryBars.appendChild(row);
  });

  // Animate bars after a tick
  requestAnimationFrame(() => {
    document.querySelectorAll(".bar-fill").forEach(el => {
      el.style.width = el.dataset.target + "%";
    });
  });
}

// ── Actions ───────────────────────────────────────────────
function toggleStatus(id) {
  tasks = tasks.map(t => {
    if (t.id === id) t.status = t.status === "Completed" ? "Pending" : "Completed";
    return t;
  });
  saveTasks();
  renderApp();
}

function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  saveTasks();
  renderApp();
}

// ── Helpers ───────────────────────────────────────────────
function formatDate(str) {
  if (!str) return "No date";
  return new Date(str + "T00:00:00").toLocaleDateString(undefined, {
    year: "numeric", month: "short", day: "numeric"
  });
}

function formatTime(str) {
  if (!str) return "";
  const [h, m] = str.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour   = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ── Init ──────────────────────────────────────────────────
renderApp();
