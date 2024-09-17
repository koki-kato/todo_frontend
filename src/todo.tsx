import React, { useState, useEffect } from 'react';
import { fetchTodos, createTodo, updateTodo, deleteTodo } from './api';
import TodoItem from './components/TodoItem'; // 相対パスを正しく設定
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd'; // DnD用に追加
import type { Todo } from './types'; // type-only import で型をインポート


type Filter = 'all' | 'completed' | 'unchecked' | 'delete'; // <-- 追加

// Todo コンポーネントの定義
const Todo: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]); // Todoの配列を保持するステート
  const [text, setText] = useState(''); // フォーム入力のためのステート
  const [filter, setFilter] = useState<Filter>('all');

  const handleFilterChange = (filter: Filter) => {
    setFilter(filter);
  };

  // 現在の最大sort値を計算する関数
  const getMaxSortValue = () => {
    return todos.length > 0 ? Math.max(...todos.map(todo => todo.sort)) : 0;
  };

  // コンポーネントマウント時にRails APIからデータを取得
  useEffect(() => {
    fetchTodos().then(data => setTodos(data)); // 全てのタスクを取得
  }, []);

  // フィルタリングされたタスクリストを取得する関数
  const getFilteredTodos = () => {
    switch (filter) {
      case 'completed':
        return todos.filter((todo) => todo.completed_flg && !todo.delete_flg);
      case 'unchecked':
        return todos.filter((todo) => !todo.completed_flg && !todo.delete_flg);
      case 'delete':
        return todos.filter((todo) => todo.delete_flg);
      default:
        return todos.filter((todo) => !todo.delete_flg);
    }
  };

  // 新しいTodoを作成する関数
  const handleSubmit = () => {
    if (!text) return;

    // 新しいTodoのsortは現在の最大値+1にする
    const newTodo: Omit<Todo, 'id'> = {
      content: text,
      completed_flg: false,
      delete_flg: false,
      sort: getMaxSortValue() + 1,
    };

    createTodo(newTodo).then(data => {
      setTodos((prevTodos) => [...prevTodos, data]); // 1番下に追加
      setText(''); // フォームの入力をクリア
    });
  };

  // ドラッグが終了したときに呼び出される関数
  const handleDragEnd = (result: DropResult) => {
    console.log(result);
    if (!result.destination) {
      return;
    }

    const newTodos = Array.from(todos);
    const [movedTodo] = newTodos.splice(result.source.index, 1);
    newTodos.splice(result.destination.index, 0, movedTodo);
  
    // 並び替え後のUIを即時更新
    setTodos(newTodos);
    console.log("並べ替え後のTodos:", newTodos);
  
    // サーバー側に並び替え結果を非同期で送信
    newTodos.forEach((todo, index) => {
      todo.sort = index + 1;
      updateTodo(todo.id, todo).catch((error) => {
        console.error(`Todo ${todo.id} の更新に失敗しました:`, error);
      });
    });
  };

  // 物理的に削除する関数
  const handleEmpty = () => {
    const filteredTodos = todos.filter(todo => !todo.delete_flg);
    const deletePromises = todos
      .filter(todo => todo.delete_flg)
      .map(todo => deleteTodo(todo.id));

    Promise.all(deletePromises).then(() => setTodos(filteredTodos));
  };

  return (
    <div className="todo-container">
      <select
        defaultValue="all"
        onChange={(e) => handleFilterChange(e.target.value as Filter)}
      >
        <option value="all">すべてのタスク</option>
        <option value="completed">完了したタスク</option>
        <option value="unchecked">現在のタスク</option>
        <option value="delete">ごみ箱</option>
      </select>
  
      {filter === 'delete' && (
        <button onClick={handleEmpty}>ごみ箱を空にする</button>
      )}
      {filter !== 'completed' && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button type="submit">追加</button>
        </form>
      )}
  
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="todos">
          {(provided) => (
            <ul {...provided.droppableProps} ref={provided.innerRef}>
              {getFilteredTodos().map((todo, index) => (
                <Draggable
                  key={todo.id}
                  draggableId={String(todo.id)}
                  index={index}
                >
                  {(provided, snapshot) => (
                    <TodoItem
                      todo={todo}
                      updateTodo={updateTodo}
                      setTodos={setTodos}
                      todos={todos}
                      index={index}
                      provided={provided}
                      snapshot={snapshot}
                    />
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </ul>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
};

export default Todo;
