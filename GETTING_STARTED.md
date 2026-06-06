# Getting Started with Documentation Portal

This guide will walk you through setting up the documentation portal for the first time.

## Prerequisites

Before you begin, ensure you have:

- ✅ Docker and Docker Compose installed
- ✅ Node.js 18+ installed (for local development)
- ✅ Infrastructure PostgreSQL running (`infra_postgres`)
- ✅ Git installed

## Step-by-Step Setup

### 1. Verify Infrastructure is Running

The docs portal uses your infrastructure PostgreSQL database:

```bash
cd ../macmini-infrastructure
make start-databases

# Verify postgres is running
docker ps | grep infra_postgres
```

### 2. Configure Environment

```bash
cd docs-portal

# Copy environment file
cp .env.example .env

# Edit with your credentials
vim .env
```

**Critical settings to change:**

```bash
# Use a strong, random JWT secret (at least 32 characters)
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_make_it_long

# Use your infrastructure database password
DB_PASSWORD=your_postgres_password_here

# Set superuser credentials (CHANGE THESE!)
SUPERUSER_EMAIL=admin@yourdomain.com
SUPERUSER_PASSWORD=ChangeMeToSomethingSecure123!
SUPERUSER_NAME=Your Name
```

### 3. Copy Documentation from Repos

```bash
# This copies all .md files from your repos
./scripts/copy-docs.sh
```

This script copies documentation from:
- `../macmini-infrastructure` → docs/infrastructure/
- `../../eduhub` → docs/eduhub/
- `../../blog` → docs/blog/

**Note:** Adjust paths in `scripts/copy-docs.sh` if your repos are elsewhere.

### 4. Run Initial Setup

```bash
# Runs migration and installs dependencies
make setup
```

This will:
1. Copy documentation from all repos
2. Install Node.js dependencies
3. Create `docs_portal` database
4. Create database tables
5. Create superuser account

### 5. Start the Services

```bash
# Start with Docker Compose
make start

# Or for local development
make dev-auth    # Terminal 1
make dev-docs    # Terminal 2
```

### 6. Test the Portal

1. **Open browser:** http://localhost:3000

2. **You should see a login screen** (if not, check logs: `make logs`)

3. **Login with superuser:**
   - Email: (your SUPERUSER_EMAIL)
   - Password: (your SUPERUSER_PASSWORD)

4. **Explore documentation:**
   - Navigate to different sections
   - Check Infrastructure, EduHub docs
   - Verify role-based access works

### 7. Verify Everything Works

```bash
# Check health
make health

# Should show:
# ✅ Auth service healthy
# ✅ Docs service healthy

# Check services status
make status

# View logs
make logs
```

## Next Steps

### Add More Users

Connect to database and add users:

```bash
make db-connect
```

```sql
-- Add a developer
INSERT INTO docs_users (email, password_hash, full_name, role, is_active)
VALUES (
  'developer@example.com',
  '$2a$10$hashed_password_here',  -- Use bcrypt to hash
  'Developer Name',
  'eduhub_developer',
  true
);
```

Generate password hash:
```bash
node -e "console.log(require('bcryptjs').hashSync('password123', 10))"
```

### Customize Documentation

1. **Edit Docusaurus config:**
   ```bash
   vim docusaurus/docusaurus.config.ts
   ```

2. **Customize theme:**
   ```bash
   vim docusaurus/src/css/custom.css
   ```

3. **Add custom pages:**
   ```bash
   vim docusaurus/src/pages/index.tsx
   ```

### Set Up Automatic Sync

Create a cron job to sync docs regularly:

```bash
# Add to crontab
0 */6 * * * cd /path/to/docs-portal && ./scripts/sync-docs.sh
```

Or use GitHub Actions to trigger sync on repo updates.

### Configure Production Deployment

1. **Update docker-compose.yml for production:**
   ```yaml
   NODE_ENV: production
   DOCS_URL: https://docs.yourdomain.com
   ```

2. **Add nginx configuration** in infrastructure repo:
   ```nginx
   # macmini-infrastructure/nginx/sites/docs.conf
   server {
       listen 443 ssl;
       server_name docs.yourdomain.com;

       location / {
           proxy_pass http://docs_portal:3000;
       }
   }
   ```

3. **Set up SSL certificate:**
   ```bash
   # In infrastructure repo
   docker run --rm \
     -v $(pwd)/certbot/conf:/etc/letsencrypt \
     -v $(pwd)/certbot/www:/var/www/certbot \
     certbot/certbot certonly \
     --webroot -w /var/www/certbot \
     --email admin@yourdomain.com \
     --agree-tos \
     -d docs.yourdomain.com
   ```

## Common Tasks

### Sync Documentation

```bash
make sync-docs
```

### Add a New User

```bash
# Via database
make db-connect

# Via bcrypt (generate hash first)
node -e "console.log(require('bcryptjs').hashSync('password', 10))"

# Then insert
INSERT INTO docs_users ...
```

### View Users

```bash
make db-users
```

### View Audit Log

```bash
make db-audit
```

### Change User Role

```bash
make db-connect

UPDATE docs_users SET role = 'admin' WHERE email = 'user@example.com';
```

### Restart Services

```bash
make restart
```

## Troubleshooting

### Can't connect to database

```bash
# Check if infra postgres is running
docker ps | grep infra_postgres

# Check network
docker network ls | grep infra_network

# Start infrastructure
cd ../macmini-infrastructure
make start-databases
```

### Migration fails

```bash
# Check database credentials in .env
vim .env

# Try running migration manually
cd auth-service
npm run migrate
```

### Login not working

```bash
# Check auth service logs
make logs-auth

# Verify superuser was created
make db-users

# Check JWT secret is set
grep JWT_SECRET .env
```

### Docs not appearing

```bash
# Re-sync docs
make sync-docs

# Check docusaurus logs
make logs-docs

# Rebuild docusaurus
make build
```

### Port conflicts

```bash
# Change ports in .env
AUTH_PORT=4001
DOCS_PORT=3001

# Restart
make restart
```

## Architecture Overview

```
┌────────────────────────────────────────┐
│      Your Browser                      │
│      http://localhost:3000             │
└────────────────┬───────────────────────┘
                 │
┌────────────────▼───────────────────────┐
│  Docusaurus (Port 3000)                │
│  - Serves static documentation         │
│  - Proxies /auth/* to auth service     │
└────────────────┬───────────────────────┘
                 │
┌────────────────▼───────────────────────┐
│  Auth Service (Port 4000)              │
│  - JWT authentication                  │
│  - Role-based access control           │
│  - Session management                  │
└────────────────┬───────────────────────┘
                 │
┌────────────────▼───────────────────────┐
│  PostgreSQL (infra_postgres)           │
│  - docs_portal database                │
│  - Users, sessions, audit logs         │
└────────────────────────────────────────┘
```

## Security Best Practices

1. **Change default passwords immediately**
2. **Use strong JWT secret** (at least 32 random characters)
3. **Use HTTPS in production**
4. **Regular database backups**
5. **Review audit logs regularly**: `make db-audit`
6. **Keep dependencies updated**: `npm audit`
7. **Use environment-specific .env files**

## Getting Help

- Run `make help` for all available commands
- Check logs: `make logs`
- Check service health: `make health`
- Review README.md for detailed documentation
- Check database: `make db-connect`

---

**You're all set!** 🎉

Access your documentation portal at http://localhost:3000
