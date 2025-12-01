/* ------------------------------
   LOADING SCREEN
------------------------------ */
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    const loader = document.getElementById("loadingScreen");
    if(loader) loader.style.display = "none";

    // Show first section
    const firstSection = document.querySelector(".section");
    if(firstSection) firstSection.classList.add("active-section");

    updateStats();
    renderChart();
  }, 500);
});

/* ------------------------------
   PAGE NAVIGATION
------------------------------ */
const pages = document.querySelectorAll(".section");
const menuItems = document.querySelectorAll("#sidebar li");

menuItems.forEach(item => {
  item.addEventListener("click", () => {
    menuItems.forEach(i => i.classList.remove("active"));
    item.classList.add("active");

    const sectionId = item.dataset.section;
    pages.forEach(p => p.classList.remove("active-section"));
    document.getElementById(sectionId).classList.add("active-section");

    const pageTitle = document.getElementById("pageTitle");
    if(pageTitle) pageTitle.textContent = item.textContent.trim();
  });
});

/* ------------------------------
   TASK MANAGER
------------------------------ */
const taskList = document.getElementById("taskList");
let tasks = [];

function addTask(title="New Task", status="pending"){
  const li = document.createElement("li");
  li.textContent = title;
  li.dataset.status = status;

  // Drag and drop
  li.draggable = true;
  li.addEventListener("dragstart", ()=>li.classList.add("dragging"));
  li.addEventListener("dragend", ()=>li.classList.remove("dragging"));

  li.addEventListener("click", () => toggleTaskStatus(li));
  taskList.appendChild(li);
  tasks.push({title,status});
  updateStats();
  renderChart();
  logActivity(`Task added: ${title}`);
}

function toggleTaskStatus(li){
  if(li.dataset.status === "pending"){
    li.dataset.status = "done";
    li.style.textDecoration = "line-through";
    logActivity(`Task completed: ${li.textContent}`);
  } else {
    li.dataset.status = "pending";
    li.style.textDecoration = "none";
    logActivity(`Task marked pending: ${li.textContent}`);
  }
  updateTasksArray();
  updateStats();
  renderChart();
}

function updateTasksArray(){
  tasks = [];
  taskList.querySelectorAll("li").forEach(li => {
    tasks.push({title: li.textContent, status: li.dataset.status});
  });
}

document.getElementById("addTaskBtn")?.addEventListener("click", ()=>addTask());

document.getElementById("clearCompleted")?.addEventListener("click", ()=>{
  taskList.querySelectorAll("li").forEach(li=>{
    if(li.dataset.status==="done") li.remove();
  });
  updateTasksArray();
  updateStats();
  renderChart();
  logActivity(`Cleared completed tasks`);
});

// Task filter & search
const taskFilter = document.getElementById("taskFilter");
const taskSearch = document.getElementById("taskSearch");
taskFilter?.addEventListener("change", filterTasks);
taskSearch?.addEventListener("input", filterTasks);

function filterTasks(){
  const filter = taskFilter.value;
  const search = taskSearch.value.toLowerCase();
  taskList.querySelectorAll("li").forEach(li=>{
    const matchesSearch = li.textContent.toLowerCase().includes(search);
    const matchesStatus = filter==="all" || li.dataset.status===filter;
    li.style.display = (matchesSearch && matchesStatus) ? "flex" : "none";
  });
}

/* ------------------------------
   PROFILE
------------------------------ */
document.getElementById("saveProfile")?.addEventListener("click", e=>{
  e.preventDefault();
  logActivity("Profile saved");
  alert("Profile saved!");
});

/* ------------------------------
   STATS & CHART
------------------------------ */
function updateStats(){
  const total = tasks.length;
  const done = tasks.filter(t=>t.status==="done").length;
  const pending = total - done;
  document.getElementById("statTotal").textContent = total;
  document.getElementById("statDone").textContent = done;
  document.getElementById("statPending").textContent = pending;
  document.getElementById("statUsers").textContent = 1;
}

let taskChart;
function renderChart(){
  const done = tasks.filter(t=>t.status==="done").length;
  const pending = tasks.filter(t=>t.status==="pending").length;
  const ctx = document.getElementById("taskChart");
  if(!ctx) return;
  if(taskChart) taskChart.destroy();
  taskChart = new Chart(ctx,{
    type:"doughnut",
    data:{
      labels:["Done","Pending"],
      datasets:[{
        data:[done,pending],
        backgroundColor:["#0d6efd","#ddd"]
      }]
    },
    options:{responsive:true}
  });
}

/* ------------------------------
   DARK MODE
------------------------------ */
document.getElementById("themeToggle")?.addEventListener("click", ()=>{
  document.body.classList.toggle("dark");
});
document.getElementById("setLight")?.addEventListener("click", ()=>document.body.classList.remove("dark"));
document.getElementById("setDark")?.addEventListener("click", ()=>document.body.classList.add("dark"));

/* ------------------------------
   LOGIN MODAL DEMO
------------------------------ */
document.getElementById("loginBtn")?.addEventListener("click",()=>{
  const modalEl = document.getElementById("loginModal");
  if(modalEl) new bootstrap.Modal(modalEl).show();
});

/* ------------------------------
   EXPORT / IMPORT JSON
------------------------------ */
document.getElementById("exportJsonBtn")?.addEventListener("click",()=>{
  const dataStr = JSON.stringify(tasks,null,2);
  const blob = new Blob([dataStr],{type:"application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "tasks.json";
  a.click();
  URL.revokeObjectURL(url);
});

document.getElementById("importJsonBtn")?.addEventListener("click",()=>{
  document.getElementById("hiddenImport").click();
});

document.getElementById("hiddenImport")?.addEventListener("change", (e)=>{
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = e=>{
    const imported = JSON.parse(e.target.result);
    tasks = [];
    taskList.innerHTML = "";
    imported.forEach(t=>addTask(t.title,t.status));
    logActivity("Tasks imported from JSON");
  };
  reader.readAsText(file);
});

/* ------------------------------
   CALENDAR PLACEHOLDER
------------------------------ */
document.getElementById("addEventBtn")?.addEventListener("click",()=>{
  alert("Calendar event functionality will be implemented soon!");
  logActivity("Calendar event added (placeholder)");
});

/* ------------------------------
   ACTIVITY LOG
------------------------------ */
const activityLog = document.getElementById("activityLog");
function logActivity(msg){
  if(!activityLog) return;
  const li = document.createElement("li");
  const time = new Date().toLocaleTimeString();
  li.textContent = `[${time}] ${msg}`;
  activityLog.prepend(li);
}