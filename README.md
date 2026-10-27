# Kanban Board

A lightweight Kanban board built with plain HTML, CSS, and JavaScript for managing tasks across three stages: To Do, In Progress, and Completed.

## Features

- Add, edit, and delete tasks
- Organize tasks by status using drag-and-drop
- Assign priority levels: Low, Medium, and High
- Add due dates and descriptions
- Search tasks by title
- Filter tasks by priority and status
- Persist tasks in the browser using `localStorage`

## Project structure

- `index.html` – page layout and task dialog
- `style.css` – visual styling and responsive layout
- `script.js` – task logic, filtering, drag-and-drop, and persistence

## Run locally

Because this is a static front-end project, you can open `index.html` directly in a browser.

To serve it locally instead:

```bash
cd d:\KanBan-Board-main
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Usage

1. Click the Add task button.
2. Enter a title, optional description, priority, due date, and status.
3. Save the task.
4. Drag cards between columns to update progress.
5. Use the search and filter controls to narrow the board view.

## Notes

- Tasks are stored in the browser's local storage, so they remain available after refreshes on the same browser.
- This project does not require any framework or build step.
