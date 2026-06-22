// ─── CONSTANTS ────────────────────────────────────────────────────────────────
export const SPORTS = ["FOOTBALL", "BASKETBALL", "TENNIS", "HANDBALL"];
export const SPORT_COLORS = { FOOTBALL: "#10b981", BASKETBALL: "#f59e0b", TENNIS: "#38bdf8", SWIMMING: "#5eead4", VOLLEYBALL: "#a78bfa", HANDBALL: "#f87171" };
export const SPORT_ICONS = { FOOTBALL: "⚽", BASKETBALL: "🏀", TENNIS: "🎾", SWIMMING: "🏊", VOLLEYBALL: "🏐", HANDBALL: "🤾" };
export const ROLES = ["ADMIN", "PLAYER", "HEAD_COACH", "ASSISTANT_COACH", "FITNESS_COACH", "SPECIFIC_COACH", "DOCTOR", "PHYSIOTHERAPIST", "PERFORMANCE_ANALYST", "TEAM_MANAGER", "SPORT_MANAGER", "SCOUT", "FAN", "SPONSOR"];
export const CONTRACT_STATUS = ["ACTIVE", "EXPIRED", "TERMINATED", "ON_HOLD"];
export const TRANSFER_STATUS = ["PENDING", "NEGOTIATING", "COMPLETED", "CANCELLED"];
export const INJURY_TYPES = ["MUSCLE_STRAIN", "LIGAMENT_SPRAIN", "FRACTURE", "CONTUSION", "TENDONITIS", "DISLOCATION", "CONCUSSION"];
export const INJURY_SEVERITY = ["MINOR", "MODERATE", "SEVERE", "CRITICAL"];
export const INJURY_STATUS_LIST = ["REPORTED", "DIAGNOSED", "TREATING", "RECOVERING", "RECOVERED", "CHRONIC"];
export const SESSION_TYPES = ["TACTICAL", "TECHNICAL", "FITNESS", "RECOVERY", "SET_PIECES"];
export const SESSION_STATUS = ["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];
export const MATCH_TYPES = ["FRIENDLY", "LEAGUE", "CUP", "TOURNAMENT", "PRE_SEASON"];
export const MATCH_STATUS = ["SCHEDULED", "LIVE", "FINISHED", "CANCELLED", "POSTPONED"];
export const FITNESS_TEST_TYPES = ["VO2_MAX", "SPEED_TEST", "AGILITY_TEST", "STRENGTH_TEST", "FLEXIBILITY_TEST", "ENDURANCE_TEST", "BODY_COMPOSITION"];
export const TREATMENT_STATUS = ["PLANNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];
export const CALLUP_STATUS = ["PENDING", "ACCEPTED", "DECLINED"];
export const ALERT_TYPES = ["INJURY_REPORTED", "MEDICAL_CHECKUP_DUE", "FITNESS_TEST_DUE", "KPI_DROP", "MATCH_UPCOMING", "PLAYER_SUSPENSION", "TRANSFER_COMPLETED", "CONTRACT_EXPIRING", "SCOUT_REPORT_SUBMITTED", "SPONSOR_OFFER_RECEIVED", "SYSTEM"];
export const ALERT_PRIORITY = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
export const STAFF_ROLES = ["HEAD_COACH", "ASSISTANT_COACH", "FITNESS_COACH", "DOCTOR", "PHYSIOTHERAPIST", "PERFORMANCE_ANALYST"];
export const DRILL_CATEGORIES = ["WARMUP", "COOLDOWN", "FITNESS", "TACTICAL", "TECHNICAL", "RECOVERY", "SHOOTING_DRILL", "PASSING_DRILL", "DEFENDING_DRILL", "DRIBBLING_DRILL", "AGILITY_DRILL"];

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
export const MOCK = {
    users: [
        { id: 1, keycloakId: "uid-001", firstName: "Ahmed", lastName: "Benali", email: "ahmed@club.dz", role: "ADMIN", gender: "MALE", phoneNumber: "+213555001" },
        { id: 2, keycloakId: "uid-002", firstName: "Karim", lastName: "Mansouri", email: "karim@club.dz", role: "HEAD_COACH", gender: "MALE", phoneNumber: "+213555002" },
        { id: 3, keycloakId: "uid-003", firstName: "Sara", lastName: "Ouali", email: "sara@club.dz", role: "DOCTOR", gender: "FEMALE", phoneNumber: "+213555003" },
        { id: 4, keycloakId: "uid-004", firstName: "Youcef", lastName: "Zidane", email: "youcef@club.dz", role: "PLAYER", gender: "MALE", phoneNumber: "+213555004" },
        { id: 5, keycloakId: "uid-005", firstName: "Amina", lastName: "Kerouani", email: "amina@club.dz", role: "SCOUT", gender: "FEMALE", phoneNumber: "+213555005" },
    ],
    teams: [
        { id: 1, name: "Blue Stars FC", country: "Algeria", sportId: 1 },
        { id: 2, name: "Blue Stars BB", country: "Algeria", sportId: 2 },
        { id: 3, name: "Blue Stars HB", country: "Algeria", sportId: 3 },
    ],
    sports: [
        { id: 1, name: "Football Division 1", sportType: "FOOTBALL" },
        { id: 2, name: "Basketball League", sportType: "BASKETBALL" },
        { id: 3, name: "Handball Premier", sportType: "HANDBALL" },
    ],
    nationalTeams: [
        { id: 1, name: "Algeria National Football Team", country: "Algeria", sportType: "FOOTBALL" },
        { id: 2, name: "Algeria National Basketball Team", country: "Algeria", sportType: "BASKETBALL" },
    ],
    staff: [
        { id: 1, userKeycloakId: "uid-002", teamId: 1, staffRole: "HEAD_COACH", specialization: "Tactical", contractStart: "2024-07-01", contractEnd: "2026-06-30" },
        { id: 2, userKeycloakId: "uid-003", teamId: 1, staffRole: "DOCTOR", specialization: "Sports Medicine", contractStart: "2024-07-01", contractEnd: "2025-06-30" },
    ],
    scouts: [
        { id: 1, userKeycloakId: "uid-005", region: "North Africa", organizationName: "Elite Scout Agency" },
    ],
    contracts: [
        { id: 1, playerKeycloakId: "uid-004", teamId: 1, startDate: "2024-07-01", endDate: "2026-06-30", salary: 50000, releaseClause: 2000000, contractStatus: "ACTIVE" },
    ],
    incomingTransfers: [
        { id: 1, playerKeycloakId: "uid-007", fromTeam: "FC Rival", transferFee: 3500000, transferDate: "2025-01-15", status: "COMPLETED", contractDetails: "3-year deal" },
    ],
    outgoingTransfers: [
        { id: 1, playerKeycloakId: "uid-008", toTeam: "FC Destination", transferFee: 5000000, transferDate: "2025-01-31", status: "PENDING", contractDetails: "Sold permanently" },
    ],
    rosters: [
        { id: 1, teamId: 1, playerKeycloakId: "uid-004", seasonYear: "2025/2026" },
    ],
    callups: [
        { id: 1, playerKeycloakId: "uid-004", callUpDate: "2025-03-01", returnDate: "2025-03-15", status: "APPROVED" },
    ],
    outerPlayers: [
        { id: 1, name: "Ahmed Rami", currentTeam: "FC Atlas", position: "STRIKER", age: 23, nationality: "Moroccan" },
    ],
    outerTeams: [
        { id: 1, name: "FC Atlas", country: "Morocco", league: "Botola Pro" },
    ],
    injuries: [
        { id: 1, playerKeycloakId: "uid-006", teamId: 1, reportedByDoctorKeycloakId: "uid-003", injuryType: "MUSCLE_STRAIN", severity: "MODERATE", injuredBodyPart: "Left hamstring", injuryDate: "2025-03-15", expectedRecoveryDate: "2025-04-20", status: "TREATING", description: "Sprint injury" },
    ],
    diagnoses: [
        { id: 1, playerKeycloakId: "uid-006", injuryId: 1, diagnosis: "Grade II hamstring strain", recommendations: "4-6 weeks rest" },
    ],
    treatments: [
        { id: 1, injuryId: 1, playerKeycloakId: "uid-006", treatmentType: "PHYSIOTHERAPY", status: "IN_PROGRESS", startDate: "2025-03-16" },
    ],
    rehabs: [
        { id: 1, playerKeycloakId: "uid-006", injuryId: 1, status: "IN_PROGRESS", progressPercent: 73 },
    ],
    fitnessTests: [
        { id: 1, playerKeycloakId: "uid-004", teamId: 1, testType: "VO2_MAX", sportType: "FOOTBALL", testDate: "2025-03-20", testName: "Aerobic Capacity", result: 58.5, unit: "ml/kg/min", resultCategory: "Excellent" },
    ],
    sponsorOffers: [
        { id: 1, sponsorKeycloakId: "uid-009", sponsorName: "SportsBrand Co.", offerTitle: "Kit Sponsorship 2025/2026", contractValue: 500000, startDate: "2025-07-01", endDate: "2026-06-30", sponsorshipType: "KIT", status: "PENDING", targetTeamId: 1 },
    ],
    matchAnalyses: [
        { id: 1, matchId: 1, sportType: "FOOTBALL", analystKeycloakId: "uid-010", keyFindings: "Strong pressing high up the pitch", xgFor: 2.4, xgAgainst: 0.8, possession: 62 },
    ],
    playerAnalytics: [
        { id: 1, playerKeycloakId: "uid-004", sportType: "FOOTBALL", primaryScore: 12, secondaryScore: 5, matchesPlayed: 20, minutesPlayed: 1780, performanceRating: 8.2 },
    ],
    teamAnalytics: [
        { id: 1, teamId: 1, sportType: "FOOTBALL", wins: 14, draws: 3, losses: 3, pointsFor: 45, pointsAgainst: 20, winRate: 0.7 },
    ],
    trainingAnalytics: [
        { id: 1, teamId: 1, sportType: "FOOTBALL", sessionCount: 24, avgAttendance: 87, avgPerformanceScore: 7.8, totalHours: 48 },
        { id: 2, teamId: 2, sportType: "BASKETBALL", sessionCount: 18, avgAttendance: 92, avgPerformanceScore: 8.1, totalHours: 36 },
    ],
    alerts: [
        { id: 1, alertType: "INJURY_REPORTED", priority: "HIGH", title: "Critical Injury Alert", message: "Player Youcef reported with hamstring strain", targetRole: "DOCTOR", acknowledged: false, resolved: false },
        { id: 2, alertType: "CONTRACT_EXPIRING", priority: "MEDIUM", title: "Contract Expiring Soon", message: "Karim Mansouri contract expires in 30 days", targetRole: "TEAM_MANAGER", acknowledged: false, resolved: false },
    ],
    notifications: [
        { id: 1, title: "Match Scheduled", message: "Blue Stars FC vs Red Lions FC scheduled for Nov 2", category: "MATCH_REMINDER", status: "UNREAD" },
        { id: 2, title: "Injury Report", message: "Player #6 reported injury during training", category: "INJURY", status: "READ" },
    ],
    messages: [
        { id: 1, senderUserKeycloakId: "uid-002", recipientUserKeycloakId: "uid-003", subject: "Recovery Update", content: "Hi Doctor, update on Youcef recovery?", status: "SENT", createdAt: "2025-10-30" },
        { id: 2, senderUserKeycloakId: "uid-003", recipientUserKeycloakId: "uid-002", subject: "Re: Recovery Update", content: "He needs 2 more weeks rest.", status: "READ", createdAt: "2025-10-31", parentMessageId: 1 },
    ],
};
