# 🏃 MSCMS — Full Run Guide (Backend + Frontend)

This guide gets the whole system running on your machine: the **Spring Boot microservices backend** (via Docker) and the **Next.js frontend** (via npm).

---

## ✅ Prerequisites (already verified on this machine)

| Tool | Needed for | Status |
|------|-----------|--------|
| **Docker Desktop** (v28+) + Docker Compose v2 | Backend | ✅ installed & running |
| **Node.js 18+ / npm** | Frontend | required (check with `node -v`) |
| Internet connection | Pulling Docker images on first run | required |

> ⚠️ Make sure **Docker Desktop is open and running** before the backend steps.

---

## 🧩 What runs where (port map)

| Service | URL | Purpose |
|--------|-----|---------|
| API Gateway | http://localhost:8080 | **Main entry point** (all API + auth) |
| Swagger UI | http://localhost:8080/swagger-ui.html | Interactive API docs |
| Eureka | http://localhost:8761 | Service registry (all services should be `UP`) |
| Keycloak admin | http://localhost:8443 | Identity provider — login `admin` / `admin123` |
| ML — Match predictor | http://localhost:9000/docs | FastAPI (debug only) |
| ML — Player rating | http://localhost:9001/docs | FastAPI (debug only) |
| **Frontend** | http://localhost:3000 | The Next.js web app |
| Postgres / Kafka / RabbitMQ | 5432 / 9092 / 5672 | Infrastructure (internal) |

---

# PART 1 — Run the Backend (Docker) — BUILT FROM LOCAL SOURCE

We build every app image **from the local source code** — nothing is pulled from GHCR / Docker Hub except the official infrastructure base images (Postgres, Kafka, RabbitMQ, Keycloak), which have no local source.

This uses two files together:
- `docker-compose.full.yml` — the full stack definition.
- `docker-compose.build.yml` — a small override that adds a `build:` directive to the services that were image-only (Eureka, Config Server, Gateway, and the 2 ML services). The 6 domain microservices already build from source.

> 💡 **How the build works:** each service's `Dockerfile` is multi-stage — Stage 1 runs `mvn clean package` inside a Maven + JDK 21 image, Stage 2 copies the jar into a slim JRE. So **you do NOT need Java or Maven installed** — Docker compiles everything. The ML services build from the sibling `../sportify-main` repo.

### Step 1 — Open a terminal in the backend folder

The compose file mounts `./init-db.sql` and `./keycloak/mscms-realm.json` using **relative paths**, so you **must run it from inside the `MSCMS-main` folder**.

```powershell
cd D:\Project-final-repo\MSCMS-main
```

### Step 2 — Build all images from local source (first run / after code changes)

```powershell
docker compose -f docker-compose.full.yml -f docker-compose.build.yml build
```

First build takes a while (downloads Maven dependencies + compiles all 9 Java services). Subsequent builds are cached and fast.

### Step 3 — Start everything

```powershell
docker compose -f docker-compose.full.yml -f docker-compose.build.yml up -d
```

> You can combine Steps 2 + 3 into one command with `up -d --build`.

Then **wait 2–3 minutes** for all services to start, register with Eureka, and become healthy. Services start in dependency order (Eureka → Config Server → Keycloak/Postgres → Gateway → microservices).

> After changing any service's source code, rebuild just that one, e.g.:
> ```powershell
> docker compose -f docker-compose.full.yml -f docker-compose.build.yml up -d --build user-management-service
> ```

### Step 4 — Verify it's up

1. Open **http://localhost:8761** → you should see all services listed as `UP`.
2. Open **http://localhost:8080/swagger-ui.html** → the API docs load.

If only some services show up, wait a bit longer (slower machines take more time) or check logs (below).

### What you get automatically (seeded demo data)

On first run each service seeds demo data (`APP_SEED_ENABLED=true`): 17 users across every role, 6 sports, 4 teams, rosters, contracts, training sessions, matches, injuries, analytics, etc. Seeding is idempotent (restarts won't duplicate).

### Login credentials (demo users)

All passwords are **`password123`**, except admin is **`admin123`**.

| Username | Password | Role |
|----------|----------|------|
| `admin` | `admin123` | ADMIN (full access) |
| `sportmanager` | `password123` | SPORT_MANAGER |
| `teammanager` | `password123` | TEAM_MANAGER |
| `headcoach` | `password123` | HEAD_COACH (football) |
| `headcoach2` | `password123` | HEAD_COACH (basketball) |
| `doctor` | `password123` | TEAM_DOCTOR |
| `physio` | `password123` | PHYSIOTHERAPIST |
| `fitness` | `password123` | FITNESS_COACH |
| `scout` | `password123` | SCOUT |
| `sponsor` | `password123` | SPONSOR |
| `fan` | `password123` | FAN (read-only) |
| `player1`…`player6` | `password123` | PLAYER |

---

# PART 2 — Run the Frontend (Next.js)

The active frontend is **`sports-club-main/my-app`**. It talks to the gateway at `http://localhost:8080` (hardcoded in `src/lib/api.js`), so **the backend must be running first.**

### Step 1 — Open a new terminal in the frontend folder

```powershell
cd D:\Project-final-repo\sports-club-main\my-app
```

### Step 2 — Install dependencies (first run only)

```powershell
npm install
```

### Step 3 — Start the dev server

```powershell
npm run dev
```

### Step 4 — Open the app

Go to **http://localhost:3000** and log in with any demo user above (e.g. `admin` / `admin123`).

> The frontend proxies the ML services through Next.js rewrites (`/ml-proxy/match/*` → `localhost:9000`, `/ml-proxy/player/*` → `localhost:9001`), so the ML containers from Part 1 must be running for the ML pages to work.

---

## 🛑 Useful backend commands

Run these from `D:\Project-final-repo\MSCMS-main`. (For `down`/`logs` you can use just `-f docker-compose.full.yml`; the build override only matters when building.)

```powershell
# View logs of a service
docker compose -f docker-compose.full.yml logs -f gateway-service

# Restart a single service
docker compose -f docker-compose.full.yml restart user-management-service

# Stop everything (keeps data)
docker compose -f docker-compose.full.yml down

# Stop AND wipe all data (fresh start — re-seeds on next up)
docker compose -f docker-compose.full.yml down -v

# Rebuild from local source after code changes, and restart
docker compose -f docker-compose.full.yml -f docker-compose.build.yml up -d --build
```

---

## ⚠️ Troubleshooting

| Problem | Fix |
|---------|-----|
| Only some services show in Eureka | Wait 2–3 more minutes; check `docker compose -f docker-compose.full.yml logs -f <service>` |
| Login returns 401 | Make sure all services are `UP` in Eureka first; use exact credentials |
| Database errors / weird state | `docker compose -f docker-compose.full.yml down -v` then `up -d` for a clean DB |
| Port already in use | Stop whatever is using 8080/8761/8443/5432/3000, or change the host port mapping |
| Frontend can't reach backend | Confirm gateway is up at http://localhost:8080/swagger-ui.html before starting the frontend |
| `npm run dev` fails | Ensure Node 18+ (`node -v`); delete `node_modules` + `package-lock.json` and re-run `npm install` |

---

## 📌 Quick recap (TL;DR)

```powershell
# 1) Backend (built from local source)
cd D:\Project-final-repo\MSCMS-main
docker compose -f docker-compose.full.yml -f docker-compose.build.yml up -d --build
#   wait ~2-3 min, check http://localhost:8761

# 2) Frontend (new terminal)
cd D:\Project-final-repo\sports-club-main\my-app
npm install
npm run dev
#   open http://localhost:3000  (login: admin / admin123)
```
</content>
