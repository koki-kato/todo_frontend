import React, { useState, useEffect } from 'react';
import { fetchTodos, createTodo, updateTodo, deleteTodo } from './api';
import TodoItem from './components/TodoItem'; // 相対パスを正しく設定
import type { Todo } from './types'; // type-only import で型をインポート


// import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
// import localforage from 'localforage';


type Filter = 'all' | 'completed' | 'unchecked' | 'delete'; // <-- 追加

// Todo コンポーネントの定義
const Todo: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]); // Todoの配列を保持するステート
  const [text, setText] = useState(''); // フォーム入力のためのステート
  const [nextId, setNextId] = useState(1); // 次のTodoのIDを保持するステート
  // 追加
  const [filter, setFilter] = useState<Filter>('all');

  const handleFilterChange = (filter: Filter) => {
    setFilter(filter);
  };

    // 追加
  // コンポーネントマウント時にRails APIからデータを取得
  useEffect(() => {
    fetchTodos().then(data => setTodos(data)); // 全てのタスクを取得
  }, []);

   // フィルタリングされたタスクリストを取得する関数
 const getFilteredTodos = () => {
  switch (filter) {
    case 'completed':
      // 完了済み **かつ** 削除されていないタスクを返す
      return todos.filter((todo) => todo.completed_flg && !todo.delete_flg);
    case 'unchecked':
      // 未完了 **かつ** 削除されていないタスクを返す
      return todos.filter((todo) => !todo.completed_flg && !todo.delete_flg);
    case 'delete':
      // 削除されたタスクを返す
      return todos.filter((todo) => todo.delete_flg);
    default:
      // 削除されていないすべてのタスクを返す
      return todos.filter((todo) => !todo.delete_flg);
  }
};

  // 新しいTodoを作成する関数
  const handleSubmit = () => {
    if (!text) return;
  
    const newTodo: Omit<Todo, 'id'> = {
      content: text,
      completed_flg: false,
      delete_flg: false,
    };
  
    createTodo(newTodo).then(data => {
      setTodos((prevTodos) => [data, ...prevTodos]);
      setNextId(nextId + 1); // 次のTodoIDをインクリメント
      setText(''); // フォームの入力をクリア
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

  // 特定のTodoのプロパティを更新する関数
  // const handleTodo = <K extends keyof Todo, V extends Todo[K]>(
  //   id: number,
  //   key: K,
  //   value: V
  // ) => {
  //   const updatedTodos = todos.map(todo =>
  //     todo.id === id ? { ...todo, [key]: value } : todo
  //   );

  //   setTodos(updatedTodos);

  //   const todo = updatedTodos.find(todo => todo.id === id);
  //   if (todo) {
  //     updateTodo(id, todo);
  //   }
  // };

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
      {/* フィルターが `delete` のときは「ごみ箱を空にする」ボタンを表示 */}
      {filter === 'delete' ? (
        <button onClick={handleEmpty}>
          ごみ箱を空にする
        </button>
      ) : (
        // フィルターが `completed` でなければ Todo 入力フォームを表示
        filter !== 'completed' && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
          >
            <input
              type="text"
              value={text} // フォームの入力値をステートにバインド
              onChange={(e) => setText(e.target.value)} // 入力値が変わった時にステートを更新
            />
            <button type="submit">追加</button>
          </form>
        )
      )}
      <ul>
        {getFilteredTodos().map((todo) => (
          <TodoItem
            key={todo.id}
            todo={todo}
            updateTodo={updateTodo} // サーバー更新用
            setTodos={setTodos} // ステート更新用
            todos={todos} // ステートを渡す
          />
        ))}
      </ul>
    </div>
  );
};


export default Todo;