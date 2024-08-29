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
  const navigate = useNavigate();

  useEffect(() => {
    fetchTodos().then(data => setTodos(data));
  }, []);

  const handleDateClick = (arg: any) => {
    setClickCount(prevCount => prevCount + 1);

    if (clickCount === 1) {
      setTimeout(() => {
        setClickCount(0); // シングルクリックの場合はカウントをリセット
      }, 500); // ダブルクリックの判定時間（300ms以内）
    }
    if (clickCount === 2) {
      setClickCount(0); // ダブルクリックでカウントをリセット
      navigate(`/todos/${arg.dateStr}`);
    }
  };

  const calendarEvents = todos
    .filter(todo => !todo.delete_flg)
    .sort((a, b) => {
      console.log('Comparing:', a.content, Number(a.sort), Number(b.sort)); // デバッグ用のログ
      return Number(b.sort) - Number(a.sort);
    })
    .map(todo => ({
      title: todo.content,
      date: todo.output_date,
      id: todo.id.toString(),
      color: todo.completed ? 'green' : '',
    }));

  const handleEventDrop = (info: any) => {
    const updatedTodo = todos.find(todo => todo.id.toString() === info.event.id);
    if (updatedTodo) {
      const newDate = info.event.startStr;
      updateTodo(updatedTodo.id, { ...updatedTodo, output_date: newDate });
    }
  };

  const handleEventDragStart = (arg: any) => {
    arg.jsEvent.preventDefault(); // ドラッグ操作を無効にする
  };

  const handleEventClick = (arg: any) => {
    arg.jsEvent.stopPropagation(); // イベントのクリック操作を親要素に伝播させない
  };

  return (
    <FullCalendar
      plugins={[dayGridPlugin, interactionPlugin]} // プラグインを設定
      initialView="dayGridMonth" // 初期表示を月表示に設定
      events={calendarEvents} // イベントのデータを設定
      dateClick={handleDateClick} // 日付をクリックしたときのハンドラ
      editable={true} // イベントの編集を有効にする
      eventDrop={handleEventDrop} // イベントをドラッグし終わったときのハンドラ
      eventDragStart={handleEventDragStart} // イベントをドラッグし始めたときのハンドラ
      eventClick={handleEventClick} // イベントをクリックしたときのハンドラ
      selectable={true} // カレンダー上で選択を有効にする
      select={handleDateClick} // 日付をクリックしたときのハンドラ
      locale={jaLocale} // 日本語ローカルを設定
    />
  );
};

export default Calendar;
