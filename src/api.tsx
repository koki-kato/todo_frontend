// src/api.tsx
import { Todo } from './types';
import { API_BASE_URL } from './config'; // API_BASE_URLをインポート

export const fetchTodos = async (date?: string): Promise<Todo[]> => {
  const url = date
    ? `${API_BASE_URL}/api/v1/todos?output_date=${date}`
    : `${API_BASE_URL}/api/v1/todos`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch todos');
  }
  return response.json();
};

export const createTodo = async (todo: Omit<Todo, 'id'>): Promise<Todo> => {
  const response = await fetch(`${API_BASE_URL}/api/v1/todos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(todo),
  });
  return response.json();
};

export const updateTodo = async (id: number, updates: Partial<Todo>) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/todos/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    if (!response.ok) {
      throw new Error('Todo更新に失敗しました');
    }
    return await response.json();
  } catch (error) {
    console.error('Todo更新エラー:', error);
    throw error;
  }
};

export const deleteTodo = async (id: number): Promise<void> => {
  await fetch(`${API_BASE_URL}/api/v1/todos/${id}`, {
    method: "DELETE",
  });
};

export const uploadImage = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(`${API_BASE_URL}/api/v1/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error('画像のアップロードに失敗しました');
  }

  const data = await response.json();
  console.log('Upload response:', data); // ここで画像URLが正しいか確認
  return data.url; // 画像URLを返す
};
