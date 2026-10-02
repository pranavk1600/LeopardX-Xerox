import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { KioskPage } from './pages/KioskPage';
import { ServicesPricingPage } from './pages/ServicesPricingPage';
import { ContactPage } from './pages/ContactPage';
import { TermsPage } from './pages/TermsPage';
import { RefundsPage } from './pages/RefundsPage';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminForgotPasswordPage } from './pages/admin/AdminForgotPasswordPage';
import { AdminResetPasswordPage } from './pages/admin/AdminResetPasswordPage';
import { AdminMachinesPage } from './pages/admin/AdminMachinesPage';
import { AdminMachineDetailsPage } from './pages/admin/AdminMachineDetailsPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Capacitor } from '@capacitor/core';
import { CapacitorBackButton } from './components/CapacitorBackButton';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <CapacitorBackButton />
      <Routes>
        {/* Root Route */}
        <Route
          path="/"
          element={
            <Navigate
              to={Capacitor.isNativePlatform() ? '/admin/login' : '/print?machine=PUNE-COLLEGE-001'}
              replace
            />
          }
        />

        {/* Customer Kiosk & Info Routes */}
        <Route path="/print" element={<KioskPage />} />
        <Route path="/services" element={<ServicesPricingPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/refunds" element={<RefundsPage />} />

        {/* Public Admin Auth Routes */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin/forgot-password" element={<AdminForgotPasswordPage />} />
        <Route path="/admin/reset-password" element={<AdminResetPasswordPage />} />

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

        {/* Default route fallback */}
        <Route
          path="*"
          element={
            <Navigate
              to={Capacitor.isNativePlatform() ? '/admin/login' : '/print?machine=PUNE-COLLEGE-001'}
              replace
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
