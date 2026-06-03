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
GitHub Push ↓ GitHub Actions (CI) — builds and tests Docker images ↓ Azure Container Registry — stores images ↓ Azure Container Apps — runs frontend + backend ↓ Azure PostgreSQL — managed database# Finance Tracker MVP

![CI Pipeline](https://github.com/Omen1907/fintrack-cloud/actions/workflows/ci.yml/badge.svg)

A full-stack personal finance tracking app containerized with Docker and deployed to Microsoft Azure.

## Stack

- React + Vite (frontend)
- Node.js + Express (backend)
- PostgreSQL (database)
- Docker + Docker Compose
- GitHub Actions (CI/CD)
- Azure Container Apps (deployment)
- Terraform (infrastructure as code)

---

## Live Demo

- **Frontend:** https://fintrack-frontend-tf.uksouth.azurecontainerapps.io
- **API Health:** https://fintrack-backend-tf.uksouth.azurecontainerapps.io/api/health

---

## Project Structure

```text
finance-tracker/
├── client/                        # React frontend
│   ├── src/
│   │   ├── components/
│   │   └── main.jsx
│   ├── Dockerfile                 # Multi-stage build (Node → Nginx)
│   ├── nginx.conf                 # Nginx config for React Router
│   └── .dockerignore
├── server/                        # Node.js backend
│   ├── server.js
│   ├── db.js
│   ├── schema.sql                 # Database schema
│   ├── Dockerfile                 # Multi-stage build
│   └── .dockerignore
├── terraform/                     # Infrastructure as Code
│   ├── main.tf                    # Azure resources
│   ├── variables.tf               # Input variables
│   ├── outputs.tf                 # Output values (URLs etc.)
│   └── terraform.tfvars           # Secret values — never commit
├── .github/
│   └── workflows/
│       └── ci.yml                 # CI pipeline
├── docker-compose.yml             # Local development
├── TROUBLESHOOTING.md             # Docker troubleshooting log
├── AZURE_TROUBLESHOOTING.md       # Azure troubleshooting log
├── .env                           # Never commit this
├── .env.example                   # Commit this instead
└── .gitignore
```

---

## Architecture

```
GitHub Push
    ↓
GitHub Actions CI — builds all containers, runs health checks
    ↓
Azure Container Registry — stores Docker images
    ↓
Azure Container Apps — runs frontend + backend
    ↓
Azure Database for PostgreSQL — managed database
```

### Docker Image Sizes (multi-stage builds)

| Service  | Before | After  |
|----------|--------|--------|
| Backend  | ~210MB | 51.7MB |
| Frontend | ~350MB | 26.1MB |

---

## Running Locally with Docker

### Prerequisites

- Docker Desktop with WSL 2 enabled
- WSL 2 Linux distro (Ubuntu recommended)

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/Omen1907/fintrack-cloud
cd fintrack-cloud

# 2. Copy the example env file and fill in your values
cp .env.example .env

# 3. Start all containers
docker compose up --build
```

### Services

| Service  | URL                   |
|----------|-----------------------|
| Frontend | http://localhost:5173 |
| Backend  | http://localhost:5001 |
| Database | localhost:5432        |

### Database Initialization

On first run, create the database and schema:

```bash
# Connect to PostgreSQL container
docker exec -it finance-tracker-mvp-main-db-1 psql -U postgres

# Inside psql:
CREATE DATABASE financetracker;
\c financetracker

# Paste contents of server/schema.sql, then:
\q
```

---

## Health Check

```bash
curl http://localhost:5001/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-01-01T00:00:00.000Z",
  "service": "finance-tracker-backend",
  "environment": "development"
}
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=financetracker
DATABASE_URL=postgresql://postgres:your_secure_password@db:5432/financetracker
JWT_SECRET=your_jwt_secret
PORT=5000
NODE_ENV=development
```

Never commit your `.env` file. It is listed in `.gitignore`.

---

## Deploying to Azure with Terraform

### Prerequisites

- Azure CLI installed and logged in (`az login`)
- Terraform installed
- Docker images pushed to Azure Container Registry

### Setup

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars  # fill in your values
terraform init
terraform plan
terraform apply
```

### Important — push images before applying

The Container Registry must exist and have images before the Container Apps are created:

```bash
# Step 1: Create registry first
terraform apply -target="azurerm_resource_group.main" -target="azurerm_container_registry.acr"

# Step 2: Push images
az acr login --name fintrackregistrytf
docker push fintrackregistrytf.azurecr.io/backend:latest
docker push fintrackregistrytf.azurecr.io/frontend:latest

# Step 3: Apply everything else
terraform apply
```

### Tear down all Azure resources

```bash
terraform destroy
```

One command removes everything and stops all charges.

---

## CI/CD Pipeline

GitHub Actions runs automatically on every push to `main`:

1. Checkout code
2. Create `.env` from GitHub Secrets
3. Build all Docker images
4. Start all containers
5. Wait for backend to be ready
6. Hit `/api/health` — fail pipeline if not 200
7. Print logs on failure
8. Tear down containers

---

## Useful Commands

| Command | Description |
|---|---|
| `docker compose up --build` | Start all containers and rebuild images |
| `docker compose up --build -d` | Start in background (detached) |
| `docker compose down` | Stop and remove containers |
| `docker compose down -v` | Stop and wipe database |
| `docker compose logs -f backend` | Stream live backend logs |
| `docker compose logs --tail=50 backend` | See last 50 lines of backend logs |
| `docker compose ps` | Check running containers and ports |
| `docker compose restart backend` | Restart backend without full rebuild |
| `docker stats` | Monitor CPU and memory usage live |
| `terraform plan` | Preview infrastructure changes |
| `terraform apply` | Deploy infrastructure to Azure |
| `terraform destroy` | Remove all Azure resources |

---

## Ops Commands (via WSL)

```bash
# Shell into the backend container
docker exec -it finance-tracker-mvp-main-backend-1 sh

# Shell into the database container
docker exec -it finance-tracker-mvp-main-db-1 psql -U postgres -d financetracker

# Check environment variables are injected correctly
docker exec -it finance-tracker-mvp-main-backend-1 sh -c "printenv DATABASE_URL"

# Pretty print health check response
curl http://localhost:5001/api/health | python3 -m json.tool

# Check HTTP status code only
curl -o /dev/null -s -w "%{http_code}\n" http://localhost:5001/api/health
```

---

## Troubleshooting

- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) — Docker errors and fixes
- [AZURE_TROUBLESHOOTING.md](./AZURE_TROUBLESHOOTING.md) — Azure deployment errors and fixes

Common issues at a glance:

- **Docker commands fail immediately** — Docker Desktop is not running. Open it and wait for the whale icon to settle.
- **`empty compose file`** — You're not in the project root. Run `pwd` and `ls` to verify.
- **`ECONNREFUSED 127.0.0.1:5432`** — Your `DATABASE_URL` uses `localhost` instead of `db`. Change it to `@db:5432`.
- **`SSL not supported`** — Set `ssl: false` in `db.js` for local Docker development.
- **Port already allocated** — Run `docker compose down` then retry.
- **Azure regional capacity errors** — Try a different `--location`. See AZURE_TROUBLESHOOTING.md.
- **Terraform container app image not found** — Push images to ACR before running `terraform apply`. Use `-target` to create the registry first.
