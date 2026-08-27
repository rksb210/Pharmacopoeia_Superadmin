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
import SubscriptionsPage from './pages/admin/SubscriptionsPage';
import PlansPage from './pages/admin/PlansPage';
import DiscountsPage from './pages/admin/DiscountsPage';
import BulkSubscriptionsPage from './pages/admin/BulkSubscriptionsPage';
import NotificationsPage from './pages/admin/NotificationsPage';
import FeedbackPage from './pages/admin/FeedbackPage';
import CRMPage from './pages/admin/CRMPage';
import OrdersPage from './pages/admin/OrdersPage';
import ReportsPage from './pages/admin/ReportsPage';
import AuditLogsPage from './pages/admin/AuditLogsPage';
import SettingsPage from './pages/admin/SettingsPage';
import AdminModulePlaceholderPage from './pages/admin/AdminModulePlaceholderPage';

import ResetPasswordPage from './pages/ResetPasswordPage';
import ForbiddenPage from './pages/error/ForbiddenPage';
import UnauthorizedPage from './pages/error/UnauthorizedPage';
import PermissionGuard from './components/admin/common/PermissionGuard';

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
        <Route
          path="users"
          element={
            <PermissionGuard module="USERS" section="USERS" action="VIEW" pageLevel>
              <UsersPage />
            </PermissionGuard>
          }
        />
        <Route
          path="admins"
          element={
            <PermissionGuard module="USERS" section="ADMINS" action="VIEW" pageLevel>
              <AdminsPage />
            </PermissionGuard>
          }
        />
        <Route
          path="sub-admins"
          element={
            <PermissionGuard module="USERS" section="SUBADMINS" action="VIEW" pageLevel>
              <SubAdminsPage />
            </PermissionGuard>
          }
        />
        <Route
          path="roles"
          element={
            <PermissionGuard module="USERS" section="ROLES" action="VIEW" pageLevel>
              <RolesPage />
            </PermissionGuard>
          }
        />

        {/* Content & Formulary */}
        <Route
          path="content"
          element={
            <PermissionGuard module="CONTENT" section="MONOGRAPHS" action="VIEW" pageLevel>
              <AdminModulePlaceholderPage
                moduleId="content"
                title="Content & Monographs"
                description="Official Indian Pharmacopoeia drug monographs, dosage guidelines, and advisories."
              />
            </PermissionGuard>
          }
        />
        <Route
          path="content-workflow"
          element={
            <PermissionGuard module="CONTENT" section="WORKFLOW" action="VIEW" pageLevel>
              <AdminModulePlaceholderPage
                moduleId="content-workflow"
                title="Content Workflow"
                description="Multi-tier editorial review, committee approvals, and publishing pipeline."
              />
            </PermissionGuard>
          }
        />
        <Route
          path="search-index"
          element={
            <PermissionGuard module="CONTENT" section="SEARCH_INDEX" action="VIEW" pageLevel>
              <AdminModulePlaceholderPage
                moduleId="search-index"
                title="Search Index"
                description="Formulary indexing health, synonym mappings, and search query analytics."
              />
            </PermissionGuard>
          }
        />

        {/* Commercial & Subscriptions */}
        <Route
          path="subscriptions"
          element={
            <PermissionGuard module="COMMERCIAL" section="SUBSCRIPTIONS" action="VIEW" pageLevel>
              <SubscriptionsPage />
            </PermissionGuard>
          }
        />
        <Route
          path="plans"
          element={
            <PermissionGuard module="COMMERCIAL" section="PLANS" action="VIEW" pageLevel>
              <PlansPage />
            </PermissionGuard>
          }
        />
        <Route
          path="discounts"
          element={
            <PermissionGuard module="COMMERCIAL" section="DISCOUNTS" action="VIEW" pageLevel>
              <DiscountsPage />
            </PermissionGuard>
          }
        />
        <Route
          path="coupons"
          element={
            <PermissionGuard module="COMMERCIAL" section="COUPONS" action="VIEW" pageLevel>
              <DiscountsPage />
            </PermissionGuard>
          }
        />
        <Route
          path="bulk-subscription"
          element={
            <PermissionGuard module="COMMERCIAL" section="BULK_SUBSCRIPTION" action="VIEW" pageLevel>
              <BulkSubscriptionsPage />
            </PermissionGuard>
          }
        />
        <Route
          path="orders"
          element={
            <PermissionGuard module="COMMERCIAL" section="SUBSCRIPTIONS" action="VIEW" pageLevel>
              <OrdersPage />
            </PermissionGuard>
          }
        />

        {/* Engagement & Support */}
        <Route
          path="crm"
          element={
            <PermissionGuard module="ENGAGEMENT" section="CRM" action="VIEW" pageLevel>
              <CRMPage />
            </PermissionGuard>
          }
        />
        <Route
          path="feedback"
          element={
            <PermissionGuard module="ENGAGEMENT" section="FEEDBACK" action="VIEW" pageLevel>
              <FeedbackPage />
            </PermissionGuard>
          }
        />
        <Route
          path="notifications"
          element={
            <PermissionGuard module="ENGAGEMENT" section="NOTIFICATIONS" action="VIEW" pageLevel>
              <NotificationsPage />
            </PermissionGuard>
          }
        />

        {/* Integrated Modules */}
        <Route
          path="diksha"
          element={
            <PermissionGuard module="INTEGRATED" section="DIKSHA" action="VIEW" pageLevel>
              <AdminModulePlaceholderPage
                moduleId="diksha"
                title="DIKSHA Integration"
                description="E-learning course catalog, continuing medical education (CME), and certificates."
              />
            </PermissionGuard>
          }
        />
        <Route
          path="kaym"
          element={
            <PermissionGuard module="INTEGRATED" section="KAYM" action="VIEW" pageLevel>
              <AdminModulePlaceholderPage
                moduleId="kaym"
                title="KAYM Module"
                description="Know All Your Medicines (KAYM) scanner integration and patient safety library."
              />
            </PermissionGuard>
          }
        />

        {/* System & Governance */}
        <Route
          path="reports"
          element={
            <PermissionGuard module="SYSTEM" section="REPORTS" action="VIEW" pageLevel>
              <ReportsPage />
            </PermissionGuard>
          }
        />
        <Route
          path="audit-logs"
          element={
            <PermissionGuard module="SYSTEM" section="AUDIT_LOGS" action="VIEW" pageLevel>
              <AuditLogsPage />
            </PermissionGuard>
          }
        />
        <Route
          path="settings"
          element={
            <PermissionGuard module="SYSTEM" section="SETTINGS" action="VIEW" pageLevel>
              <SettingsPage />
            </PermissionGuard>
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
