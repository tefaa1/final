package com.example.reportsanalyticsservice.bootstrap;

import com.example.reportsanalyticsservice.model.entity.MatchAnalysis;
import com.example.reportsanalyticsservice.model.entity.PlayerAnalytics;
import com.example.reportsanalyticsservice.model.entity.ScoutReport;
import com.example.reportsanalyticsservice.model.entity.SponsorContractOffer;
import com.example.reportsanalyticsservice.model.entity.TeamAnalytics;
import com.example.reportsanalyticsservice.model.entity.TrainingAnalytics;
import com.example.reportsanalyticsservice.model.enums.SportType;
import com.example.reportsanalyticsservice.repository.MatchAnalysisRepository;
import com.example.reportsanalyticsservice.repository.PlayerAnalyticsRepository;
import com.example.reportsanalyticsservice.repository.ScoutReportRepository;
import com.example.reportsanalyticsservice.repository.SponsorContractOfferRepository;
import com.example.reportsanalyticsservice.repository.TeamAnalyticsRepository;
import com.example.reportsanalyticsservice.repository.TrainingAnalyticsRepository;
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
public class ReportsDataSeeder implements CommandLineRunner {

    // Cross-service references
    private static final long MATCH_FB_FINISHED = 1L;   // training-match seed: first match (FINISHED)
    private static final long TEAM_FB = 1L;
    private static final String HEAD_COACH_FB_KC = "00000000-0000-0000-0000-000000000020";
    private static final String SCOUT_KC          = "00000000-0000-0000-0000-000000000040";

    private static final String PLAYER_1_KC = "00000000-0000-0000-0000-000000000101";
    private static final String PLAYER_2_KC = "00000000-0000-0000-0000-000000000102";

    private final MatchAnalysisRepository matchAnalysisRepository;
    private final PlayerAnalyticsRepository playerAnalyticsRepository;
    private final ScoutReportRepository scoutReportRepository;
    private final SponsorContractOfferRepository sponsorContractOfferRepository;
    private final TeamAnalyticsRepository teamAnalyticsRepository;
    private final TrainingAnalyticsRepository trainingAnalyticsRepository;

    // Sponsor Keycloak ids — first one matches the realm-imported sponsor user;
    // the others are display-only FKs (no Keycloak login needed for seed data).
    private static final String SPONSOR_SPOTIFY_KC  = "00000000-0000-0000-0000-000000000041";
    private static final String SPONSOR_NIKE_KC     = "00000000-0000-0000-0000-000000000050";
    private static final String SPONSOR_DAMM_KC     = "00000000-0000-0000-0000-000000000051";
    private static final String SPONSOR_BEKO_KC     = "00000000-0000-0000-0000-000000000052";

    @Override
    @Transactional
    public void run(String... args) {
        // Per-table idempotent guards. The previous version checked
        // matchAnalysisRepository.count() once at the top, which meant
        // that if an OLDER deploy seeded match analyses but not
        // team_analytics / training_analytics (tables added later), the
        // newer rows could never make it in without `docker compose down -v`.
        // Each section now seeds only when its own table is empty.
        log.info("[SEED] Seeding reports-analytics-service (per-table idempotent)...");

        if (matchAnalysisRepository.count() == 0) {
            MatchAnalysis ma = new MatchAnalysis();
            ma.setMatchId(MATCH_FB_FINISHED);
            ma.setTeamId(TEAM_FB);
            ma.setSportType(SportType.FOOTBALL);
            ma.setSportSpecificStats("{\"possession\":58,\"shotsOnTarget\":7,\"corners\":6,\"fouls\":11}");
            ma.setKeyMoments("18' Lewandowski goal (assist Pedri). 64' Lewandowski penalty. 82' Real Madrid consolation header.");
            ma.setTacticalAnalysis("High press worked in the first half; dropped into a 4-3-3 mid-block after 70'.");
            ma.setPlayerRatings("{\"player1\":8.7,\"player2\":7.9,\"player3\":7.4,\"player4\":7.1}");
            ma.setAnalyzedByUserKeycloakId(HEAD_COACH_FB_KC);
            ma.setAnalyzedAt(LocalDateTime.now().minusDays(4));
            ma.setNotes("Solid showing — repeat the high press shape next week.");
            matchAnalysisRepository.save(ma);
        }

        if (playerAnalyticsRepository.count() == 0) {
            savePlayerAnalytics(PLAYER_1_KC, 6, 5, 3, 8.4, "{\"xG\":4.2,\"keyPasses\":11}");
            savePlayerAnalytics(PLAYER_2_KC, 6, 1, 4, 7.6, "{\"passAccuracy\":89,\"tackles\":14}");
        }

        // ─── Scout Reports — linked to the OuterPlayers seeded in player-mgmt
        // (outer_player IDs 1..4 = scouting prospects from rival clubs)
        if (scoutReportRepository.count() == 0) {
            saveScoutReport(1L, 9, 9, 8, 9,
                    "Elite finisher, exceptional movement in the box.",
                    "Hold-up play in tight spaces, needs more strength.",
                    "Premium target — generational forward. Recommend signing at any cost.",
                    true);
            saveScoutReport(2L, 9, 8, 9, 9,
                    "Vision and decision-making are world-class. Calm under press.",
                    "Defensive transitions need work.",
                    "Top playmaker prospect. Worth the release clause.",
                    true);
            saveScoutReport(3L, 8, 8, 7, 7,
                    "Pace and dribbling ability, dangerous in 1v1 situations.",
                    "Inconsistent end product, decision-making in final third.",
                    "Promising winger but needs another loan year before joining.",
                    false);
            saveScoutReport(4L, 7, 8, 9, 8,
                    "Floor general — controls tempo, excellent court vision.",
                    "Three-point shooting consistency.",
                    "Solid signing for Barça Basket — fits Peñarroya's system.",
                    true);
        }

        // ─── Sponsor Contract Offers ────────────────────────────────────────
        if (sponsorContractOfferRepository.count() == 0) {
            saveSponsorOffer(SPONSOR_SPOTIFY_KC, TEAM_FB, 280_000_000.0, 60,
                    "Main shirt + global digital partner across all media.",
                    "ACCEPTED", LocalDateTime.now().minusDays(60), LocalDateTime.now().minusDays(50),
                    "Renewed — Spotify Camp Nou naming rights bundled in.");
            saveSponsorOffer(SPONSOR_NIKE_KC, TEAM_FB, 110_000_000.0, 120,
                    "Apparel + footwear technical partner. Includes basketball + handball kits.",
                    "ACCEPTED", LocalDateTime.now().minusDays(180), LocalDateTime.now().minusDays(150),
                    "Long-term renewal locked in until 2034.");
            saveSponsorOffer(SPONSOR_DAMM_KC, TEAM_FB, 22_000_000.0, 36,
                    "Official Catalan beer of FC Barcelona. Stadium concessions exclusive.",
                    "PENDING", LocalDateTime.now().minusDays(10), null,
                    "Awaiting final terms from commercial team.");
            saveSponsorOffer(SPONSOR_BEKO_KC, 2L, 18_000_000.0, 24,
                    "Official appliance partner — Barça Basket front-of-jersey.",
                    "PENDING", LocalDateTime.now().minusDays(4), null,
                    "Initial offer under review by sponsorship board.");
        }

        // ─── Team Analytics ─────────────────────────────────────────────────
        // FC Barcelona Football season-to-date
        if (teamAnalyticsRepository.count() == 0) {
        saveTeamAnalytics(TEAM_FB, SportType.FOOTBALL,
                LocalDate.now().minusMonths(6), LocalDate.now(),
                18, 13, 3, 2, 42, 18, 8.4, 6, 84,
                "{\"possession\":62.5,\"passAccuracy\":89.2,\"xG\":2.3,\"xGA\":0.9}",
                "{\"goals\":42,\"assists\":31,\"cleanSheets\":8,\"yellowCards\":24,\"redCards\":1}",
                "{\"form\":\"WWDWWW\",\"home\":\"P9 W8 D1 L0\",\"away\":\"P9 W5 D2 L2\"}",
                "Strong start — leading La Liga by 4 points.");
        // FC Barcelona Bàsquet season-to-date
        saveTeamAnalytics(2L, SportType.BASKETBALL,
                LocalDate.now().minusMonths(4), LocalDate.now(),
                14, 9, 0, 5, 1180, 1052, 7.9, 3, 56,
                "{\"fieldGoalPct\":47.5,\"threePointPct\":36.2,\"rebounds\":36.4}",
                "{\"points\":1180,\"assists\":340,\"steals\":98,\"blocks\":52}",
                "{\"form\":\"WLWWL\",\"home\":\"P7 W5 L2\",\"away\":\"P7 W4 L3\"}",
                "Mid-table — opportunity to climb after winter break.");
        // FC Barcelona Handbol season-to-date
        saveTeamAnalytics(5L, SportType.HANDBALL,
                LocalDate.now().minusMonths(5), LocalDate.now(),
                16, 12, 1, 3, 488, 412, 8.1, 4, 64,
                "{\"shotEfficiency\":68.4,\"savePct\":32.1,\"turnovers\":11.5}",
                "{\"goals\":488,\"assists\":222,\"steals\":54,\"saves\":162}",
                "{\"form\":\"WWWLW\",\"home\":\"P8 W7 D0 L1\",\"away\":\"P8 W5 D1 L2\"}",
                "Top of EHF Champions League group with one game in hand.");
        }

        // ─── Training Analytics (player-level) ─────────────────────────────
        if (trainingAnalyticsRepository.count() == 0) {
            saveTrainingAnalytics(TEAM_FB, PLAYER_1_KC,
                    LocalDate.now().minusMonths(2), LocalDate.now(),
                    32, 30, 2, 93.75, 0.82, 8.7, 0,
                    "{\"sprintRepeatability\":92,\"avgHeartRate\":162,\"maxLoad\":76.5}",
                    "{\"attendanceTrend\":\"+2%\",\"loadTrend\":\"+5%\",\"form\":\"improving\"}",
                    "Top performer in attendance and load tolerance.");
            saveTrainingAnalytics(TEAM_FB, PLAYER_2_KC,
                    LocalDate.now().minusMonths(2), LocalDate.now(),
                    32, 31, 1, 96.87, 0.78, 9.0, 0,
                    "{\"sprintRepeatability\":94,\"avgHeartRate\":158,\"maxLoad\":70.0}",
                    "{\"attendanceTrend\":\"+1%\",\"loadTrend\":\"+8%\",\"form\":\"excellent\"}",
                    "Best attendance rate in the squad.");
            saveTrainingAnalytics(TEAM_FB, null, // team-wide
                    LocalDate.now().minusMonths(2), LocalDate.now(),
                    32, 28, 4, 87.5, 0.75, 8.2, 2,
                    "{\"avgAttendance\":87.5,\"avgLoad\":0.75,\"injuryRate\":0.06}",
                    "{\"attendanceTrend\":\"stable\",\"loadTrend\":\"+3%\",\"injuryTrend\":\"down\"}",
                    "Squad-wide training metrics — solid block ahead of El Clásico.");
        }

        log.info("[SEED] reports-analytics seeded: matchAnalyses={}, playerAnalytics={}, scoutReports={}, sponsorOffers={}, teamAnalytics={}, trainingAnalytics={}",
                matchAnalysisRepository.count(), playerAnalyticsRepository.count(),
                scoutReportRepository.count(), sponsorContractOfferRepository.count(),
                teamAnalyticsRepository.count(), trainingAnalyticsRepository.count());
    }

    private TeamAnalytics saveTeamAnalytics(long teamId, SportType sport,
                                            LocalDate start, LocalDate end,
                                            int totalMatches, int wins, int draws, int losses,
                                            int pointsFor, int pointsAgainst,
                                            double avgFitness, int injuries, int totalSessions,
                                            String kpiData, String sportSpecific, String trends,
                                            String notes) {
        TeamAnalytics ta = new TeamAnalytics();
        ta.setTeamId(teamId);
        ta.setSportType(sport);
        ta.setPeriodStart(start);
        ta.setPeriodEnd(end);
        ta.setTotalMatches(totalMatches);
        ta.setWins(wins);
        ta.setDraws(draws);
        ta.setLosses(losses);
        ta.setPointsFor(pointsFor);
        ta.setPointsAgainst(pointsAgainst);
        ta.setAverageTeamFitnessScore(avgFitness);
        ta.setTotalInjuries(injuries);
        ta.setTotalTrainingSessions(totalSessions);
        ta.setKpiData(kpiData);
        ta.setSportSpecificStats(sportSpecific);
        ta.setTrends(trends);
        ta.setCalculatedAt(LocalDateTime.now());
        ta.setNotes(notes);
        return teamAnalyticsRepository.save(ta);
    }

    private TrainingAnalytics saveTrainingAnalytics(long teamId, String playerKc,
                                                    LocalDate start, LocalDate end,
                                                    int totalSessions, int attended, int missed,
                                                    double attendanceRate, double avgLoad,
                                                    double avgPerformance, int injuries,
                                                    String kpiData, String trends, String notes) {
        TrainingAnalytics ta = new TrainingAnalytics();
        ta.setTeamId(teamId);
        ta.setPlayerKeycloakId(playerKc);
        ta.setPeriodStart(start);
        ta.setPeriodEnd(end);
        ta.setTotalSessions(totalSessions);
        ta.setAttendedSessions(attended);
        ta.setMissedSessions(missed);
        ta.setAttendanceRate(attendanceRate);
        ta.setAverageTrainingLoad(avgLoad);
        ta.setAveragePerformanceScore(avgPerformance);
        ta.setInjuriesDuringPeriod(injuries);
        ta.setKpiData(kpiData);
        ta.setTrends(trends);
        ta.setCalculatedAt(LocalDateTime.now());
        ta.setNotes(notes);
        return trainingAnalyticsRepository.save(ta);
    }

    private SponsorContractOffer saveSponsorOffer(String sponsorKc, long teamId, double amount,
                                                  int durationMonths, String terms, String status,
                                                  LocalDateTime offeredAt, LocalDateTime respondedAt,
                                                  String notes) {
        SponsorContractOffer offer = SponsorContractOffer.builder()
                .sponsorKeycloakId(sponsorKc)
                .teamId(teamId)
                .offerAmount(amount)
                .contractDurationMonths(durationMonths)
                .terms(terms)
                .status(status)
                .offeredAt(offeredAt)
                .respondedAt(respondedAt)
                .notes(notes)
                .build();
        return sponsorContractOfferRepository.save(offer);
    }

    private void saveScoutReport(long outerPlayerId, int technical, int physical, int tactical, int mentality,
                                 String strengths, String weaknesses, String overall, boolean recommend) {
        ScoutReport sr = new ScoutReport();
        sr.setScoutKeycloakId(SCOUT_KC);
        sr.setOuterPlayerId(outerPlayerId);
        sr.setTechnicalRating(technical);
        sr.setPhysicalRating(physical);
        sr.setTacticalRating(tactical);
        sr.setMentalityRating(mentality);
        sr.setStrengths(strengths);
        sr.setWeaknesses(weaknesses);
        sr.setOverallAssessment(overall);
        sr.setRecommendSigning(recommend);
        sr.setCreatedAt(LocalDateTime.now().minusDays(outerPlayerId));
        scoutReportRepository.save(sr);
    }

    private void savePlayerAnalytics(String playerKc, int matches, int primary, int secondary,
                                     double avgRating, String sportSpecificStats) {
        PlayerAnalytics pa = new PlayerAnalytics();
        pa.setPlayerKeycloakId(playerKc);
        pa.setTeamId(TEAM_FB);
        pa.setSportType(SportType.FOOTBALL);
        pa.setPeriodStart(LocalDate.now().minusMonths(2));
        pa.setPeriodEnd(LocalDate.now());
        pa.setTotalMatches(matches);
        pa.setPrimaryScore(primary);
        pa.setSecondaryScore(secondary);
        pa.setAverageRating(avgRating);
        pa.setTotalTrainingSessions(18);
        pa.setAttendanceRate(95);
        pa.setCurrentInjuries(0);
        pa.setAverageFitnessScore(8.2);
        pa.setFitnessTestsCount(4);
        pa.setSportSpecificStats(sportSpecificStats);
        pa.setCalculatedAt(LocalDateTime.now());
        playerAnalyticsRepository.save(pa);
    }
}
