let allTasks = [];
let currentPageNumber = 1;
const itemsPerPage = 5;
const visiblePageLimit = 7;
let startVisiblePage = 0;
let endVisiblePage = visiblePageLimit - 1;

document.addEventListener('DOMContentLoaded', async () => {
  await loadTasks();
  renderPagination();
  displayPage(currentPageNumber);
  renderTaskCount();
});

async function loadTasks() {
  const response = await fetch('https://dummyjson.com/todos');
  const { todos } = await response.json();
  const storedTasks = JSON.parse(localStorage.getItem('tasks')) || todos;
  allTasks = storedTasks;
  if (!localStorage.getItem('tasks')) {
    localStorage.setItem('tasks', JSON.stringify(storedTasks));
  }
}

function renderTaskCount() {
  const total = JSON.parse(localStorage.getItem('tasks')).length;
  document.querySelector('tfoot').innerHTML = `
    <tr><td colspan="5">Total Tasks ${total}</td></tr>
  `;
}

async function createTask() {
  const input = document.getElementById('task');
  const taskText = input.value.trim();
  if (!taskText) return alert('Please enter a task');
  
  const newTask = {
    id: allTasks.length + 1,
    todo: taskText,
    userId: 1,
    completed: false
  };

  await fetch('https://dummyjson.com/todos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newTask)
  });

  allTasks.push(newTask);
  localStorage.setItem('tasks', JSON.stringify(allTasks));
  input.value = '';
  renderPagination();
  renderTaskCount();
  displayPage();
  closeModal();
}

function displayPage(pageNum = 1) {
  currentPageNumber = pageNum;
  const tasks = JSON.parse(localStorage.getItem('tasks'));
  const pageButtons = document.querySelectorAll('ul li');

  if (!pageButtons.length) {
    document.querySelector('tbody').innerHTML = `<tr><td colspan="5">No Tasks Found</td></tr>`;
    return;
  }

  pageButtons.forEach(li => li.classList.remove('selected'));
  [...pageButtons].find(li => li.textContent == pageNum)?.classList.add('selected');

  const totalPages = Math.ceil(tasks.length / itemsPerPage);
  document.getElementById('pre-arrow').disabled = pageNum === 1;
  document.getElementById('next-arrow').disabled = pageNum === totalPages;

  const start = (pageNum - 1) * itemsPerPage;
  const currentTasks = tasks.slice(start, start + itemsPerPage);
  
  const tbody = document.querySelector('tbody');
  tbody.innerHTML = '';
  currentTasks.forEach(task => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${task.id}</td>
      <td>${task.todo}</td>
      <td>${task.userId}</td>
      <td><span class="badge ${task.completed ? 'badge-complete' : 'badge-pend'}">${task.completed ? 'Completed' : 'Pending'}</span></td>
      <td class="actions-lg">
        <button class="btn btn-delete" onclick="removeTask(${task.id})"><i class="fas fa-trash"></i></button>
        <button class="btn btn-done" ${task.completed ? 'disabled' : ''} onclick="markTaskAsDone(${task.id})"><i class="fas fa-check"></i></button>
      </td>
      <td class="actions-sm">
        <select onchange="handleDropdownAction(event, ${task.id})">
          <option value="">Select</option>
          <option value="delete">Delete</option>
          <option value="done" ${task.completed ? 'disabled' : ''}>Done</option>
        </select>
      </td>
    `;
    tbody.appendChild(row);
  });
}

function renderPagination() {
  const list = document.querySelector('ul');
  list.innerHTML = '';
  const totalPages = Math.ceil(JSON.parse(localStorage.getItem('tasks')).length / itemsPerPage);

  for (let i = 1; i <= totalPages; i++) {
    const li = document.createElement('li');
    li.innerHTML = `<a href="#" onclick="displayPage(${i})">${i}</a>`;
    list.appendChild(li);
  }
  updateVisiblePages();
}

function updateVisiblePages() {
  const listItems = document.querySelectorAll('ul li');
  listItems.forEach((li, i) => {
    li.style.display = i >= startVisiblePage && i <= endVisiblePage ? 'inline-block' : 'none';
  });
}

function nextPage() {
  const total = Math.ceil(allTasks.length / itemsPerPage);
  if (currentPageNumber < total) {
    currentPageNumber++;
    displayPage(currentPageNumber);
    if (currentPageNumber > endVisiblePage + 1) {
      startVisiblePage++;
      endVisiblePage++;
      updateVisiblePages();
    }
  }
}

function prevPage() {
  if (currentPageNumber > 1) {
    currentPageNumber--;
    displayPage(currentPageNumber);
    if (currentPageNumber < startVisiblePage + 1) {
      startVisiblePage--;
      endVisiblePage--;
      updateVisiblePages();
    }
  }
}

async function removeTask(id) {
  allTasks = allTasks.filter(task => task.id !== id);
  localStorage.setItem('tasks', JSON.stringify(allTasks));
  await fetch(`https://dummyjson.com/todos/${id}`, { method: 'DELETE' });
  await loadTasks();
  renderPagination();
  renderTaskCount();
  displayPage();
}

async function markTaskAsDone(id) {
  const tasks = allTasks.map(task =>
    task.id === id ? { ...task, completed: true } : task
  );
  allTasks = tasks;
  localStorage.setItem('tasks', JSON.stringify(allTasks));
  await loadTasks();
  displayPage(currentPageNumber);
}

function searchTasks() {
  const searchValue = document.getElementById('search')?.value?.toLowerCase();
  if (!searchValue) {
    localStorage.setItem('tasks', JSON.stringify(allTasks));
  } else {
    const filtered = allTasks.filter(task =>
      task.todo.toLowerCase().includes(searchValue)
    );
    localStorage.setItem('tasks', JSON.stringify(filtered));
  }
  renderPagination();
  renderTaskCount();
  displayPage();
}

function openModal() {
  document.getElementById('modal').style.display = 'block';
}

function closeModal() {
  document.getElementById('modal').style.display = 'none';
}

function handleDropdownAction(event, taskId) {
  const action = event.target.value;
  if (action === 'delete') removeTask(taskId);
  else if (action === 'done') markTaskAsDone(taskId);
}
