import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/context/AuthContext';
import { ProtectedRoute, PublicRoute } from '@/components/ProtectedRoute';
import InstallPWA from '@/components/InstallPWA';

// Public Pages
import HomePage from '@/pages/HomePage';
import LandingPage from '@/pages/LandingPage';
import MarketingLanding from '@/pages/MarketingLanding';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import VerifyMemberPage from '@/pages/VerifyMemberPage';

// Member Pages
import MemberDashboard from '@/pages/member/MemberDashboard';

// Admin Pages
import AdminLayout from '@/pages/admin/AdminLayout';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import MembersPage from '@/pages/admin/MembersPage';
import LeadsPage from '@/pages/admin/LeadsPage';
import PlansPage from '@/pages/admin/PlansPage';
import PartnersPage from '@/pages/admin/PartnersPage';
import TelecallersPage from '@/pages/admin/TelecallersPage';
import ReportsPage from '@/pages/admin/ReportsPage';
import ContentPage from '@/pages/admin/ContentPage';
import PaymentsPage from '@/pages/admin/PaymentsPage';
import CouponsPage from '@/pages/admin/CouponsPage';
import MaintenancePage from '@/pages/admin/MaintenancePage';
import AdminUsersPage from '@/pages/admin/AdminUsersPage';

// Telecaller Pages
import TelecallerDashboard from '@/pages/telecaller/TelecallerDashboard';

import '@/App.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="App">
          {/* PWA Install Prompt */}
          <InstallPWA />
          
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/landing" element={<LandingPage />} />
            <Route path="/social" element={<LandingPage />} />
            <Route path="/join" element={<MarketingLanding />} />
            <Route path="/marketing" element={<MarketingLanding />} />
            <Route path="/promo" element={<MarketingLanding />} />
            <Route path="/login" element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            } />
            <Route path="/register" element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            } />
            <Route path="/verify/:memberId" element={<VerifyMemberPage />} />

            {/* Member Routes */}
            <Route path="/member" element={
              <ProtectedRoute allowedRoles={['member']}>
                <MemberDashboard />
              </ProtectedRoute>
            } />

            {/* Admin Routes */}
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route index element={<AdminDashboard />} />
              <Route path="members" element={<MembersPage />} />
              <Route path="leads" element={<LeadsPage />} />
              <Route path="plans" element={<PlansPage />} />
              <Route path="partners" element={<PartnersPage />} />
              <Route path="telecallers" element={<TelecallersPage />} />
              <Route path="payments" element={<PaymentsPage />} />
              <Route path="coupons" element={<CouponsPage />} />
              <Route path="maintenance" element={<MaintenancePage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="content" element={<ContentPage />} />
              <Route path="admin-users" element={<AdminUsersPage />} />
            </Route>

            {/* Telecaller Routes */}
            <Route path="/telecaller" element={
              <ProtectedRoute allowedRoles={['telecaller']}>
                <TelecallerDashboard />
              </ProtectedRoute>
            } />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
      <Toaster 
        position="top-right" 
        toastOptions={{
          style: {
            background: '#1A1A1C',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#F5F5F7',
            zIndex: 99999
          }
        }}
      />
    </AuthProvider>
  );
}

export default App;
