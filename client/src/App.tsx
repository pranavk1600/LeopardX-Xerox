import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { KioskPage } from './pages/KioskPage';
import { ServicesPricingPage } from './pages/ServicesPricingPage';
import { ContactPage } from './pages/ContactPage';
import { TermsPage } from './pages/TermsPage';
import { RefundsPage } from './pages/RefundsPage';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminMachinesPage } from './pages/admin/AdminMachinesPage';
import { AdminMachineDetailsPage } from './pages/admin/AdminMachineDetailsPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/print" element={<KioskPage />} />
        <Route path="/services" element={<ServicesPricingPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/refunds" element={<RefundsPage />} />

        {/* Super Admin Routes */}
        <Route path="/admin" element={<Navigate to="/admin/machines" replace />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin/machines" element={<AdminMachinesPage />} />
        <Route path="/admin/machines/:id" element={<AdminMachineDetailsPage />} />

        {/* Default route redirects to sample machine QR path */}
        <Route path="*" element={<Navigate to="/print?machine=PUNE-COLLEGE-001" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
