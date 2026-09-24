import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { KioskPage } from './pages/KioskPage';
import { ServicesPricingPage } from './pages/ServicesPricingPage';
import { ContactPage } from './pages/ContactPage';
import { TermsPage } from './pages/TermsPage';
import { RefundsPage } from './pages/RefundsPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/print" element={<KioskPage />} />
        <Route path="/services" element={<ServicesPricingPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/refunds" element={<RefundsPage />} />
        {/* Default route redirects to sample machine QR path */}
        <Route path="*" element={<Navigate to="/print?machine=PUNE-COLLEGE-001" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
