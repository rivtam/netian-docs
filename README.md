# Documentation Portal

Centralized documentation portal with role-based access control (RBAC) for all projects.

## 🎯 Features

- ✅ **Docusaurus** - Beautiful documentation site
- ✅ **Authentication** - JWT-based auth with Express.js
- ✅ **Role-Based Access Control** - Control who sees what docs
- ✅ **PostgreSQL Database** - Uses infrastructure database
- ✅ **Multi-Project Support** - Docs from infrastructure, EduHub, Blog, etc.
- ✅ **Automatic Sync** - Scripts to copy docs from all repos
- ✅ **Docker Support** - Complete Docker Compose setup
- ✅ **SSO Ready** - Architecture supports future SSO integration

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│         Documentation Portal (docs.domain.com)  │
├─────────────────────────────────────────────────┤
│                                                 │
│  Nginx (Port 3000)                             │
│  ├─ /docs/* → Docusaurus (Static Site)        │
│  └─ /auth/* → Auth Service (Express.js)       │
│                                                 │
│  Auth Service (Port 4000)                      │
│  ├─ JWT Authentication                         │
│  ├─ RBAC Implementation                        │
│  └─ PostgreSQL (docs_portal database)          │
│                                                 │
└─────────────────────────────────────────────────┘
```

## 📦 Components

### 1. Auth Service (Express.js)
- JWT-based authentication
- Session management
- Role-based access control
- Audit logging
- `/auth-service/`

### 2. Docusaurus Site
- Documentation website
- Aggregated docs from all repos
- Responsive design
- `/docusaurus/`

### 3. Database
- PostgreSQL database (uses infrastructure DB)
- Schema for users, sessions, audit logs
- `/database/`

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- Infrastructure PostgreSQL running (`infra_postgres`)
- Node.js 18+ (for local development)

### Step 1: Copy Documentation

```bash
# Copy docs from all repos
./scripts/copy-docs.sh
```

### Step 2: Configure Environment

```bash
# Copy environment file
cp .env.example .env

# Edit with your values
vim .env
```

Important variables:
- `DB_PASSWORD` - PostgreSQL password
- `JWT_SECRET` - JWT signing key (make it long and random)
- `SUPERUSER_EMAIL` - Admin email
- `SUPERUSER_PASSWORD` - Admin password (change immediately!)

### Step 3: Run Database Migration

```bash
# Make sure infrastructure PostgreSQL is running
cd ../macmini-infrastructure
make start-databases

# Run migration
cd ../docs-portal/auth-service
npm install
npm run migrate
```

### Step 4: Start Services

**Option A: Docker Compose (Recommended)**

```bash
docker compose up -d
```

**Option B: Local Development**

```bash
# Terminal 1: Auth Service
cd auth-service
npm install
npm run dev

# Terminal 2: Docusaurus
cd docusaurus
npm install
npm start
```

### Step 5: Access the Portal

1. Open http://localhost:3000
2. Login with superuser credentials:
   - Email: `admin@docs.local`
   - Password: `changeme123` (or your configured password)

## 🔐 User Roles

| Role | Access | Description |
|------|---------|-------------|
| `superuser` | All docs | Full access to everything, admin privileges |
| `admin` | All docs | Read access to all documentation |
| `infrastructure_team` | Infrastructure + General | Infrastructure docs only |
| `eduhub_developer` | EduHub + General | EduHub docs only |
| `blog_developer` | Blog + General | Blog docs only |
| `guest` | General only | General documentation only |

## 📚 Documentation Structure

```
docs/
├── general/              # Company-wide docs (all roles)
│   └── welcome.md
├── infrastructure/       # Infrastructure docs
│   ├── README.md
│   ├── GETTING_STARTED.md
│   ├── databases/
│   ├── nginx/
│   └── monitoring/
├── eduhub/              # EduHub docs
│   ├── README.md
│   └── ...
└── blog/                # Blog docs
    ├── README.md
    └── ...
```

## 🔄 Syncing Documentation

Documentation is copied from source repositories. Run this when docs are updated:

```bash
./scripts/sync-docs.sh
```

Or set up a cron job / CI/CD to sync automatically.

## 🛠️ Management Tasks

### Adding a New User

```bash
# Connect to database
docker exec -it infra_postgres psql -U postgres -d docs_portal

# Add user
INSERT INTO docs_users (email, password_hash, full_name, role, is_active)
VALUES ('user@example.com', '$2a$10$...', 'User Name', 'eduhub_developer', true);
```

Or use bcrypt to hash password:
```bash
node -e "console.log(require('bcryptjs').hashSync('password', 10))"
```

### Changing User Role

```sql
UPDATE docs_users SET role = 'admin' WHERE email = 'user@example.com';
```

### Viewing Audit Log

```sql
SELECT
    u.email,
    a.action,
    a.resource,
    a.timestamp
FROM docs_audit_log a
JOIN docs_users u ON a.user_id = u.id
ORDER BY a.timestamp DESC
LIMIT 50;
```

### Cleaning Up Expired Sessions

```sql
DELETE FROM docs_sessions WHERE expires_at < NOW();
```

## 🔧 Configuration

### Auth Service (`auth-service/.env`)

```bash
PORT=4000
DB_HOST=infra_postgres
DB_NAME=docs_portal
JWT_SECRET=your_secret_here
```

### Docusaurus (`docusaurus/docusaurus.config.ts`)

Edit to customize:
- Site title and tagline
- Navigation items
- Footer links
- Theme colors

### RBAC (`auth-service/src/config/rbac.js`)

Define roles and permissions here.

## 🚀 Deployment

### Production Checklist

- [ ] Change superuser password
- [ ] Generate strong JWT secret
- [ ] Use strong database password
- [ ] Configure proper CORS origins
- [ ] Enable HTTPS
- [ ] Set up automated doc syncing
- [ ] Configure backup for docs_portal database
- [ ] Set up monitoring

### Adding to Infrastructure

To integrate with your main infrastructure:

1. **Update nginx config** in `macmini-infrastructure/nginx/sites/`:

```nginx
# docs.conf
server {
    listen 443 ssl;
    server_name docs.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/docs.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/docs.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://docs_portal:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

2. **Deploy docs-portal** to `~/prod/docs-portal/` on Mac Mini

3. **Add to CI/CD** for automatic documentation updates

## 🧪 Testing

### Test Auth Service

```bash
# Health check
curl http://localhost:4000/health

# Login
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@docs.local","password":"changeme123"}'

# Get user info (with token)
curl http://localhost:4000/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test Docusaurus

```bash
# Local build
cd docusaurus
npm run build
npm run serve
```

## 📖 API Documentation

### Auth Endpoints

**POST /auth/login**
```json
{
  "email": "user@example.com",
  "password": "password"
}
```

**POST /auth/logout**
Requires authentication token.

**GET /auth/me**
Returns current user info. Requires authentication.

**GET /auth/check-access/:category**
Check if user can access specific doc category.

## 🔮 Future Enhancements

- [ ] SSO integration (Google, GitHub)
- [ ] User management UI
- [ ] Automated doc syncing from repos
- [ ] Version control for docs
- [ ] Search with role filtering
- [ ] Integration with EduHub user system
- [ ] API documentation generation
- [ ] Real-time collaboration features

## 🐛 Troubleshooting

### Can't login

```bash
# Check auth service logs
docker logs docs_auth

# Verify database connection
docker exec -it infra_postgres psql -U postgres -d docs_portal -c "SELECT * FROM docs_users;"
```

### Docs not showing

```bash
# Re-sync docs
./scripts/sync-docs.sh

# Rebuild Docusaurus
cd docusaurus
npm run build
```

### Database connection error

```bash
# Make sure infrastructure PostgreSQL is running
cd ../macmini-infrastructure
make start-databases

# Check network
docker network inspect infra_network
```

## 📝 License

[Your License Here]

## 🆘 Support

For issues or questions:
1. Check logs: `docker logs docs_auth` or `docker logs docs_portal`
2. Verify database: `make db-connect` in infrastructure
3. Check role configuration in `auth-service/src/config/rbac.js`

---

**Quick Start:** `./scripts/copy-docs.sh` → `docker compose up -d` → http://localhost:3000 🚀
