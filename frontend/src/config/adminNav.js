import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  UserCheck,
  KeyRound,
  FileText,
  GitPullRequest,
  CreditCard,
  Layers,
  Percent,
  Ticket,
  Building2,
  Contact2,
  MessageSquare,
  Bell,
  GraduationCap,
  Scan,
  BarChart3,
  Search,
  History,
  Settings,
} from 'lucide-react';

/**
 * Scalable Admin Navigation Configuration with RBAC Permissions Mapping
 */
export const ADMIN_NAV_SECTIONS = [
  {
    title: 'Overview',
    items: [
      {
        id: 'dashboard',
        title: 'Dashboard',
        path: '/admin/dashboard',
        icon: LayoutDashboard,
        permission: { module: 'OVERVIEW', section: 'DASHBOARD', action: 'VIEW' },
        roles: ['superadmin', 'admin', 'subadmin', 'maker', 'reviewer', 'approver', 'editor', 'viewer'],
      },
    ],
  },
  {
    title: 'User & Access Management',
    items: [
      {
        id: 'users',
        title: 'Users',
        path: '/admin/users',
        icon: Users,
        permission: { module: 'USERS', section: 'USERS', action: 'VIEW' },
        roles: ['superadmin', 'admin', 'subadmin'],
      },
      {
        id: 'admins',
        title: 'Admins',
        path: '/admin/admins',
        icon: ShieldCheck,
        permission: { module: 'USERS', section: 'ADMINS', action: 'VIEW' },
        roles: ['superadmin'],
      },
      {
        id: 'sub-admins',
        title: 'Sub Admins',
        path: '/admin/sub-admins',
        icon: UserCheck,
        permission: { module: 'USERS', section: 'SUBADMINS', action: 'VIEW' },
        roles: ['superadmin', 'admin'],
      },
      {
        id: 'roles',
        title: 'Roles & Permissions',
        path: '/admin/roles',
        icon: KeyRound,
        permission: { module: 'USERS', section: 'ROLES', action: 'VIEW' },
        roles: ['superadmin'],
      },
    ],
  },
  {
    title: 'Content & Formulary',
    items: [
      {
        id: 'content',
        title: 'Content',
        path: '/admin/content',
        icon: FileText,
        permission: { module: 'CONTENT', section: 'MONOGRAPHS', action: 'VIEW' },
        roles: ['superadmin', 'admin', 'maker', 'reviewer', 'approver', 'editor'],
      },
      {
        id: 'content-workflow',
        title: 'Content Workflow',
        path: '/admin/content-workflow',
        icon: GitPullRequest,
        badge: 'Review',
        permission: { module: 'CONTENT', section: 'WORKFLOW', action: 'VIEW' },
        roles: ['superadmin', 'admin', 'maker', 'reviewer', 'approver', 'editor'],
      },
      {
        id: 'search-index',
        title: 'Search Index',
        path: '/admin/search-index',
        icon: Search,
        permission: { module: 'CONTENT', section: 'SEARCH_INDEX', action: 'VIEW' },
        roles: ['superadmin', 'admin'],
      },
    ],
  },
  {
    title: 'Commercial & Subscriptions',
    items: [
      {
        id: 'subscriptions',
        title: 'Subscriptions',
        path: '/admin/subscriptions',
        icon: CreditCard,
        permission: { module: 'COMMERCIAL', section: 'SUBSCRIPTIONS', action: 'VIEW' },
        roles: ['superadmin', 'admin'],
      },
      {
        id: 'plans',
        title: 'Plans',
        path: '/admin/plans',
        icon: Layers,
        permission: { module: 'COMMERCIAL', section: 'PLANS', action: 'VIEW' },
        roles: ['superadmin', 'admin'],
      },
      {
        id: 'discounts',
        title: 'Discounts',
        path: '/admin/discounts',
        icon: Percent,
        permission: { module: 'COMMERCIAL', section: 'DISCOUNTS', action: 'VIEW' },
        roles: ['superadmin', 'admin'],
      },
      {
        id: 'coupons',
        title: 'Coupons',
        path: '/admin/coupons',
        icon: Ticket,
        permission: { module: 'COMMERCIAL', section: 'COUPONS', action: 'VIEW' },
        roles: ['superadmin', 'admin'],
      },
      {
        id: 'bulk-subscription',
        title: 'Bulk Subscription',
        path: '/admin/bulk-subscription',
        icon: Building2,
        permission: { module: 'COMMERCIAL', section: 'BULK_SUBSCRIPTION', action: 'VIEW' },
        roles: ['superadmin', 'admin'],
      },
    ],
  },
  {
    title: 'Engagement & Support',
    items: [
      {
        id: 'crm',
        title: 'CRM',
        path: '/admin/crm',
        icon: Contact2,
        permission: { module: 'ENGAGEMENT', section: 'CRM', action: 'VIEW' },
        roles: ['superadmin', 'admin'],
      },
      {
        id: 'feedback',
        title: 'Feedback',
        path: '/admin/feedback',
        icon: MessageSquare,
        permission: { module: 'ENGAGEMENT', section: 'FEEDBACK', action: 'VIEW' },
        roles: ['superadmin', 'admin', 'reviewer', 'editor'],
      },
      {
        id: 'notifications',
        title: 'Notifications',
        path: '/admin/notifications',
        icon: Bell,
        permission: { module: 'ENGAGEMENT', section: 'NOTIFICATIONS', action: 'VIEW' },
        roles: ['superadmin', 'admin', 'maker'],
      },
    ],
  },
  {
    title: 'Integrated Modules',
    items: [
      {
        id: 'diksha',
        title: 'DIKSHA',
        path: '/admin/diksha',
        icon: GraduationCap,
        permission: { module: 'INTEGRATED', section: 'DIKSHA', action: 'VIEW' },
        roles: ['superadmin', 'admin', 'maker', 'editor'],
      },
      {
        id: 'kaym',
        title: 'KAYM',
        path: '/admin/kaym',
        icon: Scan,
        permission: { module: 'INTEGRATED', section: 'KAYM', action: 'VIEW' },
        roles: ['superadmin', 'admin', 'maker', 'editor'],
      },
    ],
  },
  {
    title: 'System & Governance',
    items: [
      {
        id: 'reports',
        title: 'Reports',
        path: '/admin/reports',
        icon: BarChart3,
        permission: { module: 'SYSTEM', section: 'REPORTS', action: 'VIEW' },
        roles: ['superadmin', 'admin', 'subadmin', 'reviewer', 'approver'],
      },
      {
        id: 'audit-logs',
        title: 'Audit Logs',
        path: '/admin/audit-logs',
        icon: History,
        permission: { module: 'SYSTEM', section: 'AUDIT_LOGS', action: 'VIEW' },
        roles: ['superadmin', 'approver'],
      },
      {
        id: 'settings',
        title: 'Settings',
        path: '/admin/settings',
        icon: Settings,
        permission: { module: 'SYSTEM', section: 'SETTINGS', action: 'VIEW' },
        roles: ['superadmin', 'admin'],
      },
    ],
  },
];

/**
 * Filter navigation sections and items dynamically based on RBAC permissions or roles
 * @param {Object} user - Authenticated user object
 * @param {Function} can - Optional can(action, module, section) helper from PermissionContext
 * @returns {Array} Filtered navigation sections
 */
export const getFilteredAdminNav = (user, can = null) => {
  const userRole = user?.role || 'viewer';

  return ADMIN_NAV_SECTIONS.map((section) => {
    const filteredItems = section.items.filter((item) => {
      // Superadmin always has access
      if (userRole === 'superadmin') return true;

      // 1. Permission-based check if 'can' helper is provided
      if (can && item.permission) {
        const { module, section: sec, action } = item.permission;
        return can(action || 'VIEW', module, sec);
      }

      // 2. Role-based fallback check
      if (!item.roles || item.roles.length === 0) return true;
      return item.roles.includes(userRole);
    });

    return {
      ...section,
      items: filteredItems,
    };
  }).filter((section) => section.items.length > 0);
};

export default ADMIN_NAV_SECTIONS;
