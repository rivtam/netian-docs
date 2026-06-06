.PHONY: help setup start stop restart sync-docs migrate logs clean

help: ## Show this help message
	@echo "Documentation Portal Commands"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

setup: ## Initial setup - copy docs, install dependencies, run migration
	@echo "🚀 Setting up documentation portal..."
	@./scripts/copy-docs.sh
	@echo ""
	@echo "📦 Installing auth service dependencies..."
	@cd auth-service && npm install
	@echo ""
	@echo "📦 Installing docusaurus dependencies..."
	@cd docusaurus && npm install
	@echo ""
	@echo "🗄️  Running database migration..."
	@cd auth-service && npm run migrate
	@echo ""
	@echo "✅ Setup complete!"
	@echo "Run 'make start' to start the services"

start: ## Start all services with Docker Compose
	@echo "🚀 Starting documentation portal..."
	@docker compose up -d
	@echo "✅ Services started!"
	@echo "   Auth Service: http://localhost:4000"
	@echo "   Documentation: http://localhost:3000"

stop: ## Stop all services
	@echo "🛑 Stopping documentation portal..."
	@docker compose down
	@echo "✅ Services stopped"

restart: stop start ## Restart all services

sync-docs: ## Sync documentation from all repos
	@./scripts/sync-docs.sh

migrate: ## Run database migration
	@echo "🗄️  Running database migration..."
	@cd auth-service && npm run migrate

logs: ## Show logs from all services
	@docker compose logs -f

logs-auth: ## Show auth service logs
	@docker compose logs -f auth

logs-docs: ## Show docusaurus logs
	@docker compose logs -f docs

dev-auth: ## Start auth service in development mode
	@echo "🔧 Starting auth service in dev mode..."
	@cd auth-service && npm run dev

dev-docs: ## Start docusaurus in development mode
	@echo "🔧 Starting docusaurus in dev mode..."
	@cd docusaurus && npm start

build: ## Build docusaurus for production
	@echo "🏗️  Building docusaurus..."
	@cd docusaurus && npm run build
	@echo "✅ Build complete"

clean: ## Stop services and remove volumes (WARNING: deletes data)
	@echo "⚠️  WARNING: This will delete all user data!"
	@echo "Press Ctrl+C to cancel, or wait 5 seconds to continue..."
	@sleep 5
	@docker compose down -v
	@echo "✅ Cleaned up"

status: ## Show status of services
	@docker compose ps

health: ## Check health of services
	@echo "🏥 Checking service health..."
	@curl -f http://localhost:4000/health && echo " ✅ Auth service healthy" || echo " ❌ Auth service unhealthy"
	@curl -f http://localhost:3000/healthz && echo " ✅ Docs service healthy" || echo " ❌ Docs service unhealthy"

db-connect: ## Connect to docs database
	@docker exec -it infra_postgres psql -U postgres -d docs_portal

db-users: ## List all users
	@docker exec -it infra_postgres psql -U postgres -d docs_portal -c "SELECT id, email, full_name, role, is_active FROM docs_users;"

db-audit: ## View recent audit log
	@docker exec -it infra_postgres psql -U postgres -d docs_portal -c "SELECT u.email, a.action, a.resource, a.timestamp FROM docs_audit_log a JOIN docs_users u ON a.user_id = u.id ORDER BY a.timestamp DESC LIMIT 20;"
