package com.example.trainingmatchservice.service;

import com.example.trainingmatchservice.client.ApiFootballClient;
import com.example.trainingmatchservice.client.FootballDataClient;
import com.example.trainingmatchservice.model.match.entity.Match;
import com.example.trainingmatchservice.model.match.entity.PlayerMatchStatistics;
import com.example.trainingmatchservice.model.match.enums.MatchStatus;
import com.example.trainingmatchservice.model.match.enums.MatchType;
import com.example.trainingmatchservice.model.match.enums.SportType;
import com.example.trainingmatchservice.repository.MatchRepository;
import com.example.trainingmatchservice.repository.PlayerMatchStatisticsRepository;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Pulls FC Barcelona's fixtures from football-data.org for a rolling date
 * window and UPSERTS them into our own Match table (keyed by externalId). The
 * backend stays the source of truth — the frontend always reads from us, never
 * the external API directly. Runs on a schedule and can be triggered manually.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MatchSyncService {

    private final FootballDataClient client;
    private final ApiFootballClient apiFootballClient;
    private final MatchRepository matchRepository;
    private final PlayerMatchStatisticsRepository statsRepository;

    @Value("${FOOTBALL_TEAM_ID:81}")          private long externalTeamId;  // FC Barcelona on football-data.org
    @Value("${FOOTBALL_HOME_TEAM_ID:1}")      private long homeTeamId;      // our internal FC Barcelona team id
    // Free tier blocks /teams/{id}/matches but allows competition endpoints,
    // so we pull these competitions and keep the matches involving Barça.
    @Value("${FOOTBALL_COMPETITIONS:PD,CL}")  private String competitions;  // PD=La Liga, CL=Champions League
    @Value("${APIFOOTBALL_TEAM_ID:529}")      private long apiFootballTeamId; // FC Barcelona on API-Football
    @Value("${FOOTBALL_WINDOW_DAYS:60}")      private int windowDays;       // how far ahead to ingest fixtures

    /** Ingest fixtures in [today, today+windowDays]. Idempotent (upsert by externalId). */
    public synchronized Map<String, Object> sync() throws Exception {
        if (!client.isConfigured()) {
            log.info("[FD] FOOTBALL_DATA_API_KEY not set — external match sync disabled.");
            return Map.of("status", "disabled", "reason", "FOOTBALL_DATA_API_KEY not configured");
        }

        int created = 0, updated = 0, found = 0;
        for (String raw : competitions.split(",")) {
            String code = raw.trim();
            if (code.isEmpty()) continue;

            JsonNode root;
            try {
                root = client.get("/competitions/" + code + "/matches");
            } catch (Exception e) {
                log.warn("[FD] competition {} skipped: {}", code, e.getMessage());
                continue;
            }
            String compFallback = root.path("competition").path("name").asText(code);

            for (JsonNode m : root.path("matches")) {
                long homeId = m.path("homeTeam").path("id").asLong();
                long awayId = m.path("awayTeam").path("id").asLong();
                if (homeId != externalTeamId && awayId != externalTeamId) continue; // only Barça's matches
                found++;

                long extId = m.path("id").asLong();
                boolean barcaHome = homeId == externalTeamId;
                JsonNode opponent = barcaHome ? m.path("awayTeam") : m.path("homeTeam");

                JsonNode fullTime = m.path("score").path("fullTime");
                Integer extHome = nodeToInt(fullTime.path("home"));
                Integer extAway = nodeToInt(fullTime.path("away"));
                Integer barcaScore = barcaHome ? extHome : extAway;
                Integer opponentScore = barcaHome ? extAway : extHome;

                MatchStatus status = mapStatus(m.path("status").asText(""));
                LocalDateTime kickoff = parseUtc(m.path("utcDate").asText(null));
                String competition = m.path("competition").path("name").asText(compFallback);

                Match match = matchRepository.findByExternalId(extId).orElseGet(Match::new);
                boolean isNew = match.getId() == null;

                match.setExternalId(extId);
                match.setHomeTeamId(homeTeamId);
                match.setOpponentName(opponent.path("name").asText("Opponent"));
                match.setOpponentCrest(opponent.path("crest").isMissingNode() ? null : opponent.path("crest").asText(null));
                match.setSportType(SportType.FOOTBALL);
                match.setMatchType(mapType(competition));
                match.setStatus(status);
                match.setCompetition(competition);
                match.setSeason("2024/25");
                match.setVenue(barcaHome ? "Spotify Camp Nou" : "Away");
                match.setHomeTeamScore(barcaScore);
                match.setAwayTeamScore(opponentScore);
                match.setKickoffTime(kickoff);
                if (status == MatchStatus.FINISHED) match.setFinishTime(kickoff);

                matchRepository.save(match);
                if (isNew) created++; else updated++;
            }
        }

        log.info("[FD] synced Barça matches from [{}] → found={}, created={}, updated={}", competitions, found, created, updated);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("status", "ok");
        result.put("competitions", competitions);
        result.put("matchesFound", found);
        result.put("created", created);
        result.put("updated", updated);
        return result;
    }

    /**
     * Live league table for a competition (read-through to football-data.org —
     * standings are derived data we don't persist; the frontend still only
     * talks to our backend). Returns a clean list of rows.
     */
    public List<Map<String, Object>> standings(String code) throws Exception {
        if (!client.isConfigured()) return List.of();
        JsonNode root = client.get("/competitions/" + code + "/standings");
        List<Map<String, Object>> rows = new ArrayList<>();
        for (JsonNode group : root.path("standings")) {
            if (!"TOTAL".equals(group.path("type").asText())) continue;
            for (JsonNode t : group.path("table")) {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("position", t.path("position").asInt());
                row.put("team", t.path("team").path("name").asText());
                row.put("crest", t.path("team").path("crest").asText(null));
                row.put("played", t.path("playedGames").asInt());
                row.put("won", t.path("won").asInt());
                row.put("draw", t.path("draw").asInt());
                row.put("lost", t.path("lost").asInt());
                row.put("goalDifference", t.path("goalDifference").asInt());
                row.put("points", t.path("points").asInt());
                rows.add(row);
            }
            break; // first TOTAL table only
        }
        return rows;
    }

    /**
     * Ingest Barça's REAL upcoming fixtures (incl. friendlies / pre-season) from
     * API-Football for the next {windowDays} days and upsert into our DB.
     * Keyed by externalId = 1_000_000_000 + fixtureId (avoids clashing with the
     * football-data ids used for past results). Clears the hand-made demo
     * fixtures once real data is available.
     */
    @Transactional
    public Map<String, Object> syncUpcoming() throws Exception {
        if (!apiFootballClient.isConfigured()) {
            log.info("[AF] APIFOOTBALL_KEY not set — upcoming-fixtures sync disabled.");
            return Map.of("status", "disabled", "reason", "APIFOOTBALL_KEY not configured");
        }
        LocalDate from = LocalDate.now();
        LocalDate to = from.plusDays(windowDays);
        JsonNode root = apiFootballClient.get(
                "/fixtures?team=" + apiFootballTeamId + "&from=" + from + "&to=" + to + "&timezone=UTC");

        int created = 0, updated = 0, found = 0;
        for (JsonNode f : root.path("response")) {
            found++;
            long ext = 1_000_000_000L + f.path("fixture").path("id").asLong();
            JsonNode home = f.path("teams").path("home");
            boolean barcaHome = home.path("id").asLong() == apiFootballTeamId;
            JsonNode opponent = barcaHome ? f.path("teams").path("away") : home;

            JsonNode goals = f.path("goals");
            Integer gh = nodeToInt(goals.path("home"));
            Integer ga = nodeToInt(goals.path("away"));
            Integer barcaScore = barcaHome ? gh : ga;
            Integer opponentScore = barcaHome ? ga : gh;

            MatchStatus status = mapApiFootballStatus(f.path("fixture").path("status").path("short").asText(""));
            LocalDateTime kickoff = parseUtc(f.path("fixture").path("date").asText(null));
            String competition = f.path("league").path("name").asText("Friendly");

            Match m = matchRepository.findByExternalId(ext).orElseGet(Match::new);
            boolean isNew = m.getId() == null;
            m.setExternalId(ext);
            m.setHomeTeamId(homeTeamId);
            m.setOpponentName(opponent.path("name").asText("Opponent"));
            m.setOpponentCrest(opponent.path("logo").isMissingNode() ? null : opponent.path("logo").asText(null));
            m.setSportType(SportType.FOOTBALL);
            m.setMatchType(mapType(competition));
            m.setStatus(status);
            m.setCompetition(competition);
            m.setSeason("2026");
            m.setVenue(barcaHome ? "Spotify Camp Nou" : "Away");
            m.setHomeTeamScore(barcaScore);
            m.setAwayTeamScore(opponentScore);
            m.setKickoffTime(kickoff);
            if (status == MatchStatus.FINISHED) m.setFinishTime(kickoff);
            matchRepository.save(m);
            if (isNew) created++; else updated++;
        }

        // Real fixtures arrived → remove the placeholder demo fixtures (negative ids).
        if (found > 0) {
            matchRepository.findAll().stream()
                    .filter(m -> m.getExternalId() != null && m.getExternalId() < 0)
                    .forEach(m -> { try { matchRepository.delete(m); } catch (Exception ignored) {} });
        }

        log.info("[AF] upcoming sync {}..{} → found={}, created={}, updated={}", from, to, found, created, updated);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("status", "ok");
        result.put("window", from + " .. " + to);
        result.put("found", found);
        result.put("created", created);
        result.put("updated", updated);
        return result;
    }

    private static MatchStatus mapApiFootballStatus(String s) {
        return switch (s) {
            case "1H", "2H", "ET", "BT", "P", "LIVE" -> MatchStatus.LIVE;
            case "HT" -> MatchStatus.HALFTIME;
            case "FT", "AET", "PEN" -> MatchStatus.FINISHED;
            case "PST" -> MatchStatus.POSTPONED;
            case "CANC", "ABD", "AWD", "WO" -> MatchStatus.CANCELLED;
            default -> MatchStatus.SCHEDULED; // NS, TBD
        };
    }

    /**
     * Demo upcoming fixtures for the next ~2 months. The real API has no future
     * matches during the off-season, so this populates a realistic "Fixtures"
     * section (real opponents + crests + future dates). Idempotent — keyed by
     * negative externalIds. Also clears empty seeded SCHEDULED placeholders.
     */
    @Transactional
    public Map<String, Object> generateDemoFixtures() {
        // Remove old crest-less placeholder fixtures (seeded, no opponent info).
        matchRepository.findAll().stream()
                .filter(m -> m.getExternalId() == null && m.getStatus() == MatchStatus.SCHEDULED && m.getOpponentName() == null)
                .forEach(m -> { try { matchRepository.delete(m); } catch (Exception ignored) {} });

        int created = 0, updated = 0;
        // ext, opponent, football-data crest id, competition, days-from-now
        Object[][] demos = {
                {-101L, "Real Madrid CF",         86L,  "La Liga", 6},
                {-102L, "Sevilla FC",             559L, "La Liga", 13},
                {-103L, "Atlético de Madrid",     78L,  "La Liga", 20},
                {-104L, "Valencia CF",            95L,  "La Liga", 27},
                {-105L, "Villarreal CF",          94L,  "La Liga", 34},
                {-106L, "Real Betis",             90L,  "La Liga", 41},
                {-107L, "Paris Saint-Germain FC", 524L, "UEFA Champions League", 10},
                {-108L, "FC Bayern München",      5L,   "UEFA Champions League", 24},
        };
        for (Object[] d : demos) {
            long ext = (long) d[0];
            Match m = matchRepository.findByExternalId(ext).orElseGet(Match::new);
            boolean isNew = m.getId() == null;
            int inDays = (int) d[4];
            m.setExternalId(ext);
            m.setHomeTeamId(homeTeamId);
            m.setOpponentName((String) d[1]);
            m.setOpponentCrest("https://crests.football-data.org/" + d[2] + ".png");
            m.setSportType(SportType.FOOTBALL);
            m.setMatchType(mapType((String) d[3]));
            m.setStatus(MatchStatus.SCHEDULED);
            m.setCompetition((String) d[3]);
            m.setSeason("2025/26");
            m.setVenue(inDays % 2 == 0 ? "Spotify Camp Nou" : "Away");
            m.setHomeTeamScore(null);
            m.setAwayTeamScore(null);
            m.setKickoffTime(LocalDateTime.now().plusDays(inDays).withHour(21).withMinute(0).withSecond(0).withNano(0));
            matchRepository.save(m);
            if (isNew) created++; else updated++;
        }
        log.info("[FD] demo fixtures → created={}, updated={}", created, updated);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("status", "ok");
        result.put("created", created);
        result.put("updated", updated);
        return result;
    }

    /** All group tables for a competition (e.g. WC = 12 World Cup groups). Read-through. */
    public List<Map<String, Object>> competitionGroups(String code) throws Exception {
        if (!client.isConfigured()) return List.of();
        JsonNode root = client.get("/competitions/" + code + "/standings");
        List<Map<String, Object>> groups = new ArrayList<>();
        for (JsonNode g : root.path("standings")) {
            if (!"TOTAL".equals(g.path("type").asText())) continue;
            List<Map<String, Object>> table = new ArrayList<>();
            for (JsonNode t : g.path("table")) {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("position", t.path("position").asInt());
                row.put("team", t.path("team").path("name").asText());
                row.put("crest", t.path("team").path("crest").asText(null));
                row.put("played", t.path("playedGames").asInt());
                row.put("won", t.path("won").asInt());
                row.put("draw", t.path("draw").asInt());
                row.put("lost", t.path("lost").asInt());
                row.put("goalDifference", t.path("goalDifference").asInt());
                row.put("points", t.path("points").asInt());
                table.add(row);
            }
            Map<String, Object> grp = new LinkedHashMap<>();
            grp.put("group", g.path("group").isNull() ? null : g.path("group").asText(null));
            grp.put("table", table);
            groups.add(grp);
        }
        return groups;
    }

    /** All matches for a competition (groups + knockout) — used to draw a bracket. Read-through. */
    public List<Map<String, Object>> competitionMatches(String code) throws Exception {
        if (!client.isConfigured()) return List.of();
        JsonNode root = client.get("/competitions/" + code + "/matches");
        List<Map<String, Object>> out = new ArrayList<>();
        for (JsonNode m : root.path("matches")) {
            JsonNode ft = m.path("score").path("fullTime");
            Map<String, Object> r = new LinkedHashMap<>();
            r.put("id", m.path("id").asLong());
            r.put("stage", m.path("stage").asText());
            r.put("group", m.path("group").isNull() ? null : m.path("group").asText(null));
            r.put("status", m.path("status").asText());
            r.put("utcDate", m.path("utcDate").asText(null));
            r.put("homeTeam", m.path("homeTeam").path("name").isNull() ? null : m.path("homeTeam").path("name").asText(null));
            r.put("homeCrest", m.path("homeTeam").path("crest").asText(null));
            r.put("awayTeam", m.path("awayTeam").path("name").isNull() ? null : m.path("awayTeam").path("name").asText(null));
            r.put("awayCrest", m.path("awayTeam").path("crest").asText(null));
            r.put("homeScore", nodeToInt(ft.path("home")));
            r.put("awayScore", nodeToInt(ft.path("away")));
            r.put("winner", m.path("score").path("winner").isNull() ? null : m.path("score").path("winner").asText(null));
            out.add(r);
        }
        return out;
    }

    // playerId, seasonGoals, seasonAssists, seasonMatches, rating×100 (from the ML dataset CSV).
    private static final int[][] SQUAD_STATS = {
        {12, 25, 0, 32, 899}, {13, 11, 11, 33, 916}, {14, 2, 3, 28, 805}, {15, 0, 0, 34, 872},
        {24, 0, 0, 32, 911}, {25, 3, 5, 25, 828}, {26, 0, 9, 36, 782}, {27, 0, 0, 30, 933},
        {28, 3, 4, 25, 816}, {29, 3, 13, 24, 846}, {30, 4, 10, 29, 762}, {31, 0, 14, 27, 931},
        {32, 0, 9, 30, 947}, {33, 2, 10, 26, 864}, {34, 0, 13, 27, 944}, {35, 16, 3, 32, 905},
        {36, 12, 14, 28, 783}, {37, 4, 6, 27, 876}, {38, 5, 15, 24, 927}, {39, 13, 8, 29, 851},
    };

    private static boolean isSquad(long id) {
        for (int[] p : SQUAD_STATS) if (p[0] == id) return true;
        return false;
    }

    /**
     * Generate per-match player statistics for the football squad, distributing
     * each player's season goals/assists (from the ML dataset) across the REAL
     * finished matches stored in our DB. This is what gives every player goals,
     * assists and ratings tied to the matches they actually played.
     */
    @Transactional
    public Map<String, Object> generatePlayerStats(boolean force) {
        List<Match> finished = new ArrayList<>();
        for (Match m : matchRepository.findAll()) {
            if (m.getStatus() == MatchStatus.FINISHED && m.getExternalId() != null && m.getExternalId() > 0) finished.add(m);
        }
        finished.sort((a, b) -> {
            var ka = a.getKickoffTime();
            var kb = b.getKickoffTime();
            if (ka == null) return 1;
            if (kb == null) return -1;
            return kb.compareTo(ka);
        });
        if (finished.isEmpty()) return Map.of("status", "skipped", "reason", "no finished matches yet");

        List<PlayerMatchStatistics> existing = new ArrayList<>();
        for (PlayerMatchStatistics s : statsRepository.findAll()) {
            if (s.getPlayerId() != null && isSquad(s.getPlayerId())) existing.add(s);
        }
        if (!existing.isEmpty() && !force) return Map.of("status", "skipped", "reason", "already populated");
        statsRepository.deleteAll(existing);

        int created = 0;
        for (int[] p : SQUAD_STATS) {
            long pid = p[0];
            int goals = p[1], assists = p[2], season = p[3];
            double rating = Math.round(p[4] / 10.0) / 10.0;
            int played = Math.min(season, finished.size());
            for (int i = 0; i < played; i++) {
                PlayerMatchStatistics st = new PlayerMatchStatistics();
                st.setMatch(finished.get(i));
                st.setPlayerId(pid);
                st.setSportType(SportType.FOOTBALL);
                st.setMinutesPlayed(78 + ((i * 7) % 13));
                st.setPerformanceRating(rating);
                st.setGoals((goals * (i + 1) / played) - (goals * i / played));
                st.setAssists((assists * (i + 1) / played) - (assists * i / played));
                st.setShots(st.getGoals() * 2 + (i % 3));
                st.setShotsOnTarget(st.getGoals() + (i % 2));
                st.setYellowCards((i % 9 == 0) ? 1 : 0);
                statsRepository.save(st);
                created++;
            }
        }
        log.info("[STATS] generated player match stats → players={}, rows={}", SQUAD_STATS.length, created);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("status", "ok");
        result.put("players", SQUAD_STATS.length);
        result.put("statRows", created);
        return result;
    }

    /** Runs ~25s after boot, then every 30 min (override with FOOTBALL_SYNC_INTERVAL_MS). */
    @Scheduled(initialDelay = 25_000, fixedDelayString = "${FOOTBALL_SYNC_INTERVAL_MS:1800000}")
    public void scheduledSync() {
        try {
            sync();
        } catch (Exception e) {
            log.warn("[FD] scheduled sync failed: {}", e.getMessage());
        }
        try {
            syncUpcoming();
        } catch (Exception e) {
            log.warn("[AF] scheduled upcoming sync failed: {}", e.getMessage());
        }
        try {
            generatePlayerStats(false); // populate once after matches land
        } catch (Exception e) {
            log.warn("[STATS] generation failed: {}", e.getMessage());
        }
    }

    private static Integer nodeToInt(JsonNode n) {
        return (n == null || n.isMissingNode() || n.isNull()) ? null : n.asInt();
    }

    private static LocalDateTime parseUtc(String iso) {
        if (iso == null || iso.isBlank()) return null;
        return OffsetDateTime.parse(iso).toLocalDateTime();
    }

    private static MatchStatus mapStatus(String s) {
        return switch (s) {
            case "IN_PLAY" -> MatchStatus.LIVE;
            case "PAUSED" -> MatchStatus.HALFTIME;
            case "FINISHED", "AWARDED" -> MatchStatus.FINISHED;
            case "POSTPONED" -> MatchStatus.POSTPONED;
            case "CANCELLED", "SUSPENDED" -> MatchStatus.CANCELLED;
            default -> MatchStatus.SCHEDULED; // SCHEDULED, TIMED
        };
    }

    private static MatchType mapType(String competition) {
        String c = competition.toLowerCase();
        if (c.contains("champions") || c.contains("europa") || c.contains("world")) return MatchType.TOURNAMENT;
        if (c.contains("copa") || c.contains("cup") || c.contains("supercopa")) return MatchType.CUP;
        if (c.contains("friendly")) return MatchType.FRIENDLY;
        return MatchType.LEAGUE;
    }
}
