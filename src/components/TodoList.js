import React, { useState } from 'react';
import TodoItem from './TodoItem';

function TodoList() {
  const [tasks, setTasks] = useState([
    { id: 1, text: 'Doctor Appointment', completed: true },
    { id: 2, text: 'Meeting at School', completed: false }
  ]);

  const [text, setText] = useState('');

  function addTask(text) {
    const newTask = { id: Date.now(), text, completed: false };
    setTasks([...tasks, newTask]);
    setText('');
  }

  function deleteTask(id) {
    setTasks(tasks.filter(task => task.id !== id));
  }

  function toggleCompleted(id) {
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  }

  return (
    <div className="todo-list">
      <h2>Todo List</h2>
      {tasks.map(task => (
        <TodoItem
          key={task.id}
          task={task}
          deleteTask={deleteTask}
          toggleCompleted={toggleCompleted}
        />
      ))}
      <div className="todo-add">
        <span className="todo-add-icon">+</span>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && text.trim() && addTask(text)}
          placeholder="Add a new task..."
        />
        <button onClick={() => text.trim() && addTask(text)}>Add Item</button>
      </div>
    </div>
  );
}

export default TodoList;
