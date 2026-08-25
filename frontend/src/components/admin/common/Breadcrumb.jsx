import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

/**
 * Maps raw route paths/segments to human-readable names
 */
const ROUTE_NAME_MAP = {
  admin: 'Admin',
  dashboard: 'Dashboard',
  users: 'Users',
  admins: 'Admins',
  'sub-admins': 'Sub Admins',
  roles: 'Roles & Permissions',
  content: 'Content',
  'content-workflow': 'Content Workflow',
  subscriptions: 'Subscriptions',
  plans: 'Plans',
  discounts: 'Discounts',
  coupons: 'Coupons',
  'bulk-subscription': 'Bulk Subscription',
  crm: 'CRM',
  feedback: 'Feedback',
  notifications: 'Notifications',
  diksha: 'DIKSHA',
  kaym: 'KAYM',
  reports: 'Reports',
  'search-index': 'Search Index',
  'audit-logs': 'Audit Logs',
  settings: 'Settings',
};

export const Breadcrumb = ({ customCrumbs = null }) => {
  const location = useLocation();

  let crumbs = [];

  if (customCrumbs) {
    crumbs = customCrumbs;
  } else {
    const segments = location.pathname.split('/').filter(Boolean);
    let currentPath = '';

    crumbs = segments.map((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === segments.length - 1;
      const title = ROUTE_NAME_MAP[segment] || segment.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

      return {
        title,
        path: currentPath,
        isLast,
      };
    });
  }

  if (crumbs.length <= 1) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500 select-none py-1">
      <Link
        to="/admin/dashboard"
        className="flex items-center gap-1 text-slate-400 hover:text-slate-700 transition-colors"
        title="Admin Home"
      >
        <Home className="w-3.5 h-3.5" />
      </Link>

      {crumbs.map((crumb, idx) => (
        <React.Fragment key={crumb.path || idx}>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
          {crumb.isLast ? (
            <span className="font-semibold text-slate-800 truncate">{crumb.title}</span>
          ) : (
            <Link
              to={crumb.path}
              className="hover:text-slate-800 transition-colors truncate max-w-[150px]"
            >
              {crumb.title}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumb;
