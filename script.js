if (window.MobileDragDrop) {
  window.MobileDragDrop.polyfill({ holdToDrag: 100 });
  window.addEventListener("touchmove", function () {}, { passive: false });
}

const taskLists = {
  todo: document.querySelector("#todo"),
  progress: document.querySelector("#progress"),
  done: document.querySelector("#done"),
};
const taskDialog = document.querySelector("#task-dialog");
const taskForm = document.querySelector("#task-form");
const searchInput = document.querySelector("#search-input");
const priorityFilter = document.querySelector("#priority-filter");
const statusFilter = document.querySelector("#status-filter");
const formError = document.querySelector("#form-error");
const validStatuses = ["todo", "progress", "done"];
const validPriorities = ["low", "medium", "high"];
let draggedTaskId = null;
let editingTaskId = null;

const storedTasks = JSON.parse(localStorage.getItem("tasks") || "[]");
if (!Array.isArray(storedTasks)) {
  throw new Error('Invalid task data in LocalStorage key "tasks".');
}
let tasks = storedTasks.map((task, index) => ({
  ...task,
  id: String(task.id || `legacy-${index}-${Date.now()}`),
  title: String(task.title || ""),
  description: String(task.description || ""),
  priority: validPriorities.includes(task.priority) ? task.priority : "medium",
  dueDate: typeof task.dueDate === "string" ? task.dueDate : "",
  status: validStatuses.includes(task.status) ? task.status : "todo",
  createdAt: task.createdAt || new Date().toISOString(),
}));

function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function formatDate(dateString) {
  if (!dateString) return "";
  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function updateCounts() {
  document.querySelector("#todo-count").textContent = tasks.filter(
    (task) => task.status === "todo",
  ).length;
  document.querySelector("#progress-count").textContent = tasks.filter(
    (task) => task.status === "progress",
  ).length;
  document.querySelector("#done-count").textContent = tasks.filter(
    (task) => task.status === "done",
  ).length;
}

function createTextElement(tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  element.textContent = text;
  return element;
}

function makeActionButton(label, iconClass, className) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.setAttribute("aria-label", label);
  const icon = document.createElement("i");
  icon.className = iconClass;
  icon.setAttribute("aria-hidden", "true");
  button.append(icon);
  return button;
}

function taskMatchesFilters(task) {
  const query = searchInput.value.trim().toLocaleLowerCase();
  return (
    (!query || task.title.toLocaleLowerCase().includes(query)) &&
    (priorityFilter.value === "all" ||
      task.priority === priorityFilter.value) &&
    (statusFilter.value === "all" || task.status === statusFilter.value)
  );
}

function createTaskCard(task) {
  const card = document.createElement("article");
  card.className = "task";
  card.draggable = true;
  card.dataset.id = task.id;

  const heading = createTextElement("h3", "task-title", task.title);
  const actions = document.createElement("div");
  actions.className = "task-actions";
  const editButton = makeActionButton(
    "Edit task",
    "fa-solid fa-pen",
    "edit-btn",
  );
  const deleteButton = makeActionButton(
    "Delete task",
    "fa-solid fa-trash",
    "delete-btn",
  );
  actions.append(editButton, deleteButton);
  card.append(heading, actions);

  if (task.description) {
    card.append(createTextElement("p", "task-description", task.description));
  }

  const badges = document.createElement("div");
  badges.className = "task-meta";
  badges.append(
    createTextElement(
      "span",
      `priority-badge priority-${task.priority}`,
      `${task.priority} priority`,
    ),
  );
  if (task.dueDate) {
    badges.append(
      createTextElement(
        "span",
        "due-date",
        `Due ${formatDate(task.dueDate) || task.dueDate}`,
      ),
    );
  }
  card.append(badges);

  const createdAt = task.createdAt ? new Date(task.createdAt) : null;
  if (createdAt && !Number.isNaN(createdAt.getTime())) {
    card.append(
      createTextElement(
        "span",
        "time",
        `Added ${createdAt.toLocaleDateString()}`,
      ),
    );
  }

  editButton.addEventListener("click", () => openTaskDialog(task));
  deleteButton.addEventListener("click", () => {
    tasks = tasks.filter((item) => item.id !== task.id);
    saveTasks();
    renderTasks();
  });
  card.addEventListener("dragstart", (event) => {
    draggedTaskId = task.id;
    event.dataTransfer?.setData("text/plain", task.id);
    if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
    requestAnimationFrame(() => card.classList.add("is-dragging"));
  });
  card.addEventListener("dragend", () => {
    draggedTaskId = null;
    card.classList.remove("is-dragging");
    document
      .querySelectorAll(".column.hover-over")
      .forEach((column) => column.classList.remove("hover-over"));
  });
  return card;
}

function renderTasks() {
  const visibleTasks = tasks.filter(taskMatchesFilters);
  const filtersActive =
    searchInput.value.trim() !== "" ||
    priorityFilter.value !== "all" ||
    statusFilter.value !== "all";

  for (const [status, list] of Object.entries(taskLists)) {
    list.replaceChildren();
    const columnTasks = visibleTasks.filter((task) => task.status === status);
    if (columnTasks.length) {
      columnTasks.forEach((task) => list.append(createTaskCard(task)));
      continue;
    }

    const emptyMessage =
      filtersActive && tasks.length
        ? "No tasks match the current filters."
        : statusFilter.value !== "all" && statusFilter.value !== status
          ? "Tasks in this column are hidden by the status filter."
          : "No tasks here yet. Add one to get started.";
    list.append(createTextElement("p", "empty-state", emptyMessage));
  }
  updateCounts();
}

function openTaskDialog(task = null, defaultStatus = "todo") {
  editingTaskId = task?.id || null;
  document.querySelector("#dialog-title").textContent = task
    ? "Edit task"
    : "Add task";
  taskForm.elements.title.value = task?.title || "";
  taskForm.elements.description.value = task?.description || "";
  taskForm.elements.priority.value = task?.priority || "medium";
  taskForm.elements.dueDate.value = task?.dueDate || "";
  taskForm.elements.status.value = task?.status || defaultStatus;
  formError.textContent = "";
  taskDialog.showModal();
  taskForm.elements.title.focus();
}

document.querySelector("#new-task-btn").addEventListener("click", () => {
  openTaskDialog(
    null,
    statusFilter.value === "all" ? "todo" : statusFilter.value,
  );
});
document
  .querySelector("#close-dialog")
  .addEventListener("click", () => taskDialog.close());
document
  .querySelector("#cancel-dialog")
  .addEventListener("click", () => taskDialog.close());
taskDialog.addEventListener("click", (event) => {
  if (event.target === taskDialog) taskDialog.close();
});

taskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const title = taskForm.elements.title.value.trim();
  if (!title) {
    formError.textContent = "Enter a task title before saving.";
    taskForm.elements.title.focus();
    return;
  }

  const taskData = {
    title,
    description: taskForm.elements.description.value.trim(),
    priority: taskForm.elements.priority.value,
    dueDate: taskForm.elements.dueDate.value,
    status: taskForm.elements.status.value,
  };
  if (
    !validPriorities.includes(taskData.priority) ||
    !validStatuses.includes(taskData.status)
  ) {
    formError.textContent = "Choose a valid priority and status.";
    return;
  }

  if (editingTaskId) {
    tasks = tasks.map((task) =>
      task.id === editingTaskId ? { ...task, ...taskData } : task,
    );
  } else {
    tasks.push({
      id:
        globalThis.crypto?.randomUUID?.() ||
        `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      ...taskData,
      createdAt: new Date().toISOString(),
    });
  }
  saveTasks();
  taskDialog.close();
  renderTasks();
});

for (const filter of [searchInput, priorityFilter, statusFilter]) {
  filter.addEventListener("input", renderTasks);
  filter.addEventListener("change", renderTasks);
}

function setupDropTarget(list) {
  const column = list.closest(".column");
  column.addEventListener("dragenter", (event) => {
    event.preventDefault();
    column.classList.add("hover-over");
  });
  column.addEventListener("dragleave", (event) => {
    if (!column.contains(event.relatedTarget))
      column.classList.remove("hover-over");
  });
  column.addEventListener("dragover", (event) => event.preventDefault());
  column.addEventListener("drop", (event) => {
    event.preventDefault();
    column.classList.remove("hover-over");
    const taskId = draggedTaskId || event.dataTransfer?.getData("text/plain");
    const status = list.dataset.status;
    if (!taskId || !validStatuses.includes(status)) return;
    tasks = tasks.map((task) =>
      task.id === taskId ? { ...task, status } : task,
    );
    draggedTaskId = null;
    saveTasks();
    renderTasks();
  });
}

Object.values(taskLists).forEach(setupDropTarget);
renderTasks();
