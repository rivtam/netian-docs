-- Documentation Portal Database Schema
-- This database will be created in the infrastructure PostgreSQL instance

-- Create database
CREATE DATABASE docs_portal;

\c docs_portal;

-- Users table
CREATE TABLE docs_users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'guest',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP,
    sso_provider VARCHAR(50),  -- For future SSO: 'local', 'google', 'github', etc.
    sso_id VARCHAR(255),
    CONSTRAINT valid_role CHECK (role IN ('superuser', 'admin', 'infrastructure_team', 'eduhub_developer', 'blog_developer', 'guest'))
);

-- Sessions table
CREATE TABLE docs_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES docs_users(id) ON DELETE CASCADE,
    token VARCHAR(500) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    ip_address VARCHAR(45),
    user_agent TEXT
);

-- Audit log table
CREATE TABLE docs_audit_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES docs_users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    resource VARCHAR(255),
    details JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    timestamp TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON docs_users(email);
CREATE INDEX idx_users_role ON docs_users(role);
CREATE INDEX idx_sessions_user_id ON docs_sessions(user_id);
CREATE INDEX idx_sessions_token ON docs_sessions(token);
CREATE INDEX idx_sessions_expires_at ON docs_sessions(expires_at);
CREATE INDEX idx_audit_log_user_id ON docs_audit_log(user_id);
CREATE INDEX idx_audit_log_timestamp ON docs_audit_log(timestamp);
CREATE INDEX idx_audit_log_action ON docs_audit_log(action);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger to users table
CREATE TRIGGER update_docs_users_updated_at
    BEFORE UPDATE ON docs_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM docs_sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE docs_users IS 'Users who can access the documentation portal';
COMMENT ON TABLE docs_sessions IS 'Active user sessions with JWT tokens';
COMMENT ON TABLE docs_audit_log IS 'Audit trail of all user actions';

COMMENT ON COLUMN docs_users.role IS 'User role for RBAC: superuser, admin, infrastructure_team, eduhub_developer, blog_developer, guest';
COMMENT ON COLUMN docs_users.sso_provider IS 'SSO provider if using external auth (future feature)';
COMMENT ON COLUMN docs_sessions.expires_at IS 'When this session expires';
COMMENT ON COLUMN docs_audit_log.details IS 'JSON details about the action performed';
