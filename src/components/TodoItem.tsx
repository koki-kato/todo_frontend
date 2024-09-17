import React from 'react';
import { Todo } from '../types'; // Todo 型をインポート
import { DraggableProvided, DraggableStateSnapshot } from 'react-beautiful-dnd';

interface TodoItemProps {
  todo: Todo;
  index: number; // ドラッグアンドドロップのために必要なインデックス
  updateTodo: (id: number, todo: Todo) => void; // 親コンポーネントに通知する関数
  setTodos: (todos: Todo[]) => void; // 親のステート更新用の関数
  todos: Todo[]; // 親のステートを渡す
  provided: DraggableProvided; // ドラッグ用に提供されたプロパティ
  snapshot: DraggableStateSnapshot; // ドラッグの状態情報
}

const TodoItem: React.FC<TodoItemProps> = ({
  todo,
  updateTodo,
  setTodos,
  todos,
  provided,
  snapshot
}) => {
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
    <li
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      style={{
        ...provided.draggableProps.style,
        backgroundColor: snapshot.isDragging ? 'lightgreen' : 'white',
      }}
    >
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
