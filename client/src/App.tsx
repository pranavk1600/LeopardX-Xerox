import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { KioskPage } from './pages/KioskPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/print" element={<KioskPage />} />
        {/* Default route redirects to sample machine QR path */}
        <Route path="*" element={<Navigate to="/print?machine=PUNE-COLLEGE-001" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
