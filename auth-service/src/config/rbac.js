/**
 * Role-Based Access Control Configuration
 */

const roles = {
  superuser: {
    name: 'Super Administrator',
    description: 'Full access to all documentation and admin features',
    permissions: ['read:all', 'write:all', 'admin:all'],
    docs: ['infrastructure', 'eduhub', 'blog', 'general'],
    priority: 1000
  },
  admin: {
    name: 'Administrator',
    description: 'Access to all documentation',
    permissions: ['read:all'],
    docs: ['infrastructure', 'eduhub', 'blog', 'general'],
    priority: 900
  },
  infrastructure_team: {
    name: 'Infrastructure Team',
    description: 'Access to infrastructure and general docs',
    permissions: ['read:infrastructure', 'read:general'],
    docs: ['infrastructure', 'general'],
    priority: 500
  },
  eduhub_developer: {
    name: 'EduHub Developer',
    description: 'Access to EduHub and general docs',
    permissions: ['read:eduhub', 'read:general'],
    docs: ['eduhub', 'general'],
    priority: 400
  },
  blog_developer: {
    name: 'Blog Developer',
    description: 'Access to Blog and general docs',
    permissions: ['read:blog', 'read:general'],
    docs: ['blog', 'general'],
    priority: 400
  },
  guest: {
    name: 'Guest',
    description: 'Access to general documentation only',
    permissions: ['read:general'],
    docs: ['general'],
    priority: 100
  }
};

/**
 * Check if a role has access to a specific document category
 */
function canAccessDoc(role, docCategory) {
  const roleConfig = roles[role];
  if (!roleConfig) return false;

  // Superuser and admin can access everything
  if (role === 'superuser' || role === 'admin') return true;

  return roleConfig.docs.includes(docCategory);
}

/**
 * Check if a role has a specific permission
 */
function hasPermission(role, permission) {
  const roleConfig = roles[role];
  if (!roleConfig) return false;

  // Check for wildcard permissions
  if (roleConfig.permissions.includes('read:all') ||
      roleConfig.permissions.includes('admin:all')) {
    return true;
  }

  return roleConfig.permissions.includes(permission);
}

/**
 * Get all accessible docs for a role
 */
function getAccessibleDocs(role) {
  const roleConfig = roles[role];
  if (!roleConfig) return [];
  return roleConfig.docs;
}

module.exports = {
  roles,
  canAccessDoc,
  hasPermission,
  getAccessibleDocs
};
