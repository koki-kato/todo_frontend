import React from 'react';
import { Todo } from '../types'; // Todo 型をインポート

interface TodoItemProps {
  todo: Todo;
  // handleTodo: <K extends keyof Todo, V extends Todo[K]>(id: number, key: K, value: V) => void; // handleTodo を追加
  updateTodo: (id: number, todo: Todo) => void; // 親コンポーネントに通知する関数を追加
  setTodos: (todos: Todo[]) => void; // 親のステート更新用の関数
  todos: Todo[]; // 親のステートを渡す
}

const TodoItem: React.FC<TodoItemProps> = ({ todo, updateTodo, setTodos, todos }) => {

  const handleTodoChange = <K extends keyof Todo, V extends Todo[K]>(
    id: number,
    key: K,
    value: V
  ) => {
    const updatedTodos = todos.map(todo =>
      todo.id === id ? { ...todo, [key]: value } : todo
    );

    setTodos(updatedTodos); // 親のステートを更新

    const updatedTodo = updatedTodos.find(todo => todo.id === id);
    if (updatedTodo) {
      updateTodo(id, updatedTodo); // 親コンポーネントから渡された関数でサーバー更新
    }
  };

  return (
    <li>
      <input
        type="checkbox"
        disabled={todo.delete_flg}
        checked={todo.completed_flg}
        onChange={() => handleTodoChange(todo.id, 'completed_flg', !todo.completed_flg)}
      />
      <input
        type="text"
        disabled={todo.completed_flg || todo.delete_flg}
        value={todo.content}
        onChange={(e) => handleTodoChange(todo.id, 'content', e.target.value)}
      />
      <button onClick={() => handleTodoChange(todo.id, 'delete_flg', !todo.delete_flg)}>
        {todo.delete_flg ? '復元' : '削除'}
      </button>
    </li>
  );
};

export default TodoItem;
