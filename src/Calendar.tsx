import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { fetchTodos, updateTodo } from './api';
import { Todo } from './types'; // types.tsのパスに応じて調整
import { useNavigate } from 'react-router-dom';
import jaLocale from '@fullcalendar/core/locales/ja'; // 日本語ローカルをインポート

const Calendar: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [clickCount, setClickCount] = useState<number>(0); // クリック回数を管理
  const [clickedDate, setClickedDate] = useState<string | null>(null); // クリックされた日付を状態として管理
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredEvents, setFilteredEvents] = useState<any[]>([]);
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

  useEffect(() => {
    const filtered = todos
      .filter(todo => !todo.delete_flg && todo.content.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => a.sort - b.sort)
      .map(todo => ({
        title: stripMarkdownLinks(todo.content),
        date: todo.output_date,
        id: todo.id.toString(),
        completed: todo.completed,
        sort: todo.sort,
      }));
    setFilteredEvents(filtered);
  }, [todos, searchTerm]);

  const handleDateClick = (arg: any) => {
    setClickedDate(arg.dateStr); // クリックされた日付を状態として保存
    setClickCount(prevCount => prevCount + 1);
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  // HTMLの<a>タグやマークダウン形式のリンクを除去してテキストだけを返す関数
  const stripMarkdownLinks = (content: string) => {
    // Markdownリンク形式 [リンクテキスト](URL) と HTML の <a> タグを削除
    const markdownStripped = content.replace(/\[(.*?)\]\((https?:\/\/.*?)\)/g, '$1'); // Markdownリンクを削除
    const htmlStripped = markdownStripped.replace(/<a [^>]+>(.*?)<\/a>/g, '$1'); // HTML <a> タグを削除
    return htmlStripped;
  };



  const handleEventDrop = (info: any) => {
    const droppedId = parseInt(info.event.id);
    const newDate = info.event.start.toISOString().split('T')[0]; // YYYY-MM-DD形式に変換

    const updatedTodos = todos.map(todo => {
      if (todo.id === droppedId) {
        return { ...todo, output_date: newDate };
      }
      return todo;
    });

    // サーバーに更新を送信
    updateTodo(droppedId, { output_date: newDate })
      .then(() => {
        setTodos(updatedTodos);
        console.log('Todoが正常に更新されました');
      })
      .catch(error => {
        console.error('Todo更新エラー:', error);
        // エラーハンドリング（例：ユーザーに通知）
      });
  };

  const handleEventClick = (arg: any) => {
    arg.jsEvent.stopPropagation();
  };

  const renderEventContent = (eventInfo: any) => {
    const circleColor = eventInfo.event.extendedProps.completed ? '#0B8043' : '#0000FF';
    return (
      <div style={{ outline: 'none', display: 'flex', alignItems: 'center' }}>
        <span style={{ color: circleColor, marginRight: '5px' }}>●</span>
        <span>{eventInfo.event.title}</span>
      </div>
    );
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Todoを検索..."
        value={searchTerm}
        onChange={handleSearch}
        style={{ marginBottom: '10px', padding: '5px', width: '200px' }}
      />
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={filteredEvents}
        dateClick={handleDateClick}
        editable={true}
        eventDrop={handleEventDrop}
        eventClick={handleEventClick}
        eventContent={renderEventContent}
        selectable={true}
        locale={jaLocale}
        eventOrder="sort" // イベントをsortフィールドで並べ替え
        eventOrderStrict={true}
      />
    </div>
  );
};

export default Calendar;
