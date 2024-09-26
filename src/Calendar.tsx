import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { fetchTodos, updateTodo } from './api';
import { Todo } from './task';
import { useNavigate } from 'react-router-dom';
import jaLocale from '@fullcalendar/core/locales/ja'; // 日本語ローカルをインポート

const Calendar: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [clickCount, setClickCount] = useState<number>(0); // クリック回数を管理
  const [clickedDate, setClickedDate] = useState<string | null>(null); // クリックされた日付を状態として管理
  const navigate = useNavigate();

  useEffect(() => {
    fetchTodos().then(data => setTodos(data));
  }, []);

  // ダブルクリックの判定を管理するuseEffect
  useEffect(() => {
    if (clickCount === 1) {
      const timer = setTimeout(() => {
        setClickCount(0); // シングルクリックの場合はカウントをリセット
      }, 500); // ダブルクリックの判定時間

      return () => clearTimeout(timer); // クリーンアップ
    }
    if (clickCount === 2 && clickedDate) { // clickedDateがセットされているか確認
      setClickCount(0); // ダブルクリックでカウントをリセット
      // navigateを行う
      navigate(`/todos/${clickedDate}`);
    }
  }, [clickCount, clickedDate, navigate]); // clickedDateを依存リストに追加

  const handleDateClick = (arg: any) => {
    setClickedDate(arg.dateStr); // クリックされた日付を状態として保存
    setClickCount(prevCount => prevCount + 1);
  };

  const calendarEvents = todos
    .filter(todo => !todo.delete_flg)
    .map(todo => ({
      title: todo.content,
      date: todo.output_date,
      id: todo.id.toString(),
      completed: todo.completed, // 完了フラグを保持
    }));

  const handleEventDrop = (info: any) => {
    const updatedTodo = todos.find(todo => todo.id.toString() === info.event.id);
    if (updatedTodo) {
      const updatedTodos = todos.map(todo =>
        todo.id === updatedTodo.id ? { ...todo } : todo
      );

      const sortedTodos = updatedTodos.map((todo, index) => ({ ...todo, sort: index + 1 }));

      sortedTodos.forEach(todo => {
        updateTodo(todo.id, { sort: todo.sort });
      });

      setTodos(sortedTodos);
    }
  };


  const handleEventClick = (arg: any) => {
    arg.jsEvent.stopPropagation();
  };

  const renderEventContent = (eventInfo: any) => {
    const circleColor = eventInfo.event.extendedProps.completed ? '#0B8043' : '#0000FF';
    return (
      <div style={{ outline: 'none' }}>
        <span style={{ color: circleColor }}>●</span> {eventInfo.event.title}
      </div>
    );
  };

  return (
    <FullCalendar
      plugins={[dayGridPlugin, interactionPlugin]}
      initialView="dayGridMonth"
      events={calendarEvents}
      dateClick={handleDateClick}
      editable={true}
      eventDrop={handleEventDrop}
      eventClick={handleEventClick}
      eventContent={renderEventContent}
      selectable={true}
      locale={jaLocale}
    />
  );
};

export default Calendar;
