// LOADING SCREEN
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    document.getElementById("loadingScreen").classList.add("hidden");
    document.querySelectorAll(".section")[0].classList.add("active-section");
  }, 800);
});

// PAGE NAVIGATION
const pages = document.querySelectorAll(".section");
const menuItems = document.querySelectorAll("#sidebar li");

menuItems.forEach(item => {
  item.addEventListener("click", () => {
    menuItems.forEach(i => i.classList.remove("active"));
    item.classList.add("active");
    const section = item.dataset.section;
    pages.forEach(p => p.classList.remove("active-section"));
    document.getElementById(section).classList.add("active-section");
  });
});

// TASKS
const taskList = document.getElementById("taskList");
document.getElementById("addTaskBtn").addEventListener("click", () => {
  const li = document.createElement("li");
  li.textContent = "New Task";
  taskList.appendChild(li);
  updateStats();
});

// PROFILE
document.getElementById("saveProfile")?.addEventListener("click", (e)=>{
  e.preventDefault();
  alert("Profile saved!");
});

// STATS
function updateStats() {
  document.getElementById("statTotal").textContent = taskList.children.length;
  document.getElementById("statDone").textContent = 0;
  document.getElementById("statPending").textContent = taskList.children.length;
}

// THEME
document.getElementById("themeToggle").addEventListener("click", () => {
  document.body.classList.toggle("dark");
});

// DASHBOARD CHART
const ctx = document.getElementById("taskChart");
if(ctx){
  new Chart(ctx, {type:'doughnut', data:{labels:['Done','Pending'],datasets:[{data:[0,1],backgroundColor:['#0d6efd','#ddd']}]}, options:{responsive:true}});
}

// SIMPLE LOGIN DEMO
document.getElementById("loginBtn").addEventListener("click",()=>new bootstrap.Modal(document.getElementById("loginModal")).show());