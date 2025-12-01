/* SmartTask Dashboard - script.js
   - Keep everything, expand with login, profile, calendar, export PDF, toasts, charts
*/

/* ----- Helpers ----- */
const qs = s => document.querySelector(s);
const qsa = s => document.querySelectorAll(s);

function toast(msg, opts = {}) {
  const container = qs('#toastContainer');
  const id = 't' + Date.now();
  const toastEl = document.createElement('div');
  toastEl.className = 'toast align-items-center text-bg-dark border-0';
  toastEl.role = 'alert';
  toastEl.ariaLive = 'assertive';
  toastEl.ariaAtomic = 'true';
  toastEl.id = id;
  toastEl.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">${msg}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
    </div>`;
  container.appendChild(toastEl);
  const bs = new bootstrap.Toast(toastEl, { delay: 4000 });
  bs.show();
  toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
}

/* ----- Loading screen ----- */
setTimeout(() => {
  qs('#loadingScreen').style.display = 'none';
}, 700);

/* ----- State & Storage ----- */
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let log = JSON.parse(localStorage.getItem('activityLog')) || [];
let events = JSON.parse(localStorage.getItem('calendarEvents')) || [];
let profile = JSON.parse(localStorage.getItem('profile')) || {name:'Guest', email:'', bio:''};
let session = JSON.parse(localStorage.getItem('session')) || {logged:false, email:''};

/* ----- UI references ----- */
const themeToggle = qs('#themeToggle');
const menuToggle = qs('#menuToggle');
const sidebar = qs('#sidebar');
const menuItems = qsa('#sidebar .menu li');
const sections = qsa('.section');
const pageTitle = qs('#pageTitle');
const welcomeName = qs('#welcomeName');
const userSmall = qs('#userSmall');

/* ----- Initialize UI from storage ----- */
function initProfileUI(){
  qs('#profileName').value = profile.name || '';
  qs('#profileEmail').value = profile.email || '';
  qs('#profileBio').value = profile.bio || '';
  welcomeName.textContent = profile.name ? `Welcome, ${profile.name}` : 'Welcome';
  userSmall.textContent = profile.name || 'Guest';
  qs('#statUsers').textContent = 1;
}
initProfileUI();

/* ----- Theme ----- */
if (localStorage.getItem('theme') === 'dark') document.body.classList.add('dark');
themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
});

/* ----- Sidebar toggle ----- */
menuToggle?.addEventListener('click', () => sidebar.classList.toggle('collapsed'));
qs('#collapseSidebar')?.addEventListener('click', () => sidebar.classList.toggle('collapsed'));

/* ----- Navigation (single-page) ----- */
menuItems.forEach(li => {
  li.addEventListener('click', () => {
    menuItems.forEach(x => x.classList.remove('active'));
    li.classList.add('active');
    const section = li.dataset.section;
    showSection(section);
  });
});

function showSection(id){
  sections.forEach(s => s.classList.remove('active-section'));
  qs(`#${id}`).classList.add('active-section');
  pageTitle.textContent = id.charAt(0).toUpperCase() + id.slice(1);
}

/* ----- Login system (front-end demo) ----- */
qs('#loginBtn').addEventListener('click', () => {
  const loginModal = new bootstrap.Modal(qs('#loginModal'));
  loginModal.show();
});
qs('#loginSubmit').addEventListener('click', () => {
  const email = qs('#loginEmail').value.trim();
  const pass = qs('#loginPass').value;
  // demo credentials
  if (email === 'demo@example.com' && pass === 'demo123') {
    session = {logged:true, email};
    localStorage.setItem('session', JSON.stringify(session));
    bootstrap.Modal.getInstance(qs('#loginModal')).hide();
    toast('Logged in (demo account)');
    profile.name = 'Demo User'; profile.email = email;
    localStorage.setItem('profile', JSON.stringify(profile));
    initProfileUI();
    qs('#loginEmail').value = ''; qs('#loginPass').value = '';
  } else {
    toast('Invalid demo credentials — use demo@example.com / demo123');
  }
});

/* ----- Logout buttons ----- */
[qs('#logoutBtn'), qs('#logoutBtn2')].forEach(b => {
  if(!b) return;
  b.addEventListener('click', () => {
    session = {logged:false, email:''};
    localStorage.setItem('session', JSON.stringify(session));
    toast('Logged out');
    profile.name = 'Guest'; profile.email=''; profile.bio='';
    localStorage.setItem('profile', JSON.stringify(profile));
    initProfileUI();
    showSection('dashboard');
  });
});

/* ----- Activity log ----- */
function addLog(msg){
  const time = new Date().toLocaleString();
  log.unshift(`${time} — ${msg}`);
  localStorage.setItem('activityLog', JSON.stringify(log));
  renderLog();
}
function renderLog(){
  const ul = qs('#activityLog');
  ul.innerHTML = '';
  log.slice(0,200).forEach(item => {
    const li = document.createElement('li');
    li.textContent = item;
    li.className = 'mb-2';
    ul.appendChild(li);
  });
}
renderLog();

/* ----- Tasks rendering & logic ----- */
const taskList = qs('#taskList');       // quick list
const taskListFull = qs('#taskListFull'); // full manager
const statTotal = qs('#statTotal');
const statDone = qs('#statDone');
const statPending = qs('#statPending');

function saveTasks(){ localStorage.setItem('tasks', JSON.stringify(tasks)); }
function renderTasks(){
  // quick list
  taskList.innerHTML = '';
  taskListFull.innerHTML = '';
  tasks.forEach((t, i) => {
    const li = document.createElement('li'); li.className='task-item';
    li.draggable = true;
    li.innerHTML = `
      <div>
        <strong ${t.done ? 'style="text-decoration:line-through"' : ''}>${t.name}</strong>
        <div class="task-meta">${t.due ? 'Due: '+t.due+' • ' : ''}${t.priority || ''}</div>
      </div>
      <div class="d-flex gap-2">
        <button class="btn btn-success btn-sm" data-act="toggle" data-i="${i}"><i class="fa fa-check"></i></button>
        <button class="btn btn-outline-secondary btn-sm" data-act="edit" data-i="${i}"><i class="fa fa-pen"></i></button>
        <button class="btn btn-danger btn-sm" data-act="delete" data-i="${i}"><i class="fa fa-trash"></i></button>
      </div>`;
    taskList.appendChild(li);

    // copy for full
    const li2 = li.cloneNode(true);
    taskListFull.appendChild(li2);
  });

  // stats
  const done = tasks.filter(x => x.done).length;
  statTotal.textContent = tasks.length;
  statDone.textContent = done;
  statPending.textContent = tasks.length - done;

  saveTasks();
  updateChart();
  populateEventTaskLinks();
}
renderTasks();

/* ----- Task actions (delegated) ----- */
[q s = '#taskList, #taskListFull',].forEach(()=>{});
[taskList, taskListFull].forEach(list => {
  list.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if(!btn) return;
    const i = parseInt(btn.dataset.i);
    const act = btn.dataset.act;
    if(act === 'toggle'){
      tasks[i].done = !tasks[i].done;
      addLog(`Task "${tasks[i].name}" marked ${tasks[i].done ? 'completed' : 'pending'}`);
      toast(`Task ${tasks[i].done ? 'completed' : 'pending'}`);
      renderTasks();
    } else if(act === 'delete'){
      addLog(`Task "${tasks[i].name}" deleted`);
      tasks.splice(i,1);
      toast('Task deleted');
      renderTasks();
    } else if(act === 'edit'){
      // open modal to edit existing
      openTaskModal(tasks[i], i);
    }
  });

  // Drag handlers
  list.addEventListener('dragstart', (e) => {
    const li = e.target.closest('li');
    if(!li) return;
    e.dataTransfer.setData('text/index', [...li.parentNode.children].indexOf(li));
  });
});

/* ----- Task modal save ----- */
function openTaskModal(task = null, idx = null){
  qs('#taskInput').value = task ? task.name : '';
  qs('#taskDesc').value = task ? task.desc || '' : '';
  qs('#taskDue').value = task ? task.due || '' : '';
  qs('#taskPriority').value = task ? task.priority || 'medium' : 'medium';
  qs('#taskModalTitle').textContent = task ? 'Edit Task' : 'Add New Task';
  qs('#saveTask').dataset.idx = (idx !== null) ? idx : '';
  new bootstrap.Modal(qs('#taskModal')).show();
}
qs('#addTaskBtn').addEventListener('click', ()=> openTaskModal());
qs('#openTaskModal').addEventListener('click', ()=> {
  showSection('tasks');
  openTaskModal();
});

/* save task */
qs('#saveTask').addEventListener('click', () => {
  const name = qs('#taskInput').value.trim();
  if(!name) { toast('Task name required'); return; }
  const desc = qs('#taskDesc').value.trim();
  const due = qs('#taskDue').value;
  const priority = qs('#taskPriority').value;
  const idx = qs('#saveTask').dataset.idx;
  if(idx !== ''){
    // edit
    tasks[idx] = {...tasks[idx], name, desc, due, priority};
    addLog(`Task "${name}" updated`);
    toast('Task updated');
  } else {
    tasks.push({name, desc, due, priority, done:false, created: new Date().toISOString()});
    addLog(`Task "${name}" added`);
    toast('Task added');
  }
  bootstrap.Modal.getInstance(qs('#taskModal')).hide();
  renderTasks();
});

/* quick add */
qs('#quickAddBtn').addEventListener('click', () => {
  const val = qs('#quickTaskInput').value.trim();
  if(!val) return;
  tasks.push({name:val, done:false, priority:'low', created: new Date().toISOString()});
  qs('#quickTaskInput').value = '';
  addLog(`Quick task "${val}" added`);
  renderTasks();
  toast('Quick task added');
});

/* clear completed */
qs('#clearCompleted').addEventListener('click', () => {
  const before = tasks.length;
  tasks = tasks.filter(t => !t.done);
  addLog(`Cleared completed tasks (${before - tasks.length})`);
  renderTasks();
  toast('Completed cleared');
});

/* search & filter */
qs('#taskSearch').addEventListener('input', (e) => {
  const q = e.target.value.toLowerCase();
  Array.from(taskList.children).forEach((li, idx) => {
    li.style.display = tasks[idx].name.toLowerCase().includes(q) ? 'flex' : 'none';
  });
});
qs('#taskFilter').addEventListener('change', (e) => {
  const f = e.target.value;
  Array.from(taskList.children).forEach((li, idx) => {
    const t = tasks[idx];
    if(f === 'all') li.style.display = 'flex';
    else if(f === 'done' && t.done) li.style.display = 'flex';
    else if(f === 'pending' && !t.done) li.style.display = 'flex';
    else li.style.display = 'none';
  });
});

/* drag/drop reorder on full task list container */
taskListFull.addEventListener('dragover', e => e.preventDefault());
taskListFull.addEventListener('drop', e => {
  e.preventDefault();
  const oldIndex = parseInt(e.dataTransfer.getData('text/index'));
  const targetLi = e.target.closest('li');
  const children = [...taskListFull.children];
  const newIndex = targetLi ? children.indexOf(targetLi) : children.length - 1;
  if(isNaN(oldIndex) || newIndex < 0) return;
  const [moved] = tasks.splice(oldIndex, 1);
  tasks.splice(newIndex, 0, moved);
  addLog('Tasks reordered');
  renderTasks();
});

/* ----- Calendar (simple) ----- */
const calRoot = qs('#calendarRoot');
let currentDate = new Date();

function buildCalendar(date){
  calRoot.innerHTML = '';
  const year = date.getFullYear(), month = date.getMonth();
  const first = new Date(year, month, 1);
  const startDay = first.getDay(); // 0-6
  const daysInMonth = new Date(year, month+1, 0).getDate();

  // header row (weekdays)
  const weekdays = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  weekdays.forEach(w => {
    const hd = document.createElement('div'); hd.className='cal-cell text-muted'; hd.innerHTML = `<strong>${w}</strong>`;
    calRoot.appendChild(hd);
  });

  // empty cells before
  for(let i=0;i<startDay;i++){
    const cell = document.createElement('div'); cell.className='cal-cell'; calRoot.appendChild(cell);
  }

  // days
  for(let d=1; d<=daysInMonth; d++){
    const cell = document.createElement('div'); cell.className='cal-cell';
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    cell.innerHTML = `<div class="dateNum">${d}</div><div class="events"></div>`;
    const eventsForDay = events.filter(ev => ev.date === dateStr);
    const evRoot = cell.querySelector('.events');
    eventsForDay.forEach(ev => {
      const el = document.createElement('div'); el.className='cal-event'; el.textContent = ev.title;
      evRoot.appendChild(el);
    });
    cell.addEventListener('dblclick', () => {
      // open add event modal with date prefilled
      qs('#eventDate').value = dateStr;
      new bootstrap.Modal(qs('#eventModal')).show();
    });
    calRoot.appendChild(cell);
  }
}
buildCalendar(currentDate);

/* calendar nav */
qs('#prevMonth').addEventListener('click', () => {
  currentDate.setMonth(currentDate.getMonth()-1); buildCalendar(currentDate);
});
qs('#nextMonth').addEventListener('click', () => {
  currentDate.setMonth(currentDate.getMonth()+1); buildCalendar(currentDate);
});
qs('#todayBtn').addEventListener('click', () => {
  currentDate = new Date(); buildCalendar(currentDate);
});

/* add event */
qs('#addEventBtn').addEventListener('click', () => {
  qs('#eventTitle').value = ''; qs('#eventDate').value = '';
  populateEventTaskLinks();
  new bootstrap.Modal(qs('#eventModal')).show();
});
qs('#saveEventBtn').addEventListener('click', () => {
  const title = qs('#eventTitle').value.trim();
  const date = qs('#eventDate').value;
  const link = qs('#eventTaskLink').value;
  if(!title || !date){ toast('Event title and date required'); return; }
  events.push({title, date, link});
  localStorage.setItem('calendarEvents', JSON.stringify(events));
  addLog(`Calendar event "${title}" added on ${date}`);
  new bootstrap.Modal(qs('#eventModal')).hide();
  buildCalendar(currentDate);
  toast('Event added');
});

/* populate event task link dropdown */
function populateEventTaskLinks(){
  const select = qs('#eventTaskLink');
  select.innerHTML = `<option value="">(Link to task)</option>`;
  tasks.forEach((t, i) => {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = t.name;
    select.appendChild(opt);
  });
}

/* ----- Charts ----- */
let chart, lineChart;
function updateChart(){
  const done = tasks.filter(t => t.done).length;
  const pending = tasks.length - done;
  const ctx = qs('#taskChart').getContext('2d');
  if(chart) chart.destroy();
  chart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Completed','Pending'],
      datasets: [{ data:[done,pending], backgroundColor:['#198754','#dc3545'] }]
    },
    options: { responsive:true, maintainAspectRatio:false }
  });

  // activity line: build daily counts
  const days = [];
  const counts = {};
  // last 14 days
  for(let i=13;i>=0;i--){
    const d = new Date(); d.setDate(d.getDate()-i);
    const key = d.toISOString().slice(0,10);
    days.push(key);
    counts[key] = 0;
  }
  log.forEach(entry => {
    const dateKey = entry.split(' — ')[0].split(',')[0]; // locale date may vary; fallback
    // try ISO portion in entry (if exists)
    const m = entry.match(/^(\d{4}-\d{2}-\d{2})/);
    if(m && counts[m[1]] !== undefined) counts[m[1]]++;
    else {
      // last-resort: count today's actions
      const today = new Date().toISOString().slice(0,10);
      if(counts[today] !== undefined) counts[today]++;
    }
  });
  const series = days.map(d => counts[d] || 0);
  const ctx2 = qs('#activityLine').getContext('2d');
  if(lineChart) lineChart.destroy();
  lineChart = new Chart(ctx2, {
    type: 'line',
    data:{ labels: days.map(d=>d.slice(5)), datasets:[{label:'Actions',data:series,fill:false}]},
    options:{responsive:true,maintainAspectRatio:false}
  });
}

/* ----- Export tasks to PDF (jsPDF) ----- */
qs('#exportPdfBtn').addEventListener('click', async () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text('SmartTask - Tasks Export', 14, 20);
  doc.setFontSize(11);
  let y = 32;
  tasks.forEach((t,i) => {
    const status = t.done ? '✓' : '✗';
    const line = `${i+1}. [${status}] ${t.name} ${t.due ? ' • Due: '+t.due : ''}`;
    doc.text(line, 14, y);
    y += 7;
    if(y > 270){ doc.addPage(); y = 20; }
  });
  doc.save('smarttask-tasks.pdf');
  toast('PDF exported');
});

/* ----- Export / Import JSON ----- */
qs('#exportJsonBtn').addEventListener('click', () => {
  const data = { tasks, events, profile, log };
  const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'smarttask-backup.json'; a.click();
  URL.revokeObjectURL(url);
  toast('JSON exported');
});

qs('#importJsonBtn').addEventListener('click', () => qs('#importFile').click());
qs('#importFile').addEventListener('change', (e) => {
  const file = e.target.files[0]; if(!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const obj = JSON.parse(ev.target.result);
      if(obj.tasks) tasks = obj.tasks;
      if(obj.events) events = obj.events;
      if(obj.profile) profile = obj.profile;
      if(obj.log) log = obj.log;
      localStorage.setItem('tasks', JSON.stringify(tasks));
      localStorage.setItem('calendarEvents', JSON.stringify(events));
      localStorage.setItem('profile', JSON.stringify(profile));
      localStorage.setItem('activityLog', JSON.stringify(log));
      renderTasks(); renderLog(); buildCalendar(currentDate); initProfileUI();
      toast('JSON imported');
      addLog('Imported data from JSON file');
    } catch(err) { toast('Invalid JSON file'); }
  };
  reader.readAsText(file);
});

/* ----- Profile saving ----- */
qs('#saveProfile').addEventListener('click', (e) => {
  e.preventDefault();
  profile.name = qs('#profileName').value.trim() || 'Guest';
  profile.email = qs('#profileEmail').value.trim();
  profile.bio = qs('#profileBio').value.trim();
  localStorage.setItem('profile', JSON.stringify(profile));
  initProfileUI();
  addLog('Profile updated');
  toast('Profile saved');
});

/* ----- Utilities ----- */
function initProfileUI(){
  qs('#profileName').value = profile.name || '';
  qs('#profileEmail').value = profile.email || '';
  qs('#profileBio').value = profile.bio || '';
  welcomeName.textContent = profile.name ? `Welcome, ${profile.name}` : 'Welcome';
  userSmall.textContent = profile.name || 'Guest';
  qs('#statUsers').textContent = 1;
}

/* ----- Init final ----- */
renderTasks();
renderLog();
updateChart();
buildCalendar(currentDate);
populateEventTaskLinks();