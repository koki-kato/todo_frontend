// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Calendar from './Calendar';
import Task from './task';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/todos/:date" element={<Task />} />
        <Route path="/" element={<Calendar />} />
      </Routes>
    </Router>
  );
};

export default App;
