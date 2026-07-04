# ============================================================
# ADOPTIA — Makefile
# Windows: requiere Git Bash o WSL. Alternativa: comandos directos
# documentados en docs/operations/SETUP.md
# ============================================================

.PHONY: help setup dev build test test-watch lint typecheck format \
        render-planning docs-serve docs-build clean

help: ## Lista los comandos disponibles
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

setup: ## Instala dependencias (app + hooks + docs)
	npm install
	pip install pre-commit mkdocs-material || true
	pre-commit install || true

dev: ## Arranca Next.js en desarrollo (http://localhost:3000)
	npm run dev

build: ## Build de producción
	npm run build

test: ## Tests con cobertura (vitest)
	npm run test -- --coverage

test-watch: ## Tests en modo watch
	npm run test -- --watch

lint: ## ESLint + Prettier check
	npm run lint

typecheck: ## TypeScript sin emitir
	npx tsc --noEmit

format: ## Formatea con Prettier
	npx prettier --write .

render-planning: ## Regenera BACKLOG/ROADMAP/PRODUCT_CONTEXT/INDEX desde los items
	python scripts/render_planning.py

docs-serve: ## Sirve el sitio de docs en http://localhost:8000
	mkdocs serve

docs-build: ## Compila el sitio de docs a site/
	mkdocs build

clean: ## Limpia artefactos generados
	rm -rf .next out site coverage node_modules/.cache
