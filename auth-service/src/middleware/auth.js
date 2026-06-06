const jwt = require('jsonwebtoken');
const pool = require('../config/database');

/**
 * Verify JWT token middleware
 */
async function verifyToken(req, res, next) {
  try {
    // Get token from cookie or header
    const token = req.cookies.auth_token ||
                  req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        error: 'No authentication token provided',
        code: 'NO_TOKEN'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if session exists and is valid
    const sessionQuery = `
      SELECT s.*, u.email, u.full_name, u.role, u.is_active
      FROM docs_sessions s
      JOIN docs_users u ON s.user_id = u.id
      WHERE s.token = $1 AND s.expires_at > NOW() AND u.is_active = true
    `;

    const result = await pool.query(sessionQuery, [token]);

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: 'Invalid or expired session',
        code: 'INVALID_SESSION'
      });
    }

    // Attach user info to request
    req.user = {
      id: decoded.userId,
      email: result.rows[0].email,
      name: result.rows[0].full_name,
      role: result.rows[0].role
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication error' });
  }
}

/**
 * Check if user has required role
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        required: allowedRoles,
        current: req.user.role
      });
    }

    next();
  };
}

/**
 * Check if user can access specific doc category
 */
function requireDocAccess(docCategory) {
  return (req, res, next) => {
    const { canAccessDoc } = require('../config/rbac');

    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!canAccessDoc(req.user.role, docCategory)) {
      return res.status(403).json({
        error: 'No access to this documentation',
        category: docCategory,
        role: req.user.role
      });
    }

    next();
  };
}

module.exports = {
  verifyToken,
  requireRole,
  requireDocAccess
};
