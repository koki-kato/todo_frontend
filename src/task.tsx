import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { fetchTodos, createTodo, updateTodo, deleteTodo } from './api';

export interface Todo {
  content: string;
  readonly id: number;
  completed: boolean;
  delete_flg: boolean;
  sort: number;
  sub_content?: string; // sub_contentを追加
}

type Filter = 'all' | 'completed' | 'unchecked' | 'delete';

const Task: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [text, setText] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [showSubContent, setShowSubContent] = useState<number | null>(null);

  useEffect(() => {
    fetchTodos().then(data => setTodos(data));
  }, []);

  const handleSubmit = () => {
    if (!text) return;

    const newTodo: Omit<Todo, 'id'> = {
      content: text,
      completed: false,
      delete_flg: false,
      sort: todos.length + 1,
      sub_content: '', // sub_contentを初期化
    };

    createTodo(newTodo).then(data => {
      setTodos(prevTodos => [...prevTodos, data]);
      setText('');
    });
  };

  const getFilteredTodos = () => {
    let filteredTodos = [];
    switch (filter) {
      case 'completed':
        filteredTodos = todos.filter(todo => todo.completed && !todo.delete_flg);
        break;
      case 'unchecked':
        filteredTodos = todos.filter(todo => !todo.completed && !todo.delete_flg);
        break;
      case 'delete':
        filteredTodos = todos.filter(todo => todo.delete_flg);
        break;
      default:
        filteredTodos = todos.filter(todo => !todo.delete_flg);
        break;
    }
    return filteredTodos.sort((a, b) => a.sort - b.sort);
  };

  const handleTodo = <K extends keyof Todo, V extends Todo[K]>(
    id: number,
    key: K,
    value: V
  ) => {
    const updatedTodos = todos.map(todo =>
      todo.id === id ? { ...todo, [key]: value } : todo
    );

    setTodos(updatedTodos);

    const todo = updatedTodos.find(todo => todo.id === id);
    if (todo) {
      updateTodo(id, todo);
    }
  };

  const handleFilterChange = (filter: Filter) => {
    setFilter(filter);
  };

  const handleEmpty = () => {
    const filteredTodos = todos.filter(todo => !todo.delete_flg);
    const deletePromises = todos
      .filter(todo => todo.delete_flg)
      .map(todo => deleteTodo(todo.id));

    Promise.all(deletePromises).then(() => {
      setTodos(filteredTodos.map((todo, index) => ({ ...todo, sort: index + 1 })));
      filteredTodos.forEach((todo, index) => updateTodo(todo.id, { ...todo, sort: index + 1 }));
    });
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const filteredTodos = getFilteredTodos();
    const [movedTodo] = filteredTodos.splice(result.source.index, 1);
    filteredTodos.splice(result.destination.index, 0, movedTodo);

    filteredTodos.forEach((todo, index) => {
      todo.sort = index + 1;
      updateTodo(todo.id, todo);
    });

    setTodos(prevTodos => prevTodos.map(todo => filteredTodos.find(ft => ft.id === todo.id) || todo));
  };

  const toggleSubContent = (id: number) => {
    setShowSubContent(prevId => (prevId === id ? null : id));
  };

  return (
    <div>
      <select
        defaultValue="all"
        onChange={(e) => handleFilterChange(e.target.value as Filter)}
      >
        <option value="all">すべてのタスク</option>
        <option value="completed">完了したタスク</option>
        <option value="unchecked">現在のタスク</option>
        <option value="delete">ごみ箱</option>
      </select>
      {filter === 'delete' ? (
        <button onClick={handleEmpty}>ごみ箱を空にする</button>
      ) : (
        filter !== 'completed' && (
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
        )
      )}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="todos">
          {(provided) => (
            <ul
              {...provided.droppableProps}
              ref={provided.innerRef}
            >
              {getFilteredTodos().map((todo, index) => (
                <Draggable key={todo.id} draggableId={todo.id.toString()} index={index}>
                  {(provided) => (
                    <li
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                    >
                      <input
                        type="checkbox"
                        disabled={todo.delete_flg}
                        checked={todo.completed}
                        onChange={() => handleTodo(todo.id, 'completed', !todo.completed)}
                      />
                      <input
                        type="text"
                        disabled={todo.completed || todo.delete_flg}
                        value={todo.content}
                        onChange={(e) => handleTodo(todo.id, 'content', e.target.value)}
                      />
                      {showSubContent === todo.id && (
                        <textarea
                          value={todo.sub_content || ''}
                          onChange={(e) => handleTodo(todo.id, 'sub_content', e.target.value)}
                          style={{ width: '100%', height: '100px', marginTop: '10px' }} // 大きなテキストエリア
                        />
                      )}
                      <button onClick={() => handleTodo(todo.id, 'delete_flg', !todo.delete_flg)}>
                        {todo.delete_flg ? '復元' : '削除'}
                      </button>
                      <button 
                        onClick={() => toggleSubContent(todo.id)}
                        style={{ color: 'blue' }}
                      >
                        ↓
                      </button>
                    </li>
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

export default Task;
