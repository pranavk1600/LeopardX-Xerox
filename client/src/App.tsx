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
import { ProtectedRoute } from './components/ProtectedRoute';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Customer Kiosk & Info Routes */}
        <Route path="/print" element={<KioskPage />} />
        <Route path="/services" element={<ServicesPricingPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/refunds" element={<RefundsPage />} />

        {/* Public Admin Login Route */}
        <Route path="/admin/login" element={<AdminLoginPage />} />

        {/* Protected Super Admin Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/admin" element={<Navigate to="/admin/machines" replace />} />
          <Route path="/admin/machines" element={<AdminMachinesPage />} />
          <Route path="/admin/machines/:id" element={<AdminMachineDetailsPage />} />
          <Route path="/admin/jobs" element={<Navigate to="/admin/machines" replace />} />
          <Route path="/admin/payments" element={<Navigate to="/admin/machines" replace />} />
          <Route path="/admin/refunds" element={<Navigate to="/admin/machines" replace />} />
          <Route path="/admin/reports" element={<Navigate to="/admin/machines" replace />} />
        </Route>

        {/* Default route redirects to sample machine QR path */}
        <Route path="*" element={<Navigate to="/print?machine=PUNE-COLLEGE-001" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
