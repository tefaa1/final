package com.example.trainingmatchservice.controller;

import com.example.trainingmatchservice.model.competition.Competition;
import com.example.trainingmatchservice.model.competition.CompetitionFixture;
import com.example.trainingmatchservice.model.competition.CompetitionTeam;
import com.example.trainingmatchservice.repository.CompetitionFixtureRepository;
import com.example.trainingmatchservice.repository.CompetitionRepository;
import com.example.trainingmatchservice.repository.CompetitionTeamRepository;
import com.example.trainingmatchservice.client.FootballDataClient;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

/**
 * User-created competitions, persisted in the DB. Mounted under /matches/leagues
 * so it reuses the existing gateway route to this service (no gateway change).
 *
 * For a LEAGUE we pre-generate a full round-robin on creation (each pair meets
 * `rounds` times, home & away), so a user can only enter results for the real
 * fixtures — they can't spam the table with the same two teams over and over.
 */
@RestController
@RequestMapping("/matches/leagues")
public class CompetitionController {

    private final CompetitionRepository competitionRepo;
    private final CompetitionTeamRepository teamRepo;
    private final CompetitionFixtureRepository fixtureRepo;
    private final FootballDataClient footballDataClient;

    public CompetitionController(CompetitionRepository competitionRepo,
                                 CompetitionTeamRepository teamRepo,
                                 CompetitionFixtureRepository fixtureRepo,
                                 FootballDataClient footballDataClient) {
        this.competitionRepo = competitionRepo;
        this.teamRepo = teamRepo;
        this.fixtureRepo = fixtureRepo;
        this.footballDataClient = footballDataClient;
    }

    public record TeamReq(String name, String shortName, String crestUrl, String crest, String sport) {}
    public record ImportReq(String code, Integer season, String name, String displaySeason, String type) {}
    public record CreateReq(String name, String season, String type, Integer rounds, List<TeamReq> teams) {}
    public record FixtureReq(Long homeTeamId, Long awayTeamId, String round, String groupName, Integer matchday) {}
    public record ResultReq(Integer homeScore, Integer awayScore, String playedAt) {}
    public record BulkFixtureReq(List<FixtureReq> fixtures) {}

    @GetMapping
    public List<Competition> list() {
        return competitionRepo.findAll();
    }

    private static Integer intOrNull(JsonNode n) {
        return (n == null || n.isNull() || n.isMissingNode()) ? null : n.asInt();
    }

    /**
     * Import a REAL competition season from football-data.org into the DB as a
     * proper competition with its teams and every real (finished) match.
     */
    @PostMapping("/import")
    @Transactional
    public Map<String, Object> importFromFootballData(@RequestBody ImportReq req) throws Exception {
        if (!footballDataClient.isConfigured()) throw new RuntimeException("FOOTBALL_DATA_API_KEY not configured");
        String path = "/competitions/" + req.code() + "/matches" + (req.season() != null ? "?season=" + req.season() : "");
        JsonNode root = footballDataClient.get(path);
        JsonNode matches = root.path("matches");

        String compName = req.name() != null ? req.name() : root.path("competition").path("name").asText(req.code());
        String season = req.displaySeason() != null ? req.displaySeason() : "current";

        Competition c = new Competition();
        c.setName(compName);
        c.setSeason(season);
        c.setType(req.type() != null ? req.type() : "LEAGUE");
        c.setRounds(2);
        c = competitionRepo.save(c);

        // Unique teams across all matches → one CompetitionTeam row each.
        Map<Long, CompetitionTeam> teamByFd = new HashMap<>();
        for (JsonNode m : matches) {
            for (String side : new String[]{"homeTeam", "awayTeam"}) {
                JsonNode t = m.path(side);
                long fd = t.path("id").asLong();
                if (fd == 0 || teamByFd.containsKey(fd)) continue;
                CompetitionTeam ct = new CompetitionTeam();
                ct.setCompetitionId(c.getId());
                ct.setName(t.path("name").asText("Team"));
                ct.setShortName(t.path("tla").asText(""));
                ct.setCrestUrl(t.path("crest").isMissingNode() ? null : t.path("crest").asText(null));
                ct.setCrest("⚽");
                ct.setSport("Football");
                teamByFd.put(fd, teamRepo.save(ct));
            }
        }

        int imported = 0, played = 0;
        for (JsonNode m : matches) {
            CompetitionTeam home = teamByFd.get(m.path("homeTeam").path("id").asLong());
            CompetitionTeam away = teamByFd.get(m.path("awayTeam").path("id").asLong());
            if (home == null || away == null) continue;
            JsonNode ft = m.path("score").path("fullTime");
            boolean isPlayed = "FINISHED".equals(m.path("status").asText(""));
            CompetitionFixture f = new CompetitionFixture();
            f.setCompetitionId(c.getId());
            f.setHomeTeamId(home.getId());
            f.setAwayTeamId(away.getId());
            f.setHomeName(home.getName());
            f.setAwayName(away.getName());
            f.setHomeScore(intOrNull(ft.path("home")));
            f.setAwayScore(intOrNull(ft.path("away")));
            f.setPlayed(isPlayed);
            f.setRound(m.path("stage").asText(""));
            f.setGroupName(m.path("group").isNull() ? null : m.path("group").asText(null));
            f.setMatchday(intOrNull(m.path("matchday")));
            fixtureRepo.save(f);
            imported++;
            if (isPlayed) played++;
        }

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("competitionId", c.getId());
        out.put("name", compName);
        out.put("season", season);
        out.put("teams", teamByFd.size());
        out.put("fixtures", imported);
        out.put("played", played);
        return out;
    }

    @GetMapping("/{id}")
    public Map<String, Object> detail(@PathVariable Long id) {
        Competition c = competitionRepo.findById(id).orElseThrow();
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("competition", c);
        m.put("teams", teamRepo.findByCompetitionId(id));
        m.put("fixtures", fixtureRepo.findByCompetitionId(id));
        return m;
    }

    @PostMapping
    @Transactional
    public Map<String, Object> create(@RequestBody CreateReq req) {
        Competition c = new Competition();
        c.setName(req.name());
        c.setSeason(req.season());
        c.setType(req.type() != null ? req.type() : "LEAGUE");
        c.setRounds(req.rounds() != null ? req.rounds() : 2);
        c = competitionRepo.save(c);

        List<CompetitionTeam> saved = new ArrayList<>();
        if (req.teams() != null) {
            for (TeamReq t : req.teams()) {
                CompetitionTeam ct = new CompetitionTeam();
                ct.setCompetitionId(c.getId());
                ct.setName(t.name());
                ct.setShortName(t.shortName());
                ct.setCrestUrl(t.crestUrl());
                ct.setCrest(t.crest());
                ct.setSport(t.sport());
                saved.add(teamRepo.save(ct));
            }
        }

        // LEAGUE → full round-robin: each unordered pair meets `rounds` times,
        // home/away reversed on alternate rounds.
        if ("LEAGUE".equalsIgnoreCase(c.getType()) && saved.size() >= 2) {
            int rounds = c.getRounds();
            int matchday = 1;
            for (int r = 0; r < rounds; r++) {
                for (int i = 0; i < saved.size(); i++) {
                    for (int j = i + 1; j < saved.size(); j++) {
                        CompetitionTeam a = saved.get(i), b = saved.get(j);
                        CompetitionTeam home = (r % 2 == 0) ? a : b;
                        CompetitionTeam away = (r % 2 == 0) ? b : a;
                        CompetitionFixture f = new CompetitionFixture();
                        f.setCompetitionId(c.getId());
                        f.setHomeTeamId(home.getId());
                        f.setAwayTeamId(away.getId());
                        f.setHomeName(home.getName());
                        f.setAwayName(away.getName());
                        f.setPlayed(false);
                        f.setRound("");
                        f.setMatchday(matchday++);
                        fixtureRepo.save(f);
                    }
                }
            }
        }
        return detail(c.getId());
    }

    /** Add a one-off fixture (knockout cups / manual). */
    @PostMapping("/{id}/fixtures")
    public CompetitionFixture addFixture(@PathVariable Long id, @RequestBody FixtureReq req) {
        CompetitionFixture f = new CompetitionFixture();
        f.setCompetitionId(id);
        if (req.homeTeamId() != null) {
            teamRepo.findById(req.homeTeamId()).ifPresent(t -> { f.setHomeTeamId(t.getId()); f.setHomeName(t.getName()); });
        }
        if (req.awayTeamId() != null) {
            teamRepo.findById(req.awayTeamId()).ifPresent(t -> { f.setAwayTeamId(t.getId()); f.setAwayName(t.getName()); });
        }
        f.setPlayed(false);
        f.setRound(req.round());
        f.setGroupName(req.groupName());
        f.setMatchday(req.matchday());
        return fixtureRepo.save(f);
    }

    /** Add many fixtures at once (knockout brackets / CL league phase). */
    @PostMapping("/{id}/fixtures/bulk")
    @Transactional
    public List<CompetitionFixture> addFixtures(@PathVariable Long id, @RequestBody BulkFixtureReq req) {
        List<CompetitionFixture> out = new ArrayList<>();
        if (req.fixtures() != null) {
            for (FixtureReq r : req.fixtures()) {
                CompetitionFixture f = new CompetitionFixture();
                f.setCompetitionId(id);
                if (r.homeTeamId() != null) teamRepo.findById(r.homeTeamId()).ifPresent(t -> { f.setHomeTeamId(t.getId()); f.setHomeName(t.getName()); });
                if (r.awayTeamId() != null) teamRepo.findById(r.awayTeamId()).ifPresent(t -> { f.setAwayTeamId(t.getId()); f.setAwayName(t.getName()); });
                f.setPlayed(false);
                f.setRound(r.round());
                f.setGroupName(r.groupName());
                f.setMatchday(r.matchday());
                out.add(fixtureRepo.save(f));
            }
        }
        return out;
    }

    /** Record the result of an existing fixture. */
    @PutMapping("/{id}/fixtures/{fid}")
    public CompetitionFixture recordResult(@PathVariable Long fid, @RequestBody ResultReq req) {
        CompetitionFixture f = fixtureRepo.findById(fid).orElseThrow();
        f.setHomeScore(req.homeScore());
        f.setAwayScore(req.awayScore());
        f.setPlayed(req.homeScore() != null && req.awayScore() != null);
        // Use the user-supplied match date when given (accepts "YYYY-MM-DD" or full ISO).
        LocalDateTime when = LocalDateTime.now();
        if (req.playedAt() != null && !req.playedAt().isBlank()) {
            try {
                String s = req.playedAt().trim();
                when = LocalDateTime.parse(s.length() == 10 ? s + "T00:00:00" : s);
            } catch (Exception ignore) { /* keep now() */ }
        }
        f.setPlayedAt(when);
        return fixtureRepo.save(f);
    }

    @DeleteMapping("/{id}/fixtures/{fid}")
    public void deleteFixture(@PathVariable Long fid) {
        fixtureRepo.deleteById(fid);
    }

    @DeleteMapping("/{id}")
    @Transactional
    public void delete(@PathVariable Long id) {
        fixtureRepo.deleteByCompetitionId(id);
        teamRepo.deleteByCompetitionId(id);
        competitionRepo.deleteById(id);
    }
}
