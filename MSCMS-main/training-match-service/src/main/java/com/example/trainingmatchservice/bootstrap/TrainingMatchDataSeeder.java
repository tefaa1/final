package com.example.trainingmatchservice.bootstrap;

import com.example.trainingmatchservice.model.match.entity.*;
import com.example.trainingmatchservice.model.match.enums.*;
import com.example.trainingmatchservice.model.training.entity.*;
import com.example.trainingmatchservice.model.training.enums.*;
import com.example.trainingmatchservice.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.seed.enabled", havingValue = "true")
public class TrainingMatchDataSeeder implements CommandLineRunner {

    // Cross-service references (deterministic from upstream seeders):
    //   Teams (player-mgmt): 1=FC Barcelona, 2=FC Barcelona Bàsquet, 3=Barça Tennis, 4=CV Barcelona, 5=FC Barcelona Handbol
    //   OuterTeams: 1=Real Madrid CF, 2=Atlético Madrid, 3=Sevilla FC, 4=Real Madrid Baloncesto
    //   HeadCoaches: 4=Football HC, 5=Basketball HC
    //   Player profile ids (user-mgmt): 12..21 → player1..player10
    //   Player Keycloak IDs: see SeedIds in user-mgmt / player-mgmt
    private static final long TEAM_FB = 1L;
    private static final long TEAM_BB = 2L;
    private static final long OUTER_REAL_MADRID = 1L;
    private static final long OUTER_ATLETICO   = 2L;
    private static final long OUTER_RM_BBALL   = 4L;
    private static final long HEAD_COACH_FB = 4L;
    private static final long HEAD_COACH_BB = 5L;

    private static final long PLAYER_1_ID = 12L;   // Lewandowski (Striker)
    private static final long PLAYER_2_ID = 13L;   // Pedri (CM)
    private static final long PLAYER_3_ID = 14L;   // Araújo (CB)
    private static final long PLAYER_4_ID = 15L;   // ter Stegen (GK)
    private static final long PLAYER_5_ID = 16L;   // Satoranský (PG)

    private static final String PLAYER_1_KC = "00000000-0000-0000-0000-000000000101";
    private static final String PLAYER_2_KC = "00000000-0000-0000-0000-000000000102";
    private static final String PLAYER_3_KC = "00000000-0000-0000-0000-000000000103";
    private static final String PLAYER_4_KC = "00000000-0000-0000-0000-000000000104";
    private static final String HEAD_COACH_FB_KC = "00000000-0000-0000-0000-000000000020";

    private final TrainingSessionRepository trainingSessionRepository;
    private final TrainingPlanRepository trainingPlanRepository;
    private final TrainingDrillRepository trainingDrillRepository;
    private final TrainingAttendanceRepository trainingAttendanceRepository;
    private final PlayerTrainingAssessmentRepository playerTrainingAssessmentRepository;
    private final MatchRepository matchRepository;
    private final MatchFormationRepository matchFormationRepository;
    private final MatchLineupRepository matchLineupRepository;
    private final MatchEventRepository matchEventRepository;
    private final MatchPerformanceReviewRepository matchPerformanceReviewRepository;
    private final PlayerMatchStatisticsRepository playerMatchStatisticsRepository;

    @Override
    @Transactional
    public void run(String... args) {
        if (trainingSessionRepository.count() > 0 || matchRepository.count() > 0) {
            log.info("[SEED] training-match already has data — skipping.");
            return;
        }
        log.info("[SEED] Seeding training-match-service...");

        LocalDateTime now = LocalDateTime.now();

        // ─── Training Sessions ──────────────────────────────────────────────
        TrainingSession s1 = saveSession(TEAM_FB, HEAD_COACH_FB, TrainingType.TACTICAL,  TrainingStatus.COMPLETED,
                now.minusDays(2), 90, "Ciutat Esportiva Joan Gamper - Pitch 1",
                "Defensive shape vs. 4-3-3", "Focused on pressing triggers and back-line cohesion.");
        TrainingSession s2 = saveSession(TEAM_FB, HEAD_COACH_FB, TrainingType.FITNESS,   TrainingStatus.SCHEDULED,
                now.plusDays(1), 60, "Ciutat Esportiva Joan Gamper - Gym",
                "VO2 max + sprint intervals", null);
        TrainingSession s3 = saveSession(TEAM_FB, HEAD_COACH_FB, TrainingType.RECOVERY,  TrainingStatus.SCHEDULED,
                now.plusDays(2), 45, "Ciutat Esportiva Joan Gamper - Pool",
                "Active recovery after league fixture", null);
        TrainingSession s4 = saveSession(TEAM_BB, HEAD_COACH_BB, TrainingType.TECHNICAL, TrainingStatus.ONGOING,
                now.minusHours(1), 75, "Palau Blaugrana",
                "Pick & roll execution drills", null);
        TrainingSession s5 = saveSession(TEAM_BB, HEAD_COACH_BB, TrainingType.VIDEO_ANALYSIS, TrainingStatus.SCHEDULED,
                now.plusDays(3), 60, "Palau Blaugrana - Video Room",
                "Opponent breakdown — Real Madrid Baloncesto", null);

        // ─── Training Plans ─────────────────────────────────────────────────
        savePlan("Pre-Clásico Tactical Block", TEAM_FB, HEAD_COACH_FB,
                now.toLocalDate().minusDays(7), now.toLocalDate().plusDays(7), PlanStatus.ACTIVE,
                TrainingType.TACTICAL,
                "Sharpen high-press triggers and rotational defending ahead of El Clásico.",
                "High pressing, rest defence");
        savePlan("Mid-Season Fitness Cycle", TEAM_FB, HEAD_COACH_FB,
                now.toLocalDate().minusDays(30), now.toLocalDate().plusDays(14), PlanStatus.ACTIVE,
                TrainingType.FITNESS,
                "Mid-season conditioning to maintain peak fitness through congested fixtures.",
                "VO2 max, sprint repeatability");
        savePlan("Basketball Pre-Season Build-Up", TEAM_BB, HEAD_COACH_BB,
                now.toLocalDate().minusDays(60), now.toLocalDate().minusDays(20), PlanStatus.COMPLETED,
                TrainingType.TECHNICAL,
                "Off-season build-up — strength, set plays and pick & roll patterns.",
                "Pick & roll, transition defence");

        // ─── Training Drills (linked to sessions) ───────────────────────────
        saveDrill(s1, "5v3 Rondo (Press Triggers)", DrillCategory.TACTICAL, 15, 1, 8,
                "Cones, bibs, balls", "Mid players cue press; rondo rotates on weak side.");
        saveDrill(s1, "Back-line Shape Drill", DrillCategory.DEFENDING_DRILL, 20, 2, 7,
                "Mannequins, cones", "Four defenders shift together vs simulated 4-3-3.");
        saveDrill(s2, "Repeated 30m Sprints", DrillCategory.FITNESS, 25, 1, 9,
                "Stopwatch, cones", "10 reps × 30m with 45s rest. Track times.");
        saveDrill(s4, "Pick & Roll Execution", DrillCategory.TECHNICAL, 30, 1, 7,
                "Basketballs", "Two-man action against live defence, full court.");

        // ─── Training Attendance ────────────────────────────────────────────
        // Session 1 (Tactical, completed) — full attendance from football squad
        saveAttendance(PLAYER_1_ID, s1, AttendanceStatus.PRESENT, s1.getScheduledDateTime(), null, null);
        saveAttendance(PLAYER_2_ID, s1, AttendanceStatus.PRESENT, s1.getScheduledDateTime(), null, null);
        saveAttendance(PLAYER_3_ID, s1, AttendanceStatus.LATE,    s1.getScheduledDateTime().plusMinutes(8), "Traffic on B-23", "Joined the second drill block.");
        saveAttendance(PLAYER_4_ID, s1, AttendanceStatus.PRESENT, s1.getScheduledDateTime(), null, null);
        // Session 4 (Basketball, ongoing)
        saveAttendance(PLAYER_5_ID, s4, AttendanceStatus.PRESENT, s4.getScheduledDateTime(), null, null);

        // ─── Player Training Assessments ────────────────────────────────────
        saveAssessment(s1, PLAYER_1_ID, HEAD_COACH_FB, 9, 9, 9, PlayerCondition.EXCELLENT,
                "Movement off the ball, finishing in tight spaces.",
                "Hold-up play under physical pressure.",
                "Leader on the day — set the tone for the press.");
        saveAssessment(s1, PLAYER_2_ID, HEAD_COACH_FB, 8, 9, 9, PlayerCondition.GOOD,
                "Press resistance, line-breaking passes.",
                "Defensive transitions, recovery sprints.",
                "Pedri keeps lifting the tempo when we need it.");
        saveAssessment(s1, PLAYER_3_ID, HEAD_COACH_FB, 7, 8, 8, PlayerCondition.GOOD,
                "Aerial duels, tight marking on strikers.",
                "Build-up passing under press.",
                "Strong defensively — keep working on first touch.");
        saveAssessment(s4, PLAYER_5_ID, HEAD_COACH_BB, 8, 7, 8, PlayerCondition.GOOD,
                "Court vision, pick & roll reads.",
                "Three-point consistency.",
                "Floor general — sees the play one step ahead.");

        // ─── Matches ────────────────────────────────────────────────────────
        Match m1 = saveMatch(TEAM_FB, OUTER_REAL_MADRID, MatchType.LEAGUE, MatchStatus.FINISHED, SportType.FOOTBALL,
                "Spotify Camp Nou", "La Liga", "2024/2025",
                2, 1, now.minusDays(5), now.minusDays(5).plusHours(2), "Antonio Mateu Lahoz", 92_000,
                "El Clásico win — Lewandowski brace.");
        Match m2 = saveMatch(TEAM_FB, OUTER_ATLETICO, MatchType.LEAGUE, MatchStatus.SCHEDULED, SportType.FOOTBALL,
                "Spotify Camp Nou", "La Liga", "2024/2025",
                null, null, now.plusDays(7), null, "TBD", null, null);
        Match m3 = saveMatch(TEAM_BB, OUTER_RM_BBALL, MatchType.CUP, MatchStatus.SCHEDULED, SportType.BASKETBALL,
                "Palau Blaugrana", "Copa del Rey de Baloncesto", "2024/2025",
                null, null, now.plusDays(4), null, "TBD", null, null);

        // ─── Match Formations + Lineups (for the finished El Clásico) ──────
        MatchFormation form1 = saveFormation(TEAM_FB, HEAD_COACH_FB_KC, "4-3-3",
                "High press, build through midfield",
                "GK ter Stegen; Back-4 Araújo + Koundé + Cubarsí + Balde; Mid Pedri + de Jong + Gündogan; Front Yamal + Lewandowski + Raphinha");
        // Starting 11 (Football positions)
        saveLineup(TEAM_FB, PLAYER_4_KC, form1, LineupStatus.STARTING_11, Position.GOALKEEPER,        1,  false, null, null);
        saveLineup(TEAM_FB, PLAYER_3_KC, form1, LineupStatus.STARTING_11, Position.CENTER_BACK,       4,  false, null, null);
        saveLineup(TEAM_FB, PLAYER_2_KC, form1, LineupStatus.STARTING_11, Position.CENTRAL_MID,       8,  false, null, null);
        saveLineup(TEAM_FB, PLAYER_1_KC, form1, LineupStatus.STARTING_11, Position.STRIKER,           9,  true,  82,   null);

        // ─── Match Events (El Clásico) ─────────────────────────────────────
        saveEvent(m1, PLAYER_1_KC, TEAM_FB, EventType.GOAL,           18, null, "Lewandowski 1-0: tap-in off Pedri assist.");
        saveEvent(m1, PLAYER_2_KC, TEAM_FB, EventType.ASSIST,         18, null, "Pedri through-ball splits the back line.");
        saveEvent(m1, PLAYER_1_KC, TEAM_FB, EventType.PENALTY_SCORED, 64, null, "Lewandowski 2-0 from the spot.");
        saveEvent(m1, PLAYER_3_KC, TEAM_FB, EventType.YELLOW_CARD,    71, null, "Cynical foul to stop a counter.");

        // ─── Match Performance Reviews ──────────────────────────────────────
        saveReview(m1, HEAD_COACH_FB, PLAYER_1_ID,
                "Held the line and pinned both center-backs deep. Movement opened space for Pedri/Raphinha cut-ins.",
                "Two goals, 4 shots on target, won 6/8 aerial duels.",
                "Hold-up play in transitions — gave the ball away under press 3 times.",
                "Keep working on link play with Yamal.",
                9);
        saveReview(m1, HEAD_COACH_FB, PLAYER_2_ID,
                "Best player on the pitch by some distance. Pressed, recovered, created.",
                "92% pass accuracy, 3 key passes, 1 assist, 8 ball recoveries.",
                "Fatigue late on — sub at 80' was correct.",
                "Manage minutes for the cup tie midweek.",
                9);

        // ─── Player Match Statistics ────────────────────────────────────────
        savePlayerStats(m1, PLAYER_1_ID, SportType.FOOTBALL, 82, 8.7);  // Lewandowski
        savePlayerStats(m1, PLAYER_2_ID, SportType.FOOTBALL, 80, 8.9);  // Pedri
        savePlayerStats(m1, PLAYER_3_ID, SportType.FOOTBALL, 90, 7.4);  // Araújo
        savePlayerStats(m1, PLAYER_4_ID, SportType.FOOTBALL, 90, 7.1);  // ter Stegen

        log.info("[SEED] training-match seeded: sessions={}, plans={}, drills={}, attendance={}, assessments={}, matches={}, formations={}, lineups={}, events={}, reviews={}, playerStats={}",
                trainingSessionRepository.count(), trainingPlanRepository.count(),
                trainingDrillRepository.count(), trainingAttendanceRepository.count(),
                playerTrainingAssessmentRepository.count(), matchRepository.count(),
                matchFormationRepository.count(), matchLineupRepository.count(),
                matchEventRepository.count(), matchPerformanceReviewRepository.count(),
                playerMatchStatisticsRepository.count());
    }

    // ─── Save helpers ───────────────────────────────────────────────────────

    private TrainingSession saveSession(long teamId, long headCoachId,
                                        TrainingType type, TrainingStatus status,
                                        LocalDateTime when, int duration, String location,
                                        String objectives, String notes) {
        TrainingSession s = new TrainingSession();
        s.setTeamId(teamId);
        s.setHeadCoachId(headCoachId);
        s.setTrainingType(type);
        s.setStatus(status);
        s.setScheduledDateTime(when);
        s.setDurationMinutes(duration);
        s.setLocation(location);
        s.setObjectives(objectives);
        s.setNotes(notes);
        return trainingSessionRepository.save(s);
    }

    private TrainingPlan savePlan(String title, long teamId, long coachId,
                                  LocalDate start, LocalDate end, PlanStatus status,
                                  TrainingType type, String description, String focus) {
        TrainingPlan p = new TrainingPlan();
        p.setTitle(title);
        p.setTeamId(teamId);
        p.setCreatedByCoachId(coachId);
        p.setStartDate(start);
        p.setEndDate(end);
        p.setStatus(status);
        p.setTrainingType(type);
        p.setSessionSlots(buildSlots(start, end, 5));
        p.setDescription(description);
        p.setGoals(description);
        p.setFocus(focus);
        return trainingPlanRepository.save(p);
    }

    // Auto-generate up to `count` lightweight session slots evenly spread across
    // the plan's date range (stored as JSON the frontend reads). The slot's
    // sessionId is filled later when a real session is attached.
    private String buildSlots(LocalDate start, LocalDate end, int count) {
        long totalDays = java.time.temporal.ChronoUnit.DAYS.between(start, end) + 1;
        int n = (int) Math.max(1, Math.min(count, totalDays));
        double step = (double) totalDays / n;
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < n; i++) {
            LocalDate d = start.plusDays((long) Math.floor(i * step));
            if (i > 0) sb.append(",");
            sb.append("{\"name\":\"Session ").append(i + 1)
              .append("\",\"date\":\"").append(d).append("\",\"sessionId\":null}");
        }
        return sb.append("]").toString();
    }

    private TrainingDrill saveDrill(TrainingSession session, String name, DrillCategory category,
                                    int duration, int order, int intensity,
                                    String equipment, String instructions) {
        TrainingDrill d = new TrainingDrill();
        d.setTrainingSession(session);
        d.setDrillName(name);
        d.setCategory(category);
        d.setDurationMinutes(duration);
        d.setOrderInSession(order);
        d.setIntensity(intensity);
        d.setEquipment(equipment);
        d.setInstructions(instructions);
        d.setDescription(instructions);
        return trainingDrillRepository.save(d);
    }

    private TrainingAttendance saveAttendance(long playerId, TrainingSession session,
                                              AttendanceStatus status, LocalDateTime checkIn,
                                              String absenceReason, String notes) {
        TrainingAttendance a = new TrainingAttendance();
        a.setPlayerId(playerId);
        a.setTrainingSession(session);
        a.setStatus(status);
        a.setCheckInTime(checkIn);
        a.setAbsenceReason(absenceReason);
        a.setNotes(notes);
        return trainingAttendanceRepository.save(a);
    }

    private PlayerTrainingAssessment saveAssessment(TrainingSession session, long playerId, long coachId,
                                                    int performance, int effort, int attitude,
                                                    PlayerCondition condition, String strengths,
                                                    String areasForImprovement, String comments) {
        PlayerTrainingAssessment a = new PlayerTrainingAssessment();
        a.setTrainingSession(session);
        a.setPlayerId(playerId);
        a.setAssessedByCoachId(coachId);
        a.setPerformanceRating(performance);
        a.setEffortRating(effort);
        a.setAttitudeRating(attitude);
        a.setCondition(condition);
        a.setStrengths(strengths);
        a.setAreasForImprovement(areasForImprovement);
        a.setCoachComments(comments);
        return playerTrainingAssessmentRepository.save(a);
    }

    private Match saveMatch(long homeTeamId, long outerTeamId, MatchType type, MatchStatus status,
                            SportType sport, String venue, String competition, String season,
                            Integer homeScore, Integer awayScore,
                            LocalDateTime kickoff, LocalDateTime finish,
                            String referee, Integer attendance, String summary) {
        Match m = new Match();
        m.setHomeTeamId(homeTeamId);
        m.setOuterTeamId(outerTeamId);
        m.setMatchType(type);
        m.setStatus(status);
        m.setSportType(sport);
        m.setVenue(venue);
        m.setCompetition(competition);
        m.setSeason(season);
        m.setHomeTeamScore(homeScore);
        m.setAwayTeamScore(awayScore);
        m.setKickoffTime(kickoff);
        m.setFinishTime(finish);
        m.setReferee(referee);
        m.setAttendance(attendance);
        m.setMatchSummary(summary);
        return matchRepository.save(m);
    }

    private MatchFormation saveFormation(long teamId, String coachKc, String formation,
                                         String tacticalApproach, String details) {
        MatchFormation f = new MatchFormation();
        f.setTeamId(teamId);
        f.setSetByCoachKeycloakId(coachKc);
        f.setFormation(formation);
        f.setTacticalApproach(tacticalApproach);
        f.setFormationDetails(details);
        return matchFormationRepository.save(f);
    }

    private MatchLineup saveLineup(long teamId, String playerKc, MatchFormation formation,
                                   LineupStatus status, Position position, int jersey,
                                   boolean wasSubbed, Integer subMinute, Long subByPlayerId) {
        MatchLineup l = new MatchLineup();
        l.setTeamId(teamId);
        l.setPlayerKeycloakId(playerKc);
        l.setMatchFormation(formation);
        l.setLineupStatus(status);
        l.setPosition(position);
        l.setJerseyNumber(jersey);
        l.setWasSubstituted(wasSubbed);
        l.setSubstitutionMinute(subMinute);
        l.setSubstitutedByPlayerId(subByPlayerId);
        return matchLineupRepository.save(l);
    }

    private MatchEvent saveEvent(Match match, String playerKc, long teamId, EventType type,
                                 int minute, Integer extraTime, String description) {
        MatchEvent e = new MatchEvent();
        e.setMatch(match);
        e.setPlayerKeycloakId(playerKc);
        e.setTeamId(teamId);
        e.setEventType(type);
        e.setMinute(minute);
        e.setExtraTime(extraTime);
        e.setDescription(description);
        return matchEventRepository.save(e);
    }

    private MatchPerformanceReview saveReview(Match match, long coachId, long playerId,
                                              String tactical, String strengths,
                                              String weaknesses, String areas, int overall) {
        MatchPerformanceReview r = new MatchPerformanceReview();
        r.setMatch(match);
        r.setReviewedByCoachId(coachId);
        r.setPlayerId(playerId);
        r.setTacticalAnalysis(tactical);
        r.setStrengths(strengths);
        r.setWeaknesses(weaknesses);
        r.setAreasForImprovement(areas);
        r.setOverallPerformanceRating(overall);
        return matchPerformanceReviewRepository.save(r);
    }

    private PlayerMatchStatistics savePlayerStats(Match match, long playerId, SportType sport,
                                                  int minutesPlayed, double performanceRating) {
        PlayerMatchStatistics s = new PlayerMatchStatistics();
        s.setMatch(match);
        s.setPlayerId(playerId);
        s.setSportType(sport);
        s.setMinutesPlayed(minutesPlayed);
        s.setPerformanceRating(performanceRating);
        return playerMatchStatisticsRepository.save(s);
    }
}
