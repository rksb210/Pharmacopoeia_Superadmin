import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PermissionProvider } from './context/PermissionContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';

// Admin Shell & Pages
import AdminLayout from './layouts/AdminLayout';
import AdminRoute from './components/auth/AdminRoute';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import UsersPage from './pages/admin/UsersPage';
import AdminsPage from './pages/admin/AdminsPage';
import SubAdminsPage from './pages/admin/SubAdminsPage';
import RolesPage from './pages/admin/RolesPage';
import AdminModulePlaceholderPage from './pages/admin/AdminModulePlaceholderPage';

import ResetPasswordPage from './pages/ResetPasswordPage';
import ForbiddenPage from './pages/error/ForbiddenPage';
import UnauthorizedPage from './pages/error/UnauthorizedPage';

// Protected Route Component for Public/Subscriber Portal
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#FFD243] border-t-[#E76120] rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-500">Verifying session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Public Route (redirects to admin dashboard or subscriber dashboard if logged in)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading, isAdminUser } = useAuth();

  if (loading) return null;

  if (isAuthenticated) {
    return <Navigate to={isAdminUser ? '/admin/dashboard' : '/dashboard'} replace />;
  }

  return children;
};

function AppRoutes() {
  const { isAuthenticated, isAdminUser } = useAuth();

  return (
    <Routes>
      {/* Public Authentication */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/reset-password/:token"
        element={
          <PublicRoute>
            <ResetPasswordPage />
          </PublicRoute>
        }
      />

      {/* Error Routes */}
      <Route path="/forbidden" element={<ForbiddenPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Subscriber / Public Portal Dashboard */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      {/* Admin Panel Namespace (Protected by AdminRoute RBAC Guard) */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboardPage />} />

        {/* User & Access Management */}
        <Route path="users" element={<UsersPage />} />
        <Route path="admins" element={<AdminsPage />} />
        <Route path="sub-admins" element={<SubAdminsPage />} />
        <Route path="roles" element={<RolesPage />} />

        {/* Content & Formulary */}
        <Route
          path="content"
          element={
            <AdminModulePlaceholderPage
              moduleId="content"
              title="Content & Monographs"
              description="Official Indian Pharmacopoeia drug monographs, dosage guidelines, and advisories."
            />
          }
        />
        <Route
          path="content-workflow"
          element={
            <AdminModulePlaceholderPage
              moduleId="content-workflow"
              title="Content Workflow"
              description="Multi-tier editorial review, committee approvals, and publishing pipeline."
            />
          }
        />
        <Route
          path="search-index"
          element={
            <AdminModulePlaceholderPage
              moduleId="search-index"
              title="Search Index"
              description="Formulary indexing health, synonym mappings, and search query analytics."
            />
          }
        />

        {/* Commercial & Subscriptions */}
        <Route
          path="subscriptions"
          element={
            <AdminModulePlaceholderPage
              moduleId="subscriptions"
              title="Subscriptions"
              description="Monitor active individual and institutional subscription licenses."
            />
          }
        />
        <Route
          path="plans"
          element={
            <AdminModulePlaceholderPage
              moduleId="plans"
              title="Plans & Pricing"
              description="Configure tier pricing, seat quotas, and institutional license parameters."
            />
          }
        />
        <Route
          path="discounts"
          element={
            <AdminModulePlaceholderPage
              moduleId="discounts"
              title="Discounts"
              description="Promotional pricing rules, institutional rebates, and government subsidies."
            />
          }
        />
        <Route
          path="coupons"
          element={
            <AdminModulePlaceholderPage
              moduleId="coupons"
              title="Coupons"
              description="Generate, track, and expire discount promo codes."
            />
          }
        />
        <Route
          path="bulk-subscription"
          element={
            <AdminModulePlaceholderPage
              moduleId="bulk-subscription"
              title="Bulk Subscription"
              description="Enterprise license management for hospitals, universities, and state health departments."
            />
          }
        />

        {/* Engagement & Support */}
        <Route
          path="crm"
          element={
            <AdminModulePlaceholderPage
              moduleId="crm"
              title="CRM & Leads"
              description="Manage institutional relationships, sales inquiries, and onboarding pipelines."
            />
          }
        />
        <Route
          path="feedback"
          element={
            <AdminModulePlaceholderPage
              moduleId="feedback"
              title="User Feedback"
              description="Feedback, monograph amendment suggestions, and bug reports from healthcare professionals."
            />
          }
        />
        <Route
          path="notifications"
          element={
            <AdminModulePlaceholderPage
              moduleId="notifications"
              title="Notifications"
              description="Broadcast safety advisories, drug alerts, and portal system notifications."
            />
          }
        />

        {/* Integrated Modules */}
        <Route
          path="diksha"
          element={
            <AdminModulePlaceholderPage
              moduleId="diksha"
              title="DIKSHA Integration"
              description="E-learning course catalog, continuing medical education (CME), and certificates."
            />
          }
        />
        <Route
          path="kaym"
          element={
            <AdminModulePlaceholderPage
              moduleId="kaym"
              title="KAYM Module"
              description="Know All Your Medicines (KAYM) scanner integration and patient safety library."
            />
          }
        />

        {/* System & Governance */}
        <Route
          path="reports"
          element={
            <AdminModulePlaceholderPage
              moduleId="reports"
              title="Reports & Analytics"
              description="Monograph utilization, subscriber retention, revenue reports, and export logs."
            />
          }
        />
        <Route
          path="audit-logs"
          element={
            <AdminModulePlaceholderPage
              moduleId="audit-logs"
              title="Audit Logs"
              description="Tamper-evident logs of administrative actions, role changes, and data exports."
            />
          }
        />
        <Route
          path="settings"
          element={
            <AdminModulePlaceholderPage
              moduleId="settings"
              title="System Settings"
              description="General portal configuration, email relays, security policies, and maintenance mode."
            />
          }
        />
      </Route>

      {/* Root redirect based on auth */}
      <Route
        path="/"
        element={
          <Navigate
            to={isAuthenticated ? (isAdminUser ? '/admin/dashboard' : '/dashboard') : '/login'}
            replace
          />
        }
      />
      <Route
        path="*"
        element={
          <Navigate
            to={isAuthenticated ? (isAdminUser ? '/admin/dashboard' : '/dashboard') : '/login'}
            replace
          />
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <PermissionProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </PermissionProvider>
    </AuthProvider>
  );
}

export default App;
