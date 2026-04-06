// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HomePage } from './components/HomePage';
import { StoryViewer } from './components/StoryViewer';
import { StoryEditor } from './components/StoryEditor';
import './App.css';

export const App: React.FC = () => {
  return (
    <Router>
      <div className="App">
        <header className="app-header">
          <h1>分支故事 - AI驱动的互动叙事平台</h1>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/story/:id" element={<StoryViewer />} />
            <Route path="/editor" element={<StoryEditor />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};