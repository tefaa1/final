# MSCMS Entity-Relationship Diagram

The full schema spans **6 PostgreSQL databases**, one per Java microservice.
Cross-database references are by string `keycloakId` or numeric domain IDs
(no physical foreign keys cross database boundaries).

Render with: `mmdc -i ER_DIAGRAM.md -o er.png`
or paste into <https://mermaid.live>.

---

## Database: `mscms_user` (user-management-service)

```mermaid
erDiagram
    USER {
        bigint id PK
        string keycloakId UK
        string username UK
        string firstName
        string lastName
        string email
        string phone
        int age
        string gender
        string address
        string role
    }

    PLAYER ||--|| USER : extends
    HEAD_COACH ||--|| USER : extends
    DOCTOR ||--|| USER : extends
    PHYSIOTHERAPIST ||--|| USER : extends
    FITNESS_COACH ||--|| USER : extends
    TEAM_MANAGER ||--|| USER : extends
    SPORT_MANAGER ||--|| USER : extends
    SCOUT ||--|| USER : extends
    SPONSOR ||--|| USER : extends
    FAN ||--|| USER : extends
    NATIONAL_TEAM ||--|| USER : extends

    PLAYER {
        bigint id PK
        date dateOfBirth
        string nationality
        string preferredPosition
        long marketValue
        int kitNumber
        long rosterId "FK → player.rosters"
        long contractId "FK → player.player_contracts"
        string status
    }

    HEAD_COACH {
        long sportId
        long teamId
        string staffrole
        int yearsOfExperience
        string coachingLicenseLevel
    }

    NATIONAL_TEAM {
        string federationName
        string contactPerson
        string country
    }
```

---

## Database: `mscms_player` (player-management-service)

```mermaid
erDiagram
    SPORT ||--o{ TEAM : has
    TEAM ||--o{ ROSTER : has
    ROSTER }o--|| PLAYER_KEYCLOAK_ID : "playerId (Keycloak UUID)"
    TEAM ||--o{ PLAYER_TRANSFER_OUTGOING : "fromTeam"
    OUTER_TEAM ||--o{ PLAYER_TRANSFER_OUTGOING : "toTeam"
    OUTER_TEAM ||--o{ OUTER_PLAYER : "outerTeam"
    OUTER_PLAYER ||--o{ PLAYER_TRANSFER_INCOMING : "outerPlayer"
    OUTER_TEAM ||--o{ PLAYER_TRANSFER_INCOMING : "fromTeam"
    TEAM ||--o{ PLAYER_TRANSFER_INCOMING : "toTeam"

    SPORT {
        long id PK
        string name
        string sportType "enum"
        long sportManagerId
    }
    TEAM {
        long id PK
        string name
        string country
        long sport_id FK
    }
    ROSTER {
        long id PK
        long playerId "Keycloak UUID"
        string season
        long team_id FK
    }
    PLAYER_CONTRACT {
        long id PK
        string playerKeycloakId
        date startDate
        date endDate
        long salary
        long releaseClause
    }
    OUTER_TEAM {
        long id PK
        string name
        string email
        string country
    }
    OUTER_PLAYER {
        long id PK
        date dateOfBirth
        string nationality
        string preferredPosition
        long marketValue
        int kitNumber
        long outer_team_id FK
    }
    PLAYER_TRANSFER_INCOMING {
        long id PK
        long outer_player_id FK
        long from_team_id FK
        long to_team_id FK
        string status "PENDING|ACCEPTED|DECLINED"
        date requestDate
    }
    PLAYER_TRANSFER_OUTGOING {
        long id PK
        string playerKeycloakId
        long from_team_id FK
        long to_team_id FK
        string status
        date requestDate
    }
    PLAYER_CALL_UP_REQUEST {
        long id PK
        string playerKeycloakId
        string nationalTeamKeycloakId
        string status
        date requestDate
    }
```

---

## Database: `mscms_training` (training-match-service)

```mermaid
erDiagram
    TRAINING_SESSION ||--o{ TRAINING_DRILL : has
    TRAINING_SESSION ||--o{ TRAINING_ATTENDANCE : has
    TRAINING_SESSION ||--o{ PLAYER_TRAINING_ASSESSMENT : has
    MATCH ||--o{ MATCH_EVENT : has
    MATCH ||--o{ MATCH_PERFORMANCE_REVIEW : has
    MATCH ||--o{ PLAYER_MATCH_STATISTICS : has
    MATCH_FORMATION ||--o{ MATCH_LINEUP : has

    TRAINING_SESSION {
        long id PK
        long teamId
        long headCoachId
        string trainingType
        string status
        datetime scheduledDateTime
        int durationMinutes
        string location
        string objectives
        string notes
    }
    TRAINING_PLAN {
        long id PK
        string title
        string description
        long teamId
        long createdByCoachId
        date startDate
        date endDate
        string status
        string goals
        string focus
    }
    TRAINING_DRILL {
        long id PK
        long training_session_id FK
        string drillName
        string category
        int durationMinutes
        int orderInSession
        int intensity
        string equipment
        string instructions
    }
    TRAINING_ATTENDANCE {
        long id PK
        long playerId
        long training_session_id FK
        string status "PRESENT|ABSENT|LATE|EXCUSED|INJURED"
        datetime checkInTime
        string absenceReason
    }
    PLAYER_TRAINING_ASSESSMENT {
        long id PK
        long training_session_id FK
        long playerId
        long assessedByCoachId
        int performanceRating "1-10"
        int effortRating
        int attitudeRating
        string condition
        string strengths
        string areasForImprovement
        string coachComments
    }
    MATCH {
        long id PK
        long homeTeamId
        long outerTeamId
        string matchType
        string status
        string sportType
        string venue
        string competition
        string season
        int homeTeamScore
        int awayTeamScore
        datetime kickoffTime
        datetime finishTime
        string referee
        int attendance
        string matchSummary
    }
    MATCH_FORMATION {
        long id PK
        long teamId
        string setByCoachKeycloakId
        string formation "e.g. 4-3-3"
        string tacticalApproach
        string formationDetails
    }
    MATCH_LINEUP {
        long id PK
        long teamId
        string playerKeycloakId
        long match_formation_id FK
        string lineupStatus "STARTING_11|SUBSTITUTE|RESERVE"
        string position
        int jerseyNumber
        boolean wasSubstituted
        int substitutionMinute
    }
    MATCH_EVENT {
        long id PK
        long match_id FK
        string playerKeycloakId
        long teamId
        string eventType
        int minute
        int extraTime
        string description
    }
    MATCH_PERFORMANCE_REVIEW {
        long id PK
        long match_id FK
        long reviewedByCoachId
        long playerId
        string tacticalAnalysis
        string strengths
        string weaknesses
        string areasForImprovement
        int overallPerformanceRating
    }
    PLAYER_MATCH_STATISTICS {
        long id PK
        long match_id FK
        long playerId
        string sportType
        int minutesPlayed
        double performanceRating
        "+ sport-specific columns: goals, assists, rebounds, ..."
    }
```

---

## Database: `mscms_medical` (medical-fitness-service)

```mermaid
erDiagram
    INJURY ||--o{ DIAGNOSIS : has
    INJURY ||--o{ TREATMENT : has
    INJURY ||--o{ REHABILITATION : has
    REHABILITATION ||--o{ RECOVERY_PROGRAM : has

    INJURY {
        long id PK
        long playerId
        long teamId
        string injuryType
        string severity "MINOR|MODERATE|SEVERE"
        string status "ACTIVE|RECOVERING|RECOVERED"
        string bodyPart
        string description
        date injuryDate
        datetime reportedAt
        long reportedByDoctorId
    }
    DIAGNOSIS {
        long id PK
        long injury_id FK
        string playerKeycloakId
        string doctorKeycloakId
        string diagnosis
        string medicalNotes
        string recommendations
        datetime diagnosedAt
    }
    TREATMENT {
        long id PK
        long injury_id FK
        long playerId
        long doctorId
        string treatmentType
        string description
        string status
        date startDate
        date endDate
    }
    REHABILITATION {
        long id PK
        long injury_id FK
        long playerId
        long physiotherapistId
        string status "NOT_STARTED|IN_PROGRESS|COMPLETED|PAUSED"
        string rehabPlan
        string exercises
        int durationWeeks
        date startDate
        date expectedEndDate
        date actualEndDate
        string progressNotes
        string restrictions
    }
    RECOVERY_PROGRAM {
        long id PK
        long rehabilitation_id FK
        long playerId
        long createdByDoctorId
        string status
        string programName
        string description
        string activities
        string nutritionPlan
        date startDate
        date endDate
        int sessionsPerWeek
        int durationMinutes
        string goals
    }
    FITNESS_TEST {
        long id PK
        string playerKeycloakId
        long teamId
        string testType
        string sportType
        datetime testDate
        string conductedByDoctorKeycloakId
        string testName
        double result
        string unit
        string resultCategory
        string notes
        string recommendations
    }
    TRAINING_LOAD {
        long id PK
        long playerId
        long teamId
        long trainingSessionId
        date date
        int durationMinutes
        double intensity
        double load
        int distanceKm
        int heartRateAvg
        int heartRateMax
        string trainingType
        string notes
    }
```

---

## Database: `mscms_reports` (reports-analytics-service)

```mermaid
erDiagram
    MATCH_ANALYSIS {
        long id PK
        long matchId
        long teamId
        string sportType
        string sportSpecificStats "JSON"
        string keyMoments
        string tacticalAnalysis
        string playerRatings "JSON"
        string analyzedByUserKeycloakId
        datetime analyzedAt
        string notes
    }
    PLAYER_ANALYTICS {
        long id PK
        string playerKeycloakId
        long teamId
        string sportType
        date periodStart
        date periodEnd
        int totalMatches
        int primaryScore "goals|points|sets"
        int secondaryScore "assists|rebounds|aces"
        double averageRating
        int totalTrainingSessions
        int attendanceRate
        int currentInjuries
        double averageFitnessScore
        int fitnessTestsCount
        string sportSpecificStats "JSON"
        datetime calculatedAt
    }
    TEAM_ANALYTICS {
        long id PK
        long teamId
        string sportType
        date periodStart
        date periodEnd
        int totalMatches
        int wins
        int draws
        int losses
        int pointsFor
        int pointsAgainst
        double averageTeamFitnessScore
        int totalInjuries
        int totalTrainingSessions
        string kpiData "JSON"
        string sportSpecificStats "JSON"
        string trends "JSON"
    }
    TRAINING_ANALYTICS {
        long id PK
        long teamId
        string playerKeycloakId "nullable, team-wide if null"
        date periodStart
        date periodEnd
        int totalSessions
        int attendedSessions
        int missedSessions
        double attendanceRate
        double averageTrainingLoad
        double averagePerformanceScore
        int injuriesDuringPeriod
        string kpiData
        string trends
    }
    SCOUT_REPORT {
        long id PK
        string scoutKeycloakId
        long outerPlayerId
        int technicalRating "1-10"
        int physicalRating
        int tacticalRating
        int mentalityRating
        string strengths
        string weaknesses
        string overallAssessment
        boolean recommendSigning
        datetime createdAt
    }
    SPONSOR_CONTRACT_OFFER {
        long id PK
        string sponsorKeycloakId
        long teamId
        double offerAmount
        int contractDurationMonths
        string terms
        string status "PENDING|ACCEPTED|REJECTED|EXPIRED"
        datetime offeredAt
        datetime respondedAt
        string notes
    }
```

---

## Database: `mscms_notification` (notification-mail-service)

```mermaid
erDiagram
    NOTIFICATION {
        long id PK
        string recipientUserKeycloakId
        string notificationType "IN_APP|EMAIL|BOTH"
        string category
        string status
        string title
        string message
        string emailSubject
        string emailBody
        long relatedEntityId
        string relatedEntityType
        datetime createdAt
        datetime sentAt
        datetime readAt
        string actionUrl
        boolean isRead
    }
    ALERT {
        long id PK
        string alertType
        string priority "LOW|MEDIUM|HIGH|CRITICAL"
        string title
        string message
        string description
        string targetUserKeycloakId
        string targetRole
        long relatedEntityId
        string relatedEntityType
        datetime triggeredAt
        datetime acknowledgedAt
        string acknowledgedByUserKeycloakId
        boolean isAcknowledged
        boolean isResolved
        datetime resolvedAt
        string actionRequired
        string metadata
    }
    MESSAGE {
        long id PK
        string senderUserKeycloakId
        string recipientUserKeycloakId
        string subject
        string content
        string status
        long parentMessageId "self-ref for threads"
        datetime sentAt
        datetime readAt
    }
```
