# Azure Deployment Troubleshooting Log
### Finance Tracker MVP — Real errors encountered and fixed during Azure deployment

---

## 1. `The location is restricted from performing this operation` — PostgreSQL Flexible Server

**When it happens:** Running `az postgres flexible-server create` with a specific region.

**What it means:** Azure doesn't have available capacity for PostgreSQL Flexible Server in that region at that time. This is common in popular regions like `eastus` and `westeurope`.

**Fix:** Try a different region by adding `--location` to your command:

```bash
az postgres flexible-server create \
  --resource-group fintrack-rg \
  --name fintrack-db-server \
  --location uksouth \        # try different regions until one works
  --admin-user postgresadmin \
  --admin-password YourSecurePassword123! \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --storage-size 32 \
  --version 16 \
  --yes
```

**Regions to try in order:**
```
westeurope
uksouth
eastus2
centralus
northeurope
australiaeast
```

**Important:** The database region doesn't need to match your resource group region. Azure resources in the same resource group can be in different regions.

---

## 2. `'connect' is misspelled or not recognized by the system` — Azure CLI PostgreSQL connect

**When it happens:** Running `az postgres flexible-server connect`.

**What it means:** The `rdbms-connect` extension isn't installed. The `connect` subcommand requires it.

**Fix — Install the extension:**
```bash
az extension add --name rdbms-connect
```

**If the extension install fails with `Pip failed with status code 2`:**

Use `psql` directly from WSL instead — it's more reliable:

```bash
# Install PostgreSQL client in WSL
sudo apt-get update && sudo apt-get install postgresql-client -y

# Connect directly
psql "postgresql://postgresadmin:YourPassword@fintrack-db-server.postgres.database.azure.com/financetracker?sslmode=require"
```

You should get a `financetracker=#` prompt. This is actually the preferred approach for running schema commands.

---

## 3. `Pip failed with status code 2` — Azure CLI extension install

**When it happens:** Running `az extension add --name rdbms-connect`.

**What it means:** The Azure CLI's internal Python pip installer failed. Usually a dependency conflict or network issue.

**Fix:** Skip the extension entirely and use `psql` directly as shown in error #2 above. For most database tasks, `psql` is more powerful and reliable than the Azure CLI extension anyway.

---

## 4. `AKSCapacityHeavyUsage` — Container Apps environment creation fails

**When it happens:** Running `az containerapp env create`.

**What it means:** Azure Kubernetes Service (which Container Apps runs on) is at capacity in that region. This is a regional infrastructure issue on Azure's side.

**Fix:** Delete the partially created environment and recreate in a different region:

```bash
# Delete the failed environment
az containerapp env delete \
  --name fintrack-env \
  --resource-group fintrack-rg \
  --yes

# Wait for deletion to complete (can take several minutes)
# Check status in a second terminal:
az containerapp env show \
  --name fintrack-env \
  --resource-group fintrack-rg \
  --query "properties.provisioningState" \
  --output tsv

# Recreate in a different region
az containerapp env create \
  --name fintrack-env \
  --resource-group fintrack-rg \
  --location uksouth    # or eastus2, centralus, northeurope
```

**Note:** If the delete command hangs on `\ Running...` for more than 5 minutes, open a second terminal and check the provisioning state. The delete may have completed even though the first terminal didn't update.

---

## 5. `InvalidResourceLocation` — Resource already exists in different location

**When it happens:** Trying to recreate a resource in a new region after a failed attempt.

**What it means:** Azure already has a resource with that name registered in a different region from the failed attempt. You can't create the same name in a different region without deleting the original first.

**Fix:** Delete the existing resource first, then recreate:

```bash
# For Container Apps environment
az containerapp env delete \
  --name fintrack-env \
  --resource-group fintrack-rg \
  --yes

# Then recreate with a different region or different name
az containerapp env create \
  --name fintrack-env \
  --resource-group fintrack-rg \
  --location eastus2
```

**Alternative:** Use a different name entirely to avoid the conflict:
```bash
--name fintrack-env-v2
```

---

## 6. `UNAUTHORIZED: authentication required` — Container App can't pull from ACR

**When it happens:** Running `az containerapp create` and the deployment fails with an image pull error.

**What it means:** The Container App doesn't have valid credentials to pull your image from Azure Container Registry. The `$(az acr credential show...)` subcommand in the create command may not have resolved correctly.

**Fix:** Get your ACR credentials explicitly first, then paste them directly:

```bash
# Get your credentials
az acr credential show \
  --name fintrackregistry \
  --output table
```

This shows your username and two passwords. Copy one of the passwords, then use it directly in your create command:

```bash
az containerapp create \
  --name fintrack-backend \
  --resource-group fintrack-rg \
  --environment fintrack-env \
  --image fintrackregistry.azurecr.io/backend:latest \
  --registry-server fintrackregistry.azurecr.io \
  --registry-username fintrackregistry \
  --registry-password "PASTE_ACTUAL_PASSWORD_HERE" \
  --target-port 5000 \
  --ingress external \
  --min-replicas 1 \
  --max-replicas 1 \
  --env-vars \
    DATABASE_URL="postgresql://postgresadmin:YourPassword@fintrack-db-server.postgres.database.azure.com/financetracker?sslmode=require" \
    JWT_SECRET="your_jwt_secret" \
    NODE_ENV="production" \
    PORT="5000"
```

---

## 7. `curl: (3) URL rejected: Malformed input to a URL function`

**When it happens:** Running curl with a `$()` subcommand to build the URL dynamically.

**What it means:** The subcommand output contains a newline or extra whitespace character that breaks the URL format.

**Fix:** Get the URL separately first, then use it directly:

```bash
# Get the URL
az containerapp show \
  --name fintrack-backend \
  --resource-group fintrack-rg \
  --query "properties.configuration.ingress.fqdn" \
  --output tsv

# Copy the output, then curl it manually
curl https://PASTE_URL_HERE/api/health
```

---

## 8. SSL connection errors after deploying to Azure

**When it happens:** Backend starts but can't connect to Azure PostgreSQL.

**What it means:** Azure PostgreSQL requires SSL. Your local Docker setup had `ssl: false` in `db.js` — that doesn't work against Azure's managed database.

**Fix:** Update `db.js` to enable SSL in production:

```js
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false
});
```

Your `DATABASE_URL` for Azure must also include `?sslmode=require`:
```
postgresql://postgresadmin:password@fintrack-db-server.postgres.database.azure.com/financetracker?sslmode=require
```

---

## General Azure Tips

- **Always specify `--location` explicitly** — don't rely on defaults, capacity varies by region
- **Regional capacity issues are temporary** — if one region fails, try another immediately
- **Delete resources when done for the day** — pay-as-you-go charges accumulate

```bash
# Stop container apps to pause billing
az containerapp stop --name fintrack-backend --resource-group fintrack-rg
az containerapp stop --name fintrack-frontend --resource-group fintrack-rg

# Start them again when needed
az containerapp start --name fintrack-backend --resource-group fintrack-rg
az containerapp start --name fintrack-frontend --resource-group fintrack-rg

# Nuclear option — delete everything
az group delete --name fintrack-rg --yes
```

- **Resource group is your safety net** — everything lives inside `fintrack-rg`, deleting it removes all resources and stops all charges instantly
- **Check provisioning state when commands hang** — open a second terminal and query the resource's `provisioningState` rather than waiting blindly
- **Use `--output table` or `--output tsv`** for readable CLI output instead of the default JSON
