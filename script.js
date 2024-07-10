// State
let state = {
    todos: [],
    nextId: 1,
    editingTodoId: null
};

// Load data from local storage
function loadFromLocalStorage() {
    const savedState = localStorage.getItem('coveyTimeManagementState');
    if (savedState) {
        state = JSON.parse(savedState);
    } else {
        // If no saved state, initialize with an example todo
        state.todos.push({
            id: state.nextId++,
            text: "Example todo",
            type: "imp-urg",
            done: false,
            deadline: new Date(Date.now() + 86400000).toISOString()
        });
    }
}

// Save data to local storage
function saveToLocalStorage() {
    localStorage.setItem('coveyTimeManagementState', JSON.stringify(state));
}

// Actions
function addTodo(text, type, deadline) {
    state.todos.push({ id: state.nextId++, text, type, done: false, deadline });
    saveToLocalStorage();
    render();
}

function deleteTodo(id) {
    state.todos = state.todos.filter(todo => todo.id !== id);
    saveToLocalStorage();
    render();
}

function completeTodo(id) {
    const todo = state.todos.find(todo => todo.id === id);
    if (todo) todo.done = !todo.done;
    if (todo.done) {
        const count = 200,
            defaults = {
                origin: { y: 0.7 },
            };

        function fire(particleRatio, opts) {
            confetti(
                Object.assign({}, defaults, opts, {
                    particleCount: Math.floor(count * particleRatio),
                })
            );
        }

        fire(0.25, {
            spread: 26,
            startVelocity: 55,
        });

        fire(0.2, {
            spread: 60,
        });

        fire(0.35, {
            spread: 100,
            decay: 0.91,
            scalar: 0.8,
        });

        fire(0.1, {
            spread: 120,
            startVelocity: 25,
            decay: 0.92,
            scalar: 1.2,
        });

        fire(0.1, {
            spread: 120,
            startVelocity: 45,
        });
    }
    deleteTodo(id);
    saveToLocalStorage();
    render();
}

function moveTodo(id, newType) {
    const todo = state.todos.find(todo => todo.id === id);
    if (todo && todo.type !== newType) {
        todo.type = newType;
        saveToLocalStorage();
        render();
    }
}

function editTodo(id, newText, newType, newDeadline) {
    const todo = state.todos.find(todo => todo.id === id);
    if (todo) {
        todo.text = newText;
        todo.type = newType;
        todo.deadline = newDeadline;
    }
    saveToLocalStorage();
    render();
}

// Render function
function render() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="grid-container">
            <div class="imp-text font-lg">Important</div>
            <div class="nimp-text font-lg">Not Important</div>
            <div class="urg-text font-lg">Urgent</div>
            <div class="nurg-text font-lg">Not Urgent</div>
            ${renderQuadrant('imp-urg', 'Do First')}
            ${renderQuadrant('imp-nurg', 'Schedule')}
            ${renderQuadrant('nimp-urg', 'Delegate')}
            ${renderQuadrant('nimp-nurg', 'Don\'t Do')}
        </div>
    `;
    addEventListeners();
}

function renderQuadrant(type, title) {
    const todos = state.todos.filter(todo => todo.type === type);
    return `
        <div class="grid-items ${type}" data-type="${type}">
            <button class="add-button flex-center" data-type="${type}">+</button>
            <div class="grid-item-title">${title}</div>
            <div class="todo-container">
                ${todos.map(todo => renderTodoItem(todo)).join('')}
            </div>
        </div>
    `;
}

function renderTodoItem(todo) {
    const deadlineDate = todo.deadline ? new Date(todo.deadline) : null;
    const isOverdue = deadlineDate ? deadlineDate < new Date() && !todo.done : false;
    return `
        <div class="todo-item ${todo.done ? 'done' : ''} ${isOverdue ? 'overdue' : ''}" draggable="true" data-id="${todo.id}">
            <div class="todo-item-text">
                ${todo.text}
                <div class="todo-item-deadline">
                    Deadline: ${deadlineDate ?
            deadlineDate.toLocaleString() : "No deadline"}
                </div>
                <div class="todo-item-buttons">
                <button class="edit-button" data-id="${todo.id}">✎</button>
                <button class="done-button" data-id="${todo.id}">✓</button>
                <button class="delete-button" data-id="${todo.id}">X</button>
                </div>
            </div>
        </div>
    `;
}

// Event Listeners
function addEventListeners() {
    document.querySelectorAll('.add-button').forEach(button => {
        button.addEventListener('click', openAddDialog);
    });

    document.querySelectorAll('.todo-item').forEach(item => {
        item.addEventListener('dragstart', drag);
    });

    document.querySelectorAll('.grid-items').forEach(item => {
        item.addEventListener('dragover', allowDrop);
        item.addEventListener('drop', drop);
    });

    document.querySelectorAll('.delete-button').forEach(button => {
        button.addEventListener('click', (e) => deleteTodo(parseInt(e.target.dataset.id)));
    });

    document.querySelectorAll('.done-button').forEach(button => {
        button.addEventListener('click', (e) => completeTodo(parseInt(e.target.dataset.id)));
    });

    document.querySelectorAll('.edit-button').forEach(button => {
        button.addEventListener('click', (e) => openEditDialog(parseInt(e.target.dataset.id)));
    });
}

function openAddDialog(e) {
    const dialog = document.getElementById('todoDialog');
    const form = document.getElementById('todoForm');
    const todoType = document.getElementById('todoType');
    const dialogTitle = document.getElementById('dialogTitle');
    dialogTitle.textContent = 'Add Todo';
    form.reset();
    todoType.value = e.target.dataset.type;
    state.editingTodoId = null;
    dialog.showModal();
}

function openEditDialog(id) {
    const dialog = document.getElementById('todoDialog');
    const form = document.getElementById('todoForm');
    const todoText = document.getElementById('todoText');
    const todoType = document.getElementById('todoType');
    const todoDeadline = document.getElementById('todoDeadline');
    const dialogTitle = document.getElementById('dialogTitle');

    const todo = state.todos.find(todo => todo.id === id);
    if (todo) {
        dialogTitle.textContent = 'Edit Todo';
        todoText.value = todo.text;
        todoType.value = todo.type;
        todoDeadline.value = todo.deadline.slice(0, 16);
        state.editingTodoId = id;
        dialog.showModal();
    }
}

document.getElementById('todoForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const todoText = document.getElementById('todoText');
    const todoType = document.getElementById('todoType');
    const todoDeadline = document.getElementById('todoDeadline');

    if (state.editingTodoId === null) {
        addTodo(todoText.value, todoType.value, todoDeadline.value);
    } else {
        editTodo(state.editingTodoId, todoText.value, todoType.value, todoDeadline.value);
        state.editingTodoId = null;
    }

    document.getElementById('todoDialog').close();
});

document.getElementById('cancelButton').addEventListener('click', () => {
    document.getElementById('todoDialog').close();
});

function allowDrop(ev) {
    ev.preventDefault();
}

function drag(ev) {
    ev.dataTransfer.setData("text", ev.target.dataset.id);
}

function drop(ev) {
    ev.preventDefault();
    const todoId = parseInt(ev.dataTransfer.getData("text"));
    const newType = ev.target.closest('.grid-items').dataset.type;
    moveTodo(todoId, newType);
}

// Load data and initial render
loadFromLocalStorage();
render();