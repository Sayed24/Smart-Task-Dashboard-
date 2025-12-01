// Dark Mode Toggle
const themeToggle = document.getElementById("themeToggle");
themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");
});

// Task System
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

const taskList = document.getElementById("taskList");
const statTotal = document.getElementById("statTotal");
const statDone = document.getElementById("statDone");
const statPending = document.getElementById("statPending");

function renderTasks() {
    taskList.innerHTML = "";
    let done = 0;

    tasks.forEach((task, index) => {
        if (task.done) done++;

        const li = document.createElement("li");
        li.className = "task-item";

        li.innerHTML = `
            <span style="${task.done ? 'text-decoration: line-through' : ''}">
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

        taskList.appendChild(li);
    });

    statTotal.innerText = tasks.length;
    statDone.innerText = done;
    statPending.innerText = tasks.length - done;

    localStorage.setItem("tasks", JSON.stringify(tasks));
    updateChart();
}

// Toggle task
function toggleTask(index) {
    tasks[index].done = !tasks[index].done;
    renderTasks();
}

// Delete task
function deleteTask(index) {
    tasks.splice(index, 1);
    renderTasks();
}

// Add Task (Modal)
document.getElementById("addTaskBtn").addEventListener("click", () => {
    new bootstrap.Modal(document.getElementById("taskModal")).show();
});

document.getElementById("saveTask").addEventListener("click", () => {
    const taskName = document.getElementById("taskInput").value;

    if (taskName.trim() === "") return;

    tasks.push({ name: taskName, done: false });
    document.getElementById("taskInput").value = "";

    document.querySelector(".modal.show .btn-close")?.click();

    renderTasks();
});

// Chart.js
let chart;

function updateChart() {
    const ctx = document.getElementById("taskChart");

    if (chart) chart.destroy();

    chart = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: ["Completed", "Pending"],
            datasets: [{
                data: [
                    tasks.filter(x => x.done).length,
                    tasks.filter(x => !x.done).length
                ]
            }]
        }
    });
}

// Initial load
renderTasks();
