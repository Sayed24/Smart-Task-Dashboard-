/* SmartTask Dashboard - script.js
   Full features: loading, nav, tasks (drag/drop), chart, export/import, activity log, theme, profile
*/

/* ------------------------------
   DOM Ready + initialization
------------------------------ */
document.addEventListener('DOMContentLoaded', () => {
  // Hide loading screen
  const loader = document.getElementById('loadingScreen');
  if (loader) loader.style.display = 'none';

  // Show dashboard section
  showSection('dashboard');

  // Initialize from localStorage
  loadState();

  // If no tasks, add a sample task so chart/stats show
  if (!tasks || tasks.length === 0) {
    addTask('Welcome — sample task', 'pending', false);
  } else {
    // render existing tasks
    tasks.forEach(t => addTaskToDOM(t.title, t.status, false));
  }

  updateStats();
  renderChart();
});

/* ------------------------------
   State (in-memory + localStorage)
------------------------------ */
let tasks = [];        // { title, status }
let activity = [];     // log messages
let events = [];       // calendar events (placeholder)

const STORAGE_KEYS = {
  TASKS: 'smarttask_tasks_v1',
  ACTIVITY: 'smarttask_activity_v1',
  THEME: 'smarttask_theme_v1',
  PROFILE: 'smarttask_profile_v1'
};

function saveState() {
  localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  localStorage.setItem(STORAGE_KEYS.ACTIVITY, JSON.stringify(activity));
}

function loadState() {
  const rawTasks = localStorage.getItem(STORAGE_KEYS.TASKS);
  const rawActivity = localStorage.getItem(STORAGE_KEYS.ACTIVITY);
  const profile = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFILE) || '{}');

  tasks = rawTasks ? JSON.parse(rawTasks) : [];
  activity = rawActivity ? JSON.parse(rawActivity) : [];

  // restore profile UI
  if (profile.name) document.getElementById('profileName').value = profile.name;
  if (profile.email) document.getElementById('profileEmail').value = profile.email;
  if (profile.bio) document.getElementById('profileBio').value = profile.bio;

  // restore theme
  const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
  if (savedTheme === 'dark') document.body.classList.add('dark');

  // render activity log
  activity.forEach(a => addActivityToDOM(a, true));
}

/* ------------------------------
   Navigation / Sections
------------------------------ */
const menuItems = document.querySelectorAll('.menu-item');
menuItems.forEach(item => {
  item.addEventListener('click', () => {
    const section = item.dataset.section;
    showSection(section);
    // mobile sidebar close
    if (window.innerWidth <= 900) document.getElementById('sidebar').classList.remove('open');
  });
});

document.getElementById('menuToggle')?.addEventListener('click', () => {
  const sidebar = document.getElementById('sidebar');
  sidebar.classList.toggle('open');
});

function showSection(id) {
  document.querySelectorAll('.section').forEach(s => s.style.display = 'none');
  const el = document.getElementById(id);
  if (el) el.style.display = 'block';
  // toggle active class in menu
  document.querySelectorAll('.menu-item').forEach(mi => {
    mi.classList.toggle('active', mi.dataset.section === id);
  });
  // set page title
  const titleEl = document.getElementById('pageTitle');
  if (titleEl) titleEl.textContent = id.charAt(0).toUpperCase() + id.slice(1);
}

/* ------------------------------
   Tasks: add / render / toggle / delete / reorder
------------------------------ */
const taskListEl = document.getElementById('taskList');

function addTask(title = 'New Task', status = 'pending', persist = true) {
  // push to state then DOM
  tasks.push({ title, status });
  if (persist) saveState();
  addTaskToDOM(title, status, true);
  updateStats();
  renderChart();
  logActivity(`Task added: ${title}`);
}

function addTaskToDOM(title, status, focus = true) {
  const li = document.createElement('li');
  li.className = 'task-item';
  li.draggable = true;
  li.dataset.status = status;

  const left = document.createElement('div');
  left.className = 'd-flex align-items-center gap-2';
  const titleSpan = document.createElement('span');
  titleSpan.textContent = title;
  if (status === 'done') titleSpan.style.textDecoration = 'line-through';
  left.appendChild(titleSpan);

  const meta = document.createElement('small');
  meta.className = 'text-muted ms-2';
  meta.textContent = status === 'done' ? 'Done' : 'Pending';
  left.appendChild(meta);

  const right = document.createElement('div');
  right.className = 'd-flex gap-2 align-items-center';

  // toggle button
  const toggleBtn = document.createElement('button');
  toggleBtn.className = 'btn btn-sm btn-success';
  toggleBtn.innerHTML = '<i class="fa fa-check"></i>';
  toggleBtn.title = 'Toggle complete';
  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleTaskByElement(li);
  });

  // edit button
  const editBtn = document.createElement('button');
  editBtn.className = 'btn btn-sm btn-outline-secondary';
  editBtn.innerHTML = '<i class="fa fa-pen"></i>';
  editBtn.title = 'Edit task';
  editBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    openEditModal(li);
  });

  // delete button
  const delBtn = document.createElement('button');
  delBtn.className = 'btn btn-sm btn-danger';
  delBtn.innerHTML = '<i class="fa fa-trash"></i>';
  delBtn.title = 'Delete task';
  delBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    deleteTaskElement(li);
  });

  right.appendChild(toggleBtn);
  right.appendChild(editBtn);
  right.appendChild(delBtn);

  li.appendChild(left);
  li.appendChild(right);

  // click on li toggles
  li.addEventListener('click', () => toggleTaskByElement(li));

  // drag/drop handlers
  li.addEventListener('dragstart', e => {
    li.classList.add('dragging');
    e.dataTransfer.setData('text/plain', '');
  });
  li.addEventListener('dragend', () => {
    li.classList.remove('dragging');
    saveOrderFromDOM();
  });

  taskListEl.appendChild(li);
  // make list accept drops
  enableDragDropOnList(taskListEl);

  if (focus) {
    // small flash
    li.style.transition = 'background .2s';
    li.style.background = '#e8f0fe';
    setTimeout(() => li.style.background = '', 300);
  }
}

function toggleTaskByElement(li) {
  const title = li.querySelector('span').textContent;
  if (li.dataset.status === 'pending') {
    li.dataset.status = 'done';
    li.querySelector('span').style.textDecoration = 'line-through';
    li.querySelector('small').textContent = 'Done';
    updateTaskState(title, 'done');
    logActivity(`Task completed: ${title}`);
  } else {
    li.dataset.status = 'pending';
    li.querySelector('span').style.textDecoration = 'none';
    li.querySelector('small').textContent = 'Pending';
    updateTaskState(title, 'pending');
    logActivity(`Task marked pending: ${title}`);
  }
  updateStats();
  renderChart();
  saveState();
}

// update tasks[] by title (titles can repeat — we use first match)
function updateTaskState(title, status) {
  const idx = tasks.findIndex(t => t.title === title);
  if (idx >= 0) tasks[idx].status = status;
}

/* Delete */
function deleteTaskElement(li) {
  const title = li.querySelector('span').textContent;
  li.remove();
  // remove from tasks array (first match)
  const idx = tasks.findIndex(t => t.title === title);
  if (idx >= 0) tasks.splice(idx, 1);
  saveState();
  updateStats();
  renderChart();
  logActivity(`Task deleted: ${title}`);
}

/* Save order from DOM to tasks[] */
function saveOrderFromDOM() {
  const newTasks = [];
  taskListEl.querySelectorAll('li').forEach(li => {
    const title = li.querySelector('span').textContent;
    const status = li.dataset.status || 'pending';
    newTasks.push({ title, status });
  });
  tasks = newTasks;
  saveState();
}

/* Drag drop enabling on list container */
function enableDragDropOnList(listEl) {
  listEl.addEventListener('dragover', e => {
    e.preventDefault();
    const dragging = listEl.querySelector('.dragging');
    const afterEl = getDragAfterElement(listEl, e.clientY);
    if (!afterEl) {
      listEl.appendChild(dragging);
    } else {
      listEl.insertBefore(dragging, afterEl);
    }
  });
}

function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll('li:not(.dragging)')];
  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

/* ------------------------------
   Edit modal (reuse taskModal)
------------------------------ */
function openEditModal(li) {
  const currentTitle = li.querySelector('span').textContent;
  const currentDesc = ''; // future use
  // show modal and populate
  const modal = new bootstrap.Modal(document.getElementById('taskModal'));
  document.getElementById('taskModalTitle').textContent = 'Edit Task';
  document.getElementById('taskInput').value = currentTitle;
  document.getElementById('taskDesc').value = currentDesc;
  // set save action
  const saveBtn = document.getElementById('saveTask');
  saveBtn.onclick = () => {
    const newTitle = document.getElementById('taskInput').value.trim();
    if (!newTitle) return;
    // update DOM
    li.querySelector('span').textContent = newTitle;
    // update array
    const idx = tasks.findIndex(t => t.title === currentTitle);
    if (idx >= 0) tasks[idx].title = newTitle;
    saveState();
    modal.hide();
    logActivity(`Task edited: ${currentTitle} → ${newTitle}`);
    updateStats();
  };
  modal.show();
}

/* Save from add task modal */
document.getElementById('saveTask').addEventListener('click', () => {
  const title = document.getElementById('taskInput').value.trim();
  const desc = document.getElementById('taskDesc').value.trim();
  if (!title) return;
  addTask(title, 'pending', true);
  // clear inputs
  document.getElementById('taskInput').value = '';
  document.getElementById('taskDesc').value = '';
  // hide modal if present
  try { bootstrap.Modal.getInstance(document.getElementById('taskModal')).hide(); } catch {}
});

/* ------------------------------
   Task search & filter
------------------------------ */
document.getElementById('taskSearch').addEventListener('input', filterTasks);
document.getElementById('taskFilter').addEventListener('change', filterTasks);

function filterTasks() {
  const q = document.getElementById('taskSearch').value.toLowerCase();
  const f = document.getElementById('taskFilter').value;
  taskListEl.querySelectorAll('li').forEach(li => {
    const text = li.querySelector('span').textContent.toLowerCase();
    const status = li.dataset.status;
    const matchesQuery = text.includes(q);
    const matchesFilter = f === 'all' || f === status;
    li.style.display = (matchesQuery && matchesFilter) ? 'flex' : 'none';
  });
}

/* ------------------------------
   Stats + Chart
------------------------------ */
function updateStats() {
  const total = tasks.length;
  const done = tasks.filter(t => t.status === 'done').length;
  const pending = total - done;
  document.getElementById('statTotal').textContent = total;
  document.getElementById('statDone').textContent = done;
  document.getElementById('statPending').textContent = pending;
  document.getElementById('statUsers').textContent = 1;
}

/* Chart.js doughnut */
let chartInstance = null;
function renderChart() {
  const ctx = document.getElementById('taskChart');
  if (!ctx) return;
  const done = tasks.filter(t => t.status === 'done').length;
  const pending = tasks.filter(t => t.status === 'pending').length;
  if (chartInstance) chartInstance.destroy();
  chartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Completed', 'Pending'],
      datasets: [{ data: [done, pending], backgroundColor: ['#198754', '#0d6efd'] }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });
}

/* ------------------------------
   Export / Import JSON & PDF
------------------------------ */
document.getElementById('exportJsonBtn').addEventListener('click', () => {
  const data = { tasks, activity, events };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'smarttask-backup.json'; a.click();
  URL.revokeObjectURL(url);
  logActivity('Exported data to JSON');
});

document.getElementById('importJsonBtn').addEventListener('click', () => {
  document.getElementById('hiddenImport').click();
});

document.getElementById('hiddenImport').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const obj = JSON.parse(ev.target.result);
      if (obj.tasks) {
        tasks = obj.tasks;
        taskListEl.innerHTML = '';
        tasks.forEach(t => addTaskToDOM(t.title, t.status, false));
        saveState();
        updateStats();
        renderChart();
        logActivity('Imported tasks from JSON');
      }
      if (obj.activity) {
        activity = obj.activity;
        activity.forEach(a => addActivityToDOM(a, true));
      }
    } catch (err) {
      alert('Invalid JSON file');
    }
  };
  reader.readAsText(file);
});

/* Export PDF (jsPDF) */
document.getElementById('exportPdfBtn').addEventListener('click', () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text('SmartTask - Tasks', 14, 20);
  let y = 30;
  tasks.forEach((t, i) => {
    const status = t.status === 'done' ? '✔' : '✖';
    doc.text(`${i + 1}. [${status}] ${t.title}`, 14, y);
    y += 8;
    if (y > 270) { doc.addPage(); y = 20; }
  });
  doc.save('smarttask-tasks.pdf');
  logActivity('Exported tasks to PDF');
});

/* ------------------------------
   Activity log helpers
------------------------------ */
const activityLogEl = document.getElementById('activityLog');
function addActivityToDOM(msg, prepend = true) {
  const li = document.createElement('li');
  li.textContent = msg;
  if (prepend) activityLogEl.prepend(li);
  else activityLogEl.appendChild(li);
}
function logActivity(msg) {
  const time = new Date().toLocaleString();
  const entry = `[${time}] ${msg}`;
  activity.unshift(entry);
  saveState();
  addActivityToDOM(entry, true);
}

/* ------------------------------
   Profile
------------------------------ */
document.getElementById('saveProfile').addEventListener('click', (e) => {
  e.preventDefault();
  const profile = {
    name: document.getElementById('profileName').value.trim(),
    email: document.getElementById('profileEmail').value.trim(),
    bio: document.getElementById('profileBio').value.trim()
  };
  localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  logActivity('Profile saved');
  alert('Profile saved');
});

/* ------------------------------
   Theme & UI controls
------------------------------ */
document.getElementById('themeToggle').addEventListener('click', () => {
  document.body.classList.toggle('dark');
  localStorage.setItem(STORAGE_KEYS.THEME, document.body.classList.contains('dark') ? 'dark' : 'light');
});
document.getElementById('setLight').addEventListener('click', () => {
  document.body.classList.remove('dark'); localStorage.setItem(STORAGE_KEYS.THEME, 'light');
});
document.getElementById('setDark').addEventListener('click', () => {
  document.body.classList.add('dark'); localStorage.setItem(STORAGE_KEYS.THEME, 'dark');
});
document.getElementById('collapseSidebar').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});

/* ------------------------------
   Login demo
------------------------------ */
document.getElementById('loginBtn').addEventListener('click', () => {
  const modal = new bootstrap.Modal(document.getElementById('loginModal'));
  modal.show();
});
document.getElementById('loginSubmit').addEventListener('click', () => {
  const email = document.getElementById('loginEmail').value.trim();
  const pass = document.getElementById('loginPass').value;
  if (email === 'demo@example.com' && pass === 'demo123') {
    document.getElementById('sidebarUser').textContent = 'Demo User';
    logActivity('Logged in (demo)');
    bootstrap.Modal.getInstance(document.getElementById('loginModal')).hide();
    alert('Logged in as demo user');
  } else {
    alert('Demo credentials: demo@example.com / demo123');
  }
});