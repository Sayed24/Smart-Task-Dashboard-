/* ------------------------------
   LOADING SCREEN
------------------------------ */
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    const loader = document.getElementById("loadingScreen");
    if (loader) loader.classList.add("hidden");

    const firstSection = document.querySelector(".section");
    if (firstSection) firstSection.classList.add("active-section");
    updateStats();
  }, 800);
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
  });
});

/* ------------------------------
   TASK MANAGER
------------------------------ */
const taskList = document.getElementById("taskList");

function addTask(taskTitle = "New Task") {
  const li = document.createElement("li");
  li.textContent = taskTitle;
  taskList.appendChild(li);
  updateStats();
}

document.getElementById("addTaskBtn")?.addEventListener("click", () => addTask());

/* ------------------------------
   PROFILE
------------------------------ */
document.getElementById("saveProfile")?.addEventListener("click", e => {
  e.preventDefault();
  alert("Profile saved!");
});

/* ------------------------------
   DASHBOARD STATS
------------------------------ */
function updateStats() {
  const totalTasks = taskList.children.length;
  document.getElementById("statTotal").textContent = totalTasks;
  document.getElementById("statDone").textContent = 0;
  document.getElementById("statPending").textContent = totalTasks;
}

/* ------------------------------
   THEME TOGGLE
------------------------------ */
document.getElementById("themeToggle")?.addEventListener("click", () => {
  document.body.classList.toggle("dark");
});

/* ------------------------------
   CHART
------------------------------ */
const ctx = document.getElementById("taskChart");
if(ctx){
  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Done','Pending'],
      datasets:[{
        data:[0,1],
        backgroundColor:['#0d6efd','#ddd']
      }]
    },
    options: {responsive:true}
  });
}

/* ------------------------------
   LOGIN DEMO
------------------------------ */
document.getElementById("loginBtn")?.addEventListener("click", () => {
  const modalEl = document.getElementById("loginModal");
  if(modalEl) new bootstrap.Modal(modalEl).show();
});