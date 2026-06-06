-- Seed data for docs_portal database
-- Creates initial superuser account

\c docs_portal;

-- Insert superuser (password: changeme123)
-- Note: This password hash is for 'changeme123' - MUST be changed in production!
INSERT INTO docs_users (email, password_hash, full_name, role, is_active)
VALUES (
    'admin@docs.local',
    '$2a$10$7Z.qBH8Zn3Q3Y5y3X5Z5.eO5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5',  -- Placeholder, will be replaced by migration
    'Super Admin',
    'superuser',
    true
)
ON CONFLICT (email) DO NOTHING;

-- Sample audit log entry
INSERT INTO docs_audit_log (user_id, action, resource, details)
SELECT
    id,
    'account_created',
    'user',
    jsonb_build_object('method', 'seed_script', 'initial_setup', true)
FROM docs_users
WHERE email = 'admin@docs.local'
ON CONFLICT DO NOTHING;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO docs_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO docs_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO docs_user;
