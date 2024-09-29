// src/api.tsx
import { Todo } from './types';

export const fetchTodos = async (): Promise<Todo[]> => {
  const response = await fetch("http://localhost:3001/api/v1/todos");
  return response.json();
};

export const createTodo = async (todo: Omit<Todo, 'id'>): Promise<Todo> => {
  const response = await fetch("http://localhost:3001/api/v1/todos", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(todo),
  });
  return response.json();
};

export const updateTodo = async (id: number, updatedTodo: Partial<Todo>): Promise<Todo> => {
  const response = await fetch(`http://localhost:3001/api/v1/todos/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updatedTodo),
  });
  return response.json();
};

export const deleteTodo = async (id: number): Promise<void> => {
  await fetch(`http://localhost:3001/api/v1/todos/${id}`, {
    method: "DELETE",
  });
};
