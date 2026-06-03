# Docker Troubleshooting Log
### Finance Tracker MVP — Real errors encountered and fixed

---

## 1. `request returned 500 Internal Server Error` — `dockerDesktopLinuxEngine/_ping`

**When it happens:** Running `docker build` or `docker run` commands.

**What it means:** Docker Desktop is not running. The CLI has nothing to talk to.

**Fix:**
- Open Docker Desktop from the Start Menu
- Wait for the whale icon in the system tray to stop animating
- When it shows "Docker Desktop is running", retry your command

**If Docker Desktop is already open:**
```powershell
# Check WSL 2 is installed and set correctly
wsl --list --verbose

# Should show a distro (e.g. Ubuntu) with VERSION = 2
# If nothing shows, run:
wsl --install
# Then restart your PC
```

---

## 2. `empty compose file`

**When it happens:** Running `docker compose up --build`.

**What it means:** Docker can't find `docker-compose.yml` — either you're in the wrong folder, the file doesn't exist there, or it was saved with the wrong name.

**Fix:**
```powershell
# Check where you are
pwd

# You must be in the PROJECT ROOT (e.g. finance-tracker/)
# NOT inside server/ or client/

# List files to confirm docker-compose.yml is there
ls

# If the file got saved as docker-compose.yml.txt by Windows:
Rename-Item docker-compose.yml.txt docker-compose.yml
```

---

## 3. `Bind for 0.0.0.0:5000 failed: port is already allocated`

**When it happens:** Running `docker compose up --build`.

**What it means:** Something is already using that port — either a leftover container or another process on Windows.

**Fix:**
```powershell
# Stop any leftover containers
docker compose down

# Check what's still running
docker ps

# If a container is still listed, stop it
docker stop <container_id>

# If a Windows process is using the port
netstat -ano | findstr :5000
taskkill /PID <PID_number> /F
```

**Alternative:** Change the host port in `docker-compose.yml`:
```yaml
ports:
  - "5001:5000"   # access via localhost:5001 instead
```

---

## 4. `ECONNREFUSED 127.0.0.1:5432` — Backend can't reach PostgreSQL

**When it happens:** Backend container starts but immediately logs a DB connection error.

**What it means:** Your Node app is trying to connect to `localhost` or `127.0.0.1` for PostgreSQL. Inside Docker, `localhost` means the container itself — not the `db` service.

**Fix:** In your `.env` file, change the `DATABASE_URL` host from `localhost` to `db`:
```
# Wrong
DATABASE_URL=postgresql://postgres:password@localhost:5432/financetracker

# Correct
DATABASE_URL=postgresql://postgres:password@db:5432/financetracker
```

`db` is the service name in `docker-compose.yml` — Docker resolves it as the database container's hostname automatically.

---

## 5. `Error: The server does not support SSL connections`

**When it happens:** After fixing the hostname, backend still fails to connect to PostgreSQL.

**What it means:** Your app is trying to use SSL but the local PostgreSQL Docker container doesn't have SSL configured.

**Fix:** In `db.js`, disable SSL for local development:
```js
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,  // SSL not needed inside Docker's private network
});
```

For production (cloud databases), use:
```js
ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
```

---

## 6. `[dotenv] injecting env (0) from .env` — Environment variables not loading

**When it happens:** Logs show dotenv loading 0 variables, and DB connection falls back to localhost.

**What it means:** Docker can't find your `.env` file, so `DATABASE_URL` is empty and `pg` defaults to localhost.

**Fix:** Pass variables directly in `docker-compose.yml`:
```yaml
services:
  backend:
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/financetracker
      - JWT_SECRET=your_secret
      - NODE_ENV=development
      - PORT=5000
```

Then reference them from a `.env` file at the project root:
```yaml
environment:
  - DATABASE_URL=${DATABASE_URL}
  - JWT_SECRET=${JWT_SECRET}
```

---

## 7. `services.ports must be a mapping` — YAML formatting error

**When it happens:** Running any `docker compose` command.

**What it means:** A service in `docker-compose.yml` has incorrect indentation. YAML is whitespace-sensitive — wrong indentation breaks the entire file structure.

**Fix:** Every property under a service must be indented consistently:
```yaml
# Wrong — build/ports/depends_on at wrong level
  frontend:
  build: ./client
  ports:
    - "5173:5173"

# Correct — all properties indented under the service name
  frontend:
    build: ./client
    ports:
      - "5173:5173"
```

Install the YAML extension in VS Code to catch these before running commands.

---

## 8. `curl: (56) Recv failure: Connection reset by peer`

**When it happens:** Running `curl http://localhost:5001/api/health`.

**What it means:** Two possible causes:
- The route doesn't exist in your server code yet
- The port mapping doesn't match the port your server is actually running on

**Fix — Check the route exists:**
```bash
grep -n "api/health" server/server.js
```

**Fix — Check the port mapping matches:**
Your server runs on `PORT=3000` internally, so your Compose mapping must be:
```yaml
ports:
  - "5001:3000"   # host:container — must match what Node listens on
```

---

## 9. `FATAL: database "financetracker" does not exist`

**When it happens:** Running `docker exec` to connect to PostgreSQL with `-d financetracker`.

**What it means:** The PostgreSQL container started fresh with no databases — your schema was never initialized.

**Fix:**
```bash
# Connect to the default postgres database
docker exec -it <db-container-name> psql -U postgres

# Then inside psql:
CREATE DATABASE financetracker;
\c financetracker

# Then run your CREATE TABLE statements
# Quit when done:
\q
```

**Prevent this in future:** Save your schema to `server/schema.sql` and commit it to your repo so anyone cloning can initialize the database easily.

---

## General Tips

- Always run `docker compose` commands from the **project root** — the folder containing `docker-compose.yml`
- After changing `Dockerfile`, `docker-compose.yml`, `package.json`, or `.env` — always run `docker compose down && docker compose up --build`
- After changing application code only — `docker compose restart backend` is enough (or it hot-reloads if you have nodemon)
- Use `docker compose logs -f backend` to stream live logs when debugging
- Use `docker compose ps` to check which containers are actually running and their port mappings
