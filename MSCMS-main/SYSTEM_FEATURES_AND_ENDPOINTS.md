# Multi-Sport Club Management System (MSCMS)
# Features & API Endpoints — Complete Reference

> **Version:** 3.0 — Multi-Sport Edition
> **Last Updated:** 2026-02-19
> **Audience:** Frontend Developers · UI/UX Designers · QA Engineers

---

## Table of Contents

1. [System Architecture](#1-system-architecture)
2. [Supported Sports & Global Enums](#2-supported-sports--global-enums)
3. [User Management Service](#3-user-management-service)
4. [Player Management Service](#4-player-management-service)
5. [Training & Match Service](#5-training--match-service)
6. [Medical & Fitness Service](#6-medical--fitness-service)
7. [Reports & Analytics Service](#7-reports--analytics-service)
8. [Notification & Mail Service](#8-notification--mail-service)
9. [Key User Flows](#9-key-user-flows)
10. [Frontend Integration Guide](#10-frontend-integration-guide)

---

## 1. System Architecture

### 1.1 Services Overview

| Service | Port | Gateway Prefix | Responsibility |
|---------|------|----------------|----------------|
| **API Gateway** | 8080 | `/` | Single entry point — routes all requests |
| **Eureka Server** | 8761 | — | Service discovery & registration |
| **Config Server** | 8888 | — | Centralized configuration management |
| **User Management** | 8081 | `/api/user-management` | Users, Teams, Sports, Roles |
| **Player Management** | 8082 | `/api/player-management` | Contracts, Transfers, Rosters, Scouting |
| **Training & Match** | 8083 | `/api/training-match` | Training sessions, Matches, Match stats |
| **Medical & Fitness** | 8084 | `/api/medical-fitness` | Injuries, Treatments, Fitness tests |
| **Reports & Analytics** | 8085 | `/api/reports-analytics` | Analytics, Scout reports, Sponsorship |
| **Notification & Mail** | 8086 | `/api/notification-mail` | Notifications, Alerts, Internal messages |

### 1.2 Authentication & Authorization

- **Identity Provider:** Keycloak (realm: `mscms`)
- **Token type:** JWT Bearer token — required on every request as `Authorization: Bearer <token>`
- **User identity:** Every user is identified across all services by their **`keycloakId`** — a UUID string from the JWT `sub` claim. This is never an internal DB numeric ID.
- **Role-based access:** Every endpoint is protected by `@PreAuthorize`. The frontend must check the user's roles (from `realm_access.roles` in the JWT) to show/hide UI elements.

### 1.3 Event-Driven Architecture (Kafka)

The system uses **Kafka** for asynchronous inter-service communication:
- When a key action occurs (e.g., injury reported, match scheduled), the service publishes a Kafka event
- The **Notification & Mail Service** consumes these events and automatically creates notifications and sends emails
- The frontend does **not** need to call the notification service directly for automated events

---

## 2. Supported Sports & Global Enums

### Sports (`SportType`)
All 6 sports are fully supported across every service:

| Value | Sport |
|-------|-------|
| `FOOTBALL` | Football / Soccer |
| `BASKETBALL` | Basketball |
| `TENNIS` | Tennis |
| `SWIMMING` | Swimming |
| `VOLLEYBALL` | Volleyball |
| `HANDBALL` | Handball |

### Player Positions (`Position`)

**Football (10):**
`GOALKEEPER` · `RIGHT_BACK` · `LEFT_BACK` · `CENTER_BACK` · `DEFENSIVE_MID` · `CENTRAL_MID` · `ATTACKING_MID` · `RIGHT_WING` · `LEFT_WING` · `STRIKER`

**Basketball (5):**
`POINT_GUARD` · `SHOOTING_GUARD` · `SMALL_FORWARD` · `POWER_FORWARD` · `CENTER`

**Tennis (2):**
`SINGLES_PLAYER` · `DOUBLES_PLAYER`

**Swimming (5):**
`FREESTYLE_SWIMMER` · `BACKSTROKE_SWIMMER` · `BREASTSTROKE_SWIMMER` · `BUTTERFLY_SWIMMER` · `MEDLEY_SWIMMER`

**Volleyball (6):**
`SETTER` · `OUTSIDE_HITTER` · `OPPOSITE_HITTER` · `MIDDLE_BLOCKER` · `LIBERO` · `DEFENSIVE_SPECIALIST`

**Handball (7 — prefixed `HB_` to avoid naming conflicts):**
`HB_GOALKEEPER` · `HB_LEFT_WING` · `HB_RIGHT_WING` · `HB_LEFT_BACK` · `HB_RIGHT_BACK` · `HB_CENTRE_BACK` · `HB_PIVOT`

### User Roles
`ADMIN` · `PLAYER` · `HEAD_COACH` · `ASSISTANT_COACH` · `FITNESS_COACH` · `SPECIFIC_COACH` · `DOCTOR` · `PHYSIOTHERAPIST` · `PERFORMANCE_ANALYST` · `TEAM_MANAGER` · `SPORT_MANAGER` · `SCOUT` · `FAN` · `SPONSOR`

---

## 3. User Management Service

**Base URL (via Gateway):** `http://localhost:8080/api/user-management`

---

### 3.1 Users (`/users`)

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| `POST` | `/users` | ADMIN | Create a new user account |
| `PUT` | `/users/{id}` | ADMIN | Update user info by DB ID |
| `GET` | `/users/{id}` | ADMIN | Get user by DB ID |
| `GET` | `/users` | ADMIN | Get all users |
| `DELETE` | `/users/{id}` | ADMIN | Delete user |
| `GET` | `/users/search` | ADMIN | Search users with filters |
| `GET` | `/users/keycloak/{keycloakId}` | ALL AUTHENTICATED | Get user by Keycloak UUID |

**Request Body — Create / Update User:**
```json
{
  "keycloakId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "dateOfBirth": "1995-06-15",
  "gender": "MALE",
  "phoneNumber": "+213555123456",
  "address": "123 Main Street, Algiers",
  "role": "PLAYER"
}
```

**Search Query Parameters** (`GET /users/search`) — all optional:

| Parameter | Type | Match Style | Description |
|-----------|------|-------------|-------------|
| `firstName` | String | Partial, case-insensitive | Filter by first name |
| `lastName` | String | Partial, case-insensitive | Filter by last name |
| `email` | String | Partial, case-insensitive | Filter by email |
| `gender` | Enum | Exact | `MALE` or `FEMALE` |
| `role` | Enum | Exact | Any value from User Roles list |
| `minAge` | Integer | Range | Minimum age (inclusive) |
| `maxAge` | Integer | Range | Maximum age (inclusive) |

**Kafka Events:** `user.created` · `user.updated` · `user.deleted` · `player.status.changed`

---

### 3.2 Player Profiles (`/players`)

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| `POST` | `/players` | ADMIN | Create a player profile |
| `PUT` | `/players/{id}` | ADMIN | Update player profile |
| `GET` | `/players/{id}` | ADMIN, TEAM_MANAGER, HEAD_COACH, SPORT_MANAGER | Get player by ID |
| `GET` | `/players` | ADMIN, TEAM_MANAGER, HEAD_COACH, SPORT_MANAGER | Get all players |
| `DELETE` | `/players/{id}` | ADMIN | Delete player profile |

**Request Body — Create / Update Player Profile:**
```json
{
  "userKeycloakId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "dateOfBirth": "2000-03-20",
  "nationality": "Algerian",
  "preferredPosition": "STRIKER",
  "marketValue": 5000000.00,
  "kitNumber": 9,
  "playerStatus": "AVAILABLE"
}
```

**Player Status:** `AVAILABLE` · `INJURED` · `SUSPENDED` · `ON_LOAN` · `TRANSFERRED` · `RETIRED`

---

### 3.3 Staff (`/staff`)

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| `POST` | `/staff` | ADMIN | Create a staff member |
| `PUT` | `/staff/{id}` | ADMIN | Update staff |
| `GET` | `/staff/{id}` | ADMIN, TEAM_MANAGER, SPORT_MANAGER | Get staff by ID |
| `GET` | `/staff` | ADMIN, TEAM_MANAGER, SPORT_MANAGER | Get all staff |
| `DELETE` | `/staff/{id}` | ADMIN | Delete staff |

**Request Body — Create / Update Staff:**
```json
{
  "userKeycloakId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "teamId": 1,
  "staffRole": "HEAD_COACH",
  "specialization": "Tactical Analysis",
  "contractStart": "2024-07-01",
  "contractEnd": "2026-06-30"
}
```

**Staff Roles:** `HEAD_COACH` · `ASSISTANT_COACH` · `FITNESS_COACH` · `DOCTOR` · `PHYSIOTHERAPIST` · `PERFORMANCE_ANALYST`

---

### 3.4 Team Managers (`/team-managers`)

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| `POST` | `/team-managers` | ADMIN | Create team manager |
| `PUT` | `/team-managers/{id}` | ADMIN | Update team manager |
| `GET` | `/team-managers/{id}` | ADMIN, SPORT_MANAGER | Get by ID |
| `GET` | `/team-managers` | ADMIN, SPORT_MANAGER | Get all |
| `DELETE` | `/team-managers/{id}` | ADMIN | Delete |

---

### 3.5 Sport Managers (`/sport-managers`)

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| `POST` | `/sport-managers` | ADMIN | Create sport manager |
| `PUT` | `/sport-managers/{id}` | ADMIN | Update |
| `GET` | `/sport-managers/{id}` | ADMIN | Get by ID |
| `GET` | `/sport-managers` | ADMIN | Get all |
| `DELETE` | `/sport-managers/{id}` | ADMIN | Delete |

---

### 3.6 Scouts (`/scouts`)

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| `POST` | `/scouts` | ADMIN | Create scout |
| `PUT` | `/scouts/{id}` | ADMIN | Update scout |
| `GET` | `/scouts/{id}` | ADMIN, SPORT_MANAGER | Get by ID |
| `GET` | `/scouts` | ADMIN, SPORT_MANAGER | Get all |
| `DELETE` | `/scouts/{id}` | ADMIN | Delete |

**Request Body — Create / Update Scout:**
```json
{
  "userKeycloakId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "region": "North Africa",
  "organizationName": "Elite Scout Agency"
}
```

---

### 3.7 Fans (`/fans`)

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| `POST` | `/fans` | PUBLIC | Register as a fan (default role) |
| `PUT` | `/fans/{id}` | ADMIN | Update fan |
| `GET` | `/fans/{id}` | ADMIN | Get by ID |
| `GET` | `/fans` | ADMIN | Get all |
| `DELETE` | `/fans/{id}` | ADMIN | Delete |

**Request Body — Create / Update Fan:**
```json
{
  "userKeycloakId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "displayName": "SuperFan99",
  "favoriteTeam": "FC Example"
}
```

---

### 3.8 Sponsors (`/sponsors`)

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| `POST` | `/sponsors` | ADMIN | Create sponsor |
| `PUT` | `/sponsors/{id}` | ADMIN | Update |
| `GET` | `/sponsors/{id}` | ADMIN, SPORT_MANAGER | Get by ID |
| `GET` | `/sponsors` | ADMIN, SPORT_MANAGER | Get all |
| `DELETE` | `/sponsors/{id}` | ADMIN | Delete |

---

### 3.9 Teams (`/teams`)

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| `POST` | `/teams` | ADMIN, SPORT_MANAGER | Create team |
| `PUT` | `/teams/{id}` | ADMIN, SPORT_MANAGER | Update team |
| `GET` | `/teams/{id}` | ALL AUTHENTICATED | Get by ID |
| `GET` | `/teams` | ALL AUTHENTICATED | Get all |
| `DELETE` | `/teams/{id}` | ADMIN | Delete |

**Request Body — Create / Update Team:**
```json
{
  "name": "FC Example",
  "country": "Algeria",
  "sportId": 1
}
```

---

### 3.10 Sports (`/sports`)

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| `POST` | `/sports` | ADMIN | Create sport |
| `PUT` | `/sports/{id}` | ADMIN | Update sport |
| `GET` | `/sports/{id}` | ALL AUTHENTICATED | Get by ID |
| `GET` | `/sports` | ALL AUTHENTICATED | Get all |
| `DELETE` | `/sports/{id}` | ADMIN | Delete |
| `GET` | `/sports/by-type?sportType=FOOTBALL` | ALL AUTHENTICATED | Filter sports by type |

**Request Body — Create / Update Sport:**
```json
{
  "name": "Football Division 1",
  "sportManagerId": 3,
  "sportType": "FOOTBALL"
}
```

---

### 3.11 National Teams (`/national-teams`)

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| `POST` | `/national-teams` | ADMIN, SPORT_MANAGER | Create national team |
| `PUT` | `/national-teams/{id}` | ADMIN, SPORT_MANAGER | Update |
| `GET` | `/national-teams/{id}` | ALL AUTHENTICATED | Get by ID |
| `GET` | `/national-teams` | ALL AUTHENTICATED | Get all |
| `DELETE` | `/national-teams/{id}` | ADMIN | Delete |

---

## 4. Player Management Service

**Base URL (via Gateway):** `http://localhost:8080/api/player-management`

---

### 4.1 Player Contracts (`/player-contracts`)

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| `POST` | `/player-contracts` | ADMIN, SPORT_MANAGER | Create contract |
| `PUT` | `/player-contracts/{id}` | ADMIN, SPORT_MANAGER | Update contract |
| `GET` | `/player-contracts/{id}` | ADMIN, SPORT_MANAGER, TEAM_MANAGER | Get by ID |
| `GET` | `/player-contracts` | ADMIN, SPORT_MANAGER, TEAM_MANAGER | Get all |
| `DELETE` | `/player-contracts/{id}` | ADMIN | Delete |

**Request Body — Create / Update Contract:**
```json
{
  "playerKeycloakId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "teamId": 1,
  "startDate": "2024-07-01",
  "endDate": "2026-06-30",
  "salary": 50000.00,
  "releaseClause": 2000000.00,
  "contractStatus": "ACTIVE"
}
```

**Contract Status:** `ACTIVE` · `EXPIRED` · `TERMINATED` · `ON_HOLD`

**Kafka Events:** `contract.created` · `contract.expired`

---

### 4.2 Incoming Transfers (`/player-transfers-incoming`)

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| `POST` | `/player-transfers-incoming` | ADMIN, SPORT_MANAGER | Create incoming transfer |
| `PUT` | `/player-transfers-incoming/{id}` | ADMIN, SPORT_MANAGER | Update |
| `GET` | `/player-transfers-incoming/{id}` | ADMIN, SPORT_MANAGER, TEAM_MANAGER | Get by ID |
| `GET` | `/player-transfers-incoming` | ADMIN, SPORT_MANAGER, TEAM_MANAGER | Get all |
| `DELETE` | `/player-transfers-incoming/{id}` | ADMIN | Delete |

**Request Body — Create / Update Incoming Transfer:**
```json
{
  "playerKeycloakId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "fromTeam": "FC Other Club",
  "transferFee": 3500000.00,
  "transferDate": "2025-01-15",
  "status": "COMPLETED",
  "contractDetails": "3-year deal, 80k/month"
}
```

**Transfer Status:** `PENDING` · `NEGOTIATING` · `COMPLETED` · `CANCELLED`

**Kafka Events:** `transfer.incoming.completed`

---

### 4.3 Outgoing Transfers (`/player-transfers-outgoing`)

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| `POST` | `/player-transfers-outgoing` | ADMIN, SPORT_MANAGER | Create outgoing transfer |
| `PUT` | `/player-transfers-outgoing/{id}` | ADMIN, SPORT_MANAGER | Update |
| `GET` | `/player-transfers-outgoing/{id}` | ADMIN, SPORT_MANAGER, TEAM_MANAGER | Get by ID |
| `GET` | `/player-transfers-outgoing` | ADMIN, SPORT_MANAGER, TEAM_MANAGER | Get all |
| `DELETE` | `/player-transfers-outgoing/{id}` | ADMIN | Delete |

**Request Body — Create / Update Outgoing Transfer:**
```json
{
  "playerKeycloakId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "toTeam": "FC Destination Club",
  "transferFee": 5000000.00,
  "transferDate": "2025-01-31",
  "status": "COMPLETED",
  "contractDetails": "Sold permanently"
}
```

**Kafka Events:** `transfer.outgoing.completed`

---

### 4.4 Rosters (`/rosters`)

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| `POST` | `/rosters` | ADMIN, TEAM_MANAGER, HEAD_COACH | Create roster |
| `PUT` | `/rosters/{id}` | ADMIN, TEAM_MANAGER, HEAD_COACH | Update roster |
| `GET` | `/rosters/{id}` | ADMIN, TEAM_MANAGER, HEAD_COACH, SPORT_MANAGER | Get by ID |
| `GET` | `/rosters` | ADMIN, TEAM_MANAGER, HEAD_COACH, SPORT_MANAGER | Get all |
| `DELETE` | `/rosters/{id}` | ADMIN | Delete |

**Kafka Events:** `roster.updated`

---

### 4.5 National Team Call-Ups (`/player-call-ups`)

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| `POST` | `/player-call-ups` | ADMIN, SPORT_MANAGER | Create call-up |
| `PUT` | `/player-call-ups/{id}` | ADMIN, SPORT_MANAGER | Update |
| `GET` | `/player-call-ups/{id}` | ADMIN, SPORT_MANAGER, TEAM_MANAGER | Get by ID |
| `GET` | `/player-call-ups` | ADMIN, SPORT_MANAGER, TEAM_MANAGER | Get all |
| `DELETE` | `/player-call-ups/{id}` | ADMIN | Delete |

**Request Body — Create / Update Call-Up:**
```json
{
  "playerKeycloakId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "nationalTeamKeycloakId": "8fb12a64-1234-5678-abcd-3c963f66afa6",
  "callUpDate": "2025-03-01",
  "returnDate": "2025-03-15",
  "status": "APPROVED"
}
```

**Call-Up Status:** `PENDING` · `APPROVED` · `REJECTED` · `COMPLETED`

**Kafka Events:** `callup.approved`

---

### 4.6 Outer Players — Scouted (`/outer-players`)

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| `POST` | `/outer-players` | ADMIN, SCOUT, SPORT_MANAGER | Add scouted player record |
| `PUT` | `/outer-players/{id}` | ADMIN, SCOUT, SPORT_MANAGER | Update |
| `GET` | `/outer-players/{id}` | ADMIN, SCOUT, SPORT_MANAGER, TEAM_MANAGER | Get by ID |
| `GET` | `/outer-players` | ADMIN, SCOUT, SPORT_MANAGER, TEAM_MANAGER | Get all |
| `DELETE` | `/outer-players/{id}` | ADMIN | Delete |

---

### 4.7 Outer Teams — Opponent Clubs (`/outer-teams`)

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| `POST` | `/outer-teams` | ADMIN, SCOUT, SPORT_MANAGER | Add external team |
| `PUT` | `/outer-teams/{id}` | ADMIN, SCOUT, SPORT_MANAGER | Update |
| `GET` | `/outer-teams/{id}` | ADMIN, SCOUT, SPORT_MANAGER, TEAM_MANAGER | Get by ID |
| `GET` | `/outer-teams` | ADMIN, SCOUT, SPORT_MANAGER, TEAM_MANAGER | Get all |
| `DELETE` | `/outer-teams/{id}` | ADMIN | Delete |

---

## 5. Training & Match Service

**Base URL (via Gateway):** `http://localhost:8080/api/training-match`

---

### 5.1 Training Sessions (`/training-sessions`)

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| `POST` | `/training-sessions` | ADMIN, HEAD_COACH | Create training session |
| `PUT` | `/training-sessions/{id}` | ADMIN, HEAD_COACH | Update session |
| `GET` | `/training-sessions/{id}` | ADMIN, HEAD_COACH, ASSISTANT_COACH, FITNESS_COACH | Get by ID |
| `GET` | `/training-sessions` | ADMIN, HEAD_COACH, ASSISTANT_COACH, FITNESS_COACH | Get all |
| `DELETE` | `/training-sessions/{id}` | ADMIN, HEAD_COACH | Delete |

**Request Body — Create / Update Training Session:**
```json
{
  "teamId": 1,
  "headCoachKeycloakId": "coach-keycloak-uuid",
  "specificCoachKeycloakId": "specific-coach-uuid",
  "sessionType": "TACTICAL",
  "status": "SCHEDULED",
  "location": "Main Training Ground",
  "scheduledDate": "2025-03-10T09:00:00",
  "durationMinutes": 120,
  "objectives": "High press compactness and defensive shape"
}
```

**Session Type:** `TACTICAL` · `TECHNICAL` · `FITNESS` · `RECOVERY` · `SET_PIECES`
**Session Status:** `SCHEDULED` · `IN_PROGRESS` · `COMPLETED` · `CANCELLED`

**Kafka Events:** `training.session.completed` · `training.session.cancelled`

---

### 5.2 Training Plans (`/training-plans`)

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| `POST` | `/training-plans` | ADMIN, HEAD_COACH | Create plan |
| `PUT` | `/training-plans/{id}` | ADMIN, HEAD_COACH | Update plan |
| `GET` | `/training-plans/{id}` | ADMIN, HEAD_COACH, ASSISTANT_COACH | Get by ID |
| `GET` | `/training-plans` | ADMIN, HEAD_COACH, ASSISTANT_COACH | Get all |
| `DELETE` | `/training-plans/{id}` | ADMIN, HEAD_COACH | Delete |

---

### 5.3 Training Attendance (`/training-attendance`)

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| `POST` | `/training-attendance` | ADMIN, HEAD_COACH, ASSISTANT_COACH | Record attendance |
| `PUT` | `/training-attendance/{id}` | ADMIN, HEAD_COACH, ASSISTANT_COACH | Update |
| `GET` | `/training-attendance/{id}` | ADMIN, HEAD_COACH, ASSISTANT_COACH, FITNESS_COACH | Get by ID |
| `GET` | `/training-attendance` | ADMIN, HEAD_COACH, ASSISTANT_COACH, FITNESS_COACH | Get all |
| `DELETE` | `/training-attendance/{id}` | ADMIN | Delete |

**Request Body — Record Attendance:**
```json
{
  "trainingSessionId": 5,
  "playerKeycloakId": "player-keycloak-uuid",
  "attended": true,
  "reason": "Present — full session",
  "performanceScore": 8.5
}
```

---

### 5.4 Training Drills (`/training-drills`)

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| `POST` | `/training-drills` | ADMIN, HEAD_COACH, ASSISTANT_COACH | Add drill |
| `PUT` | `/training-drills/{id}` | ADMIN, HEAD_COACH, ASSISTANT_COACH | Update drill |
| `GET` | `/training-drills/{id}` | ADMIN, HEAD_COACH, ASSISTANT_COACH, FITNESS_COACH | Get by ID |
| `GET` | `/training-drills` | ADMIN, HEAD_COACH, ASSISTANT_COACH, FITNESS_COACH | Get all |
| `DELETE` | `/training-drills/{id}` | ADMIN | Delete |

**Request Body — Create / Update Drill:**
```json
{
  "trainingSessionId": 5,
  "drillName": "Rondo 4v2",
  "drillCategory": "PASSING_DRILL",
  "durationMinutes": 20,
  "description": "Short passing drill with two defenders in the middle",
  "intensity": "MEDIUM"
}
```

**Drill Categories (`DrillCategory`) — grouped by applicability:**

| Category | Applies To |
|----------|-----------|
| `WARMUP` · `COOLDOWN` · `FITNESS` · `TACTICAL` · `TECHNICAL` · `RECOVERY` · `MENTAL` · `VIDEO_ANALYSIS` | All sports |
| `SHOOTING_DRILL` · `PASSING_DRILL` · `DEFENDING_DRILL` · `SET_PLAYS` | Ball sports (general) |
| `STROKE_TECHNIQUE` | Swimming |
| `SERVE_PRACTICE` | Tennis · Volleyball |
| `SPIKE_DRILL` · `BLOCKING_DRILL` | Volleyball |
| `DRIBBLING_DRILL` · `REBOUNDING_DRILL` · `TRANSITION_PLAY` | Basketball |
| `AGILITY_DRILL` | All sports |

---

### 5.5 Player Training Assessments (`/player-training-assessments`)

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| `POST` | `/player-training-assessments` | ADMIN, HEAD_COACH | Create assessment |
| `PUT` | `/player-training-assessments/{id}` | ADMIN, HEAD_COACH | Update |
| `GET` | `/player-training-assessments/{id}` | ADMIN, HEAD_COACH, ASSISTANT_COACH | Get by ID |
| `GET` | `/player-training-assessments` | ADMIN, HEAD_COACH, ASSISTANT_COACH | Get all |
| `DELETE` | `/player-training-assessments/{id}` | ADMIN | Delete |

---

### 5.6 Matches (`/matches`)

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| `POST` | `/matches` | ADMIN, TEAM_MANAGER | Schedule a match |
| `PUT` | `/matches/{id}` | ADMIN, TEAM_MANAGER | Update match details |
| `GET` | `/matches/{id}` | ADMIN, TEAM_MANAGER, HEAD_COACH, SPORT_MANAGER, ASSISTANT_COACH, PERFORMANCE_ANALYST | Get by ID |
| `GET` | `/matches` | ADMIN, TEAM_MANAGER, HEAD_COACH, SPORT_MANAGER, ASSISTANT_COACH, PERFORMANCE_ANALYST | Get all |
| `GET` | `/matches/by-sport?sportType=BASKETBALL` | ADMIN, TEAM_MANAGER, HEAD_COACH, SPORT_MANAGER, ASSISTANT_COACH, PERFORMANCE_ANALYST | Filter by sport |
| `DELETE` | `/matches/{id}` | ADMIN | Delete |

**Request Body — Schedule / Update Match:**
```json
{
  "homeTeamId": 1,
  "outerTeamId": 5,
  "matchType": "LEAGUE",
  "status": "SCHEDULED",
  "sportType": "FOOTBALL",
  "venue": "Stade du 5 Juillet",
  "competition": "Division 1 Mobilis",
  "season": "2025/2026",
  "homeTeamScore": 0,
  "awayTeamScore": 0,
  "kickoffTime": "2025-04-10T19:00:00",
  "finishTime": null,
  "referee": "Ali Benali",
  "attendance": 40000,
  "matchSummary": "High-stakes league fixture",
  "notes": "Home team seeking to close the gap at top",
  "matchFormationId": 2
}
```

**Match Type:** `FRIENDLY` · `LEAGUE` · `CUP` · `TOURNAMENT` · `PRE_SEASON`
**Match Status:** `SCHEDULED` · `LIVE` · `FINISHED` · `CANCELLED` · `POSTPONED`

**Kafka Events:** `match.scheduled` · `match.completed` · `match.cancelled`

---

### 5.7 Match Events (`/match-events`)

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| `POST` | `/match-events` | ADMIN, HEAD_COACH | Record a live match event |
| `PUT` | `/match-events/{id}` | ADMIN, HEAD_COACH | Update event |
| `GET` | `/match-events/{id}` | ADMIN, HEAD_COACH, TEAM_MANAGER | Get by ID |
| `GET` | `/match-events` | ADMIN, HEAD_COACH, TEAM_MANAGER | Get all |
| `DELETE` | `/match-events/{id}` | ADMIN | Delete |

**Request Body — Record Match Event:**
```json
{
  "matchId": 10,
  "playerKeycloakId": "player-keycloak-uuid",
  "teamId": 1,
  "eventType": "GOAL",
  "minute": 34,
  "extraTime": false,
  "description": "Header from a corner kick"
}
```

**Event Types (`EventType`) — use only the values relevant to the match's `sportType`:**

| Sport | Available Event Types |
|-------|-----------------------|
| **All sports** | `SUBSTITUTION` · `YELLOW_CARD` · `RED_CARD` · `INJURY` · `END_OF_PERIOD` |
| **Football** | `GOAL` · `ASSIST` · `OWN_GOAL` · `PENALTY_SCORED` · `PENALTY_MISSED` · `CORNER_KICK` · `FREE_KICK` · `VAR_REVIEW` · `OFFSIDE` |
| **Basketball** | `BASKET_2PT` · `BASKET_3PT` · `FREE_THROW_MADE` · `FREE_THROW_MISSED` · `TIMEOUT` · `PERSONAL_FOUL` · `TECHNICAL_FOUL` · `FLAGRANT_FOUL` |
| **Tennis** | `ACE` · `DOUBLE_FAULT` · `BREAK_OF_SERVE` · `GAME_WON` · `SET_WON` · `MATCH_WON` |
| **Swimming** | `RACE_START` · `RACE_FINISH` · `DISQUALIFICATION_SWIM` |
| **Volleyball** | `POINT_WON` · `SET_WON_VB` · `ACE_VB` · `BLOCK_POINT` |
| **Handball** | `GOAL_HB` · `SEVEN_METER_THROW` · `GOALKEEPER_SAVE` · `TWO_MINUTE_SUSPENSION` |

---

### 5.8 Match Lineups (`/match-lineups`)

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| `POST` | `/match-lineups` | ADMIN, HEAD_COACH | Create lineup |
| `PUT` | `/match-lineups/{id}` | ADMIN, HEAD_COACH | Update |
| `GET` | `/match-lineups/{id}` | ADMIN, HEAD_COACH, TEAM_MANAGER | Get by ID |
| `GET` | `/match-lineups` | ADMIN, HEAD_COACH, TEAM_MANAGER | Get all |
| `DELETE` | `/match-lineups/{id}` | ADMIN | Delete |

---

### 5.9 Match Formations (`/match-formations`)

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| `POST` | `/match-formations` | ADMIN, HEAD_COACH | Create formation |
| `PUT` | `/match-formations/{id}` | ADMIN, HEAD_COACH | Update |
| `GET` | `/match-formations/{id}` | ADMIN, HEAD_COACH, TEAM_MANAGER | Get by ID |
| `GET` | `/match-formations` | ADMIN, HEAD_COACH, TEAM_MANAGER | Get all |
| `DELETE` | `/match-formations/{id}` | ADMIN | Delete |

**Request Body — Create / Update Formation:**
```json
{
  "teamId": 1,
  "setByCoachKeycloakId": "coach-keycloak-uuid",
  "formation": "4-3-3",
  "tacticalApproach": "High press, aggressive front line",
  "formationDetails": "Wingers cut inside, full-backs overlap"
}
```

---

### 5.10 Player Match Statistics (`/match-stats`)

> This is the most data-rich endpoint. It stores **all sport-specific per-player statistics in one flat record**. Only populate the fields relevant to `sportType` — all other sport fields should be `null`.

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| `POST` | `/match-stats` | ADMIN, HEAD_COACH, PERFORMANCE_ANALYST | Record player stats for a match |
| `PUT` | `/match-stats/{id}` | ADMIN, HEAD_COACH, PERFORMANCE_ANALYST | Update stats |
| `GET` | `/match-stats/{id}` | ADMIN, HEAD_COACH, TEAM_MANAGER, PERFORMANCE_ANALYST | Get by ID |
| `GET` | `/match-stats` | ADMIN, HEAD_COACH, TEAM_MANAGER, PERFORMANCE_ANALYST | Get all stats |
| `GET` | `/match-stats/by-match/{matchId}` | ADMIN, HEAD_COACH, TEAM_MANAGER, PERFORMANCE_ANALYST | Get all player stats for one match |
| `GET` | `/match-stats/by-sport?sportType=TENNIS` | ADMIN, HEAD_COACH, TEAM_MANAGER, PERFORMANCE_ANALYST | Filter by sport |
| `DELETE` | `/match-stats/{id}` | ADMIN | Delete |

**Request Body — Record Player Match Statistics:**

Send only the block relevant to your sport. All other sport-specific fields may be omitted or set to `null`.

```json
{
  "matchId": 10,
  "playerKeycloakId": "player-keycloak-uuid",
  "sportType": "FOOTBALL",
  "minutesPlayed": 90,
  "performanceRating": 8.5,

  "goals": 1,
  "assists": 0,
  "shots": 4,
  "shotsOnTarget": 2,
  "dribbles": 5,
  "dribblesSuccessful": 3,
  "passes": 40,
  "passesCompleted": 34,
  "keyPasses": 2,
  "tackles": 3,
  "tacklesWon": 2,
  "interceptions": 1,
  "clearances": 0,
  "foulsCommitted": 1,
  "foulsWon": 2,
  "yellowCards": 0,
  "redCards": 0,

  "points": null, "rebounds": null, "assistsBasketball": null,
  "steals": null, "blocks": null, "turnovers": null,
  "fieldGoalsMade": null, "fieldGoalAttempts": null,
  "threePointersMade": null, "threePointAttempts": null,
  "freeThrowsMade": null, "freeThrowAttempts": null, "plusMinus": null,

  "aces": null, "doubleFaults": null, "firstServeIn": null,
  "firstServePoints": null, "breakPointsConverted": null,
  "winners": null, "unforcedErrors": null, "setsWon": null, "gamesWon": null,

  "raceTimeMs": null, "splitTimes": null, "strokeCount": null,
  "turnCount": null, "laneNumber": null, "disqualified": null,

  "spikePoints": null, "spikeErrors": null, "blockPoints": null,
  "serviceAces": null, "serviceErrors": null,
  "receptions": null, "receptionErrors": null, "digs": null,

  "goalsHandball": null, "handballGoalAttempts": null, "assistsHandball": null,
  "handballSteals": null, "handballTurnovers": null,
  "twoMinuteSuspensions": null, "sevenMeterGoals": null, "saves": null
}
```

**Field reference by sport:**

| Sport | Key Fields |
|-------|-----------|
| **Football** | `goals`, `assists`, `shots`, `shotsOnTarget`, `dribbles`, `dribblesSuccessful`, `passes`, `passesCompleted`, `keyPasses`, `tackles`, `tacklesWon`, `interceptions`, `clearances`, `foulsCommitted`, `foulsWon`, `yellowCards`, `redCards` |
| **Basketball** | `points`, `rebounds`, `assistsBasketball`, `steals`, `blocks`, `turnovers`, `fieldGoalsMade`, `fieldGoalAttempts`, `threePointersMade`, `threePointAttempts`, `freeThrowsMade`, `freeThrowAttempts`, `plusMinus` |
| **Tennis** | `aces`, `doubleFaults`, `firstServeIn`, `firstServePoints`, `breakPointsConverted`, `winners`, `unforcedErrors`, `setsWon`, `gamesWon` |
| **Swimming** | `raceTimeMs` (Long, milliseconds), `splitTimes` (String), `strokeCount`, `turnCount`, `laneNumber`, `disqualified` (Boolean) |
| **Volleyball** | `spikePoints`, `spikeErrors`, `blockPoints`, `serviceAces`, `serviceErrors`, `receptions`, `receptionErrors`, `digs` |
| **Handball** | `goalsHandball`, `handballGoalAttempts`, `assistsHandball`, `handballSteals`, `handballTurnovers`, `twoMinuteSuspensions`, `sevenMeterGoals`, `saves` |

---

### 5.11 Match Performance Reviews (`/match-performance-reviews`)

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| `POST` | `/match-performance-reviews` | ADMIN, HEAD_COACH, PERFORMANCE_ANALYST | Create review |
| `PUT` | `/match-performance-reviews/{id}` | ADMIN, HEAD_COACH, PERFORMANCE_ANALYST | Update |
| `GET` | `/match-performance-reviews/{id}` | ADMIN, HEAD_COACH, TEAM_MANAGER | Get by ID |
| `GET` | `/match-performance-reviews` | ADMIN, HEAD_COACH, TEAM_MANAGER | Get all |
| `DELETE` | `/match-performance-reviews/{id}` | ADMIN | Delete |

---

## 6. Medical & Fitness Service

**Base URL (via Gateway):** `http://localhost:8080/api/medical-fitness`

---

### 6.1 Injuries (`/injuries`)

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| `POST` | `/injuries` | ADMIN, DOCTOR | Report an injury |
| `PUT` | `/injuries/{id}` | ADMIN, DOCTOR | Update injury record |
| `GET` | `/injuries/{id}` | ADMIN, DOCTOR, HEAD_COACH, TEAM_MANAGER | Get by ID |
| `GET` | `/injuries` | ADMIN, DOCTOR, HEAD_COACH, TEAM_MANAGER | Get all |
| `DELETE` | `/injuries/{id}` | ADMIN | Delete |

**Request Body — Report / Update Injury:**
```json
{
  "playerKeycloakId": "player-keycloak-uuid",
  "teamId": 1,
  "reportedByDoctorKeycloakId": "doctor-keycloak-uuid",
  "injuryType": "MUSCLE_STRAIN",
  "severity": "MODERATE",
  "injuredBodyPart": "Left hamstring",
  "injuryDate": "2025-03-15",
  "expectedRecoveryDate": "2025-04-20",
  "status": "TREATING",
  "description": "Occurred during a sprint in training",
  "notes": "Avoid high-intensity load for 4 weeks"
}
```

**Injury Type:** `MUSCLE_STRAIN` · `LIGAMENT_SPRAIN` · `FRACTURE` · `CONTUSION` · `TENDONITIS` · `DISLOCATION` · `CONCUSSION`
**Severity:** `MINOR` · `MODERATE` · `SEVERE` · `CRITICAL`
**Status:** `REPORTED` · `DIAGNOSED` · `TREATING` · `RECOVERING` · `RECOVERED` · `CHRONIC`

**Kafka Events:** `injury.reported` · `injury.status.changed`

---

### 6.2 Diagnoses (`/diagnoses`)

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| `POST` | `/diagnoses` | ADMIN, DOCTOR | Create diagnosis |
| `PUT` | `/diagnoses/{id}` | ADMIN, DOCTOR | Update |
| `GET` | `/diagnoses/{id}` | ADMIN, DOCTOR, HEAD_COACH | Get by ID |
| `GET` | `/diagnoses` | ADMIN, DOCTOR, HEAD_COACH | Get all |
| `DELETE` | `/diagnoses/{id}` | ADMIN | Delete |

**Request Body — Create / Update Diagnosis:**
```json
{
  "playerKeycloakId": "player-keycloak-uuid",
  "doctorKeycloakId": "doctor-keycloak-uuid",
  "injuryId": 3,
  "diagnosis": "Grade II hamstring strain",
  "medicalNotes": "MRI confirms partial tear, no full rupture",
  "testResults": "MRI Report #2025-031",
  "recommendations": "4–6 weeks rest, physio 3x/week, ice 20 min/day"
}
```

---

### 6.3 Treatments (`/treatments`)

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| `POST` | `/treatments` | ADMIN, DOCTOR | Create treatment plan |
| `PUT` | `/treatments/{id}` | ADMIN, DOCTOR | Update |
| `GET` | `/treatments/{id}` | ADMIN, DOCTOR, HEAD_COACH, PHYSIOTHERAPIST | Get by ID |
| `GET` | `/treatments` | ADMIN, DOCTOR, HEAD_COACH, PHYSIOTHERAPIST | Get all |
| `DELETE` | `/treatments/{id}` | ADMIN | Delete |

**Request Body — Create / Update Treatment:**
```json
{
  "injuryId": 3,
  "playerKeycloakId": "player-keycloak-uuid",
  "doctorKeycloakId": "doctor-keycloak-uuid",
  "treatmentType": "PHYSIOTHERAPY",
  "status": "IN_PROGRESS",
  "startDate": "2025-03-16",
  "endDate": "2025-04-15",
  "description": "Daily physiotherapy and ice compression",
  "medications": "Anti-inflammatory cream (topical)"
}
```

**Treatment Status:** `PLANNED` · `IN_PROGRESS` · `COMPLETED` · `CANCELLED`

**Kafka Events:** `treatment.completed`

---

### 6.4 Rehabilitations (`/rehabilitations`)

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| `POST` | `/rehabilitations` | ADMIN, DOCTOR, PHYSIOTHERAPIST | Create rehab program |
| `PUT` | `/rehabilitations/{id}` | ADMIN, DOCTOR, PHYSIOTHERAPIST | Update |
| `GET` | `/rehabilitations/{id}` | ADMIN, DOCTOR, PHYSIOTHERAPIST, HEAD_COACH | Get by ID |
| `GET` | `/rehabilitations` | ADMIN, DOCTOR, PHYSIOTHERAPIST, HEAD_COACH | Get all |
| `DELETE` | `/rehabilitations/{id}` | ADMIN | Delete |

**Rehab Status:** `NOT_STARTED` · `IN_PROGRESS` · `COMPLETED` · `PAUSED`

**Kafka Events:** `rehabilitation.completed`

---

### 6.5 Recovery Programs (`/recovery-programs`)

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| `POST` | `/recovery-programs` | ADMIN, DOCTOR, PHYSIOTHERAPIST | Create program |
| `PUT` | `/recovery-programs/{id}` | ADMIN, DOCTOR, PHYSIOTHERAPIST | Update |
| `GET` | `/recovery-programs/{id}` | ADMIN, DOCTOR, PHYSIOTHERAPIST, HEAD_COACH, FITNESS_COACH | Get by ID |
| `GET` | `/recovery-programs` | ADMIN, DOCTOR, PHYSIOTHERAPIST, HEAD_COACH, FITNESS_COACH | Get all |
| `DELETE` | `/recovery-programs/{id}` | ADMIN | Delete |

---

### 6.6 Fitness Tests (`/fitness-tests`)

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| `POST` | `/fitness-tests` | ADMIN, DOCTOR, FITNESS_COACH | Record a fitness test |
| `PUT` | `/fitness-tests/{id}` | ADMIN, DOCTOR, FITNESS_COACH | Update |
| `GET` | `/fitness-tests/{id}` | ADMIN, DOCTOR, FITNESS_COACH, HEAD_COACH | Get by ID |
| `GET` | `/fitness-tests` | ADMIN, DOCTOR, FITNESS_COACH, HEAD_COACH | Get all |
| `GET` | `/fitness-tests/by-sport?sportType=SWIMMING` | ADMIN, DOCTOR, PHYSIOTHERAPIST, TEAM_MANAGER | Filter by sport |
| `DELETE` | `/fitness-tests/{id}` | ADMIN | Delete |

**Request Body — Create / Update Fitness Test:**
```json
{
  "playerKeycloakId": "player-keycloak-uuid",
  "teamId": 1,
  "testType": "VO2_MAX",
  "sportType": "FOOTBALL",
  "testDate": "2025-03-20T10:00:00",
  "conductedByDoctorKeycloakId": "doctor-keycloak-uuid",
  "testName": "VO2 Max Treadmill Test",
  "result": 58.5,
  "unit": "ml/kg/min",
  "resultCategory": "Excellent",
  "notes": "Player showed outstanding aerobic capacity",
  "recommendations": "Maintain current cardio program",
  "attachments": "vo2_report_march2025.pdf"
}
```

**Fitness Test Types:** `VO2_MAX` · `SPEED_TEST` · `AGILITY_TEST` · `STRENGTH_TEST` · `FLEXIBILITY_TEST` · `ENDURANCE_TEST` · `BODY_COMPOSITION`

**Kafka Events:** `fitness.test.completed`

---

### 6.7 Training Loads (`/training-loads`)

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| `POST` | `/training-loads` | ADMIN, FITNESS_COACH | Record training load |
| `PUT` | `/training-loads/{id}` | ADMIN, FITNESS_COACH | Update |
| `GET` | `/training-loads/{id}` | ADMIN, FITNESS_COACH, HEAD_COACH, DOCTOR | Get by ID |
| `GET` | `/training-loads` | ADMIN, FITNESS_COACH, HEAD_COACH, DOCTOR | Get all |
| `DELETE` | `/training-loads/{id}` | ADMIN | Delete |

---

## 7. Reports & Analytics Service

**Base URL (via Gateway):** `http://localhost:8080/api/reports-analytics`

> **Design philosophy:** Analytics entities use **sport-agnostic field names** to serve all 6 sports without duplication:
> - `primaryScore` = goals (football), points (basketball), race wins (swimming), etc.
> - `secondaryScore` = assists (football/basketball/handball), games won (tennis), etc.
> - `pointsFor` / `pointsAgainst` = goals, baskets, sets, or points depending on sport
> - `sportSpecificStats` = a JSON string for any additional sport-specific numeric data

---

### 7.1 Match Analysis (`/match-analyses`)

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| `POST` | `/match-analyses` | ADMIN, PERFORMANCE_ANALYST, HEAD_COACH | Create match analysis |
| `PUT` | `/match-analyses/{id}` | ADMIN, PERFORMANCE_ANALYST, HEAD_COACH | Update |
| `GET` | `/match-analyses/{id}` | ADMIN, PERFORMANCE_ANALYST, HEAD_COACH, TEAM_MANAGER, SPORT_MANAGER | Get by ID |
| `GET` | `/match-analyses` | ADMIN, PERFORMANCE_ANALYST, HEAD_COACH, TEAM_MANAGER, SPORT_MANAGER | Get all |
| `GET` | `/match-analyses/by-sport?sportType=BASKETBALL` | ADMIN, PERFORMANCE_ANALYST, HEAD_COACH, TEAM_MANAGER, SPORT_MANAGER | Filter by sport |
| `DELETE` | `/match-analyses/{id}` | ADMIN | Delete |

**Request Body — Create / Update Match Analysis:**
```json
{
  "matchId": 10,
  "teamId": 1,
  "sportType": "FOOTBALL",
  "sportSpecificStats": "{\"possession\":58,\"shots\":14,\"passAccuracy\":87,\"corners\":7}",
  "heatmapFilePath": "/heatmaps/match10_team1.png",
  "heatmapType": "TOUCH_MAP",
  "keyMoments": "Goal in 34th min — corner header; Red card in 78th min",
  "tacticalAnalysis": "High press effective in first half; defensive shape dropped in second",
  "playerRatings": "{\"player-uuid-1\": 8.5, \"player-uuid-2\": 7.0}",
  "analyzedByUserKeycloakId": "analyst-keycloak-uuid",
  "analyzedAt": "2025-04-11T14:00:00",
  "notes": "Strong overall team performance",
  "attachments": "match10_full_analysis.pdf"
}
```

> **`sportSpecificStats`** is a free-form JSON string. Store whatever stats are relevant to the sport: possession % and pass accuracy for football, shooting % for basketball, stroke rate for swimming, serve % for tennis, etc.

---

### 7.2 Player Analytics (`/player-analytics`)

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| `POST` | `/player-analytics` | ADMIN, PERFORMANCE_ANALYST | Create player analytics |
| `PUT` | `/player-analytics/{id}` | ADMIN, PERFORMANCE_ANALYST | Update |
| `GET` | `/player-analytics/{id}` | ADMIN, PERFORMANCE_ANALYST, HEAD_COACH, TEAM_MANAGER | Get by ID |
| `GET` | `/player-analytics` | ADMIN, PERFORMANCE_ANALYST, HEAD_COACH, TEAM_MANAGER | Get all |
| `GET` | `/player-analytics/by-sport?sportType=TENNIS` | ADMIN, PERFORMANCE_ANALYST, HEAD_COACH, TEAM_MANAGER | Filter by sport |
| `DELETE` | `/player-analytics/{id}` | ADMIN | Delete |

**Request Body — Create / Update Player Analytics:**
```json
{
  "playerKeycloakId": "player-keycloak-uuid",
  "teamId": 1,
  "sportType": "FOOTBALL",
  "periodStart": "2025-01-01",
  "periodEnd": "2025-06-30",
  "totalMatches": 20,
  "primaryScore": 12,
  "secondaryScore": 5,
  "averageRating": 7.8,
  "totalTrainingSessions": 60,
  "attendanceRate": 95,
  "currentInjuries": 0,
  "averageFitnessScore": 87.5,
  "fitnessTestsCount": 4,
  "kpiData": "{\"pressAttempts\":180,\"pressSuccess\":0.65}",
  "sportSpecificStats": "{\"goals\":12,\"assists\":5,\"dribbles\":85,\"passAccuracy\":0.84}",
  "trends": "Consistently improving goal contribution each month",
  "calculatedAt": "2025-07-01T08:00:00",
  "notes": "Top scorer and top rated player in the squad this half-season"
}
```

**Field naming by sport:**

| Field | Football | Basketball | Tennis | Swimming | Volleyball | Handball |
|-------|----------|------------|--------|----------|------------|---------|
| `primaryScore` | Goals | Points | Sets Won | Race Wins | Spike Points | Goals |
| `secondaryScore` | Assists | Assists | Games Won | — | Service Aces | Assists |

---

### 7.3 Team Analytics (`/team-analytics`)

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| `POST` | `/team-analytics` | ADMIN, PERFORMANCE_ANALYST | Create team analytics |
| `PUT` | `/team-analytics/{id}` | ADMIN, PERFORMANCE_ANALYST | Update |
| `GET` | `/team-analytics/{id}` | ADMIN, PERFORMANCE_ANALYST, HEAD_COACH, TEAM_MANAGER, SPORT_MANAGER | Get by ID |
| `GET` | `/team-analytics` | ADMIN, PERFORMANCE_ANALYST, HEAD_COACH, TEAM_MANAGER, SPORT_MANAGER | Get all |
| `GET` | `/team-analytics/by-sport?sportType=VOLLEYBALL` | ADMIN, PERFORMANCE_ANALYST, HEAD_COACH, TEAM_MANAGER, SPORT_MANAGER | Filter by sport |
| `DELETE` | `/team-analytics/{id}` | ADMIN | Delete |

**Request Body — Create / Update Team Analytics:**
```json
{
  "teamId": 1,
  "sportType": "FOOTBALL",
  "periodStart": "2025-08-01",
  "periodEnd": "2026-05-31",
  "totalMatches": 38,
  "wins": 25,
  "draws": 8,
  "losses": 5,
  "pointsFor": 75,
  "pointsAgainst": 30,
  "averageTeamFitnessScore": 85.0,
  "totalInjuries": 15,
  "totalTrainingSessions": 120,
  "kpiData": "{\"avgPossession\":58.0,\"pressSuccessRate\":0.68}",
  "sportSpecificStats": "{\"cleanSheets\":18,\"cornerKicks\":180,\"avgPassAccuracy\":0.86}",
  "trends": "Dominant attack and solid defensive record throughout the season",
  "calculatedAt": "2026-06-01T10:00:00",
  "notes": "Best season performance in 5 years"
}
```

**Field naming by sport:**

| Field | Football | Basketball | Tennis | Volleyball | Handball |
|-------|----------|------------|--------|------------|---------|
| `pointsFor` | Goals scored | Points scored | Sets won | Sets won | Goals scored |
| `pointsAgainst` | Goals conceded | Points conceded | Sets lost | Sets lost | Goals conceded |

---

### 7.4 Scout Reports (`/scout-reports`)

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| `POST` | `/scout-reports` | ADMIN, SCOUT | Create scout report |
| `PUT` | `/scout-reports/{id}` | ADMIN, SCOUT | Update |
| `GET` | `/scout-reports/{id}` | ADMIN, SCOUT, SPORT_MANAGER | Get by ID |
| `GET` | `/scout-reports` | ADMIN, SCOUT, SPORT_MANAGER | Get all |
| `DELETE` | `/scout-reports/{id}` | ADMIN | Delete |

**Request Body — Create / Update Scout Report:**
```json
{
  "scoutKeycloakId": "scout-keycloak-uuid",
  "outerPlayerId": 7,
  "outerTeamId": 3,
  "playerName": "Jane Smith",
  "playerAge": 22,
  "playerPosition": "STRIKER",
  "playerNationality": "French",
  "scoutDate": "2025-03-05",
  "technicalRating": 8.0,
  "tacticalRating": 7.5,
  "physicalRating": 8.5,
  "mentalRating": 7.0,
  "overallRating": 7.8,
  "strengths": "Pace, clinical finishing, aerial ability",
  "weaknesses": "Weak left foot, limited defensive tracking",
  "recommendation": "SIGN",
  "notes": "Observed in 3 matches — consistently high performer",
  "marketValueEstimate": 4500000.00
}
```

---

### 7.5 Sponsor Contract Offers (`/sponsor-contract-offers`)

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| `POST` | `/sponsor-contract-offers` | ADMIN, SPONSOR | Create offer |
| `PUT` | `/sponsor-contract-offers/{id}` | ADMIN, SPONSOR | Update |
| `GET` | `/sponsor-contract-offers/{id}` | ADMIN, SPONSOR, SPORT_MANAGER, TEAM_MANAGER | Get by ID |
| `GET` | `/sponsor-contract-offers` | ADMIN, SPONSOR, SPORT_MANAGER, TEAM_MANAGER | Get all |
| `DELETE` | `/sponsor-contract-offers/{id}` | ADMIN | Delete |

**Request Body — Create / Update Sponsor Offer:**
```json
{
  "sponsorKeycloakId": "sponsor-keycloak-uuid",
  "sponsorName": "SportsBrand Co.",
  "offerTitle": "Kit Sponsorship 2025/2026",
  "description": "Full kit sponsorship for the entire season",
  "contractValue": 500000.00,
  "startDate": "2025-07-01",
  "endDate": "2026-06-30",
  "sponsorshipType": "KIT",
  "status": "PENDING",
  "terms": "Logo on front of home and away shirts",
  "benefits": "Visibility across all broadcast matches",
  "targetTeamId": 1
}
```

---

### 7.6 Training Analytics (`/training-analytics`)

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| `POST` | `/training-analytics` | ADMIN, PERFORMANCE_ANALYST | Create training analytics |
| `PUT` | `/training-analytics/{id}` | ADMIN, PERFORMANCE_ANALYST | Update |
| `GET` | `/training-analytics/{id}` | ADMIN, PERFORMANCE_ANALYST, HEAD_COACH, FITNESS_COACH | Get by ID |
| `GET` | `/training-analytics` | ADMIN, PERFORMANCE_ANALYST, HEAD_COACH, FITNESS_COACH | Get all |
| `DELETE` | `/training-analytics/{id}` | ADMIN | Delete |

---

## 8. Notification & Mail Service

**Base URL (via Gateway):** `http://localhost:8080/api/notification-mail`

---

### 8.1 Notifications (`/notifications`)

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| `POST` | `/notifications` | ADMIN | Create notification manually |
| `PUT` | `/notifications/{id}` | ADMIN | Update |
| `GET` | `/notifications/{id}` | ADMIN, TEAM_MANAGER, HEAD_COACH, SPORT_MANAGER | Get by ID |
| `GET` | `/notifications` | ADMIN | Get all |
| `DELETE` | `/notifications/{id}` | ADMIN | Delete |
| `GET` | `/notifications/recipient/{keycloakId}` | ALL AUTHENTICATED | Get all notifications for a user |
| `GET` | `/notifications/recipient/{keycloakId}/unread` | ALL AUTHENTICATED | Get unread notifications for a user |
| `PATCH` | `/notifications/{id}/read` | ALL AUTHENTICATED | Mark notification as read |

**Request Body — Create / Update Notification:**
```json
{
  "recipientUserKeycloakId": "recipient-keycloak-uuid",
  "notificationType": "BOTH",
  "category": "INJURY",
  "status": "PENDING",
  "title": "Injury Alert — John Doe",
  "message": "Player John Doe has been reported with a moderate hamstring injury",
  "emailSubject": "Injury Report – John Doe",
  "emailBody": "Dear Coach, please review the attached injury report for John Doe...",
  "relatedEntityId": 3,
  "relatedEntityType": "INJURY",
  "actionUrl": "/medical-fitness/injuries/3"
}
```

**Notification Type:** `IN_APP` · `EMAIL` · `BOTH`
**Notification Category:** `INJURY` · `KPI` · `TRANSFER` · `REPORT` · `MATCH_REMINDER` · `TRAINING_REMINDER` · `SYSTEM`
**Notification Status:** `PENDING` · `SENT` · `DELIVERED` · `READ` · `FAILED`

**Auto-generated notifications via Kafka:**

| Event | Recipients |
|-------|-----------|
| `injury.reported` | HEAD_COACH · DOCTOR · TEAM_MANAGER |
| `match.scheduled` | All squad players and coaching staff |
| `match.completed` | PERFORMANCE_ANALYST · HEAD_COACH |
| `training.session.cancelled` | All assigned squad players |
| `player.status.changed` | HEAD_COACH · TEAM_MANAGER |
| `transfer.completed` | SPORT_MANAGER · TEAM_MANAGER |
| `contract.created` | SPORT_MANAGER · TEAM_MANAGER |

---

### 8.2 Alerts (`/alerts`)

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| `POST` | `/alerts` | ADMIN | Create alert |
| `PUT` | `/alerts/{id}` | ADMIN | Update |
| `GET` | `/alerts/{id}` | ADMIN, TEAM_MANAGER, HEAD_COACH, DOCTOR | Get by ID |
| `GET` | `/alerts` | ADMIN, TEAM_MANAGER, HEAD_COACH, DOCTOR | Get all |
| `DELETE` | `/alerts/{id}` | ADMIN | Delete |
| `GET` | `/alerts/target/{keycloakId}` | ADMIN, TEAM_MANAGER, HEAD_COACH, DOCTOR | Get all alerts for a specific user |
| `GET` | `/alerts/unacknowledged` | ADMIN, TEAM_MANAGER, HEAD_COACH, DOCTOR | Get all unacknowledged alerts |
| `PATCH` | `/alerts/{id}/acknowledge?acknowledgedByKeycloakId={uuid}` | ADMIN, TEAM_MANAGER, HEAD_COACH, DOCTOR | Mark alert as acknowledged |
| `PATCH` | `/alerts/{id}/resolve` | ADMIN, TEAM_MANAGER, HEAD_COACH | Mark alert as resolved |

**Request Body — Create / Update Alert:**
```json
{
  "alertType": "INJURY_REPORTED",
  "priority": "HIGH",
  "title": "Critical Injury — Immediate Attention Required",
  "message": "Player has suffered a critical knee injury during training",
  "description": "Suspected ACL tear. Awaiting MRI confirmation.",
  "targetUserKeycloakId": "doctor-keycloak-uuid",
  "targetRole": "DOCTOR",
  "relatedEntityId": 3,
  "relatedEntityType": "INJURY",
  "actionRequired": true,
  "metadata": "{\"severity\":\"CRITICAL\",\"injuryId\":3,\"playerId\":\"uuid\"}"
}
```

**Alert Types (`AlertType`) — grouped by category:**

| Category | Values |
|----------|--------|
| **System** | `SYSTEM` · `OTHER` |
| **Medical & Fitness** | `INJURY_REPORTED` · `MEDICAL_CHECKUP_DUE` · `FITNESS_TEST_DUE` · `REHABILITATION_MILESTONE` |
| **Performance** | `KPI_DROP` · `REPORT_GENERATED` |
| **Match & Training** | `MATCH_UPCOMING` · `MATCH_RESULT_AVAILABLE` · `TRAINING_CANCELLED` |
| **Player Management** | `PLAYER_SUSPENSION` · `TRANSFER_COMPLETED` · `CONTRACT_EXPIRING` |
| **Scouting & Sponsorship** | `SCOUT_REPORT_SUBMITTED` · `SPONSOR_OFFER_RECEIVED` |

**Alert Priority:** `LOW` · `MEDIUM` · `HIGH` · `CRITICAL`

---

### 8.3 Messages (`/messages`)

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| `POST` | `/messages` | ADMIN, TEAM_MANAGER, HEAD_COACH, SPORT_MANAGER, DOCTOR | Send message |
| `PUT` | `/messages/{id}` | ADMIN | Update message |
| `GET` | `/messages/{id}` | ADMIN, TEAM_MANAGER, HEAD_COACH, SPORT_MANAGER, DOCTOR | Get by ID |
| `GET` | `/messages` | ADMIN | Get all messages |
| `DELETE` | `/messages/{id}` | ADMIN | Delete |
| `GET` | `/messages/recipient/{keycloakId}` | ADMIN, TEAM_MANAGER, HEAD_COACH, SPORT_MANAGER, PLAYER, DOCTOR, FITNESS_COACH | Get received messages |
| `GET` | `/messages/sender/{keycloakId}` | ADMIN, TEAM_MANAGER, HEAD_COACH, SPORT_MANAGER, DOCTOR | Get sent messages |

**Request Body — Send Message:**
```json
{
  "senderUserKeycloakId": "sender-keycloak-uuid",
  "recipientUserKeycloakId": "recipient-keycloak-uuid",
  "subject": "Recovery Update — John Doe",
  "content": "Hi Doctor, could you provide an update on John's expected return date?",
  "status": "SENT",
  "relatedEntityId": 3,
  "relatedEntityType": "INJURY",
  "attachments": "mri_results_march2025.pdf",
  "parentMessageId": null
}
```

> Set `parentMessageId` to an existing message ID to **reply within a thread**.

**Message Status:** `SENT` · `DELIVERED` · `READ`

---

## 9. Key User Flows

### 9.1 New User Registration
1. User signs up via Keycloak login page → receives a `keycloakId` UUID
2. Frontend calls `POST /users` with the `keycloakId` and user details
3. User defaults to the `FAN` role
4. Admin assigns the correct role via `PUT /users/{id}`
5. Admin creates the role-specific profile (`POST /players`, `POST /staff`, etc.)
6. Kafka `user.created` → welcome notification auto-sent

### 9.2 Scheduling and Playing a Match
1. Manager schedules: `POST /matches` (set `sportType` + `status: SCHEDULED`)
2. Kafka `match.scheduled` → players and coaches notified automatically
3. Coach submits lineup: `POST /match-lineups`
4. Coach sets formation: `POST /match-formations`
5. During match — record live events: `POST /match-events` (use sport-appropriate `eventType`)
6. After match — record per-player stats: `POST /match-stats` (populate only the relevant sport's fields)
7. Update match to `FINISHED`: `PUT /matches/{id}`
8. Kafka `match.completed` → analysts notified
9. Analyst creates match analysis: `POST /match-analyses` (with `sportSpecificStats` JSON)
10. Coach writes performance review: `POST /match-performance-reviews`

### 9.3 Training Session Management
1. Coach creates session: `POST /training-sessions`
2. Kafka event → players notified automatically
3. Session occurs; record attendance per player: `POST /training-attendance`
4. Add drills: `POST /training-drills` (choose `DrillCategory` values for the sport)
5. Assess players: `POST /player-training-assessments`
6. Mark session `COMPLETED` → Kafka `training.session.completed` published

### 9.4 Injury & Recovery Pipeline
1. Doctor reports injury: `POST /injuries`
2. Kafka `injury.reported` → alert auto-sent to HEAD_COACH, TEAM_MANAGER, DOCTOR
3. Doctor creates diagnosis: `POST /diagnoses`
4. Doctor creates treatment plan: `POST /treatments`
5. Physiotherapist starts rehabilitation: `POST /rehabilitations`
6. Doctor creates recovery program: `POST /recovery-programs`
7. Status updates via `PUT /injuries/{id}` → Kafka `injury.status.changed` published
8. On `RECOVERED` → coaching staff notified automatically

### 9.5 Player Transfer
1. Sport Manager creates transfer request: `POST /player-transfers-outgoing` or `/player-transfers-incoming`
2. Update status to `COMPLETED` via `PUT`
3. Kafka `transfer.completed` → alert auto-sent to SPORT_MANAGER, TEAM_MANAGER
4. Issue new contract: `POST /player-contracts`
5. Update roster: `PUT /rosters/{id}`
6. Update analytics: `POST /player-analytics`

### 9.6 Multi-Sport Analytics Workflow
1. After match/training data accumulates, analyst creates:
   - Player analytics: `POST /player-analytics` with correct `sportType`
   - Team analytics: `POST /team-analytics` using `pointsFor`/`pointsAgainst`
   - Match analysis: `POST /match-analyses` with `sportSpecificStats` JSON
2. Use filter endpoints to build sport-specific dashboards:
   - `GET /player-analytics/by-sport?sportType=BASKETBALL`
   - `GET /team-analytics/by-sport?sportType=VOLLEYBALL`
   - `GET /match-analyses/by-sport?sportType=TENNIS`

### 9.7 Internal Messaging Thread
1. Coach sends message to Doctor: `POST /messages`
2. Doctor receives a notification about the new message
3. Doctor reads: `GET /messages/recipient/{keycloakId}`
4. Doctor replies: `POST /messages` with `parentMessageId` = original message ID
5. Thread continues as needed

---

## 10. Frontend Integration Guide

### 10.1 Authentication Flow
```
1. User logs in via Keycloak (redirect to Keycloak login page)
2. Keycloak returns a JWT access token + refresh token
3. Store the token in memory or sessionStorage (avoid localStorage for security)
4. Decode the JWT to extract:
   - sub          →  keycloakId (use this for all user references in API calls)
   - realm_access.roles  →  user roles (use for UI visibility logic)
5. Attach to every request: Authorization: Bearer <access_token>
6. On token expiry: use Keycloak SDK to silently refresh the token
```

### 10.2 API Gateway Routes
All requests go through `http://localhost:8080`:

| Gateway Prefix | Destination |
|----------------|-------------|
| `/api/user-management/**` | User Management Service (8081) |
| `/api/player-management/**` | Player Management Service (8082) |
| `/api/training-match/**` | Training & Match Service (8083) |
| `/api/medical-fitness/**` | Medical & Fitness Service (8084) |
| `/api/reports-analytics/**` | Reports & Analytics Service (8085) |
| `/api/notification-mail/**` | Notification & Mail Service (8086) |

### 10.3 Request / Response Conventions
- **Content type:** always `application/json`
- **Dates:** ISO 8601 — `"2025-06-15"` for `LocalDate` / `"2025-06-15T10:30:00"` for `LocalDateTime`
- **Enums:** always plain uppercase strings — `"FOOTBALL"`, `"SCHEDULED"`, `"GOAL"`
- **User references:** always `String keycloakId` (UUID) — never internal numeric user IDs
- **Optional fields:** can be omitted from the request body or sent as `null`
- **`sportSpecificStats` / `kpiData`:** send as a valid JSON string, e.g., `"{\"possession\":58,\"shots\":14}"`

### 10.4 Create vs Update Validation
- **`POST` (Create):** all fields marked required in the schema must be present
- **`PUT` (Update):** send only the fields you want to change; required fields not annotated for Update group are optional

### 10.5 Error Response Format
All services return a consistent error body:
```json
{
  "status": 404,
  "message": "PlayerAnalytics not found with id: 99",
  "timestamp": "2025-06-15T10:30:00"
}
```

| HTTP Status | Meaning |
|-------------|---------|
| `201 Created` | Resource successfully created |
| `200 OK` | Read or update successful |
| `204 No Content` | Delete successful (no body) |
| `400 Bad Request` | Validation failure — check required fields |
| `401 Unauthorized` | Missing or expired JWT token |
| `403 Forbidden` | Valid token but insufficient role |
| `404 Not Found` | Resource does not exist |
| `500 Internal Server Error` | Unexpected server error |

### 10.6 Role-Based UI Visibility

| Feature Area | Minimum Role(s) Required |
|-------------|--------------------------|
| User management | ADMIN |
| Player profiles | ADMIN · TEAM_MANAGER · HEAD_COACH · SPORT_MANAGER |
| Contracts & transfers | ADMIN · SPORT_MANAGER · TEAM_MANAGER |
| Training sessions & drills | ADMIN · HEAD_COACH · ASSISTANT_COACH · FITNESS_COACH |
| Match scheduling | ADMIN · TEAM_MANAGER |
| Match events & player stats | ADMIN · HEAD_COACH · PERFORMANCE_ANALYST |
| Medical records | ADMIN · DOCTOR |
| Fitness tests | ADMIN · DOCTOR · FITNESS_COACH |
| Match & team analytics | ADMIN · PERFORMANCE_ANALYST · HEAD_COACH |
| Player analytics | ADMIN · PERFORMANCE_ANALYST |
| Scout reports | ADMIN · SCOUT · SPORT_MANAGER |
| Sponsor offers | ADMIN · SPONSOR · SPORT_MANAGER |
| Notifications (own) | ALL AUTHENTICATED |
| Internal messages | ADMIN · TEAM_MANAGER · HEAD_COACH · SPORT_MANAGER · DOCTOR |
| Alerts | ADMIN · TEAM_MANAGER · HEAD_COACH · DOCTOR |

### 10.7 Sport-Filtered Endpoints — Quick Reference

Use these endpoints to build sport-specific views and dashboards:

```
GET /api/user-management/sports/by-type?sportType=FOOTBALL
GET /api/training-match/matches/by-sport?sportType=BASKETBALL
GET /api/training-match/match-stats/by-sport?sportType=TENNIS
GET /api/training-match/match-stats/by-match/{matchId}
GET /api/medical-fitness/fitness-tests/by-sport?sportType=SWIMMING
GET /api/reports-analytics/match-analyses/by-sport?sportType=VOLLEYBALL
GET /api/reports-analytics/player-analytics/by-sport?sportType=HANDBALL
GET /api/reports-analytics/team-analytics/by-sport?sportType=FOOTBALL
```

### 10.8 Real-Time Notification Polling
- **Notification badge count:** poll `GET /notifications/recipient/{keycloakId}/unread` every 30–60 seconds
- **Alert indicator:** poll `GET /alerts/unacknowledged` every 30–60 seconds
- **Mark as read:** call `PATCH /notifications/{id}/read` when a user opens a notification
- **Acknowledge alert:** call `PATCH /alerts/{id}/acknowledge?acknowledgedByKeycloakId={uuid}` when user dismisses an alert
- **Future:** consider WebSocket or SSE for true real-time push

---

*Document Version: 3.0 — Multi-Sport Edition*
*Sports covered: Football · Basketball · Tennis · Swimming · Volleyball · Handball*
*Services: User Management · Player Management · Training & Match · Medical & Fitness · Reports & Analytics · Notification & Mail*
