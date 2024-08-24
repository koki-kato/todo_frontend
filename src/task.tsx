import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { fetchTodos, createTodo, updateTodo, deleteTodo } from './api';
import { useParams, useNavigate } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import Modal from 'react-modal';

export interface Todo {
  content: string;
  readonly id: number;
  completed: boolean;
  delete_flg: boolean;
  sort: number;
  sub_content?: string;
  output_date: string;
  progress_rate: number; // progress_rate を追加
}

type Filter = 'all' | 'completed' | 'unchecked' | 'delete';

const Task: React.FC = () => {
  const { date } = useParams<{ date: string }>();
  const navigate = useNavigate();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [text, setText] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [selectedTodos, setSelectedTodos] = useState<number[]>([]);
  const [showSubContent, setShowSubContent] = useState<number | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  useEffect(() => {
    fetchTodos().then(data => setTodos(data)); // 全てのタスクを取得
  }, []);

  const handleSubmit = () => {
    if (!text) return;

    const newTodo: Omit<Todo, 'id'> = {
      content: text,
      completed: false,
      delete_flg: false,
      sort: todos.length + 1,
      output_date: date || '',
      sub_content: '',
      progress_rate: 0, // 初期値として0%を設定
    };
    
    createTodo(newTodo).then(data => {
      setTodos(prevTodos => [...prevTodos, data]);
      setText('');
    });
  };

  const handleCheckboxChange = (id: number) => {
    setSelectedTodos(prev =>
      prev.includes(id) ? prev.filter(todoId => todoId !== id) : [...prev, id]
    );
  };

  const handleDuplicateSelected = () => {
    if (selectedTodos.length === 0) return;
    setIsCalendarOpen(true);
};

const handleDateSelect = (selectedDate: string) => {
    const duplicatePromises = selectedTodos.map(id => {
        const todo = todos.find(todo => todo.id === id);
        if (todo) {
            const newTodo: Omit<Todo, 'id'> = {
                content: todo.content,
                completed: todo.completed,
                delete_flg: todo.delete_flg,
                sort: todo.sort + 1,
                output_date: selectedDate,
                sub_content: todo.sub_content,
                progress_rate: todo.progress_rate, 
            };
            return createTodo(newTodo);
        }
        return null;
    });

    Promise.all(duplicatePromises).then(() => {
        setIsCalendarOpen(false);
        setSelectedTodos([]);  // 複製が完了したら選択リストをクリア
    });
};

  const getFilteredTodos = () => {
    let filteredTodos = [];
    switch (filter) {
      case 'completed':
        filteredTodos = todos.filter(todo => todo.completed && !todo.delete_flg && todo.output_date === date);
        break;
      case 'unchecked':
        filteredTodos = todos.filter(todo => !todo.completed && !todo.delete_flg && todo.output_date === date);
        break;
      case 'delete':
        filteredTodos = todos.filter(todo => todo.delete_flg && todo.output_date === date);
        break;
      default:
        filteredTodos = todos.filter(todo => !todo.delete_flg && todo.output_date === date);
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

  const handleProgressChange = (id: number, newProgress: number) => {
    setTodos(prevTodos =>
      prevTodos.map(todo =>
        todo.id === id
          ? { ...todo, progress_rate: newProgress, completed: newProgress === 100 }
          : todo
      )
    );

    const updatedTodo = todos.find(todo => todo.id === id);
    if (updatedTodo) {
      updateTodo(id, { ...updatedTodo, progress_rate: newProgress, completed: newProgress === 100 });
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

  const handleBackToCalendar = () => {
    navigate('/');
  };

  // カレンダーに表示するイベントを作成
  const calendarEvents = todos.map(todo => ({
    title: todo.content,
    date: todo.output_date,
    delete_flg: todo.delete_flg,
    id: todo.id.toString(),
  }));

  const filteredCalendarEvents = calendarEvents.filter(event => !event.delete_flg);

  return (
    <div>
      <h1>{date && new Date(date).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}</h1>
      <button onClick={handleBackToCalendar}>カレンダーに戻る</button>
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
        <>
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
        </>
      )}
      <div className="actions-container">
        {filter !== 'delete' && (
          <button className="duplicate-button" onClick={handleDuplicateSelected}>
            一括複製
          </button>
        )}
      </div>
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
                    className="task-item"
                  >
                    <div className="input-container">
                      <span {...provided.dragHandleProps} className="drag-handle">⇅</span>
                      <select
                        value={todo.progress_rate || 0}
                        onChange={(e) => handleProgressChange(todo.id, Number(e.target.value))}
                        disabled={todo.delete_flg}
                        style={{ fontSize: '14px', width: '70px', marginRight: '10px' }} // セレクトボックスの幅を狭める
                      >
                        {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(rate => (
                          <option key={rate} value={rate}>{rate}%</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        disabled={todo.completed || todo.delete_flg}
                        value={todo.content}
                        onChange={(e) => handleTodo(todo.id, 'content', e.target.value)}
                        className="task-input"
                      />
                      <button className="delete-button" onClick={() => handleTodo(todo.id, 'delete_flg', !todo.delete_flg)}>
                        {todo.delete_flg ? '復元' : '削除'}
                      </button>
                      <button className="toggle-button" onClick={() => toggleSubContent(todo.id)}>
                        ⏬
                      </button>
                      <input
                        type="checkbox"
                        onChange={() => handleCheckboxChange(todo.id)}
                        style={{ marginRight: '10px' }}
                      />
                    </div>
                    {showSubContent === todo.id && (
                      <textarea
                        value={todo.sub_content || ''}
                        onChange={(e) => handleTodo(todo.id, 'sub_content', e.target.value)}
                        style={{ fontSize: '16px', width: '100%', height: '100px', marginTop: '10px' }} // 大きなテキストエリア
                      />
                    )}
                  </li>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </ul>
          )}
        </Droppable>
      </DragDropContext>
  
      {/* カレンダーモーダル */}
      <Modal
        isOpen={isCalendarOpen}
        onRequestClose={() => setIsCalendarOpen(false)}
        contentLabel="カレンダーを選択"
        ariaHideApp={false} // アクセシビリティのために追加
      >
        <h2>日付を選択してください</h2>
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={filteredCalendarEvents}  // 全タスクをイベントとして表示
          editable={true}
          selectable={true}
          dateClick={(arg) => handleDateSelect(arg.dateStr)}  // 日付を選択したときにタスクを複製
        />
        <button onClick={() => setIsCalendarOpen(false)}>キャンセル</button>
      </Modal>
    </div>
  );
};

export default Task;
