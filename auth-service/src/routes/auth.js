const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { verifyToken } = require('../middleware/auth');
const { getAccessibleDocs } = require('../config/rbac');

const router = express.Router();

/**
 * POST /auth/login
 * Login with email and password
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }

    // Find user
    const userQuery = `
      SELECT id, email, password_hash, full_name, role, is_active
      FROM docs_users
      WHERE email = $1
    `;
    const result = await pool.query(userQuery, [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }

    const user = result.rows[0];

    // Check if user is active
    if (!user.is_active) {
      return res.status(403).json({
        error: 'Account is disabled'
      });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Create session
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await pool.query(
      `INSERT INTO docs_sessions (user_id, token, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, token, expiresAt]
    );

    // Update last login
    await pool.query(
      `UPDATE docs_users SET last_login = NOW() WHERE id = $1`,
      [user.id]
    );

    // Log audit
    await pool.query(
      `INSERT INTO docs_audit_log (user_id, action, resource)
       VALUES ($1, 'login', 'auth')`,
      [user.id]
    );

    // Set cookie
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.COOKIE_SAME_SITE || 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Get accessible docs
    const accessibleDocs = getAccessibleDocs(user.role);

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.full_name,
        role: user.role,
        accessibleDocs
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * POST /auth/logout
 * Logout and invalidate session
 */
router.post('/logout', verifyToken, async (req, res) => {
  try {
    const token = req.cookies.auth_token ||
                  req.headers.authorization?.replace('Bearer ', '');

    // Delete session
    await pool.query(
      `DELETE FROM docs_sessions WHERE token = $1`,
      [token]
    );

    // Log audit
    await pool.query(
      `INSERT INTO docs_audit_log (user_id, action, resource)
       VALUES ($1, 'logout', 'auth')`,
      [req.user.id]
    );

    // Clear cookie
    res.clearCookie('auth_token');

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

/**
 * GET /auth/me
 * Get current user info
 */
router.get('/me', verifyToken, async (req, res) => {
  try {
    const userQuery = `
      SELECT id, email, full_name, role, created_at, last_login
      FROM docs_users
      WHERE id = $1
    `;
    const result = await pool.query(userQuery, [req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    const accessibleDocs = getAccessibleDocs(user.role);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.full_name,
        role: user.role,
        createdAt: user.created_at,
        lastLogin: user.last_login,
        accessibleDocs
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

/**
 * GET /auth/check-access/:category
 * Check if user has access to specific doc category
 */
router.get('/check-access/:category', verifyToken, (req, res) => {
  const { category } = req.params;
  const { canAccessDoc } = require('../config/rbac');

  const hasAccess = canAccessDoc(req.user.role, category);

  res.json({
    hasAccess,
    category,
    role: req.user.role
  });
});

module.exports = router;
