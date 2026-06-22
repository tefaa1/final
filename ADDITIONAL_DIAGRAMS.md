# Additional MSCMS Diagrams (Mermaid)

A library of Mermaid diagrams that complement the LaTeX documentation.
Render any block in **<https://mermaid.live>** or via the Mermaid CLI:

```bash
npm i -g @mermaid-js/mermaid-cli
mmdc -i ADDITIONAL_DIAGRAMS.md -o additional.png
```

---

## 1. Microservices communication (REST + Kafka)

```mermaid
flowchart LR
    FE[Next.js Front-end]:::front -->|HTTP / JWT| GW[API Gateway :8080]:::infra
    GW -->|REST| UMS[user-management]:::svc
    GW -->|REST| PMS[player-management]:::svc
    GW -->|REST| TMS[training-match]:::svc
    GW -->|REST| MFS[medical-fitness]:::svc
    GW -->|REST| RAS[reports-analytics]:::svc
    GW -->|REST| NMS[notification-mail]:::svc

    UMS <-->|Admin API| KC[(Keycloak)]:::infra
    UMS -->|JPA| DB1[(mscms_user)]:::db
    PMS -->|JPA| DB2[(mscms_player)]:::db
    TMS -->|JPA| DB3[(mscms_training)]:::db
    MFS -->|JPA| DB4[(mscms_medical)]:::db
    RAS -->|JPA| DB5[(mscms_reports)]:::db
    NMS -->|JPA| DB6[(mscms_notif)]:::db

    TMS -- "MatchFinished\nevent" --> KAFKA{{Kafka}}:::infra
    MFS -- "InjuryReported" --> KAFKA
    PMS -- "TransferRequested" --> KAFKA
    KAFKA --> NMS

    classDef front fill:#dbeafe,stroke:#1d4ed8,color:#1e3a8a
    classDef svc   fill:#dcfce7,stroke:#15803d,color:#14532d
    classDef infra fill:#fef3c7,stroke:#b45309,color:#78350f
    classDef db    fill:#fce7f3,stroke:#9d174d,color:#831843
```

---

## 2. Class diagram — Player & Team domain

```mermaid
classDiagram
    direction LR
    class Sport {
        +Long id
        +String name
        +SportType sportType
        +Long sportManagerId
    }
    class Team {
        +Long id
        +String name
        +String country
        +Sport sport
    }
    class Roster {
        +Long id
        +Long playerId
        +String season
        +Team team
    }
    class PlayerContract {
        +Long id
        +String playerKeycloakId
        +LocalDate startDate
        +LocalDate endDate
        +Long salary
        +Long releaseClause
    }
    class OuterTeam {
        +Long id
        +String name
        +String country
        +String email
    }
    class OuterPlayer {
        +Long id
        +LocalDate dateOfBirth
        +String nationality
        +Position preferredPosition
        +Long marketValue
        +Integer kitNumber
        +OuterTeam outerTeam
    }
    class PlayerTransferIncoming {
        +Long id
        +OuterPlayer outerPlayer
        +OuterTeam fromTeam
        +Team toTeam
        +RequestStatus status
        +LocalDate requestDate
    }
    class PlayerTransferOutgoing {
        +Long id
        +String playerKeycloakId
        +Team fromTeam
        +OuterTeam toTeam
        +RequestStatus status
        +LocalDate requestDate
    }

    Sport "1" *-- "many" Team
    Team "1" *-- "many" Roster
    Team "1" o-- "many" PlayerTransferOutgoing : fromTeam
    Team "1" o-- "many" PlayerTransferIncoming : toTeam
    OuterTeam "1" *-- "many" OuterPlayer
    OuterTeam "1" o-- "many" PlayerTransferOutgoing : toTeam
    OuterTeam "1" o-- "many" PlayerTransferIncoming : fromTeam
    OuterPlayer "1" o-- "many" PlayerTransferIncoming
```

---

## 3. Class diagram — Match & Training domain

```mermaid
classDiagram
    direction LR
    class TrainingSession {
        +Long id
        +Long teamId
        +Long headCoachId
        +TrainingType type
        +TrainingStatus status
        +LocalDateTime scheduledDateTime
        +Integer durationMinutes
        +String location
    }
    class TrainingPlan {
        +Long id
        +String title
        +Long teamId
        +Long createdByCoachId
        +PlanStatus status
        +LocalDate startDate
        +LocalDate endDate
    }
    class TrainingDrill {
        +Long id
        +String drillName
        +DrillCategory category
        +Integer durationMinutes
        +Integer intensity
        +TrainingSession session
    }
    class TrainingAttendance {
        +Long id
        +Long playerId
        +AttendanceStatus status
        +LocalDateTime checkInTime
        +TrainingSession session
    }
    class Match {
        +Long id
        +Long homeTeamId
        +Long outerTeamId
        +MatchStatus status
        +MatchType matchType
        +String venue
        +String referee
        +LocalDateTime kickoffTime
        +Integer homeTeamScore
        +Integer awayTeamScore
    }
    class MatchFormation {
        +Long id
        +Long teamId
        +String formation
        +String tacticalApproach
    }
    class MatchLineup {
        +Long id
        +String playerKeycloakId
        +LineupStatus lineupStatus
        +Position position
        +Integer jerseyNumber
        +MatchFormation formation
    }
    class MatchEvent {
        +Long id
        +String playerKeycloakId
        +EventType eventType
        +Integer minute
        +Match match
    }
    class PlayerMatchStatistics {
        +Long id
        +Long playerId
        +SportType sportType
        +Integer minutesPlayed
        +Double performanceRating
        +Match match
    }

    TrainingSession "1" *-- "many" TrainingDrill
    TrainingSession "1" *-- "many" TrainingAttendance
    Match "1" *-- "many" MatchEvent
    Match "1" *-- "many" PlayerMatchStatistics
    MatchFormation "1" *-- "many" MatchLineup
```

---

## 4. Class diagram — Medical domain

```mermaid
classDiagram
    direction TB
    class Injury {
        +Long id
        +Long playerId
        +Long teamId
        +InjuryType injuryType
        +InjurySeverity severity
        +InjuryStatus status
        +String bodyPart
        +LocalDate injuryDate
    }
    class Diagnosis {
        +Long id
        +String diagnosis
        +String medicalNotes
        +String recommendations
        +LocalDateTime diagnosedAt
        +Injury injury
    }
    class Treatment {
        +Long id
        +String treatmentType
        +TreatmentStatus status
        +LocalDate startDate
        +LocalDate endDate
        +Injury injury
    }
    class Rehabilitation {
        +Long id
        +Long physiotherapistId
        +RehabStatus status
        +String rehabPlan
        +Integer durationWeeks
        +Injury injury
    }
    class RecoveryProgram {
        +Long id
        +RecoveryProgramStatus status
        +String programName
        +Integer sessionsPerWeek
        +Rehabilitation rehabilitation
    }
    class FitnessTest {
        +Long id
        +String playerKeycloakId
        +FitnessTestType testType
        +Double result
        +String unit
        +String resultCategory
    }
    class TrainingLoad {
        +Long id
        +Long playerId
        +Long trainingSessionId
        +Double intensity
        +Double load
        +Integer heartRateAvg
    }

    Injury "1" *-- "many" Diagnosis
    Injury "1" *-- "many" Treatment
    Injury "1" *-- "many" Rehabilitation
    Rehabilitation "1" *-- "many" RecoveryProgram
```

---

## 5. Activity: User signup (fan self-registration)

```mermaid
flowchart TD
    A([Start]) --> B[Visitor opens /signup]
    B --> C{Form valid?}
    C -- No --> B
    C -- Yes --> D[POST /auth/signup]
    D --> E[Gateway forwards to user-management]
    E --> F[Keycloak Admin API creates user<br/>with FAN role]
    F --> G{Username/email<br/>available?}
    G -- No --> H[Return 409 Conflict] --> B
    G -- Yes --> I[Insert fan_profile row]
    I --> J[Return access_token]
    J --> K[Front-end stores token + role]
    K --> L([Redirect to /dashboard])
```

---

## 6. Activity: Player rating prediction

```mermaid
flowchart TD
    A([Start]) --> B[Coach types player name]
    B --> C{Name in<br/>KNOWN_PLAYERS list?}
    C -- Suggest --> D[Autocomplete fills field]
    C -- Free text --> E[User submits anyway]
    D --> F[Click Evaluate]
    E --> F
    F --> G[GET /ml-proxy/player/predict/&#123;name&#125;]
    G --> H[Next.js rewrites to<br/>http://ml-player-rating:8000]
    H --> I[FastAPI loads<br/>Football_Players_Data.csv]
    I --> J{Player name<br/>matches row?}
    J -- No --> K[Return 404<br/>'Player not found'] --> L([Show error with suggestions])
    J -- Yes --> M[Build feature vector<br/>34 numeric + 2 categorical]
    M --> N[Predict via joblib regression]
    N --> O[Return rating + name + position]
    O --> P([Render headline + breakdown bars])
```

---

## 7. State diagram — Notification life cycle

```mermaid
stateDiagram-v2
    [*] --> PENDING : created in DB
    PENDING --> SENT : producer dispatches
    SENT --> DELIVERED : transport confirmed
    DELIVERED --> READ : user opens
    SENT --> FAILED : transport rejected
    FAILED --> PENDING : retry policy
    READ --> [*]
```

---

## 8. State diagram — Alert life cycle

```mermaid
stateDiagram-v2
    [*] --> Open : alert triggered
    state Open {
        [*] --> Unacknowledged
        Unacknowledged --> Acknowledged : user clicks Ack
    }
    Open --> Resolved : root cause fixed
    Open --> Suppressed : muted by admin
    Resolved --> [*]
    Suppressed --> [*]
```

---

## 9. Gantt — Recommended sprint plan

```mermaid
gantt
    title MSCMS Implementation Timeline
    dateFormat YYYY-MM-DD
    section Foundation
    Spring Cloud skeleton   :done, f1, 2025-09-01, 14d
    Keycloak realm + auth   :done, f2, after f1, 10d
    section Core Domains
    Player & Team service   :done, c1, 2025-09-25, 14d
    Training & Match service:done, c2, after c1, 14d
    Medical service         :done, c3, after c2, 10d
    Notification service    :done, c4, after c3, 7d
    Reports & Analytics     :done, c5, after c4, 12d
    section Frontend
    Next.js dashboard       :done, fe1, 2025-10-15, 21d
    Role-based navigation   :done, fe2, after fe1, 7d
    Charts & analytics page :done, fe3, after fe2, 10d
    section AI Tier
    Match predictor FastAPI :done, ai1, 2025-12-01, 7d
    Player rating FastAPI   :done, ai2, after ai1, 7d
    section Polish
    Barcelona theming       :done, p1, 2026-01-05, 7d
    Seed data refresh       :done, p2, after p1, 5d
    Documentation           :active, p3, after p2, 5d
```

---

## 10. Pie — Roles distribution in the seed

```mermaid
pie showData
    title Seed users by role (16 users)
    "Player"          : 10
    "Head Coach"      : 2
    "Doctor / Physio" : 2
    "Sponsor"         : 1
    "Scout"           : 1
    "Fan"             : 1
    "Sport Manager"   : 1
    "Team Manager"    : 1
```

---

## 11. ER (focused) — Reports analytics aggregation

```mermaid
erDiagram
    MATCH_ANALYSIS }o--|| MATCH : "matchId"
    PLAYER_ANALYTICS }o--|| PLAYER : "playerKeycloakId"
    TEAM_ANALYTICS }o--|| TEAM : "teamId"
    TRAINING_ANALYTICS }o--|| TEAM : "teamId"
    TRAINING_ANALYTICS }o--|| PLAYER : "playerKeycloakId (nullable)"
    SCOUT_REPORT }o--|| OUTER_PLAYER : "outerPlayerId"
    SPONSOR_CONTRACT_OFFER }o--|| TEAM : "teamId"

    MATCH_ANALYSIS {
        Long id
        Long matchId
        Long teamId
        SportType sportType
        String tacticalAnalysis
        String keyMoments
        String playerRatings
    }
    PLAYER_ANALYTICS {
        Long id
        String playerKeycloakId
        Long teamId
        Integer totalMatches
        Integer primaryScore
        Double averageRating
        Double averageFitnessScore
    }
    TEAM_ANALYTICS {
        Long id
        Long teamId
        Integer wins
        Integer draws
        Integer losses
        Integer pointsFor
        Integer pointsAgainst
    }
    TRAINING_ANALYTICS {
        Long id
        Long teamId
        String playerKeycloakId
        Integer totalSessions
        Double attendanceRate
        Double averageTrainingLoad
    }
    SCOUT_REPORT {
        Long id
        Long outerPlayerId
        Integer technicalRating
        Integer physicalRating
        Integer mentalityRating
        Boolean recommendSigning
    }
    SPONSOR_CONTRACT_OFFER {
        Long id
        String sponsorKeycloakId
        Long teamId
        Double offerAmount
        Integer contractDurationMonths
        String status
    }
```

---

## 12. Journey — A Coach's typical day in MSCMS

```mermaid
journey
    title Head Coach: Pre-match Day
    section Morning
      Open Dashboard            : 5: Coach
      Review yesterday's notifications : 4: Coach
      Check injury status       : 3: Coach
    section Training Block
      Plan tactical session     : 5: Coach
      Mark attendance           : 4: Coach
      Assess player performance : 5: Coach
    section Pre-match
      Set match formation       : 5: Coach
      Submit starting lineup    : 5: Coach
      Run AI prediction         : 4: Coach
    section After Match
      Log match events          : 4: Coach
      File performance reviews  : 5: Coach
```
