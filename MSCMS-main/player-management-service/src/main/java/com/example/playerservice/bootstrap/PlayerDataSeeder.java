package com.example.playerservice.bootstrap;

import com.example.playerservice.model.entity.OuterPlayer;
import com.example.playerservice.model.entity.OuterTeam;
import com.example.playerservice.model.entity.PlayerCallUpRequest;
import com.example.playerservice.model.entity.PlayerContract;
import com.example.playerservice.model.entity.PlayerTransferIncoming;
import com.example.playerservice.model.entity.PlayerTransferOutgoing;
import com.example.playerservice.model.entity.Roster;
import com.example.playerservice.model.entity.Sport;
import com.example.playerservice.model.entity.Team;
import com.example.playerservice.model.enums.Position;
import com.example.playerservice.model.enums.RequestStatus;
import com.example.playerservice.model.enums.SportType;
import com.example.playerservice.repository.OuterPlayerRepository;
import com.example.playerservice.repository.OuterTeamRepository;
import com.example.playerservice.repository.PlayerCallUpRequestRepository;
import com.example.playerservice.repository.PlayerContractRepository;
import com.example.playerservice.repository.PlayerTransferIncomingRepository;
import com.example.playerservice.repository.PlayerTransferOutgoingRepository;
import com.example.playerservice.repository.RosterRepository;
import com.example.playerservice.repository.SportRepository;
import com.example.playerservice.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.seed.enabled", havingValue = "true")
public class PlayerDataSeeder implements CommandLineRunner {

    private final SportRepository sportRepository;
    private final TeamRepository teamRepository;
    private final RosterRepository rosterRepository;
    private final PlayerContractRepository contractRepository;
    private final OuterTeamRepository outerTeamRepository;
    private final OuterPlayerRepository outerPlayerRepository;
    private final PlayerTransferIncomingRepository transferIncomingRepository;
    private final PlayerTransferOutgoingRepository transferOutgoingRepository;
    private final PlayerCallUpRequestRepository callUpRepository;

    @Override
    @Transactional
    public void run(String... args) {
        // Per-section idempotent seeding. A previous version used a single
        // whole-method guard on sportRepository.count(); that meant adding
        // a new section (transfers, callups) to the seeder couldn't reach
        // the DB unless the volume was wiped. Now each section guards on
        // its own table count and falls back to fetch-by-id when an earlier
        // section was already seeded in a previous run.
        log.info("[SEED] Seeding player-management-service (per-table idempotent)...");

        Team teamFb;
        Team teamBb;
        Team teamTn;
        Team teamHb;

        // ─── Base: sports, teams, rosters, contracts ────────────────────────
        if (sportRepository.count() == 0) {
            Sport football   = saveSport("Football",   SportType.FOOTBALL,   SeedIds.SPORT_MANAGER);
            Sport basketball = saveSport("Basketball", SportType.BASKETBALL, SeedIds.SPORT_MANAGER);
            Sport tennis     = saveSport("Tennis",     SportType.TENNIS,     SeedIds.SPORT_MANAGER);
            Sport volleyball = saveSport("Volleyball", SportType.VOLLEYBALL, SeedIds.SPORT_MANAGER);
            Sport swimming   = saveSport("Swimming",   SportType.SWIMMING,   SeedIds.SPORT_MANAGER);
            Sport handball   = saveSport("Handball",   SportType.HANDBALL,   SeedIds.SPORT_MANAGER);

            teamFb = saveTeam("FC Barcelona",           "Spain", football);
            teamBb = saveTeam("FC Barcelona Bàsquet",  "Spain", basketball);
            teamTn = saveTeam("Barça Tennis Academy",  "Spain", tennis);
            Team teamVb = saveTeam("CV Barcelona",           "Spain", volleyball);
            teamHb = saveTeam("FC Barcelona Handbol",  "Spain", handball);

            // ─── Second / reserve teams (ids 6,7,8 — no Tennis B) ───────────
            Team teamFbB = saveTeam("FC Barcelona Atlètic",    "Spain", football);   // id 6
            Team teamBbB = saveTeam("FC Barcelona Bàsquet B",  "Spain", basketball); // id 7
            Team teamHbB = saveTeam("FC Barcelona Handbol B",  "Spain", handball);   // id 8

            String season = "2024/25";
            saveRoster(SeedIds.PLAYER_1_ID,  teamFb, season);
            saveRoster(SeedIds.PLAYER_2_ID,  teamFb, season);
            saveRoster(SeedIds.PLAYER_3_ID,  teamFb, season);
            saveRoster(SeedIds.PLAYER_4_ID,  teamFb, season);
            saveRoster(SeedIds.PLAYER_5_ID,  teamBb, season);
            saveRoster(SeedIds.PLAYER_6_ID,  teamTn, season);
            // Handball squad → FC Barcelona Handbol (team id 5)
            saveRoster(SeedIds.PLAYER_7_ID,  teamHb, season);
            saveRoster(SeedIds.PLAYER_8_ID,  teamHb, season);
            saveRoster(SeedIds.PLAYER_9_ID,  teamHb, season);
            saveRoster(SeedIds.PLAYER_10_ID, teamHb, season);

            LocalDate start = LocalDate.of(2024, 7, 1);
            LocalDate end   = LocalDate.of(2027, 6, 30);
            saveContract(SeedIds.PLAYER_1_STRIKER,   start, end,  9_500_000L, 120_000_000L);
            saveContract(SeedIds.PLAYER_2_MID,       start, end,  2_800_000L,  30_000_000L);
            saveContract(SeedIds.PLAYER_3_DEF,       start, end,  1_600_000L,  18_000_000L);
            saveContract(SeedIds.PLAYER_4_GK,        start, end,  1_300_000L,  15_000_000L);
            saveContract(SeedIds.PLAYER_5_BBALL,     start, end,    700_000L,   6_000_000L);
            saveContract(SeedIds.PLAYER_6_TENNIS,    start, end,    420_000L,   4_500_000L);
            saveContract(SeedIds.PLAYER_7_HB_BACK,   start, end,    380_000L,   3_500_000L);
            saveContract(SeedIds.PLAYER_8_HB_CB,     start, end,    420_000L,   4_000_000L);
            saveContract(SeedIds.PLAYER_9_HB_WING,   start, end,    340_000L,   3_000_000L);
            saveContract(SeedIds.PLAYER_10_HB_PIVOT, start, end,    360_000L,   3_200_000L);

            // ─── Extended FC Barcelona football squad (rosters 11..26) ──────
            saveRoster(SeedIds.PLAYER_11_ID, teamFb, season);
            saveRoster(SeedIds.PLAYER_12_ID, teamFb, season);
            saveRoster(SeedIds.PLAYER_13_ID, teamFb, season);
            saveRoster(SeedIds.PLAYER_14_ID, teamFb, season);
            saveRoster(SeedIds.PLAYER_15_ID, teamFb, season);
            saveRoster(SeedIds.PLAYER_16_ID, teamFb, season);
            saveRoster(SeedIds.PLAYER_17_ID, teamFb, season);
            saveRoster(SeedIds.PLAYER_18_ID, teamFb, season);
            saveRoster(SeedIds.PLAYER_19_ID, teamFb, season);
            saveRoster(SeedIds.PLAYER_20_ID, teamFb, season);
            saveRoster(SeedIds.PLAYER_21_ID, teamFb, season);
            saveRoster(SeedIds.PLAYER_22_ID, teamFb, season);
            saveRoster(SeedIds.PLAYER_23_ID, teamFb, season);
            saveRoster(SeedIds.PLAYER_24_ID, teamFb, season);
            saveRoster(SeedIds.PLAYER_25_ID, teamFb, season);
            saveRoster(SeedIds.PLAYER_26_ID, teamFb, season);

            // contracts 11..26 (align with user-mgmt Player.contractId)
            saveContract(SeedIds.PLAYER_11_GK,  start, end,  1_200_000L,   8_000_000L);
            saveContract(SeedIds.PLAYER_12_CB,  start, end,  6_000_000L,  18_000_000L);
            saveContract(SeedIds.PLAYER_13_CB,  start, end,  3_500_000L,  60_000_000L);
            saveContract(SeedIds.PLAYER_14_RB,  start, end,  8_000_000L,  60_000_000L);
            saveContract(SeedIds.PLAYER_15_LB,  start, end,  5_000_000L,  50_000_000L);
            saveContract(SeedIds.PLAYER_16_RB,  start, end,  4_000_000L,   4_000_000L);
            saveContract(SeedIds.PLAYER_17_CM,  start, end,  9_000_000L,  70_000_000L);
            saveContract(SeedIds.PLAYER_18_CM,  start, end,  7_000_000L,  90_000_000L);
            saveContract(SeedIds.PLAYER_19_CM,  start, end,  8_500_000L,  15_000_000L);
            saveContract(SeedIds.PLAYER_20_CDM, start, end,  3_000_000L,   5_000_000L);
            saveContract(SeedIds.PLAYER_21_CM,  start, end,  4_500_000L,  30_000_000L);
            saveContract(SeedIds.PLAYER_22_RW,  start, end, 12_000_000L, 180_000_000L);
            saveContract(SeedIds.PLAYER_23_RW,  start, end,  9_000_000L,  60_000_000L);
            saveContract(SeedIds.PLAYER_24_LW,  start, end,  6_500_000L,  30_000_000L);
            saveContract(SeedIds.PLAYER_25_LW,  start, end,  5_500_000L,  20_000_000L);
            saveContract(SeedIds.PLAYER_26_ST,  start, end,  5_000_000L,  30_000_000L);

            // ─── Full Basketball squad → FC Barcelona Bàsquet (team 2) ──────
            saveRoster(SeedIds.BB_VESELY_ID,       teamBb, season);
            saveRoster(SeedIds.BB_HERNANGOMEZ_ID,  teamBb, season);
            saveRoster(SeedIds.BB_SHENGELIA_ID,    teamBb, season);
            saveRoster(SeedIds.BB_PARKER_ID,       teamBb, season);
            saveRoster(SeedIds.BB_ABRINES_ID,      teamBb, season);
            saveRoster(SeedIds.BB_BRIZUELA_ID,     teamBb, season);
            saveRoster(SeedIds.BB_PUNTER_ID,       teamBb, season);
            saveRoster(SeedIds.BB_LAPROVITTOLA_ID, teamBb, season);
            saveRoster(SeedIds.BB_JOKUBAITIS_ID,   teamBb, season);
            // ─── Full Handball squad → FC Barcelona Handbol (team 5) ────────
            saveRoster(SeedIds.HB_PDV_ID,          teamHb, season);
            saveRoster(SeedIds.HB_NIELSEN_ID,      teamHb, season);
            saveRoster(SeedIds.HB_RICHARDSON_ID,   teamHb, season);
            saveRoster(SeedIds.HB_CINDRIC_ID,      teamHb, season);
            saveRoster(SeedIds.HB_NGUESSAN_ID,     teamHb, season);
            saveRoster(SeedIds.HB_JANC_ID,         teamHb, season);
            saveRoster(SeedIds.HB_URDANGARIN_ID,   teamHb, season);

            // contracts 27..42 (align with user-mgmt Player.contractId)
            saveContract(SeedIds.BB_VESELY,       start, end, 2_500_000L,  3_000_000L);
            saveContract(SeedIds.BB_HERNANGOMEZ,  start, end, 2_800_000L,  4_000_000L);
            saveContract(SeedIds.BB_SHENGELIA,    start, end, 2_600_000L,  3_500_000L);
            saveContract(SeedIds.BB_PARKER,       start, end, 2_400_000L,  3_000_000L);
            saveContract(SeedIds.BB_ABRINES,      start, end, 1_800_000L,  2_000_000L);
            saveContract(SeedIds.BB_BRIZUELA,     start, end, 1_900_000L,  2_500_000L);
            saveContract(SeedIds.BB_PUNTER,       start, end, 2_400_000L,  3_000_000L);
            saveContract(SeedIds.BB_LAPROVITTOLA, start, end, 2_000_000L,  2_500_000L);
            saveContract(SeedIds.BB_JOKUBAITIS,   start, end, 2_600_000L,  5_000_000L);
            saveContract(SeedIds.HB_PDV,          start, end,   900_000L,  1_200_000L);
            saveContract(SeedIds.HB_NIELSEN,      start, end, 1_000_000L,  1_500_000L);
            saveContract(SeedIds.HB_RICHARDSON,   start, end,   950_000L,  1_400_000L);
            saveContract(SeedIds.HB_CINDRIC,      start, end,   900_000L,  1_300_000L);
            saveContract(SeedIds.HB_NGUESSAN,     start, end,   850_000L,  1_100_000L);
            saveContract(SeedIds.HB_JANC,         start, end,   900_000L,  1_300_000L);
            saveContract(SeedIds.HB_URDANGARIN,   start, end,   450_000L,    600_000L);

            // ─── Tennis squad → Barça Tennis Academy (team 3) ───────────────
            saveRoster(SeedIds.TN_ALCARAZ_ID,  teamTn, season);
            saveRoster(SeedIds.TN_NADAL_ID,    teamTn, season);
            saveRoster(SeedIds.TN_BADOSA_ID,   teamTn, season);
            saveRoster(SeedIds.TN_MUGURUZA_ID, teamTn, season);
            saveRoster(SeedIds.TN_CARRENO_ID,  teamTn, season);
            saveRoster(SeedIds.TN_BAUTISTA_ID, teamTn, season);
            saveContract(SeedIds.TN_ALCARAZ,  start, end, 8_000_000L, 30_000_000L);
            saveContract(SeedIds.TN_NADAL,    start, end, 4_000_000L,  5_000_000L);
            saveContract(SeedIds.TN_BADOSA,   start, end, 3_000_000L,  6_000_000L);
            saveContract(SeedIds.TN_MUGURUZA, start, end, 2_500_000L,  4_000_000L);
            saveContract(SeedIds.TN_CARRENO,  start, end, 2_000_000L,  3_000_000L);
            saveContract(SeedIds.TN_BAUTISTA, start, end, 2_200_000L,  3_500_000L);

            // ─── Second-team rosters (reserve squads → teams 6,7,8) ─────────
            // FC Barcelona Atlètic (football B)
            saveRoster(SeedIds.FBB_KOCHEN_ID, teamFbB, season);
            saveRoster(SeedIds.FBB_FORT_ID,   teamFbB, season);
            saveRoster(SeedIds.FBB_CUENCA_ID, teamFbB, season);
            saveRoster(SeedIds.FBB_FAYE_ID,   teamFbB, season);
            saveRoster(SeedIds.FBB_MARTIN_ID, teamFbB, season);
            saveRoster(SeedIds.FBB_BERNAL_ID, teamFbB, season);
            saveRoster(SeedIds.FBB_PRIM_ID,   teamFbB, season);
            saveRoster(SeedIds.FBB_UNAI_ID,   teamFbB, season);
            saveRoster(SeedIds.FBB_TONI_ID,   teamFbB, season);
            saveRoster(SeedIds.FBB_DANI_ID,   teamFbB, season);
            saveRoster(SeedIds.FBB_VICTOR_ID, teamFbB, season);
            // FC Barcelona Bàsquet B
            saveRoster(SeedIds.BBB_MOLINS_ID,  teamBbB, season);
            saveRoster(SeedIds.BBB_MARA_ID,    teamBbB, season);
            saveRoster(SeedIds.BBB_CANO_ID,    teamBbB, season);
            saveRoster(SeedIds.BBB_KEITA_ID,   teamBbB, season);
            saveRoster(SeedIds.BBB_HALPIN_ID,  teamBbB, season);
            saveRoster(SeedIds.BBB_ESPINET_ID, teamBbB, season);
            // FC Barcelona Handbol B
            saveRoster(SeedIds.HBB_MESTRE_ID,   teamHbB, season);
            saveRoster(SeedIds.HBB_VALERA_ID,   teamHbB, season);
            saveRoster(SeedIds.HBB_GURRI_ID,    teamHbB, season);
            saveRoster(SeedIds.HBB_REY_ID,      teamHbB, season);
            saveRoster(SeedIds.HBB_BARRUFET_ID, teamHbB, season);
            saveRoster(SeedIds.HBB_CANELLAS_ID, teamHbB, season);
            saveRoster(SeedIds.HBB_RIBAS_ID,    teamHbB, season);
        } else {
            // Base section already seeded — fetch the team handles we'll need
            // for the later sections. Insert order is deterministic so the IDs
            // are stable: 1=FB, 2=BB, 3=Tennis, 4=Volleyball, 5=Handbol.
            teamFb = teamRepository.findById(1L).orElseThrow(() ->
                new IllegalStateException("Expected Team id=1 (FC Barcelona) after base seed"));
            teamBb = teamRepository.findById(2L).orElseThrow(() ->
                new IllegalStateException("Expected Team id=2 (FCB Bàsquet)"));
            teamTn = teamRepository.findById(3L).orElseThrow(() ->
                new IllegalStateException("Expected Team id=3 (Tennis Academy)"));
            teamHb = teamRepository.findById(5L).orElseThrow(() ->
                new IllegalStateException("Expected Team id=5 (FCB Handbol)"));
        }

        // ─── Outer teams + outer players (scouting prospects) ───────────────
        OuterTeam realMadrid;
        OuterTeam atletico;
        OuterTeam sevilla;
        OuterTeam rmBaloncesto;
        OuterPlayer prospect1;
        OuterPlayer prospect3;

        if (outerTeamRepository.count() == 0) {
            realMadrid   = saveOuterTeam("Real Madrid CF",          "info@realmadrid.com",    "Spain");
            atletico     = saveOuterTeam("Atlético de Madrid",      "info@atletico.es",       "Spain");
            sevilla      = saveOuterTeam("Sevilla FC",              "info@sevillafc.es",      "Spain");
            rmBaloncesto = saveOuterTeam("Real Madrid Baloncesto",  "info@rmbaloncesto.es",   "Spain");

            prospect1 = saveOuterPlayer(LocalDate.of(2003, 2, 5),  "English",      Position.STRIKER,       95_000_000L, 9,  realMadrid);
            OuterPlayer prospect2 = saveOuterPlayer(LocalDate.of(2001, 6, 12), "Argentinian",  Position.ATTACKING_MID, 110_000_000L, 10, atletico);
            prospect3 = saveOuterPlayer(LocalDate.of(2002, 9, 28), "Spanish",      Position.LEFT_WING,     60_000_000L,  7,  sevilla);
            OuterPlayer prospect4 = saveOuterPlayer(LocalDate.of(1999, 11, 4), "Slovenian",    Position.POINT_GUARD,   25_000_000L,  77, rmBaloncesto);
        } else {
            realMadrid   = outerTeamRepository.findById(1L).orElse(null);
            atletico     = outerTeamRepository.findById(2L).orElse(null);
            sevilla      = outerTeamRepository.findById(3L).orElse(null);
            rmBaloncesto = outerTeamRepository.findById(4L).orElse(null);
            prospect1    = outerPlayerRepository.findById(1L).orElse(null);
            prospect3    = outerPlayerRepository.findById(3L).orElse(null);
        }

        // ─── Player transfers (incoming requests) ───────────────────────────
        if (transferIncomingRepository.count() == 0 && prospect1 != null && prospect3 != null && realMadrid != null && sevilla != null) {
            saveIncomingTransfer(prospect1, realMadrid, teamFb, RequestStatus.PENDING,  LocalDate.now().minusDays(8));
            saveIncomingTransfer(prospect3, sevilla,    teamFb, RequestStatus.ACCEPTED, LocalDate.now().minusDays(20));
        }

        // ─── Player transfers (outgoing requests) ───────────────────────────
        if (transferOutgoingRepository.count() == 0 && sevilla != null && rmBaloncesto != null) {
            saveOutgoingTransfer(SeedIds.PLAYER_6_TENNIS, teamTn, sevilla, RequestStatus.PENDING,  LocalDate.now().minusDays(3));
            saveOutgoingTransfer(SeedIds.PLAYER_5_BBALL,  teamBb, rmBaloncesto, RequestStatus.DECLINED, LocalDate.now().minusDays(15));
        }

        // ─── National team call-ups (flat — no entity refs needed) ──────────
        if (callUpRepository.count() == 0) {
            saveCallUp(SeedIds.PLAYER_2_MID, "00000000-0000-0000-0000-000000000200", RequestStatus.ACCEPTED, LocalDate.now().minusDays(10));
            saveCallUp(SeedIds.PLAYER_3_DEF, "00000000-0000-0000-0000-000000000201", RequestStatus.PENDING,  LocalDate.now().minusDays(2));
        }

        log.info("[SEED] player-management seeded: sports={}, teams={}, rosters={}, contracts={}, outerPlayers={}, incomingTransfers={}, outgoingTransfers={}, callUps={}",
                sportRepository.count(), teamRepository.count(),
                rosterRepository.count(), contractRepository.count(),
                outerPlayerRepository.count(), transferIncomingRepository.count(),
                transferOutgoingRepository.count(), callUpRepository.count());
    }

    private Sport saveSport(String name, SportType type, String sportManagerKeycloakId) {
        Sport s = new Sport();
        s.setName(name);
        s.setSportType(type);
        // sportManagerId expects a Long FK — keep null since user-mgmt PK isn't deterministic here.
        // The sport manager's Keycloak identity is the durable link.
        s.setSportManagerId(null);
        return sportRepository.save(s);
    }

    private Team saveTeam(String name, String country, Sport sport) {
        Team t = new Team();
        t.setName(name);
        t.setCountry(country);
        t.setSport(sport);
        return teamRepository.save(t);
    }

    private Roster saveRoster(long playerId, Team team, String season) {
        Roster r = new Roster();
        r.setPlayerId(playerId);
        r.setSeason(season);
        r.setTeam(team);
        return rosterRepository.save(r);
    }

    private PlayerContract saveContract(String playerKeycloakId, LocalDate start, LocalDate end,
                                        long salary, long releaseClause) {
        PlayerContract c = new PlayerContract();
        c.setPlayerKeycloakId(playerKeycloakId);
        c.setStartDate(start);
        c.setEndDate(end);
        c.setSalary(salary);
        c.setReleaseClause(releaseClause);
        return contractRepository.save(c);
    }

    private OuterTeam saveOuterTeam(String name, String email, String country) {
        OuterTeam t = new OuterTeam();
        t.setName(name);
        t.setEmail(email);
        t.setCountry(country);
        return outerTeamRepository.save(t);
    }

    private OuterPlayer saveOuterPlayer(LocalDate dob, String nationality, Position position,
                                        long marketValue, int kit, OuterTeam team) {
        OuterPlayer p = new OuterPlayer();
        p.setDateOfBirth(dob);
        p.setNationality(nationality);
        p.setPreferredPosition(position);
        p.setMarketValue(marketValue);
        p.setKitNumber(kit);
        p.setOuterTeam(team);
        return outerPlayerRepository.save(p);
    }

    private PlayerTransferIncoming saveIncomingTransfer(OuterPlayer outerPlayer, OuterTeam from, Team to,
                                                       RequestStatus status, LocalDate requestDate) {
        PlayerTransferIncoming t = new PlayerTransferIncoming();
        t.setOuterPlayer(outerPlayer);
        t.setFromTeam(from);
        t.setToTeam(to);
        t.setStatus(status);
        t.setRequestDate(requestDate);
        return transferIncomingRepository.save(t);
    }

    private PlayerTransferOutgoing saveOutgoingTransfer(String playerKc, Team from, OuterTeam to,
                                                       RequestStatus status, LocalDate requestDate) {
        PlayerTransferOutgoing t = new PlayerTransferOutgoing();
        t.setPlayerKeycloakId(playerKc);
        t.setFromTeam(from);
        t.setToTeam(to);
        t.setStatus(status);
        t.setRequestDate(requestDate);
        return transferOutgoingRepository.save(t);
    }

    private PlayerCallUpRequest saveCallUp(String playerKc, String nationalTeamKc,
                                          RequestStatus status, LocalDate requestDate) {
        PlayerCallUpRequest c = new PlayerCallUpRequest();
        c.setPlayerKeycloakId(playerKc);
        c.setNationalTeamKeycloakId(nationalTeamKc);
        c.setStatus(status);
        c.setRequestDate(requestDate);
        return callUpRepository.save(c);
    }
}
