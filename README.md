![CI Pipeline](https://github.com/Omen1907/fintrack-cloud/actions/workflows/ci.yml/badge.svg)

## Live Demo
- Frontend: https://fintrack-frontend.uksouth.azurecontainerapps.io
- API Health: https://fintrack-backend.uksouth.azurecontainerapps.io/api/health
```

### Database setup
docker exec -it finance-tracker-mvp-main-db-1 psql -U postgres
CREATE DATABASE financetracker;
\c financetracker
\i /schema.sql

## Deployment

This app is deployed on Microsoft Azure using:
- **Azure Container Registry** — stores Docker images
- **Azure Container Apps** — runs containerized services
- **Azure Database for PostgreSQL** — managed cloud database

### Architecture
GitHub Push ↓ GitHub Actions (CI) — builds and tests Docker images ↓ Azure Container Registry — stores images ↓ Azure Container Apps — runs frontend + backend ↓ Azure PostgreSQL — managed database