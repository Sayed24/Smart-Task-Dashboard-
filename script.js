/* ------------------ Loading Screen ------------------ */
setTimeout(() => {
    document.getElementById("loadingScreen").style.display = "none";
}, 900);


/* ------------------ Theme Toggle ------------------ */
const themeToggle = document.getElementById("themeToggle");

if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark");
}

themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");

    localStorage.setItem("theme",
        document.body.classList.contains("dark") ? "dark" : "light"
    );
});


/* ------------------ Sidebar Toggle ------------------ */
document.getElementById("menuToggle").addEventListener("click", () => {
    document.getElementById("sidebar").classList.toggle("collapsed");
});


/* ------------------ Task System ------------------ */
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let log = JSON.parse(localStorage.getItem("activityLog")) || [];

const taskList = document.getElementById("taskList");
const statTotal = document.getElementById("statTotal");
const statDone = document.getElementById("statDone");
const statPending = document.getElementById("statPending");
const activityLog = document.getElementById("activityLog");

function addLog(message) {
    const time = new Date().toLocaleTimeString();
    log.unshift(`${time} — ${message}`);
    localStorage.setItem("activityLog", JSON.stringify(log));
    renderLog();
}

function renderLog() {
    activityLog.innerHTML = "";
    log.forEach(item => {
        const li = document.createElement("li");
        li.textContent = item;
        activityLog.appendChild(li);
    });
}

function renderTasks() {
    taskList.innerHTML = "";

    let done = tasks.filter(t => t.done).length;

    tasks.forEach((task, index) => {
        const li = document.createElement("li");
        li.className = "task-item";
        li.draggable = true;

        li.innerHTML = `
            <span style="${task.done ? "text-decoration: line-through" : ""}">
                ${task.name}
            </span>

            <div>
                <button class="btn btn-success btn-sm" onclick="toggleTask(${index})">
                    <i class="fa fa-check"></i>
                </button>

                <button class="btn btn-danger btn-sm" onclick="deleteTask(${index})">
                    <i class="fa fa-trash"></i>
                </button>
            </div>
        `;

        // Drag + Drop
        li.addEventListener("dragstart", e => {
            e.dataTransfer.setData("taskIndex", index);
        });

        taskList.appendChild(li);
    });

    statTotal.textContent = tasks.length;
    statDone.textContent = done;
    statPending.textContent = tasks.length - done;

    localStorage.setItem("tasks", JSON.stringify(tasks));
    updateChart();
}

function toggleTask(index) {
    tasks[index].done = !tasks[index].done;
    addLog(`Task "${tasks[index].name}" marked as ${tasks[index].done ? "completed" : "pending"}`);
    renderTasks();
}

function deleteTask(index) {
    addLog(`Task "${tasks[index].name}" deleted`);
    tasks.splice(index, 1);
    renderTasks();
}

document.getElementById("saveTask").addEventListener("click", () => {
    const input = document.getElementById("taskInput");
    const name = input.value.trim();

    if (name === "") return;

    tasks.push({ name, done: false });
    addLog(`Task "${name}" added`);

    input.value = "";
    bootstrap.Modal.getInstance(document.getElementById("taskModal")).hide();

    renderTasks();
});

document.getElementById("addTaskBtn").addEventListener("click", () => {
    new bootstrap.Modal(document.getElementById("taskModal")).show();
});


/* ------------------ Search + Filter ------------------ */
document.getElementById("taskSearch").addEventListener("input", e => {
    const q = e.target.value.toLowerCase();

    Array.from(taskList.children).forEach(li => {
        li.style.display = li.innerText.toLowerCase().includes(q)
            ? "flex"
            : "none";
    });
});

document.getElementById("taskFilter").addEventListener("change", e => {
    const filter = e.target.value;

    Array.from(taskList.children).forEach((li, i) => {
        const t = tasks[i];
        if (filter === "all") li.style.display = "flex";
        else if (filter === "done" && t.done) li.style.display = "flex";
        else if (filter === "pending" && !t.done) li.style.display = "flex";
        else li.style.display = "none";
    });
});


/* ------------------ Drag Drop Reorder ------------------ */
taskList.addEventListener("dragover", e => e.preventDefault());

taskList.addEventListener("drop", e => {
    const oldIndex = e.dataTransfer.getData("taskIndex");
    const newIndex = [...taskList.children].indexOf(e.target.closest("li"));

    const moved = tasks.splice(oldIndex, 1)[0];
    tasks.splice(newIndex, 0, moved);

    addLog(`Tasks reordered`);

    renderTasks();
});


/* ------------------ Chart.js ------------------ */
let chart;

function updateChart() {
    const done = tasks.filter(t => t.done).length;
    const pending = tasks.length - done;

    const ctx = document.getElementById("taskChart");

    if (chart) chart.destroy();

    chart = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: ["Completed", "Pending"],
            datasets: [{
                data: [done, pending],
                backgroundColor: ["#28a745", "#dc3545"],
            }]
        }
    });
}

/* Init */
renderTasks();
renderLog();
