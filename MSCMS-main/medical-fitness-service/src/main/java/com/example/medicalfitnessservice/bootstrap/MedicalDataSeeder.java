package com.example.medicalfitnessservice.bootstrap;

import com.example.medicalfitnessservice.model.entity.Diagnosis;
import com.example.medicalfitnessservice.model.entity.FitnessTest;
import com.example.medicalfitnessservice.model.entity.Injury;
import com.example.medicalfitnessservice.model.entity.RecoveryProgram;
import com.example.medicalfitnessservice.model.entity.Rehabilitation;
import com.example.medicalfitnessservice.model.entity.TrainingLoad;
import com.example.medicalfitnessservice.model.entity.Treatment;
import com.example.medicalfitnessservice.model.enums.FitnessTestType;
import com.example.medicalfitnessservice.model.enums.InjurySeverity;
import com.example.medicalfitnessservice.model.enums.InjuryStatus;
import com.example.medicalfitnessservice.model.enums.InjuryType;
import com.example.medicalfitnessservice.model.enums.RecoveryProgramStatus;
import com.example.medicalfitnessservice.model.enums.RehabStatus;
import com.example.medicalfitnessservice.model.enums.SportType;
import com.example.medicalfitnessservice.model.enums.TreatmentStatus;
import com.example.medicalfitnessservice.repository.DiagnosisRepository;
import com.example.medicalfitnessservice.repository.FitnessTestRepository;
import com.example.medicalfitnessservice.repository.InjuryRepository;
import com.example.medicalfitnessservice.repository.RecoveryProgramRepository;
import com.example.medicalfitnessservice.repository.RehabilitationRepository;
import com.example.medicalfitnessservice.repository.TrainingLoadRepository;
import com.example.medicalfitnessservice.repository.TreatmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.seed.enabled", havingValue = "true")
public class MedicalDataSeeder implements CommandLineRunner {

    // Cross-service references (kept here so the file is self-explanatory):
    //   player_profiles ids 12..21 = player1..player10 (user-mgmt insert order)
    //   doctor user_profiles id = 6
    //   team ids in player-mgmt: 1=FC Barcelona, 2=FC Barcelona Bàsquet, 5=FC Barcelona Handbol
    private static final long PLAYER_1_ID = 12L;        // Lewandowski (FB striker)
    private static final long PLAYER_2_ID = 13L;        // Pedri        (FB mid)
    private static final long PLAYER_3_ID = 14L;        // Araújo       (FB defender)
    private static final long PLAYER_3_DEF_ID  = PLAYER_3_ID; // legacy alias
    private static final long PLAYER_4_ID = 15L;        // ter Stegen   (FB GK)
    private static final long PLAYER_5_ID = 16L;        // Satoranský   (BB)
    private static final long PLAYER_5_BBALL_ID = PLAYER_5_ID; // legacy alias
    private static final long PLAYER_7_ID = 18L;        // Aleix Gómez  (HB left back)
    private static final long PLAYER_8_ID = 19L;        // Ludovic Fabregas (HB centre back)
    private static final long TEAM_FB = 1L;
    private static final long TEAM_BB = 2L;
    private static final long TEAM_HB = 5L;
    private static final long DOCTOR_ID = 6L;
    private static final String PLAYER_1_KC = "00000000-0000-0000-0000-000000000101";
    private static final String PLAYER_2_KC = "00000000-0000-0000-0000-000000000102";
    private static final String PLAYER_3_KC = "00000000-0000-0000-0000-000000000103";
    private static final String PLAYER_4_KC = "00000000-0000-0000-0000-000000000104";
    private static final String PLAYER_5_KC = "00000000-0000-0000-0000-000000000105";
    private static final String PLAYER_7_KC = "00000000-0000-0000-0000-000000000107";
    private static final String PLAYER_8_KC = "00000000-0000-0000-0000-000000000108";
    private static final String DOCTOR_KC   = "00000000-0000-0000-0000-000000000030";

    private final InjuryRepository injuryRepository;
    private final DiagnosisRepository diagnosisRepository;
    private final TreatmentRepository treatmentRepository;
    private final RehabilitationRepository rehabilitationRepository;
    private final RecoveryProgramRepository recoveryProgramRepository;
    private final FitnessTestRepository fitnessTestRepository;
    private final TrainingLoadRepository trainingLoadRepository;

    // Physio + fitness coach Keycloak IDs (match user-mgmt seed)
    private static final String PHYSIO_KC  = "00000000-0000-0000-0000-000000000031";
    private static final String FITNESS_KC = "00000000-0000-0000-0000-000000000032";
    private static final long PHYSIO_ID    = 7L;
    private static final long FITNESS_ID   = 8L;

    @Override
    @Transactional
    public void run(String... args) {
        // Per-section idempotent seeding. The previous version had a single
        // whole-method guard on injuryRepository.count() — that meant once
        // ANY injury existed in the DB, fitness tests and training loads (and
        // recovery / rehab additions) could never be back-filled without
        // wiping the volume. Now each section guards on its own table.
        log.info("[SEED] Seeding medical-fitness-service (per-table idempotent)...");

        Injury injury1 = null;
        Injury injury2 = null;
        Rehabilitation rehab1 = null;
        Rehabilitation rehab2 = null;
        Rehabilitation rehab3 = null;

        // ─── Injuries + Diagnoses + Treatments ──────────────────────────────
        if (injuryRepository.count() == 0) {

        injury1 = saveInjury(PLAYER_3_DEF_ID, TEAM_FB, InjuryType.LIGAMENT_SPRAIN,
                InjurySeverity.MODERATE, InjuryStatus.RECOVERING,
                "Right ankle", "Sprained right ankle during La Liga fixture vs. Real Madrid.",
                LocalDate.now().minusDays(10));
        saveDiagnosis(injury1, PLAYER_3_KC, "Grade II lateral ankle ligament sprain",
                "MRI shows partial tear of ATFL; CFL intact.",
                "Rest 14 days, no contact training. Re-evaluate in 1 week.");
        saveTreatment(injury1, PLAYER_3_DEF_ID, "Physiotherapy",
                "Progressive loading + manual therapy + balance work.", TreatmentStatus.IN_PROGRESS,
                LocalDate.now().minusDays(9), null);

        injury2 = saveInjury(PLAYER_5_BBALL_ID, TEAM_BB, InjuryType.MUSCLE_STRAIN,
                InjurySeverity.MINOR, InjuryStatus.RECOVERED,
                "Left hamstring", "Mild hamstring strain during sprint session.",
                LocalDate.now().minusDays(25));
        saveDiagnosis(injury2, PLAYER_5_KC, "Grade I hamstring strain",
                "Clinical examination only. No imaging needed.",
                "Returned to full training after 10 days.");
        saveTreatment(injury2, PLAYER_5_BBALL_ID, "Medication",
                "NSAIDs + targeted stretching protocol.", TreatmentStatus.COMPLETED,
                LocalDate.now().minusDays(24), LocalDate.now().minusDays(14));

        } else {
            // Injuries already exist — fetch handles for downstream sections.
            injury1 = injuryRepository.findById(1L).orElse(null);
            injury2 = injuryRepository.findById(2L).orElse(null);
        }

        // ─── Rehabilitations (linked to active injuries) ─────────────────────
        if (rehabilitationRepository.count() == 0 && injury1 != null && injury2 != null) {
        rehab1 = saveRehabilitation(injury1, PLAYER_3_DEF_ID, RehabStatus.IN_PROGRESS,
                "Phased return-to-play — 4 stages: pain mgmt → strength → sport-specific → match fit.",
                "Calf raises, single-leg balance, gradual sprint work, agility ladders.",
                3, LocalDate.now().minusDays(9), LocalDate.now().plusDays(12),
                "Stage 2 complete. Player tolerating cutting drills without discomfort.",
                "No contact training. Avoid lateral cutting > 60% intensity for another week.");

        rehab2 = saveRehabilitation(injury2, PLAYER_5_BBALL_ID, RehabStatus.COMPLETED,
                "Standard hamstring rehab protocol — eccentric strengthening focus.",
                "Nordic curls, Romanian deadlifts, running progression.",
                2, LocalDate.now().minusDays(24), LocalDate.now().minusDays(14),
                "Returned to full training pain-free. Cleared by medical staff.",
                "Maintain strength work twice weekly to prevent recurrence.");

        // Preventive rehab for a handball player (no injury linked — fresh start)
        rehab3 = saveRehabilitation(injury1, PLAYER_7_ID, RehabStatus.NOT_STARTED,
                "Shoulder pre-hab program — handball back position carries high overhead-throw load.",
                "Resistance band ER/IR rotations, scapular control work, posterior chain strength.",
                4, LocalDate.now().plusDays(2), LocalDate.now().plusDays(30),
                "Baseline assessment booked. Awaiting strength benchmark from fitness coach.",
                "Avoid loaded overhead pressing until first review.");
        } else {
            rehab1 = rehabilitationRepository.findById(1L).orElse(null);
            rehab2 = rehabilitationRepository.findById(2L).orElse(null);
            rehab3 = rehabilitationRepository.findById(3L).orElse(null);
        }

        // ─── Recovery Programs (linked to rehabilitations) ───────────────────
        if (recoveryProgramRepository.count() == 0 && rehab1 != null && rehab2 != null && rehab3 != null) {
        saveRecoveryProgram(rehab1, PLAYER_3_DEF_ID, RecoveryProgramStatus.ACTIVE,
                "Post-Injury Conditioning — Araújo",
                "Active recovery + conditioning while returning from ankle sprain.",
                "Pool sessions (resistance), stationary bike, upper-body strength.",
                "High-protein diet, anti-inflammatory foods (omega-3, berries).",
                LocalDate.now().minusDays(7), LocalDate.now().plusDays(14),
                5, 60, "Tolerating workload well. HR recovery rate improving.",
                "Return to full match fitness within 14 days.");

        saveRecoveryProgram(rehab2, PLAYER_5_BBALL_ID, RecoveryProgramStatus.COMPLETED,
                "Hamstring Maintenance — Satoranský",
                "Preventive program post-strain to reduce re-injury risk.",
                "Nordic hamstring curls, hip mobility drills, calf strength.",
                "Standard team nutrition + magnesium supplementation.",
                LocalDate.now().minusDays(14), LocalDate.now().minusDays(2),
                3, 30, "Player adherence excellent. No recurrence symptoms.",
                "Continue twice-weekly prevention exercises indefinitely.");

        saveRecoveryProgram(rehab3, PLAYER_7_ID, RecoveryProgramStatus.PAUSED,
                "Pre-season Shoulder Conditioning — Aleix Gómez",
                "Targeted shoulder/scapular conditioning ahead of EHF Champions League block.",
                "ER/IR band work 3x/week, prone Y-T-W series, single-arm landmine press.",
                "High-protein breakfast, creatine monohydrate, post-session whey + carbs.",
                LocalDate.now().plusDays(3), LocalDate.now().plusDays(60),
                3, 45, "Awaiting kick-off after baseline strength test on Monday.",
                "Hit pre-season strength markers without aggravating right shoulder.");

        saveRecoveryProgram(rehab1, PLAYER_1_ID, RecoveryProgramStatus.ACTIVE,
                "Striker Load-Management Block — Lewandowski",
                "Cycle of low-intensity recovery sessions between high-load fixtures.",
                "Pool flush sessions, foam-rolling mobility, light bike intervals.",
                "Carb-cycling around match days, hydration with electrolytes.",
                LocalDate.now().minusDays(3), LocalDate.now().plusDays(28),
                2, 40, "Sleep quality up; reported soreness down across last 2 sessions.",
                "Sustain availability through La Liga / UCL double-week.");
        }

        // ─── Fitness Tests ───────────────────────────────────────────────────
        if (fitnessTestRepository.count() == 0) {
        // Football squad — VO2 max preseason
        saveFitnessTest(PLAYER_1_KC, TEAM_FB, FitnessTestType.VO2_MAX, SportType.FOOTBALL,
                LocalDate.now().minusDays(45).atTime(10, 0), FITNESS_KC,
                "Yo-Yo Intermittent Recovery Test L2", 19.5, "level", "Excellent",
                "Top decile for striker position.", "Maintain current cardio program.");
        saveFitnessTest(PLAYER_2_KC, TEAM_FB, FitnessTestType.SPEED_TEST, SportType.FOOTBALL,
                LocalDate.now().minusDays(45).atTime(10, 30), FITNESS_KC,
                "40m Sprint", 5.12, "seconds", "Very Good",
                "Above squad average for midfielder.", "Add resisted sprint work.");
        saveFitnessTest(PLAYER_3_KC, TEAM_FB, FitnessTestType.AGILITY_TEST, SportType.FOOTBALL,
                LocalDate.now().minusDays(45).atTime(11, 0), FITNESS_KC,
                "T-Test Agility", 9.45, "seconds", "Good",
                "On par with center-back norms.", "Continue lateral movement drills.");
        saveFitnessTest(PLAYER_4_KC, TEAM_FB, FitnessTestType.STRENGTH_TEST, SportType.FOOTBALL,
                LocalDate.now().minusDays(45).atTime(11, 30), FITNESS_KC,
                "Vertical Jump (CMJ)", 56.0, "cm", "Excellent",
                "Top of squad for keeper.", "Maintain plyometric protocol.");
        saveFitnessTest(PLAYER_5_KC, 2L, FitnessTestType.ENDURANCE_TEST, SportType.BASKETBALL,
                LocalDate.now().minusDays(40).atTime(15, 0), FITNESS_KC,
                "1.5-mile Run", 9.8, "minutes", "Good",
                "In line with PG expectations.", "Add interval work to push to Very Good range.");

        // Handball squad — pre-season profile
        saveFitnessTest(PLAYER_7_KC, TEAM_HB, FitnessTestType.STRENGTH_TEST, SportType.HANDBALL,
                LocalDate.now().minusDays(30).atTime(9, 30), FITNESS_KC,
                "Bench Press 1RM", 105.0, "kg", "Very Good",
                "Strong upper-body baseline for HB back position.",
                "Maintain horizontal pressing volume through pre-season.");
        saveFitnessTest(PLAYER_8_KC, TEAM_HB, FitnessTestType.SPEED_TEST, SportType.HANDBALL,
                LocalDate.now().minusDays(30).atTime(10, 0), FITNESS_KC,
                "20m Sprint", 3.04, "seconds", "Good",
                "Solid acceleration for centre back.",
                "Add resisted-sprint block twice a week.");
        // Re-test for player 3 (returning from injury)
        saveFitnessTest(PLAYER_3_KC, TEAM_FB, FitnessTestType.FLEXIBILITY_TEST, SportType.FOOTBALL,
                LocalDate.now().minusDays(7).atTime(11, 0), FITNESS_KC,
                "Sit & Reach", 18.5, "cm", "Good",
                "Improved mobility post-rehab; cleared for lateral cutting at 80%.",
                "Continue daily hip-flexor mobility routine.");
        // Body composition check for striker
        saveFitnessTest(PLAYER_1_KC, TEAM_FB, FitnessTestType.BODY_COMPOSITION, SportType.FOOTBALL,
                LocalDate.now().minusDays(14).atTime(8, 30), FITNESS_KC,
                "DEXA Scan", 9.4, "% body fat", "Excellent",
                "Lean mass on target for the competitive block.",
                "Maintain current macros and recovery protocol.");
        }

        // ─── Training Loads (link to existing training sessions) ─────────────
        if (trainingLoadRepository.count() == 0) {
        saveTrainingLoad(PLAYER_1_ID, TEAM_FB, 1L, LocalDate.now().minusDays(2), 90, 0.85,
                90 * 0.85, 7, 158, 178, "Tactical", "High-intensity pressing block. Player handled load well.");
        saveTrainingLoad(PLAYER_2_ID, TEAM_FB, 1L, LocalDate.now().minusDays(2), 90, 0.82,
                90 * 0.82, 8, 162, 184, "Tactical", "Above-average distance covered for CM.");
        saveTrainingLoad(PLAYER_3_ID, TEAM_FB, 1L, LocalDate.now().minusDays(2), 75, 0.70,
                75 * 0.70, 5, 148, 172, "Tactical", "Modified load — returning from injury.");
        saveTrainingLoad(PLAYER_4_ID, TEAM_FB, 1L, LocalDate.now().minusDays(2), 90, 0.65,
                90 * 0.65, 3, 132, 165, "Tactical", "Goalkeeper-specific work — lower volume.");
        // Today (Pick & roll session) — LocalDate has no minusHours; just use today's date.
        saveTrainingLoad(PLAYER_5_ID, 2L, 4L, LocalDate.now(), 75, 0.78,
                75 * 0.78, 4, 154, 178, "Technical", "Pick & roll execution session.");

        // Handball squad — match-week load
        saveTrainingLoad(PLAYER_7_ID, TEAM_HB, 1L, LocalDate.now().minusDays(1), 80, 0.88,
                80 * 0.88, 5, 161, 182, "Tactical",
                "Defensive system work + shot-on-the-run drills.");
        saveTrainingLoad(PLAYER_8_ID, TEAM_HB, 1L, LocalDate.now().minusDays(1), 80, 0.84,
                80 * 0.84, 4, 159, 180, "Tactical",
                "Centre-back orchestration and pivot link-up.");

        // Yesterday's recovery day (lower load) for the football squad
        saveTrainingLoad(PLAYER_1_ID, TEAM_FB, 2L, LocalDate.now().minusDays(1), 45, 0.45,
                45 * 0.45, 2, 118, 142, "Recovery",
                "Pool flush + mobility session post-match.");
        saveTrainingLoad(PLAYER_2_ID, TEAM_FB, 2L, LocalDate.now().minusDays(1), 45, 0.50,
                45 * 0.50, 2, 124, 148, "Recovery",
                "Active recovery — light bike intervals + foam rolling.");

        // Today's high-intensity session
        saveTrainingLoad(PLAYER_4_ID, TEAM_FB, 3L, LocalDate.now(), 60, 0.72,
                60 * 0.72, 0, 138, 168, "Technical",
                "GK-specific reaction and distribution work.");
        }

        log.info("[SEED] medical-fitness seeded: injuries={}, diagnoses={}, treatments={}, rehabilitations={}, recoveryPrograms={}, fitnessTests={}, trainingLoads={}",
                injuryRepository.count(), diagnosisRepository.count(), treatmentRepository.count(),
                rehabilitationRepository.count(), recoveryProgramRepository.count(),
                fitnessTestRepository.count(), trainingLoadRepository.count());
    }

    private Injury saveInjury(long playerId, long teamId, InjuryType type, InjurySeverity sev,
                              InjuryStatus status, String bodyPart, String description, LocalDate date) {
        Injury i = new Injury();
        i.setPlayerId(playerId);
        i.setTeamId(teamId);
        i.setInjuryType(type);
        i.setSeverity(sev);
        i.setStatus(status);
        i.setBodyPart(bodyPart);
        i.setDescription(description);
        i.setInjuryDate(date);
        i.setReportedAt(date.atTime(9, 30));
        i.setReportedByDoctorId(DOCTOR_ID);
        return injuryRepository.save(i);
    }

    private Diagnosis saveDiagnosis(Injury injury, String playerKc, String diagnosis,
                                    String notes, String recommendations) {
        Diagnosis d = new Diagnosis();
        d.setInjury(injury);
        d.setPlayerKeycloakId(playerKc);
        d.setDoctorKeycloakId(DOCTOR_KC);
        d.setDiagnosis(diagnosis);
        d.setMedicalNotes(notes);
        d.setRecommendations(recommendations);
        d.setDiagnosedAt(LocalDateTime.now().minusDays(1));
        return diagnosisRepository.save(d);
    }

    private Treatment saveTreatment(Injury injury, long playerId, String type, String description,
                                    TreatmentStatus status, LocalDate start, LocalDate end) {
        Treatment t = new Treatment();
        t.setInjury(injury);
        t.setPlayerId(playerId);
        t.setDoctorId(DOCTOR_ID);
        t.setTreatmentType(type);
        t.setDescription(description);
        t.setStatus(status);
        t.setStartDate(start);
        t.setEndDate(end);
        t.setCreatedAt(LocalDateTime.now().minusDays(1));
        return treatmentRepository.save(t);
    }

    private Rehabilitation saveRehabilitation(Injury injury, long playerId, RehabStatus status,
                                              String plan, String exercises, int weeks,
                                              LocalDate start, LocalDate expectedEnd,
                                              String progress, String restrictions) {
        Rehabilitation r = new Rehabilitation();
        r.setInjury(injury);
        r.setPlayerId(playerId);
        r.setPhysiotherapistId(PHYSIO_ID);
        r.setStatus(status);
        r.setRehabPlan(plan);
        r.setExercises(exercises);
        r.setDurationWeeks(weeks);
        r.setStartDate(start);
        r.setExpectedEndDate(expectedEnd);
        r.setActualEndDate(status == RehabStatus.COMPLETED ? expectedEnd : null);
        r.setCreatedAt(LocalDateTime.now().minusDays(weeks));
        r.setProgressNotes(progress);
        r.setRestrictions(restrictions);
        return rehabilitationRepository.save(r);
    }

    private RecoveryProgram saveRecoveryProgram(Rehabilitation rehab, long playerId,
                                                RecoveryProgramStatus status, String name,
                                                String description, String activities,
                                                String nutrition, LocalDate start, LocalDate end,
                                                int sessionsPerWeek, int sessionDuration,
                                                String progress, String goals) {
        RecoveryProgram rp = new RecoveryProgram();
        rp.setRehabilitation(rehab);
        rp.setPlayerId(playerId);
        rp.setCreatedByDoctorId(DOCTOR_ID);
        rp.setStatus(status);
        rp.setProgramName(name);
        rp.setDescription(description);
        rp.setActivities(activities);
        rp.setNutritionPlan(nutrition);
        rp.setStartDate(start);
        rp.setEndDate(end);
        rp.setCreatedAt(LocalDateTime.now().minusDays(7));
        rp.setSessionsPerWeek(sessionsPerWeek);
        rp.setDurationMinutes(sessionDuration);
        rp.setProgressNotes(progress);
        rp.setGoals(goals);
        return recoveryProgramRepository.save(rp);
    }

    private FitnessTest saveFitnessTest(String playerKc, long teamId, FitnessTestType type,
                                        SportType sport, LocalDateTime date, String conductedByKc,
                                        String testName, double result, String unit, String category,
                                        String notes, String recommendations) {
        FitnessTest ft = new FitnessTest();
        ft.setPlayerKeycloakId(playerKc);
        ft.setTeamId(teamId);
        ft.setTestType(type);
        ft.setSportType(sport);
        ft.setTestDate(date);
        ft.setConductedByDoctorKeycloakId(conductedByKc);
        ft.setTestName(testName);
        ft.setResult(result);
        ft.setUnit(unit);
        ft.setResultCategory(category);
        ft.setNotes(notes);
        ft.setRecommendations(recommendations);
        return fitnessTestRepository.save(ft);
    }

    private TrainingLoad saveTrainingLoad(long playerId, long teamId, long trainingSessionId,
                                          LocalDate date, int duration, double intensity,
                                          double load, int distanceKm, int hrAvg, int hrMax,
                                          String trainingType, String notes) {
        TrainingLoad tl = new TrainingLoad();
        tl.setPlayerId(playerId);
        tl.setTeamId(teamId);
        tl.setTrainingSessionId(trainingSessionId);
        tl.setDate(date);
        tl.setDurationMinutes(duration);
        tl.setIntensity(intensity);
        tl.setLoad(load);
        tl.setDistanceKm(distanceKm);
        tl.setHeartRateAvg(hrAvg);
        tl.setHeartRateMax(hrMax);
        tl.setTrainingType(trainingType);
        tl.setNotes(notes);
        return trainingLoadRepository.save(tl);
    }
}
