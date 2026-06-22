# 🚀 MSCMS — Complete Setup Guide (Docker Only)

This file contains **everything** you need to run the entire Multi-Sport Club Management System on a fresh machine with only Docker installed. No source code, no IDE, no Java needed.

---

## 📋 Prerequisites

- **Docker Desktop** installed and running.
- Internet connection (to pull images).

---

## 🛠️ Step 1: Create a Project Folder

```bash
mkdir mscms
cd mscms
```

---

## 📄 Step 2: Create the Required Files

You need to create **3 files** inside the `mscms` folder. Copy-paste each one exactly.

---

### File 1: `docker-compose.yml`

Create a file called `docker-compose.yml` and paste this:

```yaml
services:
  # --- Infrastructure ---
  postgres:
    image: postgres:14
    container_name: postgres
    environment:
      POSTGRES_USER: embarkx
      POSTGRES_PASSWORD: embarkx
    volumes:
      - ./init-db.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U embarkx"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - mscms-network

  rabbitmq:
    image: rabbitmq:3-management
    container_name: rabbitmq
    ports:
      - "5672:5672"
      - "15672:15672"
    networks:
      - mscms-network

  kafka:
    image: confluentinc/cp-kafka:7.5.0
    container_name: kafka
    environment:
      KAFKA_NODE_ID: 1
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT
      KAFKA_LISTENERS: PLAINTEXT://0.0.0.0:9092,CONTROLLER://0.0.0.0:9093
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:9092
      KAFKA_PROCESS_ROLES: broker,controller
      KAFKA_CONTROLLER_QUORUM_VOTERS: 1@kafka:9093
      KAFKA_CONTROLLER_LISTENER_NAMES: CONTROLLER
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      CLUSTER_ID: MkU3OEVBNTcwNTJENDM2Qk
    ports:
      - "9092:9092"
    networks:
      - mscms-network

  keycloak:
    image: quay.io/keycloak/keycloak:26.2.5
    container_name: keycloak
    environment:
      KC_BOOTSTRAP_ADMIN_USERNAME: admin
      KC_BOOTSTRAP_ADMIN_PASSWORD: admin123
    command: ["start-dev", "--import-realm"]
    volumes:
      - ./keycloak/mscms-realm.json:/opt/keycloak/data/import/mscms-realm.json
    ports:
      - "8443:8080"
    healthcheck:
      test: ["CMD-SHELL", "exec 3<>/dev/tcp/localhost/8080 && echo done"]
      interval: 10s
      timeout: 5s
      retries: 12
    networks:
      - mscms-network

  redis:
    image: redis:7-alpine
    container_name: redis
    ports:
      - "6379:6379"
    networks:
      - mscms-network

  # --- Spring Cloud Infrastructure ---
  eureka-server:
    image: ghcr.io/tefaa1/mscms/eureka-server:latest
    container_name: eureka-server
    ports:
      - "8761:8761"
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:8761/actuator/health || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 10
    networks:
      - mscms-network

  config-server:
    image: ghcr.io/tefaa1/mscms/config-server:latest
    container_name: config-server
    ports:
      - "8082:8082"
    depends_on:
      eureka-server:
        condition: service_healthy
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:8082/actuator/health || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 10
    networks:
      - mscms-network

  gateway-service:
    image: ghcr.io/tefaa1/mscms/gateway-service:latest
    container_name: gateway-service
    restart: on-failure
    ports:
      - "8080:8080"
    environment:
      - SPRING_CONFIG_IMPORT=optional:configserver:http://config-server:8082
      - SPRING_DATA_REDIS_HOST=redis
    depends_on:
      config-server:
        condition: service_healthy
      keycloak:
        condition: service_healthy
      redis:
        condition: service_started
    networks:
      - mscms-network

  # --- Microservices ---
  user-management-service:
    image: ghcr.io/tefaa1/mscms/user-management-service:latest
    container_name: user-management-service
    restart: on-failure
    environment:
      - SPRING_CONFIG_IMPORT=optional:configserver:http://config-server:8082
      - DB_URI=jdbc:postgresql://postgres:5432/mscms_user
      - DB_USER=embarkx
      - DB_PASSWORD=embarkx
      - EUREKA_CLIENT_SERVICEURL_DEFAULTZONE=http://eureka-server:8761/eureka/
      - KEYCLOAK_USER=admin
      - KEYCLOAK_PASSWORD=admin123
      - KEYCLOAK_REALM=mscms
      - APP_ADMIN_KEYCLOAK_ID=00000000-0000-0000-0000-000000000001
      - APP_ADMIN_FIRST_NAME=Admin
      - APP_ADMIN_LAST_NAME=User
      - APP_ADMIN_USERNAME=admin
      - APP_ADMIN_EMAIL=admin@mscms.com
      - APP_ADMIN_PASSWORD=admin123
      - APP_ADMIN_PHONE=0000000000
      - APP_ADMIN_AGE=30
      - APP_ADMIN_GENDER=MALE
      - APP_ADMIN_ADDRESS=System
      - APP_ADMIN_BLOOD_TYPE=O_POSITIVE
      - APP_ADMIN_ROLE=ADMIN
      - APP_ADMIN_CREATE_DEFAULT=true
      - APP_SEED_ENABLED=true
    depends_on:
      config-server:
        condition: service_healthy
      postgres:
        condition: service_healthy
      keycloak:
        condition: service_healthy
    networks:
      - mscms-network

  player-management-service:
    image: ghcr.io/tefaa1/mscms/player-management-service:latest
    container_name: player-management-service
    restart: on-failure
    environment:
      - SPRING_CONFIG_IMPORT=optional:configserver:http://config-server:8082
      - DB_URI=jdbc:postgresql://postgres:5432/mscms_player
      - DB_USER=embarkx
      - DB_PASSWORD=embarkx
      - EUREKA_CLIENT_SERVICEURL_DEFAULTZONE=http://eureka-server:8761/eureka/
      - APP_SEED_ENABLED=true
    depends_on:
      config-server:
        condition: service_healthy
      postgres:
        condition: service_healthy
    networks:
      - mscms-network

  training-match-service:
    image: ghcr.io/tefaa1/mscms/training-match-service:latest
    container_name: training-match-service
    restart: on-failure
    environment:
      - SPRING_CONFIG_IMPORT=optional:configserver:http://config-server:8082
      - DB_URI=jdbc:postgresql://postgres:5432/mscms_training
      - DB_USER=embarkx
      - DB_PASSWORD=embarkx
      - EUREKA_CLIENT_SERVICEURL_DEFAULTZONE=http://eureka-server:8761/eureka/
      - APP_SEED_ENABLED=true
    depends_on:
      config-server:
        condition: service_healthy
      postgres:
        condition: service_healthy
    networks:
      - mscms-network

  medical-fitness-service:
    image: ghcr.io/tefaa1/mscms/medical-fitness-service:latest
    container_name: medical-fitness-service
    restart: on-failure
    environment:
      - SPRING_CONFIG_IMPORT=optional:configserver:http://config-server:8082
      - DB_URI=jdbc:postgresql://postgres:5432/mscms_medical
      - DB_USER=embarkx
      - DB_PASSWORD=embarkx
      - EUREKA_CLIENT_SERVICEURL_DEFAULTZONE=http://eureka-server:8761/eureka/
      - APP_SEED_ENABLED=true
    depends_on:
      config-server:
        condition: service_healthy
      postgres:
        condition: service_healthy
    networks:
      - mscms-network

  notification-mail-service:
    image: ghcr.io/tefaa1/mscms/notification-mail-service:latest
    container_name: notification-mail-service
    restart: on-failure
    environment:
      - SPRING_CONFIG_IMPORT=optional:configserver:http://config-server:8082
      - DB_URI=jdbc:postgresql://postgres:5432/mscms_notification
      - DB_USER=embarkx
      - DB_PASSWORD=embarkx
      - EUREKA_CLIENT_SERVICEURL_DEFAULTZONE=http://eureka-server:8761/eureka/
    depends_on:
      config-server:
        condition: service_healthy
      postgres:
        condition: service_healthy
      kafka:
        condition: service_started
    networks:
      - mscms-network

  reports-analytics-service:
    image: ghcr.io/tefaa1/mscms/reports-analytics-service:latest
    container_name: reports-analytics-service
    restart: on-failure
    environment:
      - SPRING_CONFIG_IMPORT=optional:configserver:http://config-server:8082
      - DB_URI=jdbc:postgresql://postgres:5432/mscms_reports
      - DB_USER=embarkx
      - DB_PASSWORD=embarkx
      - EUREKA_CLIENT_SERVICEURL_DEFAULTZONE=http://eureka-server:8761/eureka/
      - APP_SEED_ENABLED=true
    depends_on:
      config-server:
        condition: service_healthy
      postgres:
        condition: service_healthy
    networks:
      - mscms-network

  # --- Machine Learning Models (Python / FastAPI) ---
  # Both containers share the same image but run different FastAPI apps
  # selected by working_dir. Exposed only inside mscms-network — the gateway
  # is the public entry point (JWT + RBAC). Host ports are kept for direct
  # debugging via Swagger UI.
  ml-match-predictor:
    image: shahod/sportify:latest
    container_name: ml-match-predictor
    working_dir: "/app/Predict Matches"
    command: ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
    ports:
      - "9000:8000"
    networks:
      - mscms-network

  ml-player-rating:
    image: shahod/sportify:latest
    container_name: ml-player-rating
    working_dir: "/app/Evaluate Players"
    command: ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
    ports:
      - "9001:8000"
    networks:
      - mscms-network

networks:
  mscms-network:
    driver: bridge
```

---

### File 2: `init-db.sql`

Create a file called `init-db.sql` and paste this:

```sql
CREATE DATABASE mscms_user;
CREATE DATABASE mscms_player;
CREATE DATABASE mscms_training;
CREATE DATABASE mscms_medical;
CREATE DATABASE mscms_notification;
CREATE DATABASE mscms_reports;

GRANT ALL PRIVILEGES ON DATABASE mscms_user TO embarkx;
GRANT ALL PRIVILEGES ON DATABASE mscms_player TO embarkx;
GRANT ALL PRIVILEGES ON DATABASE mscms_training TO embarkx;
GRANT ALL PRIVILEGES ON DATABASE mscms_medical TO embarkx;
GRANT ALL PRIVILEGES ON DATABASE mscms_notification TO embarkx;
GRANT ALL PRIVILEGES ON DATABASE mscms_reports TO embarkx;
```

---

### File 3: `keycloak/mscms-realm.json`

First create the folder, then the file:

```bash
mkdir keycloak
```

Create `keycloak/mscms-realm.json` and paste this:

```json
{
  "realm": "mscms",
  "enabled": true,
  "sslRequired": "none",
  "registrationAllowed": true,
  "loginWithEmailAllowed": true,
  "duplicateEmailsAllowed": false,
  "resetPasswordAllowed": true,
  "editUsernameAllowed": false,
  "bruteForceProtected": false,
  "accessTokenLifespan": 604800,
  "ssoSessionIdleTimeout": 1800,
  "ssoSessionMaxLifespan": 36000,
  "roles": {
    "realm": [
      { "name": "ADMIN", "description": "Administrator role" },
      { "name": "COACH", "description": "Coach role" },
      { "name": "PLAYER", "description": "Player role" },
      { "name": "SCOUT", "description": "Scout role" },
      { "name": "SPONSOR", "description": "Sponsor role" },
      { "name": "FAN", "description": "Fan role" },
      { "name": "STAFF", "description": "Staff role" },
      { "name": "SPORT_MANAGER", "description": "Sport Manager role" },
      { "name": "TEAM_MANAGER", "description": "Team Manager role" },
      { "name": "HEAD_COACH", "description": "Head Coach role" },
      { "name": "ASSISTANT_COACH", "description": "Assistant Coach role" },
      { "name": "SPECIFIC_COACH", "description": "Specific Coach role" },
      { "name": "DOCTOR", "description": "Doctor role" },
      { "name": "PHYSIOTHERAPIST", "description": "Physiotherapist role" },
      { "name": "FITNESS_COACH", "description": "Fitness Coach role" },
      { "name": "PERFORMANCE_ANALYST", "description": "Performance Analyst role" },
      { "name": "TEAM_DOCTOR", "description": "Team Doctor role" },
      { "name": "NATIONAL_TEAM", "description": "National Team role" }
    ]
  },
  "clients": [
    {
      "clientId": "mscms-frontend",
      "name": "MSCMS Frontend App",
      "enabled": true,
      "publicClient": true,
      "standardFlowEnabled": true,
      "directAccessGrantsEnabled": true,
      "redirectUris": [
        "http://localhost:3000/*",
        "http://localhost:5173/*",
        "http://localhost:4200/*",
        "http://localhost:8080/*"
      ],
      "webOrigins": [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:4200",
        "http://localhost:8080",
        "*"
      ],
      "protocol": "openid-connect"
    }
  ],
  "users": [
    {
      "id": "00000000-0000-0000-0000-000000000001",
      "username": "admin", "email": "admin@mscms.com", "firstName": "Admin", "lastName": "User",
      "enabled": true, "emailVerified": true,
      "credentials": [{ "type": "password", "value": "admin123", "temporary": false }],
      "realmRoles": ["ADMIN"],
      "clientRoles": {
        "realm-management": ["realm-admin","manage-users","query-users","query-groups","manage-clients","view-users"]
      }
    },
    {
      "id": "00000000-0000-0000-0000-000000000010",
      "username": "sportmanager", "email": "sportmanager@mscms.com", "firstName": "Samir", "lastName": "Manager",
      "enabled": true, "emailVerified": true,
      "credentials": [{ "type": "password", "value": "password123", "temporary": false }],
      "realmRoles": ["SPORT_MANAGER"]
    },
    {
      "id": "00000000-0000-0000-0000-000000000011",
      "username": "teammanager", "email": "teammanager@mscms.com", "firstName": "Tarek", "lastName": "Manager",
      "enabled": true, "emailVerified": true,
      "credentials": [{ "type": "password", "value": "password123", "temporary": false }],
      "realmRoles": ["TEAM_MANAGER"]
    },
    {
      "id": "00000000-0000-0000-0000-000000000020",
      "username": "headcoach", "email": "headcoach@mscms.com", "firstName": "Hassan", "lastName": "Coach",
      "enabled": true, "emailVerified": true,
      "credentials": [{ "type": "password", "value": "password123", "temporary": false }],
      "realmRoles": ["STAFF", "HEAD_COACH", "COACH"]
    },
    {
      "id": "00000000-0000-0000-0000-000000000021",
      "username": "headcoach2", "email": "headcoach2@mscms.com", "firstName": "Karim", "lastName": "BasketCoach",
      "enabled": true, "emailVerified": true,
      "credentials": [{ "type": "password", "value": "password123", "temporary": false }],
      "realmRoles": ["STAFF", "HEAD_COACH", "COACH"]
    },
    {
      "id": "00000000-0000-0000-0000-000000000030",
      "username": "doctor", "email": "doctor@mscms.com", "firstName": "Dalia", "lastName": "Doctor",
      "enabled": true, "emailVerified": true,
      "credentials": [{ "type": "password", "value": "password123", "temporary": false }],
      "realmRoles": ["STAFF", "TEAM_DOCTOR", "DOCTOR"]
    },
    {
      "id": "00000000-0000-0000-0000-000000000031",
      "username": "physio", "email": "physio@mscms.com", "firstName": "Pierre", "lastName": "Physio",
      "enabled": true, "emailVerified": true,
      "credentials": [{ "type": "password", "value": "password123", "temporary": false }],
      "realmRoles": ["STAFF", "PHYSIOTHERAPIST"]
    },
    {
      "id": "00000000-0000-0000-0000-000000000032",
      "username": "fitness", "email": "fitness@mscms.com", "firstName": "Fadi", "lastName": "Fitness",
      "enabled": true, "emailVerified": true,
      "credentials": [{ "type": "password", "value": "password123", "temporary": false }],
      "realmRoles": ["STAFF", "FITNESS_COACH"]
    },
    {
      "id": "00000000-0000-0000-0000-000000000040",
      "username": "scout", "email": "scout@mscms.com", "firstName": "Sami", "lastName": "Scout",
      "enabled": true, "emailVerified": true,
      "credentials": [{ "type": "password", "value": "password123", "temporary": false }],
      "realmRoles": ["SCOUT"]
    },
    {
      "id": "00000000-0000-0000-0000-000000000041",
      "username": "sponsor", "email": "sponsor@mscms.com", "firstName": "Sara", "lastName": "Sponsor",
      "enabled": true, "emailVerified": true,
      "credentials": [{ "type": "password", "value": "password123", "temporary": false }],
      "realmRoles": ["SPONSOR"]
    },
    {
      "id": "00000000-0000-0000-0000-000000000042",
      "username": "fan", "email": "fan@mscms.com", "firstName": "Farid", "lastName": "Fan",
      "enabled": true, "emailVerified": true,
      "credentials": [{ "type": "password", "value": "password123", "temporary": false }],
      "realmRoles": ["FAN"]
    },
    {
      "id": "00000000-0000-0000-0000-000000000101",
      "username": "player1", "email": "player1@mscms.com", "firstName": "Mohamed", "lastName": "Salah",
      "enabled": true, "emailVerified": true,
      "credentials": [{ "type": "password", "value": "password123", "temporary": false }],
      "realmRoles": ["PLAYER"]
    },
    {
      "id": "00000000-0000-0000-0000-000000000102",
      "username": "player2", "email": "player2@mscms.com", "firstName": "Ahmed", "lastName": "Hegazy",
      "enabled": true, "emailVerified": true,
      "credentials": [{ "type": "password", "value": "password123", "temporary": false }],
      "realmRoles": ["PLAYER"]
    },
    {
      "id": "00000000-0000-0000-0000-000000000103",
      "username": "player3", "email": "player3@mscms.com", "firstName": "Omar", "lastName": "Defender",
      "enabled": true, "emailVerified": true,
      "credentials": [{ "type": "password", "value": "password123", "temporary": false }],
      "realmRoles": ["PLAYER"]
    },
    {
      "id": "00000000-0000-0000-0000-000000000104",
      "username": "player4", "email": "player4@mscms.com", "firstName": "Mahmoud", "lastName": "Keeper",
      "enabled": true, "emailVerified": true,
      "credentials": [{ "type": "password", "value": "password123", "temporary": false }],
      "realmRoles": ["PLAYER"]
    },
    {
      "id": "00000000-0000-0000-0000-000000000105",
      "username": "player5", "email": "player5@mscms.com", "firstName": "Yousef", "lastName": "Basket",
      "enabled": true, "emailVerified": true,
      "credentials": [{ "type": "password", "value": "password123", "temporary": false }],
      "realmRoles": ["PLAYER"]
    },
    {
      "id": "00000000-0000-0000-0000-000000000106",
      "username": "player6", "email": "player6@mscms.com", "firstName": "Layla", "lastName": "Tennis",
      "enabled": true, "emailVerified": true,
      "credentials": [{ "type": "password", "value": "password123", "temporary": false }],
      "realmRoles": ["PLAYER"]
    }
  ]
}
```

---

## 📁 Final Folder Structure

Your `mscms` folder should look like this:

```
mscms/
├── docker-compose.yml
├── init-db.sql
└── keycloak/
    └── mscms-realm.json
```

---

## 📥 Step 3: Pull the Docker Images

```bash
docker compose pull
```

This downloads all pre-built images from GitHub Container Registry (GHCR). No login required.

---

## 🚀 Step 4: Start Everything

```bash
docker compose up -d
```

Wait **2–3 minutes** for all services to start and register with each other.

---

## ✅ Step 5: Verify It's Running

| What | URL | Notes |
| :--- | :--- | :--- |
| **Eureka Dashboard** | http://localhost:8761 | All 8 services should show as `UP` |
| **Swagger UI (API Docs)** | http://localhost:8080/swagger-ui.html | Interactive API testing |
| **Keycloak Admin** | http://localhost:8443 | User: `admin` / Pass: `admin123` |
| **ML — Match Predictor Swagger** | http://localhost:9000/docs | FastAPI direct (debugging) |
| **ML — Player Rating Swagger** | http://localhost:9001/docs | FastAPI direct (debugging) |

---

## 🔐 How to Authenticate

### Default Admin Account
- **Username:** `admin`
- **Password:** `admin123`

### Login (get JWT token)
```
POST http://localhost:8080/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```
The response will contain an `access_token`. Use it in all subsequent requests.

> **Note for frontend developers:** Always use the gateway's `/auth/login` endpoint to obtain tokens — do **not** call Keycloak directly at `localhost:8443`. The gateway gets tokens from the internal Keycloak and the JWT issuer must match the internal URL. Tokens obtained from `/auth/login` work seamlessly with all API endpoints.

### Signup (create a new FAN user)
```
POST http://localhost:8080/auth/signup
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "MyPassword123",
  "firstName": "John",
  "lastName": "Doe",
  "displayName": "JohnDoe",
  "phone": "+1234567890",
  "age": 25,
  "gender": "MALE",
  "address": "123 Main St",
  "bloodType": "O_POSITIVE"
}
```
Signup always creates a **FAN** role. To create users with other roles, use the admin endpoint:

### Admin: Create user with specific role
```
POST http://localhost:8080/auth/admin/create-user
Authorization: Bearer <ADMIN_TOKEN>
Content-Type: application/json

{
  "username": "coachsmith",
  "email": "coach@example.com",
  "password": "CoachPass123",
  "firstName": "Coach",
  "lastName": "Smith",
  "displayName": "CoachSmith",
  "phone": "+1987654321",
  "age": 40,
  "gender": "MALE",
  "address": "456 Stadium Rd",
  "bloodType": "A_POSITIVE",
  "role": "HEAD_COACH"
}
```
Available roles: `ADMIN`, `COACH`, `PLAYER`, `SCOUT`, `SPONSOR`, `FAN`, `STAFF`, `SPORT_MANAGER`, `TEAM_MANAGER`, `HEAD_COACH`, `ASSISTANT_COACH`, `SPECIFIC_COACH`, `DOCTOR`, `PHYSIOTHERAPIST`, `FITNESS_COACH`, `PERFORMANCE_ANALYST`, `TEAM_DOCTOR`, `NATIONAL_TEAM`

### Using the Token
Add this header to every request:
```
Authorization: Bearer <YOUR_TOKEN_HERE>
```

---

## 🌱 Seeded Demo Data (auto-loaded on first run)

When `APP_SEED_ENABLED=true` (the default in `docker-compose.yml`), each service automatically inserts demo data into its database **the first time it starts** against an empty schema. The seeders are **idempotent** — they check if data already exists and skip if so, so restarts won't duplicate anything.

If you want to start clean again, wipe the Postgres volume:
```bash
docker compose down -v
docker compose up -d
```

To disable seeding entirely, set `APP_SEED_ENABLED=false` on each service.

### Login credentials for every role

All demo passwords are **`password123`** (except `admin` which is `admin123`).

| Username | Password | Role(s) | Purpose |
| :--- | :--- | :--- | :--- |
| `admin` | `admin123` | ADMIN | Full access, can create users |
| `sportmanager` | `password123` | SPORT_MANAGER | Manages sports/teams |
| `teammanager` | `password123` | TEAM_MANAGER | Manages a single team's staff |
| `headcoach` | `password123` | STAFF, HEAD_COACH, COACH | Football head coach (team 1) |
| `headcoach2` | `password123` | STAFF, HEAD_COACH, COACH | Basketball head coach (team 2) |
| `doctor` | `password123` | STAFF, TEAM_DOCTOR, DOCTOR | Reports injuries, makes diagnoses |
| `physio` | `password123` | STAFF, PHYSIOTHERAPIST | Treatments, rehab |
| `fitness` | `password123` | STAFF, FITNESS_COACH | Fitness tests, training loads |
| `scout` | `password123` | SCOUT | Scout reports, outer players |
| `sponsor` | `password123` | SPONSOR | Sponsor offers |
| `fan` | `password123` | FAN | Read-only fan dashboard |
| `player1` | `password123` | PLAYER | Mohamed Salah — football striker, team 1 |
| `player2` | `password123` | PLAYER | Ahmed Hegazy — football midfielder, team 1 |
| `player3` | `password123` | PLAYER | Omar — football defender, team 1 (currently injured) |
| `player4` | `password123` | PLAYER | Mahmoud — football goalkeeper, team 1 |
| `player5` | `password123` | PLAYER | Yousef — basketball point guard, team 2 |
| `player6` | `password123` | PLAYER | Layla — tennis player, team 3 |

### What you'll see in the database

| Service | What's seeded |
| :--- | :--- |
| **user-management** | 17 user profiles across every role (1 admin, 1 sport mgr, 1 team mgr, 2 head coaches, 1 doctor, 1 physio, 1 fitness coach, 1 scout, 1 sponsor, 1 fan, 6 players) |
| **player-management** | 6 Sports (one per `SportType`), 4 Teams (Cairo Eagles FC, Alex Stars BC, Cairo Tennis Club, Nile Volleyball), 6 Rosters (one per player), 6 PlayerContracts, 4 OuterTeams (Pyramids FC, Al Ahly, Zamalek SC, Tunis Hoops) |
| **training-match** | 5 TrainingSessions (mix of SCHEDULED/ONGOING/COMPLETED), 3 Matches (1 FINISHED with score, 2 SCHEDULED) |
| **medical-fitness** | 2 Injuries (player3 recovering, player5 recovered) each with a Diagnosis and a Treatment |
| **reports-analytics** | 1 MatchAnalysis for the finished match, 2 PlayerAnalytics rows, 1 ScoutReport |
| **notification-mail** | empty by design — it's event-driven; data appears as you use the API |

### How it works (architecture)

- **Keycloak users:** pre-imported from `keycloak/mscms-realm.json` with **fixed UUIDs** (e.g. admin = `00000000-0000-0000-0000-000000000001`). Keycloak runs with `--import-realm`, so the realm is created once on first start.
- **DB seeding:** each service has a `bootstrap/*DataSeeder.java` class (a `CommandLineRunner` gated by `@ConditionalOnProperty("app.seed.enabled")`). It runs **after Hibernate creates the schema**, checks if data is already present, and if not, inserts demo rows. Restarts are a no-op.
- **Cross-service references:** the seeders use the same fixed UUIDs from `mscms-realm.json` for the `keycloakId` column, and deterministic auto-generated IDs (e.g. `team 1` = Cairo Eagles FC) for `teamId`/`rosterId`/`contractId` foreign keys.

### Why not `init-db.sql`?

The Postgres init scripts only run once on volume creation — but at that point the **tables don't exist yet** (Hibernate creates them later from `@Entity` classes). Inserting into non-existent tables would fail. The `CommandLineRunner` approach runs *after* schema creation and also lets the user-management seeder coordinate UUIDs with Keycloak.

---

## 🛡️ Role Permissions

The API Gateway enforces role-based security. If a role doesn't have access, you get `403 Forbidden`.

| Endpoints | Allowed Roles |
| :--- | :--- |
| **Medical & Fitness** | |
| `/injuries/**` | ADMIN, TEAM_DOCTOR, PHYSIOTHERAPIST, HEAD_COACH |
| `/diagnoses/**` | ADMIN, TEAM_DOCTOR |
| `/treatments/**`, `/rehabilitations/**`, `/recovery-programs/**` | ADMIN, TEAM_DOCTOR, PHYSIOTHERAPIST |
| `/fitness-tests/**` | ADMIN, TEAM_DOCTOR, FITNESS_COACH |
| `/training-loads/**` | ADMIN, FITNESS_COACH, HEAD_COACH, PERFORMANCE_ANALYST |
| **Training & Match** | |
| `/training-sessions/**` | ADMIN, HEAD_COACH, ASSISTANT_COACH, SPECIFIC_COACH, FITNESS_COACH |
| `/training-plans/**` | ADMIN, HEAD_COACH, ASSISTANT_COACH |
| `/training-drills/**` | ADMIN, HEAD_COACH, ASSISTANT_COACH, SPECIFIC_COACH |
| `/training-attendance/**` | ADMIN, HEAD_COACH, ASSISTANT_COACH |
| `/player-training-assessments/**` | ADMIN, HEAD_COACH, ASSISTANT_COACH, SPECIFIC_COACH, FITNESS_COACH |
| `/matches/**` | ADMIN, HEAD_COACH, ASSISTANT_COACH, PERFORMANCE_ANALYST |
| `/match-events/**` | ADMIN, HEAD_COACH, PERFORMANCE_ANALYST |
| `/match-formations/**`, `/match-lineups/**` | ADMIN, HEAD_COACH |
| `/match-performance-reviews/**`, `/player-match-statistics/**` | ADMIN, HEAD_COACH, PERFORMANCE_ANALYST |
| **Player Management** | |
| `/teams/**` | ADMIN, SPORT_MANAGER, TEAM_MANAGER, HEAD_COACH |
| `/sports/**` | ADMIN, SPORT_MANAGER |
| `/rosters/**` | ADMIN, HEAD_COACH, TEAM_MANAGER |
| `/player-contracts/**` | ADMIN, SPORT_MANAGER, TEAM_MANAGER |
| `/player-transfers-incoming/**`, `/player-transfers-outgoing/**` | ADMIN, SPORT_MANAGER |
| `/player-callups/**` | ADMIN, HEAD_COACH, NATIONAL_TEAM |
| `/players/**` (GET) | ADMIN, HEAD_COACH, ASSISTANT_COACH, SPECIFIC_COACH, FITNESS_COACH, PERFORMANCE_ANALYST, TEAM_DOCTOR, PHYSIOTHERAPIST, TEAM_MANAGER |
| `/players/**` (POST/DELETE) | ADMIN only |
| `/players/**` (PUT) | ADMIN, HEAD_COACH |
| `/outer-players/**`, `/outer-teams/**` | ADMIN, SCOUT |
| **User Management** | |
| `GET /users` (list all users) | ADMIN only |
| `GET /users/search` (filtered search) | ADMIN only |
| `GET /users/{id}` | ADMIN or the user themselves |
| `POST /users/**`, `DELETE /users/**` | ADMIN only |
| `/sport-managers/**` | ADMIN, SPORT_MANAGER |
| `/team-managers/**` | ADMIN, SPORT_MANAGER, TEAM_MANAGER |
| `/staff/**` | ADMIN, SPORT_MANAGER, TEAM_MANAGER |
| `/scouts/**` | ADMIN, SCOUT |
| `/sponsors/**` | ADMIN, SPONSOR |
| `/national-teams/**` | ADMIN, NATIONAL_TEAM |
| `/fans/**` | ADMIN, FAN |
| **Notification & Mail** | |
| `/notifications/**`, `/messages/**` | Any authenticated user |
| `/alerts/**` | ADMIN, HEAD_COACH, TEAM_DOCTOR |
| **Reports & Analytics** | |
| `/match-analyses/**`, `/team-analytics/**`, `/training-analytics/**` | ADMIN, HEAD_COACH, PERFORMANCE_ANALYST |
| `/player-analytics/**` | ADMIN, HEAD_COACH, PERFORMANCE_ANALYST, SCOUT |
| `/scout-reports/**` | ADMIN, SCOUT |
| `/sponsor-offers/**` | ADMIN, SPONSOR |
| **ML Models** | |
| `POST /ml/match-prediction` | ADMIN, HEAD_COACH, ASSISTANT_COACH, PERFORMANCE_ANALYST |
| `GET /ml/player-rating/{playerName}` | ADMIN, HEAD_COACH, PERFORMANCE_ANALYST, SCOUT |

---

## 🤖 Machine Learning Models

Two prediction models live as **Python / FastAPI containers** inside the same Docker network. They are *not* called directly by the frontend — the **API Gateway proxies them at `/ml/**`**, applying JWT authentication and role-based authorization just like every other endpoint. This keeps the ML stack language-agnostic (Python stays Python) while giving callers a single base URL, single auth scheme, and a single CORS policy.

### Architecture

```
Frontend ──► Gateway (:8080)  ──► ml-match-predictor:8000  (Python/FastAPI)
            │   JWT + RBAC    │
            │   path rewrite  └─► ml-player-rating:8000    (Python/FastAPI)
            ▼
        /ml/match-prediction     →  POST /predict
        /ml/player-rating/{name} →  GET  /predict/{name}
```

The host-port mappings (`9000`, `9001`) are exposed only so backend devs can hit the Swagger UI directly while testing the model. **All production traffic must go through `:8080/ml/**`** so RBAC is enforced.

### Endpoint 1 — Match Outcome Prediction

Predicts Win / Draw / Loss for an FC Barcelona match against a given opponent.

```
POST http://localhost:8080/ml/match-prediction
Authorization: Bearer <YOUR_TOKEN>
Content-Type: application/json

{
  "home_team": "FC Barcelona",
  "away_team": "Real Madrid",
  "referee_name": "Other"
}
```

`referee_name` is optional and defaults to `"Other"`.

**Response:**
```json
{
  "match": "FC Barcelona vs Real Madrid",
  "referee": "Other",
  "prediction": "W",
  "probabilities": { "W": 96.0, "D": 0.0, "L": 4.0 }
}
```

`prediction` is one of `"W"` (win), `"D"` (draw), `"L"` (loss). `probabilities` are percentages.

### Endpoint 2 — Player Rating Prediction

Predicts a player's overall rating by looking up their stats from the model's built-in dataset.

```
GET http://localhost:8080/ml/player-rating/{playerName}
Authorization: Bearer <YOUR_TOKEN>
```

URL-encode names that contain spaces — e.g. `Lionel%20Messi`.

**Success response:**
```json
{
  "player_name": "Lionel Messi",
  "predicted_rating": 93.4,
  ...
}
```

**404 when the player is not in the dataset:**
```json
{ "detail": "Player 'Some Unknown Name' not found." }
```

### Direct Swagger access (debugging only)

- Match Predictor — http://localhost:9000/docs
- Player Rating — http://localhost:9001/docs

These bypass authentication. Do **not** point the frontend at them.

### How the gateway routes are wired

Two routes were added to `config-server/.../gateway-service.yml`:

```yaml
- id: ml-match-predictor
  uri: http://ml-match-predictor:8000
  predicates:
    - Path=/ml/match-prediction
  filters:
    - SetPath=/predict
- id: ml-player-rating
  uri: http://ml-player-rating:8000
  predicates:
    - Path=/ml/player-rating/**
  filters:
    - RewritePath=/ml/player-rating/(?<segment>.*), /predict/${segment}
```

And matching role rules in `GatewaySecurityConfig.java`. If you change either file, you must **rebuild and publish the `config-server` and `gateway-service` images** to GHCR for the changes to reach this docker-compose setup.

### Why this integration shape?

The ML APIs are small (two endpoints, stateless). Wrapping them in a dedicated Spring Boot microservice would just add a useless network hop and force DTO duplication in Java. The gateway-as-proxy pattern is the standard way to expose polyglot microservices behind a unified auth boundary — it's the same pattern used by Netflix Zuul, AWS API Gateway, and Spring Cloud Gateway examples in the official docs.

---

## 🔔 Notable API Details

- **`PATCH /alerts/{id}/acknowledge`** requires query parameter `acknowledgedByKeycloakId`:
  ```
  PATCH http://localhost:8080/alerts/1/acknowledge?acknowledgedByKeycloakId=<KEYCLOAK_ID>
  ```
- **`GET /players`** requires query parameter `status` (values: `AVAILABLE`, `INJURED`, `ABSENT`, `SUSPENDED`):
  ```
  GET http://localhost:8080/players?status=AVAILABLE
  ```
- **`DELETE /match-formations/{id}`** safely detaches any linked matches before deleting.
- **`GET /users`** returns every user in the system across all roles (ADMIN only).
- **`GET /users/search`** accepts optional query params: `firstName`, `lastName`, `email`, `gender`, `role`, `minAge`, `maxAge`. Returns all matching users regardless of role (ADMIN only).

---

## 📖 Using Swagger UI

1. Open http://localhost:8080/swagger-ui.html
2. Select a service from the dropdown (e.g., "Medical & Fitness").
3. **Important:** Select **"API Gateway"** from the **Servers** dropdown.
4. Click **Authorize** (top right), paste your JWT token, click **Authorize**.
5. Now you can "Try it out" on any endpoint.

---

## 🛑 Useful Commands

```bash
# Stop everything
docker compose down

# Stop and remove all data (fresh start)
docker compose down -v

# View logs of a specific service
docker compose logs -f gateway-service

# Restart a single service
docker compose restart user-management-service

# Pull latest images and restart
docker compose pull
docker compose up -d
```

---

## ⚠️ Troubleshooting

### Only some services appear in Eureka?
- Wait 2-3 more minutes — slower machines take longer.
- Check logs: `docker compose logs -f user-management-service`
- If a service keeps restarting, run `docker compose down -v` for a fresh start.

### Login returns 401?
- Make sure Eureka shows all services as `UP` first.
- Use the correct credentials: `admin` / `admin123`.

### Database errors?
- Run `docker compose down -v` to wipe all data and start clean.
- Then `docker compose up -d` again.

---

## 🏗️ Architecture Overview

```
Browser/Frontend (React, Angular, etc.)
        │
        ▼
  API Gateway (:8080)  ◄── JWT validation + role-based security
        │
        ├── User Management Service
        ├── Player Management Service
        ├── Training & Match Service
        ├── Medical & Fitness Service
        ├── Notification & Mail Service
        ├── Reports & Analytics Service
        │
        └── ML Models (Python/FastAPI, gateway-proxied at /ml/**)
            ├── ml-match-predictor  (:9000 host, :8000 internal)
            └── ml-player-rating    (:9001 host, :8000 internal)

  Supporting Infrastructure:
  ├── Config Server (:8082) — centralized config
  ├── Eureka Server (:8761) — service discovery
  ├── Keycloak (:8443) — identity provider
  ├── PostgreSQL (:5432) — database
  ├── Redis (:6379) — caching & rate limiting
  ├── RabbitMQ (:15672) — messaging
  └── Kafka (:9092) — event streaming
```
