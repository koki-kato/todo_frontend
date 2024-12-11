import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Calendar from './Calendar';
import Task from './task';
import Modal from 'react-modal'; // react-modalをインポート

// アプリケーションのルート要素を設定
Modal.setAppElement('#root');

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/todos/:date" element={<Task />} />
        <Route path="*" element={<Calendar />} />
      </Routes>
    </Router>
  );
};

export default App;
